# 🐛 UAT Bug Log Template

## UAT Round Info

| Поле | Вредност |
|------|----------|
| **Round** | UAT-001 |
| **Датум** | DD/MM/YYYY |
| **Tester** | [Име] |
| **Улога** | [Manager/Coordinator/Admin] |
| **Модул** | [Inbox/Workboard/Reports/etc] |

---

## Bug Entry Template

За секој нов bug, пополни:

### Basic Info
```
# ID: BUG-XXX
## Модул: 
## Страна/Екран: 
## Чекори за репродукција:
1. 
2. 
3. 

## Очекувано однесување:
[Што треба да се случи]

## Реално однесување:
[Што всушност се случува]

## Severity: [CRITICAL|HIGH|MEDIUM|LOW]
## Priority: [P1|P2|P3|P4]
## Status: [NEW|IN PROGRESS|VERIFIED|FIXED|WONT FIX]

## Screenshots/Logs:
[Прикачи слика или лог]
```

---

## Bug Categories Reference

### Severity Definitions

| Severity | Опис |
|----------|------|
| **CRITICAL** | Блокира - не може да се продолжи со тест |
| **HIGH** | Го попречува тестирањето но има workaround |
| **MEDIUM** | Влијае на UX но функцијата работи |
| **LOW** | Козметички проблем или trivial |

### Priority Definitions

| Priority | Опис |
|----------|------|
| **P1** | Мора да се поправи пред pilot |
| **P2** | Треба да се поправи во следна итерација |
| **P3** | Може да почека |
| **P4** | Wont fix / Backlog |

---

## 📊 Bug Summary Table

| ID | Модул | Опис | Severity | Priority | Status |
|----|-------|------|----------|----------|--------|
| BUG-001 | | | | | NEW |
| BUG-002 | | | | | NEW |
| BUG-003 | | | | | NEW |

---

## Quick Log Format (За брзо снимање)

```
[CRITICAL] Module - Short description
[HIGH] Module - Short description  
[MEDIUM] Module - Short description
[LOW] Module - Short description
```

---

## Пример Populated Bug

```
# BUG-001: Manager Inbox
## Модул: Manager Inbox
## Страна/Екран: /manager
## Чекори за репродукција:
1. Login како Manager
2. Оди на /manager
3. Кликни на tab "Needs Action"
4. Нема cards во листата

## Очекувано однесување:
Да прикаже emails со PROPOSED tasks

## Реално однесување:
Празна листа, иако има pending tasks

## Severity: HIGH
## Priority: P1
## Status: NEW
## Screenshots/Logs:
[Слика од празна листа]
```

---

## 🔄 Workflow

```
NEW → IN PROGRESS → FIXED → VERIFIED
                    ↓
              WONT FIX
```

---

## Notes

* За секој bug: screenshots задолжителни за CRITICAL/HIGH
* Link-увај кон specific commit ако е possible
* Бележи browser/OS ако релевантно