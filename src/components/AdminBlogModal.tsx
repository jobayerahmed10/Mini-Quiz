import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Upload, 
  CheckCircle2, 
  FileText, 
  Image as ImageIcon, 
  Eye, 
  Clock, 
  Calendar, 
  BookOpen, 
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { BlogPost, BlogCategory } from '../types';
import { 
  saveBlogPost, 
  deleteBlogPost, 
  uploadBlogThumbnail, 
  fetchBlogPosts 
} from '../lib/supabase';

interface AdminBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostSaved?: (post: BlogPost) => void;
}

const CATEGORIES: BlogCategory[] = [
  'নিবন্ধন প্রস্তুতি',
  'প্রাইমারি প্রস্তুতি',
  'বিসিএস প্রস্তুতি',
  '১১-২০ গ্রেড প্রস্তুতি',
  'জব সার্কুলার',
];

export const AdminBlogModal: React.FC<AdminBlogModalProps> = ({
  isOpen,
  onClose,
  onPostSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BlogCategory>('নিবন্ধন প্রস্তুতি');
  const [thumbnail, setThumbnail] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('আত-তামরীন শিক্ষক প্যানেল');
  const [publishedDate, setPublishedDate] = useState('৩১ আগস্ট ২০২৬');
  const [readingTime, setReadingTime] = useState<number>(5);
  const [status, setStatus] = useState<'published' | 'draft'>('published');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBlogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchBlogPosts();
      setBlogs(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBlogs();
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadBlogThumbnail(file);
      setThumbnail(url);
      showToast('ছবি সফলভাবে আপলোড হয়েছে!');
    } catch (err: any) {
      showToast('ছবি আপলোডে সমস্যা: ' + (err.message || 'Error'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (blog: BlogPost) => {
    setEditingId(blog.id);
    setTitle(blog.title);
    setCategory(blog.category);
    setThumbnail(blog.thumbnail);
    setExcerpt(blog.excerpt);
    setContent(blog.content);
    setAuthor(blog.author);
    setPublishedDate(blog.published_date);
    setReadingTime(blog.reading_time_minutes);
    setStatus(blog.status);
    setActiveTab('create');
  };

  const handleResetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('নিবন্ধন প্রস্তুতি');
    setThumbnail('');
    setExcerpt('');
    setContent('');
    setAuthor('আত-তামরীন শিক্ষক প্যানেল');
    setPublishedDate('৩১ আগস্ট ২০২৬');
    setReadingTime(5);
    setStatus('published');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('অনুগ্রহ করে শিরোনাম ও মূল কন্টেন্ট পূরণ করুন।');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<BlogPost> & { title: string; content: string; category: BlogCategory } = {
        ...(editingId ? { id: editingId } : {}),
        title: title.trim(),
        category,
        thumbnail: thumbnail.trim() || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
        excerpt: excerpt.trim() || content.substring(0, 140) + '...',
        content: content.trim(),
        author: author.trim() || 'আত-তামরীন একাডেমি',
        published_date: publishedDate.trim() || '৩১ আগস্ট ২০২৬',
        reading_time_minutes: Number(readingTime) || 5,
        status,
      };

      const res = await saveBlogPost(payload);
      if (res.success && res.post) {
        showToast(editingId ? 'পোস্ট সফলভাবে আপডেট হয়েছে!' : 'নতুন পোস্ট সফলভাবে প্রকাশিত হয়েছে!');
        if (onPostSaved) onPostSaved(res.post);
        handleResetForm();
        await loadBlogs();
        setActiveTab('list');
      } else {
        showToast('সংরক্ষণ ব্যর্থ হয়েছে: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      showToast('ত্রুটি: ' + (err.message || 'Error occurred'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত এই ব্লগ পোস্টটি মুছে ফেলতে চান?')) return;
    const ok = await deleteBlogPost(id);
    if (ok) {
      showToast('পোস্ট মুছে ফেলা হয়েছে।');
      loadBlogs();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#046A38] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(4,106,56,0.3)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                ব্লগ ম্যানেজমেন্ট প্যানেল
                <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-full">
                  Admin
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                নতুন ব্লগ ও প্রস্তুতি গাইড প্রকাশ এবং পরিচালনা করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-3 gap-3 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-[#046A38] text-[#046A38] dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {editingId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{editingId ? 'পোস্ট সম্পাদনা' : 'নতুন পোস্ট তৈরি'}</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'list'
                ? 'border-[#046A38] text-[#046A38] dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>সকল পোস্টের তালিকা ({blogs.length})</span>
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="mx-6 mt-3 p-3 bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md animate-slide-down">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পোস্টের শিরোনাম (Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="যেমন: ১৯তম শিক্ষক নিবন্ধনের প্রস্তুতি কীভাবে শুরু করবেন?"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#046A38]"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ক্যাটাগরি (Category) *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BlogCategory)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#046A38]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    স্ট্যাটাস (Status)
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#046A38]"
                  >
                    <option value="published">Published (সবার জন্য উন্মুক্ত)</option>
                    <option value="draft">Draft (খসড়া)</option>
                  </select>
                </div>

                {/* Author */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    লেখক / প্রকাশনা (Author)
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="যেমন: আত-তামরীন শিক্ষক প্যানেল"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#046A38]"
                  />
                </div>

                {/* Published Date & Reading Time */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      প্রকাশের তারিখ
                    </label>
                    <input
                      type="text"
                      value={publishedDate}
                      onChange={(e) => setPublishedDate(e.target.value)}
                      placeholder="৩১ আগস্ট ২০২৬"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#046A38]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      পড়ার সময় (মিনিট)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={readingTime}
                      onChange={(e) => setReadingTime(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#046A38]"
                    />
                  </div>
                </div>

                {/* Thumbnail Upload & URL */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    থাম্বনেইল ইমেজ (Thumbnail Image)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      value={thumbnail}
                      onChange={(e) => setThumbnail(e.target.value)}
                      placeholder="ইমেজ URL অথবা নিচে ফাইল আপলোড করুন"
                      className="w-full flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#046A38]"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0"
                    >
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>ফাইল আপলোড</span>
                    </button>
                  </div>
                  {thumbnail && (
                    <div className="mt-2 relative w-32 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src={thumbnail} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Excerpt / Short Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    সংক্ষিপ্ত বিবরণ (Short Excerpt / ১–২ লাইন)
                  </label>
                  <textarea
                    rows={2}
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="পাঠকদের জন্য পোস্টের ১–২ লাইনের সংক্ষিপ্ত সারসংক্ষেপ লিখুন..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#046A38]"
                  />
                </div>

                {/* Full Article Content */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    সম্পূর্ণ আর্টিকেলের কন্টেন্ট (Full Article Content) *
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="ব্লগের বিস্তারিত লেখা, পয়েন্ট, প্রস্তুতি কৌশল এবং তথ্য এখানে লিখুন (Markdown সাপোর্টেড)..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-sans focus:outline-none focus:border-[#046A38]"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    বাতিল করুন
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#03582e] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-[0_4px_14px_rgba(4,106,56,0.35)] transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingId ? 'আপডেট করুন' : 'ব্লগ পোস্ট প্রকাশ করুন'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Post List Table */
            <div className="space-y-3">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-[#046A38]" />
                  <span className="text-xs">ব্লগ লোড হচ্ছে...</span>
                </div>
              ) : blogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <BookOpen className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm">কোনো ব্লগ পাওয়া যায়নি।</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <th className="py-2.5 px-3">পোস্ট</th>
                        <th className="py-2.5 px-3">ক্যাটাগরি</th>
                        <th className="py-2.5 px-3">তারিখ</th>
                        <th className="py-2.5 px-3">স্ট্যাটাস</th>
                        <th className="py-2.5 px-3 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {blogs.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={b.thumbnail}
                                alt={b.title}
                                className="w-12 h-9 rounded-lg object-cover shrink-0"
                              />
                              <div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                                  {b.title}
                                </h4>
                                <p className="text-[11px] text-slate-400 line-clamp-1">{b.excerpt}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                              {b.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {b.published_date}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.status === 'published'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {b.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEdit(b)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                                title="সম্পাদনা"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(b.id)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
