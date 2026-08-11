import React from 'react';
import { LeaderboardView } from './LeaderboardView';
import { ExamItem } from '../lib/supabase';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserScore?: number;
  totalQuestions?: number;
  correctCount?: number;
  wrongCount?: number;
  examId?: string;
  examTitle?: string;
  exams?: ExamItem[];
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  examId = 'all',
  exams,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#F4F7F9] dark:bg-[#070D1E] max-w-2xl w-full max-h-[92vh] overflow-y-auto rounded-[36px] border border-slate-200 dark:border-slate-800 shadow-2xl relative p-4 sm:p-6 my-auto">
        <LeaderboardView
          onClose={onClose}
          isModal={true}
          initialExamId={examId}
          exams={exams}
        />
      </div>
    </div>
  );
};
