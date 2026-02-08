import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { UsersService } from 'src/modules/users/users.service';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import type { User } from 'generated/prisma';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        // 1. Tenta pegar do header Authorization (Bearer)
        const authHeader = req?.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          return authHeader.replace('Bearer ', '');
        }
        // 2. Fallback: tenta pegar dos cookies
        if (req?.cookies) {
          return req.cookies['Authorization'] || req.cookies['access_token'] || null;
        }
        return null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || '',
    });
  }

  async validate(payload: {
    sub: number | string;
    email: string;
    role: string;
  }): Promise<Omit<User, 'password'>> {
    // Garante que sub é number
    const userId = typeof payload.sub === 'string' ? parseInt(payload.sub, 10) : payload.sub;
    const user = await this.usersService.findById(String(userId));

    if (!user) {
      throw new UnauthorizedException('Token inválido ou usuário não encontrado');
    }

    // Remove senha do retorno
    const { password, ...result } = user;
    return result;
  }
}
