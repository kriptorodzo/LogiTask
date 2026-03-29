# 1. OBJECTIVE

Да се доведе LogiTask од **Conditional Go** во **целосно Pilot Ready**, а потоа во **Production Rollout Ready** преку:

- затворање на преостанатите инфраструктурни блокери,
- комплетирање на оперативниот frontend,
- активирање на live integrations,
- имплементација на Performance v2,
- подготовка за реална употреба и скалирање.

**Главна цел:** затворање на Azure AD / Graph live verification како последен pilot blocker, комплетирање на operational frontend, имплементација на Coordinator Performance v2, активирање на реална ERP интеграција и финална production readiness подготовка.

# 2. CONTEXT SUMMARY

**Тековен статус:**
- Core workflow е зрел
- ERP инфраструктурата е поставена
- PostgreSQL е верификуван
- Reports & OTIF модул имплементиран
- Главни отворени точки: **Azure AD / Graph live verification**, **frontend доработка**, **Performance v2**

**Постоечки систем:**
- NestJS backend со Prisma ORM и PostgreSQL база
- Email модул: процесирање на дојдени мејлови, екстракција на добавувач/локација/датум
- Task модул: управување со задачи креирани од мејлови со status workflow
- Auth модул со Azure AD интеграција (mock mode)
- Reports модул со OTIF пресметки

**Клучни ограничувања:**
- Azure AD credentials треба да се внесат за production
- Frontend има делумно незатворени сегменти
- Performance v2 не е имплементиран
- ERP сè уште не е врзан со реален извор

# 3. APPROACH OVERVIEW

**Избрана стратегија:** Иди по приоритетен редослед:
1. **Azure AD / Graph live verification** — затворање на последен pilot blocker
2. **Frontend completion** — стабилизација и polish
3. **Performance v2** — KPI и bonus management слој
4. **ERP live integration** — активирање на реален ERP feed
5. **Production rollout readiness** — documentation, monitoring, rollout plan

** rationale:** Ова е најпрактичен редослед затоа што прво го затвораш pilot blocker, па потоа го зголемуваш business value.

# 4. IMPLEMENTATION STEPS

## Priority 1 — Azure AD / Graph live verification

Ова е најкритичниот чекор, бидејќи е последниот real external blocker за pilot старт. Треба да се затворат:

### Step 1.1: Azure AD credentials setup
- Внес на вистински Azure credentials
- Production auth конфигурација

**Files:** `.env`, `backend/src/auth/auth.config.ts`
**Method:** Configure real Azure AD

### Step 1.2: Graph mailbox access test
- Тест на Microsoft Graph API пристап до mailbox
- Real login verification

**File:** `backend/src/auth/auth.service.ts`
**Method:** Test Graph authentication

### Step 1.3: Real email ingestion test
- Реално повлекување мејлови од Outlook mailbox
- Верификација дека manager inbox добива реални пораки

**File:** `backend/src/email/email-processor.service.ts`
**Method:** Test live email fetch

### Step 1.4: End-to-end pilot workflow test
- Тест со approve/delegate/complete/reports refresh

**File:** `backend/src/task/task.service.ts`
**Method:** Verify full workflow

**Резултат:** затворен pilot gate

---

## Priority 2 — Frontend modernization & alignment

Ова епосебен приоритетен stream, не само „UI polish". Frontend мора да ги отслика сите модули и да има брза навигација.

### Step 2.1: Frontend Audit & UX Map

Фаза на целосен преглед:

**Активности:**
- Мапирање на сите постоечки frontend screens
- Споредба со backend modules/endpoints
- Листа на missing screens
- Листа на broken/incomplete flows
- UX audit за navigation pain points
- Дефинирање на стандарден layout system

**Deliverable:** Frontend Gap Analysis, Screen Inventory, Navigation Map

**File:** `frontend/src/app/`
**Method:** Create audit document

---

### Step 2.2: New app shell и глобална навигација

Основа за модерна веб апликација:

