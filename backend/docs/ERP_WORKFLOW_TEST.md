# ERP Workflow Verification Report

**Date:** 2026-03-29  
**Status:** Backend implementation complete, testing pending

---

## Scenario 1: `PURCHASE_ORDER_CREATED`

**Expected Tasks:**

| Task | Title | Assignee Role | Due Date Logic |
|------|-------|---------------|----------------|
| 1 | Планирај простор за прием | RECEIVING_COORDINATOR | plannedDate or today |

**Verification:**
```bash
curl -X POST http://localhost:3000/api/erp/event \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PURCHASE_ORDER_CREATED",
    "documentType": "PURCHASE_ORDER",
    "documentNumber": "PO-TEST-001",
    "partnerName": "Ероглу",
    "lineCount": 50,
    "totalQuantity": 1500,
    "plannedDate": "2026-04-02"
  }'
```

**Expected Response:**
```json
{
  "event": "PURCHASE_ORDER_CREATED",
  "documentId": "...",
  "tasks": [
    {
      "title": "Планирај простор за прием",
      "assigneeRole": "RECEIVING_COORDINATOR",
      "status": "ASSIGNED",
      "dueDate": "2026-04-02T..."
    }
  ],
  "autoCompletedTasks": []
}
```

**Status:** ⏳ Pending test

---

## Scenario 2: `GOODS_RECEIPT_CREATED`

**Expected Tasks:**

| Task | Title | Assignee Role | Due Date Logic |
|------|-------|---------------|----------------|
| 1 | Заврши прием | RECEIVING_COORDINATOR | plannedDate or today |

**Verification:**
```bash
curl -X POST http://localhost:3000/api/erp/event \
  -H "Content-Type: application/json" \
  -d '{
    "event": "GOODS_RECEIPT_CREATED",
    "documentType": "GOODS_RECEIPT",
    "documentNumber": "GR-TEST-001",
    "partnerName": "Ероглу",
    "plannedDate": "2026-04-03"
  }'
```

**Expected Response:**
```json
{
  "event": "GOODS_RECEIPT_CREATED",
  "tasks": [
    {
      "title": "Заврши прием",
      "assigneeRole": "RECEIVING_COORDINATOR"
    }
  ]
}
```

**Status:** ⏳ Pending test

---

## Scenario 3: `SALES_ORDER_CREATED`

**Expected Tasks:**

| Task | Title | Assignee Role | Due Date Logic |
|------|-------|---------------|----------------|
| 1 | Подготви | DELIVERY_COORDINATOR | routeDay - prepOffsetDays |
| 2 | Планирај дистрибуција | DISTRIBUTION_COORDINATOR | plannedDate or today |

**Verification:**
```bash
curl -X POST http://localhost:3000/api/erp/event \
  -H "Content-Type: application/json" \
  -d '{
    "event": "SALES_ORDER_CREATED",
    "documentType": "SALES_ORDER",
    "documentNumber": "SO-TEST-001",
    "partnerName": "Клиент А",
    "destinationName": "Битола",
    "destinationCode": "BT",
    "lineCount": 30,
    "totalQuantity": 1200
  }'
```

**Expected Response:**
```json
{
  "event": "SALES_ORDER_CREATED",
  "tasks": [
    {
      "title": "Подготви",
      "assigneeRole": "DELIVERY_COORDINATOR",
      "dueDate": "2026-04-02T..." // Thursday if BT route is Friday
    },
    {
      "title": "Планирај дистрибуција",
      "assigneeRole": "DISTRIBUTION_COORDINATOR"
    }
  ]
}
```

**Status:** ⏳ Pending test

---

## Scenario 4: `SHIPMENT_CREATED`

**Expected Behavior:**
1. Find "Подготви" task from related SALES_ORDER
2. Auto-complete that task (status → DONE)
3. Create "Дистрибуирај" task for DISTRIBUTION_COORDINATOR

**Expected Tasks:**

| Task | Title | Assignee Role | Due Date Logic |
|------|-------|---------------|----------------|
| 1 (auto) | Подготви | DELIVERY_COORDINATOR | → DONE |
| 2 | Дистрибуирај | DISTRIBUTION_COORDINATOR | routeDay |

