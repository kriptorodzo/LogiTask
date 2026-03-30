# LogiTask - Comprehensive Code & Product Review

## A. CURRENT LOGIC BY SCREEN

---

### 1. Login/Auth

**Што гледа корисникот:**
- Email input (default: manager@company.com)
- Role dropdown: Manager, Reception Coordinator, Delivery Coordinator, Distribution Coordinator
- Sign In копче

**Што може да направи:**
- Се логира со избирање на улога
- Dev mode: може да внесе било кој email и улога

**Бизнис логика:**
- NextAuth со credentials provider
- Роли: MANAGER, RECEPTION_COORDINATOR, DELIVERY_COORDINATOR, DISTRIBUTION_COORDINATOR
- Нема вистинска автентикација - само симулација

**Проблеми:**
- ⚠️ **ОПАСНО**: Нема вистинска автентикација - секој може да се логира како било кој
- ⚠️ **ЛОШО**: Редовно кориснички идентитет е hardcode-iran во default вредноста

---

### 2. Manager Dashboard / Inbox (`/manager`)

**Што гледа корисникот:**
- 5 tabs: New, Pending Approval, Delegated, Problematic, Overdue
- Листа на emails со картички
- За секој email: Subject, Sender, Type badge, Urgency indicator
- System Summary (extracted податоци: location, delivery date, supplier, urgency)
- Task table за секој email со: Task, Type, Due, Status, Assign To, Actions
- Suggested Delegation блок
- Action копчиња: Approve All, Details, Classify

**Што може да направи:**
- Филтрира emails по статус
- Прегледува детали за секој email
- Одобрува поединечни tasks со избор на coordinator
- Одобрува сите tasks за еден email со "Approve All"
- Одбива task со ❌ копче
- Класифицира UNCLASSIFIED emails

**Бизнис логика:**
- Email → Processing → Tasks (PROPOSED) → Manager Approval → Coordinator Assignment
- Tab логика:
  - `new`: PENDING emails
  - `pending`: PROCESSED emails со PROPOSED tasks
  - `delegated`: Emails со tasks во IN_PROGRESS/DONE
  - `problematic`: UNCLASSIFIED emails
  - `overdue`: Emails со caseDueAt во минатото
- Suggested delegation: автоматски мапира requestType → coordinator role
- Default assignee: првиот coordinator во листата

**Проблеми:**
- ⚠️ **ОПАСНО**: "Approve All" користи првиот coordinator како default assignee без избор
- ⚠️ **ЛОШО**: Manager гледа PREMNOGU оперативни детали - task-level наместо case-level
- ⚠️ **ЗБУНУВАЧКО**: Нема јасна case/taskdistinction - се мешаат
- ⚠️ **ЛОШО**: State persistence е complex ама не е доволно debug-iran

---

### 3. Email Detail (`/emails/[id]`)

**Што гледа корисникот:**
- Action копчиња (за manager): Classify, Assign dropdown, Approve All, Reject
- Case Summary (ако постои): caseNumber, caseDueAt, OTIF статус, task completion
- Extracted Information cards: Supplier, Location, Delivery Date, Urgency (со warning ако недостига)
- Email Body (plain text)
- Related Tasks табела

**Што може да направи:**
- Класифицира email со едно клик: Inbound, Prep, Delivery, Distribution
- Одобрува tasks со избор на coordinator
- Одобрува сите еднаш
- Прегледува extracted data
- Гледа tasks и derivate deliverables

**Бизнис логика:**
- Classification trigger-ува task generation
- Case се креира автоматски од email
- OTIF calculation: onTime + inFull

**Проблеми:**
- ⚠️ **ЗБУНУВАЧКО**: Back button води кон /reports наместо /manager
- ⚠️ **ЛОШО**: Role mapping за delegate е погрешен (OUTBOUND_DELIVERY → DISTRIBUTION_COORDINATOR)
- ⚠️ **НЕДОСТИГА**: Нема можност за рачно додавање на task

---

### 4. Coordinator Page (`/coordinator`)

**Што гледа корисникот:**
- 4 tabs: Мои задачи (my), Во тек (in_progress), Завршени (done), Доцне (overdue)
- Task cards со: title, requestType, ERP badge (ако е од ERP), due date, status badge
- Action копчиња: Почни, Заврши

**Што може да направи:**
- Гледа само свои задачи (getMyTasks)
- Става задача во IN_PROGRESS
- Маркира задача како DONE
- Гледа ERP документ референца

**Бизнис логика:**
- Табеларен приказ - НЕ е Kanban board
- Префрлање помеѓу tabs прави нови API повици
- Status badge: PROPOSED, APPROVED, IN_PROGRESS, DONE

