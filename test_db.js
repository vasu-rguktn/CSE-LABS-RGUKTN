import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() { 
  const { data, error } = await supabase.from('faculty_subject_section').select('*').ilike('faculty_email', '%kalavathi%'); 
  console.log('Data:', data); 
  console.log('Error:', error); 
} 

run();
