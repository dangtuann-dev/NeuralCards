'use server';

import { db } from '@/lib/db';
import { lessons, words, wordProgress } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';

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
  const trimmedWord = word ? word.trim() : '';
  if (!trimmedWord) {
    return { success: false, error: 'Từ vựng không hợp lệ' };
  }

  // 1. Try Anthropic AI if API key is present and valid (not dummy)
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicApiKey && anthropicApiKey !== 'dummy-anthropic-api-key' && anthropicApiKey.trim() !== '') {
    try {
      const anthropic = new Anthropic({ apiKey: anthropicApiKey });
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `You are a dictionary assistant. Provide details for the English term: "${trimmedWord}".
Format the response as a JSON object with the following fields:
{
  "phonetic": "IPA phonetic transcription, e.g. /ˈɪntrɪkɪt/ (leave empty if not applicable or multi-word)",
  "partOfSpeech": "one of: 'noun', 'verb', 'adjective', 'adverb', 'phrase', 'idiom', 'collocation', 'other'",
  "definition": "Clear, concise English definition",
  "definitionVi": "Vietnamese translation of the definition",
  "exampleSentence": "A natural English example sentence using the term",
  "exampleSentenceVi": "Vietnamese translation of the example sentence"
}
Return ONLY the raw JSON object, without markdown formatting or code blocks.`,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      if (text) {
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        
        return {
          success: true,
          data: {
            phonetic: parsed.phonetic || '',
            partOfSpeech: mapPartOfSpeech(parsed.partOfSpeech || 'noun'),
            definition: parsed.definition || '',
            definitionVi: parsed.definitionVi || '',
            exampleSentence: parsed.exampleSentence || '',
            exampleSentenceVi: parsed.exampleSentenceVi || '',
          }
        };
      }
    } catch (aiError: any) {
      console.error('Anthropic API error, falling back to keyless dictionary:', aiError.message);
    }
  }

  // 2. Keyless Fallback API Chain
  try {
    let phonetic = '';
    let partOfSpeechRaw = 'noun';
    let definition = '';
    let exampleSentence = '';

    // First try: dictionaryapi.dev
    const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(trimmedWord.toLowerCase())}`);
    if (dictRes.ok) {
      const data = await dictRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        phonetic = entry.phonetic || (entry.phonetics && entry.phonetics.find((p: any) => p.text)?.text) || '';
        const meaning = entry.meanings?.[0];
        partOfSpeechRaw = meaning?.partOfSpeech || 'noun';
        const definitionObj = meaning?.definitions?.[0];
        definition = definitionObj?.definition || '';
        exampleSentence = definitionObj?.example || '';
      }
    }

    // Second try: Wiktionary REST API if first try failed or returned no definition
    if (!definition) {
      const wiktionaryTerm = trimmedWord.replace(/\s+/g, '_');
      const wiktionaryRes = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(wiktionaryTerm)}`);
      
      if (wiktionaryRes.ok) {
        const data = await wiktionaryRes.json();
        if (data && data.en && data.en.length > 0) {
          const entry = data.en[0];
          partOfSpeechRaw = entry.partOfSpeech || 'other';
          const definitionObj = entry.definitions?.[0];
          
          const definitionHtml = definitionObj?.definition || '';
          definition = definitionHtml.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
          
          const exampleHtml = definitionObj?.examples?.[0] || '';
          exampleSentence = exampleHtml.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        }
      }
    }

    if (!definition) {
      return { success: false, error: 'Không tìm thấy định nghĩa cho từ/cụm từ này' };
    }

    const isMultiWord = trimmedWord.split(/\s+/).length > 1;
    let partOfSpeech = mapPartOfSpeech(partOfSpeechRaw);
    if (isMultiWord) {
      if (partOfSpeechRaw.toLowerCase().includes('idiom')) {
        partOfSpeech = 'idiom';
      } else if (partOfSpeechRaw.toLowerCase().includes('phrase')) {
        partOfSpeech = 'phrase';
      } else if (partOfSpeech === 'other' || partOfSpeech === 'noun') {
        partOfSpeech = 'phrase';
      }
    }

    const definitionVi = definition ? await translateToVi(definition) : '';
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

export async function updateDeck(deckId: string, data: z.infer<typeof deckSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Bạn phải đăng nhập để cập nhật bộ từ' };
  const userId = session.user.id;

  try {
    const validated = deckSchema.parse(data);
    
    const existing = await db.query.lessons.findFirst({
      where: and(eq(lessons.id, deckId), eq(lessons.userId, userId)),
    });
    if (!existing) return { success: false, error: 'Không tìm thấy bộ từ hoặc bạn không có quyền chỉnh sửa' };

    await db.update(lessons).set({
      title: validated.title,
      description: validated.description || '',
      coverEmoji: validated.coverEmoji,
      updatedAt: new Date(),
    }).where(eq(lessons.id, deckId));

    revalidatePath('/books');
    revalidatePath(`/books/${deckId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Lỗi khi cập nhật bộ từ' };
  }
}

export async function deleteDeck(deckId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Bạn phải đăng nhập để xóa bộ từ' };
  const userId = session.user.id;

  try {
    const existing = await db.query.lessons.findFirst({
      where: and(eq(lessons.id, deckId), eq(lessons.userId, userId)),
    });
    if (!existing) return { success: false, error: 'Không tìm thấy bộ từ hoặc bạn không có quyền xóa' };

    await db.delete(lessons).where(eq(lessons.id, deckId));

    revalidatePath('/books');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Lỗi khi xóa bộ từ' };
  }
}

export async function updateWordInDeck(wordId: string, data: z.infer<typeof wordSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Bạn phải đăng nhập để cập nhật từ vựng' };
  const userId = session.user.id;

  try {
    const validated = wordSchema.parse(data);

    const word = await db.query.words.findFirst({
      where: eq(words.id, wordId),
    });
    if (!word) return { success: false, error: 'Không tìm thấy từ vựng' };

    const deck = await db.query.lessons.findFirst({
      where: and(eq(lessons.id, word.lessonId), eq(lessons.userId, userId)),
    });
    if (!deck) return { success: false, error: 'Bạn không có quyền chỉnh sửa từ vựng này' };

    await db.update(words).set({
      term: validated.term,
      phonetic: validated.phonetic || '',
      partOfSpeech: validated.partOfSpeech,
      definition: validated.definition,
      definitionVi: validated.definitionVi || '',
      exampleSentence: validated.exampleSentence || '',
      exampleSentenceVi: validated.exampleSentenceVi || '',
      updatedAt: new Date(),
    }).where(eq(words.id, wordId));

    revalidatePath(`/books/${word.lessonId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Lỗi khi cập nhật từ vựng' };
  }
}

export async function deleteWordFromDeck(wordId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Bạn phải đăng nhập để xóa từ vựng' };
  const userId = session.user.id;

  try {
    const word = await db.query.words.findFirst({
      where: eq(words.id, wordId),
    });
    if (!word) return { success: false, error: 'Không tìm thấy từ vựng' };

    const deck = await db.query.lessons.findFirst({
      where: and(eq(lessons.id, word.lessonId), eq(lessons.userId, userId)),
    });
    if (!deck) return { success: false, error: 'Bạn không có quyền xóa từ vựng này' };

    await db.delete(words).where(eq(words.id, wordId));

    await db.update(lessons).set({
      wordCount: Math.max(0, deck.wordCount - 1),
      updatedAt: new Date(),
    }).where(eq(lessons.id, word.lessonId));

    revalidatePath(`/books/${word.lessonId}`);
    revalidatePath('/books');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Lỗi khi xóa từ vựng' };
  }
}

