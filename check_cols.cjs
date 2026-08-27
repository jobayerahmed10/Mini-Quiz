const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('questions').select('*').limit(1);
  if (error) console.error("Error:", error);
  if (data && data.length > 0) {
    console.log("Question columns:", Object.keys(data[0]));
  } else {
    console.log("No data returned or empty table.");
  }
}
run();
