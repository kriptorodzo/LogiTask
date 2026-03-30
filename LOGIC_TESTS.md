# 🧪 LogiTask Logic Tests - Core Business Logic Verification

## Цел
Тестирај дали core business logic е точна и конзистентна, не само UI.

---

## TEST SUITE 1: Email → Case → Task Logic

### TL-001: Email Processing - Creates Case
```
Setup: Email со processingStatus = PROCESSED
Action: Email се процесира
Expected: EmailCase се креира
```

**Validation:**
```sql
SELECT * FROM EmailCase WHERE emailId = '<email_id>';
-- Очекување: Еден запис
```

### TL-002: Email Processing - Creates Task
```
Setup: Email со requestType = 'INBOUND_RECEIPT'
Action: Email се процесира
Expected: Task се креира со:
  - requestType = 'INBOUND_RECEIPT'
  - status = 'PROPOSED'
  - assigneeId = NULL (не е доделен уште)
```

**Validation:**
```sql
SELECT * FROM Task WHERE emailId = '<email_id>';
-- Очекување: Еден запис со status = 'PROPOSED'
```

### TL-003: Multi-Task Email
```
Setup: Email што бара 2 типа на tasks (Prep + Delivery)
Action: Email се процесира
Expected: 2 Tasks се креираат
  - Task 1: requestType = 'OUTBOUND_PREPARATION'
  - Task 2: requestType = 'OUTBOUND_DELIVERY'
```

**Validation:**
```sql
SELECT requestType, status FROM Task WHERE emailId = '<email_id>';
-- Очекување: 2 записа
```

### TL-004: No-Task Email (Info Only)
```
Setup: Email со requestType = 'OTHER' или податоци за само info
Action: Email се процесира
Expected: НЕ се креира task
```

**Validation:**
```sql
SELECT COUNT(*) FROM Task WHERE emailId = '<email_id>';
-- Очекување: 0
```

### TL-005: Unclassified Email
```
Setup: Email со requestType = 'UNCLASSIFIED'
Action: Ништо не се менува
Expected: 
  - Нема task креирано
  - Case е NONE или UNCLASSIFIED
```

**Validation:**
```sql
SELECT processingStatus, requestType FROM Email WHERE id = '<email_id>';
-- Очекување: processingStatus = 'PENDING', requestType = 'UNCLASSIFIED'
```

---

## TEST SUITE 2: Approve/Delegate Logic

### TL-010: Single Task Approval
```
Setup: Task со status = 'PROPOSED'
Action: Manager го одобрува + доделува на coordinator
Expected:
  - Task.status = 'APPROVED'
  - Task.assigneeId = '<coordinator_id>'
  - Task.assignedAt = NOW()
```

**Validation:**
```sql
SELECT status, assigneeId, assignedAt FROM Task WHERE id = '<task_id>';
-- Очекување: APPROVED, assigneeId NOT NULL, assignedAt NOT NULL
```

### TL-011: Bulk Approve All
```
Setup: Email со 3 tasks, сите PROPOSED
Action: Manager клика "Approve All" + избира coordinator
Expected:
  - Сите 3 tasks = APPROVED
  - Сите 3 tasks = ист assignee
  - Сите 3 tasks = ист assignedAt
```

**Validation:**
```sql
SELECT status, assigneeId FROM Task WHERE emailId = '<email_id>';
-- Очекување: 3 записа, сите APPROVED, ист assigneeId
```

### TL-012: Partial Approve (Mixed Status)
```
Setup: Email со 3 tasks:
  - Task 1: DONE
  - Task 2: PROPOSED
  - Task 3: PROPOSED
Action: Manager клика "Approve All"
Expected:
  - Tasks 2 и 3 = APPROVED
  - Task 1 останува DONE
```

**Validation:**
```sql
SELECT status FROM Task WHERE emailId = '<email_id>' ORDER BY createdAt;
-- Очекување: DONE, APPROVED, APPROVED
```

### TL-013: Safe Delegation - No Unsafe Default
```
Setup: Нема достапен coordinator
Action: Manager клика "Approve All"
Expected:
  - NE се доделува на random coordinator
  - Отвора DelegationModal за избор
```

**Логика:**
```typescript
// Pseudo-code
if (suggestedRole && noCoordinatorForRole(suggestedRole)) {
  // Отвори modal, не користеј default!
  openDelegationModal();
}
```

### TL-014: Routing Rule Assignment
```
Setup: Task со requestType = 'INBOUND_RECEIPT'
Action: Системот предлага coordinator
Expected:
  - Suggested role = 'RECEPTION_COORDINATOR'
  - Базирано на RoutingRule табела
```

**Validation:**
```sql
SELECT assigneeRole FROM RoutingRule WHERE requestType = 'INBOUND_RECEIPT';
-- Очекување: 'RECEPTION_COORDINATOR'
```

---

## TEST SUITE 3: Task State Machine

