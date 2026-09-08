import { supabase } from './supabase';
import { DEFAULT_MOCK_CURRICULUM, CurriculumSubject, CurriculumTopic, CurriculumSubtopic } from '../data/mockCurriculum';
import { Question } from '../types';
import { AUTHENTIC_TOPIC_QUESTIONS } from '../data/charyapadaQuestions';
import { getSubjectPriority, getCanonicalSubjectName } from './subjects';
import { getCache, setCache } from './cache';

const QUESTION_SELECT_FIELDS = 'id, question, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, subject, topic, sub_topic_id, topic_id, question_code, slug, status';
const QUESTION_WITH_RELATIONS = 'id, question, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, subject, topic, sub_topic_id, topic_id, question_code, slug, status, options(id, text, option_text, is_correct, sort_order)';

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
 * Natural comparison for topic/subtopic codes (e.g., MENTAL-1, MENTAL-2, MENTAL-10, BNG-1, BNG-2)
 * Falls back to id (numeric or string) or created_at when code is missing.
 */
export function compareTopicCodes(
  a: { code?: string | null; id?: any; created_at?: any },
  b: { code?: string | null; id?: any; created_at?: any }
): number {
  const codeA = a.code ? String(a.code).trim() : '';
  const codeB = b.code ? String(b.code).trim() : '';

  if (codeA && codeB) {
    return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
  }
  if (codeA && !codeB) return -1;
  if (!codeA && codeB) return 1;

  // If code is null/empty on both, fallback to numeric or alphanumeric ID
  const numA = Number(a.id);
  const numB = Number(b.id);
  if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
    return numA - numB;
  }

  // Fallback to created_at if available
  if (a.created_at && b.created_at) {
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (diff !== 0) return diff;
  }

  return String(a.id || '').localeCompare(String(b.id || ''), undefined, { numeric: true });
}

/**
 * Realtime subscription to the Supabase questions table.
 * Automatically notifies listeners when an admin adds, edits, or deletes questions in Supabase.
 */
