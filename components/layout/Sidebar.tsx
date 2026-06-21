'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  BookOpen, 
  Layers, 
  Gamepad2, 
  Settings, 
  ShieldAlert, 
  LogOut, 
  User, 
  Flame, 
  Sparkles,
  X
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  onCloseMobile?: () => void;
  userStats?: {
    dailyGoal: number;
    wordsLearnedToday: number;
    streakDays: number;
    totalXp: number;
  };
}

export default function Sidebar({ onCloseMobile, userStats = { dailyGoal: 10, wordsLearnedToday: 4, streakDays: 3, totalXp: 450 } }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user;
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Bộ từ vựng', href: '/books', icon: BookOpen },
    { name: 'Ôn tập (SRS)', href: '/review', icon: Layers },
    { name: 'Mini-games', href: '/games', icon: Gamepad2 },
    { name: 'Cài đặt', href: '/settings', icon: Settings },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin Control', href: '/admin', icon: ShieldAlert });
  }

  // Daily goal calculations
  const progressPercent = Math.min(100, Math.round((userStats.wordsLearnedToday / userStats.dailyGoal) * 100));
  const strokeDashoffset = 113 - (113 * progressPercent) / 100; // 2 * pi * r (r = 18) -> 113

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col justify-between py-6 px-4 shrink-0 overflow-y-auto">
      {/* Top Section: Logo */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onCloseMobile}>
            <motion.img
              whileHover={{ rotate: 10, scale: 1.05 }}
              src="/logo.svg"
              alt="NeuralCards Logo"
              className="w-10 h-10 rounded-xl"
            />
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white font-heading">
                NeuralCards
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider -mt-0.5">
                IELTS Prep
              </span>
            </div>
          </Link>
          {onCloseMobile && (
            <button 
              type="button" 
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl font-semibold text-sm transition-all group relative cursor-pointer ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                  }`} />
                  <span>{item.name}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-6 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Middle Section: Progress Tracker */}
      <div className="my-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-900/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mục tiêu ngày</span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {userStats.wordsLearnedToday} / {userStats.dailyGoal} từ
            </div>
          </div>
          {/* Radial Progress Wheel */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="3.5"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                className="stroke-indigo-600 dark:stroke-indigo-500 transition-all duration-500"
                strokeWidth="3.5"
                fill="transparent"
                strokeDasharray="113"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Mini stats badges */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
            <span>{userStats.streakDays} ngày</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 justify-end">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span>{userStats.totalXp} XP</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Profile Dropdown */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left focus:outline-none cursor-pointer">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-indigo-100 dark:border-indigo-950">
                <AvatarImage src={user?.image || undefined} />
                <AvatarFallback className="bg-indigo-600 text-white font-bold text-sm">
                  {user?.name?.slice(0, 2).toUpperCase() || 'NC'}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden max-w-[120px]">
                <div className="text-sm font-bold text-slate-800 dark:text-white truncate">
                  {user?.name || 'Học viên'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || 'student@neuralcards.app'}
                </div>
              </div>
            </div>
            <span className="text-slate-400 text-xs">▼</span>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56 mb-2" align="end" side="top">
            <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                <span>Trang cá nhân</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                <span>Cài đặt</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer focus:bg-rose-50 dark:focus:bg-rose-950/20"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
