import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db, schema } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import DeckDetailClient from './DeckDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params;
  const deck = await db.query.lessons.findFirst({
    where: eq(schema.lessons.id, deckId),
    columns: { title: true },
  });

  return {
    title: deck ? `${deck.title} — NeuralCards` : 'Chi tiết bộ từ',
  };
}

export default async function DeckDetailPage({ params }: { params: Promise<{ deckId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { deckId } = await params;
  const userId = session.user.id;

  // Query specific deck details, making sure it belongs to the logged-in user
  const deck = await db.query.lessons.findFirst({
    where: and(
      eq(schema.lessons.id, deckId),
      eq(schema.lessons.userId, userId)
    ),
  });

  if (!deck) {
    notFound();
  }

  // Fetch all vocabulary words belonging to this deck
  const cards = await db.query.words.findMany({
    where: eq(schema.words.lessonId, deckId),
    orderBy: [desc(schema.words.createdAt)],
  });

  return <DeckDetailClient deck={deck} initialCards={cards} />;
}
