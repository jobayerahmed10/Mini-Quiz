const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: exams, error: eError } = await supabase.from('exams').select('*').limit(1);
  console.log("Exams sample:", exams);
  const { data: questions, error: qError } = await supabase.from('questions').select('*').limit(1);
  console.log("Questions sample:", questions);
}
run();
