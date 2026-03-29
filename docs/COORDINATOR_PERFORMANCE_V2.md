# Coordinator Performance v2 - Specification

**Version:** 2.0  
**Status:** SPEC  
**Date:** 2026-03-29

---

## Overview

Role-specific scorecards for the three coordinator positions:
- **RECEPTION_COORDINATOR** (Прием)
- **DELIVERY_COORDINATOR** (Испорака)  
- **DISTRIBUTION_COORDINATOR** (Дистрибуција)

Each role has its own KPI formula, scoring 0-100 with bonus bands.

---

## KPI Mapping by Role

### RECEPTION_COORDINATOR (Раководител за прием)

| KPI | Weight | Description | Source |
|-----|--------|------------|--------|
| Точност на залиха | 25% | Stock accuracy on receipt | Auto from Goods Receipt tasks |
| Недостатоци | 25% | Missing items reported | Auto from Goods Receipt |
| Поврат во 48ч | 20% | Returns within 48h | Manual entry |
| Уредност | 15% | Warehouse tidiness | Manual monthly |
| Дисциплина | 15% | On-time, attendance | Manual monthly |

**Score Formula:**
```
(Точност × 0.25) + (Недостатоци × 0.25) + (Поврат_48ч × 0.20) + (Уредност × 0.15) + (Дисциплина × 0.15)
```

---

### DELIVERY_COORDINATOR (Раководител за испорака)

| KPI | Weight | Description | Source |
|-----|--------|------------|--------|
| Точност на испорака | 25% | Delivery accuracy | Auto from Shipment tasks |
| Навременост подготовка | 20% | Prep done on time | Auto from Delivery prep tasks |
| Грешки во тим | 15% | Team errors | Auto from task completion |
| Организација | 20% | Organization score | Manual monthly |
| Дисциплина | 20% | On-time, attendance | Manual monthly |

**Score Formula:**
```
(Точност × 0.25) + (Навременост × 0.20) + (Грешки_тимот × 0.15) + (Организација × 0.20) + (Дисциплина × 0.20)
```

---

### DISTRIBUTION_COORDINATOR (Раководител на дистрибуција)

| KPI | Weight | Description | Source |
|-----|--------|------------|--------|
| Навремена испорака | 30% | On-time delivery | Auto from Shipment/Delivery tasks |
| Доцнења | 25% | Late deliveries | Auto from status tracking |
| Гориво | 20% | Fuel efficiency | Manual monthly |
| Инциденти | 15% | Any incidents | Manual monthly |
| Дисциплина | 10% | On-time, attendance | Manual monthly |

**Score Formula:**
```
(Навремена_испорака × 0.30) + (Доцнења × 0.25) + (Гориво × 0.20) + (Инциденти × 0.15) + (Дисциплина × 0.10)
```

---

## Bonus Bands

| Score Range | Bonus % |
|------------|---------|
| 90-100 | 100% |
| 80-89 | 70% |
| 70-79 | 40% |
| < 70 | 0% |

---

## Database Schema

### New Table: CoordinatorKPI

```prisma
model CoordinatorKPI {
  id              String    @id @default(uuid())
  userId          String    // FK to User
  user            User      @relation(fields: [userId], references: [id])
  
  month           Int       // 1-12
  year           Int       // 2026
  
  // Reception KPIs
  returns48h      Int?      // 0-100
  tidiness        Int?      // 0-100
  disciplineReception Int?   // 0-100
  
  // Delivery KPIs
  organization   Int?      // 0-100
  disciplineDelivery Int?    // 0-100
  
  // Distribution KPIs
  fuel          Int?      // 0-100
  incidents     Int?      // 0-100
  disciplineDistribution Int? // 0-100
  
  // Calculated scores (cached)
  receptionScore    Int?    // 0-100
  deliveryScore   Int?     // 0-100
  distributionScore Int?   // 0-100
  totalScore      Int?    // 0-100
  bonusPercent   Int?     // 0, 40, 70, 100
  
  createdAt       DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  @@unique([userId, month, year])
}
```

### Extended: Task model

```prisma
model Task {
  // ... existing fields ...
  
  // New for performance tracking
  deliveryAccuracy  Boolean?  // Did delivery match order?
  onTimePrep      Boolean?  // Was prep done on time?
  onTimeDelivery Boolean?  // Was delivery on time?
  
  // Late reason tracking
  delayMinutes   Int?      // Minutes late (negative = early)
  delayReasonCode String?
}
```

---

## API Contract

### GET /api/performance/scorecard/:userId?month=X&year=Y

```json
{
  "userId": "uuid",
  "userName": "Име Презиме",
  "role": "RECEPTION_COORDINATOR",
  "month": 3,
  "year": 2026,
  "kpis": {
    "точност_на_залиха": 95,
    "недостатоци": 100,
    "поврат_48ч": 80,
    "уредност": 85,
    "дисциплина": 90
  },
  "weightedScore": 88,
  "bonusPercent": 70,
  "bonusLabel": "70%",
  "trend": "up" // up/down/neutral
}
```

