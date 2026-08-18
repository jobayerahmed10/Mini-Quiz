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
  title,
  initialMode = 'login',
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
