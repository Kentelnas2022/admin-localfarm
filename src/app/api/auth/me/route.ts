import { NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, full_name, username, email, role, avatar_url, phone_number, created_at')
      .or(`id.eq.${admin.id},email.eq.${admin.email}`)
      .maybeSingle();

    const allowedAdminRoles = ['admin', 'super_admin', 'inspector', 'moderator', 'dispatcher'];
    const role = profile?.role || admin.role;

    if (!allowedAdminRoles.includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = profile || {
      id: admin.id,
      email: admin.email,
      full_name: admin.fullName,
      role: admin.role,
      username: admin.email.split('@')[0],
      avatar_url: null,
      created_at: new Date().toISOString()
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}
