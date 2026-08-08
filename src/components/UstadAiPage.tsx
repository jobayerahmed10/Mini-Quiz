import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, BookOpen, Lightbulb, RefreshCw, HelpCircle, Copy, Check } from 'lucide-react';
import { UstadAiMessage } from '../types';

interface UstadAiPageProps {
  onStartPracticeWithTopic?: (topic: string) => void;
}

const PRESET_QUESTIONS = [
  'পবিত্র কোরআনের মাক্কী ও মাদানী সূরার প্রধান পার্থক্যসমূহ কী কী?',
  'নাহু (النحو) ও সরফ (الصرف) এর মধ্যে মৌলিক পার্থক্য বুঝিয়ে বলুন',
  'বাংলা ব্যাকরণে সমাস সহজে মনে রাখার শর্টকাট কৌশলগুলো কী?',
  'English Grammar-এ Right Form of Verbs-এর গুরুত্বপূর্ণ ৫টি নিয়ম বলুন',
  'পাটিগণিতের লাভ-ক্ষতি ও শতকরা অংক সহজে করার শর্টকাট নিয়ম',
  'সিহাহ সিত্তা বা হাদিসের বিখ্যাত ৬টি গ্রন্থের নাম ও রচয়িতা কারা?',
  'উসুলুল ফিকহ অনুযায়ী ইসলামী আইনের ৪টি প্রধান উৎস কী কী?',
  '১৯তম NTRCA শিক্ষক নিবন্ধনের প্রিলিমিনারি পরীক্ষার সিলেবাস মান বণ্টন কেমন?'
];

