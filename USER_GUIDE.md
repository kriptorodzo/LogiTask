# 📖 Упатство за Инсталација и Користење

## LogiTask - Процесор за Е-пошта во Логистика

---

## 🖥️ Инсталација

### Prerequisites (Потребни алати)

Пред да започнеш, инсталирај:

1. **Node.js** (верзија 18+)
   - Преземи од: https://nodejs.org
   - Провери: `node --version`

2. **Git** (опционално)
   - Преземи од: https://git-scm.com

### Опција 1: Преземи го проектот

```powershell
# Клонирај го проектот
git clone https://github.com/kriptorodzo/LogiTask.git

# Влези во проектот
cd LogiTask
```

### Опција 2: Користи гоzip

1. Оди на: https://github.com/kriptorodzo/LogiTask
2. Кликни **Code** → **Download ZIP**
3. Екстрактирај го во твојата папка

---

## ⚙️ Конфигурација

### Чекор 1: Креирај .env фајлови

#### Backend (.env)
Креирај фајл `backend/.env`:

```env
# База на податоци (не менувај)
DATABASE_URL="file:./dev.db"

# NextAuth (не менувај)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="logitask-development-secret-key-very-long-string-for-security"

# Azure AD (потребни се вистински вредности)
AZURE_AD_CLIENT_ID="твој-client-id-од-azure"
AZURE_AD_CLIENT_SECRET="твој-client-secret-од-azure"
AZURE_AD_TENANT_ID="твој-tenant-id-од-azure"

# Microsoft Graph API
MS_GRAPH_ACCESS_TOKEN=""
```

#### Frontend (.env.local)
Креирај фајл `frontend/.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=logitask-development-secret-key-very-long-string-for-security
AZURE_AD_CLIENT_ID=твој-client-id-од-azure
AZURE_AD_CLIENT_SECRET=твој-client-secret-од-azure
AZURE_AD_TENANT_ID=твој-tenant-id-од-azure
BACKEND_URL=http://localhost:4000
```

### Чекор 2: Инсталирај зависности

```powershell
# Backend
cd backend
npm install

# Frontend (во нов терминал)
cd frontend
npm install
```

### Чекор 3: Пушти миграции и seed

```powershell
cd backend
npx prisma generate
npx prisma migrate dev
```

---

## 🚀 Стартување

### Терминал 1 - Backend

```powershell
cd backend
npm run start:dev
```

Кога ќе видиш:
```
Application running on port 4000
```

### Терминал 2 - Frontend

```powershell
cd frontend
npm run dev
```

Кога ќе видиш:
```
Ready in ...ms
- Local: http://localhost:3000
```

---

## 👥 Упатство за Координатори

### 🎯 Влегување во системот

1. Отвори го прелистувачот
2. Оди на: http://localhost:3000
3. Кликни **Sign in with Microsoft**
4. Најави се со твојата компаниска сметка

---

### 📊 Dashboard (Почетна страница)

Откако ќе се најавиш, ќе ја видиш твојата **Dashboard** страница.

#### Горешно мени:
- **LogiTask** - Врати се на почетна
- **Број на известувања** - Кликни за да ги видиш
- **Твоето име** - Кликни за профил или одјава

#### Табови:
- **Tasks** - Твоите задачи
- **Emails** - Сите обработени е-пошта

---

### 📋 Работа со Задачи

#### Преглед на задачи
- Сите задачи се прикажани во табела
- Колони: Наслов, Тип, Статус, Доделено, Рок

#### Филтрирање
- Користи го dropdown за да филтрираш по статус:
  - **Proposed** - Чекаат одобрување
  - **Approved** - Одобрени
  - **In Progress** - Во тек
  - **Done** - Завршени

#### Ажурирање на статус
1. Кликни на задачата
2. Во детали, кликни на копчето за статус
3. Избери: **Start Progress** или **Mark Done**

---

### 📧 Преглед на Е-пошта

1. Оди на **Emails** табот
2. Кликни на една е-пошта
3. Ќе видиш:
   - **Subject** - Наслов
   - **From** - Праќач
   - **Body** - Содржина
   - **Extracted** - Автоматски извлечени податоци:
     - Supplier (добавувач)
     - Location (локација)
     - Delivery Date (датум на испорака)
     - Urgency (ургенција)
   - **Linked Tasks** - Поврзани задачи

---

### 💬 Коментари

Додади коментар на задача:
1. Отвори ја задачата
2. Скролирај до **Comments** делот
3. Напиши коментар
4. Кликни **Add Comment**

---

### 👨‍💼 За Менаџерите

Ако имаш улога **MANAGER**, ќе видиш дополнителни опции:

#### Одобрување на задачи
1. Оди на **Manager** страницата (линк во менито)
2. Ќе ги видиш сите **Proposed** задачи
3. За секоја задача:
   - **Approve** - Одобри и додели на координатор
   - **Reject** - Одбиј
   - **Edit** - Измени ги деталите

---

## 🔧 Troubleshooting (Решавање проблеми)

### Проблем: `npm install` не работи
**Решение:**
```powershell
# Избриши ја node_modules и retry
cd backend
rmdir /s /q node_modules
npm install
```

### Проблем: Базата не е креирана
**Решение:**
```powershell
cd backend
npx prisma migrate dev
```

### Проблем: Frontend не може да се поврзе со Backend
**Решение:** Провери дали backend работи на порта 4000
```powershell
curl http://localhost:4000
```

### Проблем: "DATABASE_URL not found"
**Решение:** Провери дали `.env` фајлот постои во `backend/` папката

---

## 📞 Помош

Ако имаш прашања или проблеми:
1. Провери дали серверите работат
2. Провери ги `.env` конфигурациите
3. Контактирај го администраторот

---

## 🔐 Azure AD Креденцијали

За да го користиш проектот со вистинска автентикација, треба:

1. Оди на **Azure Portal** → https://portal.azure.com
2. Креирај **App Registration** со име "LogiTask"
3. Копирај го **Client ID** и **Tenant ID**
4. Креирај **Client Secret**
5. Додај ги во `.env` фајловите

---

**Автор:** LogiTask Development Team  
**Верзија:** 1.0.0  
**Датум:** Март 2026