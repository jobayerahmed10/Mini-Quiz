import { supabase } from './supabase';
import { DEFAULT_MOCK_CURRICULUM, CurriculumSubject, CurriculumTopic, CurriculumSubtopic } from '../data/mockCurriculum';
import { Question } from '../types';
import { AUTHENTIC_TOPIC_QUESTIONS } from '../data/charyapadaQuestions';
import { getSubjectPriority, getCanonicalSubjectName, getIconType } from './subjects';
import { getCache, setCache, invalidateAllQuestionCaches } from './cache';

const QUESTION_SELECT_FIELDS = '*';
const QUESTION_WITH_RELATIONS = '*, options(id, text, option_text, is_correct, sort_order)';

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
 * Realtime subscription to the Supabase questions, topics, sub_topics, and subjects tables.
 * Automatically invalidates caches and notifies listeners when an admin adds, edits, or deletes records in Supabase.
 */
export function subscribeToQuestionsRealtime(onQuestionsChange: () => void): () => void {
  const localListener = () => {
    invalidateAllQuestionCaches();
    onQuestionsChange();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('tamreen_questions_updated', localListener);
    window.addEventListener('tamreen_data_changed', localListener);
  }

  if (!supabase) {
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('tamreen_questions_updated', localListener);
        window.removeEventListener('tamreen_data_changed', localListener);
      }
    };
  }

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
          invalidateAllQuestionCaches();
          onQuestionsChange();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('tamreen_questions_updated'));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topics',
        },
        () => {
          invalidateAllQuestionCaches();
          onQuestionsChange();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sub_topics',
        },
        () => {
          invalidateAllQuestionCaches();
          onQuestionsChange();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase Realtime] Connected to questions channel');
        }
      });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('tamreen_questions_updated', localListener);
        window.removeEventListener('tamreen_data_changed', localListener);
      }
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.warn('Realtime subscription setup notice:', err);
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('tamreen_questions_updated', localListener);
        window.removeEventListener('tamreen_data_changed', localListener);
      }
    };
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
        .order('created_at', { ascending: false })
        .limit(2000);

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
 * Check if two subject strings refer to the same subject
 */
export function isSubjectMatch(subjectA?: string, subjectB?: string): boolean {
  if (!subjectA || !subjectB) return false;
  const a = normalizeTitle(subjectA);
  const b = normalizeTitle(subjectB);
  if (a === b) return true;
  if (getCanonicalSubjectName(subjectA) === getCanonicalSubjectName(subjectB)) return true;
  if (
    (a.includes('english') || a.includes('ইংরেজি') || a.includes('grammar')) &&
    (b.includes('english') || b.includes('ইংরেজি') || b.includes('grammar'))
  ) {
    const isLitA = a.includes('lit') || a.includes('সাহিত্য');
    const isLitB = b.includes('lit') || b.includes('সাহিত্য');
    if (isLitA !== isLitB) return false;
    return true;
  }
  return a.includes(b) || b.includes(a);
}

/**
 * Helper to stem basic English grammar words (singular/plural/common suffixes)
 */
function stemWord(word: string): string {
  if (!word) return '';
  let w = word.toLowerCase().trim();
  w = w.replace(/(?:es|s|ing|ed|tion|tions)$/i, '');
  return w;
}

/**
 * Check if a question topic/subtopic title matches a target topic/subtopic title accurately
 */
