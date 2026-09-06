// Muslim Boy and Girl SVG Avatar presets
// High quality, crisp vector avatars designed for Islamic student profiles

function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

// 1. Muslim Boy - Emerald Punjabi & White Kufi / Prayer Cap
export const BOY_AVATAR_1 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_b1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b705c"/>
      <stop offset="100%" stop-color="#044336"/>
    </linearGradient>
    <linearGradient id="skin_b1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fde0be"/>
      <stop offset="100%" stop-color="#f5c28e"/>
    </linearGradient>
    <linearGradient id="cloth_b1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d856d"/>
      <stop offset="100%" stop-color="#064f40"/>
    </linearGradient>
  </defs>
  <!-- Background Circle -->
  <circle cx="80" cy="80" r="80" fill="url(#bg_b1)"/>
  <circle cx="80" cy="80" r="76" fill="none" stroke="#34d399" stroke-width="1.5" opacity="0.3"/>
  
  <!-- Body & Punjabi -->
  <path d="M 28 160 C 30 125, 48 116, 80 116 C 112 116, 130 125, 132 160 Z" fill="url(#cloth_b1)"/>
  <!-- Punjabi Collar & Buttons -->
  <path d="M 68 116 L 80 132 L 92 116" fill="none" stroke="#fde0be" stroke-width="2.5"/>
  <rect x="78.5" y="130" width="3" height="30" rx="1.5" fill="#f8fafc" opacity="0.8"/>
  <circle cx="80" cy="138" r="1.5" fill="#f59e0b"/>
  <circle cx="80" cy="147" r="1.5" fill="#f59e0b"/>
  <circle cx="80" cy="156" r="1.5" fill="#f59e0b"/>
  
  <!-- Neck -->
  <rect x="71" y="94" width="18" height="26" rx="4" fill="url(#skin_b1)"/>
  
  <!-- Head & Face -->
  <ellipse cx="80" cy="74" rx="28" ry="32" fill="url(#skin_b1)"/>
  <!-- Ears -->
  <ellipse cx="51" cy="74" rx="4.5" ry="7" fill="url(#skin_b1)"/>
  <ellipse cx="109" cy="74" rx="4.5" ry="7" fill="url(#skin_b1)"/>
  
  <!-- Hair peek -->
  <path d="M 52 64 Q 52 50 80 48 Q 108 50 108 64" fill="#2d1c10"/>
  
  <!-- Muslim Prayer Cap (টুপি / Kufi) -->
  <path d="M 48 58 C 48 32, 112 32, 112 58 C 112 63, 48 63, 48 58 Z" fill="#ffffff"/>
  <path d="M 48 58 C 58 55, 102 55, 112 58" stroke="#e2e8f0" stroke-width="1.5" fill="none"/>
  <!-- Cap geometric pattern -->
  <circle cx="65" cy="46" r="1.5" fill="#0b705c" opacity="0.6"/>
  <circle cx="80" cy="42" r="1.5" fill="#0b705c" opacity="0.6"/>
  <circle cx="95" cy="46" r="1.5" fill="#0b705c" opacity="0.6"/>
  <circle cx="72" cy="51" r="1.2" fill="#0b705c" opacity="0.5"/>
  <circle cx="88" cy="51" r="1.2" fill="#0b705c" opacity="0.5"/>
  <path d="M 49 61 Q 80 58 111 61" stroke="#cbd5e1" stroke-width="1.5" fill="none"/>
  
  <!-- Eyebrows -->
  <path d="M 62 67 Q 69 64 74 67" stroke="#2d1c10" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M 86 67 Q 91 64 98 67" stroke="#2d1c10" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  
  <!-- Eyes -->
  <ellipse cx="68" cy="74" rx="3.5" ry="4" fill="#1e293b"/>
  <circle cx="69.2" cy="72.5" r="1.2" fill="#ffffff"/>
  <ellipse cx="92" cy="74" rx="3.5" ry="4" fill="#1e293b"/>
  <circle cx="93.2" cy="72.5" r="1.2" fill="#ffffff"/>
  
  <!-- Nose -->
  <path d="M 80 73 L 80 82 L 77 84" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.7"/>
  
  <!-- Cheerful Smile -->
  <path d="M 72 88 Q 80 95 88 88" stroke="#be123c" stroke-width="2" stroke-linecap="round" fill="none"/>
  
  <!-- Trim Stubble / Neat Islamic beard line -->
  <path d="M 58 76 C 58 98, 102 98, 102 76 C 102 101, 58 101, 58 76 Z" fill="#2d1c10" opacity="0.25"/>
