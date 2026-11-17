import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfvepedmnsuwbcipfbgq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mdmVwZWRtbnN1d2JjaXBmYmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4OTg3NzAsImV4cCI6MjExMDQ3NDc3MH0.Sbfq0dSgg8ZNw5E2xSWNudFbmZQ-CgCiYL-Pgnu6Stg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;
