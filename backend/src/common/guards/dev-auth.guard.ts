// DevAuthGuard - DISABLED for production/pilot
// This guard is only for local development with explicit AUTH_MODE=dev
// In production/pilot: HybridAuthGuard is used which requires real Azure AD

// @Injectable()
// export class DevAuthGuard implements CanActivate {
//   canActivate(context: ExecutionContext): boolean {
//     const request = context.switchToHttp().getRequest();
//     request.user = {
//       id: 'dev-user-id',
//       email: 'dev@company.com',
//       role: 'MANAGER',
//       displayName: 'Dev User',
//     };
//     return true;
//   }
// }

// CurrentUser decorator - DISABLED
// export const CurrentUser = createParamDecorator(...)