import { NextRequest, NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { logAdminActivity } from '@/lib/activity-logger';

// GET /api/admin/stories - Fetch active and archived farmer mobile stories
export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'active' | 'featured' | 'expired'
    const search = (searchParams.get('search') || '').trim();

    // 1. KPI Stats
    const [statsRow] = await query<any[]>(`
      SELECT 
        COUNT(*) as totalStories,
        SUM(CASE WHEN expires_at > NOW() THEN 1 ELSE 0 END) as activeStories,
        SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featuredCount,
        SUM(views_count) as totalViews
      FROM \`stories\`
    `);

    const stats = {
      totalStories: Number(statsRow?.[0]?.totalStories ?? statsRow?.totalStories ?? 0),
      activeStories: Number(statsRow?.[0]?.activeStories ?? statsRow?.activeStories ?? 0),
      featuredCount: Number(statsRow?.[0]?.featuredCount ?? statsRow?.featuredCount ?? 0),
      totalViews: Number(statsRow?.[0]?.totalViews ?? statsRow?.totalViews ?? 0),
    };

    // 2. Filter clauses
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (filter === 'active') {
      whereClauses.push('s.expires_at > NOW()');
    } else if (filter === 'featured') {
      whereClauses.push('s.is_featured = 1');
    } else if (filter === 'expired') {
      whereClauses.push('s.expires_at <= NOW()');
    }

    if (search) {
      whereClauses.push('(s.caption LIKE ? OR u.full_name LIKE ? OR u.username LIKE ?)');
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const stories = await query<any[]>(
      `SELECT 
         s.*,
         u.full_name,
         u.username,
         u.email,
         u.avatar_url,
         u.is_verified,
         fp.farm_name,
         fp.farm_location,
         (SELECT COUNT(*) FROM \`story_views\` WHERE story_id = s.id) as receipts_count,
         (SELECT COUNT(*) FROM \`story_reactions\` WHERE story_id = s.id) as reactions_count,
         TIMESTAMPDIFF(MINUTE, NOW(), s.expires_at) as minutes_remaining
       FROM \`stories\` s
       INNER JOIN \`users\` u ON s.user_id = u.id
       LEFT JOIN \`farmer_profiles\` fp ON u.id = fp.user_id
       ${whereSql}
       ORDER BY 
         s.is_featured DESC,
         CASE WHEN s.expires_at > NOW() THEN 0 ELSE 1 END,
         s.created_at DESC`,
      params
    );

    return NextResponse.json({
      success: true,
      stories: stories || [],
      stats,
    });
  } catch (error: any) {
    console.error('Stories fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch stories' }, { status: 500 });
  }
}

// PUT /api/admin/stories - Feature or unfeature broadcast
export async function PUT(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, is_featured } = body;

    if (!id) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    await query('UPDATE `stories` SET is_featured = ? WHERE id = ?', [is_featured ? 1 : 0, id]);

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAdminActivity({
      action: is_featured ? 'Field Story Featured' : 'Field Story Unfeatured',
      detail: `Moderator ${is_featured ? 'pinned to mobile spotlight' : 'unpinned'} story #${id}`,
      type: 'system',
      user: admin.email || 'admin@localfarm.com',
      ip: clientIp,
      status: 'success'
    });

    return NextResponse.json({
      success: true,
      message: `Story #${id} is now ${is_featured ? 'featured on mobile carousel' : 'standard broadcast'}.`
    });
  } catch (error: any) {
    console.error('Story update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update story' }, { status: 500 });
  }
}

// DELETE /api/admin/stories?id=...
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '0', 10);

    if (!id) {
      return NextResponse.json({ error: 'Invalid story ID' }, { status: 400 });
    }

    await query('DELETE FROM `stories` WHERE id = ?', [id]);

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAdminActivity({
      action: 'Field Story Moderated & Removed',
      detail: `Removed 24h broadcast story #${id} for compliance`,
      type: 'security',
      user: admin.email || 'admin@localfarm.com',
      ip: clientIp,
      status: 'warning'
    });

    return NextResponse.json({ success: true, message: `Story #${id} removed successfully.` });
  } catch (error: any) {
    console.error('Story delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete story' }, { status: 500 });
  }
}