### GET /api/performance/leaderboard?month=X&year=Y&role=RECEPTION_COORDINATOR

```json
{
  "role": "RECEPTION_COORDINATOR",
  "leaderboard": [
    {"rank": 1, "userName": "Андреј", "score": 94, "bonusPercent": 100},
    {"rank": 2, "userName": "Борис", "score": 88, "bonusPercent": 70},
    {"rank": 3, "userName": "Владимир", "score": 82, "bonusPercent": 70}
  ]
}
```

### POST /api/performance/kpi

```json
{
  "userId": "uuid",
  "month": 3,
  "year": 2026,
  "returns48h": 85,
  "tidiness": 90,
  "disciplineReception": 95,
  "organization": 80,
  "fuel": 75,
  "incidents": 100
}
```

### PATCH /api/performance/task/:taskId/metrics

```json
{
  "deliveryAccuracy": true,
  "onTimePrep": true,
  "onTimeDelivery": false,
  "delayMinutes": -15,  // 15 min early
  "delayReasonCode": null
}
```

---

## UI Design

### Coordinator Scorecard Page

```
┌─────────────────────────────────────────────────────────────┐
│  Мој Scorecard - Март 2026                    [Export PDF] │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────┐ │
│  │     88         │  │     70%        │  │    ↑     │ │
│  │   Score       │  │    Bonus       │  │  Trend   │ │
│  └─────────────────┘  └─────────────────┘  └───────────┘ │
├─────────────────────────────────────────────────────────────┤
│  KPI Детали                                                │
│  ──────────────────────────────────────────────────────    │
│  ✓ Точност на залиха         95%  ████████████░░░░        │
│  ✓ Недостатоци             100%  ████████████          │
│  ✓ Поврат во 48ч           80%  ██████████░░          │
│  ✓ Уредност               85%  ███████████          │
│  ✓ Дисциплина            90%  ████████████░          │
├─────────────────────────────────────────────────────────────┤
│  Цел за следниот месец: 90+                              │
│  [Уреди KPI]                       [Историја ▼]           │
└─────────────────────────────────────────────────────────────┘
```

### Manager Leaderboard Page

```
┌─────────────────────────────────────────────────────────────┐
│  Лидер Табела - Прием (Март 2026)              [Filter ▼] │
├─────────────────────────────────────────────────────────────┤
│  #   Име           Score  Тренд   Bonus   Активност    │
│  ──────────────────────────────────────────────────────    │
│  1   Андреј С.      94    ↑ +2   100%   152 задачи   │
│  2   Борис К.      88    ↓ -1   70%   148 задачи   │
│  3   Владимир П.    82    → 0   70%   139 задачи   │
│  4   Горан Д.      76    ↑ +5   40%   161 задачи   │
└─────────────────────────────────────────────────────────────┘
```

---

## Auto-calculation Triggers

| Event | Triggers Calculation |
|-------|----------------|
| Task COMPLETED with completionResult=FULL | Update accuracy KPI |
| Task COMPLETED with completionResult=PARTIAL | Check delay reason |
| Task marked DONE late | Update delay KPI |
| Goods Receipt COMPLETED | Update stock accuracy |
| Shipment DELIVERED | Update on-time delivery |
| Monthly manual KPI entry | Recalculate total |
| 15th of month | Auto-push partial scores |

---

## Manual KPI Entry

Simple admin page at `/admin/performance/kpi`:

```
┌─────────────────────────────────────────────────────────────┐
│  Внеси Месечни KPI - Март 2026                        │
├─────────────────────────────────────────────────────────────┤
│  Координатор: [Андреј ▼]                            │
│                                                         │
│  Прием:                                                │
│  ├─ Поврат во 48ч:    [85___] %                        │
│  ├─ Уредност:       [90___] %                        │
│  └─ Дисциплина:    [95___] %                        │
│                                                         │
│  Испорака:                                               │
│  ├─ Организација:    [80___] %                        │
│  └─ Дисциплина:    [90___] %                        │
│                                                         │
│  Дистрибуција:                                          │
│  ├─ Гориво:        [75___] %                        │
│  ├─ Инциденти:    [100___] %                        │
│  └─ Дисциплина:    [95___] %                        │
│                                                         │
│  [Зачувај]  [Откажи]                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

- [ ] Role-specific score shown in coordinator dashboard
- [ ] Manual KPI entry works for all 3 roles
- [ ] Auto KPIs calculated from task completions
- [ ] Scorecard shows all 5 KPIs + weighted total
- [ ] Bonus band shown (0%/40%/70%/100%)
- [ ] Leaderboard sortable by role
- [ ] Trend indicator works
- [ ] History viewable (past 12 months)

---

## Implementation Priority

1. **Database** - Add CoordinatorKPI table, extend Task
2. **Backend** - KPI calculation logic + API endpoints
3. **UI** - Personal scorecard page
4. **UI** - Manager leaderboard
5. **Admin** - Manual KPI entry form