import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import BooksClient from './BooksClient';

export const metadata = {
  title: 'Bộ từ vựng của tôi — NeuralCards',
  description: 'Tạo và quản lý các bộ từ vựng IELTS cá nhân của bạn.',
};

export default async function BooksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;

  // Query all custom decks owned by the user
  const decks = await db.query.lessons.findMany({
    where: eq(schema.lessons.userId, userId),
    orderBy: [desc(schema.lessons.createdAt)],
  });

  return <BooksClient decks={decks} />;
}
