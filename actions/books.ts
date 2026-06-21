'use server';

import { db } from '@/lib/db';
import { lessons, words, wordProgress } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const deckSchema = z.object({
  title: z.string().min(2, 'Tên bộ từ phải từ 2 ký tự trở lên'),
  description: z.string().optional(),
  coverEmoji: z.string().default('📚'),
});

const wordSchema = z.object({
  lessonId: z.string().uuid(),
  term: z.string().min(1, 'Từ vựng không được để trống'),
  phonetic: z.string().optional(),
  partOfSpeech: z.enum(['noun','verb','adjective','adverb','phrase','idiom','collocation','other']).default('noun'),
  definition: z.string().min(1, 'Định nghĩa không được để trống'),
  definitionVi: z.string().optional(),
  exampleSentence: z.string().optional(),
  exampleSentenceVi: z.string().optional(),
});

export async function createDeck(data: z.infer<typeof deckSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Bạn phải đăng nhập để tạo bộ từ' };
  const userId = session.user.id;

  try {
    const validated = deckSchema.parse(data);
    await db.insert(lessons).values({
      userId,
      title: validated.title,
      description: validated.description || '',
      coverEmoji: validated.coverEmoji,
      wordCount: 0,
    });

    revalidatePath('/books');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Lỗi khi tạo bộ từ mới' };
  }
}

export async function addWordToDeck(data: z.infer<typeof wordSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Bạn phải đăng nhập để thêm từ vựng' };
  const userId = session.user.id;

  try {
    const validated = wordSchema.parse(data);

    // Verify ownership of the deck
    const deck = await db.query.lessons.findFirst({
      where: and(
        eq(lessons.id, validated.lessonId),
        eq(lessons.userId, userId)
      ),
    });
    if (!deck) return { success: false, error: 'Không tìm thấy bộ từ hoặc bạn không có quyền sở hữu' };

    // Insert the word card
    const [newWord] = await db.insert(words).values({
      lessonId: validated.lessonId,
      term: validated.term,
      phonetic: validated.phonetic || '',
      partOfSpeech: validated.partOfSpeech,
      definition: validated.definition,
      definitionVi: validated.definitionVi || '',
      exampleSentence: validated.exampleSentence || '',
      exampleSentenceVi: validated.exampleSentenceVi || '',
    }).returning();

    // Automatically create a default SRS progress log for the user
    await db.insert(wordProgress).values({
      userId,
      wordId: newWord.id,
      status: 'new',
      easeFactor: 2.5,
      intervalDays: 1,
      repetitions: 0,
      dueDate: new Date().toISOString().split('T')[0],
    });

    // Update denormalized counter in lessons
    await db.update(lessons).set({
      wordCount: deck.wordCount + 1,
      updatedAt: new Date(),
    }).where(eq(lessons.id, validated.lessonId));

    revalidatePath(`/books/${validated.lessonId}`);
    revalidatePath('/books');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Lỗi khi thêm từ vựng mới' };
  }
}
