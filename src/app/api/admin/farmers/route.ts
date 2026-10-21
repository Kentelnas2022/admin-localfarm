import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionAdmin } from '@/lib/auth';
import { logAdminActivity } from '@/lib/activity-logger';
import bcrypt from 'bcryptjs';

// POST /api/admin/farmers - Register a new farmer account or attach an accreditation dossier to an existing user
export async function POST(request: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      full_name = '',
      email = '',
      username = '',
      phone_number = '',
      password = 'password123',
      farm_name = '',
      crops = '',
      farm_location = '',
      hectares = '1.5',
      rsbsa_number = '',
      certifications = 'RSBSA Registered, PhilGAP Applicant',
      verification_status = 'verified'
    } = body;

    if (!email.trim() || !farm_name.trim()) {
      return NextResponse.json({ error: 'Farmer email and farm name are required.' }, { status: 400 });
    }

    const cleanStatus = ['verified', 'pending', 'rejected'].includes(verification_status) ? verification_status : 'verified';
    const isVerifiedInt = cleanStatus === 'verified' ? 1 : 0;

    // Check if user already exists by email
    const existingUsers = await query<any[]>('SELECT id, full_name FROM `users` WHERE email = ? LIMIT 1', [email.trim()]);
    let targetUserId: number;
    const computedName = full_name.trim() || existingUsers?.[0]?.full_name || email.split('@')[0];

    if (existingUsers && existingUsers.length > 0) {
      targetUserId = existingUsers[0].id;
      await query('UPDATE `users` SET is_verified = ?, status = "active" WHERE id = ?', [isVerifiedInt, targetUserId]);
    } else {
      const hashedPassword = await bcrypt.hash(password.trim() || 'password123', 10);
      const cleanUsername = username.trim() || email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') + Math.floor(Math.random() * 100);
      const nameParts = computedName.split(' ');
      const uRes: any = await query(
        `INSERT INTO \`users\` (first_name, last_name, full_name, username, email, password, password_hash, phone_number, gender, role, role_id, status, is_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Prefer not to say', 'user', 1, 'active', ?)`,
        [
          nameParts[0] || 'Farmer',
          nameParts.slice(1).join(' ') || '',
          computedName,
          cleanUsername,
          email.trim(),
          hashedPassword,
          hashedPassword,
          phone_number.trim() || null,
          isVerifiedInt
        ]
      );
      targetUserId = uRes.insertId;
    }

    const farmerCode = `FAR-${String(1000 + Number(targetUserId))}`;

    // Upsert farmer_profiles
    const existingFp = await query<any[]>('SELECT id FROM `farmer_profiles` WHERE user_id = ? LIMIT 1', [targetUserId]);
    if (existingFp && existingFp.length > 0) {
      await query(
        `UPDATE \`farmer_profiles\`
         SET farm_name = ?, crops = ?, farm_location = ?, hectares = ?, verification_status = ?, certifications = ?, rsbsa_number = ?
         WHERE user_id = ?`,
        [
          farm_name.trim(),
          crops.trim() || 'Mixed Vegetables, Rice',
          farm_location.trim() || 'Nueva Ecija',
          parseFloat(String(hectares)) || 1.5,
          cleanStatus,
          certifications.trim() || 'RSBSA Registered',
          rsbsa_number.trim() || null,
          targetUserId
        ]
      );
    } else {
      await query(
        `INSERT INTO \`farmer_profiles\` (user_id, farmer_code, farm_name, crops, farm_location, hectares, yield_trend, verification_status, certifications, rsbsa_number)
         VALUES (?, ?, ?, ?, ?, ?, '+12% YoY', ?, ?, ?)`,
        [
          targetUserId,
          farmerCode,
          farm_name.trim(),
          crops.trim() || 'Mixed Vegetables, Rice',
          farm_location.trim() || 'Nueva Ecija',
          parseFloat(String(hectares)) || 1.5,
          cleanStatus,
          certifications.trim() || 'RSBSA Registered',
          rsbsa_number.trim() || null
        ]
      );
    }

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAdminActivity({
      action: 'Farmer Profile Registered',
      detail: `Registered farmer "${computedName}" (${farm_name.trim()}, Status: ${cleanStatus})`,
      type: 'system',
      user: admin.email || 'admin@localfarm.com',
      ip: clientIp,
      status: 'success'
    });

    return NextResponse.json({
      success: true,
      message: `Farmer "${computedName}" (${farm_name.trim()}) registered successfully.`
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/admin/farmers error:', error);
    return NextResponse.json({ error: error.message || 'Failed to register farmer' }, { status: 500 });
  }
}

