import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const ROLE_WEIGHTS = {
  RECEPTION_COORDINATOR: {
    tasksDone: 0.25,
    accuracy: 0.25,
    otif: 0.20,
    tidiness: 0.15,
    discipline: 0.15,
  },
  DELIVERY_COORDINATOR: {
    tasksDone: 0.25,
    prepOnTime: 0.20,
    accuracy: 0.15,
    organization: 0.20,
    discipline: 0.20,
  },
  DISTRIBUTION_COORDINATOR: {
    deliveryOnTime: 0.30,
    otif: 0.25,
    fuel: 0.20,
    incidents: 0.15,
    discipline: 0.10,
  },
} as const;

// Extended weights that include all fields
const ROLE_WEIGHTS_FULL: Record<string, Record<string, number>> = {
  RECEPTION_COORDINATOR: {
    tasksDone: 0.20,
    accuracy: 0.25,
    otif: 0.20,
    tidiness: 0.15,
    discipline: 0.20,
    returns48h: 0.0, // Handled separately
  },
  DELIVERY_COORDINATOR: {
    tasksDone: 0.20,
    prepOnTime: 0.20,
    accuracy: 0.20,
    organization: 0.20,
    discipline: 0.20,
  },
  DISTRIBUTION_COORDINATOR: {
    deliveryOnTime: 0.30,
    otif: 0.20,
    fuel: 0.20,
    incidents: 0.15,
    discipline: 0.15,
  },
};

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate score for a specific role
   */
  calculateRoleScore(kpis: any, role: string): number {
    const weights = ROLE_WEIGHTS_FULL[role] || {};
    if (!weights) return 0;

    // Map kpis to scoring fields
    const scoreMap: Record<string, number> = {
      tasksDone: kpis.tasksDone || kpis.tasksTotal > 0 
        ? Math.round((kpis.tasksDone / kpis.tasksTotal) * 100) 
        : 0,
      accuracy: kpis.accuracy || 0,
      otif: kpis.otif || 0,
      prepOnTime: kpis.prepOnTime || 0,
      deliveryOnTime: kpis.deliveryOnTime || 0,
      tidiness: kpis.tidiness || 0,
      discipline: kpis.discipline || 0,
      organization: kpis.organization || 0,
      fuel: kpis.fuel || 0,
      incidents: kpis.incidents 
        ? 100 - kpis.incidents // Invert: 0 incidents = 100
        : 0,
      returns48h: kpis.returns48h || 0,
    };

    // Calculate weighted score
    let totalWeight = 0;
    let weightedScore = 0;

    for (const [key, weight] of Object.entries(weights)) {
      if (weight > 0 && scoreMap[key] !== undefined) {
        weightedScore += scoreMap[key] * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight === 0) return 0;
    return Math.round(weightedScore / totalWeight);
  }

  /**
   * Calculate bonus percentage based on score
   */
  calculateBonusPercent(score: number): number {
    if (score >= 90) return 100;
    if (score >= 80) return 70;
    if (score >= 70) return 40;
    return 0;
  }

  /**
   * Get or create CoordinatorKPI for user/month/year
   */
  async getOrCreateKPI(userId: string, month: number, year: number) {
    let kpi = await this.prisma.coordinatorKPI.findUnique({
      where: {
        userId_month_year: { userId, month, year },
      },
      include: { user: true },
    });

    if (!kpi) {
      kpi = await this.prisma.coordinatorKPI.create({
        data: { userId, month, year },
        include: { user: true },
      });
    }

    return kpi;
  }

  /**
   * Recalculate KPI from tasks for a user
   */
  async recalculateFromTasks(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all tasks for this user in the month
    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate auto KPIs
    const tasksTotal = tasks.length;
    const tasksDone = tasks.filter(t => t.completionResult === 'FULL').length;
    const tasksPartial = tasks.filter(t => t.completionResult === 'PARTIAL').length;
    const tasksFailed = tasks.filter(t => t.completionResult === 'FAILED').length;
    const tasksOnTime = tasks.filter(t => t.completedAt && t.dueDate && t.completedAt <= t.dueDate).length;
    const tasksOverdue = tasks.filter(t => {
      if (!t.completedAt || !t.dueDate) return false;
      return t.completedAt > t.dueDate;
    }).length;

    // Calculate accuracy (tasks without error)
    const totalWithResult = tasksDone + tasksPartial + tasksFailed;
    const accuracy = totalWithResult > 0 
      ? Math.round((tasksDone / totalWithResult) * 100)
      : 100;

    // OTIF: On-Time In-Full
    const otif = tasksTotal > 0
      ? Math.round((tasksOnTime / tasksTotal) * 100)
      : 100;

    // Prep on time (from performance fields)
    const prepOnTimeCount = tasks.filter(t => t.onTimePrep === true).length;
    const prepOnTime = tasksTotal > 0
      ? Math.round((prepOnTimeCount / tasksTotal) * 100)
      : 100;

    // Delivery on time
    const deliveryOnTimeCount = tasks.filter(t => t.onTimeDelivery === true).length;
    const deliveryOnTime = tasksTotal > 0
      ? Math.round((deliveryOnTimeCount / tasksTotal) * 100)
      : 100;

    // Update the KPI record
    const kpi = await this.prisma.coordinatorKPI.update({
      where: {
        userId_month_year: { userId, month, year },
      },
      data: {
        tasksTotal,
        tasksDone,
        tasksPartial,
        tasksFailed,
        tasksOverdue,
        tasksOnTime,
        accuracy,
        otif,
        prepOnTime,
        deliveryOnTime,
      },
    });

    return kpi;
  }

  /**
   * Get scorecard for a user
   */
  async getScorecard(userId: string, month: number, year: number) {
    const kpi = await this.getOrCreateKPI(userId, month, year);

    // Determine active role (could be stored or derived from user assignment)
    const activeRole = kpi.activeRole || 'RECEPTION_COORDINATOR';

    // Calculate role-specific scores
    const receptionScore = this.calculateRoleScore(kpi, 'RECEPTION_COORDINATOR');
    const deliveryScore = this.calculateRoleScore(kpi, 'DELIVERY_COORDINATOR');
    const distributionScore = this.calculateRoleScore(kpi, 'DISTRIBUTION_COORDINATOR');

    // Active score based on role
    const totalScore = activeRole === 'RECEPTION_COORDINATOR'
      ? receptionScore
      : activeRole === 'DELIVERY_COORDINATOR'
        ? deliveryScore
        : distributionScore;

    const bonusPercent = this.calculateBonusPercent(totalScore);

    return {
      userId: kpi.userId,
      userName: kpi.user?.displayName || kpi.user?.email || 'Unknown',
      role: activeRole,
      month,
      year,
      kpis: {
        tasksTotal: kpi.tasksTotal,
        tasksDone: kpi.tasksDone,
        accuracy: kpi.accuracy,
        otif: kpi.otif,
        prepOnTime: kpi.prepOnTime,
        deliveryOnTime: kpi.deliveryOnTime,
        tidiness: kpi.tidiness,
        discipline: kpi.discipline,
        organization: kpi.organization,
        fuel: kpi.fuel,
        incidents: kpi.incidents,
        returns48h: kpi.returns48h,
      },
      scores: {
        reception: receptionScore,
        delivery: deliveryScore,
        distribution: distributionScore,
      },
      totalScore,
      bonusPercent,
      bonusLabel: `${bonusPercent}%`,
      bonusEligible: totalScore >= 60,
    };
  }

  /**
   * Update manual KPIs (upsert)
   */
  async updateManualKPIs(userId: string, month: number, year: number, data: {
    tidiness?: number;
    discipline?: number;
    organization?: number;
    fuel?: number;
    incidents?: number;
    returns48h?: number;
    activeRole?: string;
  }) {
    // Use upsert to create or update
    const kpi = await this.prisma.coordinatorKPI.upsert({
      where: {
        userId_month_year: { userId, month, year },
      },
      update: {
        ...(data.tidiness !== undefined && { tidiness: data.tidiness }),
        ...(data.discipline !== undefined && { discipline: data.discipline }),
        ...(data.organization !== undefined && { organization: data.organization }),
        ...(data.fuel !== undefined && { fuel: data.fuel }),
        ...(data.incidents !== undefined && { incidents: data.incidents }),
        ...(data.returns48h !== undefined && { returns48h: data.returns48h }),
        ...(data.activeRole && { activeRole: data.activeRole }),
      },
      create: {
        userId,
        month,
        year,
        ...(data.tidiness !== undefined && { tidiness: data.tidiness }),
        ...(data.discipline !== undefined && { discipline: data.discipline }),
        ...(data.organization !== undefined && { organization: data.organization }),
        ...(data.fuel !== undefined && { fuel: data.fuel }),
        ...(data.incidents !== undefined && { incidents: data.incidents }),
        ...(data.returns48h !== undefined && { returns48h: data.returns48h }),
        ...(data.activeRole && { activeRole: data.activeRole }),
      },
      include: { user: true },
    });

    // Recalculate scores
    const receptionScore = this.calculateRoleScore(kpi, 'RECEPTION_COORDINATOR');
    const deliveryScore = this.calculateRoleScore(kpi, 'DELIVERY_COORDINATOR');
    const distributionScore = this.calculateRoleScore(kpi, 'DISTRIBUTION_COORDINATOR');

    const activeRole = kpi.activeRole || 'RECEPTION_COORDINATOR';
    const totalScore = activeRole === 'RECEPTION_COORDINATOR'
      ? receptionScore
      : activeRole === 'DELIVERY_COORDINATOR'
        ? deliveryScore
        : distributionScore;

    // Update calculated scores (using update since kpi exists now)
    await this.prisma.coordinatorKPI.update({
      where: { id: kpi.id },
      data: {
        receptionScore,
        deliveryScore,
        distributionScore,
        totalScore,
        bonusPercent: this.calculateBonusPercent(totalScore),
      },
    });

    return this.getScorecard(userId, month, year);
  }

  /**
   * Get leaderboard for a role
   */
  async getLeaderboard(month: number, year: number, role?: string) {
    const kpis = await this.prisma.coordinatorKPI.findMany({
      where: { month, year },
      include: { user: true },
      orderBy: { totalScore: 'desc' },
    });

    // Filter by role if specified
    const filtered = role
      ? kpis.filter(k => k.activeRole === role)
      : kpis;

    return {
      month,
      year,
      role: role || 'ALL',
      leaderboard: filtered.map((k, i) => ({
        rank: i + 1,
        userId: k.userId,
        userName: k.user?.displayName || k.user?.email || 'Unknown',
        totalScore: k.totalScore || 0,
        bonusPercent: k.bonusPercent || 0,
        tasksDone: k.tasksDone,
        activeRole: k.activeRole,
      })),
    };
  }

  /**
   * Get all coordinators with KPIs
   */
  async getCoordinatorsWithKPIs(month: number, year: number) {
    return this.prisma.coordinatorKPI.findMany({
      where: { month, year },
      include: { user: true },
    });
  }

  /**
   * Get task metrics for a user
   */
  async getTaskMetrics(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return {
      total: tasks.length,
      done: tasks.filter(t => t.completionResult === 'FULL').length,
      partial: tasks.filter(t => t.completionResult === 'PARTIAL').length,
      failed: tasks.filter(t => t.completionResult === 'FAILED').length,
      pending: tasks.filter(t => t.status !== 'DONE').length,
      overdue: tasks.filter(t => {
        if (!t.dueDate) return false;
        return t.dueDate < new Date() && t.status !== 'DONE';
      }).length,
    };
  }
}