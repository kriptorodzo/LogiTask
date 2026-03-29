# Logistics Email Processor MVP

Welcome! This project helps logistics teams automate their operations by automatically reading emails, extracting task requests, and assigning them to the right coordinators.

An automated logistics email task management system that reads incoming emails, extracts operational requests, creates tasks, and assigns them to appropriate coordinators.

This project provides a complete solution for automating logistics operations by integrating with your email system and Azure AD authentication.

## 🚀 Quick Start (Docker)

```bash
# Start all services
cd /workspace/project/LogiTask
docker compose up --build -d

# Open browser
open http://localhost:3000
```

## 👥 Demo Users

| Role | Email | Password |
|------|-------|----------|
| Manager | manager@company.com | demo123 |
| Reception Coordinator | reception@company.com | demo123 |
| Delivery Coordinator | delivery@company.com | demo123 |
| Distribution Coordinator | distribution@company.com | demo123 |

## Architecture

- **Frontend**: Next.js 14 with TypeScript, NextAuth.js for authentication
- **Backend**: NestJS with TypeScript, Prisma ORM
- **Database**: SQLite (dev) / PostgreSQL (production)
- **Authentication**: Microsoft Entra ID (Azure AD) - Mock mode for demo
- **Email Integration**: Microsoft Graph API (production)

## Project Structure

```plaintext
├── backend/                 # NestJS backend API
│   ├── src/
│   │   ├── auth/           # Azure AD authentication
│   │   ├── email/          # Email ingestion & processing
│   │   ├── task/           # Task management
│   │   ├── user/           # User management
│   │   ├── reports/        # OTIF reporting
│   │   ├── performance/    # Performance tracking
│   │   └── erp/            # ERP integration
│   └── prisma/
│       ├── schema.prisma   # Database schema
│       ├── seed.ts         # Initial seed data
│       └── dev.db          # SQLite database
│
├── frontend/               # Next.js 14 frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # UI components (TopBar, KpiCard, etc.)
│   │   └── lib/           # API client, caching, utilities
│   └── public/           # Static assets
│
├── docs/                  # Documentation
│   ├── user-onboarding.md
│   ├── access-matrix.md
│   └── smoke-test-checklist.md
│
└── docker-compose.yml     # Docker orchestration
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with KPIs and recent activity |
| `/manager` | Manager inbox with email/tasks management |
| `/coordinator` | Coordinator personal inbox |
| `/reports` | OTIF reports with date filtering |
| `/performance/leaderboard` | Coordinator rankings |
| `/performance/scorecard` | Individual performance metrics |
| `/admin/erp` | ERP administration panel |

## Features

### Core Modules
- **Email Inbox**: Automated email classification and routing
- **Task Management**: PROPOSED → APPROVED → IN_PROGRESS → DONE workflow
- **Performance v2**: KPI cards, scorecards, leaderboards
- **Reports**: OTIF metrics, coordinator stats, date range filtering
- **ERP Integration**: Document import, route plans, batch processing

### UI Components (Premium)
- `TopBar` - Header with breadcrumbs
- `Sidebar` - Navigation
- `KpiCard` - Metric display with trends
- `StatusBadge` - Status indicators
- `Tabs` - Tab navigation
- `Card` - Modular card component
- `EmptyState` - Empty data display
- `Loading/Skeleton` - Loading placeholders

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for Docker setup)
- PostgreSQL (for local without Docker)

### Backend Setup

```bash
cd backend
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate

# Seed initial data
npx prisma db seed

# Start development server
npm run start:dev
```

### Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev
```

## User Roles

| Role | Responsibilities |
|------|------------------|
| MANAGER | Review proposed tasks, approve/reject, assign to coordinators |
| RECEPTION_COORDINATOR | Handle inbound receipts |
| DELIVERY_COORDINATOR | Handle outbound preparation and delivery |
| DISTRIBUTION_COORDINATOR | Handle transfer, transport & distribution |

## API Documentation

Once the backend is running, visit [http://localhost:4000/api/docs](http://localhost:4000/api/docs) for Swagger documentation.

## Environment Variables

### Backend (.env)
```properties
DATABASE_URL=file:./prisma/dev.db
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
PORT=4000
```

### Frontend (.env.local)
```properties
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
BACKEND_URL=http://localhost:4000
```

## Deployment

Ready to go to production? Here's how to deploy:

1. Set up Azure resources (App Service, PostgreSQL, Key Vault)
2. Configure environment variables in Azure
3. Set up Microsoft Graph app-only authentication
4. Configure webhook URL for production
5. Set up monitoring and logging

## License

MIT