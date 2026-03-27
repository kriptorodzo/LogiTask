import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskService } from './task.service';
import { TaskOrchestratorService } from './task-orchestrator.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TASK_STATUS } from '../common/constants';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TaskController {
  constructor(
    private taskService: TaskService,
    private taskOrchestrator: TaskOrchestratorService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('azure-ad'))
  @ApiOperation({ summary: 'List tasks' })
  async getTasks(
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('requestType') requestType?: string,
  ) {
    return this.taskService.getTasks({ status, assigneeId, requestType });
  }

  @Get('my-tasks')
  @UseGuards(AuthGuard('azure-ad'))
  @ApiOperation({ summary: 'Get tasks for current user role' })
  async getMyTasks(@Req() req: any) {
    return this.taskService.getTasksByRole(req.user.role);
  }

  @Get(':id')
  @UseGuards(AuthGuard('azure-ad'))
  @ApiOperation({ summary: 'Get task by ID' })
  async getTask(@Param('id') id: string) {
    return this.taskService.getTaskById(id);
  }

  @Post()
  @UseGuards(AuthGuard('azure-ad'))
  @ApiOperation({ summary: 'Create a new task' })
  async createTask(@Body() dto: CreateTaskDto, @Req() req: any) {
    return this.taskService.createTask({
      ...dto,
      assigneeId: dto.assigneeId || req.user.id,
    });
  }

  @Put(':id')
  @UseGuards(AuthGuard('azure-ad'))
  @ApiOperation({ summary: 'Update task' })
  async updateTask(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.taskService.updateTask(id, dto);
  }

  @Post(':id/approve')
  @UseGuards(AuthGuard('azure-ad'))
  @ApiOperation({ summary: 'Approve task and assign to coordinator' })
  async approveTask(
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string,
    @Req() req: any,
  ) {
    return this.taskService.approveTask(id, assigneeId, req.user.id);
  }

  @Post(':id/reject')
  @UseGuards(AuthGuard('azure-ad'))
  @ApiOperation({ summary: 'Reject task' })
  async rejectTask(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    return this.taskService.rejectTask(id, req.user.id, reason);
  }

  @Put(':id/status')
  @UseGuards(AuthGuard('azure-ad'))
  @ApiOperation({ summary: 'Update task status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Req() req: any,
  ) {
    return this.taskService.updateStatus(id, status, req.user.id);
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard('azure-ad'))
  @ApiOperation({ summary: 'Add comment to task' })
  async addComment(
    @Param('id') id: string,
    @Body('content') content: string,
    @Req() req: any,
  ) {
    return this.taskService.addComment(id, req.user.id, content);
  }

  @Post('process-email/:emailId')
  @UseGuards(AuthGuard('azure-ad'))
  @ApiOperation({ summary: 'Process email and create tasks' })
  async processEmail(@Param('emailId') emailId: string) {
    // This would be called after email is fetched and processed
    // For now, return a placeholder
    return { message: 'Email processing triggered', emailId };
  }
}