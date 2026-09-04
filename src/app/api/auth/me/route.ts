import { NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await query<any[]>(
      'SELECT id, first_name, last_name, full_name, username, email, role, avatar_url, phone_number, created_at FROM users WHERE id = ? LIMIT 1',
      [admin.id]
    );

    if (!users || users.length === 0 || users[0].role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ user: users[0] });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}
