import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

const isAzureConfigured = !!process.env.AZURE_AD_CLIENT_ID && !!process.env.AZURE_AD_CLIENT_SECRET;

// Auto-detect dev mode if Azure AD is not configured
export const useDevMode = !isAzureConfigured;

// Dev mode guard that allows all requests and sets a mock user
@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Set mock dev user for development
    request.user = {
      id: 'dev-user-id',
      email: 'dev@company.com',
      role: 'MANAGER',
      displayName: 'Dev User',
    };
    return true;
  }
}

// Hybrid guard that works in both dev and production
@Injectable()
export class HybridAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (useDevMode) {
      const request = context.switchToHttp().getRequest();
      request.user = {
        id: 'dev-user-id',
        email: 'dev@company.com',
        role: 'MANAGER',
        displayName: 'Dev User',
      };
      return true;
    }
    const azureGuard = new (AuthGuard('azure-ad'))();
    const result = await azureGuard.canActivate(context);
    if (typeof result === 'boolean') {
      return result;
    }
    return true;
  }
}

// For use in @UseGuards
export function getAuthGuard(): any {
  return useDevMode ? DevAuthGuard : HybridAuthGuard;
}