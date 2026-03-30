# 📥 Master Inbound Layer - Архитектура и Имплементација

## Цел
Сите влезни податоци прво да се запишуваат во една master табела, а потоа од неа да се прават понатамошните обработки модуларно.

---

## 1. Предлог Schema за Master Inbound Table

### Табела: `InboundRecord`

```prisma
// Master Inbox - Еден извор за сите влезни податоци
model InboundRecord {
  id                    String    @id @default(uuid())
  
  // ─── Source Identification ────────────────────────────────────────
  sourceType             String    // EMAIL, ERP, MANUAL, API, WEBHOOK
  sourceSubType         String?   // EMAIL_MICROSOFT, ERP_CSV, MANUAL_FORM, итн
  externalRef           String?   // ID од надворешен систем (microsoftGraphId, erpDocumentId)
  
  // ─── Content ────────────────────────────────────────────
  subjectOrTitle        String?   // Наслов/име
  rawPayload           String?   // JSON/Raw - оригинални податоци
  normalizedPayload    String?   // JSON - нормализирани податоци
  
  // ─── Normalized Fields ─────────────────────────────────
  supplierName         String?
  partnerCode         String?   // Добавувач/клиент код
  locationName        String?
  locationCode       String?
  referenceNumber    String?   // Број на нарачка/документ
  
  // ─── Dates ─────────────────────────────────────────────
  requestedDate       DateTime? // Планиран датум (кога е побарано)
  receivedAt          DateTime  @default(now()) // Кога е примено во системот
  ingestedAt          DateTime? // Кога е нормализирано
  
  // ─── Classification ────────────────────────────────
  processingStatus    String   @default("PENDING")   // PENDING, PROCESSING, PROCESSED, FAILED
  classificationStatus String? // UNCLASSIFIED, CLASSIFIED_RECEIPT, CLASSIFIED_OUTBOUND, CLASSIFIED_DISTRIBUTION
  classificationConfidence Float?  // 0.0-1.0 AI置信度
  
  requestType       String?   // INBOUND_RECEIPT, OUTBOUND_PREPARATION, OUTBOUND_DELIVERY, TRANSFER_DISTRIBUTION
  priority          String?   // LOW, MEDIUM, HIGH, URGENT
  
  // ─── Processing Links ────────────────────────────────
  caseId             String?
  case              EmailCase? @relation(fields: [caseId], references: [id])
  
  // За task generation
  tasksGenerated    Int       @default(0)
  
  // ─── Error Handling ──────────────────────────────────────
  errorFlag          Boolean   @default(false)
  errorReason       String?
  
  // ─── Metadata ─────────────────────────────────────────
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  
  // ─── Indexes ─────────────────────────────────────────
  @@index([sourceType, processingStatus])
  @@index([caseId])
  @@index([requestType])
  @@index([supplierName])
  @@index([receivedAt])
  @@index([classificationStatus])
}
```

---

## 2. Како се поврзува со другите табели

### Дијаграм на релации:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    InboundRecord (Master Inbox)             │
│                     id: UUID                          │
│  sourceType ──────────┐                                │
│  externalRef ───────┤                                │
│  caseId ────────────┼────────────────────────────────┤
└────────────────────┘                                │
         │                    │                    │
         │                    │                    │
    ┌────▼────┐      ┌─────▼─────┐      ┌──────▼──────┐
    │  Email  │      │ErpDocument│      │  (future)  │
    │   id    │      │    id    │      │            │
    └─────────┘      └──────────┘                    │
         │                    │                    │
         │             ┌─────▼─────┐            │
         └────────────►│   Case    │◄──────────┘
                     │   id     │
              ┌───────┴──────┐
              │            │
         ┌─────▼─────┐   ┌───▼────┐
         │  Task   │   │  Task  │
         └─────────┘   └───────┘
```

### FK Релации:

| Од | Во | Поврзано преку |
|-----|-----|---------------|
| InboundRecord | Email | `externalRef = email.id` (за sourceType=EMAIL) |
| InboundRecord | ErpDocument | `externalRef = erpDocument.id` (за sourceType=ERP) |
| InboundRecord | Case | `caseId` (direct FK) |
| Task | InboundRecord | `inboundRecordId` (direct FK) |
| Email | InboundRecord | `inboundRecordId` (direct FK) |
| ErpDocument | InboundRecord | `inboundRecordId` (direct FK) |

---

## 3. Што треба да се смени во Seed/Data Flow

### Currently (Fragmented):
```
Email webhook → Email table → (manual processing) → Task
ERP import  → ErpDocument table → (manual processing) → Task
```

### New Flow (Unified):
```
Email webhook ──► InboundRecord ──►Classification───► Case
                                     └──► Task(s)

ERP import  ──► InboundRecord ──►Classification───► Case
                                      └──► Task(s)
                                     
Manual entry ──► InboundRecord ──► Classification───► Case
                                        └──► Task(s)
```

### Seed адаптација:

```typescript
// OLD: Create email + tasks directly
const email = await prisma.email.create({ data: { ... } });
const task = await prisma.task.create({ data: { emailId: email.id, ... } });

