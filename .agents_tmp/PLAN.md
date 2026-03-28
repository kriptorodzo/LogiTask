# 1. OBJECTIVE

Implement the Reports & OTIF (On-Time In-Full) module for LogiTask, adding KPI tracking and reporting capabilities focused on:
- OTIF calculation per email case (one source email + all related tasks)
- Approval and execution lead times
- Performance metrics by coordinator, supplier, and location
- Delay reason tracking

The module adds a complete reporting layer with API endpoints and database schema to track, calculate, and expose logistics performance metrics.

# 2. CONTEXT SUMMARY

**Existing System:**
- NestJS backend with Prisma ORM and SQLite database
- Email module: processes incoming emails, extracts supplier/location/date
- Task module: manages tasks created from emails with status workflow
- Existing models: User, Mailbox, Email, Task, TaskDependency, TaskComment, RoutingRule, AuditLog

**Key Technical Constraints:**
- SQLite database (Prisma with sqlite provider)
- String-based enums instead of native Prisma enums for SQLite compatibility
- Existing auth module with Azure AD integration

**New Components Needed:**
- Database: Extended Task model, new EmailCase, TaskStatusHistory, KpiSnapshot tables
- Backend: Reports module with services for case aggregation, KPI calculations, and query APIs
- API: 8 new endpoints under `/api/reports`

# 3. APPROACH OVERVIEW

**Architecture Decision:** Create a dedicated `reports` NestJS module with three core services:
- `CaseAggregationService`: Manages EmailCase lifecycle, recalculates KPI on task changes
- `KpiSnapshotService`: Builds pre-aggregated daily/weekly/monthly snapshots
- `ReportsQueryService`: Handles all query endpoints with filtering and pagination

**Implementation Order:**
1. Phase 1: Database schema - extend Task, add EmailCase, TaskStatusHistory tables
2. Phase 2: Core services - CaseAggregationService, basic case recalculation logic
3. Phase 3: Query APIs - overview, OTIF trend, coordinator/supplier/location reports
4. Phase 4: KpiSnapshot table and snapshot generation for dashboard optimization

**Trigger Points:** KPI recalculation hooks into task status changes, completion results, and case approval events.

# 4. IMPLEMENTATION STEPS

## Phase 1: Database Schema Changes

### Step 1.1: Extend Task Model
- Add new fields to Task model in schema.prisma
- Fields: assignedAt, startedAt, completedAt, completionResult, delayReasonCode, delayReasonText, isRequiredForCase
- Since SQLite doesn't support native enums, use String with check constraints in application logic

**File:** `backend/prisma/schema.prisma`
**Method:** Add fields to existing Task model

### Step 1.2: Create EmailCase Table
- New model for aggregate KPI data per email
- Fields: emailId (unique), classification, priority, supplierName, locationName, deliveryDueAt, caseDueAt, approvedAt, completedAt, isOnTime, isInFull, isOtif, approvalLeadMinutes, executionLeadMinutes, task counts
- Add indexes on caseDueAt, approvedAt, completedAt, supplierName, locationName, isOtif

**File:** `backend/prisma/schema.prisma`
**Method:** Create new EmailCase model

### Step 1.3: Create TaskStatusHistory Table
- Track task status changes for audit and lead time calculation
- Fields: taskId, fromStatus, toStatus, changedByUserId, changedAt, note
- Index on taskId + changedAt

**File:** `backend/prisma/schema.prisma`
**Method:** Create new TaskStatusHistory model

### Step 1.4: Create KpiSnapshot Table
- Pre-aggregated KPI data for dashboard performance
- Fields: periodType, periodStart, periodEnd, dimension filters (roleCode, coordinatorUserId, supplierName, locationName), metrics, rates
- Indexes on period range and dimension fields

**File:** `backend/prisma/schema.prisma`
**Method:** Create new KpiSnapshot model

### Step 1.5: Update Email Model
- Add relation to EmailCase in existing Email model

**File:** `backend/prisma/schema.prisma`
**Method:** Add case relation to Email model

### Step 1.6: Run Database Migration
- Generate Prisma client and run migration
- Add seed data for testing if needed

**File:** `backend/prisma/schema.prisma`
**Method:** Run prisma generate and prisma migrate

---

## Phase 2: Core Services and Basic APIs

### Step 2.1: Create Reports Module Structure
- Create reports module, controller, and three services
- Module structure: reports.module.ts, reports.controller.ts, case-aggregation.service.ts, kpi-snapshot.service.ts, reports-query.service.ts

