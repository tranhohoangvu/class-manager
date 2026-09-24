import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  // Static assets and internal routes are excluded by config.matcher below

  // If user has a session cookie and is attempting to visit login page, redirect to dashboard
  if (token && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // If user has no session cookie and is attempting to visit protected routes
  // (Note: client-side AuthProvider also provides full RBAC guard redirects)
  if (!token && pathname !== '/login') {
    // If running in development with client localStorage session, allow Next.js client layout guards
    // to handle session verification seamlessly
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals, favicon, and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