### TL-020: Task Status Flow
```
Setup: Task(status = 'PROPOSED')
Transitions:
  1. APPROVED ← Manager approve
  2. IN_PROGRESS ← Coordinator start
  3. DONE ← Coordinator complete
  4. REJECTED ← Manager reject (од PROPOSED)
```

**Validation:**
```sql
-- Провери ја историјата
SELECT fromStatus, toStatus FROM TaskStatusHistory 
WHERE taskId = '<task_id>' 
ORDER BY changedAt;
-- Очекување: chronological transitions
```

### TL-021: Invalid Transition Blocked
```
Setup: Task(status = 'PROPOSED')
Action: Coordinator се обидува да кликне "Заврши"
Expected:
  - Копчето "Заврши" НЕ е прикажано
  - Не може да премине DONE од PROPOSED
```

**Логика:**
```typescript
// Pseudo-code
canTransition(currentStatus, newStatus) {
  if (currentStatus === 'PROPOSED' && newStatus === 'DONE') return false;
  // Само: PROPOSED → APPROVED → IN_PROGRESS → DONE
}
```

### TL-022: Overdue Detection
```
Setup: Task(status = 'IN_PROGRESS', dueDate = yesterday)
Action: Се пресметува overload status
Expected:
  - task.isOverdue = true
  - Прикажува се во "Доцне" tab
```

**Validation:**
```sql
SELECT * FROM Task 
WHERE status = 'IN_PROGRESS' 
AND dueDate < NOW();
-- Очекување: Сите задоцнети tasks
```

### TL-023: Completion Result
```
Setup: Task(status = 'DONE')
Action: Coordinator завршува task
Expected:
  - Task.completionResult = 'FULL' (default)
  - или 'PARTIAL' ако делумно
  - или 'FAILED' ако неуспешно
```

**Validation:**
```sql
SELECT completionResult, completedAt FROM Task WHERE id = '<task_id>';
-- Очекување: completionResult NOT NULL, completedAt NOT NULL
```

---

## TEST SUITE 4: Case Status Calculation

### TL-030: Case Status from Tasks
```
Setup: EmailCase со 3 tasks:
  - Task 1: DONE
  - Task 2: IN_PROGRESS
  - Task 3: PROPOSED
Action: Системот пресметува caseStatus
Expected:
  - caseStatus = 'IN_PROGRESS' (највисок активен)
  - completedTasks = 1
  - totalTasks = 3
```

**Validation:**
```sql
SELECT caseStatus, totalTasks, completedTasks 
FROM EmailCase WHERE id = '<case_id>';
-- Очекување: IN_PROGRESS, 3, 1
```

### TL-031: Case DONE (All Tasks Complete)
```
Setup: EmailCase со 3 tasks, сите DONE
Action: Последен task е завршен
Expected:
  - caseStatus = 'DONE'
  - completedTasks = 3
  - completedAt = NOW()
```

**Validation:**
```sql
SELECT caseStatus, completedTasks, completedAt 
FROM EmailCase WHERE id = '<case_id>';
-- Очекување: DONE, 3, NOT NULL
```

### TL-032: Case PARTIAL (Some Tasks Partial)
```
Setup: Tasks:
  - Task 1: DONE, completionResult = 'FULL'
  - Task 2: DONE, completionResult = 'PARTIAL'
Action: Пресметка
Expected:
  - caseStatus = 'PARTIAL'
  - partialTasks = 1
```

**Validation:**
```sql
SELECT caseStatus, partialTasks FROM EmailCase WHERE id = '<case_id>';
-- Очекување: PARTIAL, 1
```

### TL-033: Case FAILED (Required Task Failed)
```
Setup: Required task:
  - Task 1: DONE, completionResult = 'FAILED'
Action: Пресметка
Expected:
  - caseStatus = 'FAILED'
  - failedTasks = 1
```

**Validation:**
```sql
SELECT caseStatus, failedTasks FROM EmailCase WHERE id = '<case_id>';
-- Очекување: FAILED, 1
```

---

## TEST SUITE 5: ERP → Task Logic

### TL-040: Purchase Order → Inbound Receipt
```
Setup: ErpDocument(documentType = 'PURCHASE_ORDER')
Action: Документ се импортира
Expected:
  - Се креира Task(requestType = 'INBOUND_RECEIPT')
  - Task се доделува на RECEPTION_COORDINATOR role
```

**Validation:**
```sql
SELECT requestType FROM Task WHERE erpDocumentId = '<doc_id>';
-- Очекување: 'INBOUND_RECEIPT'
```

### TL-041: Goods Receipt → Reception Complete
```
Setup: ErpDocument(documentType = 'GOODS_RECEIPT')
Action: Документ се импортира
Expected:
  - Task(requestType = 'INBOUND_RECEIPT')
  - Task е за reception completion
```

### TL-042: Sales Order → Outbound Tasks
```
Setup: ErpDocument(documentType = 'SALES_ORDER')
Action: Документ се импортира
Expected:
  - Task(requestType = 'OUTBOUND_PREPARATION')
  - Task(requestType = 'OUTBOUND_DELIVERY')
  - 2 tasks за еден документ
```

