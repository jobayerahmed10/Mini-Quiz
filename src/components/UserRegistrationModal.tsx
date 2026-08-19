import React from 'react';
import { AuthModal, AuthMode } from './AuthModal';
import { UserProfile } from '../lib/utils';

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (profile: UserProfile) => void;
  title?: string;
  initialMode?: AuthMode;
}

export const UserRegistrationModal: React.FC<UserRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
  title = 'পরীক্ষা শুরু করতে অ্যাকাউন্ট তৈরি করুন',
  initialMode = 'register',
}) => {
  return (
    <AuthModal
      isOpen={isOpen}
      onClose={onClose}
      initialMode={initialMode}
      onAuthSuccess={onSaveSuccess}
      title={title}
    />
  );
};
