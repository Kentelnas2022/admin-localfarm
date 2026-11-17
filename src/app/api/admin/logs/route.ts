import { NextRequest, NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
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

    let query = supabaseAdmin
      .from('admin_activity_logs')
      .select('*', { count: 'exact' });

    if (type !== 'all') {
      query = query.eq('type', type);
    }
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    if (search.trim()) {
      const s = search.trim();
      query = query.or(`action.ilike.%${s}%,detail.ilike.%${s}%,user_email.ilike.%${s}%,ip.ilike.%${s}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: logRows, count, error } = await query;
    if (error) throw error;

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    const logs = (logRows || []).map((log: any) => {
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
        user: log.user_email || log.user || 'admin@localfarm.com',
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
      const { error } = await supabaseAdmin
        .from('admin_activity_logs')
        .delete()
        .neq('id', 0);
      if (error) throw error;

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

    const { error } = await supabaseAdmin
      .from('admin_activity_logs')
      .delete()
      .eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: `Log #${id} deleted successfully.` });
  } catch (error: any) {
    console.error('DELETE /api/admin/logs error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete log' }, { status: 500 });
  }
}
