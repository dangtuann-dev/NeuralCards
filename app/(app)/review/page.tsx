export const metadata = { title: 'Ôn tập SRS — NeuralCards' };

export default function ReviewPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-6">🃏</div>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading mb-2">
        Ôn tập Flashcard (SRS)
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Thuật toán SM-2 sẽ hiển thị các từ cần ôn tập hôm nay. Bắt đầu học và đánh giá độ nhớ của bạn.
      </p>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 w-full max-w-sm shadow-xl">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Adjective</div>
        <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">ubiquitous</div>
        <div className="text-slate-500 text-sm">Nhấn để xem định nghĩa →</div>
      </div>
    </div>
  );
}
