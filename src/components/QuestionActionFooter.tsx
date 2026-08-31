import React, { useState, useEffect } from 'react';
import {
  Heart,
  Bookmark,
  Flag,
  BookOpen,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  X,
  Send,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  User,
  Clock
} from 'lucide-react';
import { Question, QuestionCommunityExplanation } from '../types';
import {
  fetchQuestionLikesCount,
  fetchUserLikedQuestionIds,
  toggleQuestionLikeInSupabase,
  fetchUserBookmarkedQuestionIds,
  toggleQuestionBookmarkInSupabase,
  submitQuestionReportToSupabase,
  fetchQuestionCommunityExplanations,
  submitQuestionCommunityExplanation
} from '../lib/supabase';
import {
  isUserRegistered,
  getUserProfile,
  getUserUniqueId,
  toBengaliNumeral,
  toggleBookmarkId,
  getBookmarkedIds,
  getLikedIds,
  getLocalQuestionLikeCount,
  setLocalQuestionLikeCount,
  toggleLikedId,
  saveBookmarkedQuestion,
  saveLikedQuestion
} from '../lib/utils';
import { AuthModal } from './AuthModal';

interface QuestionActionFooterProps {
  question: Question;
  showOfficialExplanation?: boolean;
  onRequireAuth?: () => void;
  className?: string;
  defaultExpanded?: boolean;
}

