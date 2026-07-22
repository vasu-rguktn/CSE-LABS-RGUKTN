import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const payload = [{
      roll_number: "n220615",
      name: "Test Student N220615",
      branch: "CSE",
      section: "A",
      engineering_year: "E3",
      semester: "Sem1",
      email_id: "n220615@rguktn.ac.in",
    }];

    const { error } = await supabase
      .from('students_master')
      .upsert(payload, { onConflict: 'roll_number' });

    if (error) {
      throw error;
    }
    
    console.log("Successfully added student N220615");
  } catch (error) {
    console.error("Failed to add student:", error);
  }
}

run();
