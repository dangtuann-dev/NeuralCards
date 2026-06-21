'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, X, Loader2, BookOpen, Volume2, Sparkles, Edit2, Trash2 } from 'lucide-react';
import { addWordToDeck, lookupWord, updateWordInDeck, deleteWordFromDeck } from '@/actions/books';
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
  noun:        { label: 'Danh từ',    color: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  verb:        { label: 'Động từ',    color: 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600' },
  adjective:   { label: 'Tính từ',   color: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  adverb:      { label: 'Trạng từ',  color: 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600' },
  phrase:      { label: 'Cụm từ',    color: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  idiom:       { label: 'Thành ngữ', color: 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white' },
  collocation: { label: 'Collocation', color: 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600' },
  other:       { label: 'Khác',       color: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800' },
};

export default function DeckDetailClient({ deck, initialCards }: DeckDetailClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<CardWord | null>(null);

  const [term, setTerm] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState<CardWord['partOfSpeech']>('noun');
  const [definition, setDefinition] = useState('');
  const [definitionVi, setDefinitionVi] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [exampleSentenceVi, setExampleSentenceVi] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const speakWord = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingWord(null);
    setTerm(''); setPhonetic(''); setPartOfSpeech('noun');
    setDefinition(''); setDefinitionVi('');
    setExampleSentence(''); setExampleSentenceVi('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (word: CardWord) => {
    setEditingWord(word);
    setTerm(word.term);
    setPhonetic(word.phonetic || '');
    setPartOfSpeech(word.partOfSpeech || 'noun');
    setDefinition(word.definition);
    setDefinitionVi(word.definitionVi || '');
    setExampleSentence(word.exampleSentence || '');
    setExampleSentenceVi(word.exampleSentenceVi || '');
    setModalOpen(true);
  };

  const handleDeleteWord = async (wordId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa từ vựng này không?')) {
      const toastId = toast.loading('Đang xóa từ vựng...');
      try {
        const res = await deleteWordFromDeck(wordId);
        if (res.success) {
          toast.success('Xóa từ vựng thành công!', { id: toastId });
          router.refresh();
        } else {
          toast.error(res.error || 'Lỗi khi xóa từ vựng', { id: toastId });
        }
      } catch {
        toast.error('Lỗi kết nối khi xóa từ vựng', { id: toastId });
      }
    }
  };

  const handleAutoFill = async () => {
    if (!term.trim()) return;
    setIsAutoFilling(true);
    const toastId = toast.loading('Đang tự động dịch và tra cứu từ vựng...');
    try {
      const res = await lookupWord(term);
      if (res.success && res.data) {
        setPhonetic(res.data.phonetic || '');
        setPartOfSpeech(res.data.partOfSpeech || 'noun');
        setDefinition(res.data.definition || '');
        setDefinitionVi(res.data.definitionVi || '');
        setExampleSentence(res.data.exampleSentence || '');
        setExampleSentenceVi(res.data.exampleSentenceVi || '');
        toast.success('Đã tự động điền thông tin từ vựng! ✨', { id: toastId });
      } else {
        toast.error(res.error || 'Không tìm thấy thông tin từ vựng', { id: toastId });
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tra cứu tự động', { id: toastId });
    } finally {
      setIsAutoFilling(false);
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
      if (editingWord) {
        const res = await updateWordInDeck(editingWord.id, {
          lessonId: deck.id, term: term.trim(), phonetic: phonetic.trim(),
          partOfSpeech: partOfSpeech || 'noun', definition: definition.trim(),
          definitionVi: definitionVi.trim(), exampleSentence: exampleSentence.trim(),
          exampleSentenceVi: exampleSentenceVi.trim(),
        });
        if (res.success) {
          toast.success('Cập nhật từ vựng thành công! 🃏');
          setModalOpen(false); setEditingWord(null); router.refresh();
        } else {
          toast.error(res.error || 'Có lỗi xảy ra khi cập nhật từ');
        }
      } else {
        const res = await addWordToDeck({
          lessonId: deck.id, term: term.trim(), phonetic: phonetic.trim(),
          partOfSpeech: partOfSpeech || 'noun', definition: definition.trim(),
          definitionVi: definitionVi.trim(), exampleSentence: exampleSentence.trim(),
          exampleSentenceVi: exampleSentenceVi.trim(),
        });
        if (res.success) {
          toast.success('Thêm từ vựng mới thành công! 🃏');
          setTerm(''); setPhonetic(''); setPartOfSpeech('noun');
          setDefinition(''); setDefinitionVi('');
          setExampleSentence(''); setExampleSentenceVi('');
          setModalOpen(false); router.refresh();
        } else {
          toast.error(res.error || 'Có lỗi xảy ra khi thêm từ');
        }
      }
    } catch {
      toast.error('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  // Shared input class
  const inputCls = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-slate-900 dark:text-white transition-all text-sm";

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* ── Navigation back ── */}
      <button
        type="button"
        onClick={() => router.push('/books')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-0"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại Bộ từ vựng
      </button>

      {/* ── Deck Header ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start sm:items-center gap-4">
          <div className="text-5xl p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl shrink-0">
            {deck.coverEmoji || '📚'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-heading">
              {deck.title}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {deck.description || 'Không có mô tả cho bộ từ này.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                <BookOpen className="h-3.5 w-3.5" />
                {initialCards.length} thẻ từ vựng
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 py-2.5 px-5 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer md:w-auto w-full border-0"
        >
          <Plus className="h-5 w-5" />
          Thêm từ mới
        </button>
      </div>

      {/* ── Words Cards List ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
          Danh sách thẻ từ vựng <Sparkles className="h-4 w-4 text-slate-500" />
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
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer bg-transparent border-0"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                      {card.phonetic && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {card.phonetic}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {pos && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${pos.color}`}>
                          {pos.label}
                        </span>
                      )}
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(card)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border-0"
                          title="Sửa từ vựng"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWord(card.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border-0"
                          title="Xóa từ vựng"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Định nghĩa</span>
                      <p className="text-slate-800 dark:text-slate-200 font-medium">{card.definition}</p>
                      {card.definitionVi && (
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs">{card.definitionVi}</p>
                      )}
                    </div>

                    {card.exampleSentence && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl mt-2">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Ví dụ</span>
                        <p className="text-slate-700 dark:text-slate-300 italic font-sans">&ldquo;{card.exampleSentence}&rdquo;</p>
                        {card.exampleSentenceVi && (
                          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs">{card.exampleSentenceVi}</p>
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

      {/* ── Add / Edit Word Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative z-10 my-8"
            >
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors border-0 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                {editingWord ? 'Chỉnh sửa từ vựng ✏️' : 'Thêm từ vựng mới 🃏'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {editingWord
                  ? 'Cập nhật lại định nghĩa, từ loại hoặc ví dụ của từ vựng này.'
                  : 'Tạo thẻ từ ghi nhớ, hệ thống sẽ tự động xếp vào hàng đợi học tập hàng ngày.'}
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Term */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Từ vựng (Tiếng Anh) *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text" required value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        placeholder="Ví dụ: meticulous"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={handleAutoFill}
                        disabled={isAutoFilling || !term.trim()}
                        className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center shrink-0 border-0"
                        title="Tự động tra từ và dịch"
                      >
                        {isAutoFilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Phonetic */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Phiên âm (IPA)
                    </label>
                    <input
                      type="text" value={phonetic}
                      onChange={(e) => setPhonetic(e.target.value)}
                      placeholder="Ví dụ: /məˈtɪkyələs/"
                      className={inputCls}
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
                    className={inputCls + ' cursor-pointer'}
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
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Định nghĩa (Tiếng Anh) *
                    </label>
                    <textarea required value={definition} onChange={(e) => setDefinition(e.target.value)}
                      placeholder="Ví dụ: very careful and precise" rows={2} className={inputCls + ' resize-none'} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Giải nghĩa (Tiếng Việt)
                    </label>
                    <textarea value={definitionVi} onChange={(e) => setDefinitionVi(e.target.value)}
                      placeholder="Ví dụ: tỉ mỉ, kỹ càng" rows={2} className={inputCls + ' resize-none'} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Ví dụ đặt câu (Tiếng Anh)
                    </label>
                    <textarea value={exampleSentence} onChange={(e) => setExampleSentence(e.target.value)}
                      placeholder="Ví dụ: He was meticulous in his preparation." rows={2} className={inputCls + ' resize-none'} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Dịch câu ví dụ (Tiếng Việt)
                    </label>
                    <textarea value={exampleSentenceVi} onChange={(e) => setExampleSentenceVi(e.target.value)}
                      placeholder="Ví dụ: Anh ấy đã chuẩn bị rất tỉ mỉ." rows={2} className={inputCls + ' resize-none'} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl shadow-lg active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 mt-6 border-0"
                >
                  {loading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" />Đang xử lý...</>
                  ) : editingWord ? 'Lưu thay đổi' : 'Thêm từ vựng'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
