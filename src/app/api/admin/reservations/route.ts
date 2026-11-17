import { NextRequest, NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAdminActivity } from '@/lib/activity-logger';

// GET /api/admin/reservations - Fetch paginated harvest reservations, receipts & KPIs
export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const offset = (page - 1) * limit;
    const status = searchParams.get('status') || 'all';
    const search = (searchParams.get('search') || '').trim();

    // 1. KPI Aggregations from Supabase
    const { data: allRes } = await supabaseAdmin
      .from('harvest_reservations')
      .select('quantity, total_estimated_amount, status');

    const allList = allRes || [];
    const kpi = {
      totalReservations: allList.length,
      totalVolumeKg: allList.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0),
      totalEstimatedValue: allList.reduce((acc, r) => acc + (Number(r.total_estimated_amount) || 0), 0),
      completedCount: allList.filter(r => r.status === 'completed').length,
      readyCount: allList.filter(r => r.status === 'ready_for_pickup').length,
      pendingCount: allList.filter(r => r.status === 'pending').length,
      confirmedCount: allList.filter(r => r.status === 'confirmed').length,
      cancelledCount: allList.filter(r => r.status === 'cancelled').length,
    };

    // 2. Query reservations
    let query = supabaseAdmin
      .from('harvest_reservations')
      .select(`
        *,
        buyer:profiles!buyer_id(full_name, email, phone_number, avatar_url),
        seller:profiles!seller_id(full_name, email, phone_number, avatar_url)
      `, { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`reservation_code.ilike.%${search}%,crop_name.ilike.%${search}%,pickup_location.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: reservationRows, count, error } = await query;
    if (error) throw error;

    const totalCount = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    const reservations = (reservationRows || []).map((hr: any) => ({
      ...hr,
      buyer_name: hr.buyer?.full_name || 'Buyer',
      buyer_email: hr.buyer?.email || '',
      buyer_phone: hr.buyer?.phone_number || '',
      buyer_avatar: hr.buyer?.avatar_url || null,
      seller_name: hr.seller?.full_name || 'Seller',
      seller_email: hr.seller?.email || '',
      seller_phone: hr.seller?.phone_number || '',
      seller_avatar: hr.seller?.avatar_url || null,
      farm_name: hr.crop_name ? `${hr.crop_name} Farm` : 'Local Farm'
    }));

    return NextResponse.json({
      success: true,
      kpi,
      reservations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (error: any) {
    console.error('GET /api/admin/reservations error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch reservations' }, { status: 500 });
  }
}

// PATCH /api/admin/reservations - Update reservation status or verify weigh-in
export async function PATCH(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, action, actualWeighedQuantity, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }

    const { data: existing, error: findErr } = await supabaseAdmin
      .from('harvest_reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (findErr || !existing) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    if (action === 'complete_weighin') {
      const weighed = Number(actualWeighedQuantity) || Number(existing.quantity);
      const finalPrice = weighed * Number(existing.price_per_unit);

      const { error: updErr } = await supabaseAdmin
        .from('harvest_reservations')
        .update({
          status: 'completed',
          actual_weighed_quantity: weighed,
          final_settled_amount: finalPrice,
          seller_notes: adminNotes || existing.seller_notes,
          weighed_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updErr) throw updErr;

      await logAdminActivity({
        action: 'Reservation Verified & Completed',
        detail: `Verified receipt ${existing.reservation_code} — Weighed: ${weighed} ${existing.unit}, Settled: ₱${finalPrice.toFixed(2)}`,
        type: 'system',
        user: admin.email,
        ip: clientIp,
        status: 'success'
      });

      return NextResponse.json({
        success: true,
        message: `Reservation ${existing.reservation_code} completed and receipt stamped.`
      });
    }

    if (action === 'update_status') {
      const newStatus = body.status;
      const validStatuses = ['pending', 'confirmed', 'ready_for_pickup', 'completed', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      const { error: updErr } = await supabaseAdmin
        .from('harvest_reservations')
        .update({
          status: newStatus,
          seller_notes: adminNotes || existing.seller_notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updErr) throw updErr;

      await logAdminActivity({
        action: `Reservation Status Changed (${newStatus})`,
        detail: `Updated ${existing.reservation_code} status to ${newStatus}`,
        type: 'system',
        user: admin.email,
        ip: clientIp,
        status: 'success'
      });

      return NextResponse.json({
        success: true,
        message: `Reservation status updated to ${newStatus}.`
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('PATCH /api/admin/reservations error:', error);
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 });
  }
}
