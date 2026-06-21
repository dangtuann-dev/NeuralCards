'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Flame, Sparkles, BookOpen, Layers, Gamepad2, Trophy,
  ArrowRight, Star, Target, Zap, CheckCircle2, Clock, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Session } from 'next-auth';

interface DashboardClientProps {
  user: Session['user'];
}

// Mock data — will be replaced with real DB queries
const MOCK_STATS = {
  streakDays: 7,
  totalXp: 1240,
  wordsLearned: 284,
  wordsToReview: 18,
  dailyGoal: 20,
  wordsLearnedToday: 11,
  accuracy: 82,
  totalStudyMinutes: 127,
};

const QUICK_ACTIONS = [
  {
    title: 'Ôn tập hôm nay',
    desc: '18 thẻ đến hạn ôn',
    icon: Layers,
    href: '/review',
    accent: 'indigo',
    badge: '18',
    gradient: 'from-indigo-500 to-indigo-600',
  },
  {
    title: 'Cambridge IELTS',
    desc: 'Học từ vựng theo bài',
    icon: BookOpen,
    href: '/books',
    accent: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Mini-games',
    desc: 'Luyện tập tương tác',
    icon: Gamepad2,
    href: '/games',
    accent: 'violet',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    title: 'Bảng xếp hạng',
    desc: 'So sánh với bạn bè',
    icon: Trophy,
    href: '/leaderboard',
    accent: 'amber',
    gradient: 'from-amber-500 to-orange-500',
  },
];

const ACTIVITY_DATA = Array.from({ length: 7 * 12 }, (_, i) => ({
  day: i,
  count: Math.random() > 0.5 ? Math.floor(Math.random() * 30) : 0,
}));

const RECENT_WORDS = [
  { word: 'ubiquitous', definition: 'present everywhere', status: 'mastered', nextReview: '3 days' },
  { word: 'meticulous', definition: 'very careful and precise', status: 'review', nextReview: 'Tomorrow' },
  { word: 'ambiguous', definition: 'open to multiple interpretations', status: 'learning', nextReview: 'Today' },
  { word: 'pragmatic', definition: 'dealing with things sensibly', status: 'review', nextReview: '2 days' },
  { word: 'eloquent', definition: 'fluent and persuasive in speech', status: 'mastered', nextReview: '7 days' },
];

