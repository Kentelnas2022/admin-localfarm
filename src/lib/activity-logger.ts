import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface ActivityLogEntry {
  action: string;
  detail: string;
  type?: 'auth' | 'announcements' | 'system' | 'security';
  user?: string;
  ip?: string;
  status?: 'success' | 'failed' | 'warning';
}

/**
 * Centrally log administrative and security actions into Supabase admin_activity_logs
 */
export async function logAdminActivity({
  action,
  detail,
  type = 'system',
  user = 'admin@localfarm.com',
  ip = '127.0.0.1',
  status = 'success'
}: ActivityLogEntry): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        action,
        detail,
        type,
        user_email: user,
        ip,
        status
      });

    if (error) {
      console.warn('Supabase activity log warning:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error writing to admin_activity_logs:', error);
    return false;
  }
}
