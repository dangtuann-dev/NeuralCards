'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { registerUser } from '@/actions/auth';
import { Loader2, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Họ và tên phải từ 2 ký tự trở lên').max(50, 'Họ và tên không quá 50 ký tự'),
    email: z.string().email('Địa chỉ email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự trở lên'),
    confirmPassword: z.string().min(8, 'Xác nhận mật khẩu phải từ 8 ký tự trở lên'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'Bạn phải đồng ý với Điều khoản dịch vụ' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password', '');

  const calculatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (!pwd) return 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = calculatePasswordStrength(passwordValue);

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    try {
      const response = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (!response.success) {
        toast.error(response.error || 'Đăng ký thất bại. Vui lòng thử lại!');
        return;
      }

      toast.success('Đăng ký tài khoản thành công! Đang tự động đăng nhập...');
      
      // Auto sign in after successful registration
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        router.push('/login');
      } else {
        router.refresh();
        router.push('/onboarding');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi hệ thống. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 0:
        return { label: 'Chưa nhập', color: 'text-slate-400' };
      case 1:
        return { label: 'Rất yếu 🔴', color: 'text-rose-500' };
      case 2:
        return { label: 'Yếu 🟠', color: 'text-orange-500' };
      case 3:
        return { label: 'Khá mạnh 🟡', color: 'text-yellow-600' };
      case 4:
        return { label: 'Rất mạnh 🟢', color: 'text-emerald-500' };
      default:
        return { label: '', color: '' };
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-slate-950">
      {/* Left Column: Brand illustrations */}
      <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 justify-center items-center text-white p-12">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-500 via-slate-950 to-transparent pointer-events-none"></div>
        <div className="z-10 max-w-sm space-y-6">
          <div className="text-4xl">🧠✨</div>
          <h2 className="text-3xl font-bold tracking-tight font-heading">
            Tạo tài khoản học tập miễn phí
          </h2>
          <p className="text-slate-300">
            Bắt đầu tích luỹ XP, duy trì streak học tập, mở khoá các huy hiệu học thuật và chuẩn bị hành trang vững chắc cho kỳ thi Cambridge IELTS.
          </p>
          <div className="border-t border-slate-800 pt-6 space-y-4">
            <div className="flex gap-3">
              <span className="text-emerald-400">✔</span>
              <p className="text-sm text-slate-400">Trọn bộ Cambridge IELTS 11–20</p>
            </div>
            <div className="flex gap-3">
              <span className="text-emerald-400">✔</span>
              <p className="text-sm text-slate-400">Học thông minh với thuật toán SM-2</p>
            </div>
            <div className="flex gap-3">
              <span className="text-emerald-400">✔</span>
              <p className="text-sm text-slate-400">Thống kê tiến độ trực quan bằng biểu đồ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="lg:col-span-7 flex justify-center items-center p-8 sm:p-12 md:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading">
              Đăng ký tài khoản
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Điền các thông tin dưới đây để tạo hồ sơ NeuralCards mới
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Họ và tên
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white font-sans transition-all"
                />
              </div>
              {errors.name && (
                <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>
              )}
            </div>

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
                  className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white font-sans transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full pl-11 pr-11 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white font-sans transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {passwordValue && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Độ mạnh mật khẩu:</span>
                    <span className={`font-semibold ${getStrengthLabel(strength).color}`}>
                      {getStrengthLabel(strength).label}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-colors ${
                          i <= strength
                            ? strength === 1
                              ? 'bg-rose-500'
                              : strength === 2
                              ? 'bg-orange-500'
                              : strength === 3
                              ? 'bg-yellow-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full pl-11 pr-11 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white font-sans transition-all"
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

            {/* Terms Checkbox */}
            <div className="space-y-1">
              <div className="flex items-start">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  {...register('acceptTerms')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded mt-0.5"
                />
                <label htmlFor="acceptTerms" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
                  Tôi đồng ý với{' '}
                  <a href="#" className="font-semibold text-indigo-600 dark:text-indigo-400">
                    Điều khoản dịch vụ
                  </a>{' '}
                  và{' '}
                  <a href="#" className="font-semibold text-indigo-600 dark:text-indigo-400">
                    Chính sách bảo mật
                  </a>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-xs text-rose-500 mt-1">{errors.acceptTerms.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-indigo-600/10 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang đăng ký...
                </>
              ) : (
                'Tạo tài khoản'
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Đã có tài khoản?{' '}
            <Link
              href="/login"
              className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
