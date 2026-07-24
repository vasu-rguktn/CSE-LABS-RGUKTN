require('dotenv').config();
const ws = require('ws');
globalThis.WebSocket = ws;
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cybnisojxwdhjldzmvzl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_MIebymPunpolAgJd-1Uy7w_2u_wnwn9';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Starting migration for Unknown faculty_subject_section rows...');

  // 1. Fetch all subjects
  const { data: subjects, error: subErr } = await supabase.from('subjects_master').select('*');
  if (subErr) {
    console.error('Failed to fetch subjects_master:', subErr);
    return;
  }
  
  console.log(`Fetched ${subjects.length} subjects.`);

  // 2. Fetch mappings with Unknown batch year
  const { data: mappings, error: mapErr } = await supabase
    .from('faculty_subject_section')
    .select('*')
    .eq('batch_year', 'Unknown');
    
  if (mapErr) {
    console.error('Failed to fetch faculty_subject_section:', mapErr);
    return;
  }

  console.log(`Found ${mappings.length} mappings with Unknown batch year.`);

  // 3. Migrate each
  let updatedCount = 0;
  for (const mapping of mappings) {
    const subject = subjects.find(s => s.course_code === mapping.subject_code);
    if (!subject) {
      console.warn(`Could not find subject for code ${mapping.subject_code}, skipping...`);
      continue;
    }

    const newBatchYear = subject.engineering_year;
    const newBranch = subject.branch;
    
    // If the section is just a number (e.g., '1'), prepend year and branch
    let newSection = mapping.section;
    if (/^\d+$/.test(newSection)) {
      newSection = `${newBatchYear}${newBranch}${newSection}`;
    }

    const { error: updateErr } = await supabase
      .from('faculty_subject_section')
      .update({
        batch_year: newBatchYear,
        branch: newBranch,
        section: newSection
      })
      .eq('id', mapping.id);

    if (updateErr) {
      console.error(`Failed to update mapping ${mapping.id}:`, updateErr);
    } else {
      console.log(`Updated mapping ${mapping.id} -> ${newBatchYear} ${newBranch} ${newSection}`);
      updatedCount++;
    }
  }

  console.log(`Migration complete. Successfully updated ${updatedCount}/${mappings.length} rows.`);
}

migrate().catch(console.error);