**Проблеми:**
- ⚠️ **ЗБУНУВАЧКО**: Tab "Мои задачи" всушност ги филтрира само APPROVED tasks (не PROPOSED)
- ⚠️ **ЛОШО**: Нема Kanban board - coordinator работи листење, не drag-drop
- ⚠️ **ЛОШО**: Нема детали за задачата - само title и type

---

### 5. ERP Admin (`/admin/erp`)

**Што гледа корисникот:**
- 3 quick action cards: Import Documents, Route Plans, All Documents
- 4 KPI cards: Total Documents, Import Batches, Pending, Completed
- Recent Documents табела
- Recent Import Batches табела

**Бизнис логика:**
- Overview на ERP activity
- Нема вистинска интеграција со ERP - само manual import

**Проблеми:**
- ⚠️ **ЛОШО**: Само презентација - вистински ERP интеграција не постои

---

### 6. ERP Import (`/admin/erp/import`)

**Што гледа корисникот:**
- 3 tabs: Upload, Preview (count), Results
- Upload: File input + JSON paste
- Preview: Табела со сите редови пред import
- Results: Success/error summary

**Што може да направи:**
- Upload CSV или JSON фајл
- Paste JSON директно
- Validate rows пред import
- Import и гледа резултати
- Типови на документи: PURCHASE_ORDER, GOODS_RECEIPT, SALES_ORDER, SHIPMENT_ORDER

**Бизнис логика:**
- CSV parsing: documentType, documentNumber, partnerName, destinationName, lineCount, totalQuantity, plannedDate
- Validation: documentType + documentNumber задолжителни, plannedDate мора валиден датум
- Import креира ErpDocument + поврзани Tasks

**Проблеми:**
- ⚠️ **ЗБУНУВАЧКО**: Кориснички интерфејс е technical - бара разбирање на форматот
- ⚠️ **ЛОШО**: Нема examples/templates за users
- ⚠️ **НЕДОСТИГА**: Bulk operations, error handling не е доволен

---

### 7. Route Plans (`/admin/erp/routes`)

**Што гледа корисникот:**
- Табела со route plans: Code, Destination, Route Day, Prep Offset, Status, Actions
- + Add Route Plan копче
- Modal forma за create/edit

**Што може да направи:**
- Додава route plan со: destinationCode, destinationName, routeDay, prepOffsetDays, active
- Edit/Delete постоечки
- Toggle active/inactive
- Info box со објаснување

**Бизнис логика:**
- Route Day: MONDAY-SUNDAY
- Prep Offset: 0-7 дена пред route day
- Example: Friday route + 1 day prep = tasks due Thursday

**Проблеми:**
- ⚠️ **ЛОШО**: Кориснички интерфејс е добар, ама логиката за prep offset е нејасна
- ⚠️ **НЕДОСТИГА**: Нема bulk import на route plans
- ⚠️ **НЕДОСТИГА**: Нема автоматска примена врз нарачки

---

### 8. Reports (`/reports`)

**Што гледа корисникот:**
- Date range picker (from/to)
- 4 KPI cards: Total Cases, OTIF Rate, On-Time Rate, In-Full Rate
- Average Times (Approval/Execution)
- Overdue Analysis
- OTIF Trend табела
- Top Delay Reasons листа

**Бизнис логика:**
- OTIF = On-Time + In-Full
- Metrics: avgApprovalMinutes, avgExecutionMinutes, overdueRate
- Trend: daily aggregation

**Проблеми:**
- ⚠️ **ЛОШО**: Charts се заменети со табели - regression
- ⚠️ **ЛОШО**: Нема export functionality
- ⚠️ **ЛОШО**: Датрите се hardcoded

---

### 9. Admin Performance (`/admin/performance`)

**Што гледа корисникот:**
- Месец/Gодина/Координатор селектори
- Форма за KPI: tidiness, discipline, organization, fuel, incidents, returns48h, activeRole

**Бизнис логика:**
- Manual KPI scoring (0-100)
- Пресметка од задачи (auto-recalculate)

**Проблеми:**
- ⚠️ **ЛОШО**: Интерфејс е премногу technical за manager
- ⚠️ **НЕДОСТИГА**: Нема автоматски metric extraction

---

## B. ROLE LOGIC REVIEW

---

### MANAGER

**Што гледа:**
- Header: Dashboard, Reports, Manager Inbox
- Sidebar: Dashboard, Manager Inbox, Coordinator, Reports, Performance, ERP, Settings
- Сите менија - нема ограничување

**Што може да прави:**
- Прегледува emails во 5 категории
- Одобрува/одбива tasks
- Класифицира emails
- Гледа reports
- Управува со ERP (import, routes)
- Управува со performance

