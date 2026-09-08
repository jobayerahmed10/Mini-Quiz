const { createClient } = require('@supabase/supabase-js');

const DEFAULT_SUPABASE_URL = 'https://yedhwzcbpkrqixvpkgoc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZGh3emNicGtycWl4dnBrZ29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjA1OTIsImV4cCI6MjEwMTczNjU5Mn0.-oOgefi5RERPb3gbTC8rTYIVf6if6JWGIrz45rhZsVE';

const supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);

async function run() {
  console.log("--- Querying Supabase Database ---");

  // 1. Subjects
  const { data: subjects, error: subjErr } = await supabase.from('subjects').select('*');
  console.log(`Subjects (${subjects?.length || 0}):`, subjErr || subjects);

  // 2. Topics
  const { data: topics, error: topErr } = await supabase.from('topics').select('*');
  console.log(`Topics (${topics?.length || 0}):`, topErr || topics);

  // 3. Questions
  const { data: questions, error: qErr } = await supabase.from('questions').select('*');
  console.log(`Questions (${questions?.length || 0}):`, qErr || questions);

  // 4. Exams
  const { data: exams, error: exErr } = await supabase.from('exams').select('*');
  console.log(`Exams (${exams?.length || 0}):`, exErr || exams);
}

run();
