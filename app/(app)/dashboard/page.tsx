import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Dashboard — NeuralCards',
  description: 'Tổng quan tiến độ học từ vựng IELTS của bạn.',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <DashboardClient user={session.user} />;
}
