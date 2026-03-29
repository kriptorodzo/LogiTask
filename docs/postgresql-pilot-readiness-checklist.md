# PostgreSQL Pilot Readiness Checklist

Use this checklist to verify PostgreSQL database configuration before pilot start.

---

## 1. Database Configuration ⚠️ CRITICAL

- [ ] `DATABASE_URL` environment variable is set for pilot environment
- [ ] **Prisma schema provider changed from SQLite to PostgreSQL**
- [ ] Format: `postgresql://user:password@host:5432/logistics_db`
- [ ] Credentials are stored in secrets manager, NOT in source control
- [ ] Connection string uses secure password
- [ ] SSL/TLS is enforced for production connections

---

## 2. Schema & Migrations

- [ ] Prisma schema is configured for PostgreSQL
- [ ] `prisma migrate deploy` runs successfully
- [ ] All tables are created:
  - [ ] `User`
  - [ ] `Email`
  - [ ] `Task`
  - [ ] `TaskStatusHistory`
  - [ ] `EmailCase`
  - [ ] `Notification`
  - [ ] `KpiSnapshot`
  - [ ] Other tables as per schema
- [ ] No SQLite fallback in production

---

## 3. Connection & Pooling

- [ ] Connection pool is configured appropriately
- [ ] Pool settings (min, max) are reasonable for expected load
- [ ] Connection timeout is set
- [ ] No connection leaks in test runs

---

## 4. Seed Data

- [ ] `prisma db seed` runs successfully on pilot database
- [ ] Pilot users are created:
  - [ ] manager@company.com (MANAGER role)
  - [ ] reception@company.com (RECEPTION_COORDINATOR role)
  - [ ] delivery@company.com (DELIVERY_COORDINATOR role)
  - [ ] distribution@company.com (DISTRIBUTION_COORDINATOR role)
- [ ] Demo emails exist (if applicable)
- [ ] Routing rules are active

---

## 5. Application Integration

### Backend Startup Test
```bash
cd backend
export DATABASE_URL="postgresql://..."
export NODE_ENV=production
npm run start:dev
```
- [ ] Backend starts without SQLite errors
- [ ] Connects to PostgreSQL successfully
- [ ] Health endpoint responds

### Data Operations Test
- [ ] Can create/read/update emails
- [ ] Can create/read/update tasks
- [ ] Can create/read email cases
- [ ] Can create audit log entries
- [ ] Can create/read notifications
- [ ] Task status history is recorded correctly

---

## 6. Backup & Recovery

- [ ] Backup procedure is documented for PostgreSQL
- [ ] Automated backups are scheduled
- [ ] Backup restoration is tested
- [ ] Point-in-time recovery is configured (if needed)
- [ ] Backup retention policy is defined

---

## 7. Security

- [ ] Database credentials are in Azure Key Vault or secrets manager
- [ ] No credentials in `.env` files committed to version control
- [ ] Database user has least privilege access (not root/admin)
- [ ] SSL/TLS enforced for all connections
- [ ] Database firewall rules are configured

---

## 8. Monitoring & Alerts

- [ ] Database monitoring is enabled
- [ ] Connection count is monitored
- [ ] Query performance is tracked
- [ ] Alerts are set for:
  - [ ] High connection count
  - [ ] Slow queries
  - [ ] Disk space low
  - [ ] Backup failures

---

## 9. Smoke Test Results

| Test | Status | Notes |
|------|--------|-------|
| Backend starts on PostgreSQL | [ ] | |
| Can login as manager | [ ] | |
| Can view manager inbox | [ ] | |
| Can approve task | [ ] | |
| Can login as coordinator | [ ] | |
| Can view assigned tasks | [ ] | |
| Can update task status | [ ] | |
| Reports show data | [ ] | |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| IT / Database Admin | | | |
| Tech Lead | | | |
| Product Owner | | | |