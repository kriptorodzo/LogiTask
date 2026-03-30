# 📋 UAT Summary Template

## UAT Round Information

| Поле | Вредност |
|------|----------|
| **Round** | UAT-XXX |
| **Период** | DD/MM/YYYY - DD/MM/YYYY |
| **Product Version** | vX.Y.Z |
| **Test Lead** | [Име] |
| **Testers** | [Имиња] |
| **Улоги тестирани** | [Manager, Coordinator, Admin] |

---

## Executive Summary

### Цел на UAT Round
[Краток опис што се тестираше]

### Резултат
| Статус | Број |
|--------|------|
| ✅ PASS | X |
| ⚠️ PASS WITH NOTES | X |
| ❌ FAIL | X |

---

## 📊 Статистика

### Bug Distribution by Severity

| Severity | Број | % |
|----------|------|---|
| CRITICAL | X | X% |
| HIGH | X | X% |
| MEDIUM | X | X% |
| LOW | X | X% |
| **ВКУПНО** | **X** | 100% |

### Bug Distribution by Module

| Модул | Број |
|-------|------|
| Auth | X |
| Manager Inbox | X |
| Coordinator Workboard | X |
| Reports | X |
| ERP | X |
| Admin | X |

---

## ✅ Тестирани Модули

### Manager

| Модул | Статус | Забелешки |
|-------|--------|-----------|
| Login | PASS/PASS WITH NOTES/FAIL | |
| Dashboard | PASS/PASS WITH NOTES/FAIL | |
| Inbox | PASS/PASS WITH NOTES/FAIL | |
| Needs Action | PASS/PASS WITH NOTES/FAIL | |
| Approve/Delegate | PASS/PASS WITH NOTES/FAIL | |
| Reports | PASS/PASS WITH NOTES/FAIL | |

### Coordinator

| Модул | Статус | Забелешки |
|-------|--------|-----------|
| Login | PASS/PASS WITH NOTES/FAIL | |
| Workboard | PASS/PASS WITH NOTES/FAIL | |
| Quick Actions | PASS/PASS WITH NOTES/FAIL | |

### Admin

| Модул | Статус | Забелешки |
|-------|--------|-----------|
| Dashboard | PASS/PASS WITH NOTES/FAIL | |
| Users | PASS/PASS WITH NOTES/FAIL | |
| ERP | PASS/PASS WITH NOTES/FAIL | |

---

## 🐛 Bug Summary

### Critical Bugs (MUST FIX)
| ID | Description | Module | Fix Required |
|----|-------------|--------|---------------|
| | | | |

### High Priority Bugs
| ID | Description | Module | Fix Required |
|----|-------------|--------|---------------|
| | | | |

### Medium Priority Bugs
| ID | Description | Module | Fix Required |
|----|-------------|--------|---------------|
| | | | |

### Low Priority / Notes
| ID | Description | Module | Notes |
|----|-------------|--------|-------|
| | | | |

---

## 🎯 Препораки

### Мора да се поправи пред Pilot (P1)
1. [ ]
2. [ ]
3. [ ]

### Треба да се поправи во следна итерација (P2)
1. [ ]
2. [ ]

### Може да почека (P3/P4)
1. [ ]
2. [ ]

---

## ✅ Sign-off

| Улога | Име | Датум | Статус | Коментари |
|-------|-----|-------|--------|-----------|
| Test Lead | | | | |
| Product Owner | | | | |
| Engineering Lead | | | | |

---

## 📎 Attachments

- [ ] Screenshots folder
- [ ] Test execution logs
- [ ] Bug log details
- [ ] Test data used

---

## 🏷️ Верзија

| Верзија | Датум | Автор | Забелешки |
|---------|-------|-------|-----------|
| 1.0 | DD/MM/YYYY | | Initial template |

---

## Example Filled Summary

# UAT-001 Summary

## Executive Summary
Тестирање на Manager, Coordinator и Admin улоги во LogiTask v1.0. Цел: потврда на role-based workflows и RBAC.

### Резултат
| Статус | Број |
|--------|------|
| ✅ PASS | 42 |
| ⚠️ PASS WITH NOTES | 5 |
| ❌ FAIL | 3 |

## Статистика

### Bug Distribution by Severity
| Severity | Број |
|----------|------|
| CRITICAL | 0 |
| HIGH | 1 |
| MEDIUM | 2 |
| LOW | 0 |

### Bug Distribution by Module
| Модул | Број |
|-------|------|
| Manager Inbox | 2 |
| Coordinator Workboard | 1 |
| ERP Import | 0 |

## Препораки

### Мора да се поправи пред Pilot (P1)
1. BUG-001: Manager - Approve All not working when tasks mixed

### Треба да се поправи во следна итерација (P2)
1. UX-001: No toast notifications on Coordinator

## Sign-off
| Role | Name | Date | Status |
|------|------|------|--------|
| Test Lead | John Doe | 30/03/2026 | ✅ PASS WITH NOTES |
| Product Owner | Jane Smith | 30/03/2026 | ✅ PASS WITH NOTES |