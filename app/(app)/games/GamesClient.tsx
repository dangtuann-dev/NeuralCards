'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Volume2, CheckCircle2, Play, Timer, HelpCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { recordGamePlay } from '@/actions/srs';
import Link from 'next/link';

interface GameWord {
  id: string;
  term: string;
  phonetic?: string | null;
  partOfSpeech: string | null;
  definition: string;
  definitionVi: string | null;
  exampleSentence: string | null;
  exampleSentenceVi: string | null;
  lessonId: string;
}

interface GamesClientProps {
  initialWords: GameWord[];
  decks: { id: string; title: string }[];
}

const GAMES = [
  { id: 'matching', title: 'Ghép cặp từ', desc: 'Nối từ tiếng Anh với định nghĩa nhanh nhất có thể', emoji: '🔗', color: 'from-violet-500 to-purple-600' },
  { id: 'spelling', title: 'Đánh vần', desc: 'Nghe và đánh vần chính xác từ vựng IELTS', emoji: '🎤', color: 'from-blue-500 to-indigo-600' },
  { id: 'fill_blank', title: 'Điền vào chỗ trống', desc: 'Hoàn thành câu với từ vựng phù hợp', emoji: '✏️', color: 'from-emerald-500 to-teal-600' },
  { id: 'speed', title: 'Speed Round', desc: 'Trả lời đúng càng nhiều từ dịch tốt nhất trong 60 giây', emoji: '⚡', color: 'from-amber-500 to-orange-500' },
];