**File:** `backend/src/reports/`
**Method:** Create NestJS module with basic scaffolding

### Step 2.2: Implement CaseAggregationService
- createCaseForEmail(emailId): Initialize EmailCase when email is created
- recalculateCase(caseId): Recalculate all KPI fields based on related tasks
- getCaseByEmail(emailId): Fetch case with related data
- Implements OTIF logic: On-Time = completedAt <= caseDueAt, In-Full = no PARTIAL/FAILED tasks

**File:** `backend/src/reports/case-aggregation.service.ts`
**Method:** Implement case creation and recalculation logic

### Step 2.3: Add Task Status History Recording
- Extend TaskService to record status changes in TaskStatusHistory
- Hook into updateStatus, approveTask, completeTask methods

**File:** `backend/src/task/task.service.ts`
**Method:** Add task status history recording

### Step 2.4: Implement Trigger Points for Recalculation
- Add call to CaseAggregationService on:
  - Task status change to DONE
  - Task completion result update
  - Case approval (when first task is approved)
  - Task isRequiredForCase flag change

**File:** `backend/src/task/task.service.ts`, `backend/src/reports/case-aggregation.service.ts`
**Method:** Add recalculation hooks in task service

### Step 2.5: Expose Case Detail API
- GET /api/reports/cases endpoint with filtering
- Query params: from, to, otif, onTime, inFull, supplierName, locationName, classification, page, pageSize

**File:** `backend/src/reports/reports.controller.ts`
**Method:** Implement cases endpoint

### Step 2.6: Expose Overview API
- GET /api/reports/overview endpoint
- Query params: from, to, roleCode, supplierName, locationName, coordinatorUserId

**File:** `backend/src/reports/reports.controller.ts`
**Method:** Implement overview endpoint

---

## Phase 3: Advanced Reports

### Step 3.1: Implement OTIF Trend API
- GET /api/reports/otif/trend
- Query params: from, to, groupBy (day/week/month), supplierName, locationName, coordinatorUserId
- Returns time series of OTIF rates

**File:** `backend/src/reports/reports-query.service.ts`, `backend/src/reports/reports.controller.ts`
**Method:** Implement OTIF trend aggregation

### Step 3.2: Implement Coordinator Scorecard API
- GET /api/reports/coordinators
- Query params: from, to, roleCode
- Returns per-coordinator metrics: assigned/completed/partial/failed tasks, OTIF rate, avg completion time

**File:** `backend/src/reports/reports-query.service.ts`, `backend/src/reports/reports.controller.ts`
**Method:** Implement coordinator aggregation

### Step 3.3: Implement Supplier Performance API
- GET /api/reports/suppliers
- Query params: from, to
- Returns per-supplier metrics: total cases, OTIF rate, on-time rate, in-full rate, avg execution time

**File:** `backend/src/reports/reports-query.service.ts`, `backend/src/reports/reports.controller.ts`
**Method:** Implement supplier aggregation

### Step 3.4: Implement Location Performance API
- GET /api/reports/locations
- Query params: from, to

**File:** `backend/src/reports/reports-query.service.ts`, `backend/src/reports/reports.controller.ts`
**Method:** Implement location aggregation

### Step 3.5: Implement Delay Reasons API
- GET /api/reports/delays
- Query params: from, to, groupBy (reason/coordinator/supplier/location)
- Returns delay reason counts and shares

**File:** `backend/src/reports/reports-query.service.ts`, `backend/src/reports/reports.controller.ts`
**Method:** Implement delay reason aggregation

### Step 3.6: Add Recalculate Endpoint
- POST /api/reports/recalculate
- Request body: from, to, caseId, rebuildSnapshots
- Protected: manager/admin only

**File:** `backend/src/reports/reports.controller.ts`
**Method:** Implement recalculation endpoint with auth guard

---

## Phase 4: KPI Snapshots and Optimization

### Step 4.1: Implement KpiSnapshotService
- buildDailySnapshots(from, to): Aggregate by day
- buildWeeklySnapshots(from, to): Aggregate by week
- buildMonthlySnapshots(from, to): Aggregate by month
- Supports filtering by roleCode, coordinatorUserId, supplierName, locationName

**File:** `backend/src/reports/kpi-snapshot.service.ts`
**Method:** Implement snapshot generation logic

### Step 4.2: Add Snapshot Generation to Recalculate Endpoint
- When rebuildSnapshots=true, generate snapshots for the period

