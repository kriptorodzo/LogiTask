import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport';
import { AuthService } from '../auth.service';

@Injectable()
export class AzureAdStrategy extends PassportStrategy(Strategy, 'azure-ad') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.AZURE_CLIENT_ID || 'dummy',
      clientSecret: process.env.AZURE_CLIENT_SECRET || 'dummy',
      tenantId: process.env.AZURE_TENANT_ID || 'common',
      callbackUrl: process.env.AZURE_CALLBACK_URL || 'http://localhost:4000/auth/callback',
      scope: ['User.Read'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any): Promise<any> {
    try {
      const user = await this.authService.validateUser({
        id: profile.id || profile.sub,
        displayName: profile.displayName || profile.name,
        emails: [{ value: profile.emails?.[0]?.value || profile.upn || profile.id }],
      });
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
}
