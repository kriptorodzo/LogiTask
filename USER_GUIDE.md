# 📖 LogiTask - Локално Стартување

## Prerequisites (Потребни алати)

1. **Node.js** (верзија 18+)
   - Провери: `node --version`

2. **Git** за pull на промени

---

## 🚀 Метод 1: Едноставен (Start скрипта)

### Windows:
```powershell
git pull origin main
start.bat
```

### Linux/Mac:
```bash
git pull origin main
chmod +x start.sh
./start.sh
```

Автоматски ќе:
- Инсталира dependencies
- Пушти миграции
- Seed податоци
- Го стартува backend и frontend

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

---

## 🐳 Метод 2: Docker

### Prerequisites:
- Docker Desktop инсталиран

### Стартување:
```bash
git pull origin main
docker compose up --build -d
```

### Проверка:
```bash
docker logs -f logitask-backend
docker logs -f logitask-frontend
```

### Стопирање:
```bash
docker compose down
```

---

## 🔧 Метод 3: Рачно Стартување

### 1. Backend
```powershell
cd backend

# Инсталирај dependencies
npm install

# Генерирај Prisma client
npx prisma generate

# Пушти миграции (SQLite)
npx prisma db push --force-reset

# Seed податоци
npm run prisma:seed

# Стартувај
npm run start:dev
```

### 2. Frontend (нов терминал)
```powershell
cd frontend
npm install
npm run dev
```

---

## 🔐 .env Фајлови

### Backend (`backend/.env`)
Се креира автоматски од start.bat/start.sh.
За рачно креирање:

```env
DATABASE_URL=file:./dev.db
AUTH_MODE=development
NODE_ENV=development
```

### Frontend (`frontend/.env.local`)
```env
BACKEND_URL=http://localhost:4000
```

---

## ✅ Проверка дека работи

1. Отвори: http://localhost:3000
2. Кликни "Sign In"
3. Избери роль и најави се
4. Провери Dashboard

---

## 🐛 Troubleshooting

### "DATABASE_URL not found"
```powershell
cd backend
echo DATABASE_URL=file:./dev.db > .env
npx prisma db push --force-reset
```

### "Prisma migrate dev fails"
```powershell
cd backend
rmdir /s /q migrations 2>nul
echo provider = "sqlite" > migration_lock.toml
npx prisma db push --force-reset
```

### Frontend не се поврзува со Backend
Провери дали backend работи:
```powershell
curl http://localhost:4000
```

---

## 📁 Структура на Проект

```
LogiTask/
├── backend/          # NestJS API сервер
│   ├── prisma/        # Database schema & migrations
│   ├── src/           # Source код
│   └── .env           # Конфигурација
├── frontend/         # Next.js апликација
│   ├── src/           # React компоненти
│   └── .env.local     # Конфигурација
├── docs/              # Документација
├── start.bat          # Windows старт скрипта
├── start.sh           # Linux/Mac старт скрипта
└── docker-compose.yml  # Docker конфигурација
```