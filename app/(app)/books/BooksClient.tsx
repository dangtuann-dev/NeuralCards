'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, X, ArrowRight, Loader2, Edit2, Trash2 } from 'lucide-react';
import { createDeck, updateDeck, deleteDeck } from '@/actions/books';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface Deck {
  id: string;
  title: string;
  description: string | null;
  coverEmoji: string | null;
  wordCount: number;
  createdAt: Date;
}

interface BooksClientProps {
  decks: Deck[];
}

const EMOJI_OPTIONS = ['📚', '🧠', '🎯', '🚀', '✍️', '🗣️', '📖', '🎧', '💡', '🌟', '🏫', '📝'];

export default function BooksClient({ decks }: BooksClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverEmoji, setCoverEmoji] = useState('📚');
  const [loading, setLoading] = useState(false);

  const handleOpenCreateModal = () => {
    setEditingDeck(null);
    setTitle('');
    setDescription('');
    setCoverEmoji('📚');
    setModalOpen(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, deck: Deck) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingDeck(deck);
    setTitle(deck.title);
    setDescription(deck.description || '');
    setCoverEmoji(deck.coverEmoji || '📚');
    setModalOpen(true);
  };

  const handleDeleteDeck = async (e: React.MouseEvent, deckId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa bộ từ này? Toàn bộ thẻ từ vựng bên trong sẽ bị xóa vĩnh viễn và không thể khôi phục.')) {
      const toastId = toast.loading('Đang xóa bộ từ vựng...');
      try {
        const res = await deleteDeck(deckId);
        if (res.success) {
          toast.success('Xóa bộ từ vựng thành công!', { id: toastId });
        } else {
          toast.error(res.error || 'Lỗi khi xóa bộ từ vựng', { id: toastId });
        }
      } catch {
        toast.error('Lỗi kết nối khi xóa bộ từ vựng', { id: toastId });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tên bộ từ!');
      return;
    }

    setLoading(true);
    try {
      if (editingDeck) {
        const res = await updateDeck(editingDeck.id, {
          title: title.trim(),
          description: description.trim(),
          coverEmoji,
        });
        if (res.success) {
          toast.success('Cập nhật bộ từ thành công! 🎉');
          setModalOpen(false);
          setEditingDeck(null);
        } else {
          toast.error(res.error || 'Có lỗi xảy ra khi cập nhật bộ từ');
        }
      } else {
        const res = await createDeck({
          title: title.trim(),
          description: description.trim(),
          coverEmoji,
        });
        if (res.success) {
          toast.success('Tạo bộ từ mới thành công! 🎉');
          setTitle('');
          setDescription('');
          setCoverEmoji('📚');
          setModalOpen(false);
        } else {
          toast.error(res.error || 'Có lỗi xảy ra khi tạo bộ từ');
        }
      }
    } catch {
      toast.error('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight">
            Bộ từ vựng của tôi
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Tạo các bộ thẻ vựng cá nhân để ghi nhớ bằng thuật toán lặp lại ngắt quãng (SRS).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 py-2.5 px-5 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer w-full sm:w-auto border-0"
        >
          <Plus className="h-5 w-5" />
          Tạo bộ từ mới
        </button>
      </div>

      {/* ── Decks Grid ── */}
      {decks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center max-w-lg mx-auto mt-6"
        >
          <div className="text-6xl mb-4">📚✨</div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chưa có bộ từ vựng nào</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm">
            Hãy tạo bộ từ đầu tiên để thêm các flashcard từ vựng, tự động học và ôn tập theo thuật toán thông minh!
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="mt-6 py-2 px-5 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold rounded-xl transition-all cursor-pointer border-0"
          >
            Bắt đầu tạo ngay
          </button>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <Link key={deck.id} href={`/books/${deck.id}`} className="group relative">
              <motion.div
                whileHover={{ y: -4 }}
                className="h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-xl group-hover:border-slate-400 dark:group-hover:border-slate-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl w-fit">
                      {deck.coverEmoji || '📚'}
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(e, deck)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteDeck(e, deck.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-black dark:group-hover:text-slate-100 transition-colors line-clamp-1">
                        {deck.title}
                      </h3>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs break-words font-semibold">{deck.title}</p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 min-h-[2.5rem]">
                    {deck.description || 'Không có mô tả.'}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    <BookOpen className="h-3.5 w-3.5" />
                    {deck.wordCount} thẻ từ
                  </span>
                  <span className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-1 transition-all text-xs font-semibold flex items-center gap-1">
                    Xem bộ từ <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      )}

      {/* ── Create / Edit Deck Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative z-10"
            >
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors border-0 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                {editingDeck ? 'Chỉnh sửa bộ từ ✏️' : 'Tạo bộ từ mới 📚'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {editingDeck ? 'Cập nhật lại tên, mô tả hoặc biểu tượng của bộ từ vựng.' : 'Phân loại từ vựng thành các bộ bài học khác nhau để dễ ôn tập.'}
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Tên bộ từ *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Từ vựng IELTS Reading Cam 18"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-slate-900 dark:text-white transition-all text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Mô tả bộ từ
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả ngắn gọn về nguồn từ vựng hoặc mục đích học..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-slate-900 dark:text-white transition-all text-sm resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Biểu tượng ảnh bìa
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setCoverEmoji(emoji)}
                        className={`text-2xl p-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                          coverEmoji === emoji
                            ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-700 scale-105'
                            : 'border-transparent bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl shadow-lg active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 mt-6 border-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : editingDeck ? 'Lưu thay đổi' : 'Tạo bộ từ'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
