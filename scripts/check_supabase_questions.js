import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yedhwzcbpkrqixvpkgoc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZGh3emNicGtycWl4dnBrZ29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjA1OTIsImV4cCI6MjEwMTczNjU5Mn0.-oOgefi5RERPb3gbTC8rTYIVf6if6JWGIrz45rhZsVE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkQuestions() {
  console.log('--- Checking Supabase Database ---');

  // Fetch subjects for mapping
  const { data: subjects, error: sErr } = await supabase.from('subjects').select('id, name');
  if (sErr) console.warn('Subjects fetch error:', sErr);

  const subjectMap = new Map();
  if (subjects) {
    subjects.forEach(s => subjectMap.set(String(s.id), s.name));
  }

  // Fetch topics for mapping
  const { data: topics, error: tErr } = await supabase.from('topics').select('id, title, parent_id, subject_id');
  if (tErr) console.warn('Topics fetch error:', tErr);

  const topicMap = new Map();
  if (topics) {
    topics.forEach(t => topicMap.set(String(t.id), t));
  }

  // Fetch all questions
  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, subject, topic, sub_topic, subject_id, topic_id, sub_topic_id, status, created_at');

  if (qErr) {
    console.error('Error fetching questions:', qErr);
    return;
  }

  if (!questions || questions.length === 0) {
    console.log('Result: 0 questions found in the questions table.');
    return;
  }

  console.log(`TOTAL QUESTIONS FOUND IN 'questions' TABLE: ${questions.length}`);

  const subjectCounts = {};
  const topicCounts = {};
  const subTopicCounts = {};

  questions.forEach((q, idx) => {
    // Subject mapping
    let subjName = q.subject ? String(q.subject).trim() : null;
    if (!subjName && q.subject_id) {
      subjName = subjectMap.get(String(q.subject_id)) || null;
    }
    if (!subjName) subjName = 'Uncategorized (No Subject)';
    subjectCounts[subjName] = (subjectCounts[subjName] || 0) + 1;

    // Topic mapping
    let topicName = q.topic ? String(q.topic).trim() : null;
    if (!topicName && q.topic_id) {
      topicName = topicMap.get(String(q.topic_id))?.title || null;
    }
    if (!topicName) topicName = 'Unspecified Main Topic';
    topicCounts[topicName] = (topicCounts[topicName] || 0) + 1;

    // Subtopic mapping
    let subTopicName = q.sub_topic ? String(q.sub_topic).trim() : null;
    if (!subTopicName && q.sub_topic_id) {
      subTopicName = topicMap.get(String(q.sub_topic_id))?.title || null;
    }
    if (!subTopicName) subTopicName = 'Unspecified Subtopic';

    const combined = `${topicName} -> ${subTopicName}`;
    subTopicCounts[combined] = (subTopicCounts[combined] || 0) + 1;
  });

  console.log('\n========================================');
  console.log('SUMMARY BY SUBJECT:');
  console.log('========================================');
  Object.entries(subjectCounts).forEach(([subj, count]) => {
    console.log(`• ${subj}: ${count}টি প্রশ্ন`);
  });

  console.log('\n========================================');
  console.log('SUMMARY BY TOPIC:');
  console.log('========================================');
  Object.entries(topicCounts).forEach(([top, count]) => {
    console.log(`• ${top}: ${count}টি প্রশ্ন`);
  });

  console.log('\n========================================');
  console.log('SUMMARY BY SUBTOPIC:');
  console.log('========================================');
  Object.entries(subTopicCounts).forEach(([sub, count]) => {
    console.log(`• ${sub}: ${count}টি প্রশ্ন`);
  });

  console.log('\n========================================');
  console.log('DETAILED LIST OF QUESTIONS:');
  console.log('========================================');
  questions.forEach((q, i) => {
    console.log(`[${i + 1}] ID: ${q.id} | Subject: ${q.subject || q.subject_id} | Topic: ${q.topic || q.topic_id} | SubTopic: ${q.sub_topic || q.sub_topic_id}`);
    console.log(`    Question: ${q.question ? q.question.substring(0, 60) : 'EMPTY QUESTION TEXT'}`);
  });
}

checkQuestions().catch(console.error);
