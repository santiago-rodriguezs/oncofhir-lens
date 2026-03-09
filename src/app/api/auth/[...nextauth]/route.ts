import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const ALLOWED_EMAILS = [
  'santirodriguezsalinas@gmail.com',
];

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Only allow whitelisted emails
      return ALLOWED_EMAILS.includes(user.email ?? '');
    },
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});

export { handler as GET, handler as POST };
