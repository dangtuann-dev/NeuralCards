'use server';

import { db } from '@/lib/db';
import { profiles, userBadges, badges, notifications } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const onboardingSchema = z.object({
  dailyGoal: z.number().int().min(5).max(100),
  studyPreference: z.string(),
  preferredLanguage: z.string().default('vi'),
});

export async function completeOnboarding(data: z.infer<typeof onboardingSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }
  
  const userId = session.user.id;
  
  try {
    const validated = onboardingSchema.parse(data);
    
    // Update profile
    await db.update(profiles).set({
      dailyGoal: validated.dailyGoal,
      studyPreference: validated.studyPreference,
      preferredLanguage: validated.preferredLanguage,
      onboardingCompleted: true,
      updatedAt: new Date(),
    }).where(eq(profiles.id, userId));
    
    // Ensure the welcome badge exists
    await db.insert(badges).values({
      id: 'welcome',
      name: 'Welcome to NeuralCards',
      description: 'Completed onboarding successfully!',
      icon: '🧠',
      condition: 'onboardingCompleted == true',
      xpReward: 100,
    }).onConflictDoNothing();
    
    // Grant welcome badge to user
    await db.insert(userBadges).values({
      userId,
      badgeId: 'welcome',
    }).onConflictDoNothing();
    
    // Create welcome notification
    await db.insert(notifications).values({
      userId,
      type: 'welcome',
      title: 'Chào mừng bạn đến với NeuralCards! 🧠',
      message: 'Chúc mừng bạn đã hoàn thành onboarding. Hãy bắt đầu học từ vựng IELTS ngay hôm nay nhé!',
    });
    
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Onboarding action error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to complete onboarding';
    return { success: false, error: errorMessage };
  }
}