export const QuestionActionFooter: React.FC<QuestionActionFooterProps> = ({
  question,
  showOfficialExplanation = false,
  onRequireAuth,
  className = '',
  defaultExpanded = false
}) => {
  const qId = String(question.id);
  const user = getUserProfile();
  const userId = getUserUniqueId();
  const isRegistered = isUserRegistered();

  // Instant synchronous initial states
  const [likeCount, setLikeCount] = useState<number>(() => getLocalQuestionLikeCount(qId));
  const [isLiked, setIsLiked] = useState<boolean>(() => getLikedIds().includes(qId));
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => getBookmarkedIds().includes(qId));
  const [showExplanation, setShowExplanation] = useState<boolean>(defaultExpanded || showOfficialExplanation);
  
  // Community Explanations
  const [explanations, setExplanations] = useState<QuestionCommunityExplanation[]>([]);
  const [isLoadingExplanations, setIsLoadingExplanations] = useState<boolean>(false);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showAddExplanationModal, setShowAddExplanationModal] = useState<boolean>(false);

  // Form states
  const [reportReason, setReportReason] = useState<string>('উত্তরে ভুল রয়েছে');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);

  const [newExplanationText, setNewExplanationText] = useState<string>('');
  const [customAuthorName, setCustomAuthorName] = useState<string>(user?.name || '');
  const [isSubmittingExplanation, setIsSubmittingExplanation] = useState<boolean>(false);
  const [explanationSuccessMsg, setExplanationSuccessMsg] = useState<string | null>(null);

  const handleAuthCheck = (): boolean => {
    if (!isRegistered && !userId) {
      if (onRequireAuth) {
        onRequireAuth();
      } else {
        setShowAuthModal(true);
      }
      return false;
    }
    return true;
  };

  // Listen to global sync events across tabs / cards
  useEffect(() => {
    const handleLikesUpdated = () => {
      const likedList = getLikedIds();
      setIsLiked(likedList.includes(qId));
      setLikeCount(getLocalQuestionLikeCount(qId));
    };

    const handleBookmarksUpdated = () => {
      const bmList = getBookmarkedIds();
      setIsBookmarked(bmList.includes(qId));
    };

    window.addEventListener('tamreen_likes_updated', handleLikesUpdated);
    window.addEventListener('tamreen_bookmarks_updated', handleBookmarksUpdated);

    return () => {
      window.removeEventListener('tamreen_likes_updated', handleLikesUpdated);
      window.removeEventListener('tamreen_bookmarks_updated', handleBookmarksUpdated);
    };
  }, [qId]);

  // Initial Load from Supabase/Server API
  useEffect(() => {
    let isMounted = true;

    // Synchronize local states immediately on id change
    setIsLiked(getLikedIds().includes(qId));
    setIsBookmarked(getBookmarkedIds().includes(qId));
    setLikeCount(getLocalQuestionLikeCount(qId));

    // Check likes count from backend
    fetchQuestionLikesCount(qId).then((cnt) => {
      if (isMounted && typeof cnt === 'number') {
        setLikeCount(cnt);
        setLocalQuestionLikeCount(qId, cnt);
      }
    });

    // Check user liked questions
    fetchUserLikedQuestionIds(userId).then((likedIds) => {
      if (isMounted && Array.isArray(likedIds)) {
        if (likedIds.includes(qId)) {
          setIsLiked(true);
          saveLikedQuestion(question);
        }
      }
    });

    // Check user bookmarked questions
    fetchUserBookmarkedQuestionIds(userId).then((bmIds) => {
      if (isMounted && Array.isArray(bmIds)) {
        if (bmIds.includes(qId)) {
          setIsBookmarked(true);
          saveBookmarkedQuestion(question);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [qId, userId]);

  // Load explanations when expanded
  useEffect(() => {
    if (showExplanation && explanations.length === 0) {
      setIsLoadingExplanations(true);
      fetchQuestionCommunityExplanations(qId)
        .then((data) => {
          setExplanations(data);
        })
        .finally(() => {
          setIsLoadingExplanations(false);
        });
    }
  }, [showExplanation, qId]);

  // 1. Handle Like (Instant + Server Sync)
  const handleLike = async () => {
    // Instant local update
    const { isLiked: nextLiked, newCount: nextCount } = toggleLikedId(qId, question);
    setIsLiked(nextLiked);
    setLikeCount(nextCount);

    // Sync to Supabase & Server
    try {
      const res = await toggleQuestionLikeInSupabase(qId, userId, user?.name);
      if (typeof res.newCount === 'number') {
        setLikeCount(res.newCount);
        setLocalQuestionLikeCount(qId, res.newCount);
      }
      setIsLiked(res.isLiked);
    } catch (err) {
      console.warn('Like sync background error:', err);
    }
  };

  // 2. Handle Bookmark (Instant + Server Sync)
  const handleBookmark = async () => {
    // Instant local update
    const nextBm = toggleBookmarkId(qId, question);
    setIsBookmarked(nextBm);

    // Sync to Supabase & Server
    try {
      const res = await toggleQuestionBookmarkInSupabase(qId, userId);
      setIsBookmarked(res.isBookmarked);
    } catch (err) {
      console.warn('Bookmark sync background error:', err);
    }
  };

  // 3. Handle Report Submit
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    setIsSubmittingReport(true);
    try {
      const res = await submitQuestionReportToSupabase({
        question_id: qId,
        user_id: userId,
        user_name: user?.name || customAuthorName || 'শিক্ষার্থী',
        phone: user?.phone,
        email: user?.email,
        reason: reportReason,
        details: reportDetails,
      });

      if (res.success) {
        setReportSuccessMsg('আপনার রিপোর্টটি সফলভাবে জমা হয়েছে। দ্রুত পর্যালোচনা করা হবে।');
        setTimeout(() => {
          setShowReportModal(false);
          setReportSuccessMsg(null);
          setReportDetails('');
        }, 2000);
      } else {
        alert(res.error || 'রিপোর্ট জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    } catch {
      alert('নেটওয়ার্ক সমস্যার কারণে রিপোর্ট জমা দেওয়া যায়নি।');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // 4. Handle Add Explanation Submit
  const handleExplanationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleAuthCheck()) return;
    if (!newExplanationText.trim()) return;

    const authorName = user?.name || customAuthorName || 'শিক্ষার্থী';
    setIsSubmittingExplanation(true);

    try {
      const res = await submitQuestionCommunityExplanation({
        question_id: qId,
        user_id: userId,
        author_name: authorName,
        author_avatar: user?.avatar,
        explanation: newExplanationText.trim(),
      });

      if (res.success && res.newExplanation) {
        setExplanations([res.newExplanation, ...explanations]);
        setShowExplanation(true);
        setExplanationSuccessMsg('আপনার ব্যাখ্যাটি সফলভাবে প্রকাশিত হয়েছে!');
        setTimeout(() => {
          setShowAddExplanationModal(false);
          setExplanationSuccessMsg(null);
          setNewExplanationText('');
        }, 1800);
      } else {
        alert(res.error || 'ব্যাখ্যা যোগ করতে সমস্যা হয়েছে।');
      }
    } catch {
      alert('নেটওয়ার্ক সমস্যার কারণে ব্যাখ্যা যোগ করা যায়নি।');
    } finally {
      setIsSubmittingExplanation(false);
    }
  };

  return (
    <div className={`space-y-3 pt-2 ${className}`}>
      {/* Top Action Row */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
        {/* Left Group: Likes & Bookmarks */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Like (Heart) Button */}
          <button
            type="button"
            onClick={handleLike}
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold transition-all cursor-pointer select-none active:scale-90 ${
              isLiked
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={isLiked ? 'লাইক প্রত্যাহার করুন' : 'পছন্দ করুন'}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-500 dark:text-slate-400'
              }`}
            />
            <span>{toBengaliNumeral(likeCount)}</span>
          </button>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={handleBookmark}
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold transition-all cursor-pointer select-none active:scale-90 ${
              isBookmarked
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={isBookmarked ? 'বুকমার্ক সংরক্ষিত' : 'বুকমার্ক করুন'}
          >
            <Bookmark
              className={`w-4 h-4 transition-transform ${
                isBookmarked ? 'fill-amber-500 text-amber-500 scale-110' : 'text-slate-500 dark:text-slate-400'
              }`}
            />
            <span className="hidden sm:inline">{isBookmarked ? 'সংরক্ষিত' : 'বুকমার্ক'}</span>
          </button>

          {/* Report (Flag) Button */}
          <button
            type="button"
            onClick={() => {
              if (handleAuthCheck()) {
                setShowReportModal(true);
              }
            }}
            className="p-1.5 px-2.5 rounded-full bg-slate-50 dark:bg-slate-800/80 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer select-none active:scale-90"
            title="প্রশ্নে ভুল রিপোর্ট করুন"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Group: Explanation View & Add Explanation */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Add Explanation Button */}
          <button
            type="button"
            onClick={() => {
              if (handleAuthCheck()) {
                setShowAddExplanationModal(true);
              }
            }}
            className="px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-extrabold flex items-center gap-1 transition-all cursor-pointer active:scale-95 text-[11px] sm:text-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>ব্যাখ্যা যোগ করুন</span>
          </button>

          {/* Explanation Toggle (Eye/BookOpen) Button */}
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className={`px-3 py-1.5 rounded-full font-extrabold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-[11px] sm:text-xs ${
              showExplanation
                ? 'bg-[#0B132B] dark:bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ব্যাখ্যা</span>
            {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Explanations Section */}
      {showExplanation && (
        <div className="space-y-3 pt-1 animate-fade-in">
          {/* Official Explanation Card */}
          {question.explanation && (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-extrabold text-xs">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>মাস্টার সমাধান ও বিশদ ব্যাখ্যা:</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line">
                {question.explanation}
              </p>
            </div>
          )}

          {/* Community Explanations List */}
          {isLoadingExplanations ? (
            <div className="py-3 text-center text-xs text-slate-400 font-medium">
              সহপাঠীদের ব্যাখ্যা লোড হচ্ছে...
            </div>
          ) : (
            explanations.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>শিক্ষার্থীদের দেওয়া ব্যাখ্যা ({toBengaliNumeral(explanations.length)}টি):</span>
                </div>

                <div className="space-y-2">
                  {explanations.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {item.author_avatar ? (
                            <img
                              src={item.author_avatar}
                              alt={item.author_name}
                              className="w-5 h-5 rounded-full object-cover border border-slate-300"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                              {item.author_name.charAt(0)}
                            </div>
                          )}
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                            {item.author_name}
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(item.created_at).toLocaleDateString('bn-BD', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                        {item.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* 1. Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  প্রশ্নে অসঙ্গতি বা ভুল রিপোর্ট করুন
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-center font-bold text-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{reportSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    সমস্যার ধরন নির্বাচন করুন:
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      'উত্তরে ভুল রয়েছে',
                      'বানান বা টাইপিং ভুল',
                      'প্রশ্নটি অস্পষ্ট বা অসম্পূর্ণ',
                      'অন্যান্য সমস্যা',
                    ].map((reason) => (
                      <label
                        key={reason}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                          reportReason === reason
                            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-200'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="report_reason"
                          value={reason}
                          checked={reportReason === reason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    বিস্তারিত বিবরণ (ঐচ্ছিক):
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="সঠিক উত্তর বা আপনার পর্যবেক্ষণ সম্পর্কে লিখুন..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingReport ? 'জমা হচ্ছে...' : 'রিপোর্ট জমা দিন'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. Add Explanation Modal */}
      {showAddExplanationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <BookOpen className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  আপনার ব্যাখ্যা ও নোট যুক্ত করুন
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExplanationModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {explanationSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-center font-bold text-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{explanationSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleExplanationSubmit} className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">প্রশ্ন:</span>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                    {question.question}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    বিস্তারিত ব্যাখ্যা ও রেফারেন্স:
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newExplanationText}
                    onChange={(e) => setNewExplanationText(e.target.value)}
                    placeholder="সঠিক উত্তরের যুক্তি, বইয়ের রেফারেন্স বা শর্টকাট টেকনিক লিখুন..."
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 leading-relaxed font-medium"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>পোস্ট করবেন: <b>{user?.name || 'শিক্ষার্থী'}</b></span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddExplanationModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingExplanation || !newExplanationText.trim()}
                      className="px-5 py-2.5 rounded-xl bg-[#0b705c] hover:bg-[#085a4a] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingExplanation ? 'যুক্ত হচ্ছে...' : 'যুক্ত করুন'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 3. Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          title="লাইক ও বুকমার্ক করতে লগইন করুন"
        />
      )}
    </div>
  );
};
