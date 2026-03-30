# 1. OBJECTIVE

Целосна миграција на UI кон нов Inbound flow модел. Завршување на миграцијата така што `/inbound` ќе стане вистинскиот главен workflow за Manager и Coordinator, со што ќе се почувствува целосниот нов модел.

**Зошто ова е следно:** Backend е добар, новиот API е добар, ама главниот UX уште не е целосно префрлен. Додека `/manager` и `/coordinator` живеат на стара логика, нема да се почувствува новиот модел.

# 2. CONTEXT SUMMARY

**Тековна состојба:**
- Постои `/inbound` page (нов модел)
- Постои `/manager` page (стар модел)
- Постои `/coordinator` page (стар модел)
- Паралелни API endpoints и UI структури

**Проблем:**
- Новиот inbound API/UI не е主场 - корисниците сè уште користат стари страници
- Дублирана логика и одржување
- Новиот inbound модел не е целосно искористен

**Goal:**
- `/inbound` стане официјален Manager Inbox
- Manager и Coordinator работат од иста основа (inbound chain)
- Detail views се усогласат
- Legacy cleanup

# 3. APPROACH OVERVIEW

**Стратегија:** UI Consolidation кон Inbound Flow

1. **Inbound е нов главен workflow** - сите главни страници покажуваат кон `/inbound`
2. **Role-based filtering** - истата основа за Manager и Coordinator
3. **Detail unification** - `/inbound/[id]` како главен екран
4. **Legacy cleanup** - означување и отстранување на стари страници

---

# 4. IMPLEMENTATION STEPS

## Phase 1: Sidebar Navigation Update

### Step 1.1: Додај `/inbound` во sidebar
**Goal:** Новиот inbound стане прв избор во навигацијата
**Method:** Замени го "Manager Inbox" линкот со `/inbound`

**Files:** `frontend/src/components/Sidebar.tsx`
**Action:**
```typescript
// Во Sidebar.tsx, замени:
{ href: '/manager', label: 'Manager Inbox', icon: '📥' }
// Со:
{ href: '/inbound', label: 'Inbox', icon: '📥' }
```

---

### Step 1.2: Redirect `/manager` кон `/inbound`
**Goal:** Старата Manager страница веднаш води кон новата
**Method:** Додади redirect во `/manager/page.tsx`

**Files:** `frontend/src/app/manager/page.tsx`
**Action:**
```typescript
// На почеток на page.tsx:
import { redirect } from 'next/navigation';
// Во component или redirect:
redirect('/inbound');
```

---

## Phase 2: Coordinator Migration to Inbound API

### Step 2.1: Coordinator да чита од ист inbound chain
**Goal:** Coordinator и Manager работат од истата основа
**Method:** Промена на coordinator page да го користи inbound API

**File:** `frontend/src/app/coordinator/page.tsx`
**Action:**
- Замени го taskApi.getMyTasks() со inbound API
- Филтрирај само items релевантни за coordinator role
- Зачувај го coordinator-specific UX (tabs, filters)

### Step 2.2: Coordinator URL кон inbound pattern
**Goal:** URL структурата да следи ист модел
**Method:** `/coordinator` станува дел од `/inbound` ecosystem

**Option A:** `/inbox/coordinator` (read-only view од ист API)
**Option B:** `/inbound?role=coordinator` (filter-based)

---

## Phase 3: Detail Views Unification

### Step 3.1: `/inbound/[id]` како главен detail screen
**Goal:** Еден detail екран за сите roles
**Method:** Насочи ги сите линкови кон `/inbound/[id]`

**File:** `frontend/src/app/inbound/[id]/page.tsx`
**Action:**
- Ажурирај го да го прикаже whole case context
- Додади actions за Manager (approve, reject, classify, delegate)
- Додади actions за Coordinator (start, complete, add note)
- Рендерирај според role

### Step 3.2: Насочи ги Actions кон `/inbound/[id]`
**Goal:** Сите action buttons да водат кон нов detail екран
**Method:** Ажурирај ги линковите во cards и lists

**Files:** `frontend/src/app/inbound/page.tsx`, components

---

## Phase 4: Legacy Cleanup

### Step 4.1: Означи ги старите страници како deprecated
**Goal:** Корисниците да знаат дека треба да мигрираат
**Method:** Додади deprecation banner или замени ги со redirects

**Files:**
- `/app/emails/[id]/page.tsx` → redirect to `/inbound/[id]`
- `/app/tasks/[id]/page.tsx` → redirect to `/inbound/[id]`
- `/app/manager/page.tsx` → redirect to `/inbound`

### Step 4.2: Тргни ги старите manual frontend aggregations
**Goal:** Нема повеќе duplicates
**Method:** Користи само еден data fetching пат

**Files:** `frontend/src/lib/api.ts`
**Action:**
- Ако постојат two ways да се fetch-ат tasks, остави само едниот
- Inbound API стане единствен извор

### Step 4.3: Тргни го legacy manager fetching logic
**Goal:** Чист код
**Method:** Ако постои стар manager-specific fetching, отстрани го

**Files:** `frontend/src/app/manager/*` (освен redirect)

---

## Phase 5: Post-Migration Validation

### Step 5.1: Провери дека сите flows работат
**Goal:** Нема breaking changes
**Method:** Manual test

**Проверки:**
- [ ] Manager може да го отвори inbox
- [ ] Manager може да кликне на case и да види detail
- [ ] Manager може да одобри/одбие/класифицира
- [ ] Coordinator може да ги види своите tasks
- [ ] Coordinator може да стартува/заврши task

### Step 5.2: Провери дека legacy URLs работат за backward compat
**Goal:** Ако некој имаbookmarks, да не се скршат
**Method:** Redirect кон соодветни нови страници

**Note:** Ова е optional - може и целосно да се отстранат ако е internal tool

---

# 5. TESTING AND VALIDATION

## Validation Criteria

**Navigation:**
- [ ] Sidebar покажува `/inbound` како прв линк
- [ ] `/manager` редиректира кон `/inbound`
- [ ] `/coordinator` користи ист API како `/inbound`

**Manager Flow:**
- [ ] Може да го отвори inbox
- [ ] Може да кликне на case → `/inbound/[id]`
- [ ] Може да одобри, одбие, класифицира, делегира

**Coordinator Flow:**
- [ ] Гледа само релевантни items за својата role
- [ ] Може да стартува task
- [ ] Може да заврши task

**Detail Views:**
- [ ] `/inbound/[id]` прикажува цел case
- [ ] Role-based actions се прикажуваат

**Legacy Cleanup:**
- [ ] Старите страници означени или пренасочени
- [ ] Нема duplicate API fetching логика

## Success Metrics

1. **Единствен workflow** - сите користат `/inbound` како основа
2. **Role-based filtering** - ист API за Manager и Coordinator
3. **Чист UI** - нема duplicate страници
4. **Подобар UX** - подобар од старата Manager/Coordinator логика
