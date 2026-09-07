import { supabase } from './supabase';
import { DEFAULT_MOCK_CURRICULUM, CurriculumSubject, CurriculumTopic, CurriculumSubtopic } from '../data/mockCurriculum';

/**
 * Service to fetch subjects, topics, and subtopics from Supabase.
 * Strictly avoids displaying code/subject codes in UI, strictly Bengali titles.
 * Sorts hierarchically and in serial order.
 */

export async function fetchMockCurriculumFromSupabase(): Promise<CurriculumSubject[]> {
  try {
    // 1. Fetch subjects from Supabase
    const { data: supaSubjects, error: sErr } = await supabase
      .from('subjects')
      .select('id, name, created_at')
      .order('created_at', { ascending: true });

    // 2. Fetch topics from Supabase (parent_id: null => topic, parent_id: not null => subtopic)
    const { data: supaTopics, error: tErr } = await supabase
      .from('topics')
      .select('id, title, subject_id, parent_id, created_at')
      .order('created_at', { ascending: true });

    // If Supabase has valid subjects or topics
    if (!sErr && supaSubjects && supaSubjects.length > 0) {
      const topicRows = (!tErr && supaTopics) ? supaTopics : [];

      const builtSubjects: CurriculumSubject[] = supaSubjects.map((s) => {
        // Find main topics for this subject (parent_id is null)
        const mainTopics = topicRows.filter(
          (t) => String(t.subject_id) === String(s.id) && !t.parent_id
        );

        const structuredTopics: CurriculumTopic[] = mainTopics.map((mt) => {
          // Find subtopics for this topic (parent_id === mt.id)
          const subRows = topicRows.filter((t) => String(t.parent_id) === String(mt.id));
          const subtopics: CurriculumSubtopic[] = subRows.map((st) => ({
            id: String(st.id),
            title: st.title || 'উপ-টপিক',
            totalQuestions: 150,
            solvedQuestions: 0,
          }));

          return {
            id: String(mt.id),
            title: mt.title || 'টপিক',
            totalQuestions: subtopics.length > 0 ? subtopics.reduce((acc, sub) => acc + sub.totalQuestions, 0) : 200,
            solvedQuestions: 0,
            subtopics,
          };
        });

        // Icon lookup based on subject name
        let iconType = 'bangla';
        const nameLower = (s.name || '').toLowerCase();
        if (nameLower.includes('ইংরেজি') || nameLower.includes('english')) iconType = 'english';
        else if (nameLower.includes('বাংলাদেশ')) iconType = 'bd';
        else if (nameLower.includes('আন্তর্জাতিক')) iconType = 'intl';
        else if (nameLower.includes('বিজ্ঞান')) iconType = 'science';
        else if (nameLower.includes('কম্পিউটার') || nameLower.includes('ict')) iconType = 'ict';
        else if (nameLower.includes('গণিত')) iconType = 'math';
        else if (nameLower.includes('মানসিক')) iconType = 'mental';
        else if (nameLower.includes('নৈতিকতা')) iconType = 'ethics';
        else if (nameLower.includes('ভূগোল')) iconType = 'geo';

        return {
          id: String(s.id),
          name: s.name || 'বিষয়', // No code displayed
          iconType,
          totalQuestions: structuredTopics.reduce((acc, t) => acc + t.totalQuestions, 0) || 500,
          topics: structuredTopics,
        };
      });

      // If supaSubjects were present but had no topics, fallback default topics for matching subject names
      const mergedSubjects = builtSubjects.map((bs) => {
        if (bs.topics.length === 0) {
          const matchDefault = DEFAULT_MOCK_CURRICULUM.find(
            (d) => d.name.includes(bs.name) || bs.name.includes(d.name)
          );
          if (matchDefault) {
            return {
              ...bs,
              topics: matchDefault.topics,
              totalQuestions: matchDefault.totalQuestions,
            };
          }
        }
        return bs;
      });

      return mergedSubjects;
    }
  } catch (err) {
    console.error('Error fetching curriculum from Supabase:', err);
  }

  // If Supabase returned empty or error, use standard curriculum
  return DEFAULT_MOCK_CURRICULUM;
}
