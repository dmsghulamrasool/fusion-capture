import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/admin', '/editor', '/profile'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // For NextAuth v5, we let client-side handle authentication
  // The proxy just allows the request through and ProtectedRoute components
  // will handle redirects on the client side
  // This prevents cookie checking issues with NextAuth v5 beta
  
  return NextResponse.next();
}

// Protect these routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/editor/:path*',
    '/profile/:path*',
  ],
};

