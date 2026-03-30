# QA/UAT Чек листа за LogiTask

## Преглед

| Верзија | Датум | Автор |
|---------|-------|-------|
| 1.0 | 30.03.2026 | OpenHands |

---

## 🔐 Автентикација (Auth)

### Login/Logout
- [ ] Login страната се вчитува коректно
- [ ] Login формата ја прикажува email и password полињата
- [ ] Можам да се најавам со валидни credentials
- [ ] Неуспешен login прикажува error порака
- [ ] Logout копчето функционира
- [ ] По logout, корисникот е пренасочен кон login страната

### Session Management
- [ ] Session перзистира по освежување на страната
- [ ] Session истек прикажува порака и пренасочува кон login
- [ ] Корисникот не може да пристапи на protected routes без login

---

## 👔 Улога: MANAGER

### Dashboard (/)
- [ ] Dashboard се вчитува за Manager улогата
- [ ] Прикажува број на Active cases
- [ ] Прикажува број на Pending approvals
- [ ] Прикажува број на Overdue cases
- [ ] KPI cards се прикажани коректно

### Manager Inbox (/manager)
- [ ] Inbox страната се вчитува
- [ ] Tab "New" ги прикажува новите emails
- [ ] Tab "Needs Action" ги прикажува emails со pending tasks
- [ ] Tab "Active" ги прикажува emails со tasks во тек
- [ ] Tab "Problematic" ги прикажува UNCLASSIFIED emails
- [ ] Tab "Overdue" ги прикажува доцнечките cases

#### Email Cards
- [ ] Се прикажува subject, sender, timestamp
- [ ] Се прикажува type badge (Inbound, Prep, Delivery, Distribution)
- [ ] Се прикажува URGENT badge за high urgency
- [ ] Се прикажува System Summary со extracted data
- [ ] Се прикажуваат Task pills (Pending/In Progress/Done)
- [ ] Се прикажуваат Task type tags

#### Approve/Reject Actions
- [ ] "Approve All" копче се појавува кога сите tasks се PROPOSED
- [ ] Клик на "Approve All" отвора DelegationModal
- [ ] DelegationModal прикажува suggested role
- [ ] Можам да изберам coordinator од dropdown
- [ ] Submit креира tasks со избраниот assignee
- [ ] Клик на одбивање го менува status на REJECTED

#### Search/Filter
- [ ] Search поле функционира (филтрира по subject/sender)
- [ ] Tab counts се ажурираат динамички

### Reports (/reports)
- [ ] Reports страната е достапна за Manager
- [ ] Date range picker функционира
- [ ] KPI cards ги прикажуваат: Total Cases, OTIF, On-Time, In-Full
- [ ] Bar chartOTIF Trend се рендерира
- [ ] Legend прикажува објаснување за боите
- [ ] Top Delay Reasons се прикажани

### ERP (/admin/erp)
- [ ] ERP Dashboard е достапен за Manager
- [ ] Прикажува број на документи
- [ ] Quick actions (Import, Routes, Documents) работат

#### ERP Import (/admin/erp/import)
- [ ] Help box се прикажува со објаснување
- [ ] "Превземи CSV template" копче презема валиден CSV
- [ ] Document type explanations се прикажани
- [ ] Можам да качам CSV фајл
- [ ] Preview tab ги прикажува парсираните податоци
- [ ] Validation errors се прикажуваат за невалидни податоци
- [ ] Import button креира tasks
- [ ] Results tab прикажува успех/неуспех

#### Route Plans (/admin/erp/routes)
- [ ] Route Plans листата се вчитува
- [ ] Можам да додадам нова рута
- [ ] Можам да едитирам постоечка рута
- [ ] Можам да избришам рута
- [ ] Help text објаснува како работат рутите

### Performance (/performance)
- [ ] Performance страната е достапна за Manager
- [ ] Leaderboard се прикажува
- [ ] Scorecard се прикажува

---

## 👔 Улога: COORDINATOR

### Workboard (/coordinator)
- [ ] Workboard страната се вчитува
- [ ] Насловот е "My Workboard"
- [ ] Тип filter dropdown е присутен
- [ ] Default filter е применет според улогата:
  - RECEPTION → INBOUND_RECEIPT
  - DELIVERY → OUTBOUND_DELIVERY  
  - DISTRIBUTION → TRANSFER_DISTRIBUTION
- [ ] Tab "Мои задачи" ги прикажува одобрените задачи
- [ ] Tab "Денешни" ги прикажува денешните задачи
- [ ] Tab "Во тек" ги прикажува IN_PROGRESS задачите
- [ ] Tab "Доцне" ги прикажува overdue задачите
- [ ] Tab "Завршени" ги прикажува DONE задачите

#### Task Cards
- [ ] Task cards се прикажани во grid
- [ ] Border-left боја соодветствува на типот
- [ ] Задоцнети задачи имаат црвена граница
- [ ] Се прикажува title, type badge, description
- [ ] Се прикажува due date
- [ ] ERP badge се прикажува за ERP документи

