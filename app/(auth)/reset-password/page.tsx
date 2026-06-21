'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/actions/auth';
import { Loader2, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự trở lên'),
    confirmPassword: z.string().min(8, 'Xác nhận mật khẩu phải từ 8 ký tự trở lên'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) {
      toast.error('Thiếu mã xác minh đặt lại mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(data.password, token);
      if (response.success) {
        setSuccess(true);
        toast.success('Đặt lại mật khẩu thành công! 🎉');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        toast.error(response.error || 'Đặt lại mật khẩu thất bại.');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4 py-6">
        <p className="text-rose-500 font-semibold">Mã xác minh đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
        <Link
          href="/forgot-password"
          className="inline-block text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
        >
          Yêu cầu gửi lại liên kết mới
        </Link>
      </div>
    );
  }

  return (
    <>
      {!success ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Mật khẩu mới
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Tối thiểu 8 ký tự"
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

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full pl-11 pr-11 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white font-sans transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors cursor-pointer shadow-lg shadow-indigo-600/10"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang thiết lập lại...
              </>
            ) : (
              'Đặt lại mật khẩu'
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <p className="text-slate-700 dark:text-slate-300 font-semibold">
              Mật khẩu đã được thay đổi thành công!
            </p>
            <p className="text-sm text-slate-500">
              Đang chuyển hướng bạn về trang đăng nhập...
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading">
            Đặt lại mật khẩu
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nhập mật khẩu mới của bạn bên dưới
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
