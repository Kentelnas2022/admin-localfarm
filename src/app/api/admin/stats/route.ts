import { NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [userStats] = await query<any[]>('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    const [adminStats] = await query<any[]>('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
    const [postStats] = await query<any[]>('SELECT COUNT(*) as count FROM posts');
    const [connStats] = await query<any[]>('SELECT COUNT(*) as count FROM connections');
    const [storyStats] = await query<any[]>('SELECT COUNT(*) as count FROM stories WHERE expires_at > NOW()');
    const [msgStats] = await query<any[]>('SELECT COUNT(*) as count FROM messages');

    return NextResponse.json({
      stats: {
        totalFarmers: userStats?.count || 0,
        totalAdmins: adminStats?.count || 0,
        totalPosts: postStats?.count || 0,
        totalConnections: connStats?.count || 0,
        activeStories: storyStats?.count || 0,
        totalMessages: msgStats?.count || 0,
      },
    });
  } catch (error: any) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}
