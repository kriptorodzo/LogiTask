# Incident Response Guide

## Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| P1 | Critical - System down | 15 min | Database unavailable |
| P2 | High - Major feature broken | 1 hour | Email processing stuck |
| P3 | Medium - Feature degraded | 4 hours | Report queries slow |
| P4 | Low - Minor issue | 24 hours | UI glitch |

---

## Escalation Path

```
P1/P2: On-call → Tech Lead → Engineering Manager → VP Engineering
P3:    Tech Lead → Engineering Manager
P4:    Team Lead
```

---

## Initial Response Checklist

- [ ] Acknowledge incident in #incidents channel
- [ ] Assess severity and assign level
- [ ] Notify appropriate on-call engineer
- [ ] Create incident ticket
- [ ] Begin investigation

---

## Common Incidents

### P1: Database Unavailable

**Symptoms**: All API calls return 500

**Actions**:
1. Check PostgreSQL status: `pg_isready -h <host>`
2. Check connection pool exhaustion
3. Review recent deployments
4. Restore from backup if needed

**Rollback**: Restore latest backup

---

### P2: Email Processing Stuck

**Symptoms**: No new tasks being created

**Actions**:
1. Check webhook endpoint status
2. Review email processor logs
3. Verify Azure AD token validity
4. Restart email processor service

**Rollback**: Redeploy last stable version

---

### P2: Report Calculation Errors

**Symptoms**: OTIF calculations returning incorrect values

**Actions**:
1. Check case aggregation service logs
2. Verify database integrity
3. Run recalculation for affected cases
4. Disable calculation until fixed

**Rollback**: Restore case data from backup

---

### P3: Slow Report Queries

**Symptoms**: Reports taking > 10 seconds

**Actions**:
1. Check database query performance
2. Identify slow queries with EXPLAIN
3. Add indexes if missing
4. Consider caching layer

---

## Communication Templates

### Initial Alert

```
🚨 INCIDENT: <title>
Severity: <P1/P2/P3/P4>
Status: Investigating
Affected: <service/feature>
Contact: <name>
```

### Update

```
📊 UPDATE: <title>
Status: <Investigating/Identified/Monitoring/Resolved>
Action: <what we're doing>
Next: <next step>
ETA: <if known>
```

### Resolution

```
✅ RESOLVED: <title>
Duration: <X hours>
Root Cause: <brief explanation>
Action Items: <link to post-mortem>
```

---

## Post-Incident Review

Within 48 hours of P1/P2:
1. Document timeline
2. Identify root cause
3. Define prevention actions
4. Share learnings with team

---

## Contact List

| Role | Name | Phone | Email |
|------|------|-------|-------|
| On-call Primary | _________ | _________ | _________ |
| On-call Backup | _________ | _________ | _________ |
| Engineering Manager | _________ | _________ | _________ |