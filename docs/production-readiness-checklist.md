# LogiTask - Production Readiness Checklist

## ✅ Pre-Deployment Verification

### Infrastructure
- [ ] PostgreSQL database provisioned and accessible
- [ ] Redis (optional) for caching configured
- [ ] Azure AD application registered
- [ ] Microsoft Graph API permissions configured
- [ ] Environment variables configured in production

### Security
- [ ] CORS configured for production domains
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] Database backups scheduled

### Monitoring
- [ ] Health check endpoint (`/api/health`) responding
- [ ] Error tracking configured (Sentry/DataDog)
- [ ] Performance metrics enabled
- [ ] Log aggregation configured

## 🚀 Deployment Steps

### 1. Database Setup
```bash
# Run migrations
npx prisma migrate deploy

# Seed production data (if needed)
npx prisma db seed
```

### 2. Backend Deployment
```bash
# Build
npm run build

# Start
npm run start:prod
```

### 3. Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to hosting (Vercel/Netlify/Azure Static Web Apps)
```

## 🔧 Configuration Checklist

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_URL` | ✅ | Production URL |
| `NEXTAUTH_SECRET` | ✅ | Random secret for sessions |
| `AZURE_AD_CLIENT_ID` | ✅ | Azure AD app client ID |
| `AZURE_AD_CLIENT_SECRET` | ✅ | Azure AD app secret |
| `AZURE_AD_TENANT_ID` | ✅ | Azure AD tenant ID |
| `BACKEND_URL` | ✅ | Backend API URL |

### Azure AD App Registration
- [ ] Redirect URIs configured
- [ ] API permissions: `User.Read`, `Mail.Read`, `Mail.Send`
- [ ] Client secret generated and stored securely

## 📊 Post-Deployment Verification

### Smoke Tests
- [ ] Login works with Azure AD
- [ ] Dashboard loads with KPIs
- [ ] Can view emails
- [ ] Can approve/reject tasks
- [ ] Reports page loads
- [ ] Performance pages load
- [ ] ERP admin accessible

### Monitoring Checklist
- [ ] No critical errors in logs
- [ ] API response times < 500ms
- [ ] Database queries optimized
- [ ] No memory leaks observed

## 🔄 Rollback Plan

If issues occur:
1. Revert to previous version tag
2. Restore database from backup
3. Verify with smoke tests
4. Notify stakeholders

## 📞 Support Contacts

| Role | Name | Contact |
|------|------|---------|
| Tech Lead | TBD | TBD |
| DevOps | TBD | TBD |
| Business Owner | TBD | TBD |

## 📝 Notes

- [ ] Add production URL to Azure AD redirect URIs
- [ ] Configure SMTP for email notifications (optional)
- [ ] Set up CDN for static assets
- [ ] Enable HTTPS (auto with most hosting providers)