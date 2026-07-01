import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { AuthUser } from '../types/auth-user.type';

type RequestWithUser = Request & {
  user?: AuthUser;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // JwtAuthGuard mengisi request.user; guard ini hanya memeriksa apakah role-nya sesuai.
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    return user ? requiredRoles.includes(user.role) : false;
  }
}
