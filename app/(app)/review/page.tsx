import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDueCards } from '@/actions/srs';
import ReviewClient from './ReviewClient';

export const metadata = {
  title: 'Ôn tập SRS — NeuralCards',
  description: 'Ôn tập từ vựng IELTS của bạn bằng thuật toán lặp lại ngắt quãng SM-2.',
};

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { cards } = await getDueCards();

  return <ReviewClient initialCards={cards} />;
}
