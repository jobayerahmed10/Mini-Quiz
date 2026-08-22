import React from 'react';
import { AuthContainer, AuthMode } from './AuthContainer';
import { UserProfile } from '../lib/utils';

export type { AuthMode };

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onAuthSuccess?: (profile: UserProfile) => void;
  title?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onAuthSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="auth-modal-overlay"
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
    >
      <AuthContainer
        initialMode={initialMode}
        onCancel={onClose}
        onSuccess={(profile) => {
          if (onAuthSuccess) onAuthSuccess(profile);
          onClose();
        }}
        isStandalone={false}
      />
    </div>
  );
};