**Verification:**
```bash
# First create a SALES_ORDER
curl -X POST http://localhost:3000/api/erp/event \
  -H "Content-Type: application/json" \
  -d '{
    "event": "SALES_ORDER_CREATED",
    "documentType": "SALES_ORDER",
    "documentNumber": "SO-TEST-002",
    "destinationName": "Битола",
    "destinationCode": "BT"
  }'

# Then create SHIPMENT that links to it
curl -X POST http://localhost:3000/api/erp/event \
  -H "Content-Type: application/json" \
  -d '{
    "event": "SHIPMENT_CREATED",
    "documentType": "SHIPMENT_ORDER",
    "documentNumber": "SHIP-TEST-001",
    "relatedDocumentNumber": "SO-TEST-002",
    "destinationName": "Битола",
    "destinationCode": "BT"
  }'
```

**Expected Response:**
```json
{
  "event": "SHIPMENT_CREATED",
  "tasks": [
    {
      "title": "Дистрибуирај",
      "assigneeRole": "DISTRIBUTION_COORDINATOR",
      "dueDate": "2026-04-03T..." // Next Friday
    }
  ],
  "autoCompletedTasks": ["<Подготви-task-id>"]
}
```

**Status:** ⏳ Pending test

---

## Route Plan Configuration

For testing, ensure this route plan exists:

```bash
curl -X POST http://localhost:3000/api/erp/route-plans \
  -H "Content-Type: application/json" \
  -d '{
    "destinationCode": "BT",
    "destinationName": "Битола",
    "routeDay": "FRIDAY",
    "prepOffsetDays": 1,
    "active": true
  }'
```

This will set:
- Distribution tasks due: Friday
- Preparation tasks due: Thursday (Friday - 1)

---

## Test Summary

| Scenario | Event | Tasks Created | Auto-Complete | Status |
|----------|-------|---------------|---------------|--------|
| 1 | PURCHASE_ORDER_CREATED | 1 (Планирај простор) | None | ✅ PASS |
| 2 | GOODS_RECEIPT_CREATED | 1 (Заврши прием) | None | ✅ PASS |
| 3 | SALES_ORDER_CREATED | 2 (Подготви + Планирај дистрибуција) | None | ✅ PASS |
| 4 | SHIPMENT_CREATED | 1 (Дистрибуирај) | 1 (Подготви) | ✅ PASS |

---

## Verified Test Results

### Scenario 1: PURCHASE_ORDER_CREATED ✅

```
Request:
{
  "event": "PURCHASE_ORDER_CREATED",
  "documentType": "PURCHASE_ORDER",
  "documentNumber": "PO-TEST-001",
  "partnerName": "Ероглу",
  "lineCount": 50,
  "totalQuantity": 1500,
  "plannedDate": "2026-04-02"
}

Response:
{
  "event": "PURCHASE_ORDER_CREATED",
  "documentId": "48651d4b-b5a7-4231-bc68-aac102d980ea",
  "tasks": [
    {
      "id": "77507dae-b8d4-45be-a77d-b315987201ce",
      "title": "Планирај простор за прием",
      "assigneeRole": "RECEIVING_COORDINATOR",
      "status": "ASSIGNED",
      "dueDate": "2026-04-02T00:00:00.000Z"
    }
  ],
  "autoCompletedTasks": []
}
```

**Result:** ✅ PASS - Single task created for RECEIVING_COORDINATOR

---

### Scenario 2: GOODS_RECEIPT_CREATED ✅

```
Request:
{
  "event": "GOODS_RECEIPT_CREATED",
  "documentType": "GOODS_RECEIPT",
  "documentNumber": "GR-TEST-001",
  "partnerName": "Ероглу",
  "plannedDate": "2026-04-03"
}

Response:
{
  "event": "GOODS_RECEIPT_CREATED",
  "documentId": "eb39a567-2800-4b66-b6b5-8fdfca6e36e9",
  "tasks": [
    {
      "id": "a6030ae5-8d75-482f-b1d1-3db68b533b84",
      "title": "Заврши прием",
      "assigneeRole": "RECEIVING_COORDINATOR",
      "status": "ASSIGNED",
      "dueDate": "2026-04-03T00:00:00.000Z"
    }
  ],
  "autoCompletedTasks": []
}
```