export function isTopicOrSubtopicMatch(titleA?: string, titleB?: string): boolean {
  if (!titleA || !titleB) return false;
  const a = normalizeTitle(titleA);
  const b = normalizeTitle(titleB);
  if (!a || !b) return false;
  if (a === b) return true;

  // Exact stem matching for singular/plural (e.g. "preposition" vs "prepositions", "noun" vs "nouns")
  const aClean = a.replace(/[\s\-_]+/g, '');
  const bClean = b.replace(/[\s\-_]+/g, '');
  if (aClean === bClean) return true;
  if (stemWord(aClean) === stemWord(bClean) && stemWord(aClean).length >= 3) return true;

  // Split compound titles separated by &, and, +, / (e.g. "Prepositions & Conjunctions" -> ["prepositions", "conjunctions"])
  const splitCompounds = (str: string): string[] => {
    return str
      .split(/\s*(?:&|\band\b|\+|\/|,)\s*/i)
      .map((p) => normalizeTitle(p))
      .filter((p) => p.length >= 2);
  };

  const aParts = splitCompounds(titleA);
  const bParts = splitCompounds(titleB);

  // If one is compound and the other matches one of the compound items
  for (const ap of aParts) {
    for (const bp of bParts) {
      if (ap === bp) return true;
      const apStem = stemWord(ap.replace(/[\s\-_]+/g, ''));
      const bpStem = stemWord(bp.replace(/[\s\-_]+/g, ''));
      if (apStem && bpStem && apStem === bpStem && apStem.length >= 3) return true;
    }
  }

  // Prevent false matches like "Parts of Speech" matching "Interchange of parts of speech"
  const aIsSpecificModifier = a.includes('interchange') || a.includes('transformation') || a.includes('comparison');
  const bIsSpecificModifier = b.includes('interchange') || b.includes('transformation') || b.includes('comparison');
  if (aIsSpecificModifier !== bIsSpecificModifier) {
    return false;
  }

  return false;
}

/**
 * Fetch hierarchical curriculum from Supabase & Admin Question Bank:
 * - DEDUPLICATES topics and subtopics so each unique title appears strictly ONCE.
 * - SORTS main topics and subtopics by 'code' in ASCENDING order (fallback to 'id' or 'created_at').
 * - Dynamic question counts per subtopic from Supabase & Admin Question Bank.
 * - Main topic totalQuestions is the exact sum of all its subtopics.
 * - Dynamically incorporates new topics/subtopics added to questions table.
 */
