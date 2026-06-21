export const metadata = { title: 'Cài đặt — NeuralCards' };

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading mb-2">
        Cài đặt
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Quản lý hồ sơ và tùy chỉnh trải nghiệm học tập của bạn.
      </p>
      <div className="space-y-4">
        {['Thông tin cá nhân', 'Mục tiêu học tập', 'Thông báo', 'Bảo mật & Mật khẩu', 'Giao diện'].map((section) => (
          <div
            key={section}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
          >
            <span className="font-semibold text-slate-800 dark:text-slate-200">{section}</span>
            <span className="text-slate-400">→</span>
          </div>
        ))}
      </div>
    </div>
  );
}
