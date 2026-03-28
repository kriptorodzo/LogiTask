import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { getAuthGuard, DevAuthGuard } from '../common/utils/auth.utils';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('login')
  @UseGuards(getAuthGuard())
  login() {
    // This triggers Azure AD login flow or returns dev mode message
  }

  @Post('dev-login')
  @UseGuards(DevAuthGuard)
  async devLogin(@Body() body: { email: string; role: string }) {
    const user = await this.authService.validateDevUser(body.email, body.role);
    return user;
  }

  @Get('callback')
  @UseGuards(getAuthGuard())
  async callback(@Req() req: any) {
    return req.user;
  }

  @Get('me')
  @UseGuards(getAuthGuard())
  async me(@Req() req: any) {
    return req.user;
  }

  @Get('logout')
  logout(@Req() req: any) {
    return { message: 'Logged out successfully' };
  }
}