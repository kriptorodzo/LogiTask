# Azure AD / Entra ID Pilot Configuration Checklist

Use this checklist to verify Azure AD and Microsoft Graph API configuration before pilot start.

---

## 1. Azure AD App Registration

- [ ] App registered in Microsoft Entra ID (Azure Portal)
- [ ] App name: **LogiTask** (or similar)
- [ ] Supported account types: **Single tenant** or **Multi-tenant** as needed
- [ ] Redirect URIs configured:
  - [ ] `http://localhost:3000/api/auth/callback/azure-ad` (Development)
  - [ ] `https://your-production-url.com/api/auth/callback/azure-ad` (Production)
- [ ] App ID (Client ID) captured
- [ ] App secret (Client Secret) generated and stored securely

---

## 2. API Permissions (Microsoft Graph)

Required permissions:

| Permission | Type | Purpose |
|------------|------|---------|
| `User.Read` | Delegated | Read user profile |
| `Mail.Read` | Delegated | Read emails from mailbox |
| `Mail.Read.Shared` | Delegated | Read shared mailboxes (if needed) |
| `Mail.Send` | Delegated | Send emails (if needed) |
- [ ] All permissions granted with Admin consent
- [ ] Status shows "Granted for [Organization]"

---

## 3. Environment Variables Configuration

### Backend (.env)
```properties
# Azure AD Configuration
AZURE_AD_CLIENT_ID=<App ID from step 1>
AZURE_AD_CLIENT_SECRET=<App secret from step 1>
AZURE_AD_TENANT_ID=<Directory ID>

# Auth Mode
AUTH_MODE=production  # or NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/logistics_db

# Server
PORT=4000
NODE_ENV=production
```

### Frontend (.env.local)
```properties
# NextAuth Configuration
NEXTAUTH_URL=https://your-production-url.com
NEXTAUTH_SECRET=<generate-random-secret>

# Azure AD
AZURE_AD_CLIENT_ID=<App ID>
AZURE_AD_CLIENT_SECRET=<App secret>
AZURE_AD_TENANT_ID=<Directory ID>

# Backend
BACKEND_URL=https://your-backend-url.com
```

---

## 4. Test Email Integration

### 4.1 Grant Access to Mailbox
- [ ] Log in to Outlook as the service account (e.g., logistics@company.com)
- [ ] Ensure the account has API access enabled
- [ ] Or use shared mailbox if applicable

### 4.2 Test Fetch
```bash
# Test via backend API (after authentication is configured)
curl -X GET http://localhost:4000/api/emails \
  -H "Authorization: Bearer <access_token>"
```

### 4.3 Verify
- [ ] Emails are fetched successfully
- [ ] Email content is parsed correctly
- [ ] Tasks are created from emails

---

## 5. User Provisioning

- [ ] Pilot users created in Azure AD:
  - [ ] manager@company.com (MANAGER role)
  - [ ] reception@company.com (RECEPTION_COORDINATOR role)
  - [ ] delivery@company.com (DELIVERY_COORDINATOR role)
  - [ ] distribution@company.com (DISTRIBUTION_COORDINATOR role)
- [ ] Users assigned to appropriate security groups (if using groups for roles)
- [ ] Users can log in via Azure AD
- [ ] Roles are correctly assigned in LogiTask database

---

## 6. Verification Tests

### Test 1: Manager Login
1. Navigate to production URL
2. Click "Sign in with Azure AD"
3. Login as manager@company.com
4. Verify:
   - [ ] Login successful
   - [ ] Redirected to /manager dashboard
   - [ ] Can see all proposed tasks
   - [ ] Can approve/reject tasks

### Test 2: Coordinator Login
1. Login as reception@company.com
2. Verify:
   - [ ] Redirected to /tasks
   - [ ] Can see only assigned tasks
   - [ ] Can update task status
   - [ ] Cannot access /manager or /reports

### Test 3: Email Processing
1. Send test email to logistics@company.com
2. Verify:
   - [ ] Email appears in Manager inbox
   - [ ] Task is created with correct details
   - [ ] Correct coordinator is suggested/assigned

### Test 4: End-to-End Flow
1. Manager approves task
2. Coordinator sees assigned task
3. Coordinator updates status to IN_PROGRESS
4. Coordinator completes task
5. Verify:
   - [ ] Status history recorded with correct user IDs
   - [ ] Reports update with new completion data
   - [ ] OTIF metrics reflect the completion

---

## 7. Security Checklist

- [ ] Client secret stored in Azure Key Vault (production)
- [ ] No secrets in source control
- [ ] HTTPS enforced in production
- [ ] App registration uses least privilege permissions
- [ ] Audit logs enabled in Azure AD

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| IT / Infrastructure | | | |
| Tech Lead | | | |
| Product Owner | | | |