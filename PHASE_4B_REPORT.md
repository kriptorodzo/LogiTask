# Manual Test Readiness & Bug Sweep - Phase 4B

## 🔍 Flow Analysis Results

### 1. MANAGER FLOW ✅ MOSTLY OK

| Check | Status | Notes |
|-------|--------|-------|
| Inbox speed | ✅ OK | Simplified card view loads quickly |
| Actions clarity | ✅ OK | Clear buttons: Approve All, Review |
| Approve All safety | ✅ OK | Opens DelegationModal, requires explicit selection |
| Details screen | ⚠️ PARTIAL | No actual "Review" modal implemented |

**Issues Found:**

| Issue | Severity | Type | Fix Required |
|-------|----------|------|--------------|
| No "Review/Detail" modal | MEDIUM | Missing Feature | Add modal to show full email + task details |
| Approve All button shows in wrong places | LOW | UX Bug | Shows even when some tasks already approved |

---

### 2. COORDINATOR FLOW ✅ GOOD

| Check | Status | Notes |
|-------|--------|-------|
| Workboard speed | ✅ OK | Grid loads well |
| Tabs logic | ✅ OK | my/today/in_progress/done/overdue work correctly |
| Role auto-filter | ✅ OK | ROLE_DEFAULT_FILTER mapping works |
| Start/Complete | ✅ OK | Simple status change flow |

**Minor Issues:**

| Issue | Severity | Type | Fix Required |
|-------|----------|------|--------------|
| No success feedback | LOW | UX | Show toast "Task started" / "Task completed" |
| Type filter default shows "all" if not in mapping | LOW | UX Bug | Fix `getDefaultFilter()` to always return role-appropriate default |

---

### 3. ERP FLOW ✅ IMPROVED

| Check | Status | Notes |
|-------|--------|-------|
| Template download | ✅ OK | CSV downloads correctly |
| Import flow clarity | ✅ OK | Step-by-step with help box |
| Route plans help | ✅ OK | Macedonian explanation clear |

**Issues Found:**

| Issue | Severity | Type | Fix Required |
|-------|----------|------|--------------|
| Template uses wrong column names | MEDIUM | Bug | Template has `documentNumber` but code expects `documentNumber` - check if API matches |
| Validation error messages are technical | LOW | UX | "Invalid document type" - should list valid types |
| JSON paste placeholder is confusing | LOW | UX | Too technical for business user |

---

### 4. REPORTS FLOW ✅ GOOD

| Check | Status | Notes |
|-------|--------|-------|
| KPI cards | ✅ OK | Clear and readable |
| Bar chart | ✅ OK | Visual and color-coded |
| Legend | ✅ OK | Explains colors |

**Minor Issues:**

| Issue | Severity | Type | Fix Required |
|-------|----------|------|--------------|
| No drill-down implemented | LOW | Missing | Clicking on number should show case details |
| Date range picker resets on load | LOW | UX | Should persist or default to last 30 days |

---

## 🐛 BUG LIST

### Critical (Must Fix Before Testing)

| # | Description | Location | Severity |
|---|-------------|-----------|----------|
| 1 | **Template column mismatch** - Template has different columns than validation expects | `erp/import/page.tsx` | CRITICAL |
| 2 | **No Review modal for manager** - Can't see full email/task details from card | `manager/page.tsx` | MEDIUM |

### High Priority

| # | Description | Location | Severity |
|---|-------------|-----------|----------|
| 3 | **Approve All shows when mixed statuses** - Shows even when some tasks already approved | `manager/page.tsx` line 443 | MEDIUM |
| 4 | **Default filter not always applied** - Can show "all" instead of role-appropriate default | `coordinator/page.tsx` line 58-62 | MEDIUM |

### Medium Priority

| # | Description | Location | Severity |
|---|-------------|-----------|----------|
| 5 | **No success/error toasts** - Actions complete silently | coordinator page | LOW |
| 6 | **Validation errors show raw codes** - Should show human-readable valid types | `erp/import/page.tsx` | LOW |
| 7 | **No drill-down in reports** - Can't click to see case details | `reports/page.tsx` | LOW |

---

## 🎨 UX ISSUES LIST

### High Priority (Affects User Understanding)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | Manager card has no "Review Details" button | manager/page.tsx | Add "Повеќе" / Details button that opens modal |
| 2 | No way to see full email content | manager/page.tsx | Show full email in detail modal |

### Medium Priority

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 3 | Approve All button confusing when some tasks already approved | manager/page.tsx | Only show when ALL tasks are PROPOSED |
| 4 | No feedback when task status changes | coordinator/page.tsx | Add simple toast: "✅ Завршена задача" |

### Low Priority

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 5 | Date picker in reports doesn't persist | reports/page.tsx | Add localStorage persistence |
| 6 | Route plans "prep offset" still confusing | erp/routes/page.tsx | Add more example scenarios |

---

## 📋 PRE-TEST READINESS

### ✅ Can Test (No Blocker)

- Coordinator workboard - ready
- Reports KPIs and charts - ready
- ERP template download - works
- ERP import validation - works
- Route plans help text - clear

### ⚠️ Should Fix Before Real User Testing

| Priority | Issue | Fix Complexity |
|----------|-------|----------------|
| HIGH | Add "Details" modal for manager | MEDIUM - Need to create modal component |
| HIGH | Fix Approve All button visibility | LOW - One-line condition fix |
| MEDIUM | Add toast notifications for coordinator actions | LOW - Add simple state-based message |
| MEDIUM | Fix default filter logic in coordinator | LOW - Logic fix in useEffect |

### ⏳ Can Defer

1. Drill-down in reports
2. Date range persistence
3. JSON paste help improvement
4. Validation message improvements

---

## 📊 SUMMARY

| Category | Status |
|----------|--------|
| Critical Bugs | 1 (Template column mismatch) |
| High Priority Issues | 3 |
| Medium Priority Issues | 4 |
| Low Priority Issues | 5 |

**Recommendation:** Fix the 2 HIGH items (Details modal + Approve All visibility) before scheduling real user testing. The rest are improvements that can come in next iteration.