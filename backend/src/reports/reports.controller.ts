import { Controller, Get, Post, Body, Query, UseGuards, ValidationPipe, UsePipes, Req, BadRequestException } from '@nestjs/common';
import { IsString, IsOptional, IsDateString, IsBoolean, IsNumberString, Max, Validate } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { getAuthGuard } from '../common/utils/auth.utils';
import { CaseAggregationService } from './case-aggregation.service';
import { ReportsQueryService } from './reports-query.service';
import { KpiSnapshotService } from './kpi-snapshot.service';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { PerformanceService } from '../performance/performance.service';

// Helper to validate date range is within 1 year
function validateDateRange(from?: string, to?: string): void {
  if (!from || !to) return;
  
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  
  if (fromDate < oneYearAgo || toDate > now || fromDate > toDate) {
    throw new BadRequestException('Date range must be within the last year and from must be before to');
  }
}

class RecalculateDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  caseId?: string;

  @IsOptional()
  @IsBoolean()
  rebuildSnapshots?: boolean;
}

class CasesQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  otif?: string;

  @IsOptional()
  @IsString()
  onTime?: string;

  @IsOptional()
  @IsString()
  inFull?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  locationName?: string;

  @IsOptional()
  @IsString()
  classification?: string;

  @IsOptional()
  @IsNumberString()
  @Max(500)
  page?: string;

  @IsOptional()
  @IsNumberString()
  @Max(500)
  pageSize?: string;
}

class OverviewQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  roleCode?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  locationName?: string;

  @IsOptional()
  @IsString()
  coordinatorUserId?: string;
}

class TrendQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  groupBy?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  locationName?: string;

  @IsOptional()
  @IsString()
  coordinatorUserId?: string;
}

class CoordinatorsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  roleCode?: string;
}

class SuppliersQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

class LocationsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

class DelaysQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  groupBy?: string;
}

@Controller('api/reports')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(getAuthGuard())
export class ReportsController {
  constructor(
    private readonly caseAggregationService: CaseAggregationService,
    private readonly reportsQueryService: ReportsQueryService,
    private readonly kpiSnapshotService: KpiSnapshotService,
    private readonly performanceService: PerformanceService,
  ) {}

  /**
   * GET /api/reports/overview
   * Returns aggregated KPI metrics for the given filters
   * Requires MANAGER or ADMIN role
   */
  @Get('overview')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  async getOverview(@Query() query: OverviewQueryDto) {
    validateDateRange(query.from, query.to);
    const filters = {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      roleCode: query.roleCode,
      supplierName: query.supplierName,
      locationName: query.locationName,
      coordinatorUserId: query.coordinatorUserId,
    };
    return this.reportsQueryService.getOverview(filters);
  }

  /**
   * GET /api/reports/my-scorecard
   * Returns current user's personal performance metrics
   * Available to all authenticated users (coordinators see their own data)
   */
  @Get('my-scorecard')
  async getMyScorecard(@Query() query: CoordinatorsQueryDto, @Req() req: any) {
    validateDateRange(query.from, query.to);
    const filters = {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      roleCode: query.roleCode,
      // Filter by current user's ID
      coordinatorUserId: req.user?.id,
    };
    return this.reportsQueryService.getCoordinators(filters);
  }

  /**
   * GET /api/reports/cases
   * Returns case list with filters and pagination
   * Requires MANAGER or ADMIN role
   */
  @Get('cases')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  async getCases(@Query() query: CasesQueryDto) {
    validateDateRange(query.from, query.to);
    const filters = {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      otif: query.otif === 'true' ? true : query.otif === 'false' ? false : undefined,
      onTime: query.onTime === 'true' ? true : query.onTime === 'false' ? false : undefined,
      inFull: query.inFull === 'true' ? true : query.inFull === 'false' ? false : undefined,
      supplierName: query.supplierName,
      locationName: query.locationName,
      classification: query.classification,
      page: query.page ? parseInt(query.page, 10) : undefined,
      pageSize: query.pageSize ? parseInt(query.pageSize, 10) : undefined,
    };
    return this.caseAggregationService.getCases(filters);
  }

  /**
   * GET /api/reports/otif/trend
   * Returns OTIF trend data aggregated by time period
   * Requires MANAGER or ADMIN role
   */
  @Get('otif/trend')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  async getOtifTrend(@Query() query: TrendQueryDto) {
    validateDateRange(query.from, query.to);
    const filters = {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      groupBy: (query.groupBy as 'day' | 'week' | 'month') || 'day',
      supplierName: query.supplierName,
      locationName: query.locationName,
      coordinatorUserId: query.coordinatorUserId,
    };
    return this.reportsQueryService.getOtifTrend(filters);
  }

