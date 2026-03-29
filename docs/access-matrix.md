# 🎯 Access Matrix - LogiTask

## Преглед на Дозволи

Овој документ ги дефинира улогите и нивните дозволи во системот.

---

## 👥 Кориснички Улоги

| Улога | Код | Опис |
|--------|-----|------|
| **Администратор** | ADMIN | Полн пристап до системот |
| **Менаџер** | MANAGER | Управување со целиот процес |
| **Координатор Прием** | RECEPTION_COORDINATOR | Прием на стоки |
| **Координатор Испорака** | DELIVERY_COORDINATOR | Испорака до клиенти |
| **Координатор Дистрибуција** | DISTRIBUTION_COORDINATOR | Внатрешен пренос |

---

## 🔐 Access Matrix по Ендпоинт

### 📧 Email Ендпоинти

| Ендпоинт | ADMIN | MANAGER | RECEPTION | DELIVERY | DISTRIBUTION |
|----------|:-----:|:------:|:--------:|:-------:|:-----------:|
| GET /api/emails | ✅ | ✅ | 🔒 Читај | 🔒 Читај | 🔒 Читај |
| POST /api/emails | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /api/emails/webhook | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /api/emails/:id | ✅ | ✅ | ✅ | ✅ | ✅ |

### 📋 Task Ендпоинти

| Ендпоинт | ADMIN | MANAGER | RECEPTION | DELIVERY | DISTRIBUTION |
|----------|:-----:|:------:|:--------:|:-------:|:-----------:|
| GET /api/tasks | ✅ | ✅ | Само свои | Само свои | Само свои |
| POST /api/tasks | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /api/tasks/:id/approve | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /api/tasks/:id/reject | ✅ | ✅ | ❌ | ❌ | ❌ |
| PUT /api/tasks/:id/status | ✅ | ✅ | Само свои | Само свои | Само свои |
| GET /api/tasks/my-tasks | ✅ | ✅ | ✅ | ✅ | ✅ |

### 👤 User Ендпоинти

| Ендпоинт | ADMIN | MANAGER | RECEPTION | DELIVERY | DISTRIBUTION |
|----------|:-----:|:------:|:--------:|:-------:|:-----------:|
| GET /api/users | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /api/users/coordinators | ✅ | ✅ | ❌ | ❌ | ❌ |
| PUT /api/users/:id/role | ✅ | ❌ | ❌ | ❌ | ❌ |

### 📊 Reports Ендпоинти

| Ендпоинт | ADMIN | MANAGER | RECEPTION | DELIVERY | DISTRIBUTION |
|----------|:-----:|:------:|:--------:|:-------:|:-----------:|
| GET /api/reports/overview | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /api/reports/cases | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /api/reports/otif/trend | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /api/reports/coordinators | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /api/reports/suppliers | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /api/reports/locations | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /api/reports/delays | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /api/reports/recalculate | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /api/reports/my-scorecard | ✅ | ✅ | ✅ | ✅ | ✅ |

### 🏆 Performance Ендпоинти

| Ендпоинт | ADMIN | MANAGER | RECEPTION | DELIVERY | DISTRIBUTION |
|----------|:-----:|:------:|:--------:|:-------:|:-----------:|
| GET /performance/scorecard/:id | ✅ | ✅ | Само свој | Само свој | Само свој |
| GET /performance/leaderboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /performance/coordinators | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /performance/kpi | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /performance/recalculate/:id | ✅ | ✅ | ❌ | ❌ | ❌ |

### 🏢 ERP Ендпоинти

| Ендпоинт | ADMIN | MANAGER | RECEPTION | DELIVERY | DISTRIBUTION |
|----------|:-----:|:------:|:--------:|:-------:|:-----------:|
| POST /api/erp/import | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /api/erp/batches | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /api/erp/documents | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /api/erp/route-plans | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /api/erp/route-plans | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /api/erp/event | ✅ | ✅ | ❌ | ❌ | ❌ |

### 🔔 Notification Ендпоинти

| Ендпоинт | ADMIN | MANAGER | RECEPTION | DELIVERY | DISTRIBUTION |
|----------|:-----:|:------:|:--------:|:-------:|:-----------:|
| GET /api/notifications | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /api/notifications/:id/read | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🖥️ Frontend Страници

| Страница | ADMIN | MANAGER | RECEPTION | DELIVERY | DISTRIBUTION |
|----------|:-----:|:------:|:--------:|:-------:|:-----------:|
| / | ✅ | ✅ | ✅ | ✅ | ✅ |
| /manager | ✅ | ✅ | ❌ | ❌ | ❌ |
| /coordinator | ✅ | ✅ | ✅ | ✅ | ✅ |
| /reports | ✅ | ✅ | ❌ | ❌ | ❌ |
| /reports/cases | ✅ | ✅ | ❌ | ❌ | ❌ |
| /reports/coordinators | ✅ | ✅ | ❌ | ❌ | ❌ |
| /reports/scorecard | ✅ | ✅ | ✅ | ✅ | ✅ |
| /performance/scorecard | ✅ | ✅ | ✅ | ✅ | ✅ |
| /performance/leaderboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| /admin/performance | ✅ | ✅ | ❌ | ❌ | ❌ |
| /admin/erp | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 📝 Legenda

| Симбол | Значење |
|--------|--------|
| ✅ | Полн пристап |
| 🔒 | Ограничен пристап |
| ❌ | Нема пристап |
| Само свои | Само задачи доделени на корисникот |
| Само свој | Само сопствени податоци |

---

## 🔒 Имплементација

Access матрицата е имплементирана преку:

1. **RolesGuard** (`/backend/src/common/guards/roles.guard.ts`)
   - Проверува улога на корисникот
   - Дозволува пристап до заштитени ендпоинти

2. **Auth Guards** 
   - Блокира неавторизирани корисници
   - Дозволува само најавени корисници

3. **Route-level filters**
   - Филтрирање на податоци по улога
   - Корисник види само свои задачи

---

*Ажурирано: 29 март 2026*
*Верзија: 1.0*