import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsQueryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get overview metrics for a date range
   */
  async getOverview(filters: {
    from?: Date;
    to?: Date;
    roleCode?: string;
    supplierName?: string;
    locationName?: string;
    coordinatorUserId?: string;
  } = {}): Promise<any> {
    const where: any = {
      completedAt: { not: null },
    };

    if (filters.from) where.completedAt.gte = filters.from;
    if (filters.to) where.completedAt.lte = filters.to;
    if (filters.supplierName) where.supplierName = filters.supplierName;
    if (filters.locationName) where.locationName = filters.locationName;

    const cases = await this.prisma.emailCase.findMany({ where });

    const totalCases = cases.length;
    const otifCases = cases.filter(c => c.isOtif === true).length;
    const onTimeCases = cases.filter(c => c.isOnTime === true).length;
    const inFullCases = cases.filter(c => c.isInFull === true).length;
    const overdueCases = cases.filter(c => c.isOnTime === false).length;

    const validApprovalTimes = cases.filter(c => c.approvalLeadMinutes !== null).map(c => c.approvalLeadMinutes!);
    const validExecutionTimes = cases.filter(c => c.executionLeadMinutes !== null).map(c => c.executionLeadMinutes!);

    const avgApprovalMinutes = validApprovalTimes.length > 0
      ? Math.round(validApprovalTimes.reduce((a, b) => a + b, 0) / validApprovalTimes.length)
      : null;
    const avgExecutionMinutes = validExecutionTimes.length > 0
      ? Math.round(validExecutionTimes.reduce((a, b) => a + b, 0) / validExecutionTimes.length)
      : null;

    return {
      totalCases,
      otifCases,
      onTimeCases,
      inFullCases,
      overdueCases,
      avgApprovalMinutes,
      avgExecutionMinutes,
      otifRate: totalCases > 0 ? (otifCases / totalCases) * 100 : 0,
      onTimeRate: totalCases > 0 ? (onTimeCases / totalCases) * 100 : 0,
      inFullRate: totalCases > 0 ? (inFullCases / totalCases) * 100 : 0,
      overdueRate: totalCases > 0 ? (overdueCases / totalCases) * 100 : 0,
    };
  }

  /**
   * Get OTIF trend data with time series aggregation
   */
  async getOtifTrend(filters: {
    from?: Date;
    to?: Date;
    groupBy?: 'day' | 'week' | 'month';
    supplierName?: string;
    locationName?: string;
    coordinatorUserId?: string;
  } = {}): Promise<any[]> {
    const where: any = {
      completedAt: { not: null },
    };

    if (filters.from) where.completedAt.gte = filters.from;
    if (filters.to) where.completedAt.lte = filters.to;
    if (filters.supplierName) where.supplierName = filters.supplierName;
    if (filters.locationName) where.locationName = filters.locationName;

    const cases = await this.prisma.emailCase.findMany({ where });

    // Group by period
    const groups = new Map<string, any>();

    for (const caseData of cases) {
      const periodKey = this.getPeriodKey(caseData.completedAt!, filters.groupBy || 'day');
      
      if (!groups.has(periodKey)) {
        groups.set(periodKey, {
          period: periodKey,
          totalCases: 0,
          otifCases: 0,
          onTimeCases: 0,
          inFullCases: 0,
        });
      }

      const group = groups.get(periodKey);
      group.totalCases++;
      if (caseData.isOtif) group.otifCases++;
      if (caseData.isOnTime) group.onTimeCases++;
      if (caseData.isInFull) group.inFullCases++;
    }

    // Calculate rates
    return Array.from(groups.values()).map(g => ({
      period: g.period,
      totalCases: g.totalCases,
      otifCases: g.otifCases,
      onTimeCases: g.onTimeCases,
      inFullCases: g.inFullCases,
      otifRate: g.totalCases > 0 ? (g.otifCases / g.totalCases) * 100 : 0,
      onTimeRate: g.totalCases > 0 ? (g.onTimeCases / g.totalCases) * 100 : 0,
      inFullRate: g.totalCases > 0 ? (g.inFullCases / g.totalCases) * 100 : 0,
    })).sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Get coordinator performance metrics
   */
  async getCoordinators(filters: {
    from?: Date;
    to?: Date;
    roleCode?: string;
  } = {}): Promise<any[]> {
    const where: any = {
      completedAt: { not: null },
    };

    if (filters.from) where.completedAt.gte = filters.from;
    if (filters.to) where.completedAt.lte = filters.to;

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

    // Aggregate by coordinator
    const coordinatorMap = new Map<string, any>();

    for (const caseData of cases) {
      if (!caseData.email) continue;
      for (const task of caseData.email.tasks) {
        if (!task.assigneeId) continue;

        if (!coordinatorMap.has(task.assigneeId)) {
          coordinatorMap.set(task.assigneeId, {
            coordinatorUserId: task.assigneeId,
            coordinatorName: task.assignee?.displayName || task.assignee?.email || 'Unknown',
            roleCode: task.assignee?.role || 'UNKNOWN',
            assignedTasks: 0,
            completedTasks: 0,
            partialTasks: 0,
            failedTasks: 0,
            otifCases: 0,
            totalCases: 0,
            executionMinutesSum: 0,
          });
        }

        const coord = coordinatorMap.get(task.assigneeId);
        coord.assignedTasks++;
        if (task.completionResult === 'FULL') coord.completedTasks++;
        if (task.completionResult === 'PARTIAL') coord.partialTasks++;
        if (task.completionResult === 'FAILED') coord.failedTasks++;

        if (caseData.isOtif) coord.otifCases++;
        coord.totalCases++;

        if (task.completedAt && task.startedAt) {
          const executionMinutes = Math.round((task.completedAt.getTime() - task.startedAt.getTime()) / 60000);
          coord.executionMinutesSum += executionMinutes;
        }
      }
    }

    // Calculate rates and averages
    return Array.from(coordinatorMap.values()).map(c => ({
      coordinatorUserId: c.coordinatorUserId,
      coordinatorName: c.coordinatorName,
      roleCode: c.roleCode,
      assignedTasks: c.assignedTasks,
      completedTasks: c.completedTasks,
      partialTasks: c.partialTasks,
      failedTasks: c.failedTasks,
      otifCases: c.otifCases,
      totalCases: c.totalCases,
      otifRate: c.totalCases > 0 ? (c.otifCases / c.totalCases) * 100 : 0,
      avgCompletionTime: c.completedTasks > 0 ? Math.round(c.executionMinutesSum / c.completedTasks) : null,
    }));
  }

  /**
   * Get supplier performance metrics
   */
  async getSuppliers(filters: {
    from?: Date;
    to?: Date;
  } = {}): Promise<any[]> {
    const where: any = {
      completedAt: { not: null },
      supplierName: { not: null },
    };

    if (filters.from) where.completedAt.gte = filters.from;
    if (filters.to) where.completedAt.lte = filters.to;

    const cases = await this.prisma.emailCase.findMany({ where });

    // Aggregate by supplier
    const supplierMap = new Map<string, any>();

    for (const caseData of cases) {
      const supplier = caseData.supplierName || 'Unknown';
      
      if (!supplierMap.has(supplier)) {
        supplierMap.set(supplier, {
          supplierName: supplier,
          totalCases: 0,
          otifCases: 0,
          onTimeCases: 0,
          inFullCases: 0,
          executionMinutesSum: 0,
          executionCount: 0,
        });
      }

      const s = supplierMap.get(supplier);
      s.totalCases++;
      if (caseData.isOtif) s.otifCases++;
      if (caseData.isOnTime) s.onTimeCases++;
      if (caseData.isInFull) s.inFullCases++;

      if (caseData.executionLeadMinutes) {
        s.executionMinutesSum += caseData.executionLeadMinutes;
        s.executionCount++;
      }
    }

    return Array.from(supplierMap.values()).map(s => ({
      supplierName: s.supplierName,
      totalCases: s.totalCases,
      otifCases: s.otifCases,
      onTimeCases: s.onTimeCases,
      inFullCases: s.inFullCases,
      otifRate: s.totalCases > 0 ? (s.otifCases / s.totalCases) * 100 : 0,
      onTimeRate: s.totalCases > 0 ? (s.onTimeCases / s.totalCases) * 100 : 0,
      inFullRate: s.totalCases > 0 ? (s.inFullCases / s.totalCases) * 100 : 0,
      avgExecutionMinutes: s.executionCount > 0 ? Math.round(s.executionMinutesSum / s.executionCount) : null,
    })).sort((a, b) => b.totalCases - a.totalCases);
  }

  /**
   * Get location performance metrics
   */
  async getLocations(filters: {
    from?: Date;
    to?: Date;
  } = {}): Promise<any[]> {
    const where: any = {
      completedAt: { not: null },
      locationName: { not: null },
    };

    if (filters.from) where.completedAt.gte = filters.from;
    if (filters.to) where.completedAt.lte = filters.to;

    const cases = await this.prisma.emailCase.findMany({ where });

    // Aggregate by location
    const locationMap = new Map<string, any>();

    for (const caseData of cases) {
      const location = caseData.locationName || 'Unknown';
      
      if (!locationMap.has(location)) {
        locationMap.set(location, {
          locationName: location,
          totalCases: 0,
          otifCases: 0,
          onTimeCases: 0,
          inFullCases: 0,
          executionMinutesSum: 0,
          executionCount: 0,
        });
      }

      const l = locationMap.get(location);
      l.totalCases++;
      if (caseData.isOtif) l.otifCases++;
      if (caseData.isOnTime) l.onTimeCases++;
      if (caseData.isInFull) l.inFullCases++;

      if (caseData.executionLeadMinutes) {
        l.executionMinutesSum += caseData.executionLeadMinutes;
        l.executionCount++;
      }
    }

    return Array.from(locationMap.values()).map(l => ({
      locationName: l.locationName,
      totalCases: l.totalCases,
      otifCases: l.otifCases,
      onTimeCases: l.onTimeCases,
      inFullCases: l.inFullCases,
      otifRate: l.totalCases > 0 ? (l.otifCases / l.totalCases) * 100 : 0,
      onTimeRate: l.totalCases > 0 ? (l.onTimeCases / l.totalCases) * 100 : 0,
      inFullRate: l.totalCases > 0 ? (l.inFullCases / l.totalCases) * 100 : 0,
      avgExecutionMinutes: l.executionCount > 0 ? Math.round(l.executionMinutesSum / l.executionCount) : null,
    })).sort((a, b) => b.totalCases - a.totalCases);
  }

  /**
   * Get delay reason analysis
   */
  async getDelayReasons(filters: {
    from?: Date;
    to?: Date;
    groupBy?: 'reason' | 'coordinator' | 'supplier' | 'location';
  } = {}): Promise<any[]> {
    const where: any = {
      completedAt: { not: null },
      isOnTime: false,
    };

    if (filters.from) where.completedAt.gte = filters.from;
    if (filters.to) where.completedAt.lte = filters.to;

    const cases = await this.prisma.emailCase.findMany({
      where,
      include: {
        email: {
          include: {
            tasks: {
              where: { 
                isRequiredForCase: true,
                completionResult: { in: ['PARTIAL', 'FAILED'] },
              },
              include: { assignee: true },
            },
          },
        },
      },
    });

    // Aggregate by delay reason or other dimensions
    const delayMap = new Map<string, any>();

    for (const caseData of cases) {
      if (!caseData.email) continue;
      for (const task of caseData.email.tasks) {
        const key = this.getDelayGroupKey(task, filters.groupBy || 'reason');
        
        if (!delayMap.has(key)) {
          delayMap.set(key, {
            groupKey: key,
            delayCount: 0,
            partialCount: 0,
            failedCount: 0,
            totalDelayMinutes: 0,
          });
        }

        const d = delayMap.get(key);
        d.delayCount++;
        if (task.completionResult === 'PARTIAL') d.partialCount++;
        if (task.completionResult === 'FAILED') d.failedCount++;

        if (task.completedAt && caseData.caseDueAt) {
          const delayMinutes = Math.round((task.completedAt.getTime() - caseData.caseDueAt.getTime()) / 60000);
          if (delayMinutes > 0) d.totalDelayMinutes += delayMinutes;
        }
      }
    }

    const totalDelays = Array.from(delayMap.values()).reduce((sum, d) => sum + d.delayCount, 0);

    return Array.from(delayMap.values()).map(d => ({
      ...d,
      share: totalDelays > 0 ? (d.delayCount / totalDelays) * 100 : 0,
      avgDelayMinutes: d.delayCount > 0 ? Math.round(d.totalDelayMinutes / d.delayCount) : null,
    })).sort((a, b) => b.delayCount - a.delayCount);
  }

  private getPeriodKey(date: Date, groupBy: string): string {
    const d = new Date(date);
    switch (groupBy) {
      case 'day':
        return d.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      default:
        return d.toISOString().split('T')[0];
    }
  }

  private getDelayGroupKey(task: any, groupBy: string): string {
    switch (groupBy) {
      case 'coordinator':
        return task.assignee?.displayName || task.assignee?.email || 'Unassigned';
      case 'supplier':
        return task.email?.extractedSupplier || 'Unknown';
      case 'location':
        return task.email?.extractedLocation || 'Unknown';
      case 'reason':
      default:
        return task.delayReasonCode || task.delayReasonText || 'Unknown Delay';
    }
  }
}