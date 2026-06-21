import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db, schema } from '@/lib/db';
import { eq, and, ne, lte, gte, sql, desc } from 'drizzle-orm';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Dashboard — NeuralCards',
  description: 'Tổng quan tiến độ học từ vựng IELTS của bạn.',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;

  // 1. Fetch user profile
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

  // 2. Count total words learned (status != 'new')
  const wordsLearnedResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.wordProgress)
    .where(
      and(
        eq(schema.wordProgress.userId, userId),
        ne(schema.wordProgress.status, 'new')
      )
    );
  const wordsLearned = Number(wordsLearnedResult[0]?.count || 0);

  // 3. Count words to review (status != 'new' AND due_date <= today)
  const todayStr = new Date().toISOString().split('T')[0];
  const wordsToReviewResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.wordProgress)
    .where(
      and(
        eq(schema.wordProgress.userId, userId),
        ne(schema.wordProgress.status, 'new'),
        lte(schema.wordProgress.dueDate, todayStr)
      )
    );
  const wordsToReview = Number(wordsToReviewResult[0]?.count || 0);

  // 4. Count words studied/reviewed today (lastReviewedAt >= start of today)
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

  // 5. Calculate average accuracy from wordProgress reviews
  const accuracyResult = await db
    .select({
      total: sql<number>`sum(${schema.wordProgress.totalReviews})`,
      correct: sql<number>`sum(${schema.wordProgress.correctReviews})`,
    })
    .from(schema.wordProgress)
    .where(eq(schema.wordProgress.userId, userId));
  const totalReviews = Number(accuracyResult[0]?.total || 0);
  const correctReviews = Number(accuracyResult[0]?.correct || 0);
  const accuracy = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;

  // 6. Calculate total study minutes
  const studyTimeResult = await db
    .select({ totalSeconds: sql<number>`sum(${schema.studySessions.timeTakenSeconds})` })
    .from(schema.studySessions)
    .where(eq(schema.studySessions.userId, userId));
  const totalStudyMinutes = Math.round(Number(studyTimeResult[0]?.totalSeconds || 0) / 60);

  // Pack stats
  const stats = {
    streakDays: profile.streakDays,
    totalXp: profile.totalXp,
    wordsLearned,
    wordsToReview,
    dailyGoal: profile.dailyGoal,
    wordsLearnedToday,
    accuracy,
    totalStudyMinutes,
  };

  // 7. Fetch recent words
  const dbRecentWords = await db
    .select({
      term: schema.words.term,
      definition: schema.words.definition,
      status: schema.wordProgress.status,
      dueDate: schema.wordProgress.dueDate,
    })
    .from(schema.wordProgress)
    .innerJoin(schema.words, eq(schema.wordProgress.wordId, schema.words.id))
    .where(eq(schema.wordProgress.userId, userId))
    .orderBy(desc(schema.wordProgress.lastReviewedAt))
    .limit(5);

  const recentWords = dbRecentWords.map((item) => {
    // Format next review label
    let nextReview = 'Hôm nay';
    if (item.dueDate) {
      const due = new Date(item.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) nextReview = 'Hôm nay';
      else if (diffDays === 1) nextReview = 'Ngày mai';
      else if (diffDays > 1) nextReview = `${diffDays} ngày nữa`;
      else nextReview = 'Quá hạn';
    }

    return {
      word: item.term,
      definition: item.definition,
      status: item.status,
      nextReview,
    };
  });

  // 8. Fetch study activity heatmap (last 12 weeks = 84 days)
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);
  twelveWeeksAgo.setHours(0, 0, 0, 0);

  const dbActivity = await db
    .select({
      dateStr: sql<string>`TO_CHAR(${schema.studySessions.completedAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)`,
    })
    .from(schema.studySessions)
    .where(
      and(
        eq(schema.studySessions.userId, userId),
        gte(schema.studySessions.completedAt, twelveWeeksAgo)
      )
    )
    .groupBy(sql`TO_CHAR(${schema.studySessions.completedAt}, 'YYYY-MM-DD')`);

  const activityMap = new Map<string, number>();
  dbActivity.forEach((act) => {
    if (act.dateStr) {
      activityMap.set(act.dateStr, Number(act.count || 0));
    }
  });

  // Construct grid of 84 days (12 weeks * 7 days)
  const activityData = [];
  for (let i = 0; i < 84; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (83 - i)); // From 83 days ago to today
    const dateStr = d.toISOString().split('T')[0];
    activityData.push({
      day: i,
      count: activityMap.get(dateStr) || 0,
    });
  }

  return (
    <DashboardClient
      user={session.user}
      stats={stats}
      recentWords={recentWords}
      activityData={activityData}
    />
  );
}
