import { Injectable, CanActivate, ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Observable } from 'rxjs';

const skipAuth = process.env.SKIP_AUTH === 'true';

@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    if (skipAuth) {
      // Dev mode: allow all requests
      return true;
    }
    // Real auth: use Azure AD strategy
    return false;
  }
}

// Decorator for extracting dev user from request
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (skipAuth && request.headers['x-dev-user']) {
      return JSON.parse(request.headers['x-dev-user']);
    }
    return request.user;
  },
);