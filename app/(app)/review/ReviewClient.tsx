'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, RefreshCw, Loader2 } from 'lucide-react';
import { submitCardReview, getCramCards, submitCramAnswer } from '@/actions/srs';
import { toast } from 'sonner';
import Link from 'next/link';

interface CardWord {
  id: string; term: string; phonetic: string | null;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'idiom' | 'collocation' | 'other' | null;
  definition: string; definitionVi: string | null;
  exampleSentence: string | null; exampleSentenceVi: string | null;
}
interface DueCard { progressId: string; status: string; word: CardWord; }
interface ReviewClientProps { initialCards: DueCard[]; decks: { id: string; title: string }[]; }

const POS_LABELS: Record<string, string> = {
  noun: 'Danh từ', verb: 'Động từ', adjective: 'Tính từ', adverb: 'Trạng từ',
  phrase: 'Cụm từ', idiom: 'Thành ngữ', collocation: 'Collocation', other: 'Khác',
};

export default function ReviewClient({ initialCards, decks }: ReviewClientProps) {
  const [cards, setCards] = useState<DueCard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'srs' | 'cram'>(initialCards.length > 0 ? 'srs' : 'cram');
  const [selectedDeckId, setSelectedDeckId] = useState('all');
  const [cramLoading, setCramLoading] = useState(false);
  const currentCard = cards[currentIndex];

  const speakWord = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    }
  };

  const startCramMode = async (deckId = 'all') => {
    setCramLoading(true); setSelectedDeckId(deckId);
    try {
      const res = await getCramCards(deckId);
      if (res.success && res.cards) {
        if (res.cards.length === 0) toast.error('Bộ từ vựng này chưa có thẻ từ nào!');
        else { setCards(res.cards); setCurrentIndex(0); setIsFlipped(false); setMode('cram'); toast.success(`Đã tải ${res.cards.length} thẻ! 🚀`); }
      } else toast.error(res.error || 'Lỗi khi tải từ vựng');
    } catch { toast.error('Lỗi kết nối'); } finally { setCramLoading(false); }
  };

  const handleRate = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard || loading) return;
    setLoading(true);
    try {
      const res = mode === 'cram'
        ? await submitCramAnswer(currentCard.word.id, rating)
        : await submitCardReview(currentCard.progressId, currentCard.word.id, rating);
      if (res.success) {
        toast.success(`+${res.xpEarned} XP 🌟`);
        setIsFlipped(false);
        setTimeout(() => { setCurrentIndex((p) => p + 1); setLoading(false); }, 150);
      } else { toast.error(res.error || 'Lỗi khi lưu kết quả'); setLoading(false); }
    } catch { toast.error('Không thể kết nối đến máy chủ'); setLoading(false); }
  };

  const inputCls = "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white text-slate-900 dark:text-white transition-all text-sm cursor-pointer";
  const btnPrimaryCls = "flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer border-0";

  if (cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="p-8 max-w-md mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.6 }} className="text-7xl mb-6">
          {mode === 'cram' ? '📚' : '🎉'}
        </motion.div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading mb-2">
          {mode === 'cram' ? 'Đã xong ôn tập tự do!' : 'Đã xong ôn tập hôm nay!'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
          {mode === 'cram' ? 'Bạn đã ôn tập xong danh sách từ tự do đã chọn.' : 'Tuyệt vời! Không còn thẻ từ nào cần ôn tập bắt buộc hôm nay.'}
        </p>
        <div className="w-full bg-slate-50 dark:bg-slate-900/65 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-6 space-y-4 text-left shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">Luyện tập tự do & Không giới hạn 🚀</h3>
            <p className="text-xs text-slate-500 mt-1 leading-normal">Ôn đi ôn lại toàn bộ từ vựng mà không ảnh hưởng đến tiến trình SRS.</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Chọn bộ từ vựng</label>
            <select value={selectedDeckId} onChange={(e) => setSelectedDeckId(e.target.value)} className={inputCls}>
              <option value="all">Tất cả từ vựng ({decks.length} bộ)</option>
              {decks.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>
          <button type="button" disabled={cramLoading} onClick={() => startCramMode(selectedDeckId)} className={btnPrimaryCls}>
            {cramLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Đang chuẩn bị...</> : 'Bắt đầu luyện tập tự do'}
          </button>
        </div>
        <div className="space-y-3 w-full border-t border-slate-100 dark:border-slate-800/80 pt-6">
          <Link href="/dashboard" className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all border-0">
            Quay lại Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { word } = currentCard;
  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6 flex flex-col items-center">
      <div className="w-full flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${mode === 'cram' ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' : 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'}`}>
          {mode === 'cram' ? '🚀 Luyện tập tự do' : '🧠 Ôn tập hàng ngày (SRS)'}
        </span>
        {mode === 'cram' && initialCards.length > 0 && (
          <button type="button" onClick={() => { setMode('srs'); setCards(initialCards); setCurrentIndex(0); setIsFlipped(false); toast.info('Đã quay lại SRS.'); }} className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer bg-transparent border-0 transition-colors">
            Quay lại SRS
          </button>
        )}
      </div>

      <div className="w-full space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Tiến trình ôn tập</span><span>{currentIndex + 1} / {cards.length} thẻ</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div className="bg-slate-900 dark:bg-white h-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
        </div>
      </div>

      <div className="w-full aspect-[4/3] min-h-[320px] relative perspective-1000">
        <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.4, ease: 'easeInOut' }} className="w-full h-full absolute transform-style-3d cursor-pointer select-none" onClick={() => !isFlipped && setIsFlipped(true)}>
          {/* Front */}
          <div className="w-full h-full absolute backface-hidden bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 flex flex-col justify-between shadow-xl">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-md">{word.partOfSpeech ? POS_LABELS[word.partOfSpeech] : 'Từ vựng'}</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); speakWord(word.term); }} className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border-0 bg-transparent"><Volume2 className="h-5 w-5" /></button>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight">{word.term}</h2>
              {word.phonetic && <p className="text-sm font-mono text-slate-500 dark:text-slate-400 font-semibold">{word.phonetic}</p>}
            </div>
            <div className="text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5 animate-pulse"><RefreshCw className="h-3.5 w-3.5" /> Bấm để lật thẻ xem nghĩa</div>
          </div>
          {/* Back */}
          <div className="w-full h-full absolute backface-hidden bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 flex flex-col justify-between shadow-xl rotate-y-180" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-slate-900 dark:text-white">{word.term}</span>
                <button type="button" onClick={() => speakWord(word.term)} className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-0 bg-transparent"><Volume2 className="h-4 w-4" /></button>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{word.partOfSpeech ? POS_LABELS[word.partOfSpeech] : 'Từ vựng'}</span>
            </div>
            <div className="flex-1 py-4 flex flex-col justify-center space-y-4">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Định nghĩa</span>
                <p className="text-slate-800 dark:text-slate-200 font-semibold text-base">{word.definition}</p>
                {word.definitionVi && <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{word.definitionVi}</p>}
              </div>
              {word.exampleSentence && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[8px] uppercase font-bold text-slate-400 block tracking-wider">Câu ví dụ</span>
                  <p className="text-slate-700 dark:text-slate-300 italic text-xs">&ldquo;{word.exampleSentence}&rdquo;</p>
                  {word.exampleSentenceVi && <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{word.exampleSentenceVi}</p>}
                </div>
              )}
            </div>
            <div className="text-center text-slate-400 text-[10px] font-semibold">Đánh giá mức độ nhớ của bạn ở nút phía dưới</div>
          </div>
        </motion.div>
      </div>

      <div className="w-full">
        <AnimatePresence mode="wait">
          {isFlipped ? (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full">
              {[
                { rating: 'again', label: 'Quên', desc: 'Học lại',   cls: 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400' },
                { rating: 'hard',  label: 'Khó',  desc: 'Ôn sớm',   cls: 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300' },
                { rating: 'good',  label: 'Tốt',  desc: 'Bình thường', cls: 'bg-slate-700 border-slate-700 text-white hover:bg-slate-600 dark:bg-slate-300 dark:border-slate-300 dark:text-slate-900' },
                { rating: 'easy',  label: 'Dễ',   desc: 'Ôn muộn',  cls: 'bg-slate-900 border-slate-900 text-white hover:bg-black dark:bg-white dark:border-white dark:text-slate-900' },
              ].map((btn) => (
                <button key={btn.rating} type="button" disabled={loading} onClick={() => handleRate(btn.rating as 'again' | 'hard' | 'good' | 'easy')} className={`flex flex-col items-center justify-center p-3 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${btn.cls}`}>
                  <span className="font-extrabold text-sm sm:text-base leading-tight">{btn.label}</span>
                  <span className="text-[9px] font-medium opacity-70 mt-0.5">{btn.desc}</span>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} type="button" onClick={() => setIsFlipped(true)} className="w-full py-3.5 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl shadow-lg active:scale-[0.99] transition-all cursor-pointer text-center text-sm tracking-wide border-0">
              Lật thẻ xem nghĩa
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
