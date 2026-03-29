import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { TaskModule } from './task/task.module';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';
import { ReportsModule } from './reports/reports.module';
import { ErpModule } from './erp/erp.module';
import { PerformanceModule } from './performance/performance.module';
import { HealthController } from './common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    EmailModule,
    TaskModule,
    UserModule,
    NotificationModule,
    ReportsModule,
    ErpModule,
    PerformanceModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}