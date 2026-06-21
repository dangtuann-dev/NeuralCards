export const metadata = { title: 'Bảng xếp hạng — NeuralCards' };

const LEADERS = [
  { rank: 1, name: 'Nguyễn Minh Khoa', xp: 8420, streak: 45, avatar: '🏆' },
  { rank: 2, name: 'Trần Thị Lan', xp: 7310, streak: 32, avatar: '🥈' },
  { rank: 3, name: 'Lê Văn Hùng', xp: 6890, streak: 28, avatar: '🥉' },
  { rank: 4, name: 'Phạm Thu Hà', xp: 5740, streak: 21, avatar: '👤' },
  { rank: 5, name: 'Hoàng Anh Tuấn', xp: 4920, streak: 15, avatar: '👤' },
];

export default function LeaderboardPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading mb-2">
        Bảng xếp hạng
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Top học viên tích lũy nhiều XP nhất tháng này
      </p>
      <div className="space-y-3">
        {LEADERS.map((l) => (
          <div
            key={l.rank}
            className={`flex items-center gap-4 p-4 rounded-2xl border ${l.rank <= 3 ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
          >
            <span className="text-2xl w-8 text-center">{l.avatar}</span>
            <div className="flex-1">
              <p className="font-bold text-slate-900 dark:text-white">{l.name}</p>
              <p className="text-xs text-slate-500">🔥 {l.streak} ngày streak</p>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-indigo-600 dark:text-indigo-400">{l.xp.toLocaleString()} XP</p>
              <p className="text-xs text-slate-400">Hạng #{l.rank}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
