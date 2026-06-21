export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full gap-6">
      <div className="spinner">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
        Đang tải dữ liệu...
      </p>
    </div>
  );
}
