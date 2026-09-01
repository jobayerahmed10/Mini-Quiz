import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Check,
  List, 
  X,
  SlidersHorizontal
} from 'lucide-react';
import { BlogPost, BlogCategory } from '../types';
import { BLOG_TAXONOMY, BlogTaxonomyCategory, BlogTaxonomySubCategory } from '../data/blogData';
import { 
  fetchBlogPosts, 
  getCachedBlogs,
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
  const [blogs, setBlogs] = useState<BlogPost[]>(() => getCachedBlogs());
  const [selectedCategory, setSelectedCategory] = useState<SelectedFilter>('সবগুলো');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  // Dropdown open state for subcategory
  const [openSubCategoryDropdown, setOpenSubCategoryDropdown] = useState<string | null>(null);
  
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showSortMenu, setShowSortMenu] = useState<boolean>(false);
  const [filterBookmarkedOnly, setFilterBookmarkedOnly] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenSubCategoryDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // Get current active sub-categories from taxonomy
  const activeTaxonomyCategory: BlogTaxonomyCategory | undefined = useMemo(() => {
    if (selectedCategory === 'সবগুলো') return undefined;
    return BLOG_TAXONOMY.find(cat => cat.name === selectedCategory);
  }, [selectedCategory]);

  const activeSubCategories: BlogTaxonomySubCategory[] = useMemo(() => {
    return activeTaxonomyCategory?.subCategories || [];
  }, [activeTaxonomyCategory]);

  // Handle Main Category selection
  const handleSelectCategory = (catId: SelectedFilter) => {
    setSelectedCategory(catId);
    setSelectedSubCategory(null);
    setSelectedSubject(null);
    setOpenSubCategoryDropdown(null);
    setFilterBookmarkedOnly(false);
  };

  // Handle Sub-Category click: toggle dropdown
  const handleToggleSubCategoryDropdown = (subCatName: string) => {
    if (openSubCategoryDropdown === subCatName) {
      setOpenSubCategoryDropdown(null);
    } else {
      setOpenSubCategoryDropdown(subCatName);
    }
  };

  // Handle Subject selection from inside dropdown
  const handleSelectSubject = (subCatName: string, subjectName: string | null) => {
    setSelectedSubCategory(subCatName);
    setSelectedSubject(subjectName);
    setOpenSubCategoryDropdown(null);
  };

  // Clear all filters back to all
  const handleClearFilters = () => {
    setSelectedCategory('সবগুলো');
    setSelectedSubCategory(null);
    setSelectedSubject(null);
    setOpenSubCategoryDropdown(null);
    setFilterBookmarkedOnly(false);
  };

  // Filter and Sort Logic
  const filteredBlogs = useMemo(() => {
    return blogs
      .filter((post) => {
        // Only show published posts
        if (post.status === 'draft') return false;

        // Level 1: Category filter
        if (selectedCategory !== 'সবগুলো' && post.category !== selectedCategory) {
          return false;
        }

        // Level 2: Sub-Category filter
        if (selectedSubCategory && post.sub_category && post.sub_category !== selectedSubCategory) {
          return false;
        }

        // Level 3: Subject filter
        if (selectedSubject && selectedSubject !== 'সব বিষয়' && post.subject && post.subject !== selectedSubject) {
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
          const matchSubCategory = post.sub_category?.toLowerCase().includes(q) || false;
          const matchSubject = post.subject?.toLowerCase().includes(q) || false;
          return matchTitle || matchExcerpt || matchCategory || matchSubCategory || matchSubject;
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
  }, [blogs, selectedCategory, selectedSubCategory, selectedSubject, filterBookmarkedOnly, searchQuery, sortBy, bookmarkedIds]);

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
      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-2 space-y-3">
        
        {/* ========================================================================= */}
        {/* ১ম স্তর: Main Category Horizontal Scrollable Pills (Directly Under Header) */}
        {/* ========================================================================= */}
        <div className="relative pt-0.5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
            {CATEGORY_ITEMS.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id && !filterBookmarkedOnly;
              return (
                <button
                  key={cat.id}
                  id={`cat-pill-${cat.id}`}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl sm:rounded-2xl text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#046A38] text-white shadow-[0_4px_12px_rgba(4,106,56,0.3)] scale-[1.02]'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-[#046A38]/40 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}

            {/* Saved Bookmarks filter button */}
            <button
              id="cat-pill-bookmarks"
              onClick={() => {
                setFilterBookmarkedOnly(!filterBookmarkedOnly);
                if (!filterBookmarkedOnly) {
                  setSelectedSubCategory(null);
                  setSelectedSubject(null);
                  setOpenSubCategoryDropdown(null);
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl sm:rounded-2xl text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
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

        {/* ========================================================================= */}
        {/* ২য় ও ৩য় স্তর: Sub-Category Buttons with Interactive Dropdown (Subject)  */}
        {/* ========================================================================= */}
        {selectedCategory !== 'সবগুলো' && activeSubCategories.length > 0 && (
          <div 
            ref={dropdownRef}
            className="relative bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 transition-all duration-200"
          >
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#046A38] dark:text-emerald-400 shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">
                {selectedCategory} এর বিষয়সমূহ:
              </span>
              {(selectedSubCategory || selectedSubject) && (
                <button
                  onClick={() => {
                    setSelectedSubCategory(null);
                    setSelectedSubject(null);
                    setOpenSubCategoryDropdown(null);
                  }}
                  className="ml-auto text-[11px] text-[#046A38] dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>ফিল্টার রিসেট</span>
                </button>
              )}
            </div>

            {/* Sub-Category Interactive Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {/* All in Category Button */}
              <button
                onClick={() => {
                  setSelectedSubCategory(null);
                  setSelectedSubject(null);
                  setOpenSubCategoryDropdown(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  !selectedSubCategory
                    ? 'bg-[#046A38] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                সব বিষয়
              </button>

              {/* Sub Categories with Dropdown triggers */}
              {activeSubCategories.map((subCat) => {
                const isSubActive = selectedSubCategory === subCat.name;
                const isDropdownOpen = openSubCategoryDropdown === subCat.name;

                return (
                  <div key={subCat.id} className="relative shrink-0">
                    <button
                      id={`subcat-btn-${subCat.id}`}
                      onClick={() => handleToggleSubCategoryDropdown(subCat.name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isSubActive
                          ? 'bg-[#046A38] text-white shadow-xs ring-2 ring-[#046A38]/30'
                          : isDropdownOpen
                          ? 'bg-emerald-50 dark:bg-slate-800 text-[#046A38] dark:text-emerald-400 border border-[#046A38]/40'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#046A38]/40 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>
                        {subCat.name}
                        {isSubActive && selectedSubject && (
                          <span className="opacity-90 font-normal ml-1">
                            • {selectedSubject}
                          </span>
                        )}
                      </span>
                      <ChevronDown 
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isDropdownOpen ? 'rotate-180 text-white' : isSubActive ? 'text-white' : 'text-slate-400'
                        }`} 
                      />
                    </button>

                    {/* ৩য় স্তর: Dropdown Menu with Subjects */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-60 sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 p-1.5 animate-slide-down">
                        <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {subCat.name} - বিষয় নির্বাচন করুন:
                          </span>
                        </div>

                        {/* Option: View all in this Sub-Category */}
                        <button
                          onClick={() => handleSelectSubject(subCat.name, null)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                            isSubActive && !selectedSubject
                              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-[#046A38] dark:text-emerald-400 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>{subCat.name} (সব)</span>
                          {isSubActive && !selectedSubject && (
                            <Check className="w-3.5 h-3.5 text-[#046A38] dark:text-emerald-400" />
                          )}
                        </button>

                        {/* List of Subjects */}
                        {subCat.subjects.map((sbj) => {
                          const isSubjectSelected = isSubActive && selectedSubject === sbj;
                          return (
                            <button
                              key={sbj}
                              onClick={() => handleSelectSubject(subCat.name, sbj)}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                                isSubjectSelected
                                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-[#046A38] dark:text-emerald-400 font-bold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span className="truncate">{sbj}</span>
                              {isSubjectSelected && (
                                <Check className="w-3.5 h-3.5 text-[#046A38] dark:text-emerald-400 shrink-0 ml-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Filter Pill Summary (if filtered down) */}
        {(selectedCategory !== 'সবগুলো' || selectedSubCategory || selectedSubject || filterBookmarkedOnly || searchQuery.trim()) && (
          <div className="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">
            <span className="text-slate-400 text-[11px]">ফিল্টার:</span>
            {selectedCategory !== 'সবগুলো' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#046A38] dark:text-emerald-400 font-medium text-[11px] border border-emerald-200/60 dark:border-emerald-800/40">
                {selectedCategory}
              </span>
            )}
            {selectedSubCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/60 text-[#046A38] dark:text-emerald-300 font-medium text-[11px] border border-emerald-300/60 dark:border-emerald-700/40">
                {selectedSubCategory}
              </span>
            )}
            {selectedSubject && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#046A38] text-white font-medium text-[11px]">
                {selectedSubject}
              </span>
            )}
            {filterBookmarkedOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-medium text-[11px] border border-amber-200 dark:border-amber-800">
                বুকমার্ক করা
              </span>
            )}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                "{searchQuery}"
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-[#046A38] dark:hover:text-emerald-400 underline ml-1 cursor-pointer"
            >
              মুছে ফেলুন
            </button>
          </div>
        )}

        {/* Section Heading & Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#046A38] rounded-full inline-block"></span>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {selectedSubject ? `${selectedSubject} সংক্রান্ত পোস্ট` : selectedSubCategory ? `${selectedSubCategory} এর পোস্ট` : selectedCategory !== 'সবগুলো' ? `${selectedCategory} এর পোস্ট` : 'সর্বশেষ লেখা'}
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              অন্য কোনো ক্যাটাগরি, বিষয় অথবা সার্চ কি-ওয়ার্ড দিয়ে চেষ্টা করুন।
            </p>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-[#046A38] text-white rounded-xl text-xs font-bold hover:bg-[#03542c] transition-colors"
            >
              সবগুলো পোস্ট দেখুন
            </button>
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
                  id={`blog-card-${blog.id}`}
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
                      {/* Badges: Category, SubCategory & Subject */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                          {blog.category}
                        </span>

                        {blog.sub_category && (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700">
                            {blog.sub_category}
                          </span>
                        )}

                        {blog.subject && (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-md bg-emerald-50/80 dark:bg-emerald-950/50 text-[#046A38] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                            {blog.subject}
                          </span>
                        )}
                      </div>

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
                        id={`bookmark-btn-${blog.id}`}
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