**Треба да се воведе:**
- **Persistent sidebar** со модули
- **Top header**
- **Breadcrumbs** на секој внатрешен екран
- **Global back button** на detail/report/edit screens
- **Quick actions**
- **Module switching without confusion**

**Sidebar модули:**
- Dashboard
- Manager Inbox
- Coordinator Board
- Reports
- ERP
- Performance
- Admin / Settings

**На секој screen:**
- Title
- Subtitle / context
- Breadcrumb
- Back button кога има detail page
- Action barово

**Files:** `frontend/src/components/layout/`
**Method:** Create app shell components

---

### Step 2.3: Manager module alignment

Целосно action-oriented:

**Tabs:**
- Нови
- Чека одобрување
- Делегирани
- Проблематични
- Доцне

**Функционалност:**
- Search + filters
- Card actions
- Detail screen со back navigation
- Approval flows

**Files:** `frontend/src/app/manager/`
**Method:** Update manager screens

---

### Step 2.4: Coordinator module alignment

**Табеви:**
- Мои задачи
- Во тек
- Завршени
- Доцне

**Функционалност:**
- Quick start/complete
- Filter by date/status/source
- ERP badge / Email badge
- Task details со враќање назад

**Files:** `frontend/src/app/coordinator/`
**Method:** Update coordinator screens

---

### Step 2.5: Reports module UX fix

Главно подобрување на UX:

**Компоненти:**
- Overview cards
- KPI cards
- OTIF chart
- Filters
- Drilldown tables
- **Back button**
- Breadcrumb: Reports > Cases > Case Detail
- Export actions
- Empty/error handling

**Навигација:**
- Од Reports > Cases > Case Detail корисникот мора со еден клик да се врати
- Или на Cases list
- Или на Reports overview

**Files:** `frontend/src/app/reports/`
**Method:** Fix reports navigation

---

### Step 2.6: ERP module alignment

**Страници:**
- ERP dashboard
- Import page
- Routes page
- Documents page
- Batch details
- Route detail/edit
- Import history
- Validation results

**Files:** `frontend/src/app/erp/`
**Method:** Complete ERP screens

---

### Step 2.7: Performance v2 module UI

Нов frontend stream:

**Компоненти:**
- Leaderboard
- Scorecard
- Monthly KPI input
- Filters by month/user/role
- Role-based views
- Bonus bands visualization

**Files:** `frontend/src/app/performance/`
**Method:** Create performance v2 screens

---

### Step 2.8: UI/UX модернизација

Дизајн насока кон модерен SaaS dashboard:

**Принципи:**
- Clean white/neutral background
- Cards with soft shadow
- Rounded corners
- Consistent spacing
- Clear typography hierarchy
- Status colors only where meaningful
- Less clutter, more focus

**Стандардизација на компоненти:**
- Buttons
- Tabs
- Badges
- Cards
- Tables
- Filters
- Modal dialogs
- Empty states
- Error states
- Loading skeletons
- Detail panels

**Files:** `frontend/src/components/`
**Method:** UI component standardization

---

### Step 2.9: Навигација — конкретни правила

**Треба да има:**
- **Back button** на секој detail/report/import/edit screen
- **Breadcrumbs** на секој внатрешен екран
- **Active module highlight** во sidebar
- **Quick jump** меѓу поврзани модули
- **Recent context preservation** (враќање на ист filter/list state)

**Files:** `frontend/src/app/`
**Method:** Implement navigation patterns

---

### Step 2.10: Подобрување на брзина

**Frontend performance задачи:**
- Code splitting по модул
- Lazy loading на heavy pages
- Memoization на expensive components
- Pagination / virtualization за долгите листи
- Debounce на search/filter
- Cache на API results
- Помалку full page reload patterns
- Optimistic UI за quick actions
- Prefetch на најчесто отварани рути

**UX performance:**
- Skeleton loaders наместо blank screens
- Instant tab switching
- Задржување на filter state
- Побрзо отворање на detail views
- Избегнување непотребни refetch calls