export default function GamesClient({ initialWords, decks }: GamesClientProps) {
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [activeGame, setActiveGame] = useState<string | null>(null);
  
  // Game states
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Matching Game States ──
  const [tiles, setTiles] = useState<{ id: string; text: string; type: 'en' | 'vi'; wordId: string; matched: boolean; selected: boolean }[]>([]);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);

  // ── Spelling Game States ──
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [spellInput, setSpellInput] = useState('');
  const [spellChecked, setSpellChecked] = useState(false);
  const [isCorrectSpell, setIsCorrectSpell] = useState(false);

  // ── Fill in Blank States ──
  const [fillOptions, setFillOptions] = useState<string[]>([]);
  const [selectedFillOption, setSelectedFillOption] = useState<string | null>(null);
  const [fillChecked, setFillChecked] = useState(false);

  // ── Speed Round States ──
  const [timeLeft, setTimeLeft] = useState(60);
  const [speedWord, setSpeedWord] = useState<GameWord | null>(null);
  const [speedOptions, setSpeedOptions] = useState<string[]>([]);

  // Compute active words based on selected deck
  const activeWords = selectedDeckId === 'all'
    ? initialWords
    : initialWords.filter((w) => w.lessonId === selectedDeckId);

  // Simple pronunciation helper
  const speakWord = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleGameSelect = (gameId: string) => {
    if (activeWords.length < 4) {
      toast.error('Bộ từ vựng này cần có tối thiểu 4 từ để chơi trò chơi! Vui lòng thêm từ hoặc chọn bộ từ khác.');
      return;
    }

    setActiveGame(gameId);
    setScore(0);
    setXpEarned(0);
    setGameOver(false);
    
    if (gameId === 'matching') {
      initMatchingGame();
    } else if (gameId === 'spelling') {
      initSpellingGame();
    } else if (gameId === 'fill_blank') {
      initFillBlankGame(0);
    } else if (gameId === 'speed') {
      initSpeedGame();
    }
  };

  const handleBackToMenu = () => {
    setActiveGame(null);
    setGameOver(false);
  };

  const saveResults = async (finalXp: number, finalScore: number, type: 'matching' | 'speed_round' | 'spelling' | 'fill_blank') => {
    setSaving(true);
    try {
      const res = await recordGamePlay(type, finalScore, finalXp);
      if (res.success) {
        toast.success(`Đã đồng bộ thành công! +${finalXp} XP 🌟`);
      } else {
        toast.error('Lỗi khi đồng bộ điểm số');
      }
    } catch {
      toast.error('Lỗi kết nối khi đồng bộ điểm');
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────────
  // 1. MATCHING GAME LOGIC
  // ──────────────────────────────────────────
  const initMatchingGame = () => {
    const shuffled = [...activeWords].sort(() => 0.5 - Math.random()).slice(0, 4);
    const generatedTiles: { id: string; text: string; type: 'en' | 'vi'; wordId: string; matched: boolean; selected: boolean }[] = [];
    
    shuffled.forEach((w) => {
      generatedTiles.push({
        id: `en-${w.id}`,
        text: w.term,
        type: 'en',
        wordId: w.id,
        matched: false,
        selected: false,
      });
      generatedTiles.push({
        id: `vi-${w.id}`,
        text: w.definitionVi || w.definition,
        type: 'vi',
        wordId: w.id,
        matched: false,
        selected: false,
      });
    });

    setTiles(generatedTiles.sort(() => 0.5 - Math.random()));
    setSelectedTile(null);
  };

  const handleTileClick = (tileId: string) => {
    const clickedTile = tiles.find((t) => t.id === tileId);
    if (!clickedTile || clickedTile.matched) return;

    if (!selectedTile) {
      setSelectedTile(tileId);
      setTiles(tiles.map((t) => (t.id === tileId ? { ...t, selected: true } : t)));
    } else {
      const prevSelected = tiles.find((t) => t.id === selectedTile);
      if (!prevSelected) return;

      if (prevSelected.id === tileId) {
        setSelectedTile(null);
        setTiles(tiles.map((t) => (t.id === tileId ? { ...t, selected: false } : t)));
        return;
      }

      if (prevSelected.type !== clickedTile.type && prevSelected.wordId === clickedTile.wordId) {
        toast.success('Chính xác! 🎉', { duration: 800 });
        const updatedTiles = tiles.map((t) => {
          if (t.wordId === clickedTile.wordId) {
            return { ...t, matched: true, selected: false };
          }
          return t;
        });
        setTiles(updatedTiles);
        setSelectedTile(null);

        const allMatched = updatedTiles.every((t) => t.matched);
        if (allMatched) {
          setScore(100);
          setXpEarned(25);
          setGameOver(true);
          saveResults(25, 100, 'matching');
        }
      } else {
        toast.error('Sai rồi, thử lại nhé!', { duration: 800 });
        setTiles(tiles.map((t) => ({ ...t, selected: false })));
        setSelectedTile(null);
      }
    }
  };

  // ──────────────────────────────────────────
  // 2. SPELLING GAME LOGIC
  // ──────────────────────────────────────────
  const initSpellingGame = () => {
    setCurrentWordIdx(0);
    setSpellInput('');
    setSpellChecked(false);
    setTimeout(() => speakWord(activeWords[0]?.term || ''), 500);
  };

  const handleCheckSpell = () => {
    const currentWord = activeWords[currentWordIdx];
    if (!currentWord) return;

    const isCorrect = spellInput.trim().toLowerCase() === currentWord.term.toLowerCase();
    setIsCorrectSpell(isCorrect);
    setSpellChecked(true);
    if (isCorrect) {
      setScore((s) => s + 20);
      setXpEarned((x) => x + 5);
      toast.success('Chính xác! 🌟');
    } else {
      toast.error(`Chưa đúng! Đáp án đúng là: ${currentWord.term}`);
    }
  };

  const handleNextSpell = () => {
    if (currentWordIdx + 1 < Math.min(activeWords.length, 5)) {
      const nextIdx = currentWordIdx + 1;
      setCurrentWordIdx(nextIdx);
      setSpellInput('');
      setSpellChecked(false);
      setTimeout(() => speakWord(activeWords[nextIdx]?.term || ''), 500);
    } else {
      setGameOver(true);
      const earned = Math.round(score / 4);
      setXpEarned(earned);
      saveResults(earned, score, 'spelling');
    }
  };

  // ──────────────────────────────────────────
  // 3. FILL IN BLANK LOGIC
  // ──────────────────────────────────────────
  const initFillBlankGame = (idx: number) => {
    const currentWord = activeWords[idx];
    if (!currentWord) return;

    setCurrentWordIdx(idx);
    setSelectedFillOption(null);
    setFillChecked(false);

    const correctOption = currentWord.term;
    const others = activeWords
      .filter((w) => w.term !== correctOption)
      .map((w) => w.term)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    const options = [correctOption, ...others].sort(() => 0.5 - Math.random());
    setFillOptions(options);
  };

  const handleCheckFill = () => {
    const currentWord = activeWords[currentWordIdx];
    if (!currentWord || !selectedFillOption) return;

    setFillChecked(true);
    const isCorrect = selectedFillOption === currentWord.term;
    if (isCorrect) {
      setScore((s) => s + 20);
      setXpEarned((x) => x + 5);
      toast.success('Rất xuất sắc! 💎');
    } else {
      toast.error(`Chưa chính xác! Từ phù hợp là: ${currentWord.term}`);
    }
  };

  const handleNextFill = () => {
    if (currentWordIdx + 1 < Math.min(activeWords.length, 5)) {
      initFillBlankGame(currentWordIdx + 1);
    } else {
      setGameOver(true);
      const earned = Math.round(score / 4);
      setXpEarned(earned);
      saveResults(earned, score, 'fill_blank');
    }
  };

  // ──────────────────────────────────────────
  // 4. SPEED ROUND LOGIC
  // ──────────────────────────────────────────
  const initSpeedGame = () => {
    setTimeLeft(60);
    setScore(0);
    setXpEarned(0);
    nextSpeedQuestion();
  };

  const nextSpeedQuestion = () => {
    const randWord = activeWords[Math.floor(Math.random() * activeWords.length)];
    if (!randWord) return;

    setSpeedWord(randWord);
    
    const correctOpt = randWord.definitionVi || randWord.definition;
    const others = activeWords
      .filter((w) => w.id !== randWord.id)
      .map((w) => w.definitionVi || w.definition)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    setSpeedOptions([correctOpt, ...others].sort(() => 0.5 - Math.random()));
  };

  const handleSpeedOptionSelect = (option: string) => {
    if (!speedWord) return;

    const correctOpt = speedWord.definitionVi || speedWord.definition;
    if (option === correctOpt) {
      setScore((s) => s + 10);
      setXpEarned((x) => x + 2);
      toast.success('+10 Điểm! ⚡', { duration: 500 });
    } else {
      toast.error('Sai rồi!', { duration: 500 });
    }
    nextSpeedQuestion();
  };

  // Speed Round timer hook
  useEffect(() => {
    if (activeGame !== 'speed' || gameOver) return;

    if (timeLeft <= 0) {
      setGameOver(true);
      saveResults(xpEarned, score, 'speed_round');
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, activeGame, gameOver]);

  // Empty state if no words at all
  if (initialWords.length === 0) {
    return (
      <div className="p-8 max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="text-7xl font-emoji">🎮🃏</div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading">
          Chưa có từ vựng!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-normal">
          Các trò chơi trong mini-game được đồng bộ trực tiếp từ các bộ từ vựng cá nhân của bạn. Hiện tại bạn chưa tạo từ vựng nào.
        </p>
        <Link
          href="/books"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all border-0 cursor-pointer"
        >
          Tạo bộ từ vựng ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* ── Menu Screen ── */}
      {!activeGame && (
        <>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading mb-2">
            Mini-games
          </h1>
          <p className="text-slate-550 dark:text-slate-400 mb-8">
            Học từ vựng IELTS theo cách thú vị với các trò chơi tương tác.
          </p>

          {/* Deck Selector Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Chọn bộ từ vựng để chơi 🎯
              </h3>
              <p className="text-xs text-slate-550 dark:text-slate-400">
                Hệ thống sẽ lọc câu hỏi và từ vựng của trò chơi theo bộ từ bạn chọn.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <select
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-950 dark:text-white transition-all text-sm font-bold cursor-pointer min-w-[220px]"
              >
                <option value="all">Tất cả từ vựng ({initialWords.length} từ)</option>
                {decks.map((deck) => {
                  const count = initialWords.filter((w) => w.lessonId === deck.id).length;
                  return (
                    <option key={deck.id} value={deck.id}>
                      {deck.title} ({count} từ)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {activeWords.length < 4 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-amber-800 dark:text-amber-400 text-xs font-semibold mb-6">
              ⚠️ Bộ từ vựng đã chọn chỉ có {activeWords.length} từ. Bạn cần có tối thiểu 4 từ để chơi trò chơi. Vui lòng thêm từ vựng hoặc chọn bộ từ khác!
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {GAMES.map((g) => {
              const disabled = activeWords.length < 4;
              return (
                <div
                  key={g.id}
                  onClick={() => !disabled && handleGameSelect(g.id)}
                  className={`bg-gradient-to-br ${g.color} rounded-2xl p-6 text-white shadow-md flex flex-col justify-between transition-all ${
                    disabled
                      ? 'opacity-60 cursor-not-allowed'
                      : 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  <div>
                    <div className="text-4xl mb-3">{g.emoji}</div>
                    <h2 className="text-xl font-bold mb-1">{g.title}</h2>
                    <p className="text-white/80 text-sm">{g.desc}</p>
                  </div>
                  <div className="mt-6 flex items-center justify-end text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl w-fit self-end">
                    <Play className="h-3.5 w-3.5 mr-1 fill-white" /> Bắt đầu
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Game Play screen ── */}
      {activeGame && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToMenu}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold text-sm bg-transparent border-0 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Quay lại Menu
            </button>
            <div className="flex items-center gap-4 text-sm font-bold text-slate-700 dark:text-slate-300">
              <span>Điểm: <span className="text-indigo-650 dark:text-indigo-400">{score}</span></span>
              <span>XP: <span className="text-orange-500">{xpEarned} XP</span></span>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────
              GAME OVER SCREEN
             ──────────────────────────────────────────────────────── */}
          {gameOver ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center max-w-md mx-auto shadow-2xl space-y-6"
            >
              <div className="text-6xl">🎉🏆</div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Trò chơi kết thúc!</h2>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">Kết quả của bạn:</p>
                <p className="text-3xl font-extrabold text-indigo-650 dark:text-indigo-400">{score} Điểm</p>
                <p className="text-sm font-bold text-orange-500">+{xpEarned} XP tích lũy</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleGameSelect(activeGame)}
                  disabled={saving}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer border-0 disabled:opacity-50"
                >
                  Chơi lại
                </button>
                <button
                  onClick={handleBackToMenu}
                  disabled={saving}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer border-0 disabled:opacity-50"
                >
                  Thoát
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* ────────────────────────────────────────────────────────
                  1. MATCHING GAME UI
                 ──────────────────────────────────────────────────────── */}
              {activeGame === 'matching' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5 font-heading">
                      <Sparkles className="h-5 w-5 text-indigo-500" /> Ghép các cặp từ tương ứng
                    </h2>
                    <p className="text-xs text-slate-500">
                      Chọn 1 thẻ tiếng Anh và 1 thẻ nghĩa tiếng Việt tương ứng để triệt tiêu chúng.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {tiles.map((t) => (
                      <motion.div
                        key={t.id}
                        layout
                        onClick={() => handleTileClick(t.id)}
                        className={`aspect-[4/3] flex items-center justify-center p-4 text-center rounded-2xl border-2 transition-all cursor-pointer text-sm font-bold select-none ${
                          t.matched
                            ? 'opacity-0 scale-95 pointer-events-none'
                            : t.selected
                            ? 'border-indigo-650 bg-indigo-50 text-indigo-755 dark:bg-indigo-950/40 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 hover:scale-[1.02]'
                        }`}
                      >
                        {t.text}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────
                  2. SPELLING GAME UI
                 ──────────────────────────────────────────────────────── */}
              {activeGame === 'spelling' && (
                <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
                  <div className="text-center space-y-2">
                    <span className="text-xs font-bold text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full uppercase tracking-wider">
                      Từ {currentWordIdx + 1} / {Math.min(activeWords.length, 5)}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                      Nghe và đánh vần từ vựng
                    </h3>
                  </div>

                  <div className="flex justify-center py-4">
                    <button
                      onClick={() => speakWord(activeWords[currentWordIdx]?.term || '')}
                      className="p-5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 rounded-full text-indigo-600 dark:text-indigo-400 transition-all scale-110 border-0 cursor-pointer"
                    >
                      <Volume2 className="h-8 w-8" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Từ loại gợi ý: {activeWords[currentWordIdx]?.partOfSpeech || 'n/a'}
                      </label>
                      <input
                        type="text"
                        value={spellInput}
                        onChange={(e) => setSpellInput(e.target.value)}
                        disabled={spellChecked}
                        placeholder="Nhập spelling chính xác..."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition-all font-mono tracking-wider text-center"
                      />
                    </div>

                    {spellChecked && (
                      <div className={`p-4 rounded-xl flex items-start gap-3 ${isCorrectSpell ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300' : 'bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-300'}`}>
                        {isCorrectSpell ? <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 shrink-0 mt-0.5" />}
                        <div>
                          <p className="font-bold text-sm">{isCorrectSpell ? 'Chính xác!' : 'Chưa đúng!'}</p>
                          <p className="text-xs mt-0.5">{activeWords[currentWordIdx]?.definitionVi || activeWords[currentWordIdx]?.definition}</p>
                        </div>
                      </div>
                    )}

                    {!spellChecked ? (
                      <button
                        onClick={handleCheckSpell}
                        disabled={!spellInput.trim()}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 border-0 cursor-pointer"
                      >
                        Kiểm tra
                      </button>
                    ) : (
                      <button
                        onClick={handleNextSpell}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all border-0 cursor-pointer"
                      >
                        Tiếp theo
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────
                  3. FILL IN BLANK GAME UI
                 ──────────────────────────────────────────────────────── */}
              {activeGame === 'fill_blank' && (
                <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
                  <div className="text-center space-y-2">
                    <span className="text-xs font-bold text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full uppercase tracking-wider">
                      Câu {currentWordIdx + 1} / {Math.min(activeWords.length, 5)}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                      Điền từ vựng còn thiếu vào câu
                    </h3>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-center space-y-2">
                    <p className="text-base text-slate-800 dark:text-slate-100 font-medium italic">
                      &ldquo;
                      {activeWords[currentWordIdx]?.exampleSentence
                        ?.replace(new RegExp(activeWords[currentWordIdx]?.term, 'gi'), '_______') || '_______'}
                      &rdquo;
                    </p>
                    {activeWords[currentWordIdx]?.exampleSentenceVi && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ({activeWords[currentWordIdx]?.exampleSentenceVi})
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {fillOptions.map((opt) => (
                      <button
                        key={opt}
                        disabled={fillChecked}
                        onClick={() => setSelectedFillOption(opt)}
                        className={`p-3.5 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                          selectedFillOption === opt
                            ? fillChecked
                              ? opt === activeWords[currentWordIdx]?.term
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300'
                                : 'border-red-500 bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-300'
                              : 'border-indigo-600 bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-300'
                            : fillChecked && opt === activeWords[currentWordIdx]?.term
                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 dark:bg-emerald-950/10 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 bg-transparent text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  <div className="pt-4">
                    {!fillChecked ? (
                      <button
                        onClick={handleCheckFill}
                        disabled={!selectedFillOption}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 border-0 cursor-pointer"
                      >
                        Kiểm tra
                      </button>
                    ) : (
                      <button
                        onClick={handleNextFill}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all border-0 cursor-pointer"
                      >
                        Tiếp theo
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────
                  4. SPEED ROUND UI
                 ──────────────────────────────────────────────────────── */}
              {activeGame === 'speed' && speedWord && (
                <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-1.5 bg-amber-500 transition-all duration-1000" style={{ width: `${(timeLeft / 60) * 100}%` }} />

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Timer className="h-3.5 w-3.5" /> {timeLeft} giây
                    </span>
                    <span className="text-sm font-bold text-slate-500">
                      Từ loại: {speedWord.partOfSpeech || 'n/a'}
                    </span>
                  </div>

                  <div className="text-center py-6">
                    <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight">
                      {speedWord.term}
                    </h2>
                    {speedWord.phonetic && (
                      <p className="text-xs font-mono text-slate-400 mt-1">{speedWord.phonetic}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Chọn nghĩa chính xác:</span>
                    {speedOptions.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSpeedOptionSelect(opt)}
                        className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 hover:bg-indigo-50 dark:bg-slate-950/20 dark:hover:bg-indigo-950/20 hover:border-indigo-500/50 transition-all font-medium text-sm text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-between"
                      >
                        <span>{opt}</span>
                        <HelpCircle className="h-4 w-4 text-slate-400 shrink-0 ml-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
