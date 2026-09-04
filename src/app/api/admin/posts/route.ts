import { NextRequest, NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { logAdminActivity } from '@/lib/activity-logger';

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const posts = await query<any[]>(
      `SELECT p.id, p.user_id, p.content, p.image_url, p.category, p.privacy, p.location, 
              p.likes_count, p.comments_count, p.shares_count, p.created_at,
              u.full_name, u.username, u.email, u.avatar_url
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC
       LIMIT 50`
    );

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Posts fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '0', 10);

    if (!id) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    await query('DELETE FROM posts WHERE id = ?', [id]);

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAdminActivity({
      action: 'Post Moderated & Deleted',
      detail: `Moderator deleted produce listing / community post #${id}`,
      type: 'security',
      user: admin.email || 'admin@localfarm.com',
      ip: clientIp,
      status: 'warning'
    });

    return NextResponse.json({ success: true, message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Post delete error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
