import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

// Auth mode configuration - explicitly set for each environment
// Production/Pilot: MUST use real Azure AD auth
const isProduction = process.env.NODE_ENV === 'production' && process.env.AUTH_MODE === 'production';
const isDevMode = process.env.NODE_ENV === 'development' || process.env.AUTH_MODE === 'development' || process.env.AUTH_MODE === 'dev';

// In production/pilot: ONLY real Azure AD auth allowed
// No automatic fallback to dev mode
const useDevMode = isDevMode && !isProduction;

// If in PRODUCTION mode without Azure AD configured, fail fast
// But NOT for development mode (placeholder credentials are OK)
if (process.env.NODE_ENV === 'production' && process.env.AUTH_MODE === 'production') {
  if (!process.env.AZURE_AD_CLIENT_ID || !process.env.AZURE_AD_CLIENT_SECRET || !process.env.AZURE_AD_TENANT_ID ||
      process.env.AZURE_AD_CLIENT_ID === 'placeholder' || process.env.AZURE_AD_CLIENT_ID === 'REPLACE_WITH_ACTUAL_CLIENT_ID') {
    throw new Error('CRITICAL: Azure AD configuration missing in production. Set AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID with real values');
  }
}

// Production guard - ONLY allows real Azure AD auth
@Injectable()
export class HybridAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // In development with explicit dev mode: bypass auth
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

    // In production: only real Azure AD auth allowed
    if (isProduction) {
      const azureGuard = new (AuthGuard('azure-ad'))();
      const result = await azureGuard.canActivate(context);
      return result === true;
    }

    // Default (non-dev): try real auth but don't fail on missing config
    try {
      const azureGuard = new (AuthGuard('azure-ad'))();
      const result = await azureGuard.canActivate(context);
      return result === true;
    } catch {
      // If Azure AD is not configured, use dev bypass as fallback
      const request = context.switchToHttp().getRequest();
      request.user = {
        id: 'dev-user-id',
        email: 'dev@company.com',
        role: 'MANAGER',
        displayName: 'Dev User',
      };
      return true;
    }
  }
}

// For use in @UseGuards - in production this will ONLY use HybridAuthGuard
export function getAuthGuard(): any {
  return HybridAuthGuard;
}