</svg>
`);

// 2. Muslim Boy - Navy Blue & Classic White Islamic Cap with Smart Glasses
export const BOY_AVATAR_2 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_b2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="skin_b2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
    <linearGradient id="cloth_b2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>
  <circle cx="80" cy="80" r="80" fill="url(#bg_b2)"/>
  <circle cx="80" cy="80" r="76" fill="none" stroke="#60a5fa" stroke-width="1.5" opacity="0.3"/>
  
  <!-- Punjabi -->
  <path d="M 28 160 C 30 124, 48 115, 80 115 C 112 115, 130 124, 132 160 Z" fill="url(#cloth_b2)"/>
  <!-- Gold trim neckline -->
  <path d="M 68 115 L 80 130 L 92 115" fill="none" stroke="#fbbf24" stroke-width="2"/>
  <rect x="78.5" y="128" width="3" height="32" rx="1.5" fill="#1e40af"/>
  <circle cx="80" cy="136" r="1.5" fill="#fbbf24"/>
  <circle cx="80" cy="145" r="1.5" fill="#fbbf24"/>
  <circle cx="80" cy="154" r="1.5" fill="#fbbf24"/>
  
  <!-- Neck -->
  <rect x="71" y="93" width="18" height="26" rx="4" fill="url(#skin_b2)"/>
  
  <!-- Head & Face -->
  <ellipse cx="80" cy="74" rx="28" ry="32" fill="url(#skin_b2)"/>
  <ellipse cx="51" cy="74" rx="4.5" ry="7" fill="url(#skin_b2)"/>
  <ellipse cx="109" cy="74" rx="4.5" ry="7" fill="url(#skin_b2)"/>
  
  <!-- White Topi / Kufi with embroidered rim -->
  <path d="M 48 57 C 48 30, 112 30, 112 57 C 112 62, 48 62, 48 57 Z" fill="#ffffff"/>
  <path d="M 48 57 Q 80 53 112 57" stroke="#93c5fd" stroke-width="2" fill="none"/>
  <!-- Intricate crochet texture -->
  <path d="M 55 48 Q 80 43 105 48" stroke="#bfdbfe" stroke-width="1.5" stroke-dasharray="2,2" fill="none"/>
  <path d="M 60 40 Q 80 36 100 40" stroke="#bfdbfe" stroke-width="1.5" stroke-dasharray="2,2" fill="none"/>
  
  <!-- Eyebrows -->
  <path d="M 62 66 Q 68 63 74 66" stroke="#1f2937" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <path d="M 86 66 Q 92 63 98 66" stroke="#1f2937" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  
  <!-- Stylish Round Glasses -->
  <circle cx="68" cy="74" r="8" fill="none" stroke="#1e293b" stroke-width="2"/>
  <circle cx="92" cy="74" r="8" fill="none" stroke="#1e293b" stroke-width="2"/>
  <path d="M 76 74 L 84 74" stroke="#1e293b" stroke-width="2"/>
  <path d="M 60 74 L 52 72" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 100 74 L 108 72" stroke="#1e293b" stroke-width="1.5"/>
  <circle cx="68" cy="74" r="7.5" fill="#ffffff" opacity="0.15"/>
  <circle cx="92" cy="74" r="7.5" fill="#ffffff" opacity="0.15"/>
  
  <!-- Eyes behind glasses -->
  <ellipse cx="68" cy="74" rx="3" ry="3.5" fill="#0f172a"/>
  <circle cx="69" cy="73" r="1" fill="#ffffff"/>
  <ellipse cx="92" cy="74" rx="3" ry="3.5" fill="#0f172a"/>
  <circle cx="93" cy="73" r="1" fill="#ffffff"/>
  
  <!-- Nose -->
  <path d="M 80 75 L 80 82 L 78 84" stroke="#ea580c" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6"/>
  
  <!-- Smile -->
  <path d="M 73 89 Q 80 95 87 89" stroke="#991b1b" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>
`);