**File:** `backend/src/reports/reports.controller.ts`
**Method:** Integrate snapshot building into recalculate

### Step 4.3: Optimize Query Endpoints to Use Snapshots
- Modify ReportsQueryService to check snapshots first for date-range queries

**File:** `backend/src/reports/reports-query.service.ts`
**Method:** Add snapshot-based query path

---

## Phase 5: Frontend Reports Pages

### Step 5.1: Create Reports Overview Page
- Dashboard with KPI cards: OTIF %, On-Time %, In-Full %, Avg Approval Time, Avg Execution Time, Overdue %
- Charts: OTIF trend line, On-time vs Overdue bar, Delay reasons pie/bar

**File:** `frontend/src/app/reports/page.tsx`
**Method:** Create Next.js page with dashboard components

### Step 5.2: Create Coordinator Report Page
- Table with columns: Coordinator, Role, Assigned Tasks, Completed, Partial, Failed, OTIF %, Avg Completion Time, Overdue
- Filters: date range, role

**File:** `frontend/src/app/reports/coordinators/page.tsx`
**Method:** Create coordinator report page

### Step 5.3: Create Case Drilldown Page
- Table with columns: Email Subject, Supplier, Location, Due Date, Completed Date, OTIF, On-Time, In-Full, Lead Times
- Filters: date range, OTIF status, supplier, location

**File:** `frontend/src/app/reports/cases/page.tsx`
**Method:** Create case drilldown page

### Step 5.4: Add Navigation Links
- Add Reports to header navigation
- Add sub-navigation for report sections

**File:** `frontend/src/components/Header.tsx`
**Method:** Add reports links to navigation

# 5. TESTING AND VALIDATION

## Database Schema Validation
- Verify all new tables are created correctly
- Verify indexes are created for performance
- Verify relations between Email and EmailCase, Task and TaskStatusHistory

## API Endpoint Validation
- Test /api/reports/overview returns correct aggregated metrics
- Test /api/reports/otif/trend with different groupBy values
- Test /api/reports/cases with pagination and filters
- Test /api/reports/recalculate triggers correct recalculation

## KPI Calculation Validation
- Create test email with multiple tasks
- Complete tasks with different completionResult values (FULL, PARTIAL, FAILED)
- Verify OTIF calculation: On-Time = completedAt <= caseDueAt, In-Full = no PARTIAL/FAILED
- Verify lead time calculations are accurate

## Integration Testing
- Verify task status changes trigger case recalculation
- Verify case completion sets correct timestamps
- Verify delay reasons are recorded and aggregated correctly

## Frontend Validation
- Verify dashboard displays correct KPI values
- Verify charts render with real data
- Verify filtering and pagination work correctly

---

# 6. PHASE 6: VALIDATION & HARDENING

## 6.1 Objective

Validate that the Reports & OTIF module works accurately, securely, and stably before pilot usage.

## 6.2 Scope

Phase 6 covers 5 areas:
- Functional validation of KPI logic
- API and UI integration testing
- Security and authorization
- Performance and stability
- Operational readiness for pilot

## 6.3 Functional Validation

### 6.3.1 OTIF Scenario Matrix

Create seed/test cases for minimum these scenarios:

1. **Full + On-Time**
   - All required tasks are `DONE`
   - All are `FULL`
   - Case completed before `caseDueAt`
   - Expected: `isOnTime=true`, `isInFull=true`, `isOtif=true`

2. **On-Time + Partial**
   - Case completed before deadline
   - One task is `PARTIAL`
   - Expected: `isOnTime=true`, `isInFull=false`, `isOtif=false`

3. **Late + Full**
   - All tasks are `FULL`
   - Completion after `caseDueAt`
   - Expected: `isOnTime=false`, `isInFull=true`, `isOtif=false`

4. **Late + Partial**
   - Worst case
   - Expected: false / false / false

5. **Failed task**
   - One required task is `FAILED`
   - Expected: `isInFull=false`

6. **Optional task excluded from case**
   - One task has `isRequiredForCase=false`
   - Must NOT break OTIF result

### 6.3.2 Lead Time Validation

Verify accuracy of:
- `approvalLeadMinutes`
- `executionLeadMinutes`
- `avgCompletionMinutes`

Test with known timestamps and compare with calculated values.

### 6.3.3 Recalculation Triggers

For each event confirm `EmailCase` is refreshed:
- Manager approve
- Assign task
- Task status change
- Complete task
- Manager override of `isRequiredForCase`
- Manual recalculate endpoint

