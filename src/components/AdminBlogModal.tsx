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
  AlertCircle,
  Check,
  XCircle,
  MessageSquare,
  Flag,
  ShieldCheck,
  Filter,
  CreditCard,
  Crown,
  Search,
  Phone,
  User,
  HelpCircle,
  Layers,
  Tag
} from 'lucide-react';
import { BlogPost, BlogCategory, QuestionCommunityExplanation, CourseEnrollmentRecord } from '../types';
import { BLOG_TAXONOMY } from '../data/blogData';
import { 
  saveBlogPost, 
  deleteBlogPost, 
  uploadBlogThumbnail, 
  fetchBlogPosts,
  fetchAllExplanationsForAdmin,
  approveExplanationInSupabase,
  rejectExplanationInSupabase,
  fetchAllQuestionReportsForAdmin,
  fetchCourseApplicationsFromSupabase,
  updateEnrollmentStatusInSupabase,
  addQuestionToSupabase,
  deleteQuestionFromSupabase,
  fetchSubjectsForAdmin,
  fetchTopicsForAdmin,
  fetchSubTopicsForAdmin,
  AdminSubjectOption,
  AdminTopicOption,
  AdminSubTopicOption
} from '../lib/supabase';
import { getAllAvailableAdminQuestions } from '../lib/mockTopicService';
import { approveUserPremiumPackage, toBengaliNumeral } from '../lib/utils';

import { RichTextEditor } from './RichTextEditor';

