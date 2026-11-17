import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSessionAdmin, signAdminToken, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAdminActivity } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  try {
    const sessionAdmin = await getSessionAdmin();
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email') || sessionAdmin?.email || 'admin@localfarm.com';

    // 1. Fetch system settings from Supabase
    const { data: settingsRow } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    const settings = settingsRow || {
      id: 1,
      system_name: 'Local Farm',
      org_name: 'Local Farm Agricultural Cooperative',
      email_address: 'admin@localfarm.com',
      contact_number: '+63 (032) 434-FARM',
      language: 'English',
      timezone: 'Asia/Manila',
      theme_preference: 'dark',
      logo_url: null,
      two_factor_auth: true,
      session_timeout_minutes: 120,
      notify_scam_reports: true,
      notify_farmer_verifications: true,
      notify_security_alerts: true,
      app_version: 'v1.0.0',
      environment: 'Production'
    };

    // 2. Fetch admin account details from profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, phone_number, role, avatar_url, created_at')
      .or(`email.eq.${emailParam},role.eq.admin`)
      .limit(1)
      .maybeSingle();

    const adminAccount = profile || {
      id: sessionAdmin?.id || 'admin-root',
      full_name: sessionAdmin?.fullName || 'System Administrator',
      email: emailParam,
      phone_number: '+63 912 345 6789',
      role: 'admin',
      avatar_url: null
    };

    // 3. Fetch activity logs from Supabase
    const { data: logRows } = await supabaseAdmin
      .from('admin_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

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

    // 4. Platform counts from Supabase
    const { count: userCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: postCount } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true });

    const { count: annCount } = await supabaseAdmin
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('is_archived', false);

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        two_factor_auth: Boolean(settings.two_factor_auth),
        notify_scam_reports: Boolean(settings.notify_scam_reports),
        notify_farmer_verifications: Boolean(settings.notify_farmer_verifications),
        notify_security_alerts: Boolean(settings.notify_security_alerts),
      },
      adminAccount,
      logs,
      stats: {
        totalUsers: userCount || 0,
        totalPosts: postCount || 0,
        totalAnnouncements: annCount || 0,
        status: 'Online',
        version: settings.app_version || 'v1.0.0',
        environment: settings.environment || 'Production',
        lastUpdated: settings.updated_at ? new Date(settings.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Nov 17, 2026'
      }
    });
  } catch (error: any) {
    console.error('GET /api/admin/settings error:', error);
    return NextResponse.json({ error: error.message || 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionAdmin = await getSessionAdmin();
    const body = await request.json();
    const { action, data, adminEmail = sessionAdmin?.email || 'admin@localfarm.com' } = body;
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // 1. SAVE GENERAL SETTINGS
    if (action === 'save_general') {
      const {
        systemName = 'LocalFarm AgroGuard Marketplace',
        orgName = 'Department of Agriculture Region X',
        emailAddress = 'admin@localfarm.com',
        contactNumber = '+63 (032) 434-FARM',
        language = 'English',
        timezone = 'Asia/Manila',
        themePreference = 'dark',
        logoUrl = null
      } = data || {};

      await supabaseAdmin
        .from('system_settings')
        .upsert({
          id: 1,
          system_name: systemName,
          org_name: orgName,
          email_address: emailAddress,
          contact_number: contactNumber,
          language,
          timezone,
          theme_preference: themePreference,
          logo_url: logoUrl,
          updated_at: new Date().toISOString()
        });

      await logAdminActivity({
        action: 'General Settings Saved',
        detail: `Updated system name to "${systemName}" and contact preferences`,
        type: 'system',
        user: adminEmail,
        ip: clientIp,
        status: 'success'
      });

      return NextResponse.json({
        success: true,
        message: 'General settings saved successfully.'
      });
    }

    // 2. UPDATE ACCOUNT SETTINGS
    if (action === 'update_account') {
      const { fullName, phoneNumber } = data || {};
      const targetEmail = adminEmail || sessionAdmin?.email || 'admin@localfarm.com';

      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (fullName) updateData.full_name = String(fullName).trim();
      if (phoneNumber !== undefined) updateData.phone_number = String(phoneNumber).trim();

      await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('email', targetEmail);

      const finalName = fullName || sessionAdmin?.fullName || 'Admin';

      await logAdminActivity({
        action: 'Admin Profile Updated',
        detail: `Updated administrator profile for ${finalName}`,
        type: 'auth',
        user: targetEmail,
        ip: clientIp,
        status: 'success'
      });

      const newPayload = {
        id: sessionAdmin?.id || 'admin-root',
        email: targetEmail,
        role: sessionAdmin?.role || 'admin',
        fullName: finalName
      };
      const newToken = signAdminToken(newPayload);

      const response = NextResponse.json({
        success: true,
        message: 'Administrator profile details updated successfully.',
        adminAccount: {
          id: sessionAdmin?.id || 'admin-root',
          full_name: finalName,
          phone_number: phoneNumber,
          email: targetEmail,
          role: sessionAdmin?.role || 'admin'
        }
      });

      response.cookies.set(TOKEN_COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60
      });

      return response;
    }

    // 3. UPDATE SECURITY SETTINGS
    if (action === 'update_security') {
      const { twoFactorAuth, sessionTimeoutMinutes } = data || {};

      await supabaseAdmin
        .from('system_settings')
        .update({
          two_factor_auth: Boolean(twoFactorAuth),
          session_timeout_minutes: Number(sessionTimeoutMinutes) || 120,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      await logAdminActivity({
        action: 'Security Policies Updated',
        detail: `Two-factor authentication set to ${twoFactorAuth ? 'Active' : 'Disabled'}, session timeout set to ${sessionTimeoutMinutes || 120} minutes`,
        type: 'security',
        user: adminEmail,
        ip: clientIp,
        status: 'success'
      });

      return NextResponse.json({
        success: true,
        message: 'Security settings updated successfully.'
      });
    }

    // 4. UPDATE NOTIFICATION PREFERENCES
    if (action === 'update_notifications') {
      const { notifyScamReports, notifyFarmerVerifications, notifySecurityAlerts } = data || {};

      await supabaseAdmin
        .from('system_settings')
        .update({
          notify_scam_reports: Boolean(notifyScamReports),
          notify_farmer_verifications: Boolean(notifyFarmerVerifications),
          notify_security_alerts: Boolean(notifySecurityAlerts),
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      await logAdminActivity({
        action: 'Notification Settings Updated',
        detail: 'Updated dispatch preferences for scam reports, farmer verifications, and security alerts',
        type: 'system',
        user: adminEmail,
        ip: clientIp,
        status: 'success'
      });

      return NextResponse.json({
        success: true,
        message: 'Notification preferences updated successfully.'
      });
    }

    // 5. CLEAR CACHE
    if (action === 'clear_cache') {
      try {
        revalidatePath('/', 'layout');
        revalidatePath('/admin/dashboard', 'layout');
      } catch (err) {
        console.warn('revalidatePath warning:', err);
      }

      await logAdminActivity({
        action: 'Cache Cleared',
        detail: 'Temporary assets and layout buffer freed',
        type: 'system',
        user: adminEmail,
        ip: clientIp,
        status: 'success'
      });

      return NextResponse.json({
        success: true,
        message: 'System cache cleared successfully.'
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/admin/settings error:', error);
    return NextResponse.json({ error: error.message || 'Settings update failed' }, { status: 500 });
  }
}
