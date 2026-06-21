'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Địa chỉ email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Sai email hoặc mật khẩu. Vui lòng kiểm tra lại!');
      } else {
        toast.success('Đăng nhập thành công! 👋');
        // Next.js client router refresh to pick up session cookie
        router.refresh();
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi kết nối. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      toast.error('Đăng nhập Google thất bại!');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-slate-950">
      {/* Left Column: Premium Brand Side */}
      <div className="hidden lg:flex lg:col-span-7 relative overflow-hidden bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-900 justify-center items-center text-white p-12">
        {/* Floating background decorative patterns */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-indigo-500 to-indigo-900 pointer-events-none"></div>
        
        {/* SVG Decorative Card Art */}
        <div className="absolute -top-16 -left-16 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-16 -right-16 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

        <div className="z-10 max-w-lg text-center lg:text-left space-y-8">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <span className="text-xl">🧠</span>
            <span className="font-semibold text-sm tracking-wide uppercase">AI IELTS Vocabulary</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight leading-none font-heading">
              Làm chủ Từ vựng <span className="text-indigo-200">Cambridge IELTS</span>
            </h1>
            <p className="text-lg text-indigo-100 font-sans">
              Học nhanh hơn, ghi nhớ lâu hơn bằng thuật toán lặp lại ngắt quãng (SM-2), mini-games sinh động và AI hỗ trợ trích xuất thông minh.
            </p>
          </div>

          {/* Cards floating graphics */}
          <div className="relative h-64 mt-12 hidden xl:block">
            {/* Card 1 */}
            <div className="absolute top-0 left-0 w-64 bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl transform -rotate-6 transition-all hover:rotate-0 duration-300">
              <div className="text-indigo-200 font-mono text-xs uppercase tracking-widest">Adjective</div>
              <div className="text-2xl font-bold mt-1 font-heading">ubiquitous</div>
              <div className="text-sm text-indigo-100 mt-2">present, appearing, or found everywhere.</div>
              <div className="text-xs text-indigo-300 italic mt-3">"Mobile phones are ubiquitous."</div>
            </div>

            {/* Card 2 */}
            <div className="absolute top-8 left-48 w-64 bg-gradient-to-br from-emerald-500/80 to-emerald-600/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl transform rotate-6 transition-all hover:rotate-0 duration-300">
              <div className="text-emerald-100 font-mono text-xs uppercase tracking-widest">Mastered</div>
              <div className="text-2xl font-bold mt-1 font-heading">meticulous</div>
              <div className="text-sm text-emerald-500/10 mt-2 text-white/90">very careful and precise.</div>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-200">
                <span>🔥</span> Streak: 5 ngày
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Clean Login Form */}
      <div className="lg:col-span-5 flex justify-center items-center p-8 sm:p-12 md:p-16">
        <div className="w-full max-w-md space-y-8">
          {/* Logo on mobile / header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading">
              Chào mừng trở lại!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Đăng nhập để tiếp tục lộ trình đạt IELTS Band 7.0+
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white font-sans transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Mật khẩu
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white font-sans transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  {...register('rememberMe')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
                  Ghi nhớ đăng nhập
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors cursor-pointer shadow-lg shadow-indigo-600/10"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-wider">Hoặc</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Social Sign-In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl focus:outline-none transition-colors cursor-pointer"
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Tiếp tục với Google
          </button>

          {/* Footer Navigation */}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Chưa có tài khoản?{' '}
            <Link
              href="/register"
              className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
