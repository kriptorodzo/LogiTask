# API Access Pattern

## Overview
All frontend data access must go through Next.js API proxy routes (`/api/...`). The browser should never call the backend service directly.

## Architecture

```
Browser (Next.js Frontend)
        │
        │ fetch('/api/inbound')
        ▼
Next.js API Routes (/api/*)
        │
        │ Server-to-Server call
        ▼
Backend Service (localhost:4000)
```

## Why This Pattern?

1. **CORS**: Browser-to-backend calls are blocked by CORS policy
2. **Security**: All requests go through Next.js middleware/auth
3. **Consistency**: Single point of access for all data operations

## Implementation

### API Client (`/src/lib/api.ts`)
```typescript
const API_URL = '/api';  // Use relative proxy routes

const apiClient = axios.create({
  baseURL: API_URL,
  // ...
});
```

### API Routes (`/src/app/api/*`)
Each route proxies requests to the backend:
```typescript
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  // Fetch from backend server-side (no CORS issues)
  const response = await fetch(`${BACKEND_URL}/inbound`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return NextResponse.json(await response.json());
}
```

## Pages Using Proxy-Only Access

| Page | URL | API Route | Backend Route |
|------|-----|-----------|---------------|
| Manager Inbox | `/inbound` | `/api/inbound` | `/inbound` |
| Inbound Detail | `/inbound/[id]` | `/api/inbound/[id]` | `/inbound/:id` |
| Coordinator | `/coordinator` | `/api/inbound/coordinator/[userId]` | `/inbound/coordinator/:userId` |
| Reports | `/reports` | `/api/reports` | `/api/reports/*` |
| Performance | `/admin/performance` | `/api/performance/*` | `/performance/*` |
| ERP | `/admin/erp` | `/api/erp/*` | `/erp/*` |

## Key Rules

1. **Never use `fetch('http://localhost:4000/...')`** in browser code
2. **Always use proxy routes** - `/api/inbound`, `/api/tasks`, etc.
3. **API routes call backend server-side** - no CORS issues
4. **Axios client** should use `/api` as base URL