// HTML Sanitization for Blog Content
const sanitizeBlogContent = (html: string): string => {
  if (!html) return '';
  if (typeof window === 'undefined') return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const cleanNode = (node: Node): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.cloneNode(true);
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      
      // Allowed tags: Paragraphs, Headings, Lists, Formatting, Images
      const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'span', 'div', 'img'];
      
      if (!allowedTags.includes(tag)) {
        const fragment = document.createDocumentFragment();
        el.childNodes.forEach(child => {
          const cleanedChild = cleanNode(child);
          if (cleanedChild) fragment.appendChild(cleanedChild);
        });
        return fragment;
      }

      const newEl = document.createElement(tag);
      
      // Preserve images but with clean attributes
      if (tag === 'img') {
        const src = el.getAttribute('src');
        const alt = el.getAttribute('alt');
        if (src) newEl.setAttribute('src', src);
        if (alt) newEl.setAttribute('alt', alt);
        newEl.className = 'rounded-2xl max-w-full h-auto my-4 border border-slate-100 dark:border-slate-800';
      }

      // REMOVE all other attributes (inline styles, MS Word junk, font-family, etc.)
      // as requested: "হাবিজাবি Tag & Attributes ছাঁটাই (Sanitize) করে পরিষ্কার বিশুদ্ধ HTML ডাটা সেভ করো"
      
      el.childNodes.forEach(child => {
        const cleanedChild = cleanNode(child);
        if (cleanedChild) newEl.appendChild(cleanedChild);
      });
      
      return newEl;
    }
    
    return null;
  };

  const container = document.createElement('div');
  doc.body.childNodes.forEach(node => {
    const cleaned = cleanNode(node);
    if (cleaned) container.appendChild(cleaned);
  });
  
  return container.innerHTML.trim();
};

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
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'explanations' | 'reports' | 'enrollments' | 'questions'>('create');
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Question Bank State
  const [adminQuestionsList, setAdminQuestionsList] = useState<any[]>([]);
  const [questionSubjects, setQuestionSubjects] = useState<AdminSubjectOption[]>([]);
  const [questionTopics, setQuestionTopics] = useState<AdminTopicOption[]>([]);
  const [questionSubTopics, setQuestionSubTopics] = useState<AdminSubTopicOption[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);

  const [qSubjectId, setQSubjectId] = useState<string>('');
  const [qSubjectName, setQSubjectName] = useState<string>('');
  const [qTopicId, setQTopicId] = useState<string>('');
  const [qTopicName, setQTopicName] = useState<string>('');
  const [qSubTopicId, setQSubTopicId] = useState<string>('');
  const [qSubTopicName, setQSubTopicName] = useState<string>('');

  const [qQuestion, setQQuestion] = useState<string>('');
  const [qOptionA, setQOptionA] = useState<string>('');
  const [qOptionB, setQOptionB] = useState<string>('');
  const [qOptionC, setQOptionC] = useState<string>('');
  const [qOptionD, setQOptionD] = useState<string>('');
  const [qCorrectAnswer, setQCorrectAnswer] = useState<'option_a' | 'option_b' | 'option_c' | 'option_d'>('option_a');
  const [qExplanation, setQExplanation] = useState<string>('');
  const [qStatus, setQStatus] = useState<'published' | 'draft'>('published');
  const [isSubmittingQ, setIsSubmittingQ] = useState<boolean>(false);
  const [questionSearchQuery, setQuestionSearchQuery] = useState<string>('');

  // Moderation & Enrollments state
  const [adminExplanations, setAdminExplanations] = useState<QuestionCommunityExplanation[]>([]);
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [explanationFilter, setExplanationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [isLoadingModeration, setIsLoadingModeration] = useState<boolean>(false);

  const [enrollments, setEnrollments] = useState<CourseEnrollmentRecord[]>([]);
  const [enrollmentFilter, setEnrollmentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [enrollmentSearch, setEnrollmentSearch] = useState<string>('');
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState<boolean>(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BlogCategory>('নিবন্ধন প্রস্তুতি');
  const [subCategory, setSubCategory] = useState<string>('সহকারী মৌলভী');
  const [subject, setSubject] = useState<string>('কুরআন ও তাফসির');
  const [thumbnail, setThumbnail] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('আত-তামরীন শিক্ষক প্যানেল');
  const [publishedDate, setPublishedDate] = useState('৩১ আগস্ট ২০২৬');
  const [readingTime, setReadingTime] = useState<number>(5);
  const [status, setStatus] = useState<'published' | 'draft'>('published');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get available sub-categories for the selected category
  const currentCategoryTaxonomy = BLOG_TAXONOMY.find(c => c.name === category);
  const availableSubCategories = currentCategoryTaxonomy?.subCategories || [];
  const currentSubCategoryTaxonomy = availableSubCategories.find(s => s.name === subCategory);
  const availableSubjects = currentSubCategoryTaxonomy?.subjects || [];

  const handleCategoryChange = (newCat: BlogCategory) => {
    setCategory(newCat);
    const tax = BLOG_TAXONOMY.find(c => c.name === newCat);
    if (tax && tax.subCategories.length > 0) {
      const firstSub = tax.subCategories[0];
      setSubCategory(firstSub.name);
      if (firstSub.subjects.length > 0) {
        setSubject(firstSub.subjects[0]);
      } else {
        setSubject('');
      }
    } else {
      setSubCategory('');
      setSubject('');
    }
  };

  const handleSubCategoryChange = (newSub: string) => {
    setSubCategory(newSub);
    const subTax = availableSubCategories.find(s => s.name === newSub);
    if (subTax && subTax.subjects.length > 0) {
      setSubject(subTax.subjects[0]);
    } else {
      setSubject('');
    }
  };

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

  const loadModerationData = async () => {
    setIsLoadingModeration(true);
    try {
      const [expls, reps] = await Promise.all([
        fetchAllExplanationsForAdmin(),
        fetchAllQuestionReportsForAdmin(),
      ]);
      setAdminExplanations(expls || []);
      setAdminReports(reps || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoadingModeration(false);
    }
  };

  const loadEnrollmentsData = async () => {
    setIsLoadingEnrollments(true);
    try {
      const res = await fetchCourseApplicationsFromSupabase();
      setEnrollments(res.applications || []);
    } catch (e) {
      console.warn('loadEnrollmentsData error:', e);
    } finally {
      setIsLoadingEnrollments(false);
    }
  };

  const loadQuestionBankData = async () => {
    setIsLoadingQuestions(true);
    try {
      const [subjs, qList] = await Promise.all([
        fetchSubjectsForAdmin(),
        getAllAvailableAdminQuestions(),
      ]);
      setQuestionSubjects(subjs);
      setAdminQuestionsList(qList);

      if (subjs.length > 0 && !qSubjectId) {
        const firstSub = subjs[0];
        setQSubjectId(firstSub.id);
        setQSubjectName(firstSub.name);
        const tops = await fetchTopicsForAdmin(firstSub.id);
        setQuestionTopics(tops);
        if (tops.length > 0) {
          setQTopicId(tops[0].id);
          setQTopicName(tops[0].title);
          const subTops = await fetchSubTopicsForAdmin(tops[0].id);
          setQuestionSubTopics(subTops);
          if (subTops.length > 0) {
            setQSubTopicId(subTops[0].id);
            setQSubTopicName(subTops[0].title);
          }
        }
      }
    } catch (e) {
      console.warn('loadQuestionBankData error:', e);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBlogs();
      loadModerationData();
      loadEnrollmentsData();
      loadQuestionBankData();
    }
  }, [isOpen]);

  const handleSubjectChange = async (subjId: string) => {
    setQSubjectId(subjId);
    const matched = questionSubjects.find((s) => s.id === subjId);
    const sName = matched ? matched.name : '';
    setQSubjectName(sName);
    setQTopicId('');
    setQTopicName('');
    setQSubTopicId('');
    setQSubTopicName('');

    const tops = await fetchTopicsForAdmin(subjId);
    setQuestionTopics(tops);
    if (tops.length > 0) {
      setQTopicId(tops[0].id);
      setQTopicName(tops[0].title);
      const subTops = await fetchSubTopicsForAdmin(tops[0].id);
      setQuestionSubTopics(subTops);
      if (subTops.length > 0) {
        setQSubTopicId(subTops[0].id);
        setQSubTopicName(subTops[0].title);
      }
    } else {
      setQuestionSubTopics([]);
    }
  };

  const handleTopicChange = async (topId: string) => {
    setQTopicId(topId);
    const matched = questionTopics.find((t) => t.id === topId);
    const tName = matched ? matched.title : '';
    setQTopicName(tName);
    setQSubTopicId('');
    setQSubTopicName('');

    const subTops = await fetchSubTopicsForAdmin(topId);
    setQuestionSubTopics(subTops);
    if (subTops.length > 0) {
      setQSubTopicId(subTops[0].id);
      setQSubTopicName(subTops[0].title);
    }
  };

  const handleSubTopicChange = (subId: string) => {
    setQSubTopicId(subId);
    const matched = questionSubTopics.find((st) => st.id === subId);
    setQSubTopicName(matched ? matched.title : '');
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qQuestion.trim()) {
      showToast('অনুগ্রহ করে প্রশ্ন লিখুন!');
      return;
    }
    if (!qOptionA.trim() || !qOptionB.trim() || !qOptionC.trim() || !qOptionD.trim()) {
      showToast('অনুগ্রহ করে ৪টি অপশন পূরণ করুন!');
      return;
    }

    // Fully resolve subject name & ID
    let finalSubjName = qSubjectName.trim();
    let finalSubjId = qSubjectId.trim();
    if (!finalSubjName && finalSubjId) {
      const foundSub = questionSubjects.find((s) => s.id === finalSubjId);
      if (foundSub) finalSubjName = foundSub.name;
    }
    if (!finalSubjName) {
      showToast('অনুগ্রহ করে বিষয় নির্বাচন করুন!');
      return;
    }

    // Fully resolve topic name & ID
    let finalTopName = qTopicName.trim();
    let finalTopId = qTopicId.trim();
    if (!finalTopName && finalTopId) {
      const foundTop = questionTopics.find((t) => t.id === finalTopId);
      if (foundTop) finalTopName = foundTop.title;
    }

    // Fully resolve sub-topic name & ID
    let finalSubTopName = qSubTopicName.trim();
    let finalSubTopId = qSubTopicId.trim();
    if (!finalSubTopName && finalSubTopId) {
      const foundSubTop = questionSubTopics.find((st) => st.id === finalSubTopId);
      if (foundSubTop) finalSubTopName = foundSubTop.title;
    }

    setIsSubmittingQ(true);
    try {
      const res = await addQuestionToSupabase({
        question: qQuestion,
        option_a: qOptionA,
        option_b: qOptionB,
        option_c: qOptionC,
        option_d: qOptionD,
        correct_answer: qCorrectAnswer,
        subject: finalSubjName,
        subject_id: finalSubjId || undefined,
        topic: finalTopName || undefined,
        topic_id: finalTopId || undefined,
        sub_topic: finalSubTopName || undefined,
        sub_topic_id: finalSubTopId || undefined,
        explanation: qExplanation.trim() || undefined,
        status: qStatus,
      });

      if (res.success && res.data) {
        showToast('✓ প্রশ্নটি সফলভাবে Supabase ডাটাবেসে subject_id, topic_id এবং sub_topic_id সহ সেভ হয়েছে!');
        setQQuestion('');
        setQOptionA('');
        setQOptionB('');
        setQOptionC('');
        setQOptionD('');
        setQExplanation('');
        const updated = await getAllAvailableAdminQuestions();
        setAdminQuestionsList(updated);
      } else {
        showToast(res.error || 'প্রশ্ন সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      showToast(`ত্রুটি: ${err.message || 'প্রশ্ন সংরক্ষণ করতে ব্যর্থ'}`);
    } finally {
      setIsSubmittingQ(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই প্রশ্নটি মুছে ফেলতে চান?')) return;
    try {
      const res = await deleteQuestionFromSupabase(id);
      if (res.success) {
        showToast('প্রশ্ন সফলভাবে মুছে ফেলা হয়েছে।');
        const updated = await getAllAvailableAdminQuestions();
        setAdminQuestionsList(updated);
      } else {
        showToast(res.error || 'মুছে ফেলতে ব্যর্থ');
      }
    } catch (err: any) {
      showToast(`ত্রুটি: ${err.message}`);
    }
  };

  const handleApproveEnrollment = async (item: CourseEnrollmentRecord) => {
    if (!item.id) return;
    try {
      const res = await updateEnrollmentStatusInSupabase(item.id, 'approved', item);
      if (res.success) {
        setEnrollments((prev) =>
          prev.map((e) => (e.id === item.id ? { ...e, status: 'approved' } : e))
        );
        approveUserPremiumPackage(item);
        showToast('প্রিমিয়াম প্যাকেজ আবেদন অনুমোদন করা হয়েছে এবং নোটিফিকেশন পাঠানো হয়েছে!');
      } else {
        showToast('অনুমোদন করতে ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      showToast('ত্রুটি: ' + (err?.message || 'Error'));
    }
  };

  const handleRejectEnrollment = async (item: CourseEnrollmentRecord) => {
    if (!item.id) return;
    try {
      const res = await updateEnrollmentStatusInSupabase(item.id, 'rejected', item);
      if (res.success) {
        setEnrollments((prev) =>
          prev.map((e) => (e.id === item.id ? { ...e, status: 'rejected' } : e))
        );
        showToast('আবেদনটি বাতিল করা হয়েছে।');
      } else {
        showToast('বাতিল করতে ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      showToast('ত্রুটি: ' + (err?.message || 'Error'));
    }
  };

  const handleApproveExplanation = async (id: string) => {
    try {
      const ok = await approveExplanationInSupabase(id);
      if (ok) {
        setAdminExplanations((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: 'approved' } : e))
        );
        showToast('ব্যাখ্যাটি সফলভাবে অনুমোদন করা হয়েছে!');
      } else {
        showToast('অনুমোদন করতে ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      showToast('ত্রুটি: ' + (err?.message || 'Error'));
    }
  };

  const handleRejectExplanation = async (id: string) => {
    try {
      const ok = await rejectExplanationInSupabase(id);
      if (ok) {
        setAdminExplanations((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: 'rejected' } : e))
        );
        showToast('ব্যাখ্যাটি বাতিল করা হয়েছে।');
      } else {
        showToast('বাতিল করতে ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      showToast('ত্রুটি: ' + (err?.message || 'Error'));
    }
  };

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
    setSubCategory(blog.sub_category || '');
    setSubject(blog.subject || '');
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
    setSubCategory('সহকারী মৌলভী');
    setSubject('কুরআন ও তাফসির');
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
      // Sanitize and Clean Content before saving to ensure pure HTML as requested
      const cleanedContent = sanitizeBlogContent(content);

      const payload: Partial<BlogPost> & { title: string; content: string; category: BlogCategory; sub_category?: string; subject?: string } = {
        ...(editingId ? { id: editingId } : {}),
        title: title.trim(),
        category,
        sub_category: subCategory.trim() || undefined,
        subject: subject.trim() || undefined,
        thumbnail: thumbnail.trim() || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
        excerpt: excerpt.trim() || cleanedContent.replace(/<[^>]*>/g, '').substring(0, 140) + '...',
        content: cleanedContent,
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
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-3 gap-2 sm:gap-3 bg-white dark:bg-slate-900 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
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
            className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'list'
                ? 'border-[#046A38] text-[#046A38] dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>সকল পোস্ট ({blogs.length})</span>
          </button>

          {/* Explanations Moderation Tab */}
          <button
            onClick={() => setActiveTab('explanations')}
            className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'explanations'
                ? 'border-[#046A38] text-[#046A38] dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>ব্যাখ্যা অনুমোদন</span>
            {adminExplanations.filter((e) => e.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black bg-amber-500 text-white rounded-full">
                {adminExplanations.filter((e) => e.status === 'pending').length}
              </span>
            )}
          </button>

          {/* Question Reports Tab */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-[#046A38] text-[#046A38] dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>রিপোর্ট ({adminReports.length})</span>
          </button>

          {/* Package / Enrollments Approval Tab */}
          <button
            onClick={() => setActiveTab('enrollments')}
            className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'enrollments'
                ? 'border-[#046A38] text-[#046A38] dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-500" />
            <span>প্যাকেজ অনুমোদন</span>
            {enrollments.filter((e) => e.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black bg-amber-500 text-white rounded-full animate-pulse">
                {enrollments.filter((e) => e.status === 'pending').length}
              </span>
            )}
          </button>

          {/* Question Bank Tab */}
          <button
            onClick={() => {
              setActiveTab('questions');
              loadQuestionBankData();
            }}
            className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'questions'
                ? 'border-[#046A38] text-[#046A38] dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>প্রশ্ন ব্যাংক ({adminQuestionsList.length})</span>
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
                    মূল ক্যাটাগরি (Main Category) *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as BlogCategory)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#046A38]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    সাব-ক্যাটাগরি (Sub-Category)
                  </label>
                  <select
                    value={subCategory}
                    onChange={(e) => handleSubCategoryChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#046A38]"
                  >
                    <option value="">-- সাব-ক্যাটাগরি নির্বাচন করুন --</option>
                    {availableSubCategories.map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    বিষয় / টপিক (Subject / Topic)
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#046A38]"
                  >
                    <option value="">-- বিষয় নির্বাচন করুন --</option>
                    {availableSubjects.map((sbj) => (
                      <option key={sbj} value={sbj}>
                        {sbj}
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

                {/* Full Article Content - Now Using Rich Text Editor */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    সম্পূর্ণ আর্টিকেলের কন্টেন্ট (Rich Text Editor) *
                  </label>
                  <RichTextEditor
                    value={content}
                    onChange={(val) => setContent(val)}
                    placeholder="ব্লগের বিস্তারিত লেখা, পয়েন্ট, প্রস্তুতি কৌশল এবং তথ্য এখানে লিখুন (Word/Web থেকে কপি-পেস্ট সাপোর্ট করে)..."
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
          ) : activeTab === 'list' ? (
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
          ) : activeTab === 'explanations' ? (
            /* Explanations Moderation Panel */
            <div className="space-y-4">
              {/* Filter Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ফিল্টার:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(['pending', 'approved', 'rejected', 'all'] as const).map((filterKey) => {
                    const count =
                      filterKey === 'all'
                        ? adminExplanations.length
                        : adminExplanations.filter((e) => e.status === filterKey).length;
                    const labels = {
                      pending: 'অপেক্ষমাণ',
                      approved: 'অনুমোদিত',
                      rejected: 'বাতিলকৃত',
                      all: 'সকল',
                    };
                    return (
                      <button
                        key={filterKey}
                        onClick={() => setExplanationFilter(filterKey)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          explanationFilter === filterKey
                            ? 'bg-[#046A38] text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {labels[filterKey]} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanations List */}
              {isLoadingModeration ? (
                <div className="py-12 text-center text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#046A38]" />
                  <p className="text-xs font-semibold">ব্যাখ্যা লোড হচ্ছে...</p>
                </div>
              ) : adminExplanations.filter((e) =>
                  explanationFilter === 'all' ? true : e.status === explanationFilter
                ).length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-semibold">এই ক্যাটাগরিতে কোনো ব্যাখ্যা পাওয়া যায়নি।</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adminExplanations
                    .filter((e) => (explanationFilter === 'all' ? true : e.status === explanationFilter))
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                              {item.author_name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                  {item.author_name}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  QID: {item.question_id}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400">
                                {item.created_at ? new Date(item.created_at).toLocaleString('bn-BD') : ''}
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              item.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : item.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                            }`}
                          >
                            {item.status === 'approved'
                              ? '✓ অনুমোদিত'
                              : item.status === 'rejected'
                              ? '✕ বাতিলকৃত'
                              : '⏳ অপেক্ষমাণ'}
                          </span>
                        </div>

                        {/* Explanation Text */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap border border-slate-100 dark:border-slate-800">
                          {item.explanation}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          {item.status !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleApproveExplanation(item.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>অনুমোদন করুন</span>
                            </button>
                          )}
                          {item.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => handleRejectExplanation(item.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>বাতিল করুন</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : activeTab === 'enrollments' ? (
            /* Enrollments & Package Approval Panel */
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={enrollmentSearch}
                    onChange={(e) => setEnrollmentSearch(e.target.value)}
                    placeholder="নাম, ফোন বা TRX ID খুঁজুন..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  {enrollmentSearch && (
                    <button
                      onClick={() => setEnrollmentSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
                  {(['pending', 'approved', 'rejected', 'all'] as const).map((filterKey) => {
                    const count =
                      filterKey === 'all'
                        ? enrollments.length
                        : enrollments.filter((e) => e.status === filterKey).length;
                    const labels: Record<string, string> = {
                      pending: 'অপেক্ষমাণ',
                      approved: 'অনুমোদিত',
                      rejected: 'বাতিলকৃত',
                      all: 'সকল আবেদন',
                    };

                    return (
                      <button
                        key={filterKey}
                        onClick={() => setEnrollmentFilter(filterKey)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          enrollmentFilter === filterKey
                            ? 'bg-[#046A38] text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {labels[filterKey]} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Items List */}
              {isLoadingEnrollments ? (
                <div className="py-12 text-center text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#046A38]" />
                  <p className="text-xs font-semibold">আবেদনসমূহ লোড হচ্ছে...</p>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <CreditCard className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-semibold">কোনো প্যাকেজ ক্রয় আবেদন পাওয়া যায়নি।</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments
                    .filter((item) => {
                      if (enrollmentFilter !== 'all' && item.status !== enrollmentFilter) return false;
                      if (enrollmentSearch.trim()) {
                        const q = enrollmentSearch.toLowerCase().trim();
                        const nameMatch = (item.student_name || '').toLowerCase().includes(q);
                        const phoneMatch = (item.phone_number || '').toLowerCase().includes(q);
                        const trxMatch = (item.transaction_id || '').toLowerCase().includes(q);
                        const titleMatch = (item.course_title || '').toLowerCase().includes(q);
                        return nameMatch || phoneMatch || trxMatch || titleMatch;
                      }
                      return true;
                    })
                    .map((item) => (
                      <div
                        key={item.id || item.transaction_id}
                        className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3"
                      >
                        {/* Top Info Header */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {item.student_name || 'শিক্ষার্থী'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-[10px] shrink-0 border border-amber-300/40">
                                {item.course_title || 'প্রিমিয়াম প্যাকেজ'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <span className="font-mono">{item.phone_number}</span>
                              </span>
                              {item.email && (
                                <span className="truncate max-w-[150px]">{item.email}</span>
                              )}
                            </div>
                          </div>

                          {/* Status Pill */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black shrink-0 ${
                              item.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                                : item.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 animate-pulse'
                            }`}
                          >
                            {item.status === 'approved'
                              ? '✓ অনুমোদিত'
                              : item.status === 'rejected'
                              ? '✕ বাতিলকৃত'
                              : '⏳ অপেক্ষমাণ'}
                          </span>
                        </div>

                        {/* Payment & Transaction Details Box */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs border border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400">মেথড:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                              {item.payment_method || 'bKash'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400">টাকার পরিমাণ:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              ৳{toBengaliNumeral(item.amount || '৩৫০')}
                            </span>
                          </div>
                          <div className="col-span-2 sm:col-span-2">
                            <span className="block text-[10px] font-bold text-slate-400">ট্রানজেকশন আইডি (TrxID):</span>
                            <span className="font-mono font-black text-amber-600 dark:text-amber-400 tracking-wider">
                              {item.transaction_id || 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Date & Actions */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] font-medium text-slate-400">
                            তারিখ: {item.created_at ? new Date(item.created_at).toLocaleString('bn-BD') : 'সাম্প্রতিক'}
                          </span>

                          <div className="flex items-center gap-2">
                            {item.status !== 'approved' && (
                              <button
                                type="button"
                                onClick={() => handleApproveEnrollment(item)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>এপ্রুভ করুন</span>
                              </button>
                            )}
                            {item.status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => handleRejectEnrollment(item)}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>বাতিল করুন</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : activeTab === 'reports' ? (
            /* Question Reports Panel */
            <div className="space-y-4">
              {isLoadingModeration ? (
                <div className="py-12 text-center text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#046A38]" />
                  <p className="text-xs font-semibold">রিপোর্ট লোড হচ্ছে...</p>
                </div>
              ) : adminReports.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Flag className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-semibold">কোনো রিপোর্ট পাওয়া যায়নি।</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adminReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                            {rep.reason}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            QID: {rep.question_id}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {rep.created_at ? new Date(rep.created_at).toLocaleString('bn-BD') : ''}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {rep.details || 'কোনো বিবরণ দেওয়া হয়নি।'}
                      </p>
                      <div className="text-[10px] text-slate-400 pt-1">
                        রিপোর্টকারী: <span className="font-bold">{rep.user_name || 'অজানা'}</span>{' '}
                        {rep.phone && `(${rep.phone})`} {rep.email && `[${rep.email}]`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Question Bank & Add Panel (activeTab === 'questions') */
            <div className="space-y-6">
              {/* Form: Add Question */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#046A38] dark:text-emerald-400">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">নতুন MCQ প্রশ্ন যুক্ত করুন</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">বিষয়, অধ্যায়/টপিক ও সাব-টপিক সিলেক্ট করলে স্বয়ংক্রিয়ভাবে topic_id এবং sub_topic_id ডাটাবেসে সেভ হবে</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCreateQuestion} className="space-y-4">
                  {/* Cascade Dropdowns: Subject, Topic, Sub-Topic */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Subject Dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">বিষয় (Subject) *</label>
                      <select
                        value={qSubjectId}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="">বিষয় নির্বাচন করুন</option>
                        {questionSubjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      {qSubjectId && (
                        <span className="text-[10px] text-slate-400 font-mono">ID: {qSubjectId}</span>
                      )}
                    </div>

                    {/* Topic Dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">টপিক / অধ্যায় (Topic) *</label>
                      <select
                        value={qTopicId}
                        onChange={(e) => handleTopicChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">টপিক নির্বাচন করুন</option>
                        {questionTopics.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.code ? `[${t.code}] ` : ''}{t.title}
                          </option>
                        ))}
                      </select>
                      {qTopicId ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                            topic_id: {qTopicId}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">টপিক সিলেক্ট করুন</span>
                      )}
                    </div>

                    {/* Sub-Topic Dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">সাব-টপিক (Sub-Topic)</label>
                      <select
                        value={qSubTopicId}
                        onChange={(e) => handleSubTopicChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">সাব-টপিক নির্বাচন করুন</option>
                        {questionSubTopics.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.code ? `[${st.code}] ` : ''}{st.title}
                          </option>
                        ))}
                      </select>
                      {qSubTopicId ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                            sub_topic_id: {qSubTopicId}
                          </span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="অথবা কাস্টম সাব-টপিক নাম..."
                          value={qSubTopicName}
                          onChange={(e) => setQSubTopicName(e.target.value)}
                          className="w-full mt-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                        />
                      )}
                    </div>
                  </div>

                  {/* Selected Metadata Live Info Banner */}
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="font-bold text-slate-600 dark:text-slate-400">ডাটাবেসে সেভ হবে:</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium">
                      বিষয়: <strong>{qSubjectName || 'N/A'}</strong> <span className="font-mono opacity-80">(ID: {qSubjectId || 'N/A'})</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-medium">
                      টপিক: <strong>{qTopicName || 'N/A'}</strong> <span className="font-mono opacity-80">(ID: {qTopicId || 'N/A'})</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-medium">
                      সাব-টপিক: <strong>{qSubTopicName || 'N/A'}</strong> <span className="font-mono opacity-80">(ID: {qSubTopicId || 'N/A'})</span>
                    </span>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">প্রশ্নের বিবরণ *</label>
                    <textarea
                      rows={2}
                      value={qQuestion}
                      onChange={(e) => setQQuestion(e.target.value)}
                      placeholder="এখানে সম্পূর্ণ প্রশ্ন লিখুন..."
                      required
                      className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 4 Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[11px]">ক</span>
                        <span>অপশন (ক) *</span>
                      </label>
                      <input
                        type="text"
                        value={qOptionA}
                        onChange={(e) => setQOptionA(e.target.value)}
                        placeholder="অপশন ক..."
                        required
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[11px]">খ</span>
                        <span>অপশন (খ) *</span>
                      </label>
                      <input
                        type="text"
                        value={qOptionB}
                        onChange={(e) => setQOptionB(e.target.value)}
                        placeholder="অপশন খ..."
                        required
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[11px]">গ</span>
                        <span>অপশন (গ) *</span>
                      </label>
                      <input
                        type="text"
                        value={qOptionC}
                        onChange={(e) => setQOptionC(e.target.value)}
                        placeholder="অপশন গ..."
                        required
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[11px]">ঘ</span>
                        <span>অপশন (ঘ) *</span>
                      </label>
                      <input
                        type="text"
                        value={qOptionD}
                        onChange={(e) => setQOptionD(e.target.value)}
                        placeholder="অপশন ঘ..."
                        required
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Correct Answer & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">সঠিক উত্তর *</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(
                          [
                            { key: 'option_a', label: 'ক' },
                            { key: 'option_b', label: 'খ' },
                            { key: 'option_c', label: 'গ' },
                            { key: 'option_d', label: 'ঘ' },
                          ] as const
                        ).map((opt) => (
                          <button
                            type="button"
                            key={opt.key}
                            onClick={() => setQCorrectAnswer(opt.key)}
                            className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              qCorrectAnswer === opt.key
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">স্ট্যাটাস</label>
                      <div className="flex gap-2">
                        {(
                          [
                            { key: 'published', label: 'প্রকাশিত (Published)' },
                            { key: 'draft', label: 'খসড়া (Draft)' },
                          ] as const
                        ).map((st) => (
                          <button
                            type="button"
                            key={st.key}
                            onClick={() => setQStatus(st.key)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              qStatus === st.key
                                ? 'bg-[#046A38] text-white shadow-sm'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">প্রশ্নের ব্যাখ্যা (ঐচ্ছিক)</label>
                    <textarea
                      rows={2}
                      value={qExplanation}
                      onChange={(e) => setQExplanation(e.target.value)}
                      placeholder="প্রশ্নের সঠিক উত্তরের পক্ষে বিশদ ব্যাখ্যা লিখুন..."
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Submit button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingQ}
                      className="px-6 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isSubmittingQ ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>সংরক্ষণ হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>প্রশ্ন সেভ করুন (Foreign Keys সহ)</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Question Bank List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      সংরক্ষিত প্রশ্ন তালিকা ({adminQuestionsList.length})
                    </h4>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={questionSearchQuery}
                      onChange={(e) => setQuestionSearchQuery(e.target.value)}
                      placeholder="প্রশ্ন বা বিষয় খুঁজুন..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {isLoadingQuestions ? (
                  <div className="py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#046A38]" />
                    <p className="text-xs font-semibold">প্রশ্ন লোড হচ্ছে...</p>
                  </div>
                ) : adminQuestionsList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <HelpCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-xs font-semibold">এখনো কোনো প্রশ্ন যুক্ত করা হয়নি। উপরের ফর্ম ব্যবহার করে প্রশ্ন যুক্ত করুন।</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminQuestionsList
                      .filter((q) => {
                        if (!questionSearchQuery.trim()) return true;
                        const term = questionSearchQuery.toLowerCase();
                        return (
                          (q.question || '').toLowerCase().includes(term) ||
                          (q.topic || '').toLowerCase().includes(term) ||
                          (q.sub_topic || '').toLowerCase().includes(term) ||
                          (q.subject || '').toLowerCase().includes(term)
                        );
                      })
                      .map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                                  {q.subject || 'সাধারণ'}
                                </span>
                                {q.topic && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                                    টপিক: {q.topic} {q.topic_id ? `[ID: ${q.topic_id}]` : ''}
                                  </span>
                                )}
                                {q.sub_topic && (
                                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
                                    সাব-টপিক: {q.sub_topic} {q.sub_topic_id ? `[ID: ${q.sub_topic_id}]` : ''}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white pt-1">
                                {q.question}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer shrink-0"
                              title="প্রশ্ন মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                            <div
                              className={`p-2 rounded-lg border ${
                                q.correct_answer === 'option_a'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold'
                                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              ক) {q.option_a}
                            </div>
                            <div
                              className={`p-2 rounded-lg border ${
                                q.correct_answer === 'option_b'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold'
                                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              খ) {q.option_b}
                            </div>
                            <div
                              className={`p-2 rounded-lg border ${
                                q.correct_answer === 'option_c'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold'
                                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              গ) {q.option_c}
                            </div>
                            <div
                              className={`p-2 rounded-lg border ${
                                q.correct_answer === 'option_d'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold'
                                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              ঘ) {q.option_d}
                            </div>
                          </div>

                          {q.explanation && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg">
                              <span className="font-bold text-slate-700 dark:text-slate-300">ব্যাখ্যা:</span> {q.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
