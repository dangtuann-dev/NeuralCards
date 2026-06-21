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
    jwt({ token, user }) {
      console.log('JWT callback - token:', JSON.stringify(token), 'user:', JSON.stringify(user));
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback - token:', JSON.stringify(token), 'session:', JSON.stringify(session));
      const userId = (token.id || token.sub) as string;
      if (userId && session.user) {
        session.user.id = userId;
        
        // Fetch onboarding status dynamically
        const profile = await db.query.profiles.findFirst({
          where: eq(schema.profiles.id, userId),
          columns: { onboardingCompleted: true },
        });
        console.log('Session callback - profile:', JSON.stringify(profile));
        
        if (profile) {
          session.user.onboardingCompleted = profile.onboardingCompleted;
        } else {
          session.user.onboardingCompleted = false;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});