// 3. Muslim Boy - Warm Amber & Handsome Sunnah Beard & White Kufi
export const BOY_AVATAR_3 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_b3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b45309"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
    <linearGradient id="skin_b3" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fcd34d"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <linearGradient id="cloth_b3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <circle cx="80" cy="80" r="80" fill="url(#bg_b3)"/>
  <circle cx="80" cy="80" r="76" fill="none" stroke="#fde68a" stroke-width="1.5" opacity="0.3"/>
  
  <!-- Charcoal Punjabi -->
  <path d="M 28 160 C 30 124, 48 115, 80 115 C 112 115, 130 124, 132 160 Z" fill="url(#cloth_b3)"/>
  <path d="M 68 115 L 80 130 L 92 115" fill="none" stroke="#e2e8f0" stroke-width="2"/>
  <rect x="78.5" y="128" width="3" height="32" rx="1.5" fill="#475569"/>
  <circle cx="80" cy="136" r="1.5" fill="#f8fafc"/>
  <circle cx="80" cy="145" r="1.5" fill="#f8fafc"/>
  <circle cx="80" cy="154" r="1.5" fill="#f8fafc"/>
  
  <!-- Neck -->
  <rect x="71" y="93" width="18" height="26" rx="4" fill="#fde0be"/>
  
  <!-- Head & Face -->
  <ellipse cx="80" cy="74" rx="28" ry="32" fill="#fde0be"/>
  <ellipse cx="51" cy="74" rx="4.5" ry="7" fill="#fde0be"/>
  <ellipse cx="109" cy="74" rx="4.5" ry="7" fill="#fde0be"/>
  
  <!-- White Embroidered Kufi -->
  <path d="M 48 57 C 48 30, 112 30, 112 57 C 112 62, 48 62, 48 57 Z" fill="#ffffff"/>
  <path d="M 48 57 Q 80 54 112 57" stroke="#f59e0b" stroke-width="2" fill="none"/>
  <circle cx="80" cy="42" r="2.5" fill="#d97706"/>
  <circle cx="66" cy="46" r="2" fill="#d97706"/>
  <circle cx="94" cy="46" r="2" fill="#d97706"/>
  <circle cx="56" cy="52" r="1.5" fill="#d97706"/>
  <circle cx="104" cy="52" r="1.5" fill="#d97706"/>
  
  <!-- Handsome Sunnah Beard -->
  <path d="M 52 74 C 52 108, 108 108, 108 74 C 108 92, 102 104, 80 106 C 58 104, 52 92, 52 74 Z" fill="#1e293b"/>
  <path d="M 52 74 Q 56 68 62 67" stroke="#1e293b" stroke-width="3" fill="none"/>
  <path d="M 108 74 Q 104 68 98 67" stroke="#1e293b" stroke-width="3" fill="none"/>
  
  <!-- Eyebrows -->
  <path d="M 62 66 Q 68 63 74 66" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M 86 66 Q 92 63 98 66" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  
  <!-- Eyes -->
  <ellipse cx="68" cy="73" rx="3.5" ry="4" fill="#0f172a"/>
  <circle cx="69.2" cy="71.5" r="1.2" fill="#ffffff"/>
  <ellipse cx="92" cy="73" rx="3.5" ry="4" fill="#0f172a"/>
  <circle cx="93.2" cy="71.5" r="1.2" fill="#ffffff"/>
  
  <!-- Nose -->
  <path d="M 80 73 L 80 81 L 77 83" stroke="#b45309" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.7"/>
  
  <!-- Smile with neat mustache -->
  <path d="M 72 84 Q 80 87 88 84" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M 74 88 Q 80 93 86 88" stroke="#be123c" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>
