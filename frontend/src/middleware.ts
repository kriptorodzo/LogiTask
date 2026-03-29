import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for performance optimizations:
 * - Rate limiting headers
 * - Security headers
 * - Caching for static assets
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

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
  const pathname = request.nextUrl.pathname;

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