// GET /api/admin/farmers - Fetch paginated farmer accreditation profiles & statistics
export async function GET(request: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const offset = (page - 1) * limit;
    const status = (searchParams.get('status') || 'all').toLowerCase();
    const search = (searchParams.get('search') || '').trim();

    // 1. Overall verification stats
    const [statsRow] = await query<any[]>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM \`farmer_profiles\`
    `);

    const stats = {
      total: Number(statsRow?.[0]?.total ?? statsRow?.total ?? 0),
      pending: Number(statsRow?.[0]?.pending ?? statsRow?.pending ?? 0),
      verified: Number(statsRow?.[0]?.verified ?? statsRow?.verified ?? 0),
      rejected: Number(statsRow?.[0]?.rejected ?? statsRow?.rejected ?? 0),
    };

    // 2. Query conditions
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (status === 'pending') {
      whereClauses.push("fp.verification_status = 'pending'");
    } else if (status === 'verified') {
      whereClauses.push("fp.verification_status = 'verified'");
    } else if (status === 'rejected') {
      whereClauses.push("fp.verification_status = 'rejected'");
    }

    if (search) {
      whereClauses.push(`(
        u.full_name LIKE ? OR 
        u.email LIKE ? OR 
        u.username LIKE ? OR 
        fp.farm_name LIKE ? OR 
        fp.farmer_code LIKE ? OR 
        fp.crops LIKE ? OR 
        fp.farm_location LIKE ? OR 
        fp.certifications LIKE ? OR
        fp.rsbsa_number LIKE ?
      )`);
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total filtered records
    const [countRow] = await query<any[]>(
      `SELECT COUNT(*) as filteredCount 
       FROM \`farmer_profiles\` fp 
       INNER JOIN \`users\` u ON fp.user_id = u.id 
       ${whereSql}`,
      params
    );
    const totalCount = Number(countRow?.[0]?.filteredCount ?? countRow?.filteredCount ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    // Fetch records
    const farmers = await query<any[]>(
      `SELECT 
         fp.id,
         fp.user_id,
         fp.farmer_code,
         fp.farm_name,
         fp.crops,
         fp.farm_location,
         fp.hectares,
         fp.yield_trend,
         fp.verification_status,
         fp.certifications,
         fp.rsbsa_number,
         fp.document_uri,
         fp.created_at,
         fp.updated_at,
         u.full_name,
         u.username,
         u.email,
         u.phone_number,
         u.avatar_url,
         u.is_verified,
         u.status as user_status,
         (SELECT COUNT(*) FROM \`posts\` WHERE \`user_id\` = u.id) as total_posts
       FROM \`farmer_profiles\` fp
       INNER JOIN \`users\` u ON fp.user_id = u.id
       ${whereSql}
       ORDER BY 
         CASE WHEN fp.verification_status = 'pending' THEN 0 ELSE 1 END,
         fp.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      farmers: farmers || [],
      stats,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalCount,
        totalPages,
      }
    });
  } catch (error: any) {
    console.error('GET /api/admin/farmers error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch farmers' }, { status: 500 });
  }
}

// PUT /api/admin/farmers - Approve, reject, or reset farmer accreditation
export async function PUT(request: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, reason = '' } = body; // action: 'verify' | 'reject' | 'reset'

    if (!id || !action) {
      return NextResponse.json({ error: 'Farmer profile ID and action are required' }, { status: 400 });
    }

    // Lookup profile
    const profiles = await query<any[]>(
      `SELECT fp.*, u.full_name, u.email 
       FROM \`farmer_profiles\` fp 
       INNER JOIN \`users\` u ON fp.user_id = u.id 
       WHERE fp.id = ?`,
      [id]
    );

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ error: 'Farmer profile not found' }, { status: 404 });
    }

    const farmer = profiles[0];
    const userId = farmer.user_id;
    let newStatus = farmer.verification_status;
    let newIsVerified = farmer.is_verified;
    let logAction = '';
    let logDetail = '';
    let notifTitle = '';
    let notifContent = '';

    if (action === 'verify') {
      newStatus = 'verified';
      newIsVerified = 1;
      logAction = 'Farmer Profile Verified';
      logDetail = `Administrator accredited farmer "${farmer.full_name}" (${farmer.farm_name}, Code: ${farmer.farmer_code})`;
      notifTitle = '✅ Producer Accreditation Approved';
      notifContent = `Congratulations! Your farm accreditation for "${farmer.farm_name}" has been approved by the Department of Agriculture. You have received the verified producer badge.`;
    } else if (action === 'reject') {
      newStatus = 'rejected';
      newIsVerified = 0;
      logAction = 'Farmer Accreditation Rejected';
      logDetail = `Administrator rejected accreditation for "${farmer.full_name}" (${farmer.farm_name}). Note: ${reason || 'Incomplete credentials'}`;
      notifTitle = '⚠️ Accreditation Update';
      notifContent = `Your farm accreditation request for "${farmer.farm_name}" requires attention. Reason: ${reason || 'Provided certification documents could not be verified. Please update your profile.'}`;
    } else if (action === 'reset') {
      newStatus = 'pending';
      newIsVerified = 0;
      logAction = 'Farmer Accreditation Reset to Pending';
      logDetail = `Administrator reset accreditation status for "${farmer.full_name}" to pending audit`;
    }

    // Update farmer_profiles & users
    await query('UPDATE `farmer_profiles` SET verification_status = ? WHERE id = ?', [newStatus, id]);
    await query('UPDATE `users` SET is_verified = ? WHERE id = ?', [newIsVerified, userId]);

    // Send in-app notification to the mobile farmer user
    if (notifTitle) {
      await query(
        `INSERT INTO \`notifications\` 
         (user_id, actor_id, type, title, content, entity_name, target_id, is_read) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [userId, admin.id, 'verification', notifTitle, notifContent, 'farmer_profile', id]
      );
    }

    // Audit log in admin_activity_logs
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAdminActivity({
      action: logAction,
      detail: logDetail,
      type: 'system',
      user: admin.email || 'admin@localfarm.com',
      ip: clientIp,
      status: action === 'verify' ? 'success' : action === 'reject' ? 'warning' : 'success'
    });

    return NextResponse.json({
      success: true,
      message: `Farmer "${farmer.full_name}" is now marked as ${newStatus}.`,
      verification_status: newStatus,
      is_verified: newIsVerified
    });
  } catch (error: any) {
    console.error('PUT /api/admin/farmers error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update farmer profile' }, { status: 500 });
  }
}
