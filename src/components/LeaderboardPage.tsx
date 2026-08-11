import React from 'react';
import { LeaderboardView } from './LeaderboardView';
import { ExamItem } from '../lib/supabase';

interface LeaderboardPageProps {
  onBack: () => void;
  currentUserScore?: number;
  totalQuestions?: number;
  correctCount?: number;
  wrongCount?: number;
  initialExamId?: string;
  exams?: ExamItem[];
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  onBack,
  initialExamId = 'all',
  exams,
}) => {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#070D1E] py-6 px-3 sm:px-6 pb-24 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <LeaderboardView
          onBack={onBack}
          initialExamId={initialExamId}
          exams={exams}
        />
      </div>
    </div>
  );
};
