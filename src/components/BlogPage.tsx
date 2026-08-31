import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutGrid, 
  BookOpen, 
  GraduationCap, 
  Award, 
  Briefcase, 
  Megaphone, 
  Calendar, 
  Clock, 
  Bookmark, 
  ChevronDown, 
  List, 
  Search, 
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { BlogPost, BlogCategory } from '../types';
import { 
  fetchBlogPosts, 
  toggleBlogBookmark, 
  getLocalBookmarkedBlogIds 
} from '../lib/supabase';
import { BlogDetailView } from './BlogDetailView';

interface BlogPageProps {
  searchQuery?: string;
  onOpenAdminPanel?: () => void;
}

type SelectedFilter = 'সবগুলো' | BlogCategory;

const CATEGORY_ITEMS: { id: SelectedFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'সবগুলো', label: 'সবগুলো', icon: LayoutGrid },
  { id: 'নিবন্ধন প্রস্তুতি', label: 'নিবন্ধন প্রস্তুতি', icon: BookOpen },
  { id: 'প্রাইমারি প্রস্তুতি', label: 'প্রাইমারি প্রস্তুতি', icon: GraduationCap },
  { id: 'বিসিএস প্রস্তুতি', label: 'বিসিএস প্রস্তুতি', icon: Award },
  { id: '১১-২০ গ্রেড প্রস্তুতি', label: '১১-২০ গ্রেড প্রস্তুতি', icon: Briefcase },
  { id: 'জব সার্কুলার', label: 'জব সার্কুলার', icon: Megaphone },
];

