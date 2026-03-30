# 🔍 LogiTask Real Walkthrough - Logic Verification

## Цел
Тестирај дали core business logic работи правилно со реални податоци, не само дали UI се рендерира.

---

## ПРЕДУСЛОВ

```bash
# 1. Пушти seed
cd backend
npx prisma db seed

# 2. Стартувај frontend
cd frontend
npm run dev

# 3. Отвори http://localhost:3000
```

---

## 📋 TEST SCENARIOS

### 1. MANAGER INBOX WALKTHROUGH

#### 1.1 Login as Manager
```
Email: manager@logitask.mk
Password: manager (or whatever you set)
```

**Очекувано:**
- Redirect кон /manager или /
- Види Dashboard со KPIs

#### 1.2 Tab: NEW (PENDING)
```
Кликни на "New" tab
```

**Очекувано:**
- Ги покажува emails со `processingStatus = PENDING`
- Овие се UNCLASSIFIED - немаат задачи
- Subject + sender + timestamp се прикажани

**Логика да провериш:**
- ✅ Дали PENDING emails НАВИСТИНА немаат tasks?
- ✅ Дали прикажува "Нема задачи" или слично?

#### 1.3 Tab: NEEDS ACTION (PROPOSED)
```
Кликни на "Needs Action" tab
```

**Очеквано:**
- Ги покажува emails со tasks во статус PROPOSED
- Task pills покажуваат број: "3 Pending"

**Логика да провериш:**
- ✅ Дали сите прикажани tasks се PROPOSED?
- ✅ Дали "Approve All" се појавува?

#### 1.4 Approve All Flow
```
1. Најди email со PROPOSED tasks
2. Кликни "Approve All"
3. Избери coordinator од dropdown
4. Submit
```

**Очекувано:**
- Отвора DelegationModal
- Suggested role е точен (INBOUND_RECEIPT → RECEPTION)
- По submit, tasks → APPROVED статус
- Tasks assigned to selected coordinator

**Логика да провериш:**
- ✅ Дали tasks се ASSIGNED правилно?
- ✅ Дали status е APPROVED not PROPOSED?
- ✅ Дали coordinator може да ги види во workboard?

#### 1.5 Tab: ACTIVE
```
Кликни на "Active" tab
```

**Очекувано:**
- Ги покажува emails со tasks IN_PROGRESS или APPROVED
- Не DONE, не REJECTED

**Логика да провериш:**
- ✅ Дали ги има само IN_PROGRESS/APPROVED?
- ✅ Дали DONE tasks се исклучени?

#### 1.6 Tab: PROBLEMATIC
```
Кликни на "Problematic" tab
```

**Очекувано:**
- Ги покажува emails со `requestType = UNCLASSIFIED`
- Тие што не можат да се категоризираат

**Логика да провериш:**
- ✅ Дали ги покажува само UNCLASSIFIED?
- ✅ Дали можеш рачно да класифицираш?

#### 1.7 Tab: OVERDUE
```
Кликни на "Overdue" tab
```

**Очекувано:**
- Ги покажува cases со `dueDate < today` и NOT DONE
- Tasks во тек или APPROVED

**Логика да провериш:**
- ✅ Дали ги покажува само задоцнетите?
- ✅ Дали DONE tasks не се прикажуваат?

---

### 2. COORDINATOR WORKBOARD WALKTHROUGH

#### 2.1 Login as Reception Coordinator
```
Email: reception@logitask.mk
Password: reception
```

**Очекувано:**
- Redirect кон /coordinator
- Наслов: "My Workboard"
- Type filter default: INBOUND_RECEIPT

**Логика да провериш:**
- ✅ Дали default filter е INBOUND_RECEIPT?
- ✅ Дали други типови се филтрирани?

#### 2.2 Tab: МОИ ЗАДАЧИ (My Tasks)
```
Провери ги task cards
```

**Очекувано:**
- Ги покажува tasks assigned to тебе
- APPROVED + IN_PROGRESS

**Логика да провериш:**
- ✅ Дали ги покажува само твоите tasks?
- ✅ Дали tasks од други coordinators не се прикажуваат?

#### 2.3 Start Task
```
1. Најди task со статус APPROVED
2. Кликни "Почни"
```

**Очекувано:**
- Task → IN_PROGRESS
- Toast: "Започната задача"
- Button се менува во "Заврши"

**Логика да провериш:**
- ✅ Дали status се ажурира во база?
- ✅ Дали task се прикажува во "Во тек" tab?

#### 2.4 Complete Task
```
1. Најди task со статус IN_PROGRESS
2. Кликни "Заврши"
```

**Очекувано:**
- Task → DONE
- Toast: "Завршена задача"
- Card покажува "✓ Завршена"