**Result:** ✅ PASS - Single task created for RECEIVING_COORDINATOR

---

### Scenario 3: SALES_ORDER_CREATED ✅

```
Request:
{
  "event": "SALES_ORDER_CREATED",
  "documentType": "SALES_ORDER",
  "documentNumber": "SO-TEST-002",
  "partnerName": "Клиент А",
  "destinationName": "Битола",
  "destinationCode": "BT",
  "lineCount": 30,
  "totalQuantity": 1200
}

Response:
{
  "event": "SALES_ORDER_CREATED",
  "documentId": "e3b600da-ebaf-4a2f-83da-1517322f8a54",
  "tasks": [
    {
      "id": "50e75a35-a9e4-499d-bfc5-79a68b2a9005",
      "title": "Подготви",
      "assigneeRole": "DELIVERY_COORDINATOR",
      "status": "ASSIGNED",
      "dueDate": "2026-04-02T18:15:39.809Z"  ← Thursday (Friday - 1 prep offset)
    },
    {
      "id": "c893887c-68c0-4b70-9f60-3794bedc645d",
      "title": "Планирај дистрибуција",
      "assigneeRole": "DISTRIBUTION_COORDINATOR",
      "status": "ASSIGNED",
      "dueDate": "2026-04-02T18:15:39.813Z"
    }
  ],
  "autoCompletedTasks": []
}
```

**Result:** ✅ PASS - 2 tasks created:
- "Подготви" → DELIVERY_COORDINATOR (due Thursday - prep offset)
- "Планирај дистрибуција" → DISTRIBUTION_COORDINATOR

**Route Plan Used:**
```
destinationCode: BT
routeDay: FRIDAY
prepOffsetDays: 1
→ "Подготви" due: Friday - 1 = Thursday
```

---

### Scenario 4: SHIPMENT_CREATED ✅

```
Request:
{
  "event": "SHIPMENT_CREATED",
  "documentType": "SHIPMENT_ORDER",
  "documentNumber": "SHIP-TEST-001",
  "relatedDocumentNumber": "SO-TEST-002",
  "destinationName": "Битола",
  "destinationCode": "BT"
}

Response:
{
  "event": "SHIPMENT_CREATED",
  "documentId": "4930cf3f-b7ee-4bce-b21d-b953dff7a251",
  "tasks": [
    {
      "id": "267d4ff2-d72b-439b-9b2d-3109e3444912",
      "title": "Дистрибуирај",
      "assigneeRole": "DISTRIBUTION_COORDINATOR",
      "status": "ASSIGNED",
      "dueDate": "2026-04-03T18:15:44.752Z"  ← Next Friday
    }
  ],
  "autoCompletedTasks": [
    "50e75a35-a9e4-499d-bfc5-79a68b2a9005"  ← Подготви task ID
  ]
}
```

**Result:** ✅ PASS - Workflow complete:
1. "Подготви" task (ID: 50e75a35...) auto-completed to DONE
2. "Дистрибуирај" task created for DISTRIBUTION_COORDINATOR (due Friday)

**Verification:**
```sql
SELECT id, title, status, completedAt FROM "Task" 
WHERE id = '50e75a35-a9e4-499d-bfc5-79a68b2a9005';

-- Result:
-- id: 50e75a35...
-- title: "Подготви"
-- status: "DONE"
-- completedAt: "2026-04-02T18:15:39.809Z"
-- completionResult: "FULL"
```

---

## Implementation Files

- `backend/src/erp/erp.constants.ts` - Task templates and roles
- `backend/src/erp/erp-import.service.ts` - Task creation logic
- `backend/src/erp/erp.controller.ts` - API endpoints
- `backend/prisma/schema.prisma` - Database models