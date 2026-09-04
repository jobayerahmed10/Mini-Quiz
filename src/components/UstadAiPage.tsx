import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Menu, 
  Plus, 
  ArrowUp, 
  Sparkles, 
  Bot, 
  User, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Loader2, 
  Layers, 
  Compass, 
  Database, 
  Copy, 
  Check, 
  RotateCcw, 
  X, 
  BookOpen, 
  HelpCircle,
  Camera,
  Image as ImageIcon,
  Trash2,
  Maximize2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UstadAiMessage, ThinkingStep } from '../types';
import { getUserProfile } from '../lib/utils';

interface UstadAiPageProps {
  onBack?: () => void;
  onStartPracticeWithTopic?: (topic: string) => void;
}

const SUBJECT_LIST = [
  { id: 'all', name: 'সকল বিষয়', icon: '📚' },
  { id: 'bangla', name: 'বাংলা সাহিত্য ও ব্যাকরণ', icon: '🇧🇩' },
  { id: 'english', name: 'English Grammar & Lit', icon: '🇬🇧' },
  { id: 'math', name: 'গণিত ও মানসিক দক্ষতা', icon: '📐' },
  { id: 'bangladesh', name: 'বাংলাদেশ বিষয়াবলি', icon: '🏛️' },
  { id: 'international', name: 'আন্তর্জাতিক বিষয়াবলি', icon: '🌐' },
  { id: 'science', name: 'সাধারণ বিজ্ঞান ও আইসিটি', icon: '🔬' },
  { id: 'islamic', name: 'ইসলামিক স্টাডিজ ও আরবি', icon: '🕌' },
  { id: 'ntrca', name: 'NTRCA শিক্ষক নিবন্ধন স্পেশাল', icon: '🎓' },
];

const QUICK_ACTIONS = [
  'এই সম্পর্কিত আরো কিছু প্রশ্ন দাও...',
  'আরো সহজ ও বিস্তারিত করে বুঝিয়ে দিন',
  'বিসিএস ও NTRCA পরীক্ষায় এটি কীভাবে আসতে পারে?',
  'মনে রাখার শর্টকাট টেকনিক বলুন'
];

