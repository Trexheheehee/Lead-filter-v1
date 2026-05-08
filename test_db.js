import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function test() {
  console.log('Testing campaigns fetch...');
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, templates(name, language)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching campaigns:', error);
  } else {
    console.log('Campaigns data:', JSON.stringify(data, null, 2));
  }

  console.log('\nTesting dashboard campaigns fetch...');
  const { data: d2, error: e2 } = await supabase
    .from('campaigns')
    .select('id, audience, status, created_at, sent')
    .order('created_at', { ascending: false })
    .limit(3);

  if (e2) {
    console.error('Error fetching dashboard campaigns:', e2);
  } else {
    console.log('Dashboard campaigns data:', JSON.stringify(d2, null, 2));
  }
}

test();
