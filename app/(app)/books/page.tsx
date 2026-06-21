export const metadata = { title: 'Cambridge IELTS — NeuralCards' };

export default function BooksPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading mb-2">
        Cambridge IELTS Library
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Chọn bộ sách Cambridge IELTS 11–20 để bắt đầu học từ vựng theo bài.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {Array.from({ length: 10 }, (_, i) => i + 11).map((num) => (
          <div
            key={num}
            className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex flex-col justify-between p-4 text-white shadow-md cursor-pointer hover:shadow-xl hover:scale-105 transition-all"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">IELTS</span>
            <span className="text-4xl font-extrabold">{num}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
