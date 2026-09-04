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
          u.phone_number, u.gender, u.role, u.avatar_url, u.created_at, u.updated_at,
          (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count,
          (SELECT COUNT(*) FROM stories WHERE user_id = u.id) as story_count,
          (SELECT COUNT(*) FROM connections WHERE (sender_id = u.id OR receiver_id = u.id) AND status = 'accepted') as connection_count
        FROM users u WHERE u.id = ?`,
        [id]
      );
      if (userRows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ user: userRows[0] });
    }

    const search = searchParams.get('q') || '';
    const roleFilter = searchParams.get('role') || '';

    let sql = `SELECT 
      u.id, u.first_name, u.last_name, u.full_name, u.username, u.email, 
      u.phone_number, u.gender, u.role, u.avatar_url, u.created_at, u.updated_at,
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

    if (hashedPassword) {
      await query(
        `UPDATE users 
         SET first_name = ?, last_name = ?, full_name = ?, username = ?, 
             email = ?, phone_number = ?, gender = ?, role = ?, 
             avatar_url = ?, password = ?, updated_at = NOW() 
         WHERE id = ?`,
        [
          first_name?.trim() || null,
          last_name?.trim() || null,
          computedFullName,
          username?.trim() || null,
          email.trim(),
          phone_number?.trim() || null,
          gender || null,
          cleanRole,
          avatar_url?.trim() || null,
          hashedPassword,
          id
        ]
      );
    } else {
      await query(
        `UPDATE users 
         SET first_name = ?, last_name = ?, full_name = ?, username = ?, 
             email = ?, phone_number = ?, gender = ?, role = ?, 
             avatar_url = ?, updated_at = NOW() 
         WHERE id = ?`,
        [
          first_name?.trim() || null,
          last_name?.trim() || null,
          computedFullName,
          username?.trim() || null,
          email.trim(),
          phone_number?.trim() || null,
          gender || null,
          cleanRole,
          avatar_url?.trim() || null,
          id
        ]
      );
    }

    // Fetch updated user
    const updated = await query<any[]>(
      `SELECT 
        u.id, u.first_name, u.last_name, u.full_name, u.username, u.email, 
        u.phone_number, u.gender, u.role, u.avatar_url, u.created_at, u.updated_at,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count
       FROM users u WHERE u.id = ?`,
      [id]
    );

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAdminActivity({
      action: 'User Account Updated',
      detail: `Administrator updated profile for user #${id} (${computedFullName || email})${hashedPassword ? ' with new password' : ''} (Role: ${cleanRole})`,
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
