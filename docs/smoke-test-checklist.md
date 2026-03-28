# Day 0 Smoke Test Checklist

Complete this checklist before pilot launch to verify all core functionality works.

---

## 1. Authentication Test
- [ ] Open frontend at http://localhost:3000
- [ ] Click "Sign in with Azure AD"
- [ ] Verify login as manager@company.com works
- [ ] Verify role shows as "MANAGER"
- [ ] Logout and login as reception@company.com
- [ ] Verify role shows as "RECEPTION_COORDINATOR"

---

## 2. Dashboard Access
- [ ] Manager can access /manager
- [ ] Manager can access /reports
- [ ] Manager can access /reports/cases
- [ ] Coordinator can access /tasks
- [ ] Coordinator CANNOT access /reports (should be blocked or see limited data)

---

## 3. Task Creation (Simulated)
- [ ] Create test case manually via API or seed
- [ ] Verify task appears in coordinator's task list
- [ ] Verify task has PROPOSED status

---

## 4. Manager Approval Flow
- [ ] Login as manager
- [ ] Navigate to /manager
- [ ] Find proposed task
- [ ] Click "Approve"
- [ ] Verify status changes to APPROVED
- [ ] Verify task is assigned to coordinator

---

## 5. Coordinator Task Update
- [ ] Login as coordinator
- [ ] Navigate to /tasks
- [ ] Find assigned task
- [ ] Click task to open details
- [ ] Update status to IN_PROGRESS
- [ ] Verify status change is reflected

---

## 6. Task Completion
- [ ] Complete task with "FULL" result
- [ ] Verify completedAt timestamp is set
- [ ] Verify isOnTime/isInFull calculated

---

## 7. Reports & OTIF
- [ ] Navigate to /reports as manager
- [ ] Verify overview page loads
- [ ] Verify OTIF metrics are displayed
- [ ] Navigate to /reports/cases
- [ ] Verify case list loads with pagination
- [ ] Click CSV Export button
- [ ] Verify CSV file downloads

---

## 8. Personal Scorecard
- [ ] Login as coordinator
- [ ] Navigate to /reports/scorecard
- [ ] Verify personal metrics displayed

---

## 9. API Health
- [ ] Backend running on port 4000
- [ ] Health endpoint responds: curl http://localhost:4000
- [ ] Reports API responds: curl http://localhost:4000/api/reports/overview

---

## 10. Error Handling
- [ ] Try accessing non-existent case
- [ ] Verify error message is user-friendly
- [ ] Try unauthorized action
- [ ] Verify 403 response

---

## Test Data

| User | Email | Role | Password |
|------|-------|------|----------|
| Manager | manager@company.com | MANAGER | (Azure AD) |
| Reception | reception@company.com | RECEPTION_COORDINATOR | (Azure AD) |
| Delivery | delivery@company.com | DELIVERY_COORDINATOR | (Azure AD) |
| Distribution | distribution@company.com | DISTRIBUTION_COORDINATOR | (Azure AD) |

---

## Quick Validation Commands

```bash
# Test backend health
curl http://localhost:4000

# Test reports API
curl http://localhost:4000/api/reports/overview

# Test tasks API
curl http://localhost:4000/api/tasks
```

---

## Sign-Off

| Test | Status | Tester | Date |
|------|--------|--------|------|
| Authentication | [ ] | | |
| Dashboard Access | [ ] | | |
| Task Creation | [ ] | | |
| Manager Approval | [ ] | | |
| Task Completion | [ ] | | |
| Reports & OTIF | [ ] | | |
| Personal Scorecard | [ ] | | |
| API Health | [ ] | | |
| Error Handling | [ ] | | |

**Result: [ ] PASS / [ ] FAIL**