// NEW: Create InboundRecord first, then case/tasks
const inbound = await prisma.inboundRecord.create({
  data: {
    sourceType: 'EMAIL',
    sourceSubType: 'EMAIL_MICROSOFT',
    subjectOrTitle: email.subject,
    rawPayload: JSON.stringify(email),
    processingStatus: 'PENDING',
    receivedAt: email.receivedAt,
  }
});

// Later: Process → creates case + tasks
await processInbound(inbound.id);
```

---

## 4. Што треба да се смени во Manager/Coordinator/Reports Logic

### 4.1 Manager Inbox (`/manager`)

**Before:** 
- Query `Email` table + `Task` table separately
- Multiple API calls

**After:**
```typescript
// Еден query за сите влезни податоци
const inboundRecords = await prisma.inboundRecord.findMany({
  where: {
    processingStatus: 'PENDING', // or in progress statuses
  },
  include: {
    case: true,
    tasks: true,
  }
});
```

**Tabs во UI:**
- **New** = `processingStatus: 'PENDING'` && `classificationStatus: null`
- **Needs Action** = linked tasks in `PROPOSED` status  
- **In Progress** = linked case with `status: 'IN_PROGRESS'`
- **Completed** = linked case with `status: 'DONE'|'PARTIAL'|'FAILED'`

### 4.2 Coordinator Workboard (`/coordinator`)

**Before:** Query `Task` by assignee, filter by type

**After:**
```typescript
// Fetch tasks → get their InboundRecord
const myTasks = await prisma.task.findMany({
  where: { assigneeId: user.id },
  include: { 
    inboundRecord: true 
  }
});

// Or: query InboundRecord directly by classification
const myInbound = await prisma.inboundRecord.findMany({
  where: {
    classificationStatus: user.roleMapping, // ROLE → task type mapping
    processingStatus: 'PROCESSED',
  },
  include: { tasks: true }
});
```

### 4.3 Reports

```typescript
// Before: Query tasks, calculate KPIs
const tasks = await prisma.task.findMany({ ... });
const otif = calculateOtif(tasks);

// After: Use Case KPIs (already calculated)
const cases = await prisma.emailCase.findMany({
  where: { completedAt: { gte: startDate } },
  include: { inboundRecord: true }
});
```

---

## 5. Имплементациски План (Чекори)

### Phase 1: Schema (1 час)
- [x] Креирај `InboundRecord` модел во schema.prisma
- [ ] Додај ги DB миграциите

### Phase 2: API Layer (2 часа)
- [ ] Креирај `InboundController` 
- [ ] `POST /inbound` - create new inbound record
- [ ] `GET /inbound` - list with filters
- [ ] `PATCH /inbound/:id/classify` - classify record
- [ ] `POST /inbound/:id/process` - trigger processing

### Phase 3: Integration Points (3 часа)
- [ ] Ажурирај Email webhook да го полни InboundRecord
- [ ] Ажурирај ERP import да го полни InboundRecord
- [ ] Ажурирај Task generation да го поврзува

### Phase 4: UI Updates (2 часа)
- [ ] Manager inbox да го користи InboundRecord
- [ ] Coordinator workboard да го користи InboundRecord

### Phase 5: Data Migration (1 час)
- [ ] Мигрирај постоечки Email → InboundRecord
- [ ] Мигрирај постоечки ErpDocument → InboundRecord

---

## 6. Миграција на Постоечки Податоци

### SQL за миграција:

```sql
-- Миграција на Email → InboundRecord
INSERT INTO InboundRecord (
  id,
  sourceType,
  sourceSubType,
  externalRef,
  subjectOrTitle,
  rawPayload,
  normalizedPayload,
  supplierName,
  locationName,
  requestedDate,
  receivedAt,
  processingStatus,
  classificationStatus,
  requestType,
  priority,
  createdAt
)
SELECT 
  uuid() as id,
  'EMAIL' as sourceType,
  'EMAIL_MICROSOFT' as sourceSubType,
  id as externalRef,
  subject,
  body,
  NULL as normalizedPayload,
  extractedSupplier,
  extractedLocation,
  extractedDeliveryDate,
  receivedAt,
  processingStatus,
  processingStatus,
  requestType,
  extractedUrgency,
  createdAt
FROM Email;

-- Поврзи Email со InboundRecord
UPDATE Email 
SET inboundRecordId = (
  SELECT id FROM InboundRecord 
  WHERE externalRef = Email.id
)
WHERE EXISTS (
  SELECT 1 FROM InboundRecord WHERE externalRef = Email.id
);
```

---

## 📊 Очекувани Резултати

| Metric | Before | After |
|--------|--------|-------|
| Влезни точки | 3+ (Email, ERP, Manual) | 1 (InboundRecord) |
| Query complexity | High (multiple joins) | Low (single source) |
| Classification | Manual | Automated via InboundRecord |
| Reports | Calculated on-the-fly | Pre-calculated per record |

---

## ✅ Заклучок

Со оваа архитектура:
1. **Еден извор на вистина** за сите влезни податоци
2. **Модуларен дизајн** - секој модул работи независно
3. **Лесна интеграција** - нови source types само го полнат InboundRecord
4. **Подобри KPIs** - секој record носи metadata за tracking