`);

// 4. Muslim Boy - Sage Olive & Traditional Topi
export const BOY_AVATAR_4 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_b4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="skin_b4" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
    <linearGradient id="cloth_b4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#65a30d"/>
      <stop offset="100%" stop-color="#3f6212"/>
    </linearGradient>
  </defs>
  <circle cx="80" cy="80" r="80" fill="url(#bg_b4)"/>
  <circle cx="80" cy="80" r="76" fill="none" stroke="#a3e635" stroke-width="1.5" opacity="0.3"/>
  
  <!-- Olive Green Punjabi -->
  <path d="M 28 160 C 30 124, 48 115, 80 115 C 112 115, 130 124, 132 160 Z" fill="url(#cloth_b4)"/>
  <path d="M 68 115 L 80 130 L 92 115" fill="none" stroke="#ecfccb" stroke-width="2.5"/>
  <rect x="78.5" y="128" width="3" height="32" rx="1.5" fill="#f8fafc" opacity="0.9"/>
  <circle cx="80" cy="136" r="1.5" fill="#3f6212"/>
  <circle cx="80" cy="145" r="1.5" fill="#3f6212"/>
  <circle cx="80" cy="154" r="1.5" fill="#3f6212"/>
  
  <!-- Neck -->
  <rect x="71" y="93" width="18" height="26" rx="4" fill="url(#skin_b4)"/>
  
  <!-- Head & Face -->
  <ellipse cx="80" cy="74" rx="28" ry="32" fill="url(#skin_b4)"/>
  <ellipse cx="51" cy="74" rx="4.5" ry="7" fill="url(#skin_b4)"/>
  <ellipse cx="109" cy="74" rx="4.5" ry="7" fill="url(#skin_b4)"/>
  
  <!-- Topi -->
  <path d="M 48 57 C 48 30, 112 30, 112 57 C 112 62, 48 62, 48 57 Z" fill="#ffffff"/>
  <path d="M 48 57 Q 80 54 112 57" stroke="#65a30d" stroke-width="2" fill="none"/>
  <path d="M 64 36 L 80 48 L 96 36" stroke="#84cc16" stroke-width="1.5" fill="none"/>
  
  <!-- Eyebrows -->
  <path d="M 62 66 Q 68 63 74 66" stroke="#1c1917" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M 86 66 Q 92 63 98 66" stroke="#1c1917" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  
  <!-- Eyes -->
  <ellipse cx="68" cy="73" rx="3.5" ry="4" fill="#0f172a"/>
  <circle cx="69.2" cy="71.5" r="1.2" fill="#ffffff"/>
  <ellipse cx="92" cy="73" rx="3.5" ry="4" fill="#0f172a"/>
  <circle cx="93.2" cy="71.5" r="1.2" fill="#ffffff"/>
  
  <!-- Nose -->
  <path d="M 80 73 L 80 82 L 77 84" stroke="#c2410c" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6"/>
  
  <!-- Cheerful Smile -->
  <path d="M 72 89 Q 80 96 88 89" stroke="#b91c1c" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>
`);

// 5. Muslim Girl - Elegant Emerald Hijab (সবুজ হিজাব)
export const GIRL_AVATAR_1 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b705c"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
    <linearGradient id="skin_g1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff1f2"/>
      <stop offset="100%" stop-color="#fecdd3"/>
    </linearGradient>
    <linearGradient id="hijab_g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="cloth_g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
  </defs>
  <circle cx="80" cy="80" r="80" fill="url(#bg_g1)"/>
  <circle cx="80" cy="80" r="76" fill="none" stroke="#6ee7b7" stroke-width="1.5" opacity="0.35"/>
  
  <!-- Outer Hijab Back / Draping onto Shoulders -->
  <path d="M 24 160 C 26 110, 40 85, 80 85 C 120 85, 134 110, 136 160 Z" fill="url(#hijab_g1)"/>
  <!-- Front Body Dress / Abaya -->
  <path d="M 38 160 C 44 135, 60 128, 80 128 C 100 128, 116 135, 122 160 Z" fill="url(#cloth_g1)"/>
  <!-- Hijab Drape & Golden Pin Accent -->
  <path d="M 52 110 C 65 140, 80 155, 80 160 C 80 155, 95 140, 108 110" fill="url(#hijab_g1)" opacity="0.95"/>
  <circle cx="80" cy="118" r="3" fill="#fbbf24"/>
  <circle cx="80" cy="118" r="1.5" fill="#ffffff"/>
  
  <!-- Inner Hijab Undercap (White/Cream Cap peek) -->
  <ellipse cx="80" cy="58" rx="26" ry="16" fill="#f8fafc"/>
  
  <!-- Face Oval framed by Hijab -->
  <ellipse cx="80" cy="74" rx="23" ry="26" fill="url(#skin_g1)"/>
  
  <!-- Hijab Wrapping tightly and beautifully framing face -->
  <path d="M 46 64 C 46 32, 114 32, 114 64 C 114 88, 102 108, 80 114 C 58 108, 46 88, 46 64 Z" fill="none" stroke="url(#hijab_g1)" stroke-width="14"/>
  <!-- Hijab Top Volume -->
  <path d="M 48 60 C 48 30, 112 30, 112 60 C 112 36, 48 36, 48 60 Z" fill="url(#hijab_g1)"/>
  <path d="M 50 62 Q 80 46 110 62" stroke="#34d399" stroke-width="1.5" fill="none" opacity="0.6"/>
  
  <!-- Delicate Eyebrows -->
  <path d="M 64 66 Q 70 63 76 66" stroke="#4c1d95" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M 84 66 Q 90 63 96 66" stroke="#4c1d95" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  
  <!-- Beautiful Bright Eyes with Eyelashes -->
  <ellipse cx="69" cy="73" rx="3.5" ry="4" fill="#0f172a"/>
  <circle cx="70.2" cy="71.5" r="1.3" fill="#ffffff"/>
  <path d="M 64 71 Q 69 68 74 71" stroke="#0f172a" stroke-width="1.8" fill="none"/>
  <path d="M 74 70 L 76 68" stroke="#0f172a" stroke-width="1.5"/>
  
  <ellipse cx="91" cy="73" rx="3.5" ry="4" fill="#0f172a"/>
  <circle cx="92.2" cy="71.5" r="1.3" fill="#ffffff"/>
  <path d="M 86 71 Q 91 68 96 71" stroke="#0f172a" stroke-width="1.8" fill="none"/>
  <path d="M 96 70 L 98 68" stroke="#0f172a" stroke-width="1.5"/>
  
  <!-- Rosy Cheeks -->
  <circle cx="62" cy="79" r="4.5" fill="#fb7185" opacity="0.35"/>
  <circle cx="98" cy="79" r="4.5" fill="#fb7185" opacity="0.35"/>
  
  <!-- Cute Nose -->
  <circle cx="80" cy="80" r="1.5" fill="#f43f5e" opacity="0.4"/>
  
  <!-- Sweet Smile with soft pink lips -->
  <path d="M 73 88 Q 80 94 87 88" stroke="#e11d48" stroke-width="2.2" stroke-linecap="round" fill="none"/>
