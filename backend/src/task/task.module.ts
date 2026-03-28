import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TaskOrchestratorService } from './task-orchestrator.service';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [ReportsModule],
  controllers: [TaskController],
  providers: [TaskService, TaskOrchestratorService],
  exports: [TaskService],
})
export class TaskModule {}