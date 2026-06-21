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

async function translateToVi(text: string): Promise<string> {
  if (!text) return '';
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`
    );
    if (!res.ok) return '';
    const data = await res.json();
    if (data && data[0]) {
      return data[0].map((sentence: any) => sentence[0]).join('').trim();
    }
    return '';
  } catch {
    return '';
  }
}

function mapPartOfSpeech(pos: string): 'noun'|'verb'|'adjective'|'adverb'|'phrase'|'idiom'|'collocation'|'other' {
  const normalized = pos.toLowerCase().trim();
  if (['noun', 'verb', 'adjective', 'adverb'].includes(normalized)) {
    return normalized as 'noun'|'verb'|'adjective'|'adverb';
  }
  if (normalized === 'adjective' || normalized === 'adj') return 'adjective';
  if (normalized === 'adverb' || normalized === 'adv') return 'adverb';
  if (normalized === 'phrase' || normalized === 'prepositional phrase') return 'phrase';
  if (normalized === 'idiom') return 'idiom';
  if (normalized === 'collocation') return 'collocation';
  return 'other';
}

export async function lookupWord(word: string) {
  if (!word || !word.trim()) {
    return { success: false, error: 'Từ vựng không hợp lệ' };
  }

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim().toLowerCase())}`);
    if (!res.ok) {
      return { success: false, error: 'Không tìm thấy định nghĩa cho từ này' };
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, error: 'Không tìm thấy định nghĩa cho từ này' };
    }

    const entry = data[0];
    const phonetic = entry.phonetic || (entry.phonetics && entry.phonetics.find((p: any) => p.text)?.text) || '';

    // Find the first meaning
    const meaning = entry.meanings?.[0];
    const partOfSpeechRaw = meaning?.partOfSpeech || 'noun';
    const partOfSpeech = mapPartOfSpeech(partOfSpeechRaw);

    // Find definition and example
    const definitionObj = meaning?.definitions?.[0];
    const definition = definitionObj?.definition || '';
    const exampleSentence = definitionObj?.example || '';

    // Translate English definition to Vietnamese
    const definitionVi = definition ? await translateToVi(definition) : '';

    // Translate English example to Vietnamese
    const exampleSentenceVi = exampleSentence ? await translateToVi(exampleSentence) : '';

    return {
      success: true,
      data: {
        phonetic,
        partOfSpeech,
        definition,
        definitionVi,
        exampleSentence,
        exampleSentenceVi,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Lỗi hệ thống khi tra từ vựng' };
  }
}

