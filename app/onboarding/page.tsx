'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { completeOnboarding } from '@/actions/profile';
import { Loader2, ArrowRight, ArrowLeft, Check, BookOpen, Clock, Zap, BookMarked, Sparkles } from 'lucide-react';

const CAMBRIDGE_BOOKS = [
  { id: 11, number: '11', title: 'Cambridge IELTS 11', color: 'from-blue-600 to-indigo-700', bg: 'bg-blue-600' },
  { id: 12, number: '12', title: 'Cambridge IELTS 12', color: 'from-indigo-600 to-purple-700', bg: 'bg-indigo-600' },
  { id: 13, number: '13', title: 'Cambridge IELTS 13', color: 'from-purple-600 to-pink-700', bg: 'bg-purple-600' },
  { id: 14, number: '14', title: 'Cambridge IELTS 14', color: 'from-pink-600 to-rose-700', bg: 'bg-pink-600' },
  { id: 15, number: '15', title: 'Cambridge IELTS 15', color: 'from-rose-600 to-red-700', bg: 'bg-rose-600' },
  { id: 16, number: '16', title: 'Cambridge IELTS 16', color: 'from-red-600 to-orange-700', bg: 'bg-red-600' },
  { id: 17, number: '17', title: 'Cambridge IELTS 17', color: 'from-orange-600 to-amber-700', bg: 'bg-orange-600' },
  { id: 18, number: '18', title: 'Cambridge IELTS 18', color: 'from-amber-600 to-yellow-600', bg: 'bg-amber-600' },
  { id: 19, number: '19', title: 'Cambridge IELTS 19', color: 'from-emerald-600 to-teal-700', bg: 'bg-emerald-600' },
  { id: 20, number: '20', title: 'Cambridge IELTS 20', color: 'from-teal-600 to-cyan-700', bg: 'bg-teal-600' },
];

const DAILY_GOALS = [
  { value: 5, label: 'Casual 🧘', desc: '5 từ / ngày', time: '5 phút / ngày' },
  { value: 10, label: 'Steady 📚', desc: '10 từ / ngày', time: '10 phút / ngày' },
  { value: 20, label: 'Committed 🎯', desc: '20 từ / ngày', time: '18 phút / ngày' },
  { value: 30, label: 'Intensive ⚡', desc: '30 từ / ngày', time: '25 phút / ngày' },
  { value: 50, label: 'IELTS Beast Mode 🔥', desc: '50 từ / ngày', time: '40 phút / ngày' },
];

