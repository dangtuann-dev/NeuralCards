import { db } from '@/lib/db';
import { words, lessons } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import GamesClient from './GamesClient';

export const metadata = { title: 'Mini-games — NeuralCards' };

interface GameWord {
  id: string;
  term: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  definition: string;
  definitionVi: string | null;
  exampleSentence: string | null;
  exampleSentenceVi: string | null;
  lessonId: string;
}

export default async function GamesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <h1 className="text-2xl font-bold">Vui lòng đăng nhập</h1>
      </div>
    );
  }
  const userId = session.user.id;

  let userWords: GameWord[] = [];
  let userDecks: { id: string; title: string }[] = [];

  try {
    // 1. Fetch user's custom decks
    const decks = await db.query.lessons.findMany({
      where: eq(lessons.userId, userId),
      orderBy: [desc(lessons.createdAt)],
    });
    userDecks = decks.map(d => ({ id: d.id, title: d.title }));

    // 2. Fetch user's custom words
    userWords = (await db
      .select({
        id: words.id,
        term: words.term,
        phonetic: words.phonetic,
        partOfSpeech: words.partOfSpeech,
        definition: words.definition,
        definitionVi: words.definitionVi,
        exampleSentence: words.exampleSentence,
        exampleSentenceVi: words.exampleSentenceVi,
        lessonId: words.lessonId,
      })
      .from(words)
      .innerJoin(lessons, eq(words.lessonId, lessons.id))
      .where(eq(lessons.userId, userId))) as GameWord[];
  } catch (err) {
    console.error('Failed to load user words for games:', err);
  }

  return <GamesClient initialWords={userWords} decks={userDecks} />;
}
