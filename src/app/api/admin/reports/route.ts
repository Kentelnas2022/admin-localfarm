import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionAdmin } from '@/lib/auth';
import { logAdminActivity } from '@/lib/activity-logger';

// Ensure reports table exists
async function ensureReportsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS \`reports\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`report_code\` VARCHAR(50) NOT NULL UNIQUE,
        \`reporter_id\` INT UNSIGNED NULL,
        \`reporter_name\` VARCHAR(150) NOT NULL,
        \`reported_user_id\` INT UNSIGNED NULL,
        \`reported_user_name\` VARCHAR(150) NOT NULL,
        \`report_type\` ENUM('chat', 'content', 'user') NOT NULL DEFAULT 'content',
        \`target_id\` INT UNSIGNED NULL,
        \`reason\` VARCHAR(150) NOT NULL,
        \`statement\` TEXT NOT NULL,
        \`date_reported\` VARCHAR(50) NOT NULL,
        \`url\` VARCHAR(255) NOT NULL DEFAULT 'www.link123',
        \`severity\` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
        \`status\` ENUM('pending', 'high_risk', 'escalated', 'resolved', 'dismissed', 'suspended') NOT NULL DEFAULT 'pending',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_reports_status\` (\`status\`),
        INDEX \`idx_reports_type\` (\`report_type\`),
        INDEX \`idx_reports_severity\` (\`severity\`),
        INDEX \`idx_reports_created\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (err) {
    console.error('ensureReportsTable error:', err);
  }
}

// GET /api/admin/reports - Fetch paginated reports & KPI stats
export async function GET(request: NextRequest) {
  try {
    await ensureReportsTable();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '6', 10));
    const offset = (page - 1) * limit;
    const filter = (searchParams.get('filter') || 'all').toLowerCase();
    const search = (searchParams.get('search') || '').trim();

    // 1. Overall stats for the top 4 KPI cards
    const statsRows = await query<any[]>(`
      SELECT 
        COUNT(*) as totalReports,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN severity IN ('high', 'critical') OR status = 'high_risk' THEN 1 ELSE 0 END) as highRisk,
        SUM(CASE WHEN status = 'escalated' THEN 1 ELSE 0 END) as escalated,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended
      FROM \`reports\`
    `);
    const statsRow = statsRows?.[0] || {};

    const stats = {
      totalReports: Number(statsRow.totalReports ?? 0),
      pending: Number(statsRow.pending ?? 0),
      highRisk: Number(statsRow.highRisk ?? 0),
      escalated: Number(statsRow.escalated ?? 0),
      suspended: Number(statsRow.suspended ?? 0),
    };

    // 2. Build filter conditions
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (filter === 'pending') {
      whereClauses.push("r.status = 'pending'");
    } else if (filter === 'high_risk' || filter === 'high risk') {
      whereClauses.push("(r.severity IN ('high', 'critical') OR r.status = 'high_risk')");
    } else if (filter === 'escalated') {
      whereClauses.push("r.status = 'escalated'");
    } else if (filter === 'chat') {
      whereClauses.push("r.report_type = 'chat'");
    } else if (filter === 'content') {
      whereClauses.push("r.report_type = 'content'");
    } else if (filter === 'suspended') {
      whereClauses.push("r.status = 'suspended'");
    } else if (filter === 'resolved') {
      whereClauses.push("r.status = 'resolved'");
    }

    if (search) {
      whereClauses.push(`(
        r.report_code LIKE ? OR 
        r.reporter_name LIKE ? OR 
        r.reported_user_name LIKE ? OR 
        r.reason LIKE ? OR 
        r.statement LIKE ? OR 
        r.url LIKE ?
      )`);
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total matching records
    const countRows = await query<any[]>(
      `SELECT COUNT(*) as filteredCount FROM \`reports\` r ${whereSql}`,
      params
    );
    const totalCount = Number(countRows?.[0]?.filteredCount ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    // Paginated reports with live accused user account status
    const reports = await query<any[]>(
      `SELECT 
        r.*,
        COALESCE(
          (SELECT u.status FROM users u WHERE u.id = r.reported_user_id LIMIT 1),
          (SELECT u2.status FROM users u2 WHERE u2.full_name = r.reported_user_name OR u2.username = r.reported_user_name LIMIT 1),
          CASE WHEN r.status = 'suspended' THEN 'suspended' ELSE 'active' END
        ) AS accused_user_status
       FROM \`reports\` r
       ${whereSql}
       ORDER BY CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END, r.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      reports: reports || [],
      stats,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalCount,
        totalPages,
      }
    });
  } catch (error: any) {
    console.error('GET /api/admin/reports error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch reports' }, { status: 500 });
  }
}

// POST /api/admin/reports - Submit a new report from Chat or Content
export async function POST(request: NextRequest) {
  try {
    await ensureReportsTable();
    const body = await request.json();
    const {
      reporter_id = null,
      reporter_name = 'Anonymous Farmer',
      reported_user_id = null,
      reported_user_name = 'Reported User',
      report_type = 'content', // 'chat' | 'content' | 'user'
      target_id = null,
      reason = 'Inappropriate Content',
      statement = '',
      url = 'www.link123',
      severity = 'medium',
      status = 'pending'
    } = body;

    if (!statement || !reason) {
      return NextResponse.json({ error: 'Reason and statement are required.' }, { status: 400 });
    }

    // Auto-resolve reporter_id and reported_user_id by name if not provided
    let resolvedReporterId = reporter_id;
    let resolvedReportedUserId = reported_user_id;

    if (!resolvedReporterId && reporter_name) {
      const repMatch = await query<any[]>(
        'SELECT id FROM `users` WHERE full_name LIKE ? OR username LIKE ? LIMIT 1',
        [`%${reporter_name.trim()}%`, `%${reporter_name.trim()}%`]
      );
      if (repMatch?.[0]?.id) resolvedReporterId = repMatch[0].id;
    }

    if (!resolvedReportedUserId && reported_user_name) {
      const accMatch = await query<any[]>(
        'SELECT id FROM `users` WHERE full_name LIKE ? OR username LIKE ? LIMIT 1',
        [`%${reported_user_name.trim()}%`, `%${reported_user_name.trim()}%`]
      );
      if (accMatch?.[0]?.id) resolvedReportedUserId = accMatch[0].id;
    }

    // Generate formal unique ticket code TKT-XXXX
    const maxRows = await query<any[]>('SELECT MAX(id) as maxId FROM `reports`');
    const nextId = Number(maxRows?.[0]?.maxId ?? 0) + 1;
    const report_code = `TKT-${String(nextId).padStart(4, '0')}`;

    const date_reported = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    await query(
      `INSERT INTO \`reports\` 
      (report_code, reporter_id, reporter_name, reported_user_id, reported_user_name, report_type, target_id, reason, statement, date_reported, url, severity, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        report_code,
        resolvedReporterId,
        reporter_name,
        resolvedReportedUserId,
        reported_user_name,
        report_type,
        target_id,
        reason,
        statement,
        date_reported,
        url,
        severity,
        status
      ]
    );

    // Audit log
    await logAdminActivity({
      action: 'Report Filed',
      detail: `${reporter_name} reported ${reported_user_name} on ${report_type} (${reason}) - ${report_code}`,
      type: 'security',
      user: reporter_name,
      status: 'warning'
    });

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully.',
      report_code
    });
  } catch (error: any) {
    console.error('POST /api/admin/reports error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit report' }, { status: 500 });
  }
}

// PUT /api/admin/reports - Perform moderation action (Suspend with Reason, Unsuspend, Escalate, Dismiss, Resolve, Delete Post)
export async function PUT(request: NextRequest) {
  try {
    await ensureReportsTable();
    const admin = await getSessionAdmin();
    const adminEmail = admin?.email || 'admin@localfarm.com';
    const body = await request.json();
    const {
      id,
      action,
      postId,
      suspensionReason,
      suspensionNote,
      suspensionType,
      duration
    } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Report ID and action are required' }, { status: 400 });
    }

    const existing = await query<any[]>('SELECT * FROM `reports` WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    const report = existing[0];

    let targetUserId = report.reported_user_id;
    if (!targetUserId && report.reported_user_name) {
      const matched = await query<any[]>(
        'SELECT id FROM `users` WHERE full_name LIKE ? OR username LIKE ? LIMIT 1',
        [`%${report.reported_user_name.trim()}%`, `%${report.reported_user_name.trim()}%`]
      );
      if (matched?.[0]?.id) targetUserId = matched[0].id;
    }

    let newStatus = report.status;
    let updatedReason = report.reason;
    let logAction = '';
    let logDetail = '';

    if (action === 'suspend') {
      newStatus = 'suspended';
      updatedReason = suspensionReason?.trim() || report.reason;
      const typeLabel = suspensionType === 'permanent' ? 'Permanent Suspension' : `Temporary Suspension (${duration || '7'} Days)`;
      const officialNote =
        suspensionNote?.trim() ||
        `Your account has been placed under ${typeLabel} due to confirmed violation: ${updatedReason} (Case ${report.report_code}). Please contact Municipal Agriculture Support if you wish to appeal.`;

      logAction = `User Enforcement: ${typeLabel}`;
      logDetail = `Suspended "${report.reported_user_name}" [${typeLabel}] for "${updatedReason}" (${report.report_code}): ${officialNote}`;

      // Suspend user in `users` table (by ID or name fallback)
      if (targetUserId) {
        await query("UPDATE `users` SET status = 'suspended' WHERE id = ?", [targetUserId]);
        try {
          await query(
            `INSERT INTO \`notifications\` (user_id, actor_id, type, title, content, entity_name, target_id, is_read)
             VALUES (?, ?, 'moderation', ?, ?, 'report', ?, 0)`,
            [
              targetUserId,
              admin?.id || null,
              `Account Enforcement: ${typeLabel}`,
              officialNote,
              report.id
            ]
          );
        } catch {}
      } else if (report.reported_user_name) {
        await query(
          "UPDATE `users` SET status = 'suspended' WHERE full_name = ? OR username = ?",
          [report.reported_user_name.trim(), report.reported_user_name.trim()]
        );
      }
    } else if (action === 'warning') {
      newStatus = 'resolved';
      updatedReason = suspensionReason?.trim() || report.reason;
      const warningNote =
        suspensionNote?.trim() ||
        `Official Policy Warning: You have received a formal warning regarding ${updatedReason} (Case ${report.report_code}). Continued violations will result in account suspension.`;

      logAction = 'Official Policy Warning Issued';
      logDetail = `Issued warning to "${report.reported_user_name}" for "${updatedReason}" (${report.report_code})`;

      if (targetUserId) {
        try {
          await query(
            `INSERT INTO \`notifications\` (user_id, actor_id, type, title, content, entity_name, target_id, is_read)
             VALUES (?, ?, 'moderation', ?, ?, 'report', ?, 0)`,
            [
              targetUserId,
              admin?.id || null,
              `Official Policy Warning: ${updatedReason}`,
              warningNote,
              report.id
            ]
          );
        } catch {}
      }
    } else if (action === 'unsuspend') {
      newStatus = 'resolved';
      logAction = 'User Suspension Lifted';
      logDetail = `Restored account access for "${report.reported_user_name}" regarding case ${report.report_code}`;

      if (targetUserId) {
        await query("UPDATE `users` SET status = 'active' WHERE id = ?", [targetUserId]);
        try {
          await query(
            `INSERT INTO \`notifications\` (user_id, actor_id, type, title, content, entity_name, target_id, is_read)
             VALUES (?, ?, 'moderation', 'Account Access Restored', ?, 'report', ?, 0)`,
            [
              targetUserId,
              admin?.id || null,
              `Your LocalFarm account suspension (Case ${report.report_code}) has been lifted by an administrator. Please continue to follow community guidelines.`,
              report.id
            ]
          );
        } catch {}
      } else if (report.reported_user_name) {
        await query(
          "UPDATE `users` SET status = 'active' WHERE full_name = ? OR username = ?",
          [report.reported_user_name.trim(), report.reported_user_name.trim()]
        );
      }
    } else if (action === 'delete_post') {
      newStatus = 'resolved';
      const targetPostId = postId || report.target_id;
      if (targetPostId) {
        await query('DELETE FROM `posts` WHERE id = ?', [targetPostId]);
      }
      logAction = 'Reported Post Removed & Case Resolved';
      logDetail = `Removed offending produce listing #${targetPostId || 'N/A'} and resolved report ${report.report_code} against ${report.reported_user_name}`;

      if (targetUserId) {
        try {
          await query(
            `INSERT INTO \`notifications\` (user_id, actor_id, type, title, content, entity_name, target_id, is_read)
             VALUES (?, ?, 'moderation', 'Listing Removed by Moderator', ?, 'report', ?, 0)`,
            [
              targetUserId,
              admin?.id || null,
              `Your marketplace post was removed following moderation review for "${report.reason}" (${report.report_code}).`,
              report.id
            ]
          );
        } catch {}
      }
    } else if (action === 'escalate') {
      newStatus = 'escalated';
      logAction = 'Report Escalated';
      logDetail = `Escalated report ${report.report_code} against ${report.reported_user_name} to priority review`;
    } else if (action === 'dismiss') {
      newStatus = 'dismissed';
      logAction = 'Report Dismissed';
      logDetail = `Dismissed report ${report.report_code} filed by ${report.reporter_name}`;
    } else if (action === 'resolve') {
      newStatus = 'resolved';
      logAction = 'Report Resolved';
      logDetail = `Marked report ${report.report_code} as resolved`;
    }

    await query('UPDATE `reports` SET status = ?, reason = ? WHERE id = ?', [newStatus, updatedReason, id]);

    // Notify reporter when their ticket is resolved or actioned
    if ((action === 'resolve' || action === 'suspend' || action === 'delete_post') && report.reporter_id) {
      try {
        await query(
          `INSERT INTO \`notifications\` (user_id, actor_id, type, title, content, entity_name, target_id, is_read)
           VALUES (?, ?, 'moderation', 'Report Ticket Actioned', ?, 'report', ?, 0)`,
          [
            report.reporter_id,
            admin?.id || null,
            `Thank you for keeping LocalFarm safe. Your report (${report.report_code}) has been reviewed and actioned by our moderation team.`,
            report.id
          ]
        );
      } catch {}
    }

    await logAdminActivity({
      action: logAction,
      detail: logDetail,
      type: 'security',
      user: adminEmail,
      status: action === 'suspend' ? 'warning' : 'success'
    });

    return NextResponse.json({
      success: true,
      message: `Report ${report.report_code} action "${action}" executed successfully.`,
      status: newStatus,
      reason: updatedReason,
      accused_user_status: action === 'suspend' ? 'suspended' : action === 'unsuspend' ? 'active' : undefined
    });
  } catch (error: any) {
    console.error('PUT /api/admin/reports error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update report' }, { status: 500 });
  }
}
