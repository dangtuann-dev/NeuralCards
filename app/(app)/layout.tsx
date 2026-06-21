import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db, schema } from '@/lib/db';
import { eq, and, gte, sql } from 'drizzle-orm';
import AppLayoutClient from './AppLayoutClient';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;

  // 1. Fetch profile stats
  let profile = await db.query.profiles.findFirst({
    where: eq(schema.profiles.id, userId),
  });

  if (!profile) {
    profile = {
      id: userId,
      username: null,
      avatarUrl: null,
      streakDays: 0,
      longestStreak: 0,
      lastStudiedAt: null,
      totalWordsLearned: 0,
      totalXp: 0,
      dailyGoal: 10,
      studyPreference: 'mixed',
      preferredLanguage: 'vi',
      onboardingCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // 2. Count words reviewed today
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const wordsLearnedTodayResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.wordProgress)
    .where(
      and(
        eq(schema.wordProgress.userId, userId),
        gte(schema.wordProgress.lastReviewedAt, startOfToday)
      )
    );
  const wordsLearnedToday = Number(wordsLearnedTodayResult[0]?.count || 0);

  const userStats = {
    dailyGoal: profile.dailyGoal,
    wordsLearnedToday,
    streakDays: profile.streakDays,
    totalXp: profile.totalXp,
  };

  return (
    <AppLayoutClient userStats={userStats}>
      {children}
    </AppLayoutClient>
  );
}
