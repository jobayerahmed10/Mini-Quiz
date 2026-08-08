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
  created_at?: string;
}

export type SelectedOption = 'option_a' | 'option_b' | 'option_c' | 'option_d' | null;

export interface UserAnswer {
  questionId: string | number;
  questionText: string;
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

export interface QuizResult {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  score: number;
  percentage: number;
  userAnswers: UserAnswer[];
  completedAt: string;
}

export type PageRoute = 'home' | 'practice' | 'result';
