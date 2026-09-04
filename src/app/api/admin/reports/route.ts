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
    const [statsRow] = await query<any[]>(`
      SELECT 
        COUNT(*) as totalReports,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as highRisk,
        SUM(CASE WHEN status = 'escalated' THEN 1 ELSE 0 END) as escalated
      FROM \`reports\`
    `);

    const stats = {
      totalReports: Number(statsRow?.[0]?.totalReports ?? statsRow?.totalReports ?? 0),
      pending: Number(statsRow?.[0]?.pending ?? statsRow?.pending ?? 0),
      highRisk: Number(statsRow?.[0]?.highRisk ?? statsRow?.highRisk ?? 0),
      escalated: Number(statsRow?.[0]?.escalated ?? statsRow?.escalated ?? 0),
    };

    // 2. Build filter conditions
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (filter === 'pending') {
      whereClauses.push("status = 'pending'");
    } else if (filter === 'high_risk' || filter === 'high risk') {
      whereClauses.push("(severity = 'high' OR status = 'high_risk')");
    } else if (filter === 'escalated') {
      whereClauses.push("status = 'escalated'");
    } else if (filter === 'chat') {
      whereClauses.push("report_type = 'chat'");
    } else if (filter === 'content') {
      whereClauses.push("report_type = 'content'");
    } else if (filter === 'suspended') {
      whereClauses.push("status = 'suspended'");
    } else if (filter === 'resolved') {
      whereClauses.push("status = 'resolved'");
    }

    if (search) {
      whereClauses.push(`(
        report_code LIKE ? OR 
        reporter_name LIKE ? OR 
        reported_user_name LIKE ? OR 
        reason LIKE ? OR 
        statement LIKE ? OR 
        url LIKE ?
      )`);
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total matching records
    const [countRow] = await query<any[]>(
      `SELECT COUNT(*) as filteredCount FROM \`reports\` ${whereSql}`,
      params
    );
    const totalCount = Number(countRow?.[0]?.filteredCount ?? countRow?.filteredCount ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    // Paginated reports
    const reports = await query<any[]>(
      `SELECT * FROM \`reports\` ${whereSql} ORDER BY id ASC LIMIT ? OFFSET ?`,
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

    // Generate unique report code RPT- X
    const [maxRow] = await query<any[]>('SELECT MAX(id) as maxId FROM `reports`');
    const nextId = (Number(maxRow?.[0]?.maxId ?? maxRow?.maxId ?? 0)) + 1;
    const report_code = `RPT- ${nextId}`;

    const date_reported = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    await query(
      `INSERT INTO \`reports\` 
      (report_code, reporter_id, reporter_name, reported_user_id, reported_user_name, report_type, target_id, reason, statement, date_reported, url, severity, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        report_code,
        reporter_id,
        reporter_name,
        reported_user_id,
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

// PUT /api/admin/reports - Perform moderation action (Suspend, Escalate, Dismiss, Resolve)
export async function PUT(request: NextRequest) {
  try {
    await ensureReportsTable();
    const admin = await getSessionAdmin();
    const adminEmail = admin?.email || 'admin@localfarm.com';
    const body = await request.json();
    const { id, action } = body; // action: 'suspend' | 'escalate' | 'dismiss' | 'resolve'

    if (!id || !action) {
      return NextResponse.json({ error: 'Report ID and action are required' }, { status: 400 });
    }

    const [existing] = await query<any[]>('SELECT * FROM `reports` WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    const report = existing[0] || existing;

    let newStatus = report.status;
    let logAction = '';
    let logDetail = '';

    if (action === 'suspend') {
      newStatus = 'suspended';
      logAction = 'User Suspended for Violations';
      logDetail = `Enforced suspension on user "${report.reported_user_name}" regarding report ${report.report_code} (${report.reason})`;
    } else if (action === 'escalate') {
      newStatus = 'escalated';
      logAction = 'Report Escalated';
      logDetail = `Escalated report ${report.report_code} against ${report.reported_user_name} to priority legal audit`;
    } else if (action === 'dismiss') {
      newStatus = 'dismissed';
      logAction = 'Report Dismissed';
      logDetail = `Dismissed report ${report.report_code} filed by ${report.reporter_name}`;
    } else if (action === 'resolve') {
      newStatus = 'resolved';
      logAction = 'Report Resolved';
      logDetail = `Marked report ${report.report_code} as resolved`;
    }

    await query('UPDATE `reports` SET status = ? WHERE id = ?', [newStatus, id]);

    // Record activity in MySQL admin_activity_logs
    await logAdminActivity({
      action: logAction,
      detail: logDetail,
      type: 'security',
      user: adminEmail,
      status: action === 'suspend' ? 'failed' : 'success'
    });

    return NextResponse.json({
      success: true,
      message: `Report ${report.report_code} action "${action}" executed successfully.`,
      status: newStatus
    });
  } catch (error: any) {
    console.error('PUT /api/admin/reports error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update report' }, { status: 500 });
  }
}
