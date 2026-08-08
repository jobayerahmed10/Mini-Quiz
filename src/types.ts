export interface Question {
  id: string | number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'option_a' | 'option_b' | 'option_c' | 'option_d' | 'a' | 'b' | 'c' | 'd' | 'ক' | 'খ' | 'গ' | 'ঘ' | string;
  explanation?: string | null;
  status?: 'published' | 'draft' | string;
  subject?: string | null;
  topic?: string | null;
  created_at?: string;
}

export type SelectedOption = 'option_a' | 'option_b' | 'option_c' | 'option_d' | null;

export interface UserAnswer {
  questionId: string | number;
  questionText: string;
  subject?: string | null;
  options: {
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
  };
  selectedOption: SelectedOption;
  correctOption: 'option_a' | 'option_b' | 'option_c' | 'option_d';
  isCorrect: boolean;
  explanation?: string | null;
}

export interface SubjectCategory {
  id: string;
  name: string;
  code: string;
  iconName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
  totalQuestionsCount?: number;
}

export interface QuizResult {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  score: number;
  percentage: number;
  userAnswers: UserAnswer[];
  completedAt: string;
  selectedSubject?: string | null;
}

export type TabRoute = 'exam' | 'courses' | 'ustad_ai' | 'circulars' | 'subjects';

export type PageRoute = 'home' | 'practice' | 'result';

export interface CourseModule {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  duration: string;
  lessonsCount: number;
  enrolledCount: string;
  rating: number;
  iconName: string;
  badge?: string;
  topics: string[];
  pdfAvailable?: boolean;
}

export interface UstadAiMessage {
  id: string;
  sender: 'user' | 'ustad';
  text: string;
  timestamp: string;
  category?: string;
  references?: string[];
}

export interface JobCircular {
  id: string;
  title: string;
  organization: string;
  designation: string;
  vacancyCount: string;
  deadline: string;
  publishedDate: string;
  category: 'NTRCA' | 'প্রাথমিক বিদ্যালয়' | 'সরকারি হাইস্কুল' | 'মাদ্রাসা ও কারিগরি' | 'কলেজ ও বিশ্ববিদ্যালয়';
  location: string;
  salaryRange: string;
  isHot?: boolean;
  isNtrcaOfficial?: boolean;
  applyUrl?: string;
  requirements: string[];
  description: string;
}

export interface PastPaper {
  id: string;
  title: string;
  year: string;
  examType: 'স্কুল পর্যায়' | 'কলেজ পর্যায়' | 'মাদ্রাসা পর্যায়' | 'স্কুল পর্যায়-২';
  totalQuestions: number;
  timeMinutes: number;
  difficulty: 'সহজ' | 'মাঝারি' | 'কঠিন';
  passingMarks: number;
}


