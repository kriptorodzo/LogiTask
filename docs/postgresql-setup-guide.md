# PostgreSQL Setup Guide for Pilot

This guide provides exact commands to set up PostgreSQL for the LogiTask pilot.

---

## Option 1: Local PostgreSQL Installation

### macOS
```bash
# Install via Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb logitask
```

### Ubuntu/Debian
```bash
# Install
sudo apt-get update
sudo apt-get install postgresql-15 postgresql-client-15

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user and database
sudo -u postgres createuser -s postgres
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';"
sudo -u postgres createdb logitask
```

### Windows
Download and install from: https://www.postgresql.org/download/windows/

---

## Option 2: Docker PostgreSQL

```bash
# Run PostgreSQL container
docker run -d \
  --name logitask-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=logitask \
  -p 5432:5432 \
  postgres:15-alpine

# Verify it's running
docker ps | grep logitask-postgres
```

---

## Option 3: Cloud PostgreSQL

### Azure Database for PostgreSQL
1. Go to Azure Portal → Create PostgreSQL Flexible Server
2. Configure:
   - Server name: `logitask-pilot`
   - Username: `logitask`
   - Password: `<strong-password>`
   - Location: appropriate region
3. After creation, get connection string:
   ```
   postgresql://logitask:<password>@logitask-pilot.postgres.database.azure.com:5432/logitask?sslmode=require
   ```

### AWS RDS PostgreSQL
1. Create RDS instance with PostgreSQL engine
2. Configure security groups for access
3. Get connection string from RDS console

### Supabase (Quick Start)
1. Create project at supabase.com
2. Get connection string from Settings → Database
3. Use connection string like:
   ```
   postgresql://postgres:<password>@db.xxx.supabase.co:5432/postgres
   ```

---

## Environment Configuration

### For Local/Cloud PostgreSQL

Create `.env` file in `backend/`:
```bash
# Database - PostgreSQL for pilot
DATABASE_URL="postgresql://postgres:password@localhost:5432/logitask?schema=public"

# For cloud (example):
# DATABASE_URL="postgresql://logitask:mypassword@logitask-pilot.postgres.database.azure.com:5432/logitask?sslmode=require"

# Auth - PRODUCTION mode (no dev bypass)
AUTH_MODE=production
NODE_ENV=production

# NextAuth
NEXTAUTH_SECRET=<generate-random-secret>
NEXTAUTH_URL=http://localhost:3000

# Azure AD
AZURE_AD_CLIENT_ID=<your-client-id>
AZURE_AD_CLIENT_SECRET=<your-client-secret>
AZURE_AD_TENANT_ID=<your-tenant-id>

# Server
PORT=4000
```

---

## Step-by-Step Setup Commands

### 1. Set Environment
```bash
cd /workspace/project/LogiTask/backend

# Copy example env and configure
cp .env.example .env
# Edit .env with your DATABASE_URL
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Run Migrations
```bash
# For new database - creates all tables
npx prisma migrate deploy

# Or for development/testing:
npx prisma migrate dev --name init
```

### 4. Seed Database
```bash
npx prisma db seed
```

### 5. Verify Setup
```bash
# Test database connection
npx prisma db execute --sql "SELECT 1"

# List tables
npx prisma studio  # Opens web UI to view data
```

### 6. Start Backend
```bash
npm run start:dev
```

---

## Troubleshooting

### Connection Refused
- Check PostgreSQL is running: `pg_isready` or `docker ps`
- Verify port 5432 is not blocked
- Check firewall rules

### Authentication Failed
- Verify username/password in DATABASE_URL
- For PostgreSQL 15+, may need: `scram-sha-256` auth method

### SSL Errors
- Add `?sslmode=require` to connection string
- For local dev, can use `?sslmode=disable`

### Schema Issues
- Ensure `?schema=public` is in connection string
- Run: `npx prisma migrate resolve --name <migration-name>`

---

## Verification Checklist

Run these commands to verify PostgreSQL is working:

```bash
# 1. Test connection
pg_isready -h localhost -p 5432

# 2. List databases
psql -h localhost -U postgres -d logitask -c "\l"

# 3. List tables (after migration)
psql -h localhost -U postgres -d logitask -c "\dt"

# 4. Count users (after seed)
psql -h localhost -U postgres -d logitask -c "SELECT COUNT(*) FROM \"User\";"
```

---

## After PostgreSQL is Running

Once PostgreSQL is configured and working:

1. Update `docs/pilot-readiness-checklist.md`:
   - ✅ PostgreSQL production/pilot database конфигурирана
   - ✅ Database connectivity потврдена

2. Proceed to Azure AD / Graph verification

3. Then set Planned Pilot Start Date

4. Final Go / No-Go decision