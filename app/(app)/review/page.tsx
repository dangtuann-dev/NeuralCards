import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDueCards } from '@/actions/srs';
import ReviewClient from './ReviewClient';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

export const metadata = {
  title: 'Ôn tập SRS — NeuralCards',
  description: 'Ôn tập từ vựng IELTS của bạn bằng thuật toán lặp lại ngắt quãng SM-2.',
};

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const { cards } = await getDueCards();

  const decks = await db.query.lessons.findMany({
    where: eq(schema.lessons.userId, userId),
    orderBy: [desc(schema.lessons.createdAt)],
  });

  return (
    <ReviewClient
      initialCards={cards}
      decks={decks.map((d) => ({ id: d.id, title: d.title }))}
    />
  );
}
