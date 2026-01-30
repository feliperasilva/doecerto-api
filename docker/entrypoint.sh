#!/bin/sh
set -e

log_info() { echo "[INFO] $1"; }
log_success() { echo "[SUCCESS] $1"; }
log_warning() { echo "[WARNING] $1"; }
log_error() { echo "[ERROR] $1"; }

handle_signal() {
    log_warning "Received shutdown signal. Shutting down gracefully..."
    sleep 2
    
    if [ ! -z "$APP_PID" ]; then
        kill -TERM "$APP_PID" 2>/dev/null || true
        
        TIMEOUT=30
        while kill -0 "$APP_PID" 2>/dev/null && [ $TIMEOUT -gt 0 ]; do
            sleep 1
            TIMEOUT=$((TIMEOUT - 1))
        done
        
        if kill -0 "$APP_PID" 2>/dev/null; then
            log_warning "Forcing shutdown..."
            kill -9 "$APP_PID" 2>/dev/null || true
        fi
    fi
    
    log_success "Application stopped"
    exit 0
}

trap handle_signal SIGTERM SIGINT EXIT

log_info "Starting DoeCerto API..."
log_info "Environment: ${NODE_ENV:-production}"
log_info "Port: ${PORT:-3000}"
log_info "Timezone: ${TZ:-UTC}"

log_info "Validating environment..."

if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL not set!"
    exit 1
fi

export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}

log_success "Environment validation passed"

log_info "Waiting for database to be ready..."

MAX_RETRIES=60
RETRY_COUNT=0
RETRY_DELAY=2

until npx prisma migrate status > /dev/null 2>&1 || [ $? -eq 1 ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    
    if [ $RETRY_COUNT -gt $MAX_RETRIES ]; then
        log_error "Database connection failed after $((MAX_RETRIES * RETRY_DELAY))s"
        exit 1
    fi
    
    ELAPSED=$((RETRY_COUNT * RETRY_DELAY))
    log_warning "Database unavailable - attempt $RETRY_COUNT/$MAX_RETRIES (${ELAPSED}s)"
    sleep $RETRY_DELAY
done

log_success "Database connection successful"

log_info "Running database migrations..."

MIGRATE_OUTPUT=$(npx prisma migrate deploy 2>&1) || MIGRATE_FAILED=1

if [ ! -z "$MIGRATE_FAILED" ]; then
    if echo "$MIGRATE_OUTPUT" | grep -q "P3005"; then
        log_warning "Database schema exists. Performing baseline..."
        
        if [ ! -d "prisma/migrations" ]; then
            log_error "No migrations directory found"
            exit 1
        fi
        
        MIGRATION_COUNT=0
        BASELINE_SUCCESS=0
        
        for migration_dir in prisma/migrations/*/; do
            if [ -d "$migration_dir" ]; then
                migration_name=$(basename "$migration_dir")
                
                if [ "$migration_name" != "migration_lock.toml" ] && [ -f "${migration_dir}migration.sql" ]; then
                    log_info "Baseline: $migration_name"
                    
                    if npx prisma migrate resolve --applied "$migration_name" > /dev/null 2>&1; then
                        BASELINE_SUCCESS=$((BASELINE_SUCCESS + 1))
                    fi
                    
                    MIGRATION_COUNT=$((MIGRATION_COUNT + 1))
                fi
            fi
        done
        
        if [ $MIGRATION_COUNT -eq 0 ]; then
            log_error "No valid migrations found"
            exit 1
        fi
        
        log_success "Baseline: $BASELINE_SUCCESS/$MIGRATION_COUNT migrations applied"
        
        log_info "Retrying migration deploy..."
        npx prisma migrate deploy > /dev/null 2>&1 || log_warning "No new migrations"
    else
        log_error "Migration failed:"
        echo "$MIGRATE_OUTPUT"
        exit 1
    fi
else
    log_success "Database migrations completed"
fi

if [ "$RUN_SEED" = "true" ] || [ "$RUN_SEED" = "1" ]; then
    log_info "Seeding database..."
    
    if npx prisma db seed > /dev/null 2>&1; then
        log_success "Database seeded"
    else
        log_warning "Seed failed or not configured"
    fi
fi

log_info "Verifying application files..."

if [ ! -f "./dist/main.js" ]; then
    log_error "Application build not found at ./dist/main.js"
    exit 1
fi

if [ ! -d "./node_modules" ]; then
    log_error "node_modules directory not found"
    exit 1
fi

log_success "All files verified"

log_info "=========================================="
log_success "DoeCerto API is starting..."
log_info "=========================================="

node dist/main.js &
APP_PID=$!

log_info "Application PID: $APP_PID"

wait $APP_PID
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    log_error "Application exited with code $EXIT_CODE"
fi

exit $EXIT_CODE