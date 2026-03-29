# 📨 Барање за ИТ Оддел - LogiTask Потребни Ресурси

## За кој станува збор?

Потребни ни се следните ресурси за да го завршиме финалниот дел од **LogiTask** проектот:

---

## 1️⃣ Microsoft Azure AD (Најважно)

### Што треба од ИТ:

| Ресурс | Опис | Зошто ни треба? |
|---------|------|-------------|
| **Azure AD Tenant ID** | ID на вашиот Microsoft 365 tenant | За автентикација |
| **Application (Client) ID** | ID на регистрирана апликација во Azure | За пристап до API |
| **Client Secret** | Тајна на апликацијата | За автентикација |
| **Redirect URIs** | Линкови за враќање | `http://localhost:3000/api/auth/callback/azure-ad` |

### Потребни Permissions:

```
User.Read
Mail.Read
Mail.Send
```

### Како да го направите:

1. Одете во [Azure Portal](https://portal.azure.com)
2. Microsoft Entra ID → App registrations
3. Креирајте нова апликација: **LogiTask**
4. Копирајте ги Client ID и Tenant ID
5. Generate-ирајте Client Secret
6. Додадете API permissions (Mail.Read, итн.)
7. Доделете admin consent

---

## 2️⃣ Microsoft 365 Mailbox

### Што треба од ИТ:

| Ресурс | Опис |
|---------|------|
| **Mailbox email** | Е-пошта од каде ќе се читаат мејловите |
| **Mailbox permissions** | Пристап до таа mailbox |

### Пример:
```
logistics@yourcompany.com
```

### Како да го направите:

1. креирајте mailbox за логистика
2. Доделете му "Application mailbox" permissions
3. Или дајте му full access на shared mailbox

---

## 3️⃣ ERP Извор (Опционално)

### Што треба од ИТ:

| Ресурс | Опис |
|---------|------|
| **ERP Export** | Excel/CSV извоз од ERP |
| **API Endpoint** | Ако има direct API |

### Како да го направите:

1. Побарајте извоз од нарачки (Purchase Orders)
2. Побарајте извоз од испораки (Shipments)
3. Побарајте lista на дестинации/магацини

---

## 📧 Е-маил кон ИТ (Шаблон)

```
Subject: LogiTask - Потребни Azure AD credentials

Здраво IT оддел,

За завршување на проектот LogiTask, ни требаат следните ресурси:

1. MICROSOFT AZURE AD ПРИСТАП
   - Tenant ID
   - Application Client ID  
   - Client Secret
   - Admin consent заpermissions: Mail.Read, Mail.Send, User.Read

2. MAILBOX ЗА ЛОГИСТИКА  
   - Специјална mailbox или shared mailbox
   - Пристап до неа од апликацијата

Апликацијата ќе биде во вашиот Azure - нема потреба од надворешни сервиси.

Ве молиме контактирајте ме ако имате прашања.

Поздрав,
[Вашето име]
```

---

## ✅ 체크листа за ИТ

```
[ ] Креiran Azure AD App registration
[ ] Client ID добиен
[ ] Client Secret генериран
[ ] Mail.Read permission одобрен
[ ] Mail.Send permission одобрен  
[ ] Admin consent даден
[ ] Logistics mailbox креирана
[ ] Пристап до mailbox тестиран
```

---

## 📞 Контакт

Ако имате прашања, пишете ми и ќе ви помогнем да ги објасните техничките барања на вашиот ИТ оддел.