function ActivityCell({ count }: { count: number }) {
  const intensity = count === 0 ? 0 : count < 5 ? 1 : count < 15 ? 2 : count < 25 ? 3 : 4;
  const colors = ['bg-slate-100 dark:bg-slate-800', 'bg-indigo-200 dark:bg-indigo-900', 'bg-indigo-400 dark:bg-indigo-700', 'bg-indigo-500 dark:bg-indigo-600', 'bg-indigo-600 dark:bg-indigo-500'];
  return <div className={`w-3 h-3 rounded-sm ${colors[intensity]}`} title={`${count} từ`} />;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; class: string }> = {
    mastered: { label: 'Thành thạo', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
    review: { label: 'Ôn tập', class: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
    learning: { label: 'Đang học', class: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400' },
    new: { label: 'Mới', class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  };
  const cfg = config[status] || config.new;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.class}`}>
      {cfg.label}
    </span>
  );
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function DashboardClient({ user }: DashboardClientProps) {
  const progressPct = Math.min(100, Math.round((MOCK_STATS.wordsLearnedToday / MOCK_STATS.dailyGoal) * 100));
  const firstName = user?.name?.split(' ')[0] || 'Học viên';

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* ── Hero Greeting ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading mt-1">
            Xin chào, {firstName}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Bạn đã học{' '}
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {MOCK_STATS.wordsLearnedToday}/{MOCK_STATS.dailyGoal} từ
            </span>{' '}
            hôm nay. Tiếp tục phát huy nhé!
          </p>
        </div>

        {/* Streak Banner */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl px-5 py-3 w-fit">
          <Flame className="h-7 w-7 text-orange-500 fill-orange-500 shrink-0" />
          <div>
            <p className="text-xl font-extrabold text-orange-600 dark:text-orange-400 leading-none">{MOCK_STATS.streakDays} ngày</p>
            <p className="text-xs text-orange-500/80 dark:text-orange-500/70 font-medium mt-0.5">Streak hiện tại</p>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: 'Tổng từ đã học', value: MOCK_STATS.wordsLearned, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', sub: '+12 tuần này' },
          { label: 'Điểm XP', value: MOCK_STATS.totalXp, icon: Sparkles, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30', sub: 'Hạng Bạc' },
          { label: 'Độ chính xác', value: `${MOCK_STATS.accuracy}%`, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', sub: 'Trung bình 30 ngày' },
          { label: 'Thời gian học', value: `${MOCK_STATS.totalStudyMinutes}p`, icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', sub: 'Tổng tất cả' },
        ].map((kpi) => (
          <motion.div key={kpi.label} variants={item}>
            <Card className="overflow-hidden">
              <CardContent className="p-5">
                <div className={`inline-flex p-2.5 rounded-xl ${kpi.bg} mb-3`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{kpi.value}</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{kpi.label}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {kpi.sub}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Daily Goal Progress ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Mục tiêu học hàng ngày</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {MOCK_STATS.wordsLearnedToday} / {MOCK_STATS.dailyGoal} từ hoàn thành
                </p>
              </div>
              <span className={`text-2xl font-extrabold ${progressPct >= 100 ? 'text-emerald-600' : 'text-indigo-600'} dark:${progressPct >= 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                {progressPct}%
              </span>
            </div>
            <Progress value={progressPct} className="h-3 rounded-full" />
            {progressPct >= 100 && (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Tuyệt vời! Bạn đã hoàn thành mục tiêu hôm nay 🎉
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Quick Actions ── */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">Bắt đầu học</h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {QUICK_ACTIONS.map((action) => (
            <motion.div key={action.href} variants={item} whileHover={{ y: -3 }} className="h-full">
              <Link href={action.href} className="group block h-full">
                <Card className="h-full overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-0 h-full">
                    <div className={`bg-gradient-to-br ${action.gradient} p-5 h-full flex flex-col justify-between min-h-[120px]`}>
                      <div className="flex items-start justify-between">
                        <div className="bg-white/20 p-2.5 rounded-xl">
                          <action.icon className="h-5 w-5 text-white" />
                        </div>
                        {action.badge && (
                          <span className="bg-white text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            {action.badge}
                          </span>
                        )}
                      </div>
                      <div className="mt-4">
                        <p className="font-bold text-white text-sm leading-tight">{action.title}</p>
                        <p className="text-white/80 text-xs mt-0.5">{action.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Bottom grid: Activity + Recent words ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity Heatmap */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Hoạt động học tập (12 tuần)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {Array.from({ length: 12 }).map((_, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-1">
                    {Array.from({ length: 7 }).map((_, dayIdx) => {
                      const cell = ACTIVITY_DATA[weekIdx * 7 + dayIdx];
                      return <ActivityCell key={dayIdx} count={cell?.count ?? 0} />;
                    })}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                <span>Ít</span>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-3 h-3 rounded-sm ${['bg-slate-100 dark:bg-slate-800', 'bg-indigo-200 dark:bg-indigo-900', 'bg-indigo-400 dark:bg-indigo-700', 'bg-indigo-500 dark:bg-indigo-600', 'bg-indigo-600 dark:bg-indigo-500'][i]}`} />
                ))}
                <span>Nhiều</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Words */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base">Từ gần đây</CardTitle>
              <Link href="/review" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                Xem tất cả <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {RECENT_WORDS.map((w) => (
                  <div key={w.word} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="overflow-hidden mr-2">
                      <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{w.word}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{w.definition}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={w.status} />
                      <span className="text-[10px] text-slate-400">{w.nextReview}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
