# Backup Procedure

## Overview

This document describes the backup and restore procedures for LogiTask production environment.

---

## Database Backup

### PostgreSQL Backup

For PostgreSQL, use `pg_dump`:

```bash
# Daily backup (run via cron at 2 AM)
pg_dump -U <user> -h <host> -Fc logitask > backup_$(date +%Y%m%d).dump

# Keep last 30 days
find /backups -name "backup_*.dump" -mtime +30 -delete
```

### SQLite Backup (Development)

```bash
# Simple file copy when server is stopped
cp dev.db dev.db.backup
```

---

## Backup Schedule

| Frequency | Time | Retention | Type |
|-----------|------|-----------|------|
| Daily | 2:00 AM | 7 days | Full |
| Weekly | Sunday 3:00 AM | 4 weeks | Full |
| Monthly | 1st of month 4:00 AM | 12 months | Full |

---

## Restore Procedure

### PostgreSQL Restore

```bash
# Stop application
pm2 stop all

# Restore from backup
pg_restore -U <user> -h <host> -d logitask -c backup_YYYYMMDD.dump

# Verify
psql -U <user> -d logitask -c "SELECT COUNT(*) FROM User;"

# Start application
pm2 start all
```

### Point-in-Time Recovery (Optional)

For PITR, enable WAL archiving:
```sql
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /backup/wal/%f';
```

---

## Verification

- Test restore monthly
- Verify data integrity
- Document restore time

---

## Emergency Contacts

| Role | Contact |
|------|---------|
| DBA | _______________ |
| DevOps | _______________ |
| On-call | _______________ |