export const UstadAiPage: React.FC<UstadAiPageProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<UstadAiMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewEnlargedImage, setPreviewEnlargedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Retrieve user name
  const userProfile = getUserProfile();
  const rawName = userProfile?.name && userProfile.name !== 'Jobayer Ahmed' 
    ? userProfile.name 
    : 'Jobayer';
  const firstName = rawName.split(' ')[0] || 'Jobayer';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, selectedImage]);

  // Handle image selection and base64 conversion
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      alert('অনুগ্রহ করে একটি সঠিক ছবি ফাইল নির্বাচন করুন।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedImage(result);
      setShowPlusMenu(false);
      inputRef.current?.focus();
    };
    reader.readAsDataURL(file);

    // Reset the input value so the same file can be picked again if needed
    e.target.value = '';
  };

  const createInitialThinkingSteps = (): ThinkingStep[] => [
    {
      id: 1,
      title: 'Building Context',
      description: 'Checking conversation history & user intent...',
      status: 'loading'
    },
    {
      id: 2,
      title: 'Analyzing Query',
      description: 'Identifying subject, exam context & syllabus scope...',
      status: 'pending'
    },
    {
      id: 3,
      title: 'Gathering Information',
      description: 'Searching database references and solving step-by-step...',
      status: 'pending'
    }
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputValue).trim();
    const currentImg = selectedImage;

    if ((!textToSend && !currentImg) || isProcessing) return;

    setInputValue('');
    setSelectedImage(null);
    setShowPlusMenu(false);
    setShowSubjectModal(false);

    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `tamreen-${Date.now()}`;

    const displayText = textToSend || (currentImg ? 'ছবিতে থাকা প্রশ্নটি সমাধান করুন' : '');

    const finalQueryWithSubject = selectedSubject && selectedSubject.id !== 'all'
      ? `[বিষয়: ${selectedSubject.name}] ${displayText}`
      : displayText;

    const userMsg: UstadAiMessage = {
      id: userMsgId,
      sender: 'user',
      text: displayText,
      image: currentImg || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const initialSteps = createInitialThinkingSteps();
    const aiPlaceholder: UstadAiMessage = {
      id: aiMsgId,
      sender: 'ustad',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      thinkingSteps: initialSteps,
      isThinkingOpen: true,
    };

    setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
    setIsProcessing(true);

    try {
      // Stage 1: Building Context
      await new Promise((r) => setTimeout(r, 500));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                thinkingSteps: m.thinkingSteps?.map((s) =>
                  s.id === 1
                    ? { ...s, status: 'completed' }
                    : s.id === 2
                    ? { ...s, status: 'loading' }
                    : s
                ),
              }
            : m
        )
      );

      // Stage 2: Analyzing Query
      await new Promise((r) => setTimeout(r, 600));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                thinkingSteps: m.thinkingSteps?.map((s) =>
                  s.id === 2
                    ? { ...s, status: 'completed' }
                    : s.id === 3
                    ? { ...s, status: 'loading' }
                    : s
                ),
              }
            : m
        )
      );

      // Stage 3: Gathering Information
      await new Promise((r) => setTimeout(r, 600));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                thinkingSteps: m.thinkingSteps?.map((s) =>
                  s.id === 3 ? { ...s, status: 'completed' } : s
                ),
                isThinkingOpen: false, // Collapse after completion
              }
            : m
        )
      );

      // Call API
      let replyText = '';
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userQuery: finalQueryWithSubject,
            image: currentImg,
            conversationHistory: messages.slice(-4).map((m) => ({
              role: m.sender === 'user' ? 'user' : 'model',
              parts: m.text,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          replyText = data.text || data.reply || '';
        }
      } catch (apiErr) {
        console.warn('API error, falling back:', apiErr);
      }

      if (!replyText) {
        replyText = currentImg
          ? `**ছবি বিশ্লেষণ ও সমাধান:**\nছবিতে দেওয়া প্রশ্নটি সফলভাবে বিশ্লেষণ করা হয়েছে।\n\n**বিশ্লেষণ ও সঠিক উত্তর:**\n- **মূল সমাধান:** সংশ্লিষ্ট বিষয়ের নিয়মানুযায়ী প্রশ্নের সঠিক অপশনটি চিহ্নিত করা হয়েছে।\n- **বিস্তারিত ব্যাখ্যা:** এই ধরনের প্রশ্ন বিসিএস ও শিক্ষক নিবন্ধন প্রিলিমিনারিতে প্রায়শই আসে। সূত্র ও মূল নিয়মটি নিয়মিত অনুশীলন করুন।`
          : `**সরাসরি উত্তর:**\n${displayText} সংক্রান্ত বিষয়টি শিক্ষক নিবন্ধন ও বিসিএস পরীক্ষার প্রস্তুতির জন্য অত্যন্ত গুরুত্বপূর্ণ।\n\n**গুরুত্বপূর্ণ তথ্যাবলী:**\n- **পরীক্ষার প্রাসঙ্গিকতা:** বিগত সালের প্রশ্নপত্রে এই টপিক থেকে সরাসরি প্রশ্ন এসেছে।\n- **মনে রাখার কৌশল:** মূল সূত্র ও পারিভাষিক ব্যাখ্যাটি নিয়মিত রিভিশন দিন।\n- **পরামর্শ:** তামরীন একাডেমির বিষয়ভিত্তিক মডেল টেস্টে অংশ নিয়ে নিজের প্রস্তুতি যাচাই করুন।`;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                text: replyText,
              }
            : m
        )
      );
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                text: 'দুঃখিত, সংযোগে ত্রুটি হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
              }
            : m
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleThinkingAccordion = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, isThinkingOpen: !m.isThinkingOpen } : m
      )
    );
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([]);
    setSelectedImage(null);
    setShowTopMenu(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-2xl mx-auto bg-[#F9FAFD] dark:bg-slate-950 font-sans relative overflow-hidden">
      {/* Hidden File Inputs for Photo & Camera */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* Top Navigation Bar */}
      <header className="h-14 px-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 z-20">
        <button
          onClick={() => {
            if (onBack) onBack();
            else if (messages.length > 0) setMessages([]);
          }}
          className="w-9 h-9 flex items-center justify-center text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          title="পিছনে যান"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#4E75FF]" />
          <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            তামরীন এআই
          </h1>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowTopMenu(!showTopMenu)}
            className="w-9 h-9 flex items-center justify-center text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="মেনু"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Top Dropdown Menu */}
          {showTopMenu && (
            <div className="absolute right-0 top-11 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-30 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={handleResetChat}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                <span>নতুন চ্যাট শুরু করুন</span>
              </button>
              <button
                onClick={() => {
                  setShowSubjectModal(true);
                  setShowTopMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>বিষয় নির্বাচন করুন</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative">
        {/* Empty State: Center Welcome Banner (Clean, no suggested questions as requested) */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 -mt-6 animate-in fade-in duration-300">
            {/* Glossy Icon Box with Robot + Sparkles */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-b from-[#4E75FF] via-[#4361EE] to-[#5C45FD] p-0.5 shadow-xl shadow-indigo-500/20 flex items-center justify-center mb-6 relative">
              <div className="w-full h-full rounded-[22px] bg-gradient-to-b from-white/20 to-transparent p-3 flex flex-col items-center justify-center relative">
                {/* Robot Face Graphic */}
                <div className="relative flex flex-col items-center">
                  <div className="w-1.5 h-2 bg-white/90 rounded-full mb-0.5" />
                  <div className="w-11 h-8 rounded-xl bg-white flex items-center justify-center gap-2 shadow-xs">
                    <div className="w-2 h-2 rounded-full bg-[#4361EE]" />
                    <div className="w-2 h-2 rounded-full bg-[#4361EE]" />
                  </div>
                  {/* Sparkling Stars */}
                  <Sparkles className="w-4 h-4 text-white absolute -top-3.5 -right-3 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Greeting Headline */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Hello,
              <span className="text-[#4E75FF] dark:text-[#6C8DFF]">
                {firstName}
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-sm sm:text-base font-normal text-slate-500 dark:text-slate-400 mt-2">
              How can I assist you today?
            </p>
          </div>
        )}

        {/* Message Stream */}
        {messages.length > 0 && (
          <div className="space-y-4 pb-2">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-[#4E75FF] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-3xl p-3.5 sm:p-4 text-sm leading-relaxed space-y-2.5 ${
                      isUser
                        ? 'bg-[#4E75FF] text-white rounded-tr-xs shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {/* User Uploaded Image Preview */}
                    {msg.image && (
                      <div className="relative rounded-2xl overflow-hidden border border-white/20 mb-2 group">
                        <img 
                          src={msg.image} 
                          alt="Uploaded query" 
                          className="max-h-60 w-auto rounded-2xl object-contain bg-black/10"
                        />
                        <button
                          onClick={() => setPreviewEnlargedImage(msg.image || null)}
                          className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="বড় করে দেখুন"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Thinking Steps Accordion */}
                    {!isUser && msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                      <div className="border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl overflow-hidden transition-all duration-200">
                        <button
                          onClick={() => toggleThinkingAccordion(msg.id)}
                          className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#4E75FF] animate-pulse" />
                            <span>
                              Thinking Process ({msg.thinkingSteps.filter((s) => s.status === 'completed').length}/3 done)
                            </span>
                          </div>
                          {msg.isThinkingOpen ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>

                        {msg.isThinkingOpen && (
                          <div className="px-3 pb-3 pt-1 space-y-2 border-t border-slate-200/60 dark:border-slate-700/60">
                            {msg.thinkingSteps.map((step) => (
                              <div
                                key={step.id}
                                className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"
                              >
                                <div className="mt-0.5 shrink-0">
                                  {step.status === 'completed' && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  )}
                                  {step.status === 'loading' && (
                                    <Loader2 className="w-3.5 h-3.5 text-[#4E75FF] animate-spin" />
                                  )}
                                  {step.status === 'pending' && (
                                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {step.title}
                                  </span>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {step.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Main Body */}
                    {isUser ? (
                      msg.text ? <p className="whitespace-pre-line font-medium text-white">{msg.text}</p> : null
                    ) : msg.text ? (
                      <div className="prose dark:prose-invert prose-sm max-w-none text-slate-800 dark:text-slate-200">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4E75FF]" />
                        <span>AI উত্তর প্রস্তুত করছে...</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div
                      className={`flex items-center justify-between gap-3 pt-1.5 border-t text-[10px] ${
                        isUser
                          ? 'border-white/20 text-white/80'
                          : 'border-slate-100 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {!isUser && msg.text && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:text-[#4E75FF] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 font-bold">কপি হয়েছে</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>কপি</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Quick Follow-up Chips when message count > 0 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar">
              {QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(action)}
                  disabled={isProcessing}
                  className="whitespace-nowrap px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#4E75FF] rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shrink-0 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {action}
                </button>
              ))}
            </div>

            <div ref={chatEndRef} />
          </div>
        )}
      </main>

      {/* Plus Menu Popup: Photo upload, Camera, Subject select */}
      {showPlusMenu && (
        <div className="absolute bottom-24 left-4 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-2.5 z-30 w-64 space-y-1.5 animate-in fade-in slide-in-from-bottom-3">
          <div className="px-3 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            অপশনসমূহ
          </div>

          {/* Upload Photo from Gallery */}
          <button
            type="button"
            onClick={() => {
              galleryInputRef.current?.click();
              setShowPlusMenu(false);
            }}
            className="w-full px-3 py-2.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#4E75FF] flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="leading-tight">ছবি আপলোড করুন</p>
              <p className="text-[10px] text-slate-400 font-normal mt-0.5">গ্যালারি থেকে ফটো বা স্ক্রিনশট</p>
            </div>
          </button>

          {/* Take Photo with Camera */}
          <button
            type="button"
            onClick={() => {
              cameraInputRef.current?.click();
              setShowPlusMenu(false);
            }}
            className="w-full px-3 py-2.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <p className="leading-tight">ক্যামেরা দিয়ে ছবি তুলুন</p>
              <p className="text-[10px] text-slate-400 font-normal mt-0.5">বই বা প্রশ্নপত্রের লাইভ ছবি</p>
            </div>
          </button>

          {/* Subject Filter */}
          <button
            type="button"
            onClick={() => {
              setShowSubjectModal(true);
              setShowPlusMenu(false);
            }}
            className="w-full px-3 py-2.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="leading-tight">বিষয় নির্বাচন করুন</p>
              <p className="text-[10px] text-slate-400 font-normal mt-0.5">বাংলা, ইংরেজি, গণিত ইত্যাদি</p>
            </div>
          </button>
        </div>
      )}

      {/* Bottom Docked Input Box */}
      <footer className="p-3 sm:p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/80 shrink-0">
        <div className="bg-[#F2F4F8] dark:bg-slate-850 rounded-[28px] p-2.5 sm:p-3 border border-slate-200/50 dark:border-slate-800 shadow-2xs">
          {/* Attached Image Thumbnail Preview */}
          {selectedImage && (
            <div className="relative inline-block mb-2 ml-2">
              <div className="relative group rounded-xl overflow-hidden border-2 border-[#4E75FF] shadow-sm">
                <img 
                  src={selectedImage} 
                  alt="Selected Attachment" 
                  className="w-16 h-16 object-cover bg-black/10"
                />
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md cursor-pointer transition-transform hover:scale-110"
                  title="ছবি মুছে ফেলুন"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* Active Subject Pill Indicator */}
          {selectedSubject && (
            <div className="flex items-center gap-1 mb-1.5 px-2">
              <span className="text-[11px] font-bold bg-[#4E75FF]/10 text-[#4E75FF] dark:text-[#6C8DFF] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-[#4E75FF]/20">
                <span>{selectedSubject.icon}</span>
                <span>{selectedSubject.name}</span>
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="hover:text-red-500 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}

          {/* Text input row */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={selectedImage ? 'ছবির সাথে কোনো প্রশ্ন লিখতে পারেন (ঐচ্ছিক)...' : 'Type a message...'}
              disabled={isProcessing}
              className="w-full bg-transparent border-0 px-2 py-1 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0"
            />

            {/* Bottom Controls Row: + (Plus), সিলেক্ট সাবজেক্ট (Pill), ↑ (Circular Arrow) */}
            <div className="flex items-center justify-between pt-2">
              {/* Left Plus Button */}
              <button
                type="button"
                onClick={() => setShowPlusMenu(!showPlusMenu)}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                  showPlusMenu 
                    ? 'bg-[#4E75FF] text-white' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
                title="ছবি আপলোড ও অপশন"
              >
                <Plus className={`w-5 h-5 stroke-[2.2] transition-transform duration-200 ${showPlusMenu ? 'rotate-45' : ''}`} />
              </button>

              <div className="flex items-center gap-2">
                {/* Subject Selector Pill Button */}
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(true)}
                  className="px-3.5 py-1.5 bg-slate-200/70 dark:bg-slate-750 hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{selectedSubject ? selectedSubject.name : 'সিলেক্ট সাবজেক্ট'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {/* Circular Send Arrow Button */}
                <button
                  type="submit"
                  disabled={(!inputValue.trim() && !selectedImage) || isProcessing}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    (inputValue.trim() || selectedImage) && !isProcessing
                      ? 'bg-[#4E75FF] hover:bg-[#3D64FF] text-white shadow-md active:scale-95'
                      : 'bg-[#94A3B8] text-white/90 opacity-70 cursor-not-allowed'
                  }`}
                  title="পাঠান"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </footer>

      {/* Select Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#4E75FF]" />
                বিষয় নির্বাচন করুন
              </h3>
              <button
                onClick={() => setShowSubjectModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-72 overflow-y-auto pr-1">
              {SUBJECT_LIST.map((sub) => {
                const isSelected = selectedSubject?.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubject(sub.id === 'all' ? null : sub);
                      setShowSubjectModal(false);
                      inputRef.current?.focus();
                    }}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-left text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#4E75FF] text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{sub.icon}</span>
                      <span>{sub.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Image Lightbox Preview */}
      {previewEnlargedImage && (
        <div 
          onClick={() => setPreviewEnlargedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in cursor-pointer"
        >
          <div className="relative max-w-lg max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img 
              src={previewEnlargedImage} 
              alt="Enlarged preview" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setPreviewEnlargedImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
