
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	getRequest(context: ExecutionContext) {
		const ctx = context.switchToHttp();
		const request = ctx.getRequest();

		// 1. Tenta pegar o token do cookie (web)
		if (request.cookies && request.cookies['jwt']) {
			request.headers.authorization = `Bearer ${request.cookies['jwt']}`;
			return request;
		}

		// 2. Tenta pegar do header Authorization (mobile)
		const authHeader = request.headers['authorization'] || request.headers['Authorization'];
		if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
			return request;
		}

		throw new UnauthorizedException('JWT token not found in cookie or Authorization header');
	}
}
