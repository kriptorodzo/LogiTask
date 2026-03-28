# Pilot Readiness Checklist

Use this checklist to verify all systems are ready before pilot start date.

---

## Pre-Flight Checks (Day Before Pilot)

### Infrastructure
- [ ] PostgreSQL database accessible
- [ ] Backend API responding on port 4000
- [ ] Frontend accessible on port 3000
- [ ] No critical errors in logs

### Authentication
- [ ] Azure AD app registered
- [ ] Redirect URIs configured
- [ ] At least 1 test user can login
- [ ] User roles correctly assigned

### Email Integration
- [ ] Microsoft Graph API permissions granted
- [ ] Mailbox access token valid
- [ ] Test email can be fetched

### Database
- [ ] Seed data loaded (pilot users)
- [ ] Routing rules active
- [ ] Test case can be created

---

## Day 0: Pilot Start

### Users & Access
- [ ] Manager user (manager@company.com) can access reports
- [ ] Coordinator users can login
- [ ] Role permissions verified

### Reports Access
- [ ] Manager can view all reports
- [ ] Overview page loads
- [ ] Cases list loads
- [ ] OTIF trend chart displays
- [ ] Coordinators page loads
- [ ] CSV export works

### Coordinator Tasks
- [ ] Reception coordinator sees assigned tasks
- [ ] Delivery coordinator sees assigned tasks
- [ ] Distribution coordinator sees assigned tasks
- [ ] Can update task status
- [ ] Can set completion result
- [ ] Can add comments

---

## Verification Tests

### Email Processing Test
1. Send test email to logistics@company.com
2. Verify email appears in system
3. Verify task is created
4. Verify assignment to correct coordinator

### OTIF Calculation Test
1. Complete a case with all timestamps
2. Verify OTIF = 100%
3. Verify "on time" indicator shows green
4. Verify "in full" indicator shows green

### Recalculation Test
1. Manually modify case timestamps
2. Trigger recalculate endpoint
3. Verify OTIF recalculates correctly

---

## Emergency Contacts

| Role | Name | Phone | Verified |
|------|------|-------|----------|
| Tech Lead | _________ | _________ | [ ] |
| On-Call | _________ | _________ | [ ] |
| Product | _________ | _________ | [ ] |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tech Lead | | | |
| Product Owner | | | |
| Engineering Manager | | | |