const KNOWLEDGE_BASE: Record<string, string> = {
  'পবিত্র কোরআনের মাক্কী ও মাদানী সূরার প্রধান পার্থক্যসমূহ কী কী?': `**পবিত্র কুরআনের মাক্কী ও মাদানী সূরার প্রধান পার্থক্যসমূহ:**

১. **হিজরত ভিত্তিক মানদণ্ড:**
   - **মাক্কী সূরা:** রাসুলুল্লাহ (সা:)-এর মক্কা থেকে মদীনায় হিজরতের পূর্বে অবতীর্ণ সূরাগুলোকে মাক্কী সূরা বলা হয় (মোট ৮৬টি)।
   - **মাদানী সূরা:** হিজরতের পর অবতীর্ণ সূরাগুলোকে মাদানী সূরা বলা হয় (মোট ২৮টি)।

২. **বিষয়বস্তুর পার্থক্য:**
   - **মাক্কী সূরা:** মূলত তৌহিদ, আখেরাত, নবুওয়াত, জান্নাত-জাহান্নাম এবং নৈতিক চরিত্র গঠনের ওপর গুরুত্বারোপ করে।
   - **মাদানী সূরা:** ইসলামী শরিয়তের বিধি-বিধান, সামাজিক আইন, পারিবারিক বিধান, জিহাদ, ইবাদতের বিস্তারিত নিয়ম এবং মুনাফিকদের বিবরণ অন্তর্ভুক্ত।

৩. **ভাষাগত ও শৈল্পিক বৈশিষ্ট্য:**
   - **মাক্কী সূরা:** আয়াতসমূহ অপেক্ষাকৃত ছোট, ছন্দময়, অলঙ্কারপূর্ণ এবং এতে "ইয়া আইয়ুহান নাস" (হে মানবজাতি) সম্বোধন বেশি।
   - **মাদানী সূরা:** আয়াতসমূহ দীর্ঘ, বিশদ বর্ণনামূলক এবং এতে "ইয়া আইয়ুহাল্লাজিনা আমানু" (হে ঈমানদারগণ) সম্বোধন বেশি।`,

  'নাহু (النحو) ও সরফ (الصرف) এর মধ্যে মৌলিক পার্থক্য বুঝিয়ে বলুন': `**আরবি ব্যাকরণে নাহু (النحو) এবং সরফ (الصرف) এর পার্থক্য:**

১. **علم الصرف (সরফ - শব্দগঠন বিদ্যা):**
   - **সংজ্ঞা:** সরফ হলো আরবি শব্দের মূল রূপ (মাদ্দাহ/Root Word) এবং একটি শব্দ থেকে অন্য শব্দে রূপান্তর করার নিয়ম।
   - **কাজ:** শব্দের ওযন (প্যাটার্ন) এবং শব্দের রূপান্তর (সফ/Conjugation) আলোচনা করা।
   - **উদাহরণ:** 'ক্বাতালা' (قتل) থেকে 'ক্বাতিল' (قاتل - হত্যাকারী), 'মাকতুল' (مقتول - নিহত), 'ক্বিতাল' (قتال - যুদ্ধ)।

২. **علم النحو (নাহু - বাক্যগঠন ও এরোব বিদ্যা):**
   - **সংজ্ঞা:** নাহু হলো বাক্যে ব্যবহৃত বিভিন্ন শব্দের শেষ বর্ণের হরকত (পেশ, যের, জবর বা সাকিন) নির্ধারণের নিয়ম।
   - **কাজ:** বাক্যে শব্দের অবস্থান (ফা'ইল/Subject, মাফ'উল/Object, মুবতাদা/Khabar) অনুযায়ী শেষ হরকত নির্ধারণ।
   - **উদাহরণ:** "জাআ যাইদুন" (جَاءَ زَيْدٌ) - এখানে যাইদুন ফায়িল হওয়ায় পেশ হয়েছে। "রাআইতু যাইদান" (رَأَيْتُ زَيْدًا) - এখানে যাইদান মাফউল হওয়ায় জবর হয়েছে।`,

  'বাংলা ব্যাকরণে সমাস সহজে মনে রাখার শর্টকাট কৌশলগুলো কী?': `**বাংলা ব্যাকরণে সমাস চেনার সহজ ও শর্টকাট কৌশল:**

১. **দ্বন্দ্ব সমাস:** উভয় পদের অর্থ প্রধান থাকে এবং মাঝখানে 'ও, এবং, আর' থাকে।
   - *টেকনিক:* জোড়া শব্দ (মা-বাবা = মা ও বাবা, হাত-পা)।

২. **দ্বিগু সমাস:** সমাহার প্রকাশ পায় এবং প্রথম পদটি সংখ্যাবাচক হয়।
   - *টেকনিক:* সংখ্যা + বিশেষ্য = দ্বিগু (চৌরাস্তা = চার রাস্তার সমাহার, ত্রিফলা)।

৩. **তৎপুরুষ সমাস:** পূর্বপদের বিভক্তি লোপ পায়।
   - *টেকনিক:* বিভক্তি চিহ্ন উঠে যাবে (বিপদকে আপন্ন = বিপদাপন্ন, দেশ হতে বিতাড়িত = দেশবিতাড়িত)।

৪. **বহুব্রীহি সমাস:** পূর্বপদ বা পরপদ কোনোটির অর্থ না বুঝিয়ে সম্পূর্ণ নতুন ৩য় কোনো অর্থ প্রকাশ করে।
   - *টেকনিক:* যার/যাতে শব্দ দিয়ে ব্যাসবাক্য (পীত অম্বর যার = পীতাম্বর/শ্রীকৃষ্ণ, দশ আনন যার = দশানন/রাবণ)।

৫. **কর্মধারয় সমাস:** যে/যিনি/যেটি দিয়ে দুটি বিশেষ্য বা বিশেষণের তুলনা করা হয়।
   - *টেকনিক:* বিশেষ্য + বিশেষণ তুলনা (নীল যে পদ্ম = নীলপদ্ম, কাঁচা অথচ মিঠা = কাঁচামিঠা)।

৬. **অব্যয়ীভাব সমাস:** অব্যয় পদের প্রাধান্য থাকে।
   - *টেকনিক:* অনু, উপ, নি, যথা, হরPrefix থাকলে (কূলের সমীপে = উপকূল, দিন দিন = প্রতিদিন)।`,

  'English Grammar-এ Right Form of Verbs-এর গুরুত্বপূর্ণ ৫টি নিয়ম বলুন': `**Right Form of Verbs-এর অতি গুরুত্বপূর্ণ ৫টি গোল্ডেন রুল:**

১. **Universal Truth & Habitual Fact:** চিরন্তন সত্য বা অভ্যাসগত কাজ বোঝালে বাক্যে Present Indefinite Tense হয়।
   - *Example:* The sun **rises** in the east.

২. **Time Indicators (Just, Already, Recently, Lately, Ever):** এই শব্দগুলো থাকলে Present Perfect Tense (have/has + V3) হয়।
   - *Example:* He has already **finished** his homework.

৩. **Since-এর ব্যবহারিক নিয়ম:**
   - Present Perfect + **since** + Past Indefinite. (*Example:* Ten years have passed since I **met** him.)
   - Past Indefinite + **since** + Past Perfect. (*Example:* It was long since I had **seen** her.)

৪. **Modal Auxiliaries (can, could, may, might, shall, should, will, would, must):** এদের পরে সরাসরি Verb-এর Base Form (V1) বসে।
   - *Example:* You must **obey** your parents.

৫. **Prepositions and 'With a view to' / 'Look forward to':** 
   - সাধারণ Preposition (in, on, at, of, for, without, by)-এর পর Verb-এর সাথে **-ing** যুক্ত হয়।
   - 'Look forward to', 'With a view to', 'Used to'-এর পরেও Verb + **ing** হয়।
   - *Example:* I am looking forward to **hearing** from you soon.`
};