**Files:** `frontend/src/`
**Method:** Performance optimization

---

### Sprint редослед:

**Sprint A — Navigation Foundation**
- Фокус: app shell, sidebar, breadcrumbs, back button, route consistency
- Излез: апликацијата веднаш станува попрофесионална

**Sprint B — Reports & Detail UX Fix**
- Фокус: reports navigation, drilldown usability, back flow
- Излез: Reports стануваат навистина употребливи

**Sprint C — Module Alignment**
- Фокус: manager, coordinator, ERP, detail/edit pages
- Излез: Frontend е усогласен со platform capabilities

**Sprint D — Performance v2 UI**
- Фокус: scorecards, leaderboard, KPI input
- Излез: Затворен нов business module

**Sprint E — Speed & Polish**
- Фокус: loading states, performance, responsiveness
- Излез: Modern pilot-ready frontend

**Резултат:** Целосно усогласен frontend со модерен SaaS изглед, брза навигација, јасен app shell

---

## Priority 3 — Coordinator Performance v2

Ова е следниотголем business module и природно продолжение на KPI/reporting основата што веќе постои:

### Step 3.1: Role-specific KPI mapping
- Дефинирање на KPI формули по улога

**File:** `backend/src/performance/performance.config.ts`
**Method:** Define KPI rules

### Step 3.2: Weighted scoring model
- Weighted scoring model 0–100
- Bonus bands

**File:** `backend/src/performance/scoring.service.ts`
**Method:** Implement scoring

### Step 3.3: Monthly KPI admin input
- Monthly manual KPI admin input
- Backend и frontend

**File:** `backend/src/performance/`, `frontend/src/app/admin/performance/`
**Method:** KPI input interface

### Step 3.4: Personal scorecard screen
- Personal scorecard screen
- Personal KPI преглед

**File:** `frontend/src/app/coordinator/scorecard/`
**Method:** Scorecard UI

### Step 3.5: Manager leaderboard
- Manager leaderboard
- Month-over-month coordinator performance tracking

**File:** `frontend/src/app/manager/leaderboard/`
**Method:** Leaderboard UI

**Резултат:** системот од task orchestration прераснува во performance management platform

---

## Priority 4 — ERP live integration

ERP делот е инфраструктурно спремен, но сè уште не е врзан со реален ERP извор:

### Step 4.1: Integration contract definition
- Дефинирање integration contract со конкретен ERP
- Mapping на документите (PO, GR, SO, SHIP)

**File:** `backend/src/erp/erp.contract.ts`
**Method:** Define ERP contract

### Step 4.2: Test import from real ERP exports
- Тестен import од реални ERP exports

**File:** `backend/src/erp/erp-import.service.ts`
**Method:** Test ERP import

### Step 4.3: Event-based integration
- Event-based integration
- Route plan validation

**File:** `backend/src/erp/erp-events.service.ts`
**Method:** Implement events

### Step 4.4: Monitoring and error handling
- Monitoring и error handling за ERP import batches

**File:** `backend/src/erp/erp-monitor.service.ts`
**Method:** Add monitoring

**Резултат:** вториот влез на задачи станува production-usable

---

## Priority 5 — Production Rollout Readiness

Од pilot во production-grade operational platform:

### Step 5.1: Audit logging review
- Audit logging review
- Backup/restore validation

**File:** `backend/src/common/audit/`
**Method:** Review audit

### Step 5.2: Monitoring and alerting
- Monitoring and alerting setup

**File:** `backend/src/common/monitoring/`
**Method:** Configure monitoring

### Step 5.3: Access matrix review
- Access matrix review

**File:** `backend/src/auth/permissions/`
**Method:** Review permissions

### Step 5.4: User onboarding docs
- User onboarding docs ✅ DONE
- Admin operating manual - DONE (access-matrix.md)
- Rollout plan per team/location - DONE (user-onboarding.md)