  /**
   * GET /api/reports/coordinators
   * Returns coordinator performance metrics
   * Requires MANAGER or ADMIN role
   */
  @Get('coordinators')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  async getCoordinators(@Query() query: CoordinatorsQueryDto) {
    validateDateRange(query.from, query.to);
    const filters = {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      roleCode: query.roleCode,
    };
    const coordinators = await this.reportsQueryService.getCoordinators(filters);
    
    // Enrich with bonus data from Performance v2
    const month = query.from ? new Date(query.from).getMonth() + 1 : new Date().getMonth() + 1;
    const year = query.from ? new Date(query.from).getFullYear() : new Date().getFullYear();
    
    // Get bonus data for each coordinator
    const enrichedCoordinators = await Promise.all(
      (coordinators as any[]).map(async (coordinator) => {
        try {
          const scorecard = await this.performanceService.getScorecard(coordinator.userId, month, year);
          return {
            ...coordinator,
            bonusScore: scorecard?.totalScore || 0,
            bonusEligible: scorecard?.bonusEligible || false,
            bonusCategory: scorecard?.bonusEligible 
              ? (scorecard.totalScore >= 90 ? 'GOLD' : scorecard.totalScore >= 75 ? 'SILVER' : scorecard.totalScore >= 60 ? 'BRONZE' : 'NONE')
              : 'NONE',
          };
        } catch {
          return {
            ...coordinator,
            bonusScore: 0,
            bonusEligible: false,
            bonusCategory: 'NONE',
          };
        }
      })
    );
    
    return enrichedCoordinators;
  }

  /**
   * GET /api/reports/suppliers
   * Returns supplier performance metrics
   * Requires MANAGER or ADMIN role
   */
  @Get('suppliers')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  async getSuppliers(@Query() query: SuppliersQueryDto) {
    validateDateRange(query.from, query.to);
    const filters = {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    };
    return this.reportsQueryService.getSuppliers(filters);
  }

  /**
   * GET /api/reports/locations
   * Returns location performance metrics
   * Requires MANAGER or ADMIN role
   */
  @Get('locations')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  async getLocations(@Query() query: LocationsQueryDto) {
    validateDateRange(query.from, query.to);
    const filters = {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    };
    return this.reportsQueryService.getLocations(filters);
  }

  /**
   * GET /api/reports/delays
   * Returns delay reason analysis
   * Requires MANAGER or ADMIN role
   */
  @Get('delays')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  async getDelayReasons(@Query() query: DelaysQueryDto) {
    validateDateRange(query.from, query.to);
    const filters = {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      groupBy: (query.groupBy as 'reason' | 'coordinator' | 'supplier' | 'location') || 'reason',
    };
    return this.reportsQueryService.getDelayReasons(filters);
  }

  /**
   * POST /api/reports/recalculate
   * Recalculates KPI for cases in the given range and optionally rebuilds snapshots
   * Requires MANAGER or ADMIN role
   */
  @Post('recalculate')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  async recalculate(@Body() body: RecalculateDto, @Req() req: any) {
    const { from, to, caseId, rebuildSnapshots } = body;
    
    // Validate date range if provided
    if (from && to) {
      validateDateRange(from, to);
    }
    
    // Log who triggered recalculate (audit)
    console.log(`[AUDIT] User ${req.user?.email} (role: ${req.user?.role}) triggered recalculate at ${new Date().toISOString()}`);

    let cases: any[] = [];

    if (caseId) {
      // Recalculate specific case
      const recalculated = await this.caseAggregationService.recalculateCase(caseId);
      cases = [recalculated];
    } else if (from && to) {
      // Recalculate all cases in date range
      const result = await this.caseAggregationService.getCases({
        from: new Date(from),
        to: new Date(to),
        pageSize: 1000,
      });
      
      for (const c of result.cases) {
        await this.caseAggregationService.recalculateCase(c.id);
      }
      cases = result.cases;
    } else {
      return { message: 'Please provide either caseId or from/to dates' };
    }

    // Rebuild snapshots if requested
    if (rebuildSnapshots && from && to) {
      await this.kpiSnapshotService.buildDailySnapshots(new Date(from), new Date(to));
      await this.kpiSnapshotService.buildWeeklySnapshots(new Date(from), new Date(to));
      await this.kpiSnapshotService.buildMonthlySnapshots(new Date(from), new Date(to));
    }

    return {
      recalculatedCases: cases.length,
      snapshotsRebuilt: rebuildSnapshots || false,
    };
  }

