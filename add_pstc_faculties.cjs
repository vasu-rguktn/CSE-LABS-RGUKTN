require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
globalThis.WebSocket = ws;

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cybnisojxwdhjldzmvzl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_MIebymPunpolAgJd-1Uy7w_2u_wnwn9';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addFaculties() {
  const subjects = ['23CS1181', '23CS1101', '25CS1181', '25CS1101', '26CS1181', '26CS1101'];
  const sections = ['1', '2', '3', '4', '5', '6', 'E1CSE1', 'E1AI&ML1']; // just to be safe
  
  const facultyName = 'Mr. A. Udaya Kumar, Mrs. Y. Kalavathi';
  const facultyEmail = 'uday@rguktn.ac.in, kalavathiyarrapati111@rguktn.ac.in';
  
  for (const subject_code of subjects) {
    for (const section of sections) {
        // Find existing row or insert new one
        const { data: existing, error: findErr } = await supabase
          .from('faculty_subject_section')
          .select('id')
          .eq('subject_code', subject_code)
          .eq('section', section);
          
        if (existing && existing.length > 0) {
            // Update
            for (const row of existing) {
                await supabase
                  .from('faculty_subject_section')
                  .update({ faculty_name: facultyName, faculty_email: facultyEmail })
                  .eq('id', row.id);
            }
        } else {
            // Insert
            await supabase
              .from('faculty_subject_section')
              .insert({
                subject_code,
                batch_year: 'Unknown',
                branch: 'Unknown',
                section,
                faculty_name: facultyName,
                faculty_email: facultyEmail
              });
        }
    }
  }
  
  console.log('Successfully added the faculties to PSTC subjects and labs!');
}

addFaculties().catch(console.error);
