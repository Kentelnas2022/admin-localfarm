import { query } from '@/lib/db';

export interface ActivityLogEntry {
  action: string;
  detail: string;
  type?: 'auth' | 'announcements' | 'system' | 'security';
  user?: string;
  ip?: string;
  status?: 'success' | 'failed' | 'warning';
}

/**
 * Centrally log administrative and security actions into MySQL admin_activity_logs
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
    await query(
      `INSERT INTO \`admin_activity_logs\` (action, detail, type, user, ip, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [action, detail, type, user, ip, status]
    );
    return true;
  } catch (error) {
    console.error('Error writing to admin_activity_logs:', error);
    return false;
  }
}