**File:** `backend/src/task/task.service.ts`
**Method:** Add trigger calls to CaseAggregationService

---

## 6.4 API and UI Integration Testing

### 6.4.1 Backend API Tests

Cover these endpoints:
- `GET /api/reports/overview`
- `GET /api/reports/cases`
- `GET /api/reports/otif/trend`
- `GET /api/reports/coordinators`
- `GET /api/reports/suppliers`
- `GET /api/reports/locations`
- `GET /api/reports/delays`
- `POST /api/reports/recalculate`

### 6.4.2 Test Dimensions

For each endpoint verify:
- Valid query params
- Empty results
- Pagination
- Invalid date range
- Filters by coordinator/supplier/location
- Unauthorized access
- Malformed request body
- Large result set

**File:** `backend/src/reports/reports.controller.ts`
**Method:** Add DTO validation with class-validator

### 6.4.3 Frontend Validation

On reports pages verify:
- Loading states
- Empty states
- API error states
- Filter reset
- Pagination UX
- Drilldown navigation
- Number accuracy compared to API

**File:** `frontend/src/app/reports/`
**Method:** Add loading skeletons, error fallbacks, empty states

---

## 6.5 Security and Authorization

### 6.5.1 Access Control

Add guards so that:
- `MANAGER` and `ADMIN` have access to all reports endpoints
- Coordinators don't have access to global KPI reports (or have limited personal scorecard)
- Manual recalculate endpoint is only for privileged users

**File:** `backend/src/reports/reports.controller.ts`
**Method:** Add @UseGuards and role-based decorators

### 6.5.2 Audit and Traceability

Verify logging of:
- Who called recalculate
- Who changed task completion result
- Who excluded task from case
- Who accessed administrative reports actions

**File:** `backend/src/reports/reports.controller.ts`, `backend/src/task/task.service.ts`
**Method:** Add audit log creation

### 6.5.3 Input Validation

Ensure:
- Whitelist of query params
- DTO validation for `from/to/groupBy/page/pageSize`
- Reasonable page size limits
- Protection from heavy unbounded queries

**File:** `backend/src/reports/reports.controller.ts`
**Method:** Add class-validator decorators and validation pipe

---

## 6.6 Performance and Stability

### 6.6.1 Dataset Test

Prepare realistic dataset:
- 5,000 emails
- 10,000–15,000 tasks
- 3–6 months history

**File:** `backend/prisma/seed-otif.ts`
**Method:** Create seed script with realistic test data

### 6.6.2 Performance Goals

MVP targets:
- Overview report < 2 sec
- Cases report < 3 sec with pagination
- Trend report < 3 sec
- Recalculate single case < 1 sec
- Bulk recalculate for month in acceptable batch time

**File:** `backend/src/reports/reports-query.service.ts`
**Method:** Optimize queries, add indexes

### 6.6.3 Stability Checks

Verify:
- Repeated recalculation doesn't create wrong values
- Idempotent recompute
- Snapshot jobs don't create duplicate records
- Parallel task updates don't cause race conditions in case aggregation

**File:** `backend/src/reports/case-aggregation.service.ts`
**Method:** Add transaction handling for recalculation

### 6.6.4 Index Validation

For PostgreSQL verify query plans for:
- Cases list
- Overview aggregation
- Coordinator report
- Delay reasons report

If needed, add composite indexes on most common filter combinations.

**File:** `backend/prisma/schema.prisma`
**Method:** Add composite indexes

---

## 6.7 Operational Readiness

### 6.7.1 Monitoring

Add metrics/logging for:
- Number of recalculation jobs
- Failed report queries
- Slow queries
- Snapshot build duration
- API response times

**File:** `backend/src/reports/`
**Method:** Add logging statements

### 6.7.2 Pilot Checklist

Before pilot must confirm:
- KPI numbers manually verified on sample cases
- Role permissions are correct
- Reports UI has no blocking bugs
- Empty/error states are covered
- Export or at least copyable table data is available for manager

**File:** `frontend/src/app/reports/`
**Method:** Add export functionality

### 6.7.3 Recommended Pilot Duration
- 1 week shadow mode
- 2 weeks controlled pilot with real users
- Weekly review of mismatch between system KPI and manual estimation

---

## 6.8 Implementation Steps

### Backend

1. **Add DTO validation for all reports endpoints**
   - Add class-validator decorators to all query DTOs
   - Add validation pipe to controller
   - Add max page size limit (default 100, max 500)

