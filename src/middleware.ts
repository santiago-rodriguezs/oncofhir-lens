export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - /login (auth page)
     * - /api/auth (NextAuth routes)
     * - /_next (static assets)
     * - /favicon.ico, /manifest.webmanifest (public files)
     */
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest).*)',
  ],
};
