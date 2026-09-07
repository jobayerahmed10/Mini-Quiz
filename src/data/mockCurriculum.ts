// Comprehensive default curriculum with sequential topics and subtopics
// Strictly without any code displayed (Bengali titles only)

export interface CurriculumSubtopic {
  id: string;
  title: string;
  totalQuestions: number;
  solvedQuestions: number;
}

export interface CurriculumTopic {
  id: string;
  title: string;
  totalQuestions: number;
  solvedQuestions: number;
  subtopics: CurriculumSubtopic[];
}

export interface CurriculumSubject {
  id: string;
  name: string; // Pure Bengali name - NO CODE DISPLAYED
  iconType: string;
  totalQuestions: number;
  topics: CurriculumTopic[];
}

export const DEFAULT_MOCK_CURRICULUM: CurriculumSubject[] = [
  {
    id: 'subj-bangla-lit',
    name: 'বাংলা সাহিত্য',
    iconType: 'bangla',
    totalQuestions: 12192,
    topics: [
      {
        id: 'top-bn-ancient',
        title: 'বাংলা সাহিত্যের প্রাচীন যুগ',
        totalQuestions: 488,
        solvedQuestions: 15,
        subtopics: [
          { id: 'sub-charya-1', title: 'চর্যাপদ', totalQuestions: 310, solvedQuestions: 15 },
          { id: 'sub-charya-2', title: 'চর্যাপদের পদকর্তা', totalQuestions: 144, solvedQuestions: 0 },
          { id: 'sub-charya-3', title: 'অন্যান্য', totalQuestions: 34, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-bn-medieval',
        title: 'বাংলা সাহিত্যের মধ্যযুগ',
        totalQuestions: 1300,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-med-1', title: 'শ্রীকৃষ্ণকীর্তন কাব্য', totalQuestions: 78, solvedQuestions: 0 },
          { id: 'sub-med-2', title: 'মঙ্গলকাব্য', totalQuestions: 314, solvedQuestions: 0 },
          { id: 'sub-med-3', title: 'বৈষ্ণব পদাবলি', totalQuestions: 177, solvedQuestions: 0 },
          { id: 'sub-med-4', title: 'নাথ-মর্সিয়া- লোক সাহিত্য - গীতিকা', totalQuestions: 221, solvedQuestions: 0 },
          { id: 'sub-med-5', title: 'আরকান ও অনুবাদ সাহিত্য', totalQuestions: 340, solvedQuestions: 0 },
          { id: 'sub-med-6', title: 'যুগসন্ধিক্ষণ ১৭৬০-১৮৬০', totalQuestions: 127, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-bn-modern',
        title: 'বাংলা সাহিত্যের আধুনিক যুগ',
        totalQuestions: 10404,
        solvedQuestions: 8,
        subtopics: [
          { id: 'sub-mod-1', title: 'ফোর্ট উইলিয়াম কলেজ ও গদ্যের সূচনা', totalQuestions: 412, solvedQuestions: 0 },
          { id: 'sub-mod-2', title: 'ঈশ্বরচন্দ্র বিদ্যাসাগর ও মাইকেল মধুসূদন', totalQuestions: 740, solvedQuestions: 2 },
          { id: 'sub-mod-3', title: 'বঙ্কিমচন্দ্র চট্টোপাধ্যায়', totalQuestions: 530, solvedQuestions: 1 },
          { id: 'sub-mod-4', title: 'রবীন্দ্রনাথ ঠাকুর', totalQuestions: 1840, solvedQuestions: 3 },
          { id: 'sub-mod-5', title: 'কাজী নজরুল ইসলাম', totalQuestions: 1420, solvedQuestions: 2 },
          { id: 'sub-mod-6', title: 'আধুনিক পঞ্চপাণ্ডব ও প্রধান কবিগণ', totalQuestions: 1250, solvedQuestions: 0 },
          { id: 'sub-mod-7', title: 'উপন্যাস, ছোটগল্প ও প্রবন্ধ সাহিত্য', totalQuestions: 2180, solvedQuestions: 0 },
          { id: 'sub-mod-8', title: 'নাটক, প্রহসন ও সাময়িকপত্র', totalQuestions: 2032, solvedQuestions: 0 },
        ],
      },
    ],
  },
  {
    id: 'subj-bangla-gram',
    name: 'বাংলা ব্যাকরণ',
    iconType: 'bangla',
    totalQuestions: 4850,
    topics: [
      {
        id: 'top-bn-dhwani',
        title: 'ধ্বনি ও বর্ণ প্রকরণ',
        totalQuestions: 980,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-bg-1', title: 'ধ্বনি ও বর্ণের শ্রেণিবিভাগ', totalQuestions: 350, solvedQuestions: 0 },
          { id: 'sub-bg-2', title: 'ধ্বনি পরিবর্তন', totalQuestions: 280, solvedQuestions: 0 },
          { id: 'sub-bg-3', title: 'ণ-ত্ব ও ষ-ত্ব বিধান', totalQuestions: 350, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-bn-shobdo',
        title: 'শব্দ ও শব্দ গঠন',
        totalQuestions: 2240,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-bg-4', title: 'শব্দের শ্রেণিবিভাগ (উৎস ও গঠন)', totalQuestions: 420, solvedQuestions: 0 },
          { id: 'sub-bg-5', title: 'উপসর্গ ও অনুসর্গ', totalQuestions: 380, solvedQuestions: 0 },
          { id: 'sub-bg-6', title: 'প্রত্যয় ও প্রকৃতি', totalQuestions: 390, solvedQuestions: 0 },
          { id: 'sub-bg-7', title: 'সমাস ও ব্যাসবাক্য', totalQuestions: 560, solvedQuestions: 0 },
          { id: 'sub-bg-8', title: 'সন্ধি', totalQuestions: 490, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-bn-pod',
        title: 'পদ ও বাক্য প্রকরণ',
        totalQuestions: 1630,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-bg-9', title: 'পদ প্রকরণ (বিশেষ্য, বিশেষণ, সর্বনাম, ক্রিয়া, অব্যয়)', totalQuestions: 510, solvedQuestions: 0 },
          { id: 'sub-bg-10', title: 'কারক ও বিভক্তি', totalQuestions: 480, solvedQuestions: 0 },
          { id: 'sub-bg-11', title: 'বাক্য রূপান্তর ও শুদ্ধ-অশুদ্ধ', totalQuestions: 340, solvedQuestions: 0 },
          { id: 'sub-bg-12', title: 'বিরাম চিহ্ন ও প্রয়োগ-অপপ্রয়োগ', totalQuestions: 300, solvedQuestions: 0 },
        ],
      },
    ],
  },
  {
    id: 'subj-english',
    name: 'ইংরেজি ভাষা ও সাহিত্য',
    iconType: 'english',
    totalQuestions: 7850,
    topics: [
      {
        id: 'top-en-grammar',
        title: 'English Grammar & Usage',
        totalQuestions: 3600,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-en-1', title: 'Parts of Speech & Determiners', totalQuestions: 950, solvedQuestions: 0 },
          { id: 'sub-en-2', title: 'Right Form of Verbs & Tense', totalQuestions: 820, solvedQuestions: 0 },
          { id: 'sub-en-3', title: 'Subject-Verb Agreement', totalQuestions: 640, solvedQuestions: 0 },
          { id: 'sub-en-4', title: 'Voice, Narration & Modifiers', totalQuestions: 590, solvedQuestions: 0 },
          { id: 'sub-en-5', title: 'Prepositions & Conjunctions', totalQuestions: 600, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-en-vocab',
        title: 'Vocabulary & Phrases',
        totalQuestions: 2450,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-en-6', title: 'Synonyms & Antonyms', totalQuestions: 1100, solvedQuestions: 0 },
          { id: 'sub-en-7', title: 'Idioms & Phrases', totalQuestions: 750, solvedQuestions: 0 },
          { id: 'sub-en-8', title: 'One Word Substitution & Spellings', totalQuestions: 600, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-en-lit',
        title: 'English Literature',
        totalQuestions: 1800,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-en-9', title: 'Elizabethan & Jacobean Age (Shakespeare)', totalQuestions: 520, solvedQuestions: 0 },
          { id: 'sub-en-10', title: 'Romantic & Victorian Period', totalQuestions: 680, solvedQuestions: 0 },
          { id: 'sub-en-11', title: 'Modern & Post-Modern Literature', totalQuestions: 600, solvedQuestions: 0 },
        ],
      },
    ],
  },
  {
    id: 'subj-bd',
    name: 'বাংলাদেশ বিষয়াবলি',
    iconType: 'bd',
    totalQuestions: 6400,
    topics: [
      {
        id: 'top-bd-history',
        title: 'ইতিহাস ও মুক্তিযুদ্ধ',
        totalQuestions: 2600,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-bd-1', title: 'প্রাচীন বাংলা ও সুলতানি-মুঘল আমল', totalQuestions: 550, solvedQuestions: 0 },
          { id: 'sub-bd-2', title: 'ব্রিটিশ শাসন ও বঙ্গভঙ্গ', totalQuestions: 480, solvedQuestions: 0 },
          { id: 'sub-bd-3', title: 'ভাষা আন্দোলন ও যুক্তফ্রন্ট', totalQuestions: 420, solvedQuestions: 0 },
          { id: 'sub-bd-4', title: 'ছয় দফা ও ঊনসত্তরের গণঅভ্যুত্থান', totalQuestions: 350, solvedQuestions: 0 },
          { id: 'sub-bd-5', title: 'মহান মুক্তিযুদ্ধ ও স্বাধীনতা (১৯৭১)', totalQuestions: 800, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-bd-const',
        title: 'সংবিধান ও সরকার ব্যবস্থা',
        totalQuestions: 1900,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-bd-6', title: 'বাংলাদেশের সংবিধান ও মূলনীতি', totalQuestions: 750, solvedQuestions: 0 },
          { id: 'sub-bd-7', title: 'আইনসভা, নির্বাহী ও বিচার বিভাগ', totalQuestions: 650, solvedQuestions: 0 },
          { id: 'sub-bd-8', title: 'জাতীয় সংসদ ও নির্বাচন ব্যবস্থা', totalQuestions: 500, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-bd-eco',
        title: 'অর্থনীতি, সম্পদ ও সমসাময়িক',
        totalQuestions: 1900,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-bd-9', title: 'কৃষি, শিল্প ও খনিজ সম্পদ', totalQuestions: 600, solvedQuestions: 0 },
          { id: 'sub-bd-10', title: 'অর্থনৈতিক সমীক্ষা ও জাতীয় বাজেট', totalQuestions: 550, solvedQuestions: 0 },
          { id: 'sub-bd-11', title: 'মেগা প্রকল্প ও আন্তর্জাতিক অর্জন', totalQuestions: 750, solvedQuestions: 0 },
        ],
      },
    ],
  },
  {
    id: 'subj-intl',
    name: 'আন্তর্জাতিক বিষয়াবলি',
    iconType: 'intl',
    totalQuestions: 4200,
    topics: [
      {
        id: 'top-intl-org',
        title: 'আন্তর্জাতিক সংগঠন ও চুক্তি',
        totalQuestions: 1800,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-in-1', title: 'জাতিসংঘ ও এর অঙ্গসংস্থা', totalQuestions: 720, solvedQuestions: 0 },
          { id: 'sub-in-2', title: 'আঞ্চলিক সংস্থা (সার্ক, আসিয়ান, ইইউ, ন্যাটো)', totalQuestions: 630, solvedQuestions: 0 },
          { id: 'sub-in-3', title: 'আন্তর্জাতিক চুক্তি ও সম্মেলন', totalQuestions: 450, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-intl-geo',
        title: 'বিশ্ব রাজনীতি ও আঞ্চলিক ইতিহাস',
        totalQuestions: 2400,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-in-4', title: 'প্রথম ও দ্বিতীয় বিশ্বযুদ্ধ এবং স্নায়ুযুদ্ধ', totalQuestions: 600, solvedQuestions: 0 },
          { id: 'sub-in-5', title: 'মধ্যপ্রাচ্য ও ভূ-রাজনীতি', totalQuestions: 800, solvedQuestions: 0 },
          { id: 'sub-in-6', title: 'বিশ্বের সীমানা, প্রণালি ও বিতর্কিত অঞ্চল', totalQuestions: 1000, solvedQuestions: 0 },
        ],
      },
    ],
  },
  {
    id: 'subj-science',
    name: 'সাধারণ বিজ্ঞান',
    iconType: 'science',
    totalQuestions: 3500,
    topics: [
      {
        id: 'top-sci-phys',
        title: 'ভৌত বিজ্ঞান ও পদার্থবিদ্যা',
        totalQuestions: 1200,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-sc-1', title: 'গতি, বল, কাজ ও শক্তি', totalQuestions: 420, solvedQuestions: 0 },
          { id: 'sub-sc-2', title: 'শব্দ, আলো ও তরঙ্গ', totalQuestions: 400, solvedQuestions: 0 },
          { id: 'sub-sc-3', title: 'বিদ্যুৎ, চুম্বক ও আধুনিক পদার্থবিজ্ঞান', totalQuestions: 380, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-sci-bio',
        title: 'জীববিজ্ঞান ও উদ্ভিদবিজ্ঞান',
        totalQuestions: 1300,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-sc-4', title: 'কোষ ও বংশগতি', totalQuestions: 350, solvedQuestions: 0 },
          { id: 'sub-sc-5', title: 'মানবদেহ ও রোগব্যাধি', totalQuestions: 550, solvedQuestions: 0 },
          { id: 'sub-sc-6', title: 'খাদ্য, পুষ্টি ও ভিটামিন', totalQuestions: 400, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-sci-chem',
        title: 'রসায়ন ও পরিবেশ বিজ্ঞান',
        totalQuestions: 1000,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-sc-7', title: 'পদার্থের অবস্থা ও পর্যায় সারণি', totalQuestions: 320, solvedQuestions: 0 },
          { id: 'sub-sc-8', title: 'বায়ুমণ্ডল ও পরিবেশ দূষণ', totalQuestions: 380, solvedQuestions: 0 },
          { id: 'sub-sc-9', title: 'দৈনন্দিন জীবনে রসায়ন', totalQuestions: 300, solvedQuestions: 0 },
        ],
      },
    ],
  },
  {
    id: 'subj-ict',
    name: 'কম্পিউটার ও তথ্যপ্রযুক্তি',
    iconType: 'ict',
    totalQuestions: 2800,
    topics: [
      {
        id: 'top-ict-hardware',
        title: 'কম্পিউটার হার্ডওয়্যার ও মেমোরি',
        totalQuestions: 950,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-ict-1', title: 'ইনপুট ও আউটপুট ডিভাইস', totalQuestions: 320, solvedQuestions: 0 },
          { id: 'sub-ict-2', title: 'সিপিইউ, বাস ও মাদারবোর্ড', totalQuestions: 330, solvedQuestions: 0 },
          { id: 'sub-ict-3', title: 'প্রাইমারি ও সেকেন্ডারি মেমোরি', totalQuestions: 300, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-ict-network',
        title: 'নেটওয়ার্ক ও ইন্টারনেট',
        totalQuestions: 1100,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-ict-4', title: 'কম্পিউটার নেটওয়ার্ক ও টপোলজি', totalQuestions: 410, solvedQuestions: 0 },
          { id: 'sub-ict-5', title: 'ইন্টারনেট, ওয়েব ও প্রোটোকল', totalQuestions: 390, solvedQuestions: 0 },
          { id: 'sub-ict-6', title: 'সাইবার নিরাপত্তা ও ক্লাউড কম্পিউটিং', totalQuestions: 300, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-ict-num',
        title: 'সংখ্যা পদ্ধতি ও সফটওয়্যার',
        totalQuestions: 750,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-ict-7', title: 'বাইনারি ও বিভিন্ন সংখ্যা পদ্ধতি', totalQuestions: 350, solvedQuestions: 0 },
          { id: 'sub-ict-8', title: 'অপারেটিং সিস্টেম ও অ্যাপ্লিকেশন সফটওয়্যার', totalQuestions: 400, solvedQuestions: 0 },
        ],
      },
    ],
  },
  {
    id: 'subj-math',
    name: 'গাণিতিক যুক্তি',
    iconType: 'math',
    totalQuestions: 3200,
    topics: [
      {
        id: 'top-math-ari',
        title: 'পাটিগণিত',
        totalQuestions: 1100,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-mt-1', title: 'বাস্তব সংখ্যা, ল.সা.গু ও গ.সা.গু', totalQuestions: 380, solvedQuestions: 0 },
          { id: 'sub-mt-2', title: 'শতকরা, লাভ-ক্ষতি ও সুদকষা', totalQuestions: 420, solvedQuestions: 0 },
          { id: 'sub-mt-3', title: 'অনুপাত ও মিশ্রণ', totalQuestions: 300, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-math-alg',
        title: 'বীজগণিত',
        totalQuestions: 1250,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-mt-4', title: 'বীজগণিতীয় সূত্রাবলি ও উৎপাদক', totalQuestions: 450, solvedQuestions: 0 },
          { id: 'sub-mt-5', title: 'সূচক ও লগারিদম', totalQuestions: 420, solvedQuestions: 0 },
          { id: 'sub-mt-6', title: 'সমান্তর ও গুণোত্তর ধারা', totalQuestions: 380, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-math-geo',
        title: 'জ্যামিতি ও সম্ভাব্যতা',
        totalQuestions: 850,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-mt-7', title: 'রেখা, কোণ, ত্রিভুজ ও চতুর্ভুজ', totalQuestions: 390, solvedQuestions: 0 },
          { id: 'sub-mt-8', title: 'বৃত্ত ও পরিমিতি', totalQuestions: 280, solvedQuestions: 0 },
          { id: 'sub-mt-9', title: 'সেট, বিন্যাস, সমাবেশ ও সম্ভাব্যতা', totalQuestions: 180, solvedQuestions: 0 },
        ],
      },
    ],
  },
  {
    id: 'subj-mental',
    name: 'মানসিক দক্ষতা',
    iconType: 'mental',
    totalQuestions: 2100,
    topics: [
      {
        id: 'top-men-verb',
        title: 'ভাষাগত ও যৌক্তিক বিচার',
        totalQuestions: 1050,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-mn-1', title: 'ভাষাগত যৌক্তিক বিচার ও সাদৃশ্য', totalQuestions: 380, solvedQuestions: 0 },
          { id: 'sub-mn-2', title: 'রক্তের সম্পর্ক ও দিক নির্ণয়', totalQuestions: 350, solvedQuestions: 0 },
          { id: 'sub-mn-3', title: 'বানান ও ব্যাকরণগত দক্ষতা', totalQuestions: 320, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-men-num',
        title: 'গাণিতিক ও সমস্যা সমাধান',
        totalQuestions: 1050,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-mn-4', title: 'সংখ্যা ও অক্ষরের ধারা', totalQuestions: 420, solvedQuestions: 0 },
          { id: 'sub-mn-5', title: 'ঘড়ি ও ক্যালেন্ডার সংক্রান্ত সমস্যা', totalQuestions: 330, solvedQuestions: 0 },
          { id: 'sub-mn-6', title: 'চিত্র ও কোডিং-ডিকোডিং', totalQuestions: 300, solvedQuestions: 0 },
        ],
      },
    ],
  },
  {
    id: 'subj-ethics',
    name: 'নৈতিকতা, মূল্যবোধ ও সুশাসন',
    iconType: 'ethics',
    totalQuestions: 1500,
    topics: [
      {
        id: 'top-eth-main',
        title: 'নৈতিকতা ও মূল্যবোধ',
        totalQuestions: 750,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-et-1', title: 'নৈতিকতার ধারণা ও উপাদান', totalQuestions: 380, solvedQuestions: 0 },
          { id: 'sub-et-2', title: 'সামাজিক ও গণতান্ত্রিক মূল্যবোধ', totalQuestions: 370, solvedQuestions: 0 },
        ],
      },
      {
        id: 'top-gov-main',
        title: 'সুশাসন ও রাষ্ট্রীয় সততা',
        totalQuestions: 750,
        solvedQuestions: 0,
        subtopics: [
          { id: 'sub-et-3', title: 'সুশাসনের অর্থ, বৈশিষ্ট্য ও শর্তাবলি', totalQuestions: 420, solvedQuestions: 0 },
          { id: 'sub-et-4', title: 'ই-গভর্ন্যান্স ও দুর্নীতি প্রতিরোধ', totalQuestions: 330, solvedQuestions: 0 },
        ],
      },
    ],
  },
];
