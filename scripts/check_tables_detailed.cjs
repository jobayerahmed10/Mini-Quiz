const { createClient } = require('@supabase/supabase-js');

const DEFAULT_SUPABASE_URL = 'https://yedhwzcbpkrqixvpkgoc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZGh3emNicGtycWl4dnBrZ29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjA1OTIsImV4cCI6MjEwMTczNjU5Mn0.-oOgefi5RERPb3gbTC8rTYIVf6if6JWGIrz45rhZsVE';

const supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);

async function checkDetailed() {
  console.log("=== CHECKING ALL POTENTIAL QUESTION TABLES ===");

  const tablesToTry = ['questions', 'question', 'question_bank', 'mcqs', 'quiz_questions', 'options'];

  for (const table of tablesToTry) {
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact' });
    if (error) {
      console.log(`Table '${table}': ERROR -> ${error.message} (code: ${error.code})`);
    } else {
      console.log(`Table '${table}': SUCCESS -> ${data?.length || 0} rows (Total Count: ${count})`);
      if (data && data.length > 0) {
        console.log(`  Sample row from '${table}':`, data[0]);
      }
    }
  }
}

checkDetailed();
