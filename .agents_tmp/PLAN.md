# 1. OBJECTIVE

Редизајнирање на manager и coordinator workflow-овите според реална логистичка операција, со јасно раздвојување на улоги, пристапи и одговорности. Целта е платформата да биде природна за реална употреба, со вистински role-based access control и безбедна делегациска логика.

# 2. CONTEXT SUMMARY

**Тековен проблем (од Code Review):**
- Нема вистинска role separation - сите улоги гледаат исто мени
- Coordinator може да пристапи на /admin, /reports, /performance
- Manager гледа task-level наместо case-level
- "Approve All" е опасен - автоматски зема прв coordinator без избор
- Coordinator UX е табела, не workboard/kanban
- ERP/Route Plans се видливи за coordinator

**Постоечки систем:**
- Frontend: Next.js со PageShell, Sidebar, TopBar
- Auth: NextAuth со role во session
- Backend: NestJS со RolesGuard (неактивен)
- Role types: MANAGER, RECEPTION_COORDINATOR, DELIVERY_COORDINATOR, DISTRIBUTION_COORDINATOR

# 3. APPROACH OVERVIEW

**Стратегија:** Имплементација во 6 фази:

1. **Role-based route protection** - middleware/guards за блокирање на неовластени рути
2. **Role-specific navigation** - различни sidebar менюа по улога
3. **Manager workflow redesign** - case/email-driven наместо task-table-driven
4. **Coordinator workflow redesign** - workboard/kanban view со filters
5. **ERP/Admin scope cleanup** - само Manager/Admin пристап
6. **Safe delegation flow** - "Approve All" бара assignee selection

** rationale:** Овие промени се директно базирани на code review findings и ја адресираат секцијата "3. Rework manager/coordinator logic before continuing".

# 4. IMPLEMENTATION STEPS

## Phase 1: Role-Based Route Protection

### Step 1.1: Проширување на middleware.ts
**Goal:** Блокирање на неовластени рути на frontend ниво
**Method:** Додавање на pathname checks според role

**Files:** `frontend/src/middleware.ts`
**Action:**
```typescript
// Add role-based route blocking
const roleRoutes: Record<string, string[]> = {
  MANAGER: ['/admin', '/reports', '/performance'],
  RECEPTION_COORDINATOR: ['/admin', '/manager', '/reports', '/performance'],
  // etc.
};
```

---

## Phase 2: Role-Specific Navigation

### Step 2.1: Редизајн на Sidebar.tsx
**Goal:** Различно sidebar мени по улога
**Method:** Условно рендерирање на navItems според session role

**File:** `frontend/src/components/Sidebar.tsx`
**Action:** Додавање на role-based filtering

### Step 2.2: Дефинирање на navigation maps
**Goal:** Јасни navigation структури за секоја улога
**Method:** Креирање на константи за секоја улога

**Proposed Navigation Map:**

**MANAGER:**
- Dashboard (`/`)
- Inbox / Cases (`/manager`)
- Reports (`/reports`)
- ERP (`/admin/erp`)
- Performance (`/admin/performance`)

**COORDINATOR (сите типови):**
- My Workboard (`/coordinator`)
- Today (`/coordinator?filter=today`)
- Overdue (`/coordinator?filter=overdue`)
- Completed (`/coordinator?filter=done`)

**ADMIN:**
- ERP (`/admin/erp`)
- Route Plans (`/admin/erp/routes`)
- Users (`/admin/users`)
- System Settings (`/admin/settings`)

---

## Phase 3: Manager Workflow Redesign

### Step 3.1: Преструктурирање на Manager page
**Goal:** Case/email-driven наместо task-table-driven
**Method:** Промена на UI од task list кон case cards

**File:** `frontend/src/app/manager/page.tsx`
**Action:** 
- Email/Case cards како примарно
- Extracted summary (supplier, location, due date, urgency)
- Missing data / problematic state indicators
- Suggested delegation block
- Action buttons: Approve, Reject, Classify, Delegate

### Step 3.2: Тргање на опасната default assignee логика
**Goal:** "Approve All" да не доделува автоматски на прв coordinator
**Method:** Додавање на assignee selection modal/confirmation

**File:** `frontend/src/app/manager/page.tsx`
**Action:**
- Кога manager кликне "Approve All", се отвора dropdown за избор на coordinator
- Или се бара експлицитен избор пред одобрување
- Промена на `handleApproveAll` функцијата

### Step 3.3: Додавање на bulk approve со selection
**Goal:** Ако има bulk approve, да бара assignee selection
**Method:** Modal или inline confirmation

**Action:**
```typescript
// Instead of:
async function handleApproveAll(emailId: string) {
  const defaultAssignee = coordinators[0]; // DANGEROUS
  ...
}

// New approach:
async function handleApproveAll(emailId: string, selectedAssigneeId: string) {
  // Require explicit selection
}
```

---

## Phase 4: Coordinator Workflow Redesign