#### Quick Actions
- [ ] "Почни" копче за APPROVED задачи
- [ ] Клик на "Почни" менува status во IN_PROGRESS
- [ ] Се прикажува success toast "Започната задача"
- [ ] "Заврши" копче за IN_PROGRESS задачи
- [ ] Клик на "Заврши" менува status во DONE
- [ ] Се прикажува success toast "Завршена задача"
- [ ] DONE задачи прикажуваат "✓ Завршена"

---

## 👔 Улога: ADMIN

### Admin Dashboard (/admin)
- [ ] Admin Dashboard е достапен
- [ ] Прикажува quick navigation

### Users (/admin/users)
- [ ] Users листата се вчитува
- [ ] Можам да додадам нов корисник
- [ ] Можам да едитирам постоечки корисник
- [ ] Можам да променам улога на корисник
- [ ] Можам да деактивирам корисник

### ERP (Admin)
- [ ] Сите ERP функционалности како Manager
- [ ] Дополнителни admin опции ако има

### Settings (/admin/settings)
- [ ] Settings страната е достапна
- [ ] Можам да конфигурирам системски опции

---

## 🔒 Role-Based Access Control (RBAC)

### Route Protection
- [ ] Coordinator НЕ може да пристапи на /admin
- [ ] Coordinator НЕ може да пристапи на /reports
- [ ] Coordinator НЕ може да пристапи на /performance
- [ ] Coordinator НЕ може да пристапи на /manager
- [ ] Manager МОЖЕ да пристапи на /manager
- [ ] Manager МОЖЕ да пристапи на /reports
- [ ] Admin МОЖЕ да пристапи на сите рути

### Sidebar Navigation
- [ ] Manager sidebar: Dashboard, Inbox, Reports, ERP, Performance
- [ ] Coordinator sidebar: Dashboard, My Tasks само
- [ ] Admin sidebar: Admin, ERP, Performance, Reports

---

## 📊 API Интеграции

### Tasks API
- [ ] GET /api/tasks - враќа листа на tasks
- [ ] POST /api/tasks - креира нова task
- [ ] PATCH /api/tasks/:id - ажурира task
- [ ] PUT /api/tasks/:id/status - менува status

### Email API
- [ ] GET /api/emails - враќа листа на emails
- [ ] GET /api/emails/:id - враќа детали за email

### ERP API
- [ ] POST /api/erp/import - импортира документи
- [ ] GET /api/erp/documents - враќа документи
- [ ] GET /api/routes - враќа рути

### Reports API
- [ ] GET /api/reports/metrics - враќа KPIs
- [ ] GET /api/reports/trend - враќа OTIF trend
- [ ] GET /api/reports/delays - враќа delay reasons

---

## 🔄 Edge Cases

### Auth
- [ ] Login со празен email/password
- [ ] Login со невалиден email формат
- [ ] Login со погрешна лозинка
- [ ] Пристап на protected route без session

### Manager
- [ ] Approve All кога нема PROPOSED tasks
- [ ] Reject веќе одобрена task
- [ ] Task со missing data

### Coordinator
- [ ] Task due date во минатото
- [ ] Task без due date
- [ ] Многу tasks во една категорија

### ERP Import
- [ ] CSV со погрешен формат
- [ ] CSV со празни задолжителни полиња
- [ ] CSV со невалиден document type
- [ ] CSV со невалиден датум

---

## 🐛 Технички Checks

### Performance
- [ ] Страните се вчитуваат за < 3 секунди
- [ ] Нема memory leaks при навигација
- [ ] API повиците завршуваат разумно

### Responsive Design
- [ ] Desktop (1920x1080) - OK
- [ ] Laptop (1366x768) - OK
- [ ] Tablet (768x1024) - OK

### Accessibility
- [ ] Keyboard navigation работи
- [ ] Focus states се видливи
- [ ] Color contrast е доволен

### Error Handling
- [ ] Network error прикажува порака
- [ ] API error прикажува корисна порака
- [ ] 404 страна постои

---

## ✅ Sign-off

| Улога | Име | Датум | Потпис |
|-------|-----|-------|--------|
| QA Lead | | | |
| Product Owner | | | |
| Manager (UAT) | | | |
| Coordinator (UAT) | | | |
| Admin (UAT) | | | |

---

## 📋 Тест податоци

### Test Users
```
Manager: manager@logitask.mk / password123
Coordinator (Reception): reception@logitask.mk / password123
Coordinator (Delivery): delivery@logitask.mk / password123
Coordinator (Distribution): distribution@logitask.mk / password123
Admin: admin@logitask.mk / password123
```

### Test Data
- 5 emails во Pending стање
- 3 UNCLASSIFIED emails
- 2 overdue cases
- 10 tasks во различни статуси
- 5 route plans
- 10 ERP документи