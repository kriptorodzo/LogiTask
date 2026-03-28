import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KpiSnapshotService {
  constructor(private prisma: PrismaService) {}

  /**
   * Build daily KPI snapshots for a date range
   */
  async buildDailySnapshots(
    from: Date,
    to: Date,
    filters: {
      roleCode?: string;
      coordinatorUserId?: string;
      supplierName?: string;
      locationName?: string;
    } = {}
  ): Promise<any[]> {
    return this.buildSnapshots('DAY', from, to, filters);
  }

  /**
   * Build weekly KPI snapshots for a date range
   */
  async buildWeeklySnapshots(
    from: Date,
    to: Date,
    filters: {
      roleCode?: string;
      coordinatorUserId?: string;
      supplierName?: string;
      locationName?: string;
    } = {}
  ): Promise<any[]> {
    return this.buildSnapshots('WEEK', from, to, filters);
  }

  /**
   * Build monthly KPI snapshots for a date range
   */
  async buildMonthlySnapshots(
    from: Date,
    to: Date,
    filters: {
      roleCode?: string;
      coordinatorUserId?: string;
      supplierName?: string;
      locationName?: string;
    } = {}
  ): Promise<any[]> {
    return this.buildSnapshots('MONTH', from, to, filters);
  }

  /**
   * Internal method to build snapshots for a given period type
   */
  private async buildSnapshots(
    periodType: string,
    from: Date,
    to: Date,
    filters: {
      roleCode?: string;
      coordinatorUserId?: string;
      supplierName?: string;
      locationName?: string;
    }
  ): Promise<any[]> {
    // Get all completed cases in the date range
    const where: any = {
      completedAt: { gte: from, lte: to },
    };
    if (filters.supplierName) where.supplierName = filters.supplierName;
    if (filters.locationName) where.locationName = filters.locationName;

    const cases = await this.prisma.emailCase.findMany({
      where,
      include: {
        email: {
          include: {
            tasks: {
              where: { isRequiredForCase: true },
              include: { assignee: true },
            },
          },
        },
      },
    });

    // Group cases by period
    const snapshotsMap = new Map<string, any>();

    for (const caseData of cases) {
      const periodStart = this.getPeriodStart(caseData.completedAt!, periodType);
      const periodEnd = this.getPeriodEnd(periodStart, periodType);
      const key = `${periodStart.toISOString()}_${filters.roleCode || 'all'}_${filters.coordinatorUserId || 'all'}_${filters.supplierName || 'all'}_${filters.locationName || 'all'}`;

      if (!snapshotsMap.has(key)) {
        snapshotsMap.set(key, {
          periodType,
          periodStart,
          periodEnd,
          roleCode: filters.roleCode,
          coordinatorUserId: filters.coordinatorUserId,
          supplierName: filters.supplierName,
          locationName: filters.locationName,
          totalCases: 0,
          otifCases: 0,
          onTimeCases: 0,
          inFullCases: 0,
          overdueCases: 0,
          approvalMinutesSum: 0,
          executionMinutesSum: 0,
          caseCount: 0,
        });
      }

      const snapshot = snapshotsMap.get(key);
      snapshot.totalCases++;
      if (caseData.isOtif) snapshot.otifCases++;
      if (caseData.isOnTime) snapshot.onTimeCases++;
      if (caseData.isInFull) snapshot.inFullCases++;
      if (caseData.isOnTime === false) snapshot.overdueCases++;

      if (caseData.approvalLeadMinutes) {
        snapshot.approvalMinutesSum += caseData.approvalLeadMinutes;
      }
      if (caseData.executionLeadMinutes) {
        snapshot.executionMinutesSum += caseData.executionLeadMinutes;
      }
      snapshot.caseCount++;
    }

    // Calculate rates and create snapshot records
    const snapshots = Array.from(snapshotsMap.values()).map((s: any) => {
      const avgApprovalMinutes = s.caseCount > 0 ? Math.round(s.approvalMinutesSum / s.caseCount) : null;
      const avgExecutionMinutes = s.caseCount > 0 ? Math.round(s.executionMinutesSum / s.caseCount) : null;

      return {
        periodType: s.periodType,
        periodStart: s.periodStart,
        periodEnd: s.periodEnd,
        roleCode: s.roleCode,
        coordinatorUserId: s.coordinatorUserId,
        supplierName: s.supplierName,
        locationName: s.locationName,
        totalCases: s.totalCases,
        otifCases: s.otifCases,
        onTimeCases: s.onTimeCases,
        inFullCases: s.inFullCases,
        overdueCases: s.overdueCases,
        avgApprovalMinutes,
        avgExecutionMinutes,
        otifRate: s.totalCases > 0 ? (s.otifCases / s.totalCases) * 100 : null,
        onTimeRate: s.totalCases > 0 ? (s.onTimeCases / s.totalCases) * 100 : null,
        inFullRate: s.totalCases > 0 ? (s.inFullCases / s.totalCases) * 100 : null,
      };
    });

    // Delete old snapshots and insert new ones
    await this.prisma.kpiSnapshot.deleteMany({
      where: {
        periodType,
        periodStart: { gte: from },
        periodEnd: { lte: to },
        ...(filters.roleCode ? { roleCode: filters.roleCode } : {}),
        ...(filters.coordinatorUserId ? { coordinatorUserId: filters.coordinatorUserId } : {}),
        ...(filters.supplierName ? { supplierName: filters.supplierName } : {}),
        ...(filters.locationName ? { locationName: filters.locationName } : {}),
      },
    });

    await this.prisma.kpiSnapshot.createMany({
      data: snapshots,
    });

    return snapshots;
  }

  /**
   * Get snapshots with optional filters
   */
  async getSnapshots(filters: {
    periodType?: string;
    from?: Date;
    to?: Date;
    roleCode?: string;
    coordinatorUserId?: string;
    supplierName?: string;
    locationName?: string;
  } = {}): Promise<any[]> {
    const where: any = {};

    if (filters.periodType) where.periodType = filters.periodType;
    if (filters.from || filters.to) {
      where.periodStart = {};
      if (filters.from) where.periodStart.gte = filters.from;
      if (filters.to) where.periodEnd = { lte: filters.to };
    }
    if (filters.roleCode) where.roleCode = filters.roleCode;
    if (filters.coordinatorUserId) where.coordinatorUserId = filters.coordinatorUserId;
    if (filters.supplierName) where.supplierName = filters.supplierName;
    if (filters.locationName) where.locationName = filters.locationName;

    return this.prisma.kpiSnapshot.findMany({
      where,
      orderBy: { periodStart: 'asc' },
    });
  }

  private getPeriodStart(date: Date, periodType: string): Date {
    const d = new Date(date);
    switch (periodType) {
      case 'DAY':
        d.setHours(0, 0, 0, 0);
        break;
      case 'WEEK':
        d.setDate(d.getDate() - d.getDay());
        d.setHours(0, 0, 0, 0);
        break;
      case 'MONTH':
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        break;
    }
    return d;
  }

  private getPeriodEnd(periodStart: Date, periodType: string): Date {
    const d = new Date(periodStart);
    switch (periodType) {
      case 'DAY':
        d.setDate(d.getDate() + 1);
        break;
      case 'WEEK':
        d.setDate(d.getDate() + 7);
        break;
      case 'MONTH':
        d.setMonth(d.getMonth() + 1);
        break;
    }
    d.setSeconds(-1);
    return d;
  }
}