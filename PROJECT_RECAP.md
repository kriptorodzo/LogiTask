# 📋 Рекапитулација на Проектот

## LogiTask - Процесор за Е-пошта во Логистика

### 🎯 Цел на Проектот
Автоматско читање на дојдовни е-пошта, екстракција на оперативни барања, креирање задачи, доделување до координатори според тип на одговорност и пресметување на оперативни датуми за зависни активности.

---

## 🏗️ Архитектура

### Backend (NestJS - Порт 4000)
```
backend/
├── src/
│   ├── auth/          # Azure AD автентикација
│   ├── email/         # Е-пошта и парсирање
│   ├── task/          # Креирање и управување со задачи
│   ├── user/          # Управување со корисници и улоги
│   ├── notification/  # Известувања
│   └── common/        # Филтри, интерцептори, валидација
├── prisma/
│   ├── schema.prisma  # База на податоци
│   └── seed.ts        # Почетни податоци
```

### Frontend (Next.js - Порт 3000)
```
frontend/src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── manager/page.tsx      # Менаџер инбокс
│   ├── emails/[id]/page.tsx  # Детали за е-пошта
│   └── tasks/[id]/page.tsx   # Детали за задача
├── components/
│   ├── Dashboard.tsx         # Главна табла
│   ├── Header.tsx            # Заглавје
│   └── Notifications.tsx     # Известувања
└── lib/
    ├── api.ts                # API клиент
    └── auth.ts               # Автентикација
```

---

## 🔑 Клучни Функционалности

### 1. Е-пошта Ингестија
- Поврзување со Microsoft Graph API
- Вебхук за нови е-пошта
- Парсирање и екстракција на:
  - 📦 Добавувач (supplier)
  - 📍 Локација (location)
  - 📅 Датум на испорака (delivery date)
  - ⚡ Ургенција (urgency)

### 2. Класификација на Барања
- **INBOUND_RECEIPT** - Прием на стоки
- **OUTBOUND_PREPARATION** - Подготовка за испорака
- **OUTBOUND_DELIVERY** - Испорака до клиент
- **TRANSFER_DISTRIBUTION** - Внатрешно пренос
- **UNCLASSIFIED** - За рачна класификација

### 3. Менаџер Работен Проток
- Преглед на сите применети е-пошта
- Одобрување или одбивање на предложени задачи
- Доделување на координатор
- Аудит логирање на сите акции

### 4. Координатор Работен Проток
- Табела со задачи според улогата
- Ажурирање на статус (IN_PROGRESS, DONE, CANCELLED)
- Коментари на задачи
- Преглед на детали и изворна е-пошта

### 5. Известувања
- Ин-app известувања при доделување задачи
- Промени на статус
- Нови е-пошта за прегледување

---

## 📊 Кориснички Улоги

| Улога | Опис |
|-------|------|
| **MANAGER** | Прегледува, одобрува/одбива задачи |
| **RECEPTION_COORDINATOR** | Управува со прием на стоки |
| **DELIVERY_COORDINATOR** | Управува со испораки |
| **DISTRIBUTION_COORDINATOR** | Управува со дистрибуција |

---

## 🛠️ Технологии

- **Backend**: NestJS, Prisma, SQLite
- **Frontend**: Next.js 14, TypeScript, NextAuth.js
- **База на податоци**: SQLite (локално), PostgreSQL (производство)
- **API**: Microsoft Graph API за е-пошта
- **Автентикација**: Microsoft Entra ID

---

## 🚀 Пуштање во Работа

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npx prisma seed
npm run start:dev

# Frontend (нов терминал)
cd frontend
npm install
npm run dev
```

---

## 📝 API Ендпоинти

| Метод | Путања | Опис |
|-------|--------|------|
| GET | `/auth/me` | Тренување профил |
| GET/POST | `/emails` | Листа/креирање е-пошта |
| POST | `/emails/webhook` | Microsoft Graph вебхук |
| GET/POST | `/tasks` | Листа/креирање задачи |
| POST | `/tasks/:id/approve` | Одобрување |
| POST | `/tasks/:id/reject` | Одбивање |
| PUT | `/tasks/:id/status` | Промена статус |
| GET | `/users/coordinators` | Листа координатори |

---

## ✅ Имплементирани Фази

1. ✅ **Foundation** - Инфраструктура, автентикација, база
2. ✅ **Email Ingestion** - Поврзување со Outlook
3. ✅ **Parsing & Task Proposal** - Екстракција и класификација
4. ✅ **Manager Workflow** - Одобрување/одбивање
5. ✅ **Coordinator Workflow** - Управување со задачи
6. ✅ **Notifications** - Ин-app известувања
7. ✅ **Hardening** - Логирање, валидација, error handling

---

## 🔗 Линкови

- **GitHub**: https://github.com/kriptorodzo/LogiTask
- **Backend API**: http://localhost:4000/api/docs
- **Frontend**: http://localhost:3000