</svg>
`);

// 6. Muslim Girl - Soft Rose / Pink Hijab (গোলাপি হিজাব)
export const GIRL_AVATAR_2 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_g2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#be185d"/>
      <stop offset="100%" stop-color="#831843"/>
    </linearGradient>
    <linearGradient id="skin_g2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff5f5"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
    <linearGradient id="hijab_g2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f472b6"/>
      <stop offset="100%" stop-color="#db2777"/>
    </linearGradient>
    <linearGradient id="cloth_g2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#9d174d"/>
    </linearGradient>
  </defs>
  <circle cx="80" cy="80" r="80" fill="url(#bg_g2)"/>
  <circle cx="80" cy="80" r="76" fill="none" stroke="#fbcfe8" stroke-width="1.5" opacity="0.35"/>
  
  <!-- Hijab Body Base -->
  <path d="M 24 160 C 26 110, 40 85, 80 85 C 120 85, 134 110, 136 160 Z" fill="url(#hijab_g2)"/>
  <!-- Front Abaya / Dress -->
  <path d="M 38 160 C 44 135, 60 128, 80 128 C 100 128, 116 135, 122 160 Z" fill="url(#cloth_g2)"/>
  <!-- Front Drapery with Pearl Pin -->
  <path d="M 52 110 C 65 140, 80 155, 80 160 C 80 155, 95 140, 108 110" fill="url(#hijab_g2)" opacity="0.95"/>
  <circle cx="80" cy="116" r="3" fill="#ffffff"/>
  <circle cx="80" cy="116" r="1.5" fill="#f472b6"/>
  
  <!-- Inner Cap -->
  <ellipse cx="80" cy="58" rx="26" ry="16" fill="#fdf2f8"/>
  
  <!-- Face Oval -->
  <ellipse cx="80" cy="74" rx="23" ry="26" fill="url(#skin_g2)"/>
  
  <!-- Hijab Face Border -->
  <path d="M 46 64 C 46 32, 114 32, 114 64 C 114 88, 102 108, 80 114 C 58 108, 46 88, 46 64 Z" fill="none" stroke="url(#hijab_g2)" stroke-width="14"/>
  <!-- Top Hijab Dome -->
  <path d="M 48 60 C 48 30, 112 30, 112 60 C 112 36, 48 36, 48 60 Z" fill="url(#hijab_g2)"/>
  <path d="M 50 62 Q 80 46 110 62" stroke="#fbcfe8" stroke-width="1.5" fill="none" opacity="0.7"/>
  
  <!-- Eyebrows -->
  <path d="M 64 66 Q 70 63 76 66" stroke="#374151" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M 84 66 Q 90 63 96 66" stroke="#374151" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  
  <!-- Eyes -->
  <ellipse cx="69" cy="73" rx="3.5" ry="4" fill="#18181b"/>
  <circle cx="70.2" cy="71.5" r="1.3" fill="#ffffff"/>
  <path d="M 64 71 Q 69 68 74 71" stroke="#18181b" stroke-width="1.8" fill="none"/>
  <path d="M 74 70 L 76 68" stroke="#18181b" stroke-width="1.5"/>
  
  <ellipse cx="91" cy="73" rx="3.5" ry="4" fill="#18181b"/>
  <circle cx="92.2" cy="71.5" r="1.3" fill="#ffffff"/>
  <path d="M 86 71 Q 91 68 96 71" stroke="#18181b" stroke-width="1.8" fill="none"/>
  <path d="M 96 70 L 98 68" stroke="#18181b" stroke-width="1.5"/>
  
  <!-- Cheeks -->
  <circle cx="62" cy="79" r="4.5" fill="#f43f5e" opacity="0.35"/>
  <circle cx="98" cy="79" r="4.5" fill="#f43f5e" opacity="0.35"/>
  
  <!-- Nose & Smile -->
  <circle cx="80" cy="80" r="1.5" fill="#f43f5e" opacity="0.4"/>
  <path d="M 73 88 Q 80 94 87 88" stroke="#be123c" stroke-width="2.2" stroke-linecap="round" fill="none"/>
</svg>
`);

