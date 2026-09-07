import { supabase } from './supabase';
import { DEFAULT_MOCK_CURRICULUM, CurriculumSubject, CurriculumTopic, CurriculumSubtopic } from '../data/mockCurriculum';
import { Question } from '../types';
import { AUTHENTIC_TOPIC_QUESTIONS } from '../data/charyapadaQuestions';

const ATTEMPTED_QUESTIONS_STORAGE_KEY = 'miniquiz_attempted_question_ids';

/**
 * Normalizes title strings for strict deduplication
 */
export function normalizeTitle(title: string | undefined | null): string {
  if (!title) return '';
  return title
    .trim()
    .toLowerCase()
    .replace(/[\s\-_–—,;:।.'"/\\()（）[\]{}]+/g, ' ')
    .trim();
}

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
 * Retrieve questions from all sources (Supabase questions table + LocalStorage Admin cache)
 */
export async function getAllAvailableAdminQuestions(): Promise<any[]> {
  const allQuestionsMap = new Map<string, any>();

  // 1. Fetch from Supabase questions table
  try {
    if (supabase) {
      const { data: supaQ, error } = await supabase
        .from('questions')
        .select('*')
        .limit(15000);

      if (!error && supaQ && Array.isArray(supaQ)) {
        supaQ.forEach((q) => {
          if (q && q.id) {
            allQuestionsMap.set(String(q.id), q);
          }
        });
      }
    }
  } catch (err) {
    console.warn('Error fetching Supabase questions:', err);
  }

  // 2. Read from localStorage admin question bank / question cache
  if (typeof window !== 'undefined') {
    try {
      const rawCache = localStorage.getItem('miniquiz_questions_cache');
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (Array.isArray(parsed)) {
          parsed.forEach((q: any) => {
            if (q && q.id) {
              const qId = String(q.id);
              if (!allQuestionsMap.has(qId)) {
                allQuestionsMap.set(qId, q);
              }
            }
          });
        }
      }
    } catch {}

    try {
      const rawAdminQ = localStorage.getItem('miniquiz_admin_questions');
      if (rawAdminQ) {
        const parsed = JSON.parse(rawAdminQ);
        if (Array.isArray(parsed)) {
          parsed.forEach((q: any) => {
            if (q && q.id) {
              const qId = String(q.id);
              if (!allQuestionsMap.has(qId)) {
                allQuestionsMap.set(qId, q);
              }
            }
          });
        }
      }
    } catch {}
  }

  return Array.from(allQuestionsMap.values());
}

/**
 * Query Supabase for subject topics & subtopics with deduplication
 */
export async function getSubjectTopicsAndSubtopics(subjectId: string) {
  try {
    if (!supabase) return [];
    const { data: flatTopics, error: flatErr } = await supabase
      .from('topics')
      .select('id, title, subject_id, parent_id')
      .eq('subject_id', subjectId)
      .order('id', { ascending: true });

    if (!flatErr && flatTopics && flatTopics.length > 0) {
      // Deduplicate main topics
      const mainMap = new Map<string, any>();
      flatTopics.forEach((t: any) => {
        if (!t.parent_id) {
          const normKey = normalizeTitle(t.title);
          if (!mainMap.has(normKey)) {
            mainMap.set(normKey, {
              id: t.id,
              title: t.title,
              subject_id: t.subject_id,
              parent_id: null,
              sub_topics: [],
              aliasIds: [String(t.id)],
            });
          } else {
            mainMap.get(normKey).aliasIds.push(String(t.id));
          }
        }
      });

      // Attach and deduplicate subtopics
      flatTopics.forEach((st: any) => {
        if (st.parent_id) {
          // Find matching main topic either by parent_id or alias
          for (const main of mainMap.values()) {
            if (main.aliasIds.includes(String(st.parent_id))) {
              const normSubKey = normalizeTitle(st.title);
              const exists = main.sub_topics.find((s: any) => normalizeTitle(s.title) === normSubKey);
              if (!exists) {
                main.sub_topics.push({
                  id: st.id,
                  title: st.title,
                  subject_id: st.subject_id,
                  parent_id: main.id,
                  aliasIds: [String(st.id)],
                });
              } else {
                exists.aliasIds.push(String(st.id));
              }
              break;
            }
          }
        }
      });

      return Array.from(mainMap.values());
    }
    return [];
  } catch (err) {
    console.error('Exception in getSubjectTopicsAndSubtopics:', err);
    return [];
  }
}

export async function getTopicsWithSubtopics(subjectId: string) {
  return getSubjectTopicsAndSubtopics(subjectId);
}

/**
 * Extended subtopic with alias IDs for query matching
 */
export interface ExtendedCurriculumSubtopic extends CurriculumSubtopic {
  aliasIds?: string[];
}

export interface ExtendedCurriculumTopic extends CurriculumTopic {
  aliasIds?: string[];
  subtopics: ExtendedCurriculumSubtopic[];
}

/**
 * Fetch hierarchical curriculum from Supabase & Admin Question Bank:
 * - DEDUPLICATES topics and subtopics so each unique title appears strictly ONCE.
 * - Dynamic question counts per subtopic from Supabase & Admin Question Bank.
 * - Main topic totalQuestions is the exact sum of all its subtopics.
 * - If a topic/subtopic has no questions in DB, display 0 (no hardcoding).
 */
export async function fetchMockCurriculumFromSupabase(): Promise<CurriculumSubject[]> {
  const attemptedIds = getAttemptedQuestionIds();
  const allAdminQuestions = await getAllAvailableAdminQuestions();

  // Index questions by sub_topic_id, topic_id, and normalized topic/subtopic title
  const qBySubTopicId = new Map<string, string[]>();
  const qByTopicId = new Map<string, string[]>();
  const qByNormalizedTitle = new Map<string, string[]>();

  allAdminQuestions.forEach((q) => {
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
      const norm = normalizeTitle(q.topic);
      if (norm) {
        const list = qByNormalizedTitle.get(norm) || [];
        list.push(qId);
        qByNormalizedTitle.set(norm, list);
      }
    }
    if (q.sub_topic) {
      const norm = normalizeTitle(q.sub_topic);
      if (norm) {
        const list = qByNormalizedTitle.get(norm) || [];
        list.push(qId);
        qByNormalizedTitle.set(norm, list);
      }
    }
  });

  try {
    // 1. Fetch subjects from Supabase
    let supaSubjects: any[] = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, created_at')
        .order('id', { ascending: true });
      if (!error && data) {
        supaSubjects = data;
      }
    }

    // 2. Fetch all topics & subtopics from Supabase
    let supaTopics: any[] = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('topics')
        .select('id, title, subject_id, parent_id, created_at')
        .order('id', { ascending: true });
      if (!error && data) {
        supaTopics = data;
      }
    }

    // If Supabase returned subjects
    if (supaSubjects && supaSubjects.length > 0) {
      // Deduplicate subjects by normalized name
      const uniqueSubjectsMap = new Map<string, any>();
      supaSubjects.forEach((s) => {
        const normName = normalizeTitle(s.name);
        if (!uniqueSubjectsMap.has(normName)) {
          uniqueSubjectsMap.set(normName, { ...s, aliasIds: [String(s.id)] });
        } else {
          uniqueSubjectsMap.get(normName).aliasIds.push(String(s.id));
        }
      });

      const builtSubjects: CurriculumSubject[] = Array.from(uniqueSubjectsMap.values()).map((s) => {
        // Collect topic rows belonging to this subject (checking all alias subject IDs)
        const subjectTopicRows = supaTopics.filter((t) =>
          s.aliasIds.includes(String(t.subject_id))
        );

        // Group & DEDUPLICATE main topics (parent_id is null)
        const mainTopicMap = new Map<string, { id: string; title: string; aliasIds: string[]; childSubRows: any[] }>();

        subjectTopicRows.forEach((t) => {
          if (!t.parent_id) {
            const normTopic = normalizeTitle(t.title);
            if (!normTopic) return;
            if (!mainTopicMap.has(normTopic)) {
              mainTopicMap.set(normTopic, {
                id: String(t.id),
                title: t.title,
                aliasIds: [String(t.id)],
                childSubRows: [],
              });
            } else {
              mainTopicMap.get(normTopic)!.aliasIds.push(String(t.id));
            }
          }
        });

        // Collect child subtopics for each main topic
        subjectTopicRows.forEach((st) => {
          if (st.parent_id) {
            // Find which main topic owns this subtopic
            for (const main of mainTopicMap.values()) {
              if (main.aliasIds.includes(String(st.parent_id))) {
                main.childSubRows.push(st);
                break;
              }
            }
          }
        });

        // Build structured topics with DEDUPLICATED subtopics
        const structuredTopics: ExtendedCurriculumTopic[] = Array.from(mainTopicMap.values()).map((main) => {
          // Deduplicate subtopics by normalized title
          const subMap = new Map<string, { id: string; title: string; aliasIds: string[] }>();

          main.childSubRows.forEach((subRow) => {
            const normSub = normalizeTitle(subRow.title);
            if (!normSub) return;
            if (!subMap.has(normSub)) {
              subMap.set(normSub, {
                id: String(subRow.id),
                title: subRow.title,
                aliasIds: [String(subRow.id)],
              });
            } else {
              subMap.get(normSub)!.aliasIds.push(String(subRow.id));
            }
          });

          // Compute questions count for each unique subtopic
          const subtopics: ExtendedCurriculumSubtopic[] = Array.from(subMap.values()).map((subItem) => {
            const subQIdsSet = new Set<string>();

            // Match by subtopic IDs (including all duplicates/aliases)
            subItem.aliasIds.forEach((subId) => {
              (qBySubTopicId.get(subId) || []).forEach((qid) => subQIdsSet.add(qid));
              (qByTopicId.get(subId) || []).forEach((qid) => subQIdsSet.add(qid));
            });

            // Match by normalized title
            const normSub = normalizeTitle(subItem.title);
            (qByNormalizedTitle.get(normSub) || []).forEach((qid) => subQIdsSet.add(qid));

            const totalQ = subQIdsSet.size;
            let solvedQ = 0;
            subQIdsSet.forEach((qId) => {
              if (attemptedIds.has(qId)) solvedQ++;
            });

            return {
              id: subItem.id,
              aliasIds: subItem.aliasIds,
              title: subItem.title,
              totalQuestions: totalQ,
              solvedQuestions: solvedQ,
            };
          });

          // Main topic totals = sum of subtopics (or direct questions if no subtopics)
          let topicTotalQuestions = 0;
          let topicSolvedQuestions = 0;

          if (subtopics.length > 0) {
            topicTotalQuestions = subtopics.reduce((acc, sub) => acc + sub.totalQuestions, 0);
            topicSolvedQuestions = subtopics.reduce((acc, sub) => acc + sub.solvedQuestions, 0);
          } else {
            const topicQIdsSet = new Set<string>();
            main.aliasIds.forEach((tId) => {
              (qByTopicId.get(tId) || []).forEach((qid) => topicQIdsSet.add(qid));
            });
            const normTopic = normalizeTitle(main.title);
            (qByNormalizedTitle.get(normTopic) || []).forEach((qid) => topicQIdsSet.add(qid));

            topicTotalQuestions = topicQIdsSet.size;
            topicQIdsSet.forEach((qId) => {
              if (attemptedIds.has(qId)) topicSolvedQuestions++;
            });
          }

          return {
            id: main.id,
            aliasIds: main.aliasIds,
            title: main.title,
            totalQuestions: topicTotalQuestions,
            solvedQuestions: topicSolvedQuestions,
            subtopics,
          };
        });

        // Subject Icon lookup
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

      // If a subject had 0 topics from Supabase, merge clean default curriculum without duplicates
      const finalSubjects = builtSubjects.map((bs) => {
        if (bs.topics.length === 0) {
          const matchDefault = DEFAULT_MOCK_CURRICULUM.find(
            (d) => normalizeTitle(d.name) === normalizeTitle(bs.name)
          );
          if (matchDefault) {
            const mappedDefaultTopics = matchDefault.topics.map((dt) => {
              const subtopics = dt.subtopics.map((st) => {
                const normSt = normalizeTitle(st.title);
                const qIds = qByNormalizedTitle.get(normSt) || [];
                return {
                  ...st,
                  totalQuestions: qIds.length,
                  solvedQuestions: 0,
                };
              });
              const topicQ = subtopics.reduce((acc, st) => acc + st.totalQuestions, 0);
              return {
                ...dt,
                totalQuestions: topicQ,
                solvedQuestions: 0,
                subtopics,
              };
            });

            return {
              ...bs,
              topics: mappedDefaultTopics,
              totalQuestions: mappedDefaultTopics.reduce((acc, t) => acc + t.totalQuestions, 0),
            };
          }
        }
        return bs;
      });

      return finalSubjects;
    }
  } catch (err) {
    console.error('Error fetching curriculum from Supabase:', err);
  }

  // Fallback if Supabase was completely unreachable: return deduplicated default curriculum
  return DEFAULT_MOCK_CURRICULUM.map((s) => ({
    ...s,
    topics: s.topics.map((t) => ({
      ...t,
      subtopics: t.subtopics.map((sub) => {
        const normSub = normalizeTitle(sub.title);
        const qList = qByNormalizedTitle.get(normSub) || [];
        return {
          ...sub,
          totalQuestions: qList.length,
          solvedQuestions: 0,
        };
      }),
    })),
  })).map((s) => ({
    ...s,
    totalQuestions: s.topics.reduce((acc, t) => acc + t.subtopics.reduce((sa, st) => sa + st.totalQuestions, 0), 0),
    topics: s.topics.map((t) => ({
      ...t,
      totalQuestions: t.subtopics.reduce((sa, st) => sa + st.totalQuestions, 0),
    })),
  }));
}

