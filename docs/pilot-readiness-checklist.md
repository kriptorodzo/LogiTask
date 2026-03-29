# Pilot Readiness Checklist — LogiTask

## 1. Application Availability
- ✅ Backend build е чист
- ✅ Frontend compile е чист
- ✅ Backend локално стартува
- ✅ Frontend локално стартува
- ✅ API е достапен за локално тестирање
- ⚠️ Production backend environment е финално конфигуриран
- ⚠️ Production frontend environment е финално конфигуриран

## 2. Core Workflow Validation
- ✅ Manager dashboard работи
- ✅ Manager inbox прикажува email cards со summary и suggested delegation
- ✅ Approve & Delegate workflow работи
- ✅ Proposed tasks се префрлаат во approved/delegated flow
- ✅ Coordinator board работи
- ✅ Delivery coordinator гледа само свои задачи
- ✅ Distribution coordinator гледа само свои задачи
- ✅ Reception coordinator гледа само свои задачи
- ✅ Task lifecycle `APPROVED → IN_PROGRESS → DONE` работи
- ✅ Status changes се перзистираат во база
- ✅ Manager view се освежува по approval/completion
- ✅ Reports се освежуваат по completion

## 3. Demo / Smoke Test Readiness
- ✅ Базата е reset и reseed-ирана со fresh demo data
- ✅ Постојат 10 demo emails
- ✅ Постојат proposed / approved / done сценарија
- ✅ End-to-end smoke test е поминат
- ✅ Distribution scenario е поминат
- ✅ Role isolation е потврдена
- ✅ Demo workflow е валидиран од manager до reports

## 4. Reporting / KPI / OTIF
- ✅ Reports page е достапна
- ✅ OTIF KPI е достапен
- ✅ On-Time KPI е достапен
- ✅ In-Full KPI е достапен
- ✅ KPI се освежуваат по завршување на задачи
- ✅ Cases / coordinators / scorecard views постојат
- ⚠️ KPI / OTIF dashboard UX polish останува како improvement
- ⚠️ Drilldown / visualization enhancements остануваат како next-phase improvement

## 5. Security / Authentication
- ✅ Authentication workflow локално функционира за тестирање
- ⚠️ Dev auth bypass е целосно отстранет или изолиран од pilot/prod
- ⚠️ Dev fallback user IDs се целосно отстранети
- ⚠️ `test_role` / localStorage role override е целосно отстранет
- ⚠️ Audit log користи real authenticated user identity
- ⚠️ Role enforcement е потврдена преку реален auth flow
- ⚠️ Azure AD / Entra ID pilot configuration е финално потврдена

## 6. Production / Pilot Infrastructure
- ✅ Prisma schema provider changed from SQLite to PostgreSQL
- ✅ PostgreSQL production/pilot database конфигурирана и reachable (verified 29 март 2026)
- ✅ Database connectivity потврдена (smoke test passed)
- ⚠️ Azure AD app registration конфигурирана (види `azure-ad-pilot-config-operational.md`)
- ⚠️ Redirect URIs потврдени
- ⚠️ Microsoft Graph API permissions доделени
- ⚠️ Real mailbox integration потврдена
- ⚠️ Test email fetch од реален mailbox потврден
- ✅ Backup procedure е документирана
- ✅ Incident response SOP е документиран
- ✅ Retry logic постои
- ⚠️ Secrets / environment values за pilot финално внесени

## 7. Operational / Go-Live Readiness
- ✅ `go-live-status-report.md` постои
- ✅ `pilot-readiness-checklist.md` е ажуриран
- ✅ `smoke-test-checklist.md` постои
- ✅ `pilot-scenarios.md` постои
- ✅ `backup-procedure.md` постои
- ✅ `incident-response.md` постои
- ⚠️ Product Owner sign-off е добиен
- ⚠️ Pilot owner е формално назначен
- ⚠️ Planned pilot start date е финално потврдена
- ⚠️ Go / No-Go review е формално затворен

---

## Blocking Items Before Pilot Start
- ⚠️ Production/pilot auth мора да биде чист без dev-only bypass
- ⚠️ Dev fallback IDs мора да бидат отстранети
- ⚠️ `test_role` override мора да биде отстранет
- ⚠️ PostgreSQL pilot database мора да биде достапна
- ⚠️ Azure AD / Graph API pilot config мора да биде верификувана
- ⚠️ Real mailbox fetch мора да биде потврден

---

## Final Readiness Decision
**Decision:** CONDITIONAL GO

## Go Conditions
1. ⚠️ Production/pilot auth configured without dev-only bypass
2. ⚠️ Dev fallback user IDs removed
3. ⚠️ `test_role` / localStorage overrides removed
4. ⚠️ PostgreSQL production/pilot database configured and reachable
5. ⚠️ Azure AD app registration and redirect URIs verified
6. ⚠️ Microsoft Graph permissions verified and real test email fetch confirmed

## Recommendation
Продолжи со pilot **само по затворање на сите ⚠️ точки што се означени како blocking items**.