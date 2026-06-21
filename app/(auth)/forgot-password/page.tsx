'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { forgotPassword } from '@/actions/auth';
import { Loader2, Mail, ArrowLeft, Send } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Địa chỉ email không hợp lệ'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setLoading(true);
    try {
      const response = await forgotPassword(data.email);
      if (response.success) {
        setEmailSent(true);
        toast.success('Yêu cầu thành công! Vui lòng kiểm tra hộp thư.');
      } else {
        toast.error(response.error || 'Yêu cầu thất bại. Vui lòng thử lại!');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading">
            Quên mật khẩu?
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nhập email tài khoản của bạn để chúng tôi gửi đường dẫn đặt lại mật khẩu
          </p>
        </div>

        {!emailSent ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Địa chỉ Email
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors cursor-pointer shadow-lg shadow-indigo-600/10"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang gửi yêu cầu...
                </>
              ) : (
                <>
                  Gửi liên kết đặt lại
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 rounded-full flex items-center justify-center mx-auto text-2xl">
              ✉
            </div>
            <div className="space-y-2">
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                Một liên kết đặt lại mật khẩu đã được gửi đến email của bạn.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Hãy kiểm tra cả thư mục Spam/Quảng cáo nếu không tìm thấy trong Hộp thư đến.
              </p>
            </div>
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