/**
 * Fetch questions matching ANY of the selected sub_topic_ids or titles from:
 * 1. Supabase database questions table
 * 2. Admin Question Bank / cache
 * 3. Authentic topic questions pool
 * Combines and shuffles all retrieved questions.
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
    const rawQuestionsMap = new Map<string, any>();

    // 1. Fetch from Supabase by sub_topic_id or topic_id
    if (supabase) {
      try {
        const { data: subTopicQuestions } = await supabase
          .from('questions')
          .select('*')
          .in('sub_topic_id', selectedSubtopicIds);

        if (subTopicQuestions && Array.isArray(subTopicQuestions)) {
          subTopicQuestions.forEach((q) => {
            if (q && q.id) rawQuestionsMap.set(String(q.id), q);
          });
        }

        const { data: topicIdQuestions } = await supabase
          .from('questions')
          .select('*')
          .in('topic_id', selectedSubtopicIds);

        if (topicIdQuestions && Array.isArray(topicIdQuestions)) {
          topicIdQuestions.forEach((q) => {
            if (q && q.id) rawQuestionsMap.set(String(q.id), q);
          });
        }

        if (selectedSubtopicTitles.length > 0) {
          const { data: titleQuestions } = await supabase
            .from('questions')
            .select('*')
            .in('topic', selectedSubtopicTitles);

          if (titleQuestions && Array.isArray(titleQuestions)) {
            titleQuestions.forEach((q) => {
              if (q && q.id) rawQuestionsMap.set(String(q.id), q);
            });
          }
        }
      } catch (err) {
        console.warn('Error querying Supabase for exam questions:', err);
      }
    }

    // 2. Fetch from Admin Question Bank / localStorage cache
    const allAdminQuestions = await getAllAvailableAdminQuestions();
    const selectedIdSet = new Set(selectedSubtopicIds.map((id) => String(id).trim()));
    const selectedNormTitles = new Set(selectedSubtopicTitles.map((t) => normalizeTitle(t)));

    allAdminQuestions.forEach((q) => {
      if (!q || !q.id) return;
      const qId = String(q.id);
      if (rawQuestionsMap.has(qId)) return;

      const qSubId = q.sub_topic_id ? String(q.sub_topic_id).trim() : '';
      const qTopicId = q.topic_id ? String(q.topic_id).trim() : '';
      const qTopicNorm = normalizeTitle(q.topic);
      const qSubTopicNorm = normalizeTitle(q.sub_topic);

      if (
        (qSubId && selectedIdSet.has(qSubId)) ||
        (qTopicId && selectedIdSet.has(qTopicId)) ||
        (qTopicNorm && selectedNormTitles.has(qTopicNorm)) ||
        (qSubTopicNorm && selectedNormTitles.has(qSubTopicNorm))
      ) {
        rawQuestionsMap.set(qId, q);
      }
    });

    // 3. Convert to standardized Question format
    let formatted: Question[] = Array.from(rawQuestionsMap.values())
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

    // 4. Fallback to Authentic Topic Questions pool if database count is small
    if (formatted.length < targetCount) {
      AUTHENTIC_TOPIC_QUESTIONS.forEach((q) => {
        const qNorm = normalizeTitle(q.topic);
        if (selectedNormTitles.has(qNorm) && !rawQuestionsMap.has(String(q.id))) {
          rawQuestionsMap.set(String(q.id), q);
          formatted.push(q);
        }
      });
    }

    // 5. Fisher-Yates Shuffle
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