2. **Add role guards for reports module**
   - Create RolesGuard
   - Add @Roles('MANAGER', 'ADMIN') to sensitive endpoints
   - Add personal scorecard endpoint for coordinators

3. **Add integration tests for reports APIs**
   - Create test file with test cases for each endpoint
   - Cover valid params, invalid params, empty results, pagination

4. **Add unit tests for CaseAggregationService**
   - Test OTIF calculation for each scenario
   - Test lead time calculations
   - Test recalculation triggers

5. **Add benchmark script for large dataset**
   - Create script to generate 5000 emails with 15000 tasks
   - Measure query performance
   - Document results

6. **Add safe limits for page size and date range**
   - Max page size: 500
   - Max date range: 1 year
   - Add query timeout handling

### Frontend

1. **Add empty states on all reports pages**
   - Create EmptyState component
   - Add to all report tables when no data

2. **Add error fallback components**
   - Add ErrorBoundary wrapper
   - Show user-friendly error messages

3. **Verify chart/table numbers against API**
   - Compare frontend display with API response
   - Fix any discrepancies

4. **Add filter validation UX**
   - Show validation errors for invalid dates
   - Reset filters button

5. **Add loading skeletons where missing**
   - Add skeleton loaders for all async data

### QA / Product

1. **Prepare OTIF validation scenarios**
   - Create test data for 6 OTIF scenarios
   - Document expected results

2. **Manually verify 20 sample cases**
   - Pick 20 real cases from database
   - Manually calculate OTIF
   - Compare with system values

3. **Confirm access policy with manager users**
   - Review role permissions
   - Document final access matrix

4. **Run pilot checklist**
   - Complete all items in pilot checklist
   - Report results

---

## 6.9 QA Test Cases Implementation

The following test cases from the QA Test Cases document must be implemented as automated tests:

### 6.9.1 OTIF Logic Test Cases (from QA doc Section 2)

| ID | Test Case | Implementation |
|----|-----------|----------------|
| OTIF-001 | Full + On-Time case | Unit test: create 2 required tasks with FULL completion before caseDueAt, verify isOnTime=true, isInFull=true, isOtif=true |
| OTIF-002 | On-Time + Partial case | Unit test: one task FULL, one task PARTIAL before deadline, verify isInFull=false, isOtif=false |
| OTIF-003 | Late + Full case | Unit test: all tasks FULL but completed after caseDueAt, verify isOnTime=false |
| OTIF-004 | Late + Partial case | Unit test: mixed FULL/PARTIAL after deadline, verify all false |
| OTIF-005 | Failed task breaks In-Full | Unit test: one task FAILED, verify isInFull=false |
| OTIF-006 | Optional task excluded | Unit test: optional task with isRequiredForCase=false, verify doesn't affect OTIF |
| OTIF-007 | Cancelled required task | Unit test: one task CANCELLED with isRequiredForCase=true, verify not In-Full |
| OTIF-008 | Manager removes cancelled from case | Unit test: set isRequiredForCase=false on cancelled, recalculate |
| OTIF-009 | Case completedAt = max(task.completedAt) | Unit test: verify case.completedAt equals latest task.completedAt |
| OTIF-010 | Case due date from tasks | Integration test: verify caseDueAt derivation logic |

### 6.9.2 Lead Time Test Cases (from QA doc Section 3)

| ID | Test Case | Implementation |
|----|-----------|----------------|
| LT-001 | Approval lead time | Unit test: verify approvalLeadMinutes = approvedAt - receivedAt |
| LT-002 | Execution lead time | Unit test: verify executionLeadMinutes = completedAt - approvedAt |
| LT-003 | Task completion time | Unit test: verify avgCompletionMinutes calculation |
| LT-004 | StartedAt doesn't break metrics | Unit test: verify startedAt doesn't affect completion KPIs |
| LT-005 | Null approvedAt handling | Integration test: verify null handling in reports overview |

### 6.9.3 Recalculation Trigger Test Cases (from QA doc Section 4)

| ID | Test Case | Implementation |
|----|-----------|----------------|
| REC-001 | Recalculate on task approval | Integration test: approve task, verify case recalculates |
| REC-002 | Recalculate on status DONE | Integration test: change to DONE, verify KPI fields update |
| REC-003 | Recalculate on completeTask | Integration test: call completeTask, verify case updates |
| REC-004 | Recalculate on required flag change | Integration test: change flag, verify recalculation |
| REC-005 | Manual recalculate endpoint | API test: POST recalculate, verify rebuild |
| REC-006 | Idempotent recalculation | Integration test: call 3 times, verify same result |

