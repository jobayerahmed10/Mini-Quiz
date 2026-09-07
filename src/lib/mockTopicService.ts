import { supabase } from './supabase';
import { DEFAULT_MOCK_CURRICULUM, CurriculumSubject, CurriculumTopic, CurriculumSubtopic } from '../data/mockCurriculum';
import { Question } from '../types';
import { AUTHENTIC_TOPIC_QUESTIONS } from '../data/charyapadaQuestions';

const ATTEMPTED_QUESTIONS_STORAGE_KEY = 'miniquiz_attempted_question_ids';

/**
 * Get the set of question IDs attempted by the current user from localStorage
 */
export function getAttemptedQuestionIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(ATTEMPTED_QUESTIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.map((id) => String(id)));
      }
    }
  } catch {}
  return new Set();
}

/**
 * Record question IDs that the user has answered in an exam session
 */
export function recordAttemptedQuestionIds(questionIds: string[]): void {
  if (typeof window === 'undefined' || !questionIds || questionIds.length === 0) return;
  try {
    const existing = getAttemptedQuestionIds();
    questionIds.forEach((id) => {
      if (id) existing.add(String(id));
    });
    localStorage.setItem(
      ATTEMPTED_QUESTIONS_STORAGE_KEY,
      JSON.stringify(Array.from(existing))
    );
  } catch {}
}

/**
 * Query Supabase for subject topics & subtopics
 */
export async function getSubjectTopicsAndSubtopics(subjectId: string) {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select(`
        id,
        title,
        subject_id,
        parent_id,
        sub_topics:topics!parent_id (
          id,
          title,
          subject_id,
          parent_id
        )
      `)
      .eq('subject_id', subjectId)
      .is('parent_id', null);

    if (error) {
      console.error('Error fetching topics:', error);
      const { data: flatTopics, error: flatErr } = await supabase
        .from('topics')
        .select('id, title, subject_id, parent_id')
        .eq('subject_id', subjectId)
        .order('id', { ascending: true });

      if (!flatErr && flatTopics && flatTopics.length > 0) {
        const main = flatTopics.filter((t: any) => !t.parent_id);
        return main.map((m: any) => ({
          id: m.id,
          title: m.title,
          subject_id: m.subject_id,
          parent_id: m.parent_id,
          sub_topics: flatTopics.filter((st: any) => String(st.parent_id) === String(m.id)),
        }));
      }
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception in getSubjectTopicsAndSubtopics:', err);
    return [];
  }
}

export async function getTopicsWithSubtopics(subjectId: string) {
  return getSubjectTopicsAndSubtopics(subjectId);
}

/**
 * Fetch hierarchical curriculum from Supabase with dynamic question counts per subtopic and topic.
 * - Subtopic totalQuestions is fetched from Supabase questions table.
 * - Main topic totalQuestions is the exact sum of all its subtopics.
 * - Subtopic & Topic solvedQuestions are computed from user's attempted question history.
 * - Default count is 0 if no questions exist in DB (no hardcoded numbers).
 */