  /**
   * GET /api/reports/overview-v2
   * Returns dashboard overview with case status breakdown and KPI metrics
   * Requires MANAGER or ADMIN role
   */
  @Get('overview-v2')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  async getOverviewV2(@Query() query: OverviewQueryDto) {
    const filters = {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      roleCode: query.roleCode,
      supplierName: query.supplierName,
      locationName: query.locationName,
      coordinatorUserId: query.coordinatorUserId,
    };

    // Get all cases for the period (or all if no dates)
    const where: any = {};
    if (filters.from || filters.to) {
      where.completedAt = {};
      if (filters.from) where.completedAt.gte = filters.from;
      if (filters.to) where.completedAt.lte = filters.to;
    }
    if (filters.supplierName) where.supplierName = filters.supplierName;
    if (filters.locationName) where.locationName = filters.locationName;

    const allCases = await this.caseAggregationService.getAllCasesForOverview(where);
    
    // Count by status
    const statusCounts: Record<string, number> = {
      NEW: 0,
      PROPOSED: 0,
      APPROVED: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      PARTIAL: 0,
      FAILED: 0,
      CANCELLED: 0,
    };

    // KPI calculations
    let totalCases = 0;
    let casesWithKpiData = 0; // Cases where we have calculated KPI (isOtif !== null)
    let otifCases = 0;
    let onTimeCases = 0;
    let inFullCases = 0;
    let overdueCases = 0;
    let totalApprovalMinutes = 0;
    let totalExecutionMinutes = 0;
    let casesWithApprovalMinutes = 0;
    let casesWithExecutionMinutes = 0;

    for (const c of allCases) {
      totalCases++;
      
      // Count by status
      const status = c.caseStatus || 'NEW';
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      } else {
        statusCounts['NEW']++;
      }

      // Only count KPIs for cases that have KPI data calculated
      if (c.isOtif !== null) {
        casesWithKpiData++;
      }

      // OTIF calculations (only for cases where we have data)
      if (c.isOtif === true) otifCases++;
      if (c.isOnTime === true) onTimeCases++;
      if (c.isInFull === true) inFullCases++;
      
      // Overdue: due date passed and not DONE/CANCELLED
      if (c.caseDueAt && new Date(c.caseDueAt) < new Date() && 
          !['DONE', 'CANCELLED', 'PARTIAL', 'FAILED'].includes(c.caseStatus)) {
        overdueCases++;
      }

      // Lead times
      if (c.approvalLeadMinutes && c.approvalLeadMinutes > 0) {
        totalApprovalMinutes += c.approvalLeadMinutes;
        casesWithApprovalMinutes++;
      }
      if (c.executionLeadMinutes && c.executionLeadMinutes > 0) {
        totalExecutionMinutes += c.executionLeadMinutes;
        casesWithExecutionMinutes++;
      }
    }

    // Calculate rates based on cases with KPI data
    // If no KPI data available, show 0 and don't show misleading percentages
    const otifRate = casesWithKpiData > 0 ? Math.round((otifCases / casesWithKpiData) * 100) : 0;
    const onTimeRate = casesWithKpiData > 0 ? Math.round((onTimeCases / casesWithKpiData) * 100) : 0;
    const inFullRate = casesWithKpiData > 0 ? Math.round((inFullCases / casesWithKpiData) * 100) : 0;
    const avgApprovalMinutes = casesWithApprovalMinutes > 0 ? Math.round(totalApprovalMinutes / casesWithApprovalMinutes) : 0;
    const avgExecutionMinutes = casesWithExecutionMinutes > 0 ? Math.round(totalExecutionMinutes / casesWithExecutionMinutes) : 0;

    return {
      totalCases,
      casesWithKpiData,
      statusCounts,
      kpis: {
        otifRate,
        otifCases,
        onTimeRate,
        onTimeCases,
        inFullRate,
        inFullCases,
        overdueCases,
        avgApprovalMinutes,
        avgExecutionMinutes,
      },
      filters: {
        from: query.from,
        to: query.to,
        supplierName: query.supplierName,
        locationName: query.locationName,
      },
    };
  }

  /**
   * GET /api/reports/cases-by-status
   * Returns cases filtered by specific status for drilldown
   * Requires MANAGER or ADMIN role
   */
  @Get('cases-by-status')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  async getCasesByStatus(@Query() query: any) {
    const status = query.status;
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) where.caseStatus = status;
    if (query.from || query.to) {
      where.completedAt = {};
      if (query.from) where.completedAt.gte = new Date(query.from);
      if (query.to) where.completedAt.lte = new Date(query.to);
    }
    if (query.supplierName) where.supplierName = query.supplierName;
    if (query.locationName) where.locationName = query.locationName;

    const [cases, total] = await Promise.all([
      this.caseAggregationService.getCases({
        ...where,
        page,
        pageSize,
      }),
      this.caseAggregationService.getCasesCount(where),
    ]);

    return {
      cases: cases.cases,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}