### 6.9.4 Reports API Test Cases (from QA doc Section 5)

All API tests to be implemented in `backend/test/reports.api.spec.ts`:

**Overview Endpoint (API-OV-001 to API-OV-005)**
- Valid range returns 200 with totals/rates/leadTimes
- Empty dataset returns 200 with zero values
- Invalid date returns 400
- Filter by supplier works correctly
- Unauthorized returns 401/403

**Cases Endpoint (API-CA-001 to API-CA-005)**
- Default pagination works
- otif=true filter works
- locationName filter works
- pageSize over limit returns 400 or clamps
- Invalid date range (from > to) returns 400

**Trend Endpoint (API-TR-001 to API-TR-003)**
- groupBy=day returns daily series
- groupBy=week returns weekly series
- Invalid groupBy returns 400

**Other Endpoints**
- Coordinator filter by roleCode works
- Supplier performance returns items with KPI
- Location performance returns items
- Delays groupBy=reason/coordinator works

### 6.9.5 Authorization Test Cases (from QA doc Section 6)

| ID | Test Case | Implementation |
|----|-----------|----------------|
| AUTH-001 | Manager access to reports | E2E test: login as MANAGER, access reports |
| AUTH-002 | Admin access to recalculate | E2E test: login as ADMIN, call recalculate |
| AUTH-003 | Coordinator blocked from overview | E2E test: login as coordinator, access /reports |
| AUTH-004 | Coordinator blocked from recalculate | E2E test: login as coordinator, call recalculate |
| AUTH-005 | Anonymous blocked | E2E test: no auth, access reports API |

### 6.9.6 Frontend UI Test Cases (from QA doc Section 7)

| ID | Test Case | Implementation |
|----|-----------|----------------|
| UI-001 | Loading state | Manual test: open reports with slow API |
| UI-002 | Error state | Manual test: simulate API failure |
| UI-003 | Empty state | Manual test: query period with no data |
| UI-004 | Reset filters | Manual test: set filters, click reset |
| UI-005 | Table rendering | Manual test: verify KPI values match API |
| UI-006 | Pagination | Manual test: navigate pages |
| UI-007 | Drilldown consistency | Manual test: compare row to API |
| UI-008 | Date filter UX | Manual test: invalid date range |

### 6.9.7 Performance Test Cases (from QA doc Section 8)

| ID | Test Case | Dataset | Target |
|----|-----------|---------|--------|
| PERF-001 | Overview under load | 5,000 cases | < 2 sec |
| PERF-002 | Cases pagination | 5,000 cases | < 3 sec |
| PERF-003 | Trend aggregation | 6 months | < 3 sec |
| PERF-004 | Recalculate single | Large dataset | < 1 sec |
| PERF-005 | Recalculate monthly batch | Large dataset | Acceptable batch time |

---

## 6.10 Suggested Test Data Set

Create seed script with minimum dataset:
- 20 email cases
- 40–60 tasks
- 3 suppliers (e.g., Eroglu, TestSupplier1, TestSupplier2)
- 3 locations (e.g., Stip, Skopje, Bitola)
- 3 coordinators (different roles)
- Cases covering all OTIF scenarios:
  - on-time/full
  - on-time/partial
  - late/full
  - late/partial
  - failed
  - optional excluded task
  - cancelled task

**File:** `backend/prisma/seed-otif.ts`
**Method:** Create comprehensive seed data

---

## 6.11 Exit Checklist

Phase 6 QA is complete when:
- [ ] All OTIF logic test cases pass
- [ ] Lead time calculations are accurate
- [ ] Recalculation trigger test cases pass
- [ ] Reports API endpoints return accurate results
- [ ] Authorization rules are correct
- [ ] Frontend pages have stable loading/error/empty states
- [ ] Performance is within acceptable limits for pilot

---

## 6.12 Deliverables of Phase 6

### Must produce
- Automated test suite for reports module
- OTIF validation scenarios dataset
- Authorization matrix
- Performance benchmark notes
- Pilot readiness checklist
- Bug list and remediation actions

### Exit criteria
Phase 6 is complete when:
- OTIF calculations are verified on defined scenarios
- API endpoints are tested functionally and securely
- UI is stable for manager usage
- Role-based access is closed
- Query performance is acceptable for pilot
- Pilot checklist is green