**Проблеми:**
- ⚠️ **ОПАСНО**: Има пристап до СИТЕ функции - и admin и coordinator
- ⚠️ **ОПАСНО**: Нема Role-based access control - Coordinator може да оди на /admin
- ⚠️ **ЗБУНУВАЧКО**: Менито е исто за сите улози
- ⚠️ **ЛОШО**: Manager inbox е преоптеретен со task-level детали

**Оцена на manager workflow: 4/10**
- Нема јасна work queue концепција
- Премногу оперативни детали
- Case vs Task логика не е јасна
- "Approve All" е опасно

---

### COORDINATOR

**Што гледа:**
- Header: Dashboard, Reports, Coordinator
- Sidebar: СИТЕ менија (исти како Manager!)
- /coordinator page

**Што може да прави:**
- Гледа tasks (filtered by APPROVED status само)
- Става tasks во In Progress
- Маркира DONE
- Гледа Reports (?!)
- Гледа Performance (?!)
- Гледа ERP мени (?!)

**Проблеми:**
- ⚠️ **ОПАСНО**: Coordinator може да пристапи на /admin и сите функционалности
- ⚠️ **ОПАСНО**: Coordinator гледа Reports и Performance - не му е работа
- ⚠️ **ЗБУНУВАЧКО**: Истото мени како Manager - нема role separation
- ⚠️ **ЛОШО**: Coordinator experience НЕ Е/workboard - е листа
- ⚠️ **ЛОШО**: Нема нативна filtering по role (Reception vs Delivery vs Distribution)

**Оцена на coordinator workflow: 2/10**
- Премногу привилегии
- Нема вистински workboard
- Гледа работи што не треба
- UX е ист како manager

---

### ADMIN

**Што гледа:**
- /admin page како landing
- ERP Management, Performance Settings

**Што може да прави:**
- Import ERP documents
- Manage route plans
- Configure KPIs

**Проблеми:**
- ⚠️ **ЛОШО**: Admin landing page е скоро празен - само 2 cards
- ⚠️ **НЕДОСТИГА**: User management, system settings

---

## C. UX / NAVIGATION REVIEW

---

### Што е добро

- ✅ PageShell компонента обезбедува breadcrumbs
- ✅ Header/Navigation постои
- ✅ Loading states постојат
- ✅ State persistence за tabs
- ✅ Tabs за категоризација (иако не секогаш логични)

### Што е лошо

- ❌ Sidebar е ИСТ за сите улози - нема role-based filtering
- ❌ Header е hardcoded за manager (`isManager` проп)
- ❌ Нема Role-based route protection
- ❌ Coordinator UX е ист како Manager UX
- ❌ "Approve All" е опасно и глобално достапен
- ❌ Back buttons водат на погрешни страни
- ❌ Нема proper navigation guards - сите можат да одат насекаде
- ❌ Reports и Performance мени се видливи за Coordinator

### Што е збунувачко

- 🔸 Кога си логиран како Coordinator, гледаш "Manager Inbox" линк
- 🔸 Email detail back button води кон Reports
- 🔸 Tab counts може да бидат 0 и да прикажат "No tasks" поради filter logic
- 🔸 "Мои задачи" tab всушност значи "Odobreni zadachi"
- 🔸 Role mapping за delegation е погрешен во email detail

---

## D. BUSINESS LOGIC REVIEW

---

### 1. Делегирање (Delegation Logic)

**Како работи:**
1. Email пристигнува → се processира → се генерираат PROPOSED tasks
2. Manager гледа во "Pending Approval" tab
3. За секој task, избира coordinator од dropdown
4. Или клика "Approve All" → сите одат на првиот coordinator

**Проблеми:**
- ⚠️ **ОПАСНО**: "Approve All" не прашува за assignee - автоматски го зема првиот coordinator
- ⚠️ **ОПАСНО**: Default assignee логика нема fallback validation
- ⚠️ **ЛОШО**: Manager треба да одлучи за секој task посебно - нема grouping
- ⚠️ **ЛОШО**: Нема SLA/deadline автоматизација - само dueDate extraction

**Реална употреба:**
- Manager сака да види case, не 5 tasks
- "Approve All" е добра функција, но мора да праша за assignee
- Треба да постои "assign to default coordinator" опција

---

### 2. Email → Task Flow

**Како работи:**
1. Email се processира (parsing service)
2. Се екстрактираат: supplier, location, delivery date, urgency, request type
3. Ако UNCLASSIFIED → еден "Review" task за manager
4. Ако分类ен → generateTaskProposals() create tasks
5. Секој task има assigneeRole според requestType