### Step 4.1: Креирање на Workboard/Kanban View
**Goal:** Coordinator да гледа task board наместо табела
**Method:** имплементација на drag-drop kanban или filterable cards

**File:** `frontend/src/app/coordinator/page.tsx`
**Action:**
- Columns: New (PROPOSED), In Progress, Done
- Drag-drop functionality (опционално)
- Или filterable card view со quick actions

### Step 4.2: Додавање на filters по role-relevant task type
**Goal:** Coordinator да може да филтрира по својот тип
**Method:** Filter dropdown за request type

**Filters:**
- Filter by task type (Inbound, Prep, Delivery, Distribution)
- Only assigned tasks (assigneeId === currentUser.id)
- Date filters (today, this week, overdue)

### Step 4.3: Quick actions на task cards
**Goal:** Брзо Start/Complete/Add note
**Method:** Action buttons на секој card

**Actions:**
- Start → `IN_PROGRESS`
- Complete → `DONE` (со optional result/note)
- Add note → отвора comment/result modal

### Step 4.4: Ремапирање на coordinator tabs
**Goal:** Поедноставена структура
**Method:** Нови tab категории

**Proposed Tabs:**
- Мои задачи (assigned to me, all statuses)
- Денешни (due today)
- Во тек (IN_PROGRESS)
- Доцне (overdue)
- Завршени (DONE)

---

## Phase 5: ERP/Admin Scope Cleanup

### Step 5.1: Блокирање на ERP routes за coordinator
**Goal:** ERP import, route plans да бидат Manager/Admin-only
**Method:** Route protection + sidebar hiding

**Files:** `frontend/src/middleware.ts`, `frontend/src/components/Sidebar.tsx`
**Action:**
- `/admin/erp/*` → само MANAGER
- `/admin/erp/routes` → само MANAGER
- `/admin/performance` → MANAGER, ADMIN
- Coordinator sidebar нема ги нема овие линкови

### Step 5.2: Проверка на ERP import UX
**Goal:** Дали import flow е јасен за business user
**Method:** Review на `/admin/erp/import`

**Action:**
- Додавање на examples/templates
- Подобрување на error messages
- Проверка дали едоводи кон coordinator tasks логично

### Step 5.3: Route Plans како business rule setup
**Goal:** Претставување како business configuration, не admin функција
**Method:** Промена на UI/labels ако треба

---

## Phase 6: Safe Delegation Flow

### Step 6.1: Креирање на delegation modal
**Goal:**approveAll бара избор на assignee
**Method:** Нова компонента за assignee selection

**File:** `frontend/src/components/DelegationModal.tsx` (new)
**Action:**
- При "Approve All" клик, се отвора modal
- Прикажува координатори релевантни за task types
- Manager избира експлицитно
- Submit креира tasks со избраниот assignee

### Step 6.2: Default assignee settings (опционално)
**Goal:** Можност за default assignee per role во settings
**Method:** User settings API

**Action:**
- Manager може да подеси "default coordinator за Delivery tasks"
- Тие default вредности се користат кога нема експлицитен избор

---

# 5. TESTING AND VALIDATION

## Validation Criteria

**Role-Based Access:**
- [ ] Coordinator не може да пристапи на /admin
- [ ] Coordinator не може да пристапи на /reports
- [ ] Coordinator не може да пристапи на /performance
- [ ] Manager може да пристапи на сите свои рути
- [ ] Admin може да пристапи на ERP и routes

**Navigation:**
- [ ] Manager sidebar: Dashboard, Inbox, Reports, ERP, Performance
- [ ] Coordinator sidebar: My Workboard, Today, Overdue, Completed
- [ ] Admin sidebar: ERP, Routes, Users, Settings
- [ ] Активниот линк е highlighting

**Manager Workflow:**
- [ ] Case/Email cards со extracted summary
- [ ] Missing data indicators (warning за непознати полиња)
- [ ] "Approve All" прашува за assignee
- [ ] Ручна делегација работи
- [ ] Classification на UNCLASSIFIED работи

**Coordinator Workflow:**
- [ ] Workboard/Kanban приказ (или filterable cards)
- [ ] Filter по task type работи
- [ ] Quick actions (Start, Complete) работат
- [ ] Task details се прикажуваат

**ERP/Admin Cleanup:**
- [ ] ERP routes блокирани за coordinator
- [ ] Route Plans само за Manager/Admin
- [ ] Import flow е business-friendly

**Safe Delegation:**
- [ ] Approve All бара assignee selection
- [ ] Нема автоматско доделување на прв coordinator
- [ ] Delegate to role (не specific person) опционално

## Success Metrics

1. **Platform logic е поприродна за реална употреба** - секоја улога гледа само она што ѝ треба
2. **Нема security gaps** - сите рути се заштитени
3. **UX е подобрен** - coordinator има workboard, manager гледа cases
4. **Delegation е безбедна** - нема automatic assignment без избор
