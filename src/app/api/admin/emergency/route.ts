import { NextRequest, NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { logAdminActivity } from '@/lib/activity-logger';

// GET /api/admin/emergency - Fetch past emergency alerts & distinct farm locations
export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Recent emergency announcements
    const alerts = await query<any[]>(
      `SELECT * FROM \`announcements\` 
       WHERE priority = 'Urgent' OR category = 'Scam Alert'
       ORDER BY created_at DESC 
       LIMIT 10`
    );

    // Unique farming sectors / locations
    const locations = await query<any[]>(
      `SELECT DISTINCT farm_location FROM \`farmer_profiles\` WHERE farm_location IS NOT NULL AND farm_location != ''`
    );

    const [farmerCount] = await query<any[]>(
      'SELECT COUNT(*) as total FROM `users` WHERE role = \'user\''
    );

    return NextResponse.json({
      success: true,
      alerts: alerts || [],
      locations: (locations || []).map((l: any) => l.farm_location),
      totalFarmers: Number(farmerCount?.[0]?.total ?? farmerCount?.total ?? 0)
    });
  } catch (error: any) {
    console.error('Emergency GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch emergency data' }, { status: 500 });
  }
}

// POST /api/admin/emergency - Dispatch geo-targeted emergency alert
export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      content,
      target_location = 'All Farmers',
      calamity_type = 'Typhoon',
      priority = 'Urgent'
    } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and emergency directives are required' }, { status: 400 });
    }

    // 1. Insert into announcements
    const [maxRow] = await query<any[]>('SELECT MAX(id) as maxId FROM `announcements`');
    const nextId = (Number(maxRow?.[0]?.maxId ?? maxRow?.maxId ?? 0)) + 1;
    const slug = `ann-${nextId}-${Date.now().toString().slice(-4)}`;

    const annResult: any = await query(
      `INSERT INTO \`announcements\` 
        (slug, title, content, category, priority, target_audience, is_pinned, is_archived, reach_count, author, author_id)
       VALUES (?, ?, ?, 'General Notice', ?, ?, 1, 0, 0, 'Emergency Disaster Command', ?)`,
      [slug, title, content, priority, target_location, admin.id]
    );

    const announcementId = annResult?.insertId || nextId;

    // 2. Select targeted users to notify
    let targetUsers: any[] = [];
    if (target_location === 'All Farmers' || target_location === 'Nationwide') {
      targetUsers = await query<any[]>('SELECT id FROM `users` WHERE role = \'user\'');
    } else {
      targetUsers = await query<any[]>(
        `SELECT u.id 
         FROM \`users\` u 
         INNER JOIN \`farmer_profiles\` fp ON u.id = fp.user_id 
         WHERE fp.farm_location LIKE ?`,
        [`%${target_location}%`]
      );
      if (targetUsers.length === 0) {
        // Fallback to all if region filter matches 0
        targetUsers = await query<any[]>('SELECT id FROM `users` WHERE role = \'user\'');
      }
    }

    // 3. Dispatch notifications
    for (const u of targetUsers) {
      await query(
        `INSERT INTO \`notifications\` 
          (user_id, actor_id, type, title, content, entity_name, target_id, is_read)
         VALUES (?, ?, 'emergency', ?, ?, 'announcement', ?, 0)`,
        [u.id, admin.id, title, content, announcementId]
      );
    }

    // 4. Update reach count
    await query('UPDATE `announcements` SET reach_count = ? WHERE id = ?', [targetUsers.length, announcementId]);

    // 5. Audit log
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAdminActivity({
      action: 'Emergency Calamity Alert Dispatched',
      detail: `Sent urgent ${calamity_type} advisory "${title}" to ${targetUsers.length} farmers in ${target_location}`,
      type: 'announcements',
      user: admin.email || 'admin@localfarm.com',
      ip: clientIp,
      status: 'warning'
    });

    return NextResponse.json({
      success: true,
      message: `Emergency alert dispatched to ${targetUsers.length} farmers.`,
      dispatchedCount: targetUsers.length
    });
  } catch (error: any) {
    console.error('Emergency dispatch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch emergency alert' }, { status: 500 });
  }
}
