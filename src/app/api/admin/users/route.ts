import { NextRequest, NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { logAdminActivity } from '@/lib/activity-logger';

export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // Single user detail lookup
    if (id) {
      const userRows = await query<any[]>(
        `SELECT 
          u.id, u.first_name, u.last_name, u.full_name, u.username, u.email, 
          u.phone_number, u.gender, u.role, u.status, u.is_verified, u.avatar_url, u.created_at, u.updated_at,
          (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count,
          (SELECT COUNT(*) FROM stories WHERE user_id = u.id) as story_count,
          (SELECT COUNT(*) FROM connections WHERE (sender_id = u.id OR receiver_id = u.id) AND status = 'accepted') as connection_count
        FROM users u WHERE u.id = ?`,
        [id]
      );
      if (userRows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      let connections: any[] = [];
      let recentNotifications: any[] = [];
      try {
        connections = await query<any[]>(
          `SELECT 
            c.id, c.status, c.created_at,
            CASE WHEN c.sender_id = ? THEN u2.id ELSE u1.id END AS peer_id,
            CASE WHEN c.sender_id = ? THEN COALESCE(u2.full_name, u2.username, u2.email) ELSE COALESCE(u1.full_name, u1.username, u1.email) END AS peer_name,
            CASE WHEN c.sender_id = ? THEN u2.username ELSE u1.username END AS peer_username,
            CASE WHEN c.sender_id = ? THEN u2.email ELSE u1.email END AS peer_email
           FROM connections c
           LEFT JOIN users u1 ON c.sender_id = u1.id
           LEFT JOIN users u2 ON c.receiver_id = u2.id
           WHERE c.sender_id = ? OR c.receiver_id = ?
           ORDER BY c.id DESC LIMIT 25`,
          [id, id, id, id, id, id]
        );
      } catch {}

      try {
        recentNotifications = await query<any[]>(
          `SELECT id, type, title, content, is_read, created_at
           FROM notifications
           WHERE user_id = ?
           ORDER BY id DESC LIMIT 8`,
          [id]
        );
      } catch {}

      return NextResponse.json({
        user: {
          ...userRows[0],
          connections,
          recent_notifications: recentNotifications,
        }
      });
    }

    const search = searchParams.get('q') || '';
    const roleFilter = searchParams.get('role') || '';

    let sql = `SELECT 
      u.id, u.first_name, u.last_name, u.full_name, u.username, u.email, 
      u.phone_number, u.gender, u.role, u.status, u.is_verified, u.avatar_url, u.created_at, u.updated_at,
      (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count
    FROM users u`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (search) {
      conditions.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.username LIKE ?)');
      const wild = `%${search}%`;
      params.push(wild, wild, wild);
    }

    if (roleFilter && (roleFilter === 'admin' || roleFilter === 'user')) {
      conditions.push('u.role = ?');
      params.push(roleFilter);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY u.id DESC LIMIT 500';

    const users = await query<any[]>(sql, params);
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      first_name = '',
      last_name = '',
      full_name = '',
      username = '',
      email = '',
      phone_number = '',
      gender = 'Prefer not to say',
      role = 'user',
      status = 'active',
      password = '',
      is_farmer = false,
      farm_name = '',
      crops = '',
      farm_location = '',
      hectares = '1.0',
      rsbsa_number = '',
      certifications = '',
      verification_status = 'verified'
    } = body;

    if (!email.trim() || !password.trim() || password.trim().length < 6) {
      return NextResponse.json({ error: 'Email and password (min 6 chars) are required.' }, { status: 400 });
    }

    const existing = await query<any[]>(
      'SELECT id FROM users WHERE email = ? OR (username IS NOT NULL AND username != "" AND username = ?)',
      [email.trim(), username.trim()]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email or username is already registered.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const computedFullName = full_name.trim() || `${first_name.trim()} ${last_name.trim()}`.trim() || username.trim() || email.split('@')[0];
    const cleanRole = role === 'admin' ? 'admin' : 'user';
    const roleId = cleanRole === 'admin' ? 2 : 1;
    const cleanStatus = ['active', 'suspended', 'pending'].includes(status) ? status : 'active';
    const cleanUsername = username.trim() || email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') + Math.floor(Math.random() * 100);
    const shouldCreateFarmer = Boolean(is_farmer || farm_name.trim());
    const initialVerified = shouldCreateFarmer && verification_status === 'verified' ? 1 : 0;

    let cleanGender = 'Prefer not to say';
    if (gender) {
      const g = gender.trim().toLowerCase();
      if (g === 'male') cleanGender = 'Male';
      else if (g === 'female') cleanGender = 'Female';
      else if (g === 'other') cleanGender = 'Other';
    }

    const result: any = await query(
      `INSERT INTO users (first_name, last_name, full_name, username, email, password, password_hash, phone_number, gender, role, role_id, status, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name.trim() || computedFullName.split(' ')[0] || 'Farmer',
        last_name.trim() || computedFullName.split(' ').slice(1).join(' ') || '',
        computedFullName,
        cleanUsername,
        email.trim(),
        hashedPassword,
        hashedPassword,
        phone_number.trim() || null,
        cleanGender,
        cleanRole,
        roleId,
        cleanStatus,
        initialVerified
      ]
    );

    const newUserId = result.insertId;

    if (shouldCreateFarmer && newUserId) {
      const farmerCode = `FAR-${String(1000 + Number(newUserId))}`;
      const cleanVerStatus = ['verified', 'pending', 'rejected'].includes(verification_status) ? verification_status : 'verified';
      await query(
        `INSERT INTO farmer_profiles (user_id, farmer_code, farm_name, crops, farm_location, hectares, yield_trend, verification_status, certifications, rsbsa_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newUserId,
          farmerCode,
          farm_name.trim() || `${computedFullName} Farm`,
          crops.trim() || 'Mixed Vegetables, Rice',
          farm_location.trim() || 'San Jose, Nueva Ecija',
          parseFloat(String(hectares)) || 1.5,
          '+10% YoY',
          cleanVerStatus,
          certifications.trim() || 'RSBSA Registered',
          rsbsa_number.trim() || null
        ]
      );
    }

    const newUserRows = await query<any[]>(
      `SELECT u.id, u.first_name, u.last_name, u.full_name, u.username, u.email, u.phone_number, u.gender, u.role, u.status, u.is_verified, u.avatar_url, u.created_at, u.updated_at, 0 as post_count
       FROM users u WHERE u.id = ?`,
      [newUserId]
    );

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAdminActivity({
      action: shouldCreateFarmer ? 'New Farmer Account Registered' : 'New User Account Created',
      detail: `Created ${shouldCreateFarmer ? 'accredited farmer' : cleanRole} account "${computedFullName}" (${email.trim()})`,
      type: 'system',
      user: admin.email || 'admin@localfarm.com',
      ip: clientIp,
      status: 'success'
    });

    return NextResponse.json({
      success: true,
      message: shouldCreateFarmer ? 'Farmer user & accreditation dossier created.' : 'User account created successfully.',
      user: newUserRows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('User create error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      id, 
      first_name, 
      last_name, 
      full_name, 
      username, 
      email, 
      phone_number, 
      gender, 
      role, 
      status,
      avatar_url,
      new_password 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    // Password validation if provided
    let hashedPassword: string | null = null;
    if (new_password && new_password.trim()) {
      if (new_password.trim().length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
      }
      hashedPassword = await bcrypt.hash(new_password.trim(), 10);
    }

    // Check uniqueness of email and username
    const existing = await query<any[]>(
      'SELECT id, email, username FROM users WHERE (email = ? OR (username IS NOT NULL AND username = ?)) AND id != ?',
      [email.trim(), username?.trim() || '', id]
    );

    if (existing.length > 0) {
      if (existing[0].email?.toLowerCase() === email.trim().toLowerCase()) {
        return NextResponse.json({ error: 'This email is already in use by another user.' }, { status: 400 });
      }
      if (username && existing[0].username?.toLowerCase() === username.trim().toLowerCase()) {
        return NextResponse.json({ error: 'This username is already in use.' }, { status: 400 });
      }
    }

    const computedFullName = full_name?.trim() || `${first_name?.trim() || ''} ${last_name?.trim() || ''}`.trim() || null;
    const cleanRole = role === 'admin' ? 'admin' : 'user';
    const roleId = cleanRole === 'admin' ? 2 : 1;
    const cleanStatus = ['active', 'suspended', 'pending'].includes(status) ? status : 'active';

    // Normalize gender to match MySQL ENUM('Male','Female','Other','Prefer not to say')
    let cleanGender: string | null = null;
    if (gender) {
      const g = gender.trim().toLowerCase();
      if (g === 'male') cleanGender = 'Male';
      else if (g === 'female') cleanGender = 'Female';
      else if (g === 'other') cleanGender = 'Other';
      else if (g === 'prefer not to say') cleanGender = 'Prefer not to say';
    }

    if (hashedPassword) {
      await query(
        `UPDATE users 
         SET first_name = ?, last_name = ?, full_name = ?, username = ?, 
             email = ?, phone_number = ?, gender = ?, role = ?, role_id = ?, status = ?,
             avatar_url = ?, password = ?, password_hash = ?, updated_at = NOW() 
         WHERE id = ?`,
        [
          first_name?.trim() || null,
          last_name?.trim() || null,
          computedFullName,
          username?.trim() || null,
          email.trim(),
          phone_number?.trim() || null,
          cleanGender,
          cleanRole,
          roleId,
          cleanStatus,
          avatar_url?.trim() || null,
          hashedPassword,
          hashedPassword,
          id
        ]
      );
    } else {
      await query(
        `UPDATE users 
         SET first_name = ?, last_name = ?, full_name = ?, username = ?, 
             email = ?, phone_number = ?, gender = ?, role = ?, role_id = ?, status = ?,
             avatar_url = ?, updated_at = NOW() 
         WHERE id = ?`,
        [
          first_name?.trim() || null,
          last_name?.trim() || null,
          computedFullName,
          username?.trim() || null,
          email.trim(),
          phone_number?.trim() || null,
          cleanGender,
          cleanRole,
          roleId,
          cleanStatus,
          avatar_url?.trim() || null,
          id
        ]
      );
    }

    // Fetch updated user
    const updated = await query<any[]>(
      `SELECT 
        u.id, u.first_name, u.last_name, u.full_name, u.username, u.email, 
        u.phone_number, u.gender, u.role, u.status, u.is_verified, u.avatar_url, u.created_at, u.updated_at,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count
       FROM users u WHERE u.id = ?`,
      [id]
    );

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAdminActivity({
      action: 'User Account Updated',
      detail: `Administrator updated profile for user #${id} (${computedFullName || email})${hashedPassword ? ' with new password' : ''} (Role: ${cleanRole}, Status: ${cleanStatus})`,
      type: 'system',
      user: admin.email || 'admin@localfarm.com',
      ip: clientIp,
      status: 'success'
    });

    return NextResponse.json({ 
      success: true, 
      message: hashedPassword ? 'User and password updated successfully.' : 'User updated successfully.', 
      user: updated[0] 
    });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '0', 10);

    if (!id) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (id === admin.id) {
      return NextResponse.json({ error: 'You cannot delete your own admin account.' }, { status: 400 });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAdminActivity({
      action: 'User Account Deleted',
      detail: `Permanently removed user account record #${id}`,
      type: 'security',
      user: admin.email || 'admin@localfarm.com',
      ip: clientIp,
      status: 'warning'
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('User delete error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, user_id, title, content, connection_id } = body;
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    if (action === 'send_notification') {
      if (!user_id || !title?.trim() || !content?.trim()) {
        return NextResponse.json({ error: 'User ID, title, and message content are required.' }, { status: 400 });
      }

      const result: any = await query(
        `INSERT INTO notifications (user_id, actor_id, type, title, content, entity_name, is_read)
         VALUES (?, ?, 'admin_advisory', ?, ?, 'LocalFarm Admin', 0)`,
        [user_id, admin.id, title.trim(), content.trim()]
      );

      await logAdminActivity({
        action: 'Direct Advisory Sent to User',
        detail: `Sent in-app notification "${title.trim()}" to user #${user_id}`,
        type: 'system',
        user: admin.email || 'admin@localfarm.com',
        ip: clientIp,
        status: 'success'
      });

      return NextResponse.json({
        success: true,
        notification: {
          id: result.insertId,
          type: 'admin_advisory',
          title: title.trim(),
          content: content.trim(),
          is_read: 0,
          created_at: new Date().toISOString()
        }
      });
    }

    if (action === 'approve_connection' && connection_id) {
      await query(`UPDATE connections SET status = 'accepted' WHERE id = ?`, [connection_id]);
      await logAdminActivity({
        action: 'Farmer Connection Approved',
        detail: `Approved farmer peer connection #${connection_id}`,
        type: 'system',
        user: admin.email || 'admin@localfarm.com',
        ip: clientIp,
        status: 'success'
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'remove_connection' && connection_id) {
      await query(`DELETE FROM connections WHERE id = ?`, [connection_id]);
      await logAdminActivity({
        action: 'Farmer Connection Removed',
        detail: `Removed farmer peer connection #${connection_id}`,
        type: 'security',
        user: admin.email || 'admin@localfarm.com',
        ip: clientIp,
        status: 'warning'
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('User PATCH error:', error);
    return NextResponse.json({ error: 'Failed to process user action' }, { status: 500 });
  }
}

