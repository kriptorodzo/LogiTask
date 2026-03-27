import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { EmailParserService } from './email-parser.service';

@Module({
  controllers: [EmailController],
  providers: [EmailService, EmailParserService],
  exports: [EmailService],
})
export class EmailModule {}