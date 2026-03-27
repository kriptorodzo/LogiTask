import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AzureAdStrategy } from './strategies/azure-ad.strategy';

@Module({
  imports: [PassportModule.register({ session: false })],
  providers: [AuthService, AzureAdStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}