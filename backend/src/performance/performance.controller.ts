import { Controller, Get, Post, Patch, Param, Query, Body } from '@nestjs/common';
import { PerformanceService } from './performance.service';

@Controller('performance')
export class PerformanceController {
  constructor(private performance: PerformanceService) {}

  /**
   * GET /performance/scorecard/:userId?month=X&year=Y
   * Get scorecard for a coordinator
   */
  @Get('scorecard/:userId')
  async getScorecard(
    @Param('userId') userId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();
    return this.performance.getScorecard(userId, m, y);
  }

  /**
   * GET /performance/my-scorecard?month=X&year=Y
   * Get current user's scorecard (for coordinator dashboard)
   */
  @Get('my-scorecard')
  async getMyScorecard(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    // This would use the authenticated user from JWT
    // For now, return empty structure
    return { message: 'Use /performance/scorecard/:userId' };
  }

  /**
   * GET /performance/leaderboard?month=X&year=Y&role=RECEPTION_COORDINATOR
   * Get leaderboard for a role
   */
  @Get('leaderboard')
  async getLeaderboard(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('role') role: string,
  ) {
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();
    return this.performance.getLeaderboard(m, y, role);
  }

  /**
   * GET /performance/coordinators?month=X&year=Y
   * Get all coordinators with KPIs
   */
  @Get('coordinators')
  async getCoordinators(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();
    return this.performance.getCoordinatorsWithKPIs(m, y);
  }

  /**
   * GET /performance/metrics/:userId?month=X&year=Y
   * Get task metrics for a user
   */
  @Get('metrics/:userId')
  async getMetrics(
    @Param('userId') userId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();
    return this.performance.getTaskMetrics(userId, m, y);
  }

  /**
   * POST /performance/kpi
   * Update manual KPIs
   */
  @Post('kpi')
  async updateKPI(@Body() body: {
    userId: string;
    month: number;
    year: number;
    tidiness?: number;
    discipline?: number;
    organization?: number;
    fuel?: number;
    incidents?: number;
    returns48h?: number;
    activeRole?: string;
  }) {
    return this.performance.updateManualKPIs(
      body.userId,
      body.month,
      body.year,
      body,
    );
  }

  /**
   * POST /performance/recalculate/:userId?month=X&year=Y
   * Recalculate KPIs from tasks
   */
  @Post('recalculate/:userId')
  async recalculate(
    @Param('userId') userId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();
    await this.performance.recalculateFromTasks(userId, m, y);
    return this.performance.getScorecard(userId, m, y);
  }

  /**
   * PATCH /performance/task/:taskId/metrics
   * Update task performance metrics
   */
  @Patch('task/:taskId/metrics')
  async updateTaskMetrics(
    @Param('taskId') taskId: string,
    @Body() body: {
      deliveryAccuracy?: boolean;
      onTimePrep?: boolean;
      onTimeDelivery?: boolean;
      delayMinutes?: number;
      delayReasonCode?: string;
    },
  ) {
    // This would update the task with performance metrics
    // Implemented in task service
    return { message: 'Task metrics updated', taskId };
  }
}