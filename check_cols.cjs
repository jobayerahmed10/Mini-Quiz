const { createClient } = require('@supabase/supabase-js');
const DEFAULT_SUPABASE_URL = 'https://yedhwzcbpkrqixvpkgoc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZGh3emNicGtycWl4dnBrZ29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjA1OTIsImV4cCI6MjEwMTczNjU5Mn0.-oOgefi5RERPb3gbTC8rTYIVf6if6JWGIrz45rhZsVE';

const supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('questions').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else if (data && data.length > 0) {
    console.log("Question columns:", Object.keys(data[0]));
  } else {
    console.log("No data returned or empty table.");
  }
}
run();
