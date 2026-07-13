import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { readAuthCookie } from '../auth/auth-cookie';
import { AuthUser } from '../types/auth-user.type';

type RequestWithUser = Request & {
  user?: AuthUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { fromCookie, token } = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }

    if (fromCookie) {
      this.ensureCookieRequestIsTrusted(request);
    }

    let user: AuthUser;

    try {
      user = await this.jwtService.verifyAsync<AuthUser>(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Token tidak valid');
    }

    await this.ensureSessionIsActive(user);
    request.user = user;
    return true;
  }

  private async ensureSessionIsActive(user: AuthUser) {
    if (!user.sessionId) {
      throw new UnauthorizedException('Session tidak valid');
    }

    const account = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: {
        activeSessionId: true,
        school: { select: { archivedAt: true } },
      },
    });

    if (
      !account ||
      account.school?.archivedAt ||
      account.activeSessionId !== user.sessionId
    ) {
      throw new UnauthorizedException(
        'Akun sudah login di perangkat lain. Silakan login ulang.',
      );
    }
  }

  private extractToken(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type === 'Bearer' && token) {
      return { fromCookie: false, token };
    }

    return {
      fromCookie: true,
      token: readAuthCookie(request.headers.cookie),
    };
  }

  private ensureCookieRequestIsTrusted(request: Request) {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(request.method)) return;

    if (request.headers['x-requested-with'] !== 'XMLHttpRequest') {
      throw new UnauthorizedException('Request cookie tidak valid');
    }
  }
}