**Проблеми:**
- ⚠️ **ЗБУНУВАЧКО**: Нема вистинска email parsing логика во frontend
- ⚠️ **ЛОШО**: Task generation е backend-only, manager не може да influenciра
- ⚠️ **НЕДОСТИГА**: Нема reminder/notifications за pending tasks

---

### 3. ERP Workflow

**Како работи:**
1. Admin upload-ува CSV/JSON
2. Backend parseира и валидира
3. Креира ErpDocument за секој ред
4. Креира поврзани Tasks
5. Резултати се прикажуваат

**Проблеми:**
- ⚠️ **ЛОШО**: Нема вистинска ERP интеграција - само manual import
- ⚠️ **ЗБУНУВАЧКО**: User не знае што формат да очекува
- ⚠️ **НЕДОСТИГА**: Schedule imports, monitoring, webhook integration
- ⚠️ **НЕДОСТИГА**: Route plans не се применуваат автоматски

---

### 4. Coordinator Workboard

**Како работи:**
1. Coordinator оди на /coordinator
2. Гледа табела со tasks (не Kanban)
3. Клика "Почни" → IN_PROGRESS
4. Клика "Заврши" → DONE

**Проблеми:**
- ⚠️ **ОПАСНО**: Coordinator може да ги види сите tasks (не само своите во PROPOSED статус!)
- ⚠️ **ЛОШО**: Нема Kanban board -北宋 task management
- ⚠️ **ЗБУНУВАЧКО**: "Мои задачи" всушност зема APPROVED tasks, не неговите PROPOSED
- ⚠️ **НЕДОСТИГА**: Task details, notes, attachments, time tracking
- ⚠️ **НЕДОСТИГА**: filtering по тип (Reception vs Delivery vs Distribution)

---

## E. FINAL SCORE

| Category | Score | Notes |
|----------|-------|-------|
| Business Logic | 4/10 | Логиката постои ама е непотребно complex; делегирањето е опасно |
| UX Logic | 3/10 | Нема role separation; сите гледаат исто; coordinator UX е лош |
| Role Separation | 2/10 | Нема вистинска сепарација; coordinator гледа сè |
| Manager Workflow | 4/10 | Преоптеретен; task-level наместо case-level; опасен "Approve All" |
| Coordinator Workflow | 2/10 | Нема workboard; има премногу привилегии; лоша filtering логика |
| ERP Workflow | 3/10 | Само manual import; нема вистинска интеграција; технички UX |
| **OVERALL** | **2.8/10** | Треба значителна поправка |

---

## F. FINAL RECOMMENDATION

### **3. Rework manager/coordinator logic before continuing**

---

## ШТО ТРЕБА ДА СЕ СМЕНИ ОД КОРЕН

### 1. Role-Based Access Control (URGENT)
```typescript
// Сега: Нема контрола
// Треба:
// - /admin само за ADMIN
// - /manager само за MANAGER  
// - /coordinator за Coordinator улоги
// - Reports/Performance - само Manager/Admin
```

### 2. Coordinator Workboard (URGENT)
```typescript
// Сега: Табела
// Треба: Kanban Board
// - Columns: New (PROPOSED), In Progress, Done
// - Drag-drop
// - Filter by type (Reception/Delivery/Distribution)
// - Task details panel
```

### 3. Manager Case-Level View (HIGH)
```typescript
// Сега: Task-level инспекција
// Треба:
// - Case view како примарно
// - Email = Case
// - Tasks = под-задачи на case
// - Approve All мора да праша за assignee
```

### 4. "Approve All" Safety (HIGH)
```typescript
// Сега: Автоматски прв coordinator
// Треба:
// - Избор на default assignee во settings
// - Или прашај секој пат
// - Или delegate to role (не specific person)
```

### 5. Sidebar Navigation (MEDIUM)
```typescript
// Сега: Исто за сите
// Треба:
const MANAGER_NAV = ['Dashboard', 'Manager Inbox', 'Reports'];
const COORDINATOR_NAV = ['My Tasks', 'My Performance'];
const ADMIN_NAV = ['Admin', 'ERP', 'Performance Settings'];
```

### 6. Remove Technical Complexity (MEDIUM)
- ERP Import: Додај templates и examples
- Route Plans: Додај bulk import
- Reports: Врати charts

---

## ЗАКЛУЧОК

LogiTask е MVP што покажува potential, но:

1. **Role separation НЕ постои** - сите корисат ист UX
2. **Coordinator experience е лош** - нема workboard, табела е
3. **Manager е преоптеретен** - task-level наместо case-level
4. **"Approve All" е опасен** - автоматски assignee без избор
5. **ERP е само UI** - нема вистинска интеграција

**Препорака:** Потребна е целосна ре-архитектура на role-based workflows пред да се продолжи со нови функционалности.