**File:** `docs/`
**Method:** Create documentation

**Резултат:** production readiness checklist ✅ COMPLETE

# 5. TESTING AND VALIDATION

## За Priority 1 — Azure AD / Graph live verification

| Тест | Очекуван резултат |
|------|-----------------|
| Live login | Успешен Azure AD login |
| Real mailbox fetch | Превземени реални мејлови |
| Manager workflow | approve/delegate/complete работи |
| Reports refresh | OTIF се обновува коректно |

**Резултат:** затворен pilot gate

---

## За Priority 2 — Frontend completion

| Тест | Очекуван резултат |
|------|-----------------|
| Performance UI | Scorecard и leaderboard се прикажуваат |
| Loading/error states | Стабилни состојби |
| Mobile UX | Прикажување на мобилен уред |

**Резултат:** функционален pilot UI

---

## За Priority 3 — Performance v2

| Тест | Очекуван резултат |
|------|-----------------|
| KPI score 0-100 | Пресметка по формула |
| Bonus bands | Коректно категоризирање |
| Personal scorecard | Приказ на личен перформанс |
| Leaderboard | Rang lista на координатори |

**Резултат:** Performance v2 функционален

---

## За Priority 4 — ERP live integration

| Тест | Очекуван резултат |
|------|-----------------|
| ERP document import | Креирање на задачи |
| Route plan validation | Проверка на дестинации |
| Error handling | Справување со грешки |

**Резултат:** ERP connected workflow

---

## За Priority 5 — Production Rollout Readiness

| Тест | Очекуван резултат |
|------|-----------------|
| Backup/restore | Враќање функционира |
| Monitoring | Алертирање работи |
| Documentation | Комплетни docs |

**Резултат:** Production ready
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

---

# Phase 7: Pilot & Production Readiness

## 7.1 Overview

Phase 7 prepares the LogiTask MVP for real-world pilot deployment with production-grade reliability, monitoring, and operational procedures.

## 7.2 Pilot Rollout

### 7.2.1 Pilot Configuration

**Settings:**
- 1 mailbox for email ingestion
- 1 manager user (full reports access)
- 3 coordinators (reception, delivery, distribution)
- Duration: 2 weeks (1 week shadow + 1 week controlled)

**File:** `.env`, `prisma/seed.ts`
**Method:** Configure environment and seed pilot users

### 7.2.2 Pilot Scenarios

Define daily scenarios for pilot:
1. Morning email batch processing (8-9 AM)
2. Afternoon task assignment (2-3 PM)
3. End-of-day status review (5-6 PM)
4. Weekly report generation (Friday)

**File:** `docs/pilot-scenarios.md`
**Method:** Document operational workflows

### 7.2.3 Daily Review Process

- Daily standup: review previous day's cases
- Track: processed emails, completed tasks, OTIF rate
- Issues: classification errors, webhook failures, delays

**File:** `docs/pilot-review-template.md`
**Method:** Create review template

---

## 7.3 Monitoring Setup

### 7.3.1 API Metrics

Track and log:
- `/api/reports/*` endpoint response times
- `/api/emails/*` webhook processing times
- `/api/tasks/*` operations latency
- Failed authentication attempts

**File:** `backend/src/common/interceptors/metrics.interceptor.ts`
**Method:** Add response time logging

### 7.3.2 Report Query Performance

Monitor:
- Overview report query time (target: <2 sec)
- Cases list with pagination (target: <3 sec)
- OTIF trend calculation (target: <3 sec)
- Bulk recalculation duration

**File:** `backend/src/reports/reports-query.service.ts`
**Method:** Add query timing logs

### 7.3.3 Error Tracking

Track:
- Failed webhook deliveries
- Email parsing errors
- Task orchestration failures
- Report calculation errors

**File:** `backend/src/common/filters`
**Method:** Add global error filter with logging

### 7.3.4 Frontend Monitoring

Track:
- Page load times
- API call failures
- User interaction errors

