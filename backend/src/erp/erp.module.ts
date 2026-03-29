import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ErpController } from './erp.controller';
import { ErpImportService } from './erp-import.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [ErpController],
  providers: [ErpImportService, PrismaService, UserService],
  exports: [ErpImportService],
})
export class ErpModule {}