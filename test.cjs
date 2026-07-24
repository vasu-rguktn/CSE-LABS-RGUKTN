const supabaseUrl = 'https://cybnisojxwdhjldzmvzl.supabase.co';
const supabaseKey = 'sb_publishable_MIebymPunpolAgJd-1Uy7w_2u_wnwn9';

async function fetchDb(table, query = '') {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  });
  return res.json();
}

async function main() {
  console.log('faculty_subject_section for 26CS1181:', await fetchDb('faculty_subject_section', 'subject_code=eq.26CS1181'));
  console.log('subjects_master for 26CS1181:', await fetchDb('subjects_master', 'course_code=eq.26CS1181'));
  console.log('students_master for E1:', await fetchDb('students_master', 'engineering_year=eq.E1&limit=2'));
}
main();