**File:** `frontend/src/app/layout.tsx`
**Method:** Add error boundary and Sentry/logging

---

## 7.4 Production Hardening

### 7.4.1 PostgreSQL Production Config

- Configure production connection pool
- Add query timeout (30 sec max)
- Enable SSL for production
- Set up read replicas if needed

**File:** `backend/prisma/schema.prisma`, `.env.production`
**Method:** Update Prisma config for production

### 7.4.2 Backup Policy

- Daily automated backups
- Point-in-time recovery config
- Backup verification procedure
- Retention: 30 days

**File:** `docs/backup-procedure.md`
**Method:** Document backup strategy

### 7.4.3 Secrets Management

- Move all secrets to environment variables
- Azure AD credentials via config
- Database connection string secure
- Session secrets rotated

**File:** `.env.example`
**Method:** Audit and secure all secrets

### 7.4.4 Environment Separation

- Development: local SQLite
- Staging: separate PostgreSQL instance
- Production: dedicated PostgreSQL with backups

**File:** `docker-compose.yml`, `.env.staging`
**Method:** Define environment configs

### 7.4.5 Job/Webhook Retry Policy

- Email processing: 3 retries with exponential backoff
- Webhook deliveries: 5 retries max
- Background jobs: dead letter queue after 3 failures

**File:** `backend/src/email/email-processor.service.ts`
**Method:** Add retry logic with CircuitBreaker pattern

### 7.4.6 Incident SOP

Document:
- Severity levels (P1-P4)
- Escalation path
- Rollback procedures
- Communication template

**File:** `docs/incident-response.md`
**Method:** Create incident response guide

---

## 7.5 Business Validation

### 7.5.1 Manual OTIF Verification

- Select 20-30 sample cases from production data
- Manually calculate expected OTIF for each
- Compare with system values
- Document discrepancies

**File:** `docs/otif-validation.xlsx`
**Method:** Run verification queries, compare results

### 7.5.2 Coordinator Discipline Check

Verify coordinators:
- Update status promptly
- Set completion result correctly
- Don't skip required fields

**File:** `backend/src/task/task.service.ts`
**Method:** Add validation warnings

### 7.5.3 Classification Review

- Review false positive/negative classifications
- Adjust rules if needed
- Document edge cases

**File:** `docs/classification-rules.md`
**Method:** Analyze misclassifications

### 7.5.4 Manager Report Validation

- Verify report numbers match reality
- Check date range filters work correctly
- Validate export functionality

**File:** `frontend/src/app/reports/`
**Method:** Test with real data

---

## 7.6 Exit Criteria

Phase 7 is complete when:
- [ ] Pilot runs for 2 weeks with real users
- [ ] No P1 incidents during pilot
- [ ] API latency within targets
- [ ] OTIF manually verified on 20+ cases
- [ ] Backup/restore tested
- [ ] Incident SOP documented
- [ ] Production environment ready for deployment

---

## 7.7 Parallel Hardening Track

While Phase 7 runs, parallel work on:

### 7.7.1 Integration Tests for Reports APIs

**File:** `backend/test/reports.integration.spec.ts`
**Method:** Test all reports endpoints with Jest/Supertest

### 7.7.2 Unit Tests for CaseAggregationService

**File:** `backend/test/case-aggregation.unit.spec.ts`
**Method:** Test OTIF calculation scenarios

### 7.7.3 Benchmark Script

**File:** `backend/scripts/benchmark.ts`
**Method:** Generate 5000 emails, 15000 tasks, measure query performance

---

## 7.8 Deliverables of Phase 7

### Must produce
- Pilot configuration and scenarios
- Monitoring dashboards/logs
- Production-ready environment configs
- Backup/restore procedures
- Incident response guide
- OTIF validation report

### Exit criteria
Phase 7 is complete when:
- Pilot completes successfully
- Production is hardened
- Monitoring is in place
- Business validates OTIF accuracy