**Validation:**
```sql
SELECT requestType FROM Task WHERE erpDocumentId = '<doc_id>';
-- Очекување: 2 записа
```

### TL-043: Shipment Order → Distribution
```
Setup: ErpDocument(documentType = 'SHIPMENT_ORDER')
Action: Документ се импортира
Expected:
  - Task(requestType = 'TRANSFER_DISTRIBUTION')
```

**Validation:**
```sql
SELECT requestType FROM Task WHERE erpDocumentId = '<doc_id>';
-- Очекување: 'TRANSFER_DISTRIBUTION'
```

---

## TEST SUITE 6: KPI/OTIF Logic

### TL-050: OTIF Calculation
```
Setup: EmailCase:
  - isOnTime = true
  - isInFull = true
Action: Пресметка
Expected:
  - isOtif = true (и on-time И in-full)
```

**Validation:**
```sql
SELECT isOtif FROM EmailCase WHERE id = '<case_id>';
-- Очекување: isOnTime=true AND isInFull=true → isOtif=true
```

### TL-051: OTIF Rate in Reports
```
Setup: 10 cases, 7 are OTIF
Action: Пресметка на OTIF rate
Expected:
  - otifRate = 70% (7/10)
```

**Validation:**
```sql
SELECT 
  SUM(CASE WHEN isOtif = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as otifRate
FROM EmailCase
WHERE completedAt >= '<start_date>' AND completedAt <= '<end_date>';
```

### TL-052: Role-Specific KPI
```
Setup: Coordinator(reception):
  - tasksDone = 15
  - tasksOverdue = 2
Action: Пресметка на KPI
Expected:
  - receptionScore = calculated from reception tasks only
  - Не мешај други roles
```

**Validation:**
```sql
-- Провери дали CoordinatorKPI ги содржи само tasks од неговата role
SELECT * FROM CoordinatorKPI WHERE userId = '<user_id>';
-- Очекување: tasksTotal ги вклучува само INBOUND_RECEIPT tasks
```

### TL-053: Performance Score Calculation
```
Setup: Coordinator со:
  - accuracy = 85
  - otif = 90
  - prepOnTime = 80
Action: Пресметка на totalScore
Expected:
  - totalScore = weighted average
```

**Логика:**
```typescript
// Reception: (accuracy * 0.3) + (otif * 0.4) + (prepOnTime * 0.3)
// Delivery: (accuracy * 0.3) + (otif * 0.3) + (deliveryOnTime * 0.4)
// Distribution: (accuracy * 0.3) + (otif * 0.4) + (distributionOnTime * 0.3)
```

---

## TEST SUITE 7: Edge Cases

### TL-060: Task without Email
```
Setup: Task(erpDocumentId = '<doc_id>', emailId = NULL)
Action: Прикажување во workboard
Expected:
  - Task се прикажува
  - Source е "ERP" not "Email"
```

### TL-061: Required vs Optional Task
```
Setup: Task(isRequiredForCase = false)
Action: Case status пресметка
Expected:
  - Овој task не се брои за DONE/PARTIAL
```

### TL-062: Dependency Between Tasks
```
Setup: Task A blocks Task B
Action: Проверка на dependencies
Expected:
  - Task B не може да почне ако Task A не е DONE
```

### TL-063: Case with No Tasks
```
Setup: EmailCase со totalTasks = 0
Action: Status пресметка
Expected:
  - Може да се затвори и без tasks
```

---

## 📊 TEST RESULTS TEMPLATE

| Test ID | Description | Expected | Actual | Pass/Fail |
|---------|-------------|----------|--------|-----------|
| TL-001 | Email → Case | Case created | | |
| TL-002 | Email → Task | Task created | | |
| TL-010 | Approve Single | APPROVED status | | |
| TL-011 | Bulk Approve | All APPROVED | | |
| ... | | | | |

---

## 🚨 FAILURE REPORT TEMPLATE

```markdown
## FAILED TEST: [TL-XXX]

### Expected Behavior:
[Што очекуваме]

### Actual Behavior:
[Што се случува]

### Evidence:
[SQL results, screenshots]

### Suggested Fix:
[Логика што треба да се поправи]
```

---

## ✅ SIGN-OFF

| Category | Status |
|----------|--------|
| Email → Case logic | ⬜ PASS / ❌ FAIL |
| Task state machine | ⬜ PASS / ❌ FAIL |
| Approve/Delegate logic | ⬜ PASS / ❌ FAIL |
| ERP → Task logic | ⬜ PASS / ❌ FAIL |
| Case status calculation | ⬜ PASS / ❌ FAIL |
| KPI/OTIF logic | ⬜ PASS / ❌ FAIL |
| Edge cases | ⬜ PASS / ❌ FAIL |

**Overall: READY / NEEDS FIX**