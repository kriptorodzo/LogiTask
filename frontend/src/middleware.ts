import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for:
 * - Role-based route protection
 * - Performance optimizations
 * - Security headers
 * - Caching for static assets
 */

// Role-based route access rules
const ROLE_ROUTES: Record<string, string[]> = {
  // Manager can access everything
  MANAGER: ['/admin', '/reports', '/performance', '/manager'],
  
  // Coordinators cannot access admin, reports, performance
  RECEPTION_COORDINATOR: ['/coordinator'],
  DELIVERY_COORDINATOR: ['/coordinator'],
  DISTRIBUTION_COORDINATOR: ['/coordinator'],
  
  // Admin (if exists) can access admin only
  ADMIN: ['/admin'],
};

// Routes that require authentication
const PROTECTED_ROUTES = ['/admin', '/manager', '/coordinator', '/reports', '/performance'];

// Routes accessible only to specific roles
const RESTRICTED_ROUTES: Record<string, string[]> = {
  '/admin': ['MANAGER', 'ADMIN'],
  '/admin/erp': ['MANAGER', 'ADMIN'],
  '/admin/erp/import': ['MANAGER', 'ADMIN'],
  '/admin/erp/routes': ['MANAGER', 'ADMIN'],
  '/admin/performance': ['MANAGER', 'ADMIN'],
  '/reports': ['MANAGER'],
  '/performance': ['MANAGER'],
  '/performance/leaderboard': ['MANAGER'],
  '/performance/scorecard': ['MANAGER'],
  '/manager': ['MANAGER'],
};

function getRoleFromCookie(request: NextRequest): string | null {
  // Try to get role from cookies (set by NextAuth)
  const sessionCookie = request.cookies.get('next-auth.session-token') || request.cookies.get('__Secure-next-auth.session-token');
  
  // For dev mode, we check a custom cookie or header
  const devRole = request.cookies.get('dev_role')?.value || request.headers.get('x-dev-role');
  if (devRole) {
    return devRole;
  }
  
  return sessionCookie ? 'MANAGER' : null; // Default for now
}

function isRouteAllowed(role: string | null, pathname: string): boolean {
  if (!role) return false;
  
  // Check if role has access to this route
  for (const [route, allowedRoles] of Object.entries(RESTRICTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return allowedRoles.includes(role);
    }
  }
  
  return true;
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );

  // Performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Cache-Control for different routes
  // Static files - long cache
  if (pathname.startsWith('/_next/static/') || pathname.startsWith('/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // API routes - no cache by default
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }

  // Skip rate limiting for static assets
  if (!pathname.startsWith('/_next/static/') && !pathname.startsWith('/static/')) {
    // Add timestamp for server-timing
    const start = Date.now();
    response.headers.set(
      'Server-Timing',
      `middleware;dur=${Date.now() - start}`
    );
  }

  // Role-based route protection
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  if (isProtectedRoute) {
    const role = getRoleFromCookie(request);
    
    if (!role) {
      // Not authenticated - redirect to signin
      if (!pathname.startsWith('/api/auth')) {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
    } else if (!isRouteAllowed(role, pathname)) {
      // Role doesn't have access - redirect to home
      console.log(`[Middleware] Role ${role} blocked from ${pathname}`);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

/**
 * Configure which routes the middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};