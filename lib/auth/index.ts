import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db, schema } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    usersTable: schema.users as any,
    accountsTable: schema.accounts as any,
    sessionsTable: schema.sessions as any,
    verificationTokensTable: schema.verificationTokens as any,
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }),
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-google-client-secret',
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.query.users.findFirst({
          where: eq(schema.users.email, parsed.data.email),
        });

        if (!user?.password) return null;
        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        
        // Fetch onboarding status once on initial sign in
        try {
          if (user.id) {
            const profile = await db.query.profiles.findFirst({
              where: eq(schema.profiles.id, user.id),
              columns: { onboardingCompleted: true },
            });
            token.onboardingCompleted = profile ? profile.onboardingCompleted : false;
          } else {
            token.onboardingCompleted = false;
          }
        } catch (err) {
          console.error('Error fetching profile in JWT callback:', err);
          token.onboardingCompleted = false;
        }
      }
      
      // Handle session updates (e.g. completing onboarding)
      if (trigger === 'update' && session?.user) {
        token.onboardingCompleted = session.user.onboardingCompleted ?? token.onboardingCompleted;
        if (session.user.name) token.name = session.user.name;
        if (session.user.email) token.email = session.user.email;
      }
      
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || 'a-32-character-secret-placeholder-for-vercel-fallback-1234567890',
  pages: {
    signIn: '/login',
    error: '/login',
  },
});
