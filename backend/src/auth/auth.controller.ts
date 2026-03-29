import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HybridAuthGuard } from '../common/utils/auth.utils';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('login')
  @UseGuards(HybridAuthGuard)
  login() {
    // This triggers Azure AD login flow
  }

  @Get('callback')
  @UseGuards(HybridAuthGuard)
  async callback(@Req() req: any) {
    return req.user;
  }

  @Get('me')
  @UseGuards(HybridAuthGuard)
  async me(@Req() req: any) {
    return req.user;
  }

  @Get('logout')
  logout(@Req() req: any) {
    return { message: 'Logged out successfully' };
  }
}