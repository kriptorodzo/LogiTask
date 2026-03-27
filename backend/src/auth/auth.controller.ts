import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('login')
  @UseGuards(AuthGuard('azure-ad'))
  login() {
    // This triggers Azure AD login flow
  }

  @Get('callback')
  @UseGuards(AuthGuard('azure-ad'))
  async callback(@Req() req: any) {
    // Return user info after successful login
    return req.user;
  }

  @Get('me')
  @UseGuards(AuthGuard('azure-ad'))
  async me(@Req() req: any) {
    return req.user;
  }

  @Get('logout')
  logout(@Req() req: any) {
    req.logout();
    return { message: 'Logged out successfully' };
  }
}