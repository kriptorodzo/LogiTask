import { Controller, Get, Post, Body, Query, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { IsString, IsOptional, IsDateString, IsBoolean, IsNumberString, Max, Min } from 'class-validator';
import { CaseAggregationService } from './case-aggregation.service';
import { ReportsQueryService } from './reports-query.service';
import { KpiSnapshotService } from './kpi-snapshot.service';

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
export class ReportsController {
  constructor(
    private readonly caseAggregationService: CaseAggregationService,
    private readonly reportsQueryService: ReportsQueryService,
    private readonly kpiSnapshotService: KpiSnapshotService,
  ) {}

  /**
   * GET /api/reports/overview
   * Returns aggregated KPI metrics for the given filters
   */
  @Get('overview')
  async getOverview(@Query() query: OverviewQueryDto) {
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
   * GET /api/reports/cases
   * Returns case list with filters and pagination
   */
  @Get('cases')
  async getCases(@Query() query: CasesQueryDto) {
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
   */
  @Get('otif/trend')
  async getOtifTrend(@Query() query: TrendQueryDto) {
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
   */
  @Get('coordinators')
  async getCoordinators(@Query() query: CoordinatorsQueryDto) {
    const filters = {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      roleCode: query.roleCode,
    };
    return this.reportsQueryService.getCoordinators(filters);
  }

  /**
   * GET /api/reports/suppliers
   * Returns supplier performance metrics
   */
  @Get('suppliers')
  async getSuppliers(@Query() query: SuppliersQueryDto) {
    const filters = {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    };
    return this.reportsQueryService.getSuppliers(filters);
  }

  /**
   * GET /api/reports/locations
   * Returns location performance metrics
   */
  @Get('locations')
  async getLocations(@Query() query: LocationsQueryDto) {
    const filters = {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    };
    return this.reportsQueryService.getLocations(filters);
  }

  /**
   * GET /api/reports/delays
   * Returns delay reason analysis
   */
  @Get('delays')
  async getDelayReasons(@Query() query: DelaysQueryDto) {
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
   */
  @Post('recalculate')
  async recalculate(@Body() body: RecalculateDto) {
    const { from, to, caseId, rebuildSnapshots } = body;

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
}