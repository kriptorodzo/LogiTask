import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { CaseAggregationService } from './case-aggregation.service';
import { ReportsQueryService } from './reports-query.service';
import { KpiSnapshotService } from './kpi-snapshot.service';
import { PerformanceModule } from '../performance/performance.module';

@Module({
  imports: [PerformanceModule],
  controllers: [ReportsController],
  providers: [CaseAggregationService, ReportsQueryService, KpiSnapshotService],
  exports: [CaseAggregationService, ReportsQueryService, KpiSnapshotService],
})
export class ReportsModule {}