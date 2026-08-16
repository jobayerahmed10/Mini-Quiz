import React from 'react';
import { GraduationCap } from 'lucide-react';

interface AtTamreenLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const AtTamreenLogo: React.FC<AtTamreenLogoProps> = ({ 
  className = "w-12 h-12 sm:w-14 sm:h-14", 
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center rounded-[20px] sm:rounded-[22px] bg-[#07532B] dark:bg-[#046A38] shadow-sm shrink-0 ${className}`}>
      <GraduationCap 
        className="w-3/5 h-3/5 text-[#EAB308]" 
        strokeWidth={2.3} 
      />
    </div>
  );
};

