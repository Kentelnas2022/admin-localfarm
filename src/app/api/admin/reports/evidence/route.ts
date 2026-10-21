import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionAdmin } from '@/lib/auth';

// GET /api/admin/reports/evidence?id=...
export async function GET(request: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0', 10);

    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const reportRows = await query<any[]>('SELECT * FROM `reports` WHERE id = ?', [id]);
    if (!reportRows || reportRows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = reportRows[0];

    // Resolve reporter_id / reported_user_id by name if missing on the report row
    let reporterId = report.reporter_id;
    let reportedUserId = report.reported_user_id;

    if (!reporterId && report.reporter_name) {
      const repUsers = await query<any[]>(
        'SELECT id FROM `users` WHERE full_name LIKE ? OR username LIKE ? LIMIT 1',
        [`%${report.reporter_name.trim()}%`, `%${report.reporter_name.trim()}%`]
      );
      if (repUsers?.[0]?.id) reporterId = repUsers[0].id;
    }

    if (!reportedUserId && report.reported_user_name) {
      const accUsers = await query<any[]>(
        'SELECT id FROM `users` WHERE full_name LIKE ? OR username LIKE ? LIMIT 1',
        [`%${report.reported_user_name.trim()}%`, `%${report.reported_user_name.trim()}%`]
      );
      if (accUsers?.[0]?.id) reportedUserId = accUsers[0].id;
    }

    // Always fetch reported user's profile summary for context
    let targetUser: any = null;
    if (reportedUserId) {
      const uRows = await query<any[]>(
        `SELECT u.id, u.full_name, u.username, u.email, u.phone_number, u.avatar_url, u.status, u.is_verified, u.created_at,
                fp.farm_name, fp.crops, fp.farm_location, fp.verification_status, fp.rsbsa_number,
                (SELECT COUNT(*) FROM \`reports\` WHERE reported_user_id = u.id OR reported_user_name = u.full_name) as total_reports_received,
                (SELECT COUNT(*) FROM \`posts\` WHERE user_id = u.id) as total_posts
         FROM \`users\` u
         LEFT JOIN \`farmer_profiles\` fp ON u.id = fp.user_id
         WHERE u.id = ?`,
        [reportedUserId]
      );
      targetUser = uRows?.[0] || null;
    }

    // Chat Evidence
    if (report.report_type === 'chat') {
      let messages: any[] = [];
      let conversation: any = null;

      // Try finding messages by conversation_id first (if target_id or conversation_id is set)
      const convTargetId = report.conversation_id || report.target_id;
      if (convTargetId) {
        messages = await query<any[]>(
          `SELECT m.*, 
                  u_send.full_name as sender_name, u_send.username as sender_username, u_send.avatar_url as sender_avatar,
                  u_recv.full_name as receiver_name, u_recv.username as receiver_username, u_recv.avatar_url as receiver_avatar
           FROM \`messages\` m
           LEFT JOIN \`users\` u_send ON m.sender_id = u_send.id
           LEFT JOIN \`users\` u_recv ON m.receiver_id = u_recv.id
           WHERE m.conversation_id = ?
           ORDER BY m.created_at ASC`,
          [convTargetId]
        );
      }

      // If no messages found or target_id didn't match, search by reporter & reported user IDs
      if ((!messages || messages.length === 0) && reporterId && reportedUserId) {
        messages = await query<any[]>(
          `SELECT m.*, 
                  u_send.full_name as sender_name, u_send.username as sender_username, u_send.avatar_url as sender_avatar,
                  u_recv.full_name as receiver_name, u_recv.username as receiver_username, u_recv.avatar_url as receiver_avatar
           FROM \`messages\` m
           LEFT JOIN \`users\` u_send ON m.sender_id = u_send.id
           LEFT JOIN \`users\` u_recv ON m.receiver_id = u_recv.id
           WHERE (m.sender_id = ? AND m.receiver_id = ?)
              OR (m.sender_id = ? AND m.receiver_id = ?)
           ORDER BY m.created_at ASC`,
          [reporterId, reportedUserId, reportedUserId, reporterId]
        );
      }

      // Fallback: any recent messages sent by reportedUserId
      if ((!messages || messages.length === 0) && reportedUserId) {
        messages = await query<any[]>(
          `SELECT m.*, 
                  u_send.full_name as sender_name, u_send.username as sender_username, u_send.avatar_url as sender_avatar,
                  u_recv.full_name as receiver_name, u_recv.username as receiver_username, u_recv.avatar_url as receiver_avatar
           FROM \`messages\` m
           LEFT JOIN \`users\` u_send ON m.sender_id = u_send.id
           LEFT JOIN \`users\` u_recv ON m.receiver_id = u_recv.id
           WHERE m.sender_id = ? OR m.receiver_id = ?
           ORDER BY m.created_at ASC
           LIMIT 25`,
          [reportedUserId, reportedUserId]
        );
      }

      // Fetch conversation metadata if exists
      if (reporterId && reportedUserId) {
        const cRows = await query<any[]>(
          `SELECT * FROM \`conversations\` 
           WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
          [reporterId, reportedUserId, reportedUserId, reporterId]
        );
        conversation = cRows?.[0] || null;
      }

      return NextResponse.json({
        success: true,
        type: 'chat',
        report,
        evidence: {
          messages: messages || [],
          conversation,
          user: targetUser,
          reporter: { id: reporterId, name: report.reporter_name },
          reportedUser: { id: reportedUserId, name: report.reported_user_name }
        }
      });
    }

    // Content (Post) Evidence
    if (report.report_type === 'content') {
      let post: any = null;
      let comments: any[] = [];

      if (report.target_id) {
        const postRows = await query<any[]>(
          `SELECT p.*, u.full_name, u.username, u.email, u.avatar_url, u.is_verified
           FROM \`posts\` p
           LEFT JOIN \`users\` u ON p.user_id = u.id
           WHERE p.id = ?`,
          [report.target_id]
        );
        post = postRows?.[0] || null;
      }

      // Fallback to latest post by reported user if target_id was not set
      if (!post && reportedUserId) {
        const postRows = await query<any[]>(
          `SELECT p.*, u.full_name, u.username, u.email, u.avatar_url, u.is_verified
           FROM \`posts\` p
           LEFT JOIN \`users\` u ON p.user_id = u.id
           WHERE p.user_id = ?
           ORDER BY p.created_at DESC
           LIMIT 1`,
          [reportedUserId]
        );
        post = postRows?.[0] || null;
      }

      if (post) {
        if (!post.image_url && (post.images || post.photos)) {
          try {
            const parsed = JSON.parse(post.images || post.photos);
            if (Array.isArray(parsed) && parsed.length > 0) post.image_url = parsed[0];
          } catch {}
        }
        comments = await query<any[]>(
          `SELECT pc.*, u.full_name, u.username, u.avatar_url
           FROM \`post_comments\` pc
           LEFT JOIN \`users\` u ON pc.user_id = u.id
           WHERE pc.post_id = ?
           ORDER BY pc.created_at ASC
           LIMIT 15`,
          [post.id]
        );
      }

      return NextResponse.json({
        success: true,
        type: 'content',
        report,
        evidence: {
          post,
          comments: comments || [],
          user: targetUser,
          reportedUser: { id: reportedUserId, name: report.reported_user_name }
        }
      });
    }

    return NextResponse.json({
      success: true,
      type: 'user',
      report,
      evidence: {
        user: targetUser,
        reportedUser: { id: reportedUserId, name: report.reported_user_name }
      }
    });

  } catch (error: any) {
    console.error('GET /api/admin/reports/evidence error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch report evidence' }, { status: 500 });
  }
}
