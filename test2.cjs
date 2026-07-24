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
  console.log('Searching subjects for Problem Solving:', await fetchDb('subjects_master', 'subject_name=ilike.%Problem%Solving%Lab%'));
}
main();
