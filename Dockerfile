FROM node:20-alpine AS builder

LABEL maintainer="DoeCerto Team"
LABEL stage="builder"

RUN apk add --no-cache libc6-compat openssl python3 make g++

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

RUN npm prune --omit=dev && \
    npm cache clean --force

FROM node:20-alpine AS production

LABEL maintainer="DoeCerto Team"
LABEL version="1.0.0"
LABEL description="DoeCerto API - Backend para plataforma de doações"

RUN apk add --no-cache \
    dumb-init \
    curl \
    openssl \
    libc6-compat \
    tzdata

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

RUN mkdir -p /app/uploads/profiles /app/uploads/payment-proofs /app/logs && \
    chown -R nodejs:nodejs /app/uploads /app/logs

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/generated ./generated

COPY --chown=nodejs:nodejs docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENV NODE_ENV=production \
    PORT=3000 \
    TZ=America/Sao_Paulo \
    NODE_OPTIONS="--max-old-space-size=2048"

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["/usr/local/bin/entrypoint.sh"]