export const BlogPage: React.FC<BlogPageProps> = ({
  searchQuery = '',
}) => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SelectedFilter>('সবগুলো');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showSortMenu, setShowSortMenu] = useState<boolean>(false);
  const [filterBookmarkedOnly, setFilterBookmarkedOnly] = useState<boolean>(false);

  const loadAllBlogs = async () => {
    try {
      const data = await fetchBlogPosts();
      setBlogs(data);
    } catch (e) {
      console.warn('Error loading blogs:', e);
    }
  };

  useEffect(() => {
    loadAllBlogs();
    setBookmarkedIds(getLocalBookmarkedBlogIds());

    const handleBlogsUpdated = () => {
      loadAllBlogs();
    };
    const handleBookmarkChanged = () => {
      setBookmarkedIds(getLocalBookmarkedBlogIds());
    };

    window.addEventListener('tamreen_blogs_updated', handleBlogsUpdated);
    window.addEventListener('tamreen_blog_bookmark_changed', handleBookmarkChanged);
    return () => {
      window.removeEventListener('tamreen_blogs_updated', handleBlogsUpdated);
      window.removeEventListener('tamreen_blog_bookmark_changed', handleBookmarkChanged);
    };
  }, []);

  const handleToggleBookmark = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const isNowBookmarked = toggleBlogBookmark(id);
    if (isNowBookmarked) {
      setBookmarkedIds(prev => [...prev, id]);
    } else {
      setBookmarkedIds(prev => prev.filter(bId => bId !== id));
    }
  };

  // Filter and Sort Logic
  const filteredBlogs = useMemo(() => {
    return blogs
      .filter((post) => {
        // Only show published posts (or all if drafted in local preview)
        if (post.status === 'draft') return false;

        // Category filter
        if (selectedCategory !== 'সবগুলো' && post.category !== selectedCategory) {
          return false;
        }

        // Bookmark filter
        if (filterBookmarkedOnly && !bookmarkedIds.includes(post.id)) {
          return false;
        }

        // Search Query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = post.title.toLowerCase().includes(q);
          const matchExcerpt = post.excerpt.toLowerCase().includes(q);
          const matchCategory = post.category.toLowerCase().includes(q);
          return matchTitle || matchExcerpt || matchCategory;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'popular') {
          return (b.views_count || 0) - (a.views_count || 0);
        }
        // Latest first by default
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      });
  }, [blogs, selectedCategory, filterBookmarkedOnly, searchQuery, sortBy, bookmarkedIds]);

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

  if (selectedPost) {
    return (
      <BlogDetailView
        post={selectedPost}
        allPosts={blogs}
        onBack={() => setSelectedPost(null)}
        onSelectPost={(post) => setSelectedPost(post)}
      />
    );
  }

  return (
    <div className="min-h-screen pb-28 animate-fade-in">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-1 space-y-4">
        
        {/* Top Header Banner Card */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between gap-4">
            
            {/* Left Content */}
            <div className="space-y-1.5 max-w-lg z-10">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  ব্লগ
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                নতুন তথ্য, প্রস্তুতি গাইড, সাজেশন এবং চাকরির গুরুত্বপূর্ণ আপডেট
              </p>
            </div>

            {/* Right Graphic Illustration */}
            <div className="shrink-0 relative hidden xs:flex items-center justify-center w-20 h-20 sm:w-28 sm:h-28">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-950/60 dark:to-slate-800 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center shadow-inner relative">
                {/* Note lines */}
                <div className="w-10 h-12 bg-white dark:bg-slate-900 rounded-lg shadow-md border border-slate-100 dark:border-slate-800 p-1.5 flex flex-col justify-around">
                  <div className="w-full h-1 bg-emerald-500/80 rounded-full"></div>
                  <div className="w-5/6 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                  <div className="w-4/6 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                  <div className="w-5/6 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                </div>
                {/* Pen accent */}
                <div className="absolute -top-1 -right-1 w-5 h-8 bg-gradient-to-b from-emerald-600 to-teal-700 rounded-t-sm rotate-45 shadow-sm"></div>
                {/* Leaf accent */}
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-emerald-500 rounded-full rounded-tr-none rotate-12"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Horizontal Scrollable Buttons */}
        <div className="relative">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
            {CATEGORY_ITEMS.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id && !filterBookmarkedOnly;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setFilterBookmarkedOnly(false);
                  }}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#046A38] text-white shadow-[0_4px_12px_rgba(4,106,56,0.35)] scale-[1.02]'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-[#046A38]/40 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}

            {/* Saved Bookmarks filter button */}
            <button
              onClick={() => setFilterBookmarkedOnly(!filterBookmarkedOnly)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                filterBookmarkedOnly
                  ? 'bg-amber-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.35)]'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="বুকমার্ক করা পোস্ট"
            >
              <Bookmark className={`w-3.5 h-3.5 ${filterBookmarkedOnly ? 'fill-white' : ''}`} />
              <span>বুকমার্ক ({bookmarkedIds.length})</span>
            </button>
          </div>
        </div>

        {/* Section Heading & Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#046A38] rounded-full inline-block"></span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              সর্বশেষ লেখা
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              ({filteredBlogs.length}টি)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs hover:border-[#046A38]/40"
              >
                <span>{sortBy === 'latest' ? 'সর্বশেষ' : 'জনপ্রিয়'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showSortMenu && (
                <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 py-1 text-xs">
                  <button
                    onClick={() => {
                      setSortBy('latest');
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      sortBy === 'latest' ? 'text-[#046A38] font-bold' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    সর্বশেষ
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('popular');
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      sortBy === 'popular' ? 'text-[#046A38] font-bold' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    জনপ্রিয়
                  </button>
                </div>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-slate-100 dark:bg-slate-800 text-[#046A38]'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="লিস্ট ভিউ"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-100 dark:bg-slate-800 text-[#046A38]'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="গ্রিড ভিউ"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Blog Article Cards List */}
        {filteredBlogs.length === 0 ? (
          <div className="py-14 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">
              কোনো ব্লগ আর্টিকেল পাওয়া যায়নি
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              অন্য কোনো ক্যাটাগরি অথবা সার্চ কি-ওয়ার্ড দিয়ে চেষ্টা করুন।
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3.5' : 'space-y-3.5'}>
            {filteredBlogs.map((blog) => {
              const isSaved = bookmarkedIds.includes(blog.id);
              const badgeStyle = categoryColorMap[blog.category] || {
                bg: 'bg-emerald-50 dark:bg-emerald-950/60',
                text: 'text-emerald-700 dark:text-emerald-400',
                border: 'border-emerald-200/80 dark:border-emerald-800/60',
              };

              return (
                <div
                  key={blog.id}
                  onClick={() => setSelectedPost(blog)}
                  className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-[#046A38]/50 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(4,106,56,0.08)] transition-all duration-200 cursor-pointer flex flex-col sm:flex-row gap-3.5 items-stretch"
                >
                  {/* Left Thumbnail Image */}
                  <div className="relative sm:w-44 md:w-48 aspect-16/10 sm:aspect-4/3 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                    <img
                      src={blog.thumbnail}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  {/* Right Content Column */}
                  <div className="flex-1 flex flex-col justify-between py-0.5 space-y-2">
                    <div className="space-y-1.5">
                      {/* Category Badge */}
                      <span className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                        {blog.category}
                      </span>

                      {/* Title */}
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#046A38] dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                        {blog.title}
                      </h3>

                      {/* Excerpt / Short Description */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {blog.excerpt}
                      </p>
                    </div>

                    {/* Footer Meta: Date, Read time, Bookmark */}
                    <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-50 dark:border-slate-800/80">
                      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] sm:text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{blog.published_date}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px] sm:text-xs">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{blog.reading_time_minutes} মিনিট পড়ুন</span>
                        </span>
                      </div>

                      {/* Bookmark Button */}
                      <button
                        onClick={(e) => handleToggleBookmark(e, blog.id)}
                        aria-label="Bookmark post"
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSaved
                            ? 'text-[#046A38] bg-emerald-50 dark:bg-emerald-950/80'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#046A38]' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
