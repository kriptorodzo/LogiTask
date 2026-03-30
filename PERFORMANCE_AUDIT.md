# ⚡ LogiTask Performance Audit Guide

## Цел
Идентификувај и поправи проблеми со перформансата.

---

## 🔍 ДИЈАГНОСТИКА ЧЕКОРИ

### Чеkor 1: Профилирај ја страницата

**Frontend:**
```javascript
// Browser DevTools → Performance Tab
// Record → Navigate through app → Stop
// Check: Long tasks, large layouts
```

**API:**
```bash
# Time API responses
curl -w "\nTime: %{time_total}s\n" -o /dev/null -s "http://localhost:3000/api/..."
```

### Чекор 2: Провери Network requests

**Во Browser DevTools → Network:**
- Колку API повици има на една страница?
- Која е просечната големина на response?
- Кои повици се најбавни?

### Чекор 3: Провери Database queries

**Во Prisma Studio или SQL:**
```sql
-- Бавни queries
EXPLAIN QUERY PLAN
SELECT * FROM Task 
WHERE assigneeId = '<id>' 
AND status IN ('APPROVED', 'IN_PROGRESS');
```

---

## 🎯 COMMON PERFORMANCE ISSUES

### Issue 1: N+1 Query Problem

**Симптоми:**
- Многу SQL queries во network tab
- Страницата се вчитува бавно

**Пример лош код:**
```typescript
// ❌ Лошо - N+1 проблем
const emails = await prisma.email.findMany();
for (const email of emails) {
  const tasks = await prisma.task.findMany({ where: { emailId: email.id } });
}
```

**Пример добар код:**
```typescript
// ✅ Добро - Еден query со include
const emails = await prisma.email.findMany({
  include: { tasks: true }
});
```

---

### Issue 2: Missing Index

**Симптоми:**
- DB query е бавен (>100ms)
- Explain plan покажува TABLE SCAN

**Решение:**
```prisma
// Во schema.prisma
model Task {
  // ... fields ...
  
  @@index([assigneeId, status]) // Composite index
  @@index([dueDate]) // Single field index
}
```

---

### Issue 3: Large Payload

**Симптоми:**
- API response > 1MB
- Вчитување трае долго

**Решение:**
```typescript
// ❌ Лошо
const allData = await prisma.task.findMany();

// ✅ Добро - pagination
const page = await prisma.task.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' }
});
```

---

### Issue 4: React Re-renders

**Симптоми:**
- UI е бавен дури и со малку податоци
- Компоненти повторно се рендерираат непотребно

**Решение:**
```typescript
// ✅ Користи React.memo за картички
const TaskCard = React.memo(({ task }) => {
  return <div>{task.title}</div>;
});

// ✅ Користи useMemo за пресметки
const sortedTasks = useMemo(() => {
  return tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}, [tasks]);
```

---

### Issue 5: No Lazy Loading

**Симптоми:**
- Целата страница се вчитува иако прикажуваш само header

**Решение:**
```typescript
// ✅ Lazy load компоненти
const TaskList = dynamic(() => import('./TaskList'), {
  loading: () => <Skeleton />
});

// ✅ Suspense boundaries
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

---

## 📊 PERFORMANCE METRICS TO CHECK

| Metric | Target | Измери |
|--------|--------|--------|
| First Contentful Paint | < 1.5s | DevTools |
| Time to Interactive | < 3s | DevTools |
| API Response Time | < 200ms | Network tab |
| DB Query Time | < 50ms | Prisma |
| Memory Usage | < 150MB | Task Manager |

---

## 🚀 OPTIMIZATION CHECKLIST

### Backend (NestJS + Prisma)

- [ ] Add indexes to frequently queried fields
- [ ] Use `select` to limit returned fields
- [ ] Use `include` for relations (avoid N+1)
- [ ] Add pagination to list endpoints
- [ ] Cache expensive calculations
- [ ] Use database transactions for multi-step operations

### Frontend (Next.js + React)

- [ ] Implement React.memo for list items
- [ ] Use useMemo for sorted/filtered data
- [ ] Use useCallback for event handlers
- [ ] Lazy load heavy components
- [ ] Implement skeleton loading states
- [ ] Use Suspense boundaries
- [ ] Optimize images (next/image)
- [ ] Remove unused code (tree shaking)

---

## 🔬 PERFORMANCE TEST SCRIPTS

### Test: API Response Time

```bash
#!/bin/bash
echo "Testing API response times..."

echo "1. GET /api/tasks"
time curl -s "http://localhost:3000/api/tasks" > /dev/null

echo "2. GET /api/emails"
time curl -s "http://localhost:3000/api/emails" > /dev/null

echo "3. POST /api/tasks/status"
time curl -s -X PATCH "http://localhost:3000/api/tasks/<id>/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}' > /dev/null
```

### Test: Database Query Time

```typescript
// /backend/src/scripts/benchmark.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function benchmark() {
  const queries = [
    { name: 'All tasks', fn: () => prisma.task.findMany() },
    { name: 'Tasks by assignee', fn: () => prisma.task.findMany({ where: { assigneeId: 'xxx' } }) },
    { name: 'Emails with tasks', fn: () => prisma.email.findMany({ include: { tasks: true } }) },
  ];

  for (const q of queries) {
    const start = Date.now();
    await q.fn();
    const end = Date.now();
    console.log(`${q.name}: ${end - start}ms`);
  }
}

benchmark();
```

---

## 📈 OPTIMIZATION PRIORITY

| Priority | Issue | Impact | Естимација |
|----------|-------|--------|------------|
| HIGH | N+1 queries in email/task list | High | 2h |
| HIGH | Missing indexes | High | 1h |
| MEDIUM | No pagination | Medium | 2h |
| MEDIUM | React re-renders | Medium | 3h |
| LOW | Lazy loading | Low | 2h |

---

## ✅ PERFORMANCE SIGN-OFF

| Area | Current (ms) | Target (ms) | Status |
|------|--------------|-------------|--------|
| API /tasks | | < 100ms | ⬜ |
| API /emails | | < 100ms | ⬜ |
| DB queries | | < 50ms | ⬜ |
| Page load | | < 2s | ⬜ |
| Interactions | | < 100ms | ⬜ |

**Overall Performance: OPTIMIZED / NEEDS WORK**