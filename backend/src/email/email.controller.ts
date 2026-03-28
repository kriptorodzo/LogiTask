import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EmailService } from './email.service';
import { getAuthGuard } from '../common/utils/auth.utils';
import { CreateMailboxDto } from './dto/create-mailbox.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Emails')
@ApiBearerAuth()
@Controller('emails')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('mailboxes')
  @UseGuards(getAuthGuard())
  @ApiOperation({ summary: 'Create a new mailbox' })
  async createMailbox(@Body() dto: CreateMailboxDto) {
    return this.emailService.createMailbox(dto.emailAddress, dto.displayName);
  }

  @Get('mailboxes')
  @UseGuards(getAuthGuard())
  @ApiOperation({ summary: 'List all mailboxes' })
  async getMailboxes() {
    return this.emailService.getMailboxes();
  }

  @Get()
  @UseGuards(getAuthGuard())
  @ApiOperation({ summary: 'List all emails' })
  async getEmails(
    @Query('processingStatus') processingStatus?: string,
    @Query('requestType') requestType?: string,
  ) {
    return this.emailService.getEmails({ processingStatus, requestType });
  }

  @Get(':id')
  @UseGuards(getAuthGuard())
  @ApiOperation({ summary: 'Get email by ID' })
  async getEmail(@Param('id') id: string) {
    return this.emailService.getEmailById(id);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Microsoft Graph webhook endpoint' })
  async handleWebhook(@Body() notification: any) {
    return this.emailService.handleWebhook(notification);
  }
}