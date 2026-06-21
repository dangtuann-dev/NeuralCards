'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, RefreshCw, BookOpen } from 'lucide-react';
import { submitCardReview } from '@/actions/srs';
import { toast } from 'sonner';
import Link from 'next/link';

interface CardWord {
  id: string;
  term: string;
  phonetic: string | null;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'idiom' | 'collocation' | 'other' | null;
  definition: string;
  definitionVi: string | null;
  exampleSentence: string | null;
  exampleSentenceVi: string | null;
}

interface DueCard {
  progressId: string;
  status: string;
  word: CardWord;
}

interface ReviewClientProps {
  initialCards: DueCard[];
}

const POS_LABELS: Record<string, string> = {
  noun: 'Danh từ',
  verb: 'Động từ',
  adjective: 'Tính từ',
  adverb: 'Trạng từ',
  phrase: 'Cụm từ',
  idiom: 'Thành ngữ',
  collocation: 'Collocation',
  other: 'Khác',
};

export default function ReviewClient({ initialCards }: ReviewClientProps) {
  const [cards] = useState<DueCard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentCard = cards[currentIndex];

  const speakWord = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRate = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard || loading) return;

    setLoading(true);
    try {
      const res = await submitCardReview(
        currentCard.progressId,
        currentCard.word.id,
        rating
      );

      if (res.success) {
        toast.success(`Đã lưu kết quả! +${res.xpEarned} XP 🌟`);
        setIsFlipped(false);
        // Delay moving to the next card to allow flip animation to reset smoothly
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
          setLoading(false);
        }, 150);
      } else {
        toast.error(res.error || 'Lỗi khi lưu kết quả ôn tập');
        setLoading(false);
      }
    } catch {
      toast.error('Không thể kết nối đến máy chủ');
      setLoading(false);
    }
  };

  if (cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="p-8 max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="text-7xl mb-6"
        >
          🎉
        </motion.div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading mb-2">
          Đã xong ôn tập!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
          Tuyệt vời! Bạn không còn thẻ từ nào cần ôn tập trong hôm nay.
        </p>
        <div className="space-y-3 w-full">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            Quay lại Dashboard
          </Link>
          <Link
            href="/books"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all"
          >
            Quản lý Bộ từ <BookOpen className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { word } = currentCard;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8 flex flex-col items-center">
      {/* Progress Bar */}
      <div className="w-full space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Tiến trình ôn tập</span>
          <span>{currentIndex + 1} / {cards.length} thẻ</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card container with flip support */}
      <div className="w-full aspect-[4/3] min-h-[320px] relative perspective-1000">
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="w-full h-full absolute transform-style-3d cursor-pointer select-none"
          onClick={() => !isFlipped && setIsFlipped(true)}
        >
          {/* Card Front */}
          <div className="w-full h-full absolute backface-hidden bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 flex flex-col justify-between shadow-xl">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-850 px-2.5 py-1 rounded-md">
                {word.partOfSpeech ? POS_LABELS[word.partOfSpeech] : 'Từ vựng'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakWord(word.term);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight">
                {word.term}
              </h2>
              {word.phonetic && (
                <p className="text-sm font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                  {word.phonetic}
                </p>
              )}
            </div>

            <div className="text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5 animate-pulse">
              <RefreshCw className="h-3.5 w-3.5" /> Bấm để lật thẻ xem nghĩa
            </div>
          </div>

          {/* Card Back */}
          <div
            className="w-full h-full absolute backface-hidden bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 flex flex-col justify-between shadow-xl rotate-y-180"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-slate-900 dark:text-white">{word.term}</span>
                <button
                  type="button"
                  onClick={() => speakWord(word.term)}
                  className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {word.partOfSpeech ? POS_LABELS[word.partOfSpeech] : 'Từ vựng'}
              </span>
            </div>

            <div className="flex-1 py-4 flex flex-col justify-center space-y-4">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Định nghĩa</span>
                <p className="text-slate-800 dark:text-slate-200 font-semibold text-base">{word.definition}</p>
                {word.definitionVi && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{word.definitionVi}</p>
                )}
              </div>

              {word.exampleSentence && (
                <div className="bg-slate-50 dark:bg-slate-850/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[8px] uppercase font-bold text-slate-400 block tracking-wider">Câu ví dụ</span>
                  <p className="text-slate-700 dark:text-slate-350 italic text-xs">&ldquo;{word.exampleSentence}&rdquo;</p>
                  {word.exampleSentenceVi && (
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{word.exampleSentenceVi}</p>
                  )}
                </div>
              )}
            </div>

            <div className="text-center text-slate-400 text-[10px] font-semibold">
              Đánh giá mức độ nhớ của bạn ở nút phía dưới
            </div>
          </div>
        </motion.div>
      </div>

      {/* Ratings Buttons Footer */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {isFlipped ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full"
            >
              {[
                { rating: 'again', label: 'Quên', desc: 'Học lại', class: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400' },
                { rating: 'hard', label: 'Khó', desc: 'Ôn sớm', class: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400' },
                { rating: 'good', label: 'Tốt', desc: 'Bình thường', class: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-150 dark:bg-indigo-950/20 dark:border-indigo-900/50 dark:text-indigo-400' },
                { rating: 'easy', label: 'Dễ', desc: 'Ôn muộn', class: 'bg-emerald-50 border-emerald-200 text-emerald-755 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400' },
              ].map((btn) => (
                <button
                  key={btn.rating}
                  type="button"
                  disabled={loading}
                  onClick={() => handleRate(btn.rating as 'again' | 'hard' | 'good' | 'easy')}
                  className={`flex flex-col items-center justify-center p-3 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${btn.class}`}
                >
                  <span className="font-extrabold text-sm sm:text-base leading-tight">{btn.label}</span>
                  <span className="text-[9px] font-medium opacity-80 mt-0.5">{btn.desc}</span>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              type="button"
              onClick={() => setIsFlipped(true)}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.99] transition-all cursor-pointer text-center text-sm tracking-wide"
            >
              Lật thẻ xem nghĩa
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
