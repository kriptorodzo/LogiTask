# Azure AD / Entra ID Pilot Configuration - Ready to Execute

This is the operational checklist for Azure AD / Entra ID configuration, ready to execute immediately after PostgreSQL is provisioned.

---

## 🔧 Quick Setup Commands

### 1. Register App in Azure Portal

1. Go to: https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps
2. Click "New registration"
3. Configure:
   - **Name**: `LogiTask-Pilot`
   - **Supported account types**: Single tenant (or multi-tenant as needed)
   - **Redirect URI**: `https://logitask-pilot.example.com/api/auth/callback/azure-ad`

### 2. Generate Client Secret

1. In app registration → "Certificates and secrets"
2. Click "New client secret"
3. Add description: `Pilot Production`
4. Copy the **secret value** (not the ID) - you'll need this immediately

### 3. API Permissions

Go to "API permissions" and add:

| Permission | Type | Admin Consent Required |
|------------|------|----------------------|
| `User.Read` | Delegated | Yes |
| `Mail.Read` | Delegated | Yes |
| `Mail.Read.Shared` | Delegated | Yes (if using shared mailbox) |

Click "Grant admin consent" after adding.

---

## 📋 Exact Values to Collect

| Field | Where to Find | Example Value |
|-------|---------------|---------------|
| **AZURE_AD_CLIENT_ID** | App registration → Application (client) ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| **AZURE_AD_CLIENT_SECRET** | Certificates and secrets → Value | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| **AZURE_AD_TENANT_ID** | Azure AD → Properties → Directory ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |

---

## 🎯 Pilot-Specific Configuration

### Production Redirect URIs

Add these in Azure Portal → App Registration → Authentication:

```
https://logitask-pilot.example.com/api/auth/callback/azure-ad
https://logitask-pilot.example.com/api/auth/callback/microsoft
```

### Environment Variables for Pilot

Create/update `backend/.env`:
```bash
# Azure AD - REQUIRED for production/pilot
AZURE_AD_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_AD_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
AZURE_AD_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Auth - PRODUCTION mode
AUTH_MODE=production
NODE_ENV=production

# Database - PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/logitask?schema=public"

# Server
PORT=4000
```

Create/update `frontend/.env.local`:
```bash
# NextAuth
NEXTAUTH_URL="https://logitask-pilot.example.com"
NEXTAUTH_SECRET="<generate-random-64-character-string>"

# Azure AD
AZURE_AD_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_AD_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
AZURE_AD_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Backend
BACKEND_URL="https://logitask-pilot-backend.example.com"
```

---

## 👥 Pilot Users Mapping

| Email | Role in Azure AD | Role in LogiTask | Status |
|-------|------------------|------------------|--------|
| manager@company.com | Assign to app | MANAGER | ⬜ Not created |
| reception@company.com | Assign to app | RECEPTION_COORDINATOR | ⬜ Not created |
| delivery@company.com | Assign to app | DELIVERY_COORDINATOR | ⬜ Not created |
| distribution@company.com | Assign to app | DISTRIBUTION_COORDINATOR | ⬜ Not created |

### Create Users in Azure AD (if not exist)

1. Go to Microsoft Entra ID → Users
2. Create each pilot user
3. Ensure they have appropriate licenses (if required)

---

## 📧 Mailbox Configuration

### Service Account

| Field | Value |
|-------|-------|
| Email | `logistics@company.com` |
| Type | Shared mailbox or user mailbox |
| Access | Graph API permission to read emails |

### Test Email Address

For testing: send test email to `logistics@company.com`

---

## ✅ Pre-Flight Verification

Run these commands AFTER PostgreSQL is ready:

```bash
# 1. Verify Azure AD env vars are set
grep -E "AZURE_AD_(CLIENT_ID|CLIENT_SECRET|TENANT_ID)" backend/.env

# 2. Restart backend with production auth
cd backend
NODE_ENV=production AUTH_MODE=production npm run start:dev

# 3. Test login endpoint
curl -I http://localhost:4000/auth/login
# Should redirect to Microsoft login

# 4. Test in browser:
# - Navigate to http://localhost:3000
# - Click "Sign in with Azure AD"
# - Login as manager@company.com
# - Verify redirected to /manager
```

---

## 🚀 Post-Provisioning Steps

After PostgreSQL is ready and before starting pilot:

1. ✅ Set Azure AD environment variables
2. ✅ Restart backend: `NODE_ENV=production npm run start:dev`
3. ✅ Test login flow in browser
4. ✅ Verify manager@company.com can login
5. ✅ Verify role is correct in database
6. ✅ Send test email to logistics@company.com
7. ✅ Verify email appears in manager inbox
8. ✅ Test approve/delegate workflow

---

## 📊 Exit Criteria

This checklist is complete when:

- [ ] Azure AD app registered with correct redirect URIs
- [ ] Client secret generated and stored securely
- [ ] API permissions granted with admin consent
- [ ] Environment variables configured in backend
- [ ] Environment variables configured in frontend
- [ ] Pilot users created in Azure AD
- [ ] Login flow tested successfully
- [ ] Email fetch tested successfully
- [ ] Manager can see inbox
- [ ] Coordinator can see assigned tasks

---

## 📝 Notes

- **Replace example URLs** with actual pilot URLs
- **Store secrets** in Azure Key Vault or secrets manager, not in code
- **Test in staging** before production if possible

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| IT / Infrastructure | | | |
| Tech Lead | | | |
| Product Owner | | | |