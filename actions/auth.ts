'use server';

import { db } from '@/lib/db';
import { users, profiles, verificationTokens } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function registerUser(data: z.infer<typeof registerSchema>) {
  try {
    const validated = registerSchema.parse(data);
    
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validated.email),
    });
    
    if (existingUser) {
      return { success: false, error: 'Email is already in use' };
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 12);
    
    // Insert user
    const [newUser] = await db.insert(users).values({
      name: validated.name,
      email: validated.email,
      password: hashedPassword,
    }).returning();
    
    // Create linked profile
    await db.insert(profiles).values({
      id: newUser.id,
      streakDays: 0,
      longestStreak: 0,
      totalWordsLearned: 0,
      totalXp: 0,
      dailyGoal: 10,
      studyPreference: 'mixed',
      preferredLanguage: 'vi',
      onboardingCompleted: false,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Registration action error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred during registration' };
  }
}

export async function forgotPassword(email: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    
    if (!user) {
      // Prevent user enumeration
      return { success: true };
    }
    
    // Create token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expires = new Date(Date.now() + 3600000); // 1 hour expiry
    
    // Delete existing token for this user if any
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
    
    // Insert token
    await db.insert(verificationTokens).values({
      identifier: email,
      token,
      expires,
    });
    
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    if (resend) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@neuralcards.app',
        to: email,
        subject: 'Thay đổi mật khẩu - NeuralCards',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-radius: 12px;">
            <h2 style="color: #4F46E5; margin-bottom: 20px;">Yêu cầu thay đổi mật khẩu</h2>
            <p>Xin chào,</p>
            <p>Chúng tôi nhận được yêu cầu thay đổi mật khẩu cho tài khoản NeuralCards của bạn. Vui lòng bấm vào liên kết dưới đây để thực hiện thiết lập lại mật khẩu:</p>
            <p style="margin: 30px 0; text-align: center;">
              <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Đặt lại mật khẩu</a>
            </p>
            <p style="color: #64748B; font-size: 14px;">Liên kết này có hiệu lực trong vòng 1 giờ. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email.</p>
          </div>
        `,
      });
    } else {
      console.log(`[DEV ONLY] Password reset link for ${email}: ${resetLink}`);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Forgot password action error:', error);
    return { success: false, error: 'Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại!' };
  }
}

export async function resetPassword(password: string, token: string) {
  try {
    const verification = await db.query.verificationTokens.findFirst({
      where: eq(verificationTokens.token, token),
    });
    
    if (!verification || verification.expires < new Date()) {
      return { success: false, error: 'Mã xác minh không hợp lệ hoặc đã hết hạn.' };
    }
    
    const email = verification.identifier;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update user password
    await db.update(users).set({
      password: hashedPassword,
    }).where(eq(users.email, email));
    
    // Clean up token
    await db.delete(verificationTokens).where(eq(verificationTokens.token, token));
    
    return { success: true };
  } catch (error: any) {
    console.error('Reset password action error:', error);
    return { success: false, error: 'Đặt lại mật khẩu thất bại. Vui lòng thử lại!' };
  }
}
