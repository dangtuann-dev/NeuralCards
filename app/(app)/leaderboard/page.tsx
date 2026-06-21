import { db } from '@/lib/db';
import { profiles, users } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { Flame } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export const metadata = { title: 'Bảng xếp hạng — NeuralCards' };

async function seedMockLeaders() {
  try {
    const countRes = await db.select({ count: sql<number>`count(*)` }).from(profiles);
    const count = Number(countRes[0]?.count || 0);
    
    if (count < 5) {
      const mockUsers = [
        { email: 'khoa.nguyen@neuralcards.io', name: 'Nguyễn Minh Khoa', xp: 8420, streak: 45 },
        { email: 'lan.tran@neuralcards.io', name: 'Trần Thị Lan', xp: 7310, streak: 32 },
        { email: 'hung.le@neuralcards.io', name: 'Lê Văn Hùng', xp: 6890, streak: 28 },
        { email: 'ha.pham@neuralcards.io', name: 'Phạm Thu Hà', xp: 5740, streak: 21 },
      ];

      for (const mu of mockUsers) {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, mu.email)
        });
        if (!existingUser) {
          const [newUser] = await db.insert(users).values({
            email: mu.email,
            name: mu.name,
          }).returning();

          await db.insert(profiles).values({
            id: newUser.id,
            streakDays: mu.streak,
            longestStreak: mu.streak,
            totalXp: mu.xp,
            onboardingCompleted: true,
          });
        }
      }
    }
  } catch (err) {
    console.error('Seeding mock leaders failed:', err);
  }
}

export default async function LeaderboardPage() {
  await seedMockLeaders();

  const session = await auth();
  const currentUserId = session?.user?.id;

  const leaders = await db
    .select({
      id: users.id,
      name: users.name,
      xp: profiles.totalXp,
      streak: profiles.streakDays,
      image: users.image,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.id, users.id))
    .orderBy(desc(profiles.totalXp))
    .limit(10);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading mb-2">
        Bảng xếp hạng
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Top học viên tích lũy nhiều XP nhất tháng này
      </p>
      <div className="space-y-3">
        {leaders.map((l, index) => {
          const rank = index + 1;
          const isCurrentUser = currentUserId === l.id;
          return (
            <div
              key={l.id}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                isCurrentUser
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-md ring-2 ring-indigo-500/20'
                  : rank <= 3
                  ? 'border-indigo-100 bg-indigo-50/20 dark:border-indigo-900/20 dark:bg-indigo-950/10'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <span className={`text-xl font-bold w-10 text-center ${rank <= 3 ? '' : 'text-slate-400 text-sm'}`}>
                {getRankBadge(rank)}
              </span>

              <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-800">
                <AvatarImage src={l.image || undefined} />
                <AvatarFallback className="bg-indigo-600 text-white font-bold text-sm">
                  {(l.name || 'NC').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {l.name || 'Học viên ẩn danh'}
                  {isCurrentUser && (
                    <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider scale-90">
                      Bạn
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
                  {l.streak} ngày streak
                </p>
              </div>

              <div className="text-right">
                <p className="font-extrabold text-indigo-650 dark:text-indigo-400">
                  {l.xp.toLocaleString()} XP
                </p>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Hạng #{rank}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