export async function fetchMockCurriculumFromSupabase(): Promise<CurriculumSubject[]> {
  const attemptedIds = getAttemptedQuestionIds();

  try {
    // 1. Fetch subjects from Supabase
    const { data: supaSubjects, error: sErr } = await supabase
      .from('subjects')
      .select('id, name, created_at')
      .order('id', { ascending: true });

    // 2. Fetch all topics & subtopics from Supabase
    const { data: supaTopics, error: tErr } = await supabase
      .from('topics')
      .select('id, title, subject_id, parent_id, created_at')
      .order('id', { ascending: true });

    // 3. Fetch questions metadata to calculate dynamic per-subtopic & per-topic counts
    let questionsData: any[] = [];
    try {
      const { data: qRows, error: qErr } = await supabase
        .from('questions')
        .select('id, subject_id, topic_id, sub_topic_id, topic, subject')
        .limit(10000);
      if (!qErr && qRows) {
        questionsData = qRows;
      }
    } catch {}

    // Map questions by sub_topic_id, topic_id, and topic title for fast O(1) lookup
    const qBySubTopicId = new Map<string, string[]>();
    const qByTopicId = new Map<string, string[]>();
    const qByTopicTitle = new Map<string, string[]>();

    questionsData.forEach((q) => {
      const qId = String(q.id);
      if (q.sub_topic_id) {
        const key = String(q.sub_topic_id).trim();
        const list = qBySubTopicId.get(key) || [];
        list.push(qId);
        qBySubTopicId.set(key, list);
      }
      if (q.topic_id) {
        const key = String(q.topic_id).trim();
        const list = qByTopicId.get(key) || [];
        list.push(qId);
        qByTopicId.set(key, list);
      }
      if (q.topic) {
        const key = String(q.topic).trim().toLowerCase();
        const list = qByTopicTitle.get(key) || [];
        list.push(qId);
        qByTopicTitle.set(key, list);
      }
    });

    // If Supabase returned subjects
    if (!sErr && supaSubjects && supaSubjects.length > 0) {
      const topicRows = (!tErr && supaTopics) ? supaTopics : [];

      const builtSubjects: CurriculumSubject[] = supaSubjects.map((s) => {
        // Find main topics for this subject (parent_id is null)
        const mainTopics = topicRows.filter(
          (t) => String(t.subject_id) === String(s.id) && !t.parent_id
        );

        const structuredTopics: CurriculumTopic[] = mainTopics.map((mt) => {
          // Find subtopics for this main topic (parent_id === mt.id)
          const subRows = topicRows.filter((t) => String(t.parent_id) === String(mt.id));

          const subtopics: CurriculumSubtopic[] = subRows.map((st) => {
            const stId = String(st.id);
            const stTitle = (st.title || '').trim().toLowerCase();

            // Collect all question IDs for this subtopic
            const subQIdsSet = new Set<string>([
              ...(qBySubTopicId.get(stId) || []),
              ...(qByTopicId.get(stId) || []),
              ...(qByTopicTitle.get(stTitle) || []),
            ]);

            const totalQ = subQIdsSet.size;
            let solvedQ = 0;
            subQIdsSet.forEach((qId) => {
              if (attemptedIds.has(qId)) solvedQ++;
            });

            return {
              id: stId,
              title: st.title || 'উপ-টপিক',
              totalQuestions: totalQ,
              solvedQuestions: solvedQ,
            };
          });

          // Main topic totals are strictly the sum of its child subtopics
          let topicTotalQuestions = 0;
          let topicSolvedQuestions = 0;

          if (subtopics.length > 0) {
            topicTotalQuestions = subtopics.reduce((acc, sub) => acc + sub.totalQuestions, 0);
            topicSolvedQuestions = subtopics.reduce((acc, sub) => acc + sub.solvedQuestions, 0);
          } else {
            // If main topic has no subtopics, check direct question associations
            const mtId = String(mt.id);
            const mtTitle = (mt.title || '').trim().toLowerCase();
            const directQIds = new Set<string>([
              ...(qByTopicId.get(mtId) || []),
              ...(qByTopicTitle.get(mtTitle) || []),
            ]);
            topicTotalQuestions = directQIds.size;
            directQIds.forEach((qId) => {
              if (attemptedIds.has(qId)) topicSolvedQuestions++;
            });
          }

          return {
            id: String(mt.id),
            title: mt.title || 'টপিক',
            totalQuestions: topicTotalQuestions,
            solvedQuestions: topicSolvedQuestions,
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

        const subjectTotalQ = structuredTopics.reduce((acc, t) => acc + t.totalQuestions, 0);

        return {
          id: String(s.id),
          name: s.name || 'বিষয়',
          iconType,
          totalQuestions: subjectTotalQ,
          topics: structuredTopics,
        };
      });

      // If supaSubjects were present but had no topics, fallback default topics
      const mergedSubjects = builtSubjects.map((bs) => {
        if (bs.topics.length === 0) {
          const matchDefault = DEFAULT_MOCK_CURRICULUM.find(
            (d) => d.name.includes(bs.name) || bs.name.includes(d.name)
          );
          if (matchDefault) {
            const mappedDefaultTopics = matchDefault.topics.map((dt) => ({
              ...dt,
              totalQuestions: dt.subtopics.length > 0 
                ? dt.subtopics.reduce((acc, st) => acc + (qByTopicTitle.get(st.title.toLowerCase())?.length || 0), 0)
                : (qByTopicTitle.get(dt.title.toLowerCase())?.length || 0),
              solvedQuestions: 0,
              subtopics: dt.subtopics.map((st) => ({
                ...st,
                totalQuestions: qByTopicTitle.get(st.title.toLowerCase())?.length || 0,
                solvedQuestions: 0,
              })),
            }));

            return {
              ...bs,
              topics: mappedDefaultTopics,
              totalQuestions: mappedDefaultTopics.reduce((acc, t) => acc + t.totalQuestions, 0),
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

  // Fallback if Supabase was completely unreachable
  return DEFAULT_MOCK_CURRICULUM.map((s) => ({
    ...s,
    totalQuestions: s.topics.reduce((acc, t) => acc + t.subtopics.length * 20, 0),
    topics: s.topics.map((t) => ({
      ...t,
      totalQuestions: t.subtopics.length * 20,
      solvedQuestions: 0,
      subtopics: t.subtopics.map((sub) => ({
        ...sub,
        totalQuestions: 20,
        solvedQuestions: 0,
      })),
    })),
  }));
}

/**
 * Fetch questions matching ANY of the selected sub_topic_ids from Supabase.
 * - Combines and shuffles all retrieved questions.
 * - Slices up to targetCount for the examination session.
 */
export async function fetchQuestionsForSelectedSubtopics(
  selectedSubtopicIds: string[],
  selectedSubtopicTitles: string[] = [],
  targetCount: number = 25
): Promise<Question[]> {
  if (!selectedSubtopicIds || selectedSubtopicIds.length === 0) {
    return [];
  }

  try {
    let rawQuestions: any[] = [];

    // 1. Primary: Query Supabase by sub_topic_id in selectedSubtopicIds
    const { data: subTopicQuestions, error: stErr } = await supabase
      .from('questions')
      .select('*')
      .in('sub_topic_id', selectedSubtopicIds);

    if (!stErr && subTopicQuestions && subTopicQuestions.length > 0) {
      rawQuestions.push(...subTopicQuestions);
    }

    // 2. Also check topic_id for matching IDs
    const { data: topicIdQuestions, error: tiErr } = await supabase
      .from('questions')
      .select('*')
      .in('topic_id', selectedSubtopicIds);

    if (!tiErr && topicIdQuestions && topicIdQuestions.length > 0) {
      rawQuestions.push(...topicIdQuestions);
    }

    // 3. Also check topic name matching if titles are provided
    if (selectedSubtopicTitles.length > 0) {
      const { data: titleQuestions } = await supabase
        .from('questions')
        .select('*')
        .in('topic', selectedSubtopicTitles);

      if (titleQuestions && titleQuestions.length > 0) {
        rawQuestions.push(...titleQuestions);
      }
    }

    // 4. Deduplicate raw questions by ID
    const seenIds = new Set<string>();
    const uniqueRaw: any[] = [];
    rawQuestions.forEach((item) => {
      if (item && item.id) {
        const idStr = String(item.id);
        if (!seenIds.has(idStr)) {
          seenIds.add(idStr);
          uniqueRaw.push(item);
        }
      }
    });

    // 5. Convert to standard Question objects
    let formatted: Question[] = uniqueRaw
      .filter((item) => item.status !== 'draft')
      .map((item) => ({
        id: String(item.id),
        question_code: item.question_code ? String(item.question_code) : String(item.id),
        slug: item.slug ? String(item.slug) : String(item.id),
        question: String(item.question || item.question_text || ''),
        option_a: String(item.option_a || ''),
        option_b: String(item.option_b || ''),
        option_c: String(item.option_c || ''),
        option_d: String(item.option_d || ''),
        correct_answer: (item.correct_answer || 'option_a') as any,
        explanation: item.explanation || undefined,
        subject: item.subject || 'মডেল টেস্ট',
        topic: item.topic || 'টপিক প্র্যাকটিস',
      }))
      .filter((q) => q.question && q.option_a && q.option_b);

    // If database returned fewer questions than required or 0, fallback to authentic topic questions pool
    if (formatted.length < targetCount) {
      const subTitleSet = new Set(selectedSubtopicTitles.map((t) => t.toLowerCase().trim()));
      AUTHENTIC_TOPIC_QUESTIONS.forEach((q) => {
        const qTopic = (q.topic || '').toLowerCase().trim();
        if (subTitleSet.has(qTopic) && !seenIds.has(String(q.id))) {
          seenIds.add(String(q.id));
          formatted.push(q);
        }
      });
    }

    // 6. Thoroughly shuffle questions (Fisher-Yates Shuffle)
    const shuffled = [...formatted];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, targetCount);
  } catch (err) {
    console.error('Error fetching questions for subtopics:', err);
    return [];
  }
}