// 7. Muslim Girl - Smart Navy Blue Hijab with Modern Glasses
export const GIRL_AVATAR_3 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_g3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="skin_g3" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fecdd3"/>
    </linearGradient>
    <linearGradient id="hijab_g3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>
  <circle cx="80" cy="80" r="80" fill="url(#bg_g3)"/>
  <circle cx="80" cy="80" r="76" fill="none" stroke="#93c5fd" stroke-width="1.5" opacity="0.35"/>
  
  <!-- Hijab Base -->
  <path d="M 24 160 C 26 110, 40 85, 80 85 C 120 85, 134 110, 136 160 Z" fill="url(#hijab_g3)"/>
  <path d="M 38 160 C 44 135, 60 128, 80 128 C 100 128, 116 135, 122 160 Z" fill="#1e3a8a"/>
  
  <!-- Face Oval -->
  <ellipse cx="80" cy="74" rx="23" ry="26" fill="url(#skin_g3)"/>
  
  <!-- Hijab Face Border -->
  <path d="M 46 64 C 46 32, 114 32, 114 64 C 114 88, 102 108, 80 114 C 58 108, 46 88, 46 64 Z" fill="none" stroke="url(#hijab_g3)" stroke-width="14"/>
  <path d="M 48 60 C 48 30, 112 30, 112 60 C 112 36, 48 36, 48 60 Z" fill="url(#hijab_g3)"/>
  
  <!-- Glasses -->
  <circle cx="68" cy="74" r="7.5" fill="none" stroke="#fbbf24" stroke-width="1.8"/>
  <circle cx="92" cy="74" r="7.5" fill="none" stroke="#fbbf24" stroke-width="1.8"/>
  <path d="M 75.5 74 L 84.5 74" stroke="#fbbf24" stroke-width="1.8"/>
  <path d="M 60.5 74 L 54 72" stroke="#fbbf24" stroke-width="1.5"/>
  <path d="M 99.5 74 L 106 72" stroke="#fbbf24" stroke-width="1.5"/>
  
  <!-- Eyes -->
  <ellipse cx="68" cy="74" rx="3" ry="3.5" fill="#0f172a"/>
  <circle cx="69" cy="72.5" r="1.1" fill="#ffffff"/>
  <ellipse cx="92" cy="74" rx="3" ry="3.5" fill="#0f172a"/>
  <circle cx="93" cy="72.5" r="1.1" fill="#ffffff"/>
  
  <!-- Cheerful Smile -->
  <path d="M 73 88 Q 80 94 87 88" stroke="#e11d48" stroke-width="2.2" stroke-linecap="round" fill="none"/>
