
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	getRequest(context: ExecutionContext) {
		const ctx = context.switchToHttp();
		const request = ctx.getRequest();

		// 1. Tenta pegar do header Authorization (Bearer)
		const authHeader = request.headers['authorization'] || request.headers['Authorization'];
		if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
			return request;
		}

		// 2. Fallback: tenta pegar dos cookies (jwt, access_token, Authorization)
		if (request.cookies) {
			const cookieToken = request.cookies['jwt'] || request.cookies['access_token'] || request.cookies['Authorization'];
			if (cookieToken) {
				request.headers.authorization = `Bearer ${cookieToken}`;
				return request;
			}
		}

		throw new UnauthorizedException('JWT token not found in Authorization header or cookies');
	}
}
