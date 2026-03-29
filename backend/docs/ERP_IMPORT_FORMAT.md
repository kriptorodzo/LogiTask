# ERP Import Format Specification

## Overview

This document defines the required columns and formats for ERP data import into LogiTask.

---

## CSV Format

### Purchase Order / Goods Receipt

```csv
documentType,documentNumber,partnerName,lineCount,totalQuantity,plannedDate
PURCHASE_ORDER,PO-2024-001,Ероглу,50,1500,2024-03-20
GOODS_RECEIPT,GR-2024-002,Ероглу,25,800,2024-03-21
```

### Sales Order / Shipment

```csv
documentType,documentNumber,partnerName,destinationName,destinationCode,lineCount,totalQuantity,plannedDate
SALES_ORDER,SO-2024-001,Клиент А,Битола,BT,30,1200,2024-03-22
SHIPMENT_ORDER,SHIP-2024-002,Клиент Б,Скопје,SK,15,600,2024-03-23
```

---

## Column Definitions

### Required Columns

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `documentType` | string | Type of ERP document | `PURCHASE_ORDER`, `GOODS_RECEIPT`, `SALES_ORDER`, `SHIPMENT_ORDER` |
| `documentNumber` | string | Unique document identifier | `PO-2024-001` |

### Optional Columns

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `partnerName` | string | Supplier or customer name | `Ероглу` |
| `partnerCode` | string | Supplier or customer code | `EROGLU-001` |
| `destinationName` | string | Delivery location name | `Битола` |
| `destinationCode` | string | Location code (links to RoutePlan) | `BT` |
| `lineCount` | number | Number of line items | `50` |
| `totalQuantity` | number | Total quantity to receive/deliver | `1500` |
| `plannedDate` | date | Expected date (YYYY-MM-DD) | `2024-03-20` |

---

## Document Type Mapping

| Document Type | Creates Task For | Task Title | Assignee Role |
|---------------|------------------|------------|---------------|
| `PURCHASE_ORDER` | Receiving Coordinator | Планирај простор за прием | RECEIVING_COORDINATOR |
| `GOODS_RECEIPT` | Receiving Coordinator | Заврши прием | RECEIVING_COORDINATOR |
| `SALES_ORDER` | Shipping Coordinator | Подготви за испорака | SHIPPING_COORDINATOR |
| `SHIPMENT_ORDER` | Shipping Coordinator | Подготви за испорака | SHIPPING_COORDINATOR |

---

## Route Plan Integration

If `destinationCode` matches a RoutePlan entry:

1. **Distribution tasks** (SALES_ORDER, SHIPMENT_ORDER):
   - Due date = next route day
   - Example: If destination `BT` has `routeDay = FRIDAY`, task due = next Friday

2. **Preparation tasks** (PURCHASE_ORDER, GOODS_RECEIPT):
   - Due date = route day - prepOffsetDays
   - Example: If routeDay = FRIDAY, prepOffsetDays = 1, task due = Thursday

---

## JSON Format

For API import, you can also send JSON:

```json
{
  "rows": [
    {
      "documentType": "PURCHASE_ORDER",
      "documentNumber": "PO-2024-001",
      "partnerName": "Ероглу",
      "lineCount": 50,
      "totalQuantity": 1500,
      "plannedDate": "2024-03-20"
    }
  ]
}
```

---

## Validation Rules

1. `documentType` must be one of: PURCHASE_ORDER, GOODS_RECEIPT, SALES_ORDER, SHIPMENT_ORDER
2. `documentNumber` is required and must be unique within batch
3. `plannedDate` must be valid date format (YYYY-MM-DD)
4. `lineCount` and `totalQuantity` must be positive integers if provided

---

## Error Handling

Rows with errors are logged in `ErpImportBatch.errors` as JSON array:

```json
[
  "Row 5: Invalid documentType: UNKNOWN",
  "Row 10: Missing documentNumber"
]
```

Successful rows create ErpDocument + Task.
Failed rows are skipped but batch continues processing.