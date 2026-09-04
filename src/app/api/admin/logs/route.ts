import { NextRequest, NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { logAdminActivity } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['1=1'];
    const queryParams: any[] = [];

    if (type !== 'all') {
      whereClauses.push('type = ?');
      queryParams.push(type);
    }

    if (status !== 'all') {
      whereClauses.push('status = ?');
      queryParams.push(status);
    }

    if (search.trim()) {
      whereClauses.push('(action LIKE ? OR detail LIKE ? OR user LIKE ? OR ip LIKE ?)');
      const s = `%${search.trim()}%`;
      queryParams.push(s, s, s, s);
    }

    const whereSql = whereClauses.join(' AND ');

    // Total count
    const [countRes] = await query<any[]>(
      `SELECT COUNT(*) as count FROM \`admin_activity_logs\` WHERE ${whereSql}`,
      queryParams
    );
    const totalCount = countRes?.count || 0;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    // Fetch page rows
    const logRows = await query<any[]>(
      `SELECT id, action, detail, type, user, ip, status, created_at 
        FROM \`admin_activity_logs\` 
        WHERE ${whereSql} 
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}`,
      queryParams
    );

    const logs = logRows.map(log => {
      const d = new Date(log.created_at);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      let timestamp = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${timeStr}`;
      if (isToday) {
        timestamp = `Today at ${timeStr}`;
      }

      return {
        id: log.id,
        action: log.action,
        detail: log.detail,
        type: log.type,
        user: log.user,
        ip: log.ip,
        status: log.status,
        timestamp,
        created_at: log.created_at
      };
    });

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (error: any) {
    console.error('GET /api/admin/logs error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, detail, type, user, ip, status } = body;

    if (!action || !detail) {
      return NextResponse.json({ error: 'Action and detail are required' }, { status: 400 });
    }

    const clientIp = ip || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    await logAdminActivity({
      action,
      detail,
      type: type || 'system',
      user: user || 'admin@localfarm.com',
      ip: clientIp,
      status: status || 'success'
    });

    return NextResponse.json({ success: true, message: 'Activity logged successfully' });
  } catch (error: any) {
    console.error('POST /api/admin/logs error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record log' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionAdmin = await getSessionAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    if (action === 'clear_all') {
      await query(`TRUNCATE TABLE \`admin_activity_logs\``);
      await logAdminActivity({
        action: 'Activity Logs Truncated',
        detail: 'All system audit log history was cleared by administrator',
        type: 'security',
        user: sessionAdmin?.email || 'admin@localfarm.com',
        ip: clientIp,
        status: 'warning'
      });
      return NextResponse.json({ success: true, message: 'All activity logs cleared.' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
    }

    await query(`DELETE FROM \`admin_activity_logs\` WHERE id = ?`, [id]);

    return NextResponse.json({ success: true, message: `Log #${id} deleted successfully.` });
  } catch (error: any) {
    console.error('DELETE /api/admin/logs error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete log' }, { status: 500 });
  }
}
