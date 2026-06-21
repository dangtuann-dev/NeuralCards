'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, X, Loader2, BookOpen, Volume2, Sparkles } from 'lucide-react';
import { addWordToDeck } from '@/actions/books';
import { toast } from 'sonner';

interface Deck {
  id: string;
  title: string;
  description: string | null;
  coverEmoji: string | null;
  wordCount: number;
}

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

interface DeckDetailClientProps {
  deck: Deck;
  initialCards: CardWord[];
}

const POS_MAP: Record<string, { label: string; color: string }> = {
  noun: { label: 'Danh từ', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50' },
  verb: { label: 'Động từ', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50' },
  adjective: { label: 'Tính từ', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50' },
  adverb: { label: 'Trạng từ', color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900/50' },
  phrase: { label: 'Cụm từ', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/50' },
  idiom: { label: 'Thành ngữ', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50' },
  collocation: { label: 'Collocation', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50' },
  other: { label: 'Khác', color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800' },
};

export default function DeckDetailClient({ deck, initialCards }: DeckDetailClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState<CardWord['partOfSpeech']>('noun');
  const [definition, setDefinition] = useState('');
  const [definitionVi, setDefinitionVi] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [exampleSentenceVi, setExampleSentenceVi] = useState('');
  const [loading, setLoading] = useState(false);

  // Simple Web Speech API integration to pronounce words
  const speakWord = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) {
      toast.error('Vui lòng điền đầy đủ Từ vựng và Định nghĩa!');
      return;
    }

    setLoading(true);
    try {
      const res = await addWordToDeck({
        lessonId: deck.id,
        term: term.trim(),
        phonetic: phonetic.trim(),
        partOfSpeech: partOfSpeech || 'noun',
        definition: definition.trim(),
        definitionVi: definitionVi.trim(),
        exampleSentence: exampleSentence.trim(),
        exampleSentenceVi: exampleSentenceVi.trim(),
      });

      if (res.success) {
        toast.success('Thêm từ vựng mới thành công! 🃏');
        setTerm('');
        setPhonetic('');
        setPartOfSpeech('noun');
        setDefinition('');
        setDefinitionVi('');
        setExampleSentence('');
        setExampleSentenceVi('');
        setModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Có lỗi xảy ra khi thêm từ');
      }
    } catch {
      toast.error('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* ── Navigation back ── */}
      <button
        type="button"
        onClick={() => router.push('/books')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-0"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại Bộ từ vựng
      </button>

      {/* ── Deck Header ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start sm:items-center gap-4">
          <div className="text-5xl p-3 bg-slate-50 dark:bg-slate-850/50 rounded-2xl shrink-0">
            {deck.coverEmoji || '📚'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-heading">
              {deck.title}
            </h1>
            <p className="text-slate-550 dark:text-slate-400 mt-1 text-sm">
              {deck.description || 'Không có mô tả cho bộ từ này.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-full">
                <BookOpen className="h-3.5 w-3.5" />
                {initialCards.length} thẻ từ vựng
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer md:w-auto w-full"
        >
          <Plus className="h-5 w-5" />
          Thêm từ mới
        </button>
      </div>

      {/* ── Words Cards List ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
          Danh sách thẻ từ vựng <Sparkles className="h-4 w-4 text-indigo-500" />
        </h2>

        {initialCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center max-w-md mx-auto">
            <div className="text-5xl mb-3">🃏✨</div>
            <h3 className="text-md font-bold text-slate-900 dark:text-white">Bộ từ này đang trống</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hãy bấm nút &ldquo;Thêm từ mới&rdquo; ở phía trên để tạo thẻ ghi nhớ đầu tiên của bạn!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initialCards.map((card) => {
              const pos = card.partOfSpeech ? POS_MAP[card.partOfSpeech] : null;
              return (
                <div
                  key={card.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                          {card.term}
                        </h3>
                        <button
                          type="button"
                          onClick={() => speakWord(card.term)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer bg-transparent border-0"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                      {card.phonetic && (
                        <p className="text-xs text-indigo-650 dark:text-indigo-400 font-mono mt-0.5">
                          {card.phonetic}
                        </p>
                      )}
                    </div>
                    {pos && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${pos.color}`}>
                        {pos.label}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm border-t border-slate-100 dark:border-slate-850 pt-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Định nghĩa</span>
                      <p className="text-slate-850 dark:text-slate-200 font-medium">{card.definition}</p>
                      {card.definitionVi && (
                        <p className="text-slate-500 dark:text-slate-450 mt-0.5 text-xs">{card.definitionVi}</p>
                      )}
                    </div>

                    {card.exampleSentence && (
                      <div className="bg-slate-50 dark:bg-slate-850/50 p-3 rounded-xl mt-2">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Ví dụ</span>
                        <p className="text-slate-700 dark:text-slate-350 italic font-sans">&ldquo;{card.exampleSentence}&rdquo;</p>
                        {card.exampleSentenceVi && (
                          <p className="text-slate-500 dark:text-slate-450 mt-0.5 text-xs">{card.exampleSentenceVi}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Word Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative z-10 my-8"
            >
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                Thêm từ vựng mới 🃏
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tạo thẻ từ ghi nhớ, hệ thống sẽ tự động xếp vào hàng đợi học tập hàng ngày.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Term */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Từ vựng (Tiếng Anh) *
                    </label>
                    <input
                      type="text"
                      required
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      placeholder="Ví dụ: meticulous"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white transition-all text-sm"
                    />
                  </div>

                  {/* Phonetic */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Phiên âm (IPA)
                    </label>
                    <input
                      type="text"
                      value={phonetic}
                      onChange={(e) => setPhonetic(e.target.value)}
                      placeholder="Ví dụ: /məˈtɪkyələs/"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Part of Speech */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Từ loại
                  </label>
                  <select
                    value={partOfSpeech || 'noun'}
                    onChange={(e) => setPartOfSpeech(e.target.value as CardWord['partOfSpeech'])}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white transition-all text-sm cursor-pointer"
                  >
                    <option value="noun">Danh từ (Noun)</option>
                    <option value="verb">Động từ (Verb)</option>
                    <option value="adjective">Tính từ (Adjective)</option>
                    <option value="adverb">Trạng từ (Adverb)</option>
                    <option value="phrase">Cụm từ (Phrase)</option>
                    <option value="idiom">Thành ngữ (Idiom)</option>
                    <option value="collocation">Collocation</option>
                    <option value="other">Khác (Other)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Definition */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Định nghĩa (Tiếng Anh) *
                    </label>
                    <textarea
                      required
                      value={definition}
                      onChange={(e) => setDefinition(e.target.value)}
                      placeholder="Ví dụ: very careful and precise"
                      rows={2}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white transition-all text-sm resize-none"
                    />
                  </div>

                  {/* Definition Vi */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Giải nghĩa (Tiếng Việt)
                    </label>
                    <textarea
                      value={definitionVi}
                      onChange={(e) => setDefinitionVi(e.target.value)}
                      placeholder="Ví dụ: tỉ mỉ, kỹ càng"
                      rows={2}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white transition-all text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Example */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Ví dụ đặt câu (Tiếng Anh)
                    </label>
                    <textarea
                      value={exampleSentence}
                      onChange={(e) => setExampleSentence(e.target.value)}
                      placeholder="Ví dụ: He was meticulous in his preparation."
                      rows={2}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white transition-all text-sm resize-none"
                    />
                  </div>

                  {/* Example Vi */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Dịch câu ví dụ (Tiếng Việt)
                    </label>
                    <textarea
                      value={exampleSentenceVi}
                      onChange={(e) => setExampleSentenceVi(e.target.value)}
                      placeholder="Ví dụ: Anh ấy đã chuẩn bị rất tỉ mỉ."
                      rows={2}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white transition-all text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 mt-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Thêm từ vựng'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
