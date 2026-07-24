require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
globalThis.WebSocket = ws;

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cybnisojxwdhjldzmvzl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_MIebymPunpolAgJd-1Uy7w_2u_wnwn9';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  const { data, error } = await supabase
    .from('faculty_subject_section')
    .select('*')
    .eq('subject_code', '26CS1181');

  if (error) {
    console.error('Error fetching subject 26CS1181:', error);
    return;
  }
  
  console.log(`Found ${data.length} mappings for 26CS1181.`);
  console.log(data.map(d => ({ batch_year: d.batch_year, branch: d.branch, section: d.section, faculty: d.faculty_name, email: d.faculty_email })));

  const exactMatch = data.find(
    (d) =>
      d.batch_year === 'E1' &&
      d.branch === 'AI&ML' &&
      (d.section === 'E1AI&ML1' || d.section.endsWith('1'))
  );
  if (exactMatch) {
      console.log('✅ Found exact match for E1 AI&ML 1:', exactMatch.faculty_name);
  } else {
      console.log('❌ No exact match found for E1 AI&ML 1');
  }
}

verify().catch(console.error);
