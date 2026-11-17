import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mfvepedmnsuwbcipfbgq.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mdmVwZWRtbnN1d2JjaXBmYmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4OTg3NzAsImV4cCI6MjExMDQ3NDc3MH0.Sbfq0dSgg8ZNw5E2xSWNudFbmZQ-CgCiYL-Pgnu6Stg';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mdmVwZWRtbnN1d2JjaXBmYmdxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDg5ODc3MCwiZXhwIjoyMTEwNDc0NzcwfQ.f5SyVxrhuyWa6Pfhd_OjvejWBZXP1iEvblNzFabMYOk';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('Testing Supabase connection...');

async function testConnection() {
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

  console.log('1. Testing Anon Client auth endpoint...');
  const { data: authData, error: authError } = await anonClient.auth.getSession();
  if (authError) {
    console.error('Anon client auth error:', authError.message);
  } else {
    console.log('✅ Anon Client reachable! Session check returned:', authData);
  }

  console.log('\n2. Testing Service Role Admin Client...');
  const { data: userData, error: userError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 5 });
  if (userError) {
    console.error('Admin client error:', userError.message);
  } else {
    console.log('✅ Service Role Client authenticated successfully!');
    console.log(`Total existing auth.users found in Supabase: ${userData.users ? userData.users.length : 0}`);
  }

  console.log('\n3. Checking existing tables in public schema...');
  const { data: tableData, error: tableError } = await adminClient.from('profiles').select('count', { count: 'exact', head: true });
  if (tableError) {
    console.log(`Note on table 'profiles': ${tableError.message} (expected if schema is not yet executed in Supabase SQL editor)`);
  } else {
    console.log('✅ profiles table exists and is accessible!');
  }
}

testConnection().catch(err => {
  console.error('Unexpected connection error:', err);
});
