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
| 1 | PURCHASE_ORDER_CREATED | 1 (Планирај простор) | None | ⏳ |
| 2 | GOODS_RECEIPT_CREATED | 1 (Заврши прием) | None | ⏳ |
| 3 | SALES_ORDER_CREATED | 2 (Подготви + Планирај дистрибуција) | None | ⏳ |
| 4 | SHIPMENT_CREATED | 1 (Дистрибуирај) | 1 (Подготви) | ⏳ |

---

## Implementation Files

- `backend/src/erp/erp.constants.ts` - Task templates and roles
- `backend/src/erp/erp-import.service.ts` - Task creation logic
- `backend/src/erp/erp.controller.ts` - API endpoints
- `backend/prisma/schema.prisma` - Database models