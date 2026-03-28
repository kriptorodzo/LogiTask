import { Controller, Get, Post, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';
import { getAuthGuard } from '../common/utils/auth.utils';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @UseGuards(getAuthGuard())
  @ApiOperation({ summary: 'Get notifications for current user' })
  async getNotifications(@Req() req: any, @Query('limit') limit?: number) {
    return this.notificationService.getUserNotifications(req.user.id, limit || 20);
  }

  @Get('unread-count')
  @UseGuards(getAuthGuard())
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Req() req: any) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  @Post(':id/read')
  @UseGuards(getAuthGuard())
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }
}