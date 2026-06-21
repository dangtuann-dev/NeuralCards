export default function GlobalLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-slate-50 dark:bg-slate-950 gap-6">
      <div className="spinner">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
        Đang khởi động ứng dụng...
      </p>
    </div>
  );
}