const STUDY_PREFERENCES = [
  {
    id: 'flashcard_first',
    title: 'Thẻ từ trước, kiểm tra sau',
    desc: 'Học lý thuyết qua Flashcards 3D, sau đó ôn luyện bằng Quiz để củng cố phản xạ.',
    icon: '🃏',
    recommended: true,
  },
  {
    id: 'games_first',
    title: 'Học trực tiếp qua Game',
    desc: 'Lao vào các thử thách ghép nối, điền từ, đánh vần. Học qua trải nghiệm tương tác.',
    icon: '🎮',
  },
  {
    id: 'mixed',
    title: 'Trải nghiệm hỗn hợp',
    desc: 'Hệ thống tự động trộn lẫn flashcards, điền từ và trò chơi để duy trì sự thú vị.',
    icon: '🔮',
  },
];

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [selectedBooks, setSelectedBooks] = useState<number[]>([18, 19, 20]);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [studyPreference, setStudyPreference] = useState('flashcard_first');

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      toast.error('Vui lòng nhập tên của bạn');
      return;
    }
    if (step === 2 && selectedBooks.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 cuốn sách để học');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleToggleBook = (id: number) => {
    setSelectedBooks((prev) =>
      prev.includes(id) ? prev.filter((bookId) => bookId !== id) : [...prev, id]
    );
  };

  const handleSelectAllBooks = () => {
    setSelectedBooks(CAMBRIDGE_BOOKS.map((b) => b.id));
  };

  const handleClearBooks = () => {
    setSelectedBooks([]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await completeOnboarding({
        dailyGoal,
        studyPreference,
        preferredLanguage: 'vi',
      });

      if (response.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#6366F1', '#10B981', '#F59E0B'],
        });

        toast.success('Thiết lập hồ sơ thành công! Chào mừng bạn 🎉');

        // Update auth session client side so session.user.onboardingCompleted becomes true
        await update({
          ...session,
          user: {
            ...session?.user,
            onboardingCompleted: true,
          },
        });

        // Let the state update sink in and redirect
        setTimeout(() => {
          router.refresh();
          router.push('/dashboard');
        }, 1500);
      } else {
        toast.error(response.error || 'Thiết lập thất bại. Vui lòng thử lại!');
        setLoading(false);
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi hệ thống.');
      setLoading(false);
    }
  };

  const stepProgressPercent = (step / 4) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      {/* Container */}
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col min-h-[580px]">
        {/* Step Progress Header */}
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 relative">
          <motion.div
            initial={{ width: '25%' }}
            animate={{ width: `${stepProgressPercent}%` }}
            className="absolute left-0 top-0 h-full bg-indigo-600 rounded-r-full"
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content Wrapper */}
        <div className="flex-grow p-8 md:p-12 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8 flex flex-col items-center text-center my-auto"
              >
                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-950 rounded-full flex items-center justify-center text-4xl shadow-inner animate-bounce">
                  🧠
                </div>
                <div className="space-y-3">
                  <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading">
                    Chào mừng bạn đến với NeuralCards!
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Học từ vựng IELTS đột phá bằng hệ thống thẻ thông minh tích hợp trí tuệ nhân tạo. Bạn muốn chúng tôi gọi bạn là gì?
                  </p>
                </div>

                <div className="w-full max-w-sm space-y-1 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Tên hiển thị của bạn
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập tên hiển thị..."
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-sans transition-all text-center text-lg font-semibold"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading">
                    Bạn đang ôn luyện cuốn sách nào?
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Chọn các bộ đề Cambridge IELTS bạn có hoặc muốn tập trung ghi nhớ từ vựng (Chọn ít nhất 1)
                  </p>
                </div>

                {/* Selection Controls */}
                <div className="flex justify-end gap-3 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAllBooks}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold dark:text-indigo-400"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearBooks}
                    className="text-slate-500 hover:text-slate-600 font-semibold"
                  >
                    Bỏ chọn
                  </button>
                </div>

                {/* Books Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {CAMBRIDGE_BOOKS.map((book) => {
                    const isSelected = selectedBooks.includes(book.id);
                    return (
                      <motion.button
                        key={book.id}
                        type="button"
                        onClick={() => handleToggleBook(book.id)}
                        whileTap={{ scale: 0.95 }}
                        className={`relative aspect-[3/4] rounded-2xl p-4 overflow-hidden flex flex-col justify-between text-left shadow-md transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-4 ring-indigo-500 shadow-indigo-500/20'
                            : 'border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* Book Spine Color Cover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${book.color} opacity-90`} />

                        {/* Content Overlay */}
                        <div className="relative z-10 h-full flex flex-col justify-between text-white">
                          <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                            IELTS
                          </span>
                          <span className="text-4xl font-extrabold font-heading text-white/95">
                            {book.number}
                          </span>
                        </div>

                        {/* Checkbox Indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 z-20 w-6 h-6 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50">
                            <Check className="h-4 w-4 stroke-[3px]" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8 my-auto"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading">
                    Mục tiêu học tập hàng ngày của bạn?
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Thiết lập mục tiêu vừa sức để duy trì thói quen học từ vựng đều đặn mỗi ngày.
                  </p>
                </div>

                {/* Big Indicator Card */}
                {(() => {
                  const currentGoalObj = DAILY_GOALS.find((g) => g.value === dailyGoal) || DAILY_GOALS[1];
                  return (
                    <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/50 rounded-2xl p-6 text-center space-y-3">
                      <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400">
                        {currentGoalObj.label}
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 text-sm flex justify-center gap-6">
                        <span className="flex items-center gap-1.5 font-medium">
                          <BookOpen className="h-4 w-4 text-indigo-500" />
                          {currentGoalObj.desc}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="h-4 w-4 text-indigo-500" />
                          Ước tính: {currentGoalObj.time}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Grid goals select */}
                <div className="grid grid-cols-5 gap-3">
                  {DAILY_GOALS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setDailyGoal(g.value)}
                      className={`py-4 rounded-xl border flex flex-col items-center justify-center gap-1 font-semibold transition-all cursor-pointer ${
                        dailyGoal === g.value
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-200'
                      }`}
                    >
                      <span className="text-lg">{g.value}</span>
                      <span className="text-[10px] uppercase opacity-75">Từ/Ngày</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading">
                    Bạn muốn học từ vựng như thế nào?
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Lựa chọn phương thức tiếp cận yêu thích của bạn. Bạn có thể thay đổi trong cài đặt bất cứ lúc nào.
                  </p>
                </div>

                {/* Preference Cards */}
                <div className="space-y-4">
                  {STUDY_PREFERENCES.map((pref) => {
                    const isSelected = studyPreference === pref.id;
                    return (
                      <button
                        key={pref.id}
                        type="button"
                        onClick={() => setStudyPreference(pref.id)}
                        className={`w-full flex items-start gap-4 p-5 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 ring-2 ring-indigo-500'
                            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-200'
                        }`}
                      >
                        <span className="text-3xl p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                          {pref.icon}
                        </span>
                        <div className="space-y-1 pr-8">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {pref.title}
                            {pref.recommended && (
                              <span className="text-[10px] uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                                Khuyên dùng
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {pref.desc}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                            <Check className="h-4 w-4 stroke-[3px]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6 mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Quay lại
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold cursor-pointer transition-colors shadow-md shadow-indigo-600/10"
              >
                Tiếp tục
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold cursor-pointer transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang thiết lập...
                  </>
                ) : (
                  <>
                    Hoàn tất thiết lập
                    <Sparkles className="h-5 w-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
