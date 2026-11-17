import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfvepedmnsuwbcipfbgq.supabase.co';
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mdmVwZWRtbnN1d2JjaXBmYmdxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDg5ODc3MCwiZXhwIjoyMTEwNDc0NzcwfQ.f5SyVxrhuyWa6Pfhd_OjvejWBZXP1iEvblNzFabMYOk';

/**
 * Privileged Supabase client using the Service Role Key.
 * Use ONLY in server-side routes (/api/...) and Server Components.
 * This client bypasses Row Level Security (RLS) to perform administrative operations.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabaseAdmin;