export async function fetchMockCurriculumFromSupabase(): Promise<CurriculumSubject[]> {
  const cacheKey = 'mock_curriculum_data_v4';
  const cached = getCache<CurriculumSubject[]>(cacheKey, 300000);
  if (cached) return cached;

  const attemptedIds = getAttemptedQuestionIds();
  const allAdminQuestions = await getAllAvailableAdminQuestions();

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

    // Prepare unified subjects map (from Supabase subjects + DEFAULT_MOCK_CURRICULUM)
    const uniqueSubjectsMap = new Map<string, any>();

    if (supaSubjects && supaSubjects.length > 0) {
      supaSubjects.forEach((s) => {
        const canonicalName = getCanonicalSubjectName(s.name, s.code);
        if (!uniqueSubjectsMap.has(canonicalName)) {
          uniqueSubjectsMap.set(canonicalName, { ...s, name: canonicalName, aliasIds: [String(s.id)] });
        } else {
          uniqueSubjectsMap.get(canonicalName).aliasIds.push(String(s.id));
        }
      });
    }

    // Ensure default curriculum subjects are present so all standard subjects and topics are available
    DEFAULT_MOCK_CURRICULUM.forEach((d) => {
      const canonicalName = getCanonicalSubjectName(d.name);
      if (!uniqueSubjectsMap.has(canonicalName)) {
        uniqueSubjectsMap.set(canonicalName, {
          id: d.id,
          name: canonicalName,
          aliasIds: [d.id],
          defaultTopics: d.topics,
        });
      }
    });

    const builtSubjects: CurriculumSubject[] = Array.from(uniqueSubjectsMap.values()).map((s) => {
      // Find matching questions for this subject
      const subjectQuestions = allAdminQuestions.filter((q) => {
        if (!q) return false;
        const matchesSubjectId = q.subject_id && s.aliasIds.includes(String(q.subject_id));
        const matchesSubjectName = isSubjectMatch(q.subject || q.subject_name, s.name);
        return matchesSubjectId || matchesSubjectName;
      });

      // Collect topic rows from Supabase belonging to this subject
      const subjectTopicRows = supaTopics.filter((t) =>
        s.aliasIds.includes(String(t.subject_id))
      );

      // Main topics map: key is normalized topic title
      const mainTopicMap = new Map<
        string,
        {
          id: string;
          title: string;
          code?: string | null;
          created_at?: string | null;
          aliasIds: string[];
          subMap: Map<string, { id: string; title: string; code?: string | null; created_at?: string | null; aliasIds: string[] }>;
        }
      >();

      // 1. Seed with Supabase DB topic rows (parent_id is null)
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
              subMap: new Map(),
            });
          } else {
            const existing = mainTopicMap.get(normTopic)!;
            existing.aliasIds.push(String(t.id));
            if (!existing.code && t.code) existing.code = t.code;
          }
        }
      });

      // 2. Attach DB child subtopics to their parent topics
      subjectTopicRows.forEach((st) => {
        if (st.parent_id) {
          for (const main of mainTopicMap.values()) {
            if (main.aliasIds.includes(String(st.parent_id))) {
              const normSub = normalizeTitle(st.title);
              if (normSub) {
                if (!main.subMap.has(normSub)) {
                  main.subMap.set(normSub, {
                    id: String(st.id),
                    title: st.title,
                    code: st.code || null,
                    created_at: st.created_at || null,
                    aliasIds: [String(st.id)],
                  });
                } else {
                  const existingSub = main.subMap.get(normSub)!;
                  existingSub.aliasIds.push(String(st.id));
                  if (!existingSub.code && st.code) existingSub.code = st.code;
                }
              }
              break;
            }
          }
        }
      });

      // 3. Merge default curriculum topics & subtopics for standard subject structure
      const defaultMatch = DEFAULT_MOCK_CURRICULUM.find((d) => isSubjectMatch(d.name, s.name));
      if (defaultMatch && defaultMatch.topics) {
        defaultMatch.topics.forEach((dt) => {
          const normDTopic = normalizeTitle(dt.title);
          if (!normDTopic) return;

          let targetMainTopic = mainTopicMap.get(normDTopic);
          if (!targetMainTopic) {
            // Check if any existing topic is a fuzzy match
            for (const [key, ex] of mainTopicMap.entries()) {
              if (isTopicOrSubtopicMatch(ex.title, dt.title)) {
                targetMainTopic = ex;
                break;
              }
            }
          }

          if (!targetMainTopic) {
            targetMainTopic = {
              id: dt.id,
              title: dt.title,
              code: null,
              created_at: null,
              aliasIds: [dt.id],
              subMap: new Map(),
            };
            mainTopicMap.set(normDTopic, targetMainTopic);
          }

          if (dt.subtopics) {
            dt.subtopics.forEach((dst) => {
              const normDSub = normalizeTitle(dst.title);
              if (!normDSub) return;
              if (!targetMainTopic!.subMap.has(normDSub)) {
                targetMainTopic!.subMap.set(normDSub, {
                  id: dst.id,
                  title: dst.title,
                  code: null,
                  created_at: null,
                  aliasIds: [dst.id],
                });
              }
            });
          }
        });
      }

      // 4. Dynamically merge topics and subtopics from questions added by admin/users
      subjectQuestions.forEach((q) => {
        const qTopic = (q.topic || '').trim();
        const qSubTopic = (q.sub_topic || '').trim();

        if (qTopic) {
          const normQT = normalizeTitle(qTopic);
          let targetMain = mainTopicMap.get(normQT);
          if (!targetMain) {
            for (const ex of mainTopicMap.values()) {
              if (isTopicOrSubtopicMatch(ex.title, qTopic)) {
                targetMain = ex;
                break;
              }
            }
          }

          if (!targetMain) {
            targetMain = {
              id: q.topic_id ? String(q.topic_id) : `dyn_t_${normQT}`,
              title: qTopic,
              code: null,
              created_at: null,
              aliasIds: q.topic_id ? [String(q.topic_id)] : [],
              subMap: new Map(),
            };
            mainTopicMap.set(normQT, targetMain);
          } else if (q.topic_id && !targetMain.aliasIds.includes(String(q.topic_id))) {
            targetMain.aliasIds.push(String(q.topic_id));
          }

          if (qSubTopic) {
            const normQSub = normalizeTitle(qSubTopic);
            let targetSub = targetMain.subMap.get(normQSub);
            if (!targetSub) {
              for (const sub of targetMain.subMap.values()) {
                if (isTopicOrSubtopicMatch(sub.title, qSubTopic)) {
                  targetSub = sub;
                  break;
                }
              }
            }

            if (!targetSub) {
              targetSub = {
                id: q.sub_topic_id ? String(q.sub_topic_id) : `dyn_st_${normQSub}`,
                title: qSubTopic,
                code: null,
                created_at: null,
                aliasIds: q.sub_topic_id ? [String(q.sub_topic_id)] : [],
              };
              targetMain.subMap.set(normQSub, targetSub);
            } else if (q.sub_topic_id && !targetSub.aliasIds.includes(String(q.sub_topic_id))) {
              targetSub.aliasIds.push(String(q.sub_topic_id));
            }
          }
        }
      });

      // 5. Build structured topics with calculated question counts
      const structuredTopics: ExtendedCurriculumTopic[] = Array.from(mainTopicMap.values()).map((main) => {
        const subtopics: ExtendedCurriculumSubtopic[] = Array.from(main.subMap.values()).map((subItem) => {
          const subQIdsSet = new Set<string>();

          // Match questions to this subtopic
          subjectQuestions.forEach((q) => {
            const qId = String(q.id);
            const qSubId = q.sub_topic_id ? String(q.sub_topic_id).trim() : '';
            const qTopicId = q.topic_id ? String(q.topic_id).trim() : '';
            const qSubName = q.sub_topic ? q.sub_topic.trim() : '';
            const qTopName = q.topic ? q.topic.trim() : '';

            // 1. Direct Subtopic ID match
            if (qSubId && (subItem.aliasIds.includes(qSubId) || subItem.id === qSubId)) {
              subQIdsSet.add(qId);
              return;
            }

            // 2. Direct Subtopic Name match (exact or stem)
            if (qSubName && isTopicOrSubtopicMatch(qSubName, subItem.title)) {
              subQIdsSet.add(qId);
              return;
            }

            // 3. Fallback ONLY if question has NO subtopic name and NO subtopic id
            if (!qSubName && !qSubId && qTopName && isTopicOrSubtopicMatch(qTopName, subItem.title)) {
              subQIdsSet.add(qId);
              return;
            }
          });

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
            totalQuestions: subQIdsSet.size,
            solvedQuestions: solvedQ,
          };
        });

        // Sort subtopics in ascending administrative sequence
        subtopics.sort(compareTopicCodes);

        let topicTotalQuestions = 0;
        let topicSolvedQuestions = 0;

        if (subtopics.length > 0) {
          topicTotalQuestions = subtopics.reduce((acc, sub) => acc + sub.totalQuestions, 0);
          topicSolvedQuestions = subtopics.reduce((acc, sub) => acc + sub.solvedQuestions, 0);
        } else {
          // Direct topic question matching if topic has no subtopics
          const topicQIdsSet = new Set<string>();
          subjectQuestions.forEach((q) => {
            const qId = String(q.id);
            const qTopicId = q.topic_id ? String(q.topic_id).trim() : '';
            const qTopName = q.topic || '';

            if (qTopicId && (main.aliasIds.includes(qTopicId) || main.id === qTopicId)) {
              topicQIdsSet.add(qId);
              return;
            }
            if (qTopName && isTopicOrSubtopicMatch(qTopName, main.title)) {
              topicQIdsSet.add(qId);
            }
          });

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

      // Sort main topics in ascending administrative sequence
      structuredTopics.sort(compareTopicCodes);

      const iconType = getIconType(s.name, s.code);
      const subjectTotalQ = structuredTopics.reduce((acc, t) => acc + t.totalQuestions, 0) || subjectQuestions.length;

      return {
        id: String(s.id),
        name: s.name || 'বিষয়',
        iconType,
        totalQuestions: subjectTotalQ,
        topics: structuredTopics,
      };
    });

    builtSubjects.sort((a, b) => {
      const pA = getSubjectPriority(a.name);
      const pB = getSubjectPriority(b.name);
      return pA - pB;
    });

    setCache(cacheKey, builtSubjects);
    return builtSubjects;
  } catch (err) {
    console.error('Error fetching curriculum from Supabase:', err);
  }

  // Fallback if Supabase was completely unreachable
  const fallbackCurriculum = DEFAULT_MOCK_CURRICULUM.map((s) => ({
    ...s,
    iconType: getIconType(s.name) || s.iconType,
    topics: s.topics.map((t) => ({
      ...t,
      subtopics: t.subtopics.map((sub) => ({
        ...sub,
        totalQuestions: 0,
        solvedQuestions: 0,
      })),
    })),
  })).sort((a, b) => getSubjectPriority(a.name) - getSubjectPriority(b.name));

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

  // If subtopic titles were not provided, resolve them from Supabase sub_topics / topics tables
  if (validSubtopicIds.length > 0 && validSubtopicTitles.length === 0 && supabase) {
    try {
      const [{ data: stList }, { data: tList }] = await Promise.all([
        supabase.from('sub_topics').select('id, title, name').in('id', validSubtopicIds),
        supabase.from('topics').select('id, title').in('id', validSubtopicIds),
      ]);
      if (stList) {
        stList.forEach((st: any) => {
          const t = (st.title || st.name || '').trim();
          if (t && !validSubtopicTitles.includes(t)) validSubtopicTitles.push(t);
        });
      }
      if (tList) {
        tList.forEach((t: any) => {
          const tName = (t.title || '').trim();
          if (tName && !validSubtopicTitles.includes(tName)) validSubtopicTitles.push(tName);
        });
      }
    } catch {}
  }

  // If subtopic IDs were not provided, resolve them from titles
  if (validSubtopicTitles.length > 0 && validSubtopicIds.length === 0 && supabase) {
    try {
      const [{ data: stList }, { data: tList }] = await Promise.all([
        supabase.from('sub_topics').select('id, title, name').in('title', validSubtopicTitles),
        supabase.from('topics').select('id, title').in('title', validSubtopicTitles),
      ]);
      if (stList) {
        stList.forEach((st: any) => {
          const id = String(st.id);
          if (id && !validSubtopicIds.includes(id)) validSubtopicIds.push(id);
        });
      }
      if (tList) {
        tList.forEach((t: any) => {
          const id = String(t.id);
          if (id && !validSubtopicIds.includes(id)) validSubtopicIds.push(id);
        });
      }
    } catch {}
  }

  const cacheKey = `subtopic_questions_${[...validSubtopicIds, ...validSubtopicTitles].sort().join('_')}_${targetCount}`;
  const cached = getCache<Question[]>(cacheKey, 120000);
  if (cached && cached.length >= Math.min(targetCount, 5)) return cached;

  try {
    const rawQuestionsMap = new Map<string, any>();

    // 1. Dynamic Querying: Fetch questions matching either sub_topic_id OR sub_topic name
    // Ensures both new questions (with FK sub_topic_id) and legacy questions (with text name) are loaded
    if (supabase) {
      try {
        const queryLimit = Math.max(targetCount * 3, 100);
        const queryPromises: Promise<any>[] = [];

        // A. Match by sub_topic_id (Foreign Key for newly added questions)
        if (validSubtopicIds.length > 0) {
          queryPromises.push(
            (async () => {
              const { data, error } = await supabase
                .from('questions')
                .select(QUESTION_SELECT_FIELDS)
                .in('sub_topic_id', validSubtopicIds)
                .limit(queryLimit);
              if (!error && data && Array.isArray(data)) {
                data.forEach((q) => {
                  if (q && q.id) rawQuestionsMap.set(String(q.id), q);
                });
              }
            })()
          );

          // Also attempt relational join if foreign key constraint exists in Supabase
          for (const subId of validSubtopicIds) {
            queryPromises.push(
              (async () => {
                try {
                  const { data, error } = await supabase
                    .from('questions')
                    .select('*, topics!inner(*), sub_topics!inner(*)')
                    .eq('sub_topic_id', subId)
                    .limit(queryLimit);
                  if (!error && data && Array.isArray(data)) {
                    data.forEach((q: any) => {
                      if (q && q.id) rawQuestionsMap.set(String(q.id), q);
                    });
                  }
                } catch {}
              })()
            );
          }
        }

        // B. Match by sub_topic name (Text column matching for both old and new questions)
        if (validSubtopicTitles.length > 0) {
          queryPromises.push(
            (async () => {
              const { data, error } = await supabase
                .from('questions')
                .select(QUESTION_SELECT_FIELDS)
                .in('sub_topic', validSubtopicTitles)
                .limit(queryLimit);
              if (!error && data && Array.isArray(data)) {
                data.forEach((q) => {
                  if (q && q.id) rawQuestionsMap.set(String(q.id), q);
                });
              }
            })()
          );

          // Handle word variations with ilike for each subtopic title
          for (const title of validSubtopicTitles) {
            const words = title.split(/[\s,&+/\-]+/).filter((w) => w.length >= 3);
            for (const word of words) {
              queryPromises.push(
                (async () => {
                  const { data, error } = await supabase
                    .from('questions')
                    .select(QUESTION_SELECT_FIELDS)
                    .ilike('sub_topic', `%${word}%`)
                    .limit(queryLimit);
                  if (!error && data && Array.isArray(data)) {
                    data.forEach((q) => {
                      if (q && q.id) rawQuestionsMap.set(String(q.id), q);
                    });
                  }
                })()
              );
            }
          }
        }

        // C. Backward compatibility fallback: match by topic name (ONLY if question has no subtopic)
        if (validSubtopicTitles.length > 0) {
          queryPromises.push(
            (async () => {
              const { data, error } = await supabase
                .from('questions')
                .select(QUESTION_SELECT_FIELDS)
                .in('topic', validSubtopicTitles)
                .limit(queryLimit);
              if (!error && data && Array.isArray(data)) {
                data.forEach((q) => {
                  if (q && q.id) {
                    const qSubName = q.sub_topic ? q.sub_topic.trim() : '';
                    if (!qSubName || validSubtopicTitles.some((t) => isTopicOrSubtopicMatch(qSubName, t))) {
                      rawQuestionsMap.set(String(q.id), q);
                    }
                  }
                });
              }
            })()
          );
        }

        // D. Backward compatibility fallback: match by topic_id
        if (validSubtopicIds.length > 0) {
          queryPromises.push(
            (async () => {
              const { data, error } = await supabase
                .from('questions')
                .select(QUESTION_SELECT_FIELDS)
                .in('topic_id', validSubtopicIds)
                .limit(queryLimit);
              if (!error && data && Array.isArray(data)) {
                data.forEach((q) => {
                  if (q && q.id) {
                    const qSubName = q.sub_topic ? q.sub_topic.trim() : '';
                    if (!qSubName || validSubtopicTitles.some((t) => isTopicOrSubtopicMatch(qSubName, t))) {
                      rawQuestionsMap.set(String(q.id), q);
                    }
                  }
                });
              }
            })()
          );
        }

        await Promise.allSettled(queryPromises);
      } catch (err) {
        console.warn('Notice querying Supabase questions for subtopics:', err);
      }
    }

    // 2. Also incorporate newly added questions from Admin cache in localStorage
    const allAdminQuestions = await getAllAvailableAdminQuestions();
    const selectedIdSet = new Set(validSubtopicIds.map((id) => String(id).trim()));

    allAdminQuestions.forEach((q) => {
      if (!q || !q.id) return;
      const qId = String(q.id);
      if (rawQuestionsMap.has(qId)) return;

      const qSubId = q.sub_topic_id ? String(q.sub_topic_id).trim() : '';
      const qTopicId = q.topic_id ? String(q.topic_id).trim() : '';
      const qSubTopicName = q.sub_topic ? q.sub_topic.trim() : '';
      const qTopicName = q.topic ? q.topic.trim() : '';

      // Match questions by either sub_topic_id OR sub_topic name
      const matchesSubTopicId = qSubId && selectedIdSet.has(qSubId);
      const matchesSubTopicName =
        qSubTopicName &&
        validSubtopicTitles.some((title) => isTopicOrSubtopicMatch(qSubTopicName, title));

      // Backward compatibility fallback: only when question has NO subtopic
      const matchesTopicId = !qSubId && !qSubTopicName && qTopicId && selectedIdSet.has(qTopicId);
      const matchesTopicName =
        !qSubTopicName &&
        qTopicName &&
        validSubtopicTitles.some((title) => isTopicOrSubtopicMatch(qTopicName, title));

      if (matchesSubTopicId || matchesSubTopicName || matchesTopicId || matchesTopicName) {
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
        const matches = validSubtopicTitles.some((title) => isTopicOrSubtopicMatch(q.topic, title) || isTopicOrSubtopicMatch(q.sub_topic, title));
        if (matches && !rawQuestionsMap.has(String(q.id))) {
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

/**
 * Total Question Counting by Foreign Key as requested:
 * Calculate total questions per sub-topic using:
 * supabase.from('questions').select('id', { count: 'exact', head: true }).eq('sub_topic_id', subTopic.id)
 */
export async function countQuestionsBySubTopicForeignKey(subTopicId: string, fallbackTitle?: string): Promise<number> {
  if (!supabase || !subTopicId) return 0;

  const foundIds = new Set<string>();

  try {
    const promises: Promise<any>[] = [];

    // 1. Direct foreign key count on sub_topic_id
    promises.push(
      (async () => {
        const { data } = await supabase
          .from('questions')
          .select('id')
          .eq('sub_topic_id', subTopicId)
          .limit(1000);
        if (data && Array.isArray(data)) {
          data.forEach((row) => row?.id && foundIds.add(String(row.id)));
        }
      })()
    );

    // 2. Fallback matching sub_topic text column
    if (fallbackTitle && fallbackTitle.trim() !== '') {
      promises.push(
        (async () => {
          const { data } = await supabase
            .from('questions')
            .select('id')
            .eq('sub_topic', fallbackTitle.trim())
            .limit(1000);
          if (data && Array.isArray(data)) {
            data.forEach((row) => row?.id && foundIds.add(String(row.id)));
          }
        })()
      );

      // 3. Fallback matching questions.topic (text) with fallbackTitle
      promises.push(
        (async () => {
          const { data } = await supabase
            .from('questions')
            .select('id')
            .eq('topic', fallbackTitle.trim())
            .limit(1000);
          if (data && Array.isArray(data)) {
            data.forEach((row) => row?.id && foundIds.add(String(row.id)));
          }
        })()
      );
    }

    // 4. Fallback matching topic_id
    promises.push(
      (async () => {
        const { data } = await supabase
          .from('questions')
          .select('id')
          .eq('topic_id', subTopicId)
          .limit(1000);
        if (data && Array.isArray(data)) {
          data.forEach((row) => row?.id && foundIds.add(String(row.id)));
        }
      })()
    );

    await Promise.allSettled(promises);
    return foundIds.size;
  } catch (err) {
    return foundIds.size;
  }
}

