import React from 'react';

interface AtTamreenLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const AtTamreenLogo: React.FC<AtTamreenLogoProps> = ({ 
  className = "w-10 h-10", 
  size = 44 
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-xs"
      >
        {/* Crescent Moon on Top */}
        <path 
          d="M 50 6 C 53.5 6 56.5 8 57.5 11 C 55 10 52 10.5 50 12.5 C 48 14.5 47.5 17.5 48.5 20 C 45.5 19 43.5 16 43.5 12.5 C 43.5 8.9 46.4 6 50 6 Z" 
          fill="url(#goldGradient)" 
        />
        
        {/* Main Arch Frame */}
        <path 
          d="M 18 88 L 18 45 C 18 26 32 16 50 16 C 68 16 82 26 82 45 L 82 88 L 68 88 L 68 46 C 68 34 60 26 50 26 C 40 26 32 34 32 46 L 32 88 L 18 88 Z" 
          fill="url(#emeraldGradient)" 
        />

        {/* Inner Minaret Pillar & Lamp Line */}
        <path 
          d="M 44 88 L 44 40 C 44 36 46 32 50 32 C 54 32 56 36 56 40 L 56 88 L 51 88 L 51 40 C 51 39 50.5 38 50 38 C 49.5 38 49 39 49 40 L 49 88 L 44 88 Z" 
          fill="url(#emeraldGradient)" 
        />

        {/* Hanging Lantern Diamond in Arch */}
        <polygon points="50,42 53,46 50,50 47,46" fill="url(#goldGradient)" />
        <line x1="50" y1="32" x2="50" y2="42" stroke="#F59E0B" strokeWidth="1.5" />

        {/* Calligraphy Blocks Inside Arch */}
        {/* Left Vertical Bar */}
        <rect x="24" y="58" width="6" height="24" rx="1.5" fill="url(#emeraldGradient)" />
        {/* Right Vertical Bar */}
        <rect x="70" y="48" width="6" height="34" rx="1.5" fill="url(#emeraldGradient)" />

        {/* Decorative Gold Accents / Dots */}
        <rect x="27" y="52" width="4" height="4" rx="0.8" fill="url(#goldGradient)" />
        <rect x="60" y="54" width="4" height="4" rx="0.8" fill="url(#goldGradient)" />
        <rect x="60" y="60" width="4" height="4" rx="0.8" fill="url(#goldGradient)" />
        <rect x="27" y="84" width="4" height="4" rx="0.8" fill="url(#goldGradient)" />
        <rect x="33" y="84" width="4" height="4" rx="0.8" fill="url(#goldGradient)" />
        <rect x="53" y="70" width="4" height="4" rx="0.8" fill="url(#goldGradient)" />

        {/* Bottom Academy Base Bar */}
        <path d="M 38 84 H 62 V 88 H 38 Z" fill="url(#goldGradient)" />

        {/* Gradients Definition */}
        <defs>
          <linearGradient id="emeraldGradient" x1="18" y1="16" x2="82" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0B705C" />
            <stop offset="0.5" stopColor="#0D8A72" />
            <stop offset="1" stopColor="#085A4A" />
          </linearGradient>

          <linearGradient id="goldGradient" x1="40" y1="6" x2="60" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B" />
            <stop offset="0.5" stopColor="#FBBF24" />
            <stop offset="1" stopColor="#D97706" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
