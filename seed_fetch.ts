const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in environment variables.");
}

async function run() {
  try {
    const payload = {
      roll_number: "n220615",
      name: "Test Student N220615",
      branch: "CSE",
      section: "A",
      engineering_year: "E3",
      semester: "Sem1",
      email_id: "n220615@rguktn.ac.in",
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/students_master`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Error ${response.status}: ${err}`);
    }
    
    console.log("Successfully added student N220615");
  } catch (error) {
    console.error("Failed to add student:", error);
  }
}

run();
