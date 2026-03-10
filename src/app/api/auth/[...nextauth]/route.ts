import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

const ALLOWED_EMAILS = [
  'santirodriguezsalinas@gmail.com',
  'mbernal@uma-health.com',
  'fmurzone@uma-health.com',
];

// Demo/test credentials provider — only active when DEMO_SECRET is configured
const providers = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  }),
  ...(process.env.DEMO_SECRET
    ? [
        CredentialsProvider({
          id: 'demo',
          name: 'Demo',
          credentials: {
            secret: { label: 'Secret', type: 'password' },
          },
          async authorize(credentials) {
            if (credentials?.secret === process.env.DEMO_SECRET) {
              return {
                id: 'demo',
                name: 'Demo User',
                email: 'santirodriguezsalinas@gmail.com',
              };
            }
            return null;
          },
        }),
      ]
    : []),
];

const handler = NextAuth({
  providers,
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