export function subscribeToQuestionsRealtime(onQuestionsChange: () => void): () => void {
  if (!supabase) return () => {};

  try {
    const channelName = `realtime-questions-sync-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions',
        },
        (payload) => {
          console.log('[Supabase Realtime] Questions table change detected:', payload.eventType);
          onQuestionsChange();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('tamreen_questions_updated'));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase Realtime] Connected to questions channel');
        }
      });

    const localListener = () => {
      onQuestionsChange();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('tamreen_questions_updated', localListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('tamreen_questions_updated', localListener);
      }
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.warn('Realtime subscription setup notice:', err);
    return () => {};
  }
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
  const cached = getCache<any[]>('admin_all_questions', 300000);
  if (cached) return cached;

  const allQuestionsMap = new Map<string, any>();

  // 1. Fetch dynamically from Supabase questions table (optimized column list & reasonable limit)
  try {
    if (supabase) {
      const { data: supaQ, error } = await supabase
        .from('questions')
        .select(QUESTION_SELECT_FIELDS)
        .limit(500);

      if (!error && supaQ && Array.isArray(supaQ)) {
        supaQ.forEach((q) => {
          if (q && q.id) {
            allQuestionsMap.set(String(q.id), q);
          }
        });
      }
    }
  } catch (err) {
    console.warn('Notice fetching Supabase questions:', err);
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

  const result = Array.from(allQuestionsMap.values());
  setCache('admin_all_questions', result);
  return result;
}

/**
 * Query Supabase for subject topics & subtopics with deduplication and strict code/sequential ordering
 */
export async function getSubjectTopicsAndSubtopics(subjectId: string) {
  const cacheKey = `subject_topics_${subjectId}`;
  const cached = getCache<any[]>(cacheKey, 300000);
  if (cached) return cached;

  try {
    if (!supabase) return [];

    // Query topics ordering by code ascending, then id ascending
    const { data: flatTopics, error: flatErr } = await supabase
      .from('topics')
      .select('id, title, code, subject_id, parent_id, created_at')
      .eq('subject_id', subjectId)
      .limit(200)
      .order('code', { ascending: true, nullsFirst: false })
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
              code: t.code || null,
              created_at: t.created_at || null,
              subject_id: t.subject_id,
              parent_id: null,
              sub_topics: [],
              aliasIds: [String(t.id)],
            });
          } else {
            const existing = mainMap.get(normKey);
            existing.aliasIds.push(String(t.id));
            if (!existing.code && t.code) existing.code = t.code;
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
                  code: st.code || null,
                  created_at: st.created_at || null,
                  subject_id: st.subject_id,
                  parent_id: main.id,
                  aliasIds: [String(st.id)],
                });
              } else {
                exists.aliasIds.push(String(st.id));
                if (!exists.code && st.code) exists.code = st.code;
              }
              break;
            }
          }
        }
      });

      // Sort both main topics and subtopics
      const result = Array.from(mainMap.values()).map((main) => {
        main.sub_topics.sort(compareTopicCodes);
        return main;
      });
      result.sort(compareTopicCodes);

      setCache(cacheKey, result);
      return result;
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
 * - SORTS main topics and subtopics by 'code' in ASCENDING order (fallback to 'id' or 'created_at').
 * - Dynamic question counts per subtopic from Supabase & Admin Question Bank.
 * - Main topic totalQuestions is the exact sum of all its subtopics.
 * - If a topic/subtopic has no questions in DB, display 0 (no hardcoding).
 */
export async function fetchMockCurriculumFromSupabase(): Promise<CurriculumSubject[]> {
  const cacheKey = 'mock_curriculum_data';
  const cached = getCache<CurriculumSubject[]>(cacheKey, 300000);
  if (cached) return cached;

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

    // 2. Fetch all topics & subtopics from Supabase with explicit code and id ordering
    let supaTopics: any[] = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('topics')
        .select('id, title, code, subject_id, parent_id, created_at')
        .order('code', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true });
      if (!error && data) {
        supaTopics = data;
      }
    }

    // If Supabase returned subjects
    if (supaSubjects && supaSubjects.length > 0) {
      // Deduplicate subjects by canonical name
      const uniqueSubjectsMap = new Map<string, any>();
      supaSubjects.forEach((s) => {
        const canonicalName = getCanonicalSubjectName(s.name, s.code);
        if (!uniqueSubjectsMap.has(canonicalName)) {
          uniqueSubjectsMap.set(canonicalName, { ...s, name: canonicalName, aliasIds: [String(s.id)] });
        } else {
          uniqueSubjectsMap.get(canonicalName).aliasIds.push(String(s.id));
        }
      });

      const builtSubjects: CurriculumSubject[] = Array.from(uniqueSubjectsMap.values()).map((s) => {
        // Collect topic rows belonging to this subject (checking all alias subject IDs)
        const subjectTopicRows = supaTopics.filter((t) =>
          s.aliasIds.includes(String(t.subject_id))
        );

        // Group & DEDUPLICATE main topics (parent_id is null)
        const mainTopicMap = new Map<string, { id: string; title: string; code?: string | null; created_at?: string | null; aliasIds: string[]; childSubRows: any[] }>();

        subjectTopicRows.forEach((t) => {
          if (!t.parent_id) {
            const normTopic = normalizeTitle(t.title);
            if (!normTopic) return;
            if (!mainTopicMap.has(normTopic)) {
              mainTopicMap.set(normTopic, {
                id: String(t.id),
                title: t.title,
                code: t.code || null,
                created_at: t.created_at || null,
                aliasIds: [String(t.id)],
                childSubRows: [],
              });
            } else {
              const existing = mainTopicMap.get(normTopic)!;
              existing.aliasIds.push(String(t.id));
              if (!existing.code && t.code) existing.code = t.code;
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

        // Build structured topics with DEDUPLICATED and SORTED subtopics
        const structuredTopics: ExtendedCurriculumTopic[] = Array.from(mainTopicMap.values()).map((main) => {
          // Deduplicate subtopics by normalized title
          const subMap = new Map<string, { id: string; title: string; code?: string | null; created_at?: string | null; aliasIds: string[] }>();

          main.childSubRows.forEach((subRow) => {
            const normSub = normalizeTitle(subRow.title);
            if (!normSub) return;
            if (!subMap.has(normSub)) {
              subMap.set(normSub, {
                id: String(subRow.id),
                title: subRow.title,
                code: subRow.code || null,
                created_at: subRow.created_at || null,
                aliasIds: [String(subRow.id)],
              });
            } else {
              const existing = subMap.get(normSub)!;
              existing.aliasIds.push(String(subRow.id));
              if (!existing.code && subRow.code) existing.code = subRow.code;
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
              code: subItem.code || undefined,
              created_at: subItem.created_at || undefined,
              totalQuestions: totalQ,
              solvedQuestions: solvedQ,
            };
          });

          // Sort subtopics in ascending administrative sequence (code -> id -> created_at)
          subtopics.sort(compareTopicCodes);

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
            code: main.code || undefined,
            created_at: main.created_at || undefined,
            totalQuestions: topicTotalQuestions,
            solvedQuestions: topicSolvedQuestions,
            subtopics,
          };
        });

        // Sort main topics in ascending administrative sequence (code -> id -> created_at)
        structuredTopics.sort(compareTopicCodes);

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

      finalSubjects.sort((a, b) => {
        const pA = getSubjectPriority(a.name);
        const pB = getSubjectPriority(b.name);
        return pA - pB;
      });

      setCache(cacheKey, finalSubjects);
      return finalSubjects;
    }
  } catch (err) {
    console.error('Error fetching curriculum from Supabase:', err);
  }

  // Fallback if Supabase was completely unreachable: return deduplicated default curriculum
  const fallbackCurriculum = DEFAULT_MOCK_CURRICULUM.map((s) => ({
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

  setCache(cacheKey, fallbackCurriculum);
  return fallbackCurriculum;
}

/**
 * Fetch questions directly and dynamically from Supabase `questions` table for selected subtopics:
 * - Uses `.in('sub_topic_id', selectedSubtopicIds)` or `.in('topic_id', ...)`
 * - Selects `*, options(*)` or standard columns dynamically
 * - Realtime synchronized with Admin question bank
 */
export async function fetchQuestionsForSelectedSubtopics(
  selectedSubtopicIds: string[],
  selectedSubtopicTitles: string[] = [],
  targetCount: number = 25
): Promise<Question[]> {
  const validSubtopicIds = (selectedSubtopicIds || []).filter(
    (id) => id !== null && id !== undefined && String(id).trim() !== '' && String(id).trim() !== 'undefined' && String(id).trim() !== 'null'
  );
  const validSubtopicTitles = (selectedSubtopicTitles || []).filter(
    (title) => title !== null && title !== undefined && String(title).trim() !== '' && String(title).trim() !== 'undefined' && String(title).trim() !== 'null'
  );

  if (validSubtopicIds.length === 0 && validSubtopicTitles.length === 0) {
    return [];
  }

  const cacheKey = `subtopic_questions_${[...validSubtopicIds].sort().join('_')}_${targetCount}`;
  const cached = getCache<Question[]>(cacheKey, 300000);
  if (cached) return cached;

  try {
    const rawQuestionsMap = new Map<string, any>();

    // 1. Dynamic query to Supabase questions table with relation selection & limits
    if (supabase) {
      try {
        const queryLimit = Math.min(targetCount * 3, 100);

        // Query A: Filter by sub_topic_id with options relation
        if (validSubtopicIds.length > 0) {
          let subTopicQuestions: any[] | null = null;
          let { data: rawSubData, error: subErr } = await supabase
            .from('questions')
            .select(QUESTION_WITH_RELATIONS)
            .in('sub_topic_id', validSubtopicIds)
            .limit(queryLimit);

          if (!subErr && rawSubData) {
            subTopicQuestions = rawSubData;
          } else {
            // Fallback if 'options' is not a separate foreign table
            const fallbackRes = await supabase
              .from('questions')
              .select(QUESTION_SELECT_FIELDS)
              .in('sub_topic_id', validSubtopicIds)
              .limit(queryLimit);
            subTopicQuestions = fallbackRes.data;
          }

          if (subTopicQuestions && Array.isArray(subTopicQuestions)) {
            subTopicQuestions.forEach((q) => {
              if (q && q.id) rawQuestionsMap.set(String(q.id), q);
            });
          }

          // Query B: Filter by topic_id (when a parent topic ID or alias is selected)
          let topicIdQuestions: any[] | null = null;
          let { data: rawTopData, error: topErr } = await supabase
            .from('questions')
            .select(QUESTION_WITH_RELATIONS)
            .in('topic_id', validSubtopicIds)
            .limit(queryLimit);

          if (!topErr && rawTopData) {
            topicIdQuestions = rawTopData;
          } else {
            const fallbackRes = await supabase
              .from('questions')
              .select(QUESTION_SELECT_FIELDS)
              .in('topic_id', validSubtopicIds)
              .limit(queryLimit);
            topicIdQuestions = fallbackRes.data;
          }

          if (topicIdQuestions && Array.isArray(topicIdQuestions)) {
            topicIdQuestions.forEach((q) => {
              if (q && q.id) rawQuestionsMap.set(String(q.id), q);
            });
          }
        }

        // Query C: Also filter by topic text match for administrative flexibility
        if (validSubtopicTitles.length > 0) {
          const { data: titleQuestions } = await supabase
            .from('questions')
            .select(QUESTION_WITH_RELATIONS)
            .in('topic', validSubtopicTitles)
            .limit(queryLimit);

          if (titleQuestions && Array.isArray(titleQuestions)) {
            titleQuestions.forEach((q) => {
              if (q && q.id) rawQuestionsMap.set(String(q.id), q);
            });
          }
        }
      } catch (err) {
        console.warn('Notice querying Supabase questions for subtopics:', err);
      }
    }

    // 2. Also incorporate newly added questions from Admin cache in localStorage
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

    // 3. Format into standardized Question interface (supporting both column options & relational options table)
    let formatted: Question[] = Array.from(rawQuestionsMap.values())
      .filter((item) => item && item.status !== 'draft')
      .map((item) => {
        let optA = String(item.option_a || '');
        let optB = String(item.option_b || '');
        let optC = String(item.option_c || '');
        let optD = String(item.option_d || '');
        let corrAns = (item.correct_answer || 'option_a') as any;

        // If options come from nested options relation
        if (Array.isArray(item.options) && item.options.length >= 2) {
          const sortedOpts = [...item.options].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          if (sortedOpts[0]) optA = sortedOpts[0].text || sortedOpts[0].option_text || optA;
          if (sortedOpts[1]) optB = sortedOpts[1].text || sortedOpts[1].option_text || optB;
          if (sortedOpts[2]) optC = sortedOpts[2].text || sortedOpts[2].option_text || optC;
          if (sortedOpts[3]) optD = sortedOpts[3].text || sortedOpts[3].option_text || optD;

          const correctIdx = sortedOpts.findIndex((o) => o.is_correct || o.isCorrect);
          if (correctIdx === 0) corrAns = 'option_a';
          else if (correctIdx === 1) corrAns = 'option_b';
          else if (correctIdx === 2) corrAns = 'option_c';
          else if (correctIdx === 3) corrAns = 'option_d';
        }

        return {
          id: String(item.id),
          question_code: item.question_code ? String(item.question_code) : String(item.id),
          slug: item.slug ? String(item.slug) : String(item.id),
          question: String(item.question || item.question_text || item.title || ''),
          option_a: optA,
          option_b: optB,
          option_c: optC,
          option_d: optD,
          correct_answer: corrAns,
          explanation: item.explanation || item.explanation_text || undefined,
          subject: item.subject || 'মডেল টেস্ট',
          topic: item.topic || item.topic_title || 'টপিক প্র্যাকটিস',
        };
      })
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

    const finalList = shuffled.slice(0, targetCount);
    setCache(cacheKey, finalList);
    return finalList;
  } catch (err) {
    console.error('Error fetching questions for subtopics:', err);
    return [];
  }
}