export const UstadAiPage: React.FC<UstadAiPageProps> = () => {
  const [messages, setMessages] = useState<UstadAiMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ustad',
      text: 'আসসালামু আলাইকুম! আমি **উস্তাদ এআই** (Ustad AI) — আপনার শিক্ষক নিবন্ধন (NTRCA) ও মাদ্রাসা নিয়োগ প্রস্তুতির স্মার্ট এআই টিউটর।\n\nআল-কুরআন, হাদিস, ফিকহ, আরবি ব্যাকরণ, বাংলা, ইংরেজি, গণিত বা যেকোনো সাধারণ জ্ঞানের প্রশ্ন আমাকে জিজ্ঞেস করতে পারেন। আমি সাথে সাথে বুঝিয়ে দেব!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend) return;

    const userMsg: UstadAiMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsTyping(true);

    // Check knowledge base or simulate intelligent tutor response
    setTimeout(() => {
      let replyText = '';

      if (KNOWLEDGE_BASE[textToSend]) {
        replyText = KNOWLEDGE_BASE[textToSend];
      } else if (textToSend.includes('কুরআন') || textToSend.includes('সূরা')) {
        replyText = `**আল-কুরআন সংক্রান্ত এআই ব্যাখ্যা:**\n\nআপনি "${textToSend}" নিয়ে জানতে চেয়েছেন।\n\n- **মূল্যবান তথ্য:** পবিত্র কুরআনে মোট ১১৪টি সূরা, ৬২৩৬টি আয়াত (মতান্তরে ৬৬৬৬টি) এবং ৩০টি পারা রয়েছে।\n- **পরীক্ষার টিপস:** NTRCA ও মাদ্রাসা নিবন্ধন পরীক্ষায় সূরার মাক্কী-মাদানী শ্রেণীবিভাগ, প্রথম অবতীর্ণ আয়াত (সূরা আলাকের ৫টি আয়াত) এবং বৃহত্তম সূরা (বাকারা) থেকে প্রায়ই প্রশ্ন আসে।\n\nআরো নির্দিষ্ট বিস্তারিত জানতে চাইলে আমাকে নাম বা বিষয়টি স্পষ্টভাবে জিজ্ঞেস করুন!`;
      } else if (textToSend.includes('হাদিস') || textToSend.includes('বুখারী')) {
        replyText = `**আল-হাদিস ও আসমাউর রিজাল সংক্ষিপ্ত নোট:**\n\nহাদিস শাস্ত্রের মৌলিক ভিত্তি সংকলিত হয়েছে সিহাহ সিত্তা (৬টি বিশুদ্ধ হাদিস গ্রন্থ)-এর মাধ্যমে।\n১. সহীহ বুখারী (ইমাম বুখারী রহ.)\n২. সহীহ মুসলিম (ইমাম মুসলিম রহ.)\n৩. সুনানে আবু দাউদ\n৪. জামে আত-তিরমিজী\n৫. সুনানে নাসাঈ\n৬. সুনানে ইবনে মাজাহ\n\n**সহীহাইন:** বুখারী ও মুসলিমকে একত্রে 'সহীহাইন' বলা হয়।`;
      } else if (textToSend.includes('গণিত') || textToSend.includes('অংক') || textToSend.includes('সমীকরণ')) {
        replyText = `**গণিত ও শর্টকাট সমাধান টিউটোরিয়াল:**\n\nNTRCA নিবন্ধনে বীজগণিত (a+b)^2 সূত্রাবলী, সূচক-লগারিদম, লাভ-ক্ষতি, লসাগু-গসাগু ও জ্যামিতি থেকে ২৫ মার্কস থাকবে।\n\n**শর্টকাট রিভিশন:**\n- সমকোণী ত্রিভুজের বাহুর অনুপাত: ৩ : ৪ : ৫, ৫ : ১২ : ১৩, ৮ : ১৫ : ১৭।\n- লসাগু × গসাগু = সংখ্যা দুটির গুণফল।\n\nকোন নির্দিষ্ট অংকের টেকনিক জানতে চান? লিখে জানান!`;
      } else {
        replyText = `**উস্তাদ এআই উত্তর:**\n\nধন্যবাদ আপনার চমৎকার প্রশ্নের জন্য: *" ${textToSend} "*\n\nNTRCA শিক্ষক নিবন্ধন ও মাদ্রাসা স্পেশাল পরীক্ষার প্রস্তুতিতে এই বিষয়টি খুবই গুরুত্বপূর্ণ।\n\n১. **মূল ধারণা:** প্রশ্নটির মূল বিষয়বস্তু সরাসরি বিগত ১৭তম ও ১৮তম NTRCA প্রশ্নব্যাংকের অনুরূপ।\n২. **পরামর্শ:** আপনার প্রস্তুতির সুবিধার্থে নিয়মিত বিষয়ভিত্তিক মডেল টেস্ট দিন এবং প্রতিদিন ১টি করে অধ্যায় রিভিশন করুন।\n\nআপনাকে সাহায্য করতে আমি সর্বদা প্রস্তুত। অন্য কোনো টপিক বা ব্যাকরণের জটিল বিষয় জানতে চাইলে নির্দ্বিধায় লিখুন!`;
      }

      const ustadMsg: UstadAiMessage = {
        id: `ustad-${Date.now()}`,
        sender: 'ustad',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, ustadMsg]);
      setIsTyping(false);
    }, 900);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 mb-24">
      {/* Banner */}
      <div className="neu-card p-5 mb-5 relative overflow-hidden border border-amber-400/30 bg-gradient-to-r from-[#121E36] via-[#162648] to-[#0F182D]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#182848] border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-[inset_2px_2px_5px_#060a17]">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              উস্তাদ এআই <span className="text-xs font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">স্মার্ট টিউটর</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              কুরআন, হাদিস, ফিকহ, আরবি ব্যাকরণ, বাংলা, ইংরেজি ও গণিতের যেকোনো প্রশ্ন মুহূর্তে বুঝে নিন
            </p>
          </div>
        </div>
      </div>

      {/* Preset Fast Click Prompts */}
      <div className="mb-5">
        <p className="text-xs font-bold text-amber-300/90 mb-2 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          দ্রুত ক্লিক করে উত্তর জানুন:
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="neu-btn text-xs font-semibold text-slate-200 px-3 py-2 rounded-xl whitespace-nowrap hover:text-amber-300 flex items-center gap-1.5 shrink-0"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="neu-inset rounded-2xl p-4 min-h-[380px] max-h-[550px] overflow-y-auto space-y-4 mb-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 relative text-sm leading-relaxed ${
                  isUser
                    ? 'bg-amber-500/20 border border-amber-400/50 text-white rounded-tr-xs shadow-md'
                    : 'bg-[#14223E] border border-slate-700/60 text-slate-100 rounded-tl-xs shadow-md'
                }`}
              >
                <div className="whitespace-pre-line font-normal">
                  {msg.text}
                </div>

                <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-slate-700/40 text-[10px] text-slate-400">
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                      title="অনুলিপি করুন"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">কপি হয়েছে</span>
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
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-300 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-amber-300/80 p-2">
            <Bot className="w-4 h-4 animate-spin text-amber-400" />
            <span>উস্তাদ এআই উত্তর তৈরি করছেন...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="আপনার যেকোনো প্রশ্ন এখানে লিখুন (যেমন: সূরার মাক্কী মাদানী চেনার উপায়)..."
            className="w-full bg-[#121E36] border border-slate-700/80 text-white placeholder-slate-400 text-sm rounded-2xl px-4 py-3.5 focus:outline-none focus:border-amber-400/80 shadow-[inset_2px_2px_5px_#060a17]"
          />
        </div>
        <button
          type="submit"
          disabled={!inputQuery.trim() || isTyping}
          className="neu-btn px-5 py-3.5 rounded-2xl text-amber-400 font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:text-amber-300 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">পাঠান</span>
        </button>
      </form>
    </div>
  );
};
