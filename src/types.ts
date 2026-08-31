export interface Question {
  id: string | number;
  question_code?: string | null;
  slug?: string | null;
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
  exam_id?: string | null;
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
  examId?: string | null;
  examTitle?: string | null;
  timeTakenSeconds?: number;
  negativeMarks?: number;
}

export type TabRoute = 'home' | 'exam' | 'courses' | 'ustad_ai' | 'circulars' | 'subjects';

export type PageRoute = 'home' | 'practice' | 'result' | 'leaderboard' | 'profile' | 'question_detail';

export interface CourseRoutineItem {
  id?: string;
  course_id?: string;
  day?: string;
  time?: string;
  subject?: string;
  topic?: string;
  instructor?: string;
  room_or_link?: string;
  notes?: string;
}

export interface CourseSyllabusItem {
  id?: string;
  course_id?: string;
  chapter?: string;
  subject?: string;
  topic?: string;
  details?: string;
  classes_count?: number;
}

export interface CourseModule {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  syllabus?: string | string[];
  routine?: string | string[];
  routineUrl?: string;
  syllabusUrl?: string;
  driveLink?: string;
  liveClassUrl?: string;
  whatsappGroup?: string;
  category: string;
  duration?: string;
  lessonsCount?: number;
  enrolledCount?: string;
  rating?: number;
  iconName?: string;
  badge?: string;
  badgeSub?: string;
  classesCount?: number;
  sheetsCount?: number;
  examsCount?: number;
  isEnrolled?: boolean;
  isLocked?: boolean;
  price?: string;
  accentColor?: 'emerald' | 'purple' | 'amber';
  topics?: string[];
  instructor?: string;
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

export interface CourseSheet {
  id: string;
  course_id?: string;
  title: string;
  name?: string;
  file_url?: string;
  size?: string;
  created_at?: string;
}

export interface CourseExam {
  id: string;
  course_id?: string;
  title: string;
  topic?: string;
  date?: string;
  specs?: string;
  question_count?: number;
  time_minutes?: number;
  score?: string | null;
  created_at?: string;
}

export interface CourseEnrollmentRecord {
  id?: string;
  course_id: string;
  course_title: string;
  student_name: string;
  phone_number: string;
  email?: string;
  payment_method: 'bkash' | 'nagad' | 'rocket' | string;
  amount: string;
  transaction_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

export interface QuestionLike {
  id?: string;
  question_id: string | number;
  user_id: string;
  user_name?: string;
  created_at?: string;
}

export interface QuestionBookmark {
  id?: string;
  question_id: string | number;
  user_id: string;
  created_at?: string;
}

export interface QuestionReport {
  id?: string;
  question_id: string | number;
  user_id?: string;
  user_name?: string;
  phone?: string;
  email?: string;
  reason: string;
  details?: string;
  status?: 'pending' | 'reviewed' | 'resolved';
  created_at?: string;
}

export interface QuestionCommunityExplanation {
  id: string;
  question_id: string | number;
  user_id?: string;
  author_name: string;
  author_avatar?: string;
  explanation: string;
  likes_count?: number;
  status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
}



