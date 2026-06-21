'use server';

import { db } from '@/lib/db';
import { wordProgress, profiles, studySessions, studyAnswers, words } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, lte, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Classic SM-2 Spaced Repetition Algorithm
function calculateSM2(
  quality: number, // 0 (forget) to 5 (perfect)
  prevRepetitions: number,
  prevIntervalDays: number,
  prevEaseFactor: number
) {
  let repetitions = prevRepetitions;
  let intervalDays = prevIntervalDays;
  let easeFactor = prevEaseFactor;

  if (quality >= 3) {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(prevIntervalDays * prevEaseFactor);
    }
    repetitions++;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  // Adjust Ease Factor
  easeFactor = prevEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // Determine progress status
  let status: 'learning' | 'review' | 'mastered' = 'learning';
  if (repetitions >= 4) {
    status = 'mastered';
  } else if (repetitions >= 2) {
    status = 'review';
  }

  return {
    repetitions,
    intervalDays,
    easeFactor,
    status,
  };
}

export async function getDueCards() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized', cards: [] };
  const userId = session.user.id;

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch all word progress that is due today or earlier for this user
    const dueProgress = await db
      .select({
        progressId: wordProgress.id,
        status: wordProgress.status,
        easeFactor: wordProgress.easeFactor,
        intervalDays: wordProgress.intervalDays,
        repetitions: wordProgress.repetitions,
        dueDate: wordProgress.dueDate,
        word: {
          id: words.id,
          term: words.term,
          phonetic: words.phonetic,
          partOfSpeech: words.partOfSpeech,
          definition: words.definition,
          definitionVi: words.definitionVi,
          exampleSentence: words.exampleSentence,
          exampleSentenceVi: words.exampleSentenceVi,
        }
      })
      .from(wordProgress)
      .innerJoin(words, eq(wordProgress.wordId, words.id))
      .where(
        and(
          eq(wordProgress.userId, userId),
          lte(wordProgress.dueDate, todayStr)
        )
      );

    return { success: true, cards: dueProgress };
  } catch (error: any) {
    return { success: false, error: error.message || 'Lỗi khi tải từ vựng cần ôn tập', cards: [] };
  }
}

export async function submitCardReview(progressId: string, wordId: string, rating: 'again' | 'hard' | 'good' | 'easy') {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };
  const userId = session.user.id;

  // Map user-friendly rating to quality score (0-5)
  const ratingToQuality = {
    again: 1, // forgot
    hard: 3,  // correct but difficult
    good: 4,  // correct after hesitation
    easy: 5,  // perfect response
  };
  const quality = ratingToQuality[rating];
  const isCorrect = quality >= 3;

  try {
    // 1. Fetch current progress
    const progress = await db.query.wordProgress.findFirst({
      where: and(
        eq(wordProgress.id, progressId),
        eq(wordProgress.userId, userId)
      ),
    });

    if (!progress) {
      return { success: false, error: 'Không tìm thấy thông tin tiến trình của thẻ từ này' };
    }

    // 2. Compute next review dates and stats using SM-2
    const { repetitions, intervalDays, easeFactor, status } = calculateSM2(
      quality,
      progress.repetitions,
      progress.intervalDays,
      progress.easeFactor
    );

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + intervalDays);
    const nextDueDateStr = nextDueDate.toISOString().split('T')[0];

    const xpReward = isCorrect ? (rating === 'easy' ? 15 : 10) : 2; // +10 to +15 XP for correct, +2 XP for attempting

    // 3. Update progress record in database
    await db.update(wordProgress).set({
      status,
      easeFactor,
      intervalDays,
      repetitions,
      dueDate: nextDueDateStr,
      lastReviewedAt: new Date(),
      totalReviews: progress.totalReviews + 1,
      correctReviews: progress.correctReviews + (isCorrect ? 1 : 0),
    }).where(eq(wordProgress.id, progressId));

    // 4. Update user profile XP and Streak
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
    });

    if (profile) {
      // Calculate streak logic: if last studied was yesterday, increment streak. If today, keep it. Otherwise reset to 1.
      let newStreak = profile.streakDays;
      const today = new Date();
      today.setHours(0,0,0,0);
      
      if (profile.lastStudiedAt) {
        const lastStudied = new Date(profile.lastStudiedAt);
        lastStudied.setHours(0,0,0,0);
        const diffTime = today.getTime() - lastStudied.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          newStreak = profile.streakDays + 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      await db.update(profiles).set({
        totalXp: profile.totalXp + xpReward,
        streakDays: newStreak,
        longestStreak: Math.max(profile.longestStreak, newStreak),
        lastStudiedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(profiles.id, userId));
    }

    // 5. Log study session
    const [sessionRecord] = await db.insert(studySessions).values({
      userId,
      gameType: 'flashcard',
      score: isCorrect ? 100 : 0,
      totalQuestions: 1,
      correctAnswers: isCorrect ? 1 : 0,
      timeTakenSeconds: 5,
      xpEarned: xpReward,
    }).returning();

    await db.insert(studyAnswers).values({
      sessionId: sessionRecord.id,
      wordId,
      isCorrect,
      userAnswer: rating,
    });

    revalidatePath('/dashboard');
    revalidatePath('/review');
    return { success: true, xpEarned: xpReward };
  } catch (error: any) {
    return { success: false, error: error.message || 'Lỗi khi lưu kết quả ôn tập' };
  }
}
