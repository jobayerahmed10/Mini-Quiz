const { createClient } = require('@supabase/supabase-js');
const DEFAULT_SUPABASE_URL = 'https://yedhwzcbpkrqixvpkgoc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZGh3emNicGtycWl4dnBrZ29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjA1OTIsImV4cCI6MjEwMTczNjU5Mn0.-oOgefi5RERPb3gbTC8rTYIVf6if6JWGIrz45rhZsVE';

const supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);

async function run() {
  const { data: allQuestions } = await supabase.from('questions').select('id, exam_id, question, subject, status');
  const counts = {};
  allQuestions?.forEach(q => {
    const eid = q.exam_id;
    counts[eid] = (counts[eid] || 0) + 1;
  });
  console.log("Questions grouped by exam_id:", counts);
  console.log("Unique non-null exam_ids in questions:", Object.keys(counts).filter(k => k !== 'null'));
}
run();
