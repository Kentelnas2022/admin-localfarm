import { NextRequest, NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
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

    // 1. KPI Aggregations
    const [kpiRows] = await query<any[]>(`
      SELECT 
        COUNT(*) as totalReservations,
        COALESCE(SUM(quantity), 0) as totalVolumeKg,
        COALESCE(SUM(total_estimated_amount), 0) as totalEstimatedValue,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedCount,
        SUM(CASE WHEN status = 'ready_for_pickup' THEN 1 ELSE 0 END) as readyCount,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmedCount,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelledCount
      FROM \`harvest_reservations\`
    `);

    const kpi = {
      totalReservations: Number(kpiRows?.totalReservations || 0),
      totalVolumeKg: Number(kpiRows?.totalVolumeKg || 0),
      totalEstimatedValue: Number(kpiRows?.totalEstimatedValue || 0),
      completedCount: Number(kpiRows?.completedCount || 0),
      readyCount: Number(kpiRows?.readyCount || 0),
      pendingCount: Number(kpiRows?.pendingCount || 0),
      confirmedCount: Number(kpiRows?.confirmedCount || 0),
      cancelledCount: Number(kpiRows?.cancelledCount || 0),
    };

    // 2. Filter query
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (status && status !== 'all') {
      whereClauses.push('hr.status = ?');
      params.push(status);
    }

    if (search) {
      whereClauses.push(`(
        hr.reservation_code LIKE ? OR
        hr.crop_name LIKE ? OR
        hr.pickup_location LIKE ? OR
        buyer.full_name LIKE ? OR
        buyer.username LIKE ? OR
        seller.full_name LIKE ? OR
        seller.username LIKE ? OR
        fp.farm_name LIKE ?
      )`);
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total Count
    const [countRows] = await query<any[]>(
      `SELECT COUNT(*) as filteredCount 
       FROM \`harvest_reservations\` hr
       LEFT JOIN \`users\` buyer ON hr.buyer_id = buyer.id
       LEFT JOIN \`users\` seller ON hr.seller_id = seller.id
       LEFT JOIN \`farmer_profiles\` fp ON seller.id = fp.user_id
       ${whereSql}`,
      params
    );
    const totalCount = Number(countRows?.filteredCount || 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    // Data query
    const reservations = await query<any[]>(
      `SELECT 
        hr.id,
        hr.reservation_code,
        hr.post_id,
        hr.seller_id,
        hr.buyer_id,
        hr.crop_name,
        hr.quantity,
        hr.unit,
        hr.price_per_unit,
        hr.total_estimated_amount,
        hr.actual_weighed_quantity,
        hr.final_settled_amount,
        hr.harvest_date,
        hr.pickup_location,
        hr.status,
        hr.qr_token,
        hr.buyer_notes,
        hr.seller_notes,
        hr.weighed_at,
        hr.completed_at,
        hr.created_at,
        hr.updated_at,
        buyer.full_name as buyer_name,
        buyer.email as buyer_email,
        buyer.phone_number as buyer_phone,
        buyer.avatar_url as buyer_avatar,
        seller.full_name as seller_name,
        seller.email as seller_email,
        seller.phone_number as seller_phone,
        seller.avatar_url as seller_avatar,
        fp.farm_name,
        fp.farmer_code
      FROM \`harvest_reservations\` hr
      LEFT JOIN \`users\` buyer ON hr.buyer_id = buyer.id
      LEFT JOIN \`users\` seller ON hr.seller_id = seller.id
      LEFT JOIN \`farmer_profiles\` fp ON seller.id = fp.user_id
      ${whereSql}
      ORDER BY hr.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

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

    const [existing] = await query<any[]>(
      `SELECT * FROM \`harvest_reservations\` WHERE id = ?`,
      [id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    if (action === 'complete_weighin') {
      const weighed = Number(actualWeighedQuantity) || Number(existing.quantity);
      const finalPrice = weighed * Number(existing.price_per_unit);

      await query(
        `UPDATE \`harvest_reservations\`
         SET status = 'completed',
             actual_weighed_quantity = ?,
             final_settled_amount = ?,
             seller_notes = COALESCE(?, seller_notes),
             weighed_at = NOW(),
             completed_at = NOW()
         WHERE id = ?`,
        [weighed, finalPrice, adminNotes || null, id]
      );

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

      await query(
        `UPDATE \`harvest_reservations\`
         SET status = ?,
             seller_notes = COALESCE(?, seller_notes)
         WHERE id = ?`,
        [newStatus, adminNotes || null, id]
      );

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
