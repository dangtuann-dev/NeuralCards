import { auth } from '@/lib/auth';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

let ratelimit: Ratelimit | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
    });
  }
} catch (error) {
  console.warn('Failed to initialize rate limiter. Upstash Redis credentials might be missing.', error);
}

export default auth(async (req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;

  // Rate limit API routes
  if (pathname.startsWith('/api/') && ratelimit) {
    const ip = (req as any).ip ?? '127.0.0.1';
    try {
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
    } catch (error) {
      console.error('Rate limit execution failed:', error);
    }
  }

  // Protect app routes
  const isAppRoute = pathname.startsWith('/(app)') || 
    ['/dashboard', '/books', '/lessons', '/games', '/progress', '/review', '/settings', '/notifications'].some(p => pathname.startsWith(p));
  
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = ['/login', '/register', '/forgot-password'].includes(pathname);

  if (!req.auth && (isAppRoute || isAdminRoute)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (req.auth) {
    const onboardingCompleted = req.auth.user?.onboardingCompleted;
    
    if (isAuthRoute) {
      return NextResponse.redirect(new URL(onboardingCompleted ? '/dashboard' : '/onboarding', req.url));
    }
    
    // If not onboarded and trying to access general app/admin routes (excluding onboarding itself), redirect to onboarding
    if (!onboardingCompleted && isAppRoute && pathname !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|icons|sw.js|manifest.json).*)'],
};
