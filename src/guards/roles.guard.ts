import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_KEY } from './role.decorator';
// import { ROLE_KEY } from '../decorators/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(ROLE_KEY, context.getHandler());

    if (!requiredRoles) return true; 

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user || !user.role) return false;

    return requiredRoles.includes(user.role);
  }
}
