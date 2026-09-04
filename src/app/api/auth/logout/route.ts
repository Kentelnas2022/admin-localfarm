import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_COOKIE_NAME, getSessionAdmin } from '@/lib/auth';
import { logAdminActivity } from '@/lib/activity-logger';

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    if (admin && admin.email) {
      await logAdminActivity({
        action: 'Admin Signed Out',
        detail: `Session closed for administrator (${admin.email})`,
        type: 'auth',
        user: admin.email,
        ip: clientIp,
        status: 'success'
      });
    }
  } catch (err) {
    // Non-blocking for logout
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set({
    name: TOKEN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return response;
}
