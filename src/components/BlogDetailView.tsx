import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Bookmark, 
  Share2, 
  Calendar, 
  Clock, 
  User, 
  Check, 
  Eye, 
  BookOpen, 
  Sparkles,
  ChevronRight,
  ThumbsUp
} from 'lucide-react';
import { BlogPost } from '../types';
import { toggleBlogBookmark, getLocalBookmarkedBlogIds } from '../lib/supabase';

interface BlogDetailViewProps {
  post: BlogPost;
  allPosts: BlogPost[];
  onBack: () => void;
  onSelectPost: (post: BlogPost) => void;
}

export const BlogDetailView: React.FC<BlogDetailViewProps> = ({
  post,
  allPosts,
  onBack,
  onSelectPost,
}) => {
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(() => Math.floor(Math.random() * 40) + 12);
  const [hasLiked, setHasLiked] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const bookmarkedIds = getLocalBookmarkedBlogIds();
    setIsBookmarked(bookmarkedIds.includes(post.id));
  }, [post.id]);

  const handleBookmarkToggle = () => {
    const nextState = toggleBlogBookmark(post.id);
    setIsBookmarked(nextState);
  };

  const handleShare = async () => {
    const shareData = {
      title: post.title,
      text: post.excerpt,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch {}
    }
  };

  const handleLike = () => {
    if (!hasLiked) {
      setLikesCount(prev => prev + 1);
      setHasLiked(true);
    } else {
      setLikesCount(prev => prev - 1);
      setHasLiked(false);
    }
  };

  const categoryColorMap: Record<string, { bg: string; text: string; border: string }> = {
    'নিবন্ধন প্রস্তুতি': {
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200/80 dark:border-emerald-800/60',
    },
    'প্রাইমারি প্রস্তুতি': {
      bg: 'bg-sky-50 dark:bg-sky-950/60',
      text: 'text-sky-700 dark:text-sky-400',
      border: 'border-sky-200/80 dark:border-sky-800/60',
    },
    'বিসিএস প্রস্তুতি': {
      bg: 'bg-purple-50 dark:bg-purple-950/60',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-200/80 dark:border-purple-800/60',
    },
    '১১-২০ গ্রেড প্রস্তুতি': {
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200/80 dark:border-amber-800/60',
    },
    'জব সার্কুলার': {
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-200/80 dark:border-rose-800/60',
    },
  };

  const badgeStyle = categoryColorMap[post.category] || {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200/80 dark:border-emerald-800/60',
  };

  const relatedPosts = allPosts.filter(p => p.id !== post.id && (p.category === post.category || true)).slice(0, 3);

  return (
    <article className="min-h-[85vh] pb-24 animate-fade-in">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-3">
        
        {/* Navigation & Action Bar */}
        <div className="flex items-center justify-between py-2 mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full neu-pill text-xs font-bold text-slate-700 dark:text-slate-300 hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ব্লগ লিস্টে ফিরুন</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBookmarkToggle}
              aria-label="Bookmark"
              className={`p-2 rounded-full neu-pill transition-all ${
                isBookmarked 
                  ? 'text-[#046A38] bg-emerald-50 dark:bg-emerald-950/80' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#046A38]' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              aria-label="Share"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full neu-pill text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#046A38] transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'লিংক কপি হয়েছে!' : 'শেয়ার'}</span>
            </button>
          </div>
        </div>

        {/* Main Article Container Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
          
          {/* Header metadata */}
          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-block px-3 py-1 text-xs font-bold rounded-md border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                {post.category}
              </span>
              {post.sub_category && (
                <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {post.sub_category}
                </span>
              )}
              {post.subject && (
                <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-[#046A38] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                  {post.subject}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 dark:text-slate-400 pt-1 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{post.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{post.published_date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{post.reading_time_minutes} মিনিট পড়ুন</span>
              </div>
            </div>
          </div>

          {/* Thumbnail Image */}
          {post.thumbnail && (
            <div className="relative w-full aspect-16/9 sm:aspect-21/9 rounded-2xl overflow-hidden mb-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          )}

          {/* Short Excerpt highlight */}
          {post.excerpt && (
            <div className="p-4 mb-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border-l-4 border-[#046A38] text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 italic leading-relaxed">
              "{post.excerpt}"
            </div>
          )}

          {/* Article Full Content */}
          <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed space-y-4 font-sans">
            {post.content.split('\n\n').map((paragraph, idx) => {
              const trimmed = paragraph.trim();
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                    {trimmed.replace('### ', '')}
                  </h3>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={idx} className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-6 mb-3 text-[#046A38] dark:text-emerald-400">
                    {trimmed.replace('## ', '')}
                  </h2>
                );
              }
              if (trimmed.startsWith('#### ')) {
                return (
                  <h4 key={idx} className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 mt-4 mb-1">
                    {trimmed.replace('#### ', '')}
                  </h4>
                );
              }
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const items = trimmed.split('\n').filter(Boolean);
                return (
                  <ul key={idx} className="list-disc list-inside space-y-1.5 pl-2 my-3 text-slate-700 dark:text-slate-300">
                    {items.map((item, i) => (
                      <li key={i} className="leading-snug">
                        {item.replace(/^[-*]\s+/, '')}
                      </li>
                    ))}
                  </ul>
                );
              }
              if (/^\d+\.\s/.test(trimmed)) {
                const items = trimmed.split('\n').filter(Boolean);
                return (
                  <ol key={idx} className="list-decimal list-inside space-y-1.5 pl-2 my-3 text-slate-700 dark:text-slate-300">
                    {items.map((item, i) => (
                      <li key={i} className="leading-snug">
                        {item.replace(/^\d+\.\s+/, '')}
                      </li>
                    ))}
                  </ol>
                );
              }
              return (
                <p key={idx} className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {trimmed}
                </p>
              );
            })}
          </div>

          {/* Reaction & Action Footer */}
          <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all neu-pill ${
                hasLiked 
                  ? 'bg-emerald-50 text-[#046A38] dark:bg-emerald-950/60 dark:text-emerald-400' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-[#046A38]' : ''}`} />
              <span>উপকারী লেগেছে ({likesCount})</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full neu-pill text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-[#046A38] transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>বন্ধুদের সাথে শেয়ার করুন</span>
              </button>
            </div>
          </div>
        </div>

        {/* Related articles */}
        {relatedPosts.length > 0 && (
          <div className="mt-8 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#046A38]" />
              <span>আরও গুরুত্বপূর্ণ লেখা</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relatedPosts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectPost(rel)}
                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-[#046A38]/50 hover:shadow-md transition-all group"
                >
                  <img
                    src={rel.thumbnail}
                    alt={rel.title}
                    className="w-full h-24 rounded-xl object-cover mb-2"
                  />
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    {rel.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 mt-1 group-hover:text-[#046A38]">
                    {rel.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>{rel.published_date}</span>
                    <span className="flex items-center gap-0.5 text-[#046A38]">
                      পড়ুন <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </article>
  );
};
