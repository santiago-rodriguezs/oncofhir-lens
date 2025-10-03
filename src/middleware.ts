import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware protects API routes with a simple token check
export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    
    // Check if auth header exists and matches the expected format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    
    // Token validation is handled in the API routes themselves
    // This is just a basic check to ensure the header is present
  }
  
  return NextResponse.next();
}

// Configure which paths this middleware is applied to
export const config = {
  matcher: '/api/:path*',
};
