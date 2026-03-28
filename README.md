# Logistics Email Processor MVP

Welcome! This project helps logistics teams automate their operations by automatically reading emails, extracting task requests, and assigning them to the right coordinators.

An automated logistics email task management system that reads incoming emails, extracts operational requests, creates tasks, and assigns them to appropriate coordinators.

This project provides a complete solution for automating logistics operations by integrating with your email system and Azure AD authentication.

## Architecture

- **Frontend**: Next.js 14 with TypeScript, NextAuth.js for authentication
- **Backend**: NestJS with TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Microsoft Entra ID (Azure AD)
- **Email Integration**: Microsoft Graph API

## Project Structure

```plaintext
├── backend/                 # NestJS backend API
│   ├── src/
│   │   ├── auth/           # Azure AD authentication
│   │   ├── email/          # Email ingestion & processing
│   │   ├── task/           # Task management
│   │   ├── user/           # User management
│   │   └── prisma/         # Database service
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Initial seed data
│   └── package.json
│
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # API client & auth
│   │   └── types/         # TypeScript types
│   └── package.json
│
└── .agents_tmp/
    └── [PLAN.md](./.agents_tmp/PLAN.md)            # Implementation plan
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Azure AD application registration

### Backend Setup

```bash
cd backend
npm install

# Copy and configure environment variables
cp [.env.example](../backend/.env.example) .env
# Edit .env with your database and Azure AD credentials

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed initial data
npm run prisma:seed

# Start development server
npm run start:dev
```

### Frontend Setup

```bash
cd frontend
npm install

# Copy and configure environment variables
cp [.env.local.example](../frontend/.env.local.example) .env.local
# Edit .env.local with your NextAuth and backend URL

# Start development server
npm run dev
```

### Azure AD Configuration

1. Register an application in Microsoft Entra ID
2. Configure redirect URIs:
   - `http://localhost:3000/api/auth/callback/azure-ad`
   - `http://localhost:4000/auth/callback`
3. Add API permissions:
   - `User.Read`
   - `Mail.Read`
   - `Mail.Send`
4. Generate client secret and update environment variables

## Features

### Phase 1: Foundation
- Azure AD authentication
- PostgreSQL database with Prisma
- Role-based access control (Manager, Coordinators)

### Phase 2: Email Ingestion
- Microsoft Graph API integration
- Webhook subscriptions for new emails
- Email storage and normalization

### Phase 3: Task Proposal
- Entity extraction (supplier, location, date, urgency)
- Request type classification
- Automatic task creation with routing rules

### Phase 4: Manager Workflow
- Review proposed tasks
- Approve, edit, or reject tasks
- Assign to coordinators
- Audit logging

### Phase 5: Coordinator Workflow
- Role-based dashboards
- Task status updates
- Comments and collaboration

### Phase 6: Reports & OTIF
- Overview dashboard with KPI metrics
- OTIF trend charts (daily/weekly/monthly)
- Cases list with filters and export
- Coordinators performance analytics
- Suppliers & locations breakdown
- Delay reasons analysis
- Personal scorecard for coordinators
- Role-based access control for reports

### Phase 7: Pilot & Production Readiness
- Pilot configuration (users, scenarios)
- Monitoring & error handling
- Retry logic with exponential backoff
- Backup procedures
- Incident response guide

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
DATABASE_URL=postgresql://user:password@localhost:5432/logistics_db
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=your-azure-tenant-id
AZURE_CALLBACK_URL=http://localhost:4000/auth/callback
PORT=4000
```

### Frontend (.env.local)
```properties
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id
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