**Логика да провериш:**
- ✅ Дали status е DONE во база?
- ✅ Дали task се прикажува во "Завршени" tab?
- ✅ Дали е отстранет од "Мои задачи"?

#### 2.5 Overdue Detection
```
1. Логирај се како delivery coordinator
2. Провери ги tasks со dueDate во минатото
```

**Очекувано:**
- OVERDUE tasks имаат црвена border
- Се прикажуваат во "Доцне" tab

**Логика да провериш:**
- ✅ Дали OVERDUE се детектира правилно?
- ✅ Дали се прикажуваат во вистински tab?

---

### 3. ERP ADMIN WALKTHROUGH

#### 3.1 ERP Dashboard
```
Login as Manager or Admin
Оди на /admin/erp
```

**Очекувано:**
- Прикажува број на ERP документи
- Quick actions: Import, Routes, Documents

**Логика да провериш:**
- ✅ Дали се прикажуваат документите од seed?

#### 3.2 ERP Import
```
Оди на /admin/erp/import
```

**Користи го CSV template-от:**
1. Кликни "Превземи CSV template"
2. Пополни ги податоците:
   - documentType: PURCHASE_ORDER
   - documentNumber: TEST-001
   - supplier: Тест Добавувач
   - plannedDate: 2026-04-01
3. Import

**Очекувано:**
- Документ се креира
- Може да се види во Documents листа

**Логика да провериш:**
- ✅ Дали импортот работи?
- ✅ Дали validation е точен?

#### 3.3 Route Plans
```
Оди на /admin/erp/routes
```

**Очекувано:**
- 10 route plans од seed
- Може да додадеш/едитираш/избришеш

**Логика да провериш:**
- ✅ Дали route day е правилен (MONDAY, итн.)?
- ✅ Дали prep offset се пресметува?

---

### 4. REPORTS & OTIF WALKTHROUGH

#### 4.1 KPI Cards
```
Оди на /reports
```

**Очекувано:**
- 4 KPI cards: OTIF, On-Time, In-Full, Total
- Вредности од последните 14 дена

**Логика да провериш:**
- ✅ Дали OTIF % е точен (otifCases/totalCases)?
- ✅ Дали ги пресметува од вистински податоци?

#### 4.2 OTIF Chart
```
Провери го bar chart-от
```

**Очекувано:**
- 14 bars (последни 14 дена)
- Боја: зелена ≥90%, жолта 70-89%, црвена <70%

**Логика да провериш:**
- ✅ Дали боите соодветствуваат на вредности?
- ✅ Дали се рендерираат сите 14 дена?

#### 4.3 Performance Screen
```
Оди на /performance
```

**Очекувано:**
- Leaderboard на coordinators
- Scorecard со metrics

**Логика да провериш:**
- ✅ Дали scores се точно пресметани?
- ✅ Дали редоследот е по totalScore?

---

## 🧪 LOGIC VERIFICATION CHECKLIST

| Логика | Очекувано | Тестирано |
|--------|-----------|-----------|
| Email → Case creation | Case се креира кога email се PROCESSING | ⬜ |
| Email → Task generation | Task се креира за classification | ⬜ |
| Multi-task email | 2+ tasks се креираат | ⬜ |
| No-task email | Email останува без task | ⬜ |
| Unclassified detection | UNCLASSIFIED се детектира | ⬜ |
| Routing by type | INBOUND → Reception, OUTBOUND → Delivery | ⬜ |
| Approve → APPROVED | Status се менува | ⬜ |
| Delegate assignment | Assignee се поставува | ⬜ |
| Start → IN_PROGRESS | Status се менува | ⬜ |
| Complete → DONE | Status + completionResult | ⬜ |
| Overdue detection | dueDate < now && status != DONE | ⬜ |
| Case status calc | Пресметка од tasks statuses | ⬜ |
| OTIF calculation | isOnTime && isInFull | ⬜ |
| KPI aggregation | Ролна од tasks | ⬜ |

---

## 📊 EXPECTED TEST RESULTS

По seed, очекуваме:

| Screen | Податоци |
|--------|----------|
| Manager Inbox | ~25 emails, ~15 PROPOSED tasks |
| Coordinator Workboard | ~10 tasks assigned |
| ERP Documents | 8 документи |
| Reports OTIF | 14 дена податоци |
| Performance | 7 coordinators |

---

## 🚨 АНОМАЛИИ ЗА БЕЛЕЖЕЊЕ

Доколку нешто не работи како што очекуваме, запиши:

```
[BUG-ID]: Опис
Expected: ...
Actual: ...
Severity: ...
```

---

## ✅ SIGN-OFF

| Проверка | Статус |
|----------|--------|
| Manager inbox logic | ⬜ |
| Coordinator workboard logic | ⬜ |
| ERP flow logic | ⬜ |
| Reports/KPI logic | ⬜ |
| Overall: READY / NEEDS FIX | |