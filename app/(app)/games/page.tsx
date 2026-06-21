export const metadata = { title: 'Mini-games — NeuralCards' };

const GAMES = [
  { id: 'matching', title: 'Ghép cặp từ', desc: 'Nối từ tiếng Anh với định nghĩa nhanh nhất có thể', emoji: '🔗', color: 'from-violet-500 to-purple-600' },
  { id: 'spelling', title: 'Đánh vần', desc: 'Nghe và đánh vần chính xác từ vựng IELTS', emoji: '🎤', color: 'from-blue-500 to-indigo-600' },
  { id: 'fill_blank', title: 'Điền vào chỗ trống', desc: 'Hoàn thành câu với từ vựng phù hợp', emoji: '✏️', color: 'from-emerald-500 to-teal-600' },
  { id: 'speed', title: 'Speed Round', desc: 'Trả lời đúng càng nhiều từ càng tốt trong 60 giây', emoji: '⚡', color: 'from-amber-500 to-orange-500' },
];

export default function GamesPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading mb-2">
        Mini-games
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Học từ vựng IELTS theo cách thú vị với các trò chơi tương tác.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {GAMES.map((g) => (
          <div
            key={g.id}
            className={`bg-gradient-to-br ${g.color} rounded-2xl p-6 text-white shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all`}
          >
            <div className="text-4xl mb-3">{g.emoji}</div>
            <h2 className="text-xl font-bold mb-1">{g.title}</h2>
            <p className="text-white/80 text-sm">{g.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