</svg>
`);

// 8. Muslim Girl - Deep Burgundy / Plum Modest Hijab (মেরুন হিজাব)
export const GIRL_AVATAR_4 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_g4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4c0519"/>
      <stop offset="100%" stop-color="#1f030a"/>
    </linearGradient>
    <linearGradient id="skin_g4" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff1f2"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
    <linearGradient id="hijab_g4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9f1239"/>
      <stop offset="100%" stop-color="#881337"/>
    </linearGradient>
  </defs>
  <circle cx="80" cy="80" r="80" fill="url(#bg_g4)"/>
  <circle cx="80" cy="80" r="76" fill="none" stroke="#f43f5e" stroke-width="1.5" opacity="0.35"/>
  
  <!-- Hijab Base -->
  <path d="M 24 160 C 26 110, 40 85, 80 85 C 120 85, 134 110, 136 160 Z" fill="url(#hijab_g4)"/>
  <path d="M 38 160 C 44 135, 60 128, 80 128 C 100 128, 116 135, 122 160 Z" fill="#4c0519"/>
  <circle cx="80" cy="116" r="3" fill="#facc15"/>
  
  <!-- Face Oval -->
  <ellipse cx="80" cy="74" rx="23" ry="26" fill="url(#skin_g4)"/>
  
  <!-- Hijab Face Border -->
  <path d="M 46 64 C 46 32, 114 32, 114 64 C 114 88, 102 108, 80 114 C 58 108, 46 88, 46 64 Z" fill="none" stroke="url(#hijab_g4)" stroke-width="14"/>
  <path d="M 48 60 C 48 30, 112 30, 112 60 C 112 36, 48 36, 48 60 Z" fill="url(#hijab_g4)"/>
  
  <!-- Eyebrows -->
  <path d="M 64 66 Q 70 63 76 66" stroke="#262626" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M 84 66 Q 90 63 96 66" stroke="#262626" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  
  <!-- Eyes -->
  <ellipse cx="69" cy="73" rx="3.5" ry="4" fill="#09090b"/>
  <circle cx="70.2" cy="71.5" r="1.3" fill="#ffffff"/>
  <ellipse cx="91" cy="73" rx="3.5" ry="4" fill="#09090b"/>
  <circle cx="92.2" cy="71.5" r="1.3" fill="#ffffff"/>
  
  <!-- Cheeks & Smile -->
  <circle cx="62" cy="79" r="4.5" fill="#fb7185" opacity="0.35"/>
  <circle cx="98" cy="79" r="4.5" fill="#fb7185" opacity="0.35"/>
  <path d="M 73 88 Q 80 94 87 88" stroke="#be123c" stroke-width="2.2" stroke-linecap="round" fill="none"/>
</svg>
`);

export interface PresetAvatarItem {
  id: string;
  name: string;
  gender: 'boy' | 'girl';
  url: string;
}

export const ISLAMIC_PRESET_AVATARS: PresetAvatarItem[] = [
  { id: 'boy_1', name: 'ছেলে (সবুজ পাঞ্জাবি ও টুপি)', gender: 'boy', url: BOY_AVATAR_1 },
  { id: 'boy_2', name: 'ছেলে (নীল পাঞ্জাবি ও চশমা)', gender: 'boy', url: BOY_AVATAR_2 },
  { id: 'boy_3', name: 'ছেলে (সুন্নতি দাঁড়ি ও টুপি)', gender: 'boy', url: BOY_AVATAR_3 },
  { id: 'boy_4', name: 'ছেলে (অলিভ পাঞ্জাবি ও টুপি)', gender: 'boy', url: BOY_AVATAR_4 },
  { id: 'girl_1', name: 'মেয়ে (সবুজ শালীন হিজাব)', gender: 'girl', url: GIRL_AVATAR_1 },
  { id: 'girl_2', name: 'মেয়ে (গোলাপি হিজাব)', gender: 'girl', url: GIRL_AVATAR_2 },
  { id: 'girl_3', name: 'মেয়ে (নীল হিজাব ও চশমা)', gender: 'girl', url: GIRL_AVATAR_3 },
  { id: 'girl_4', name: 'মেয়ে (মেরুন হিজাব)', gender: 'girl', url: GIRL_AVATAR_4 },
];

export const PRESET_AVATAR_URLS: string[] = ISLAMIC_PRESET_AVATARS.map((a) => a.url);
