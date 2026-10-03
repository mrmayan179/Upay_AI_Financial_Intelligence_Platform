import React from 'react';

interface SplashViewProps {
  onComplete: () => void;
}

export const SplashView: React.FC<SplashViewProps> = ({ onComplete }) => {
  return (
    <div className="w-screen h-[100dvh] flex items-center justify-center bg-white relative overflow-hidden select-none">
      {/* Mobile & Desktop Adaptive Wrapper */}
      <main className="splash-container relative w-full h-full max-w-[620px] max-h-[1100px] flex items-center justify-center p-0">
        
        {/* Vector Illustration of the Upay Splash Graphic */}
        <svg 
          className="w-full h-full max-h-[100dvh] object-contain select-none"
          viewBox="0 0 450 780" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          aria-label="upay logo splash"
        >
          <defs>
            <filter id="subtle-shadow" x="-8%" y="-8%" width="116%" height="116%" filterUnits="userSpaceOnUse">
              <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#004FB6" floodOpacity="0.06" />
            </filter>
          </defs>

          {/* 1. DYNAMIC SWOOSH TRAIL */}
          <path 
            className="swoosh-path"
            d="M -30 450 
               C 120 458, 220 420, 275 370 
               C 345 306, 360 210, 310 148 
               C 255 80, 140 85, 95 155 
               C 48 228, 70 330, 150 380 
               C 220 422, 335 340, 395 238" 
            stroke="#0056B3" 
            strokeWidth="5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />

          {/* Swoosh End Dot */}
          <circle 
            className="swoosh-dot" 
            cx="395" 
            cy="238" 
            r="4.5" 
            fill="#0056B3"
          />

          {/* 2. MAIN LOGO CIRCLE EMBLEM */}
          <circle 
            cx="214" 
            cy="245" 
            r="138" 
            stroke="#0056B3" 
            strokeWidth="5.2" 
            fill="#FFFFFF"
            filter="url(#subtle-shadow)"
          />

          {/* 3. LOGO ICON & BENGALI TYPOGRAPHY */}
          <g className="logo-figures" transform="translate(0, 0)">
            
            {/* YELLOW FIGURE (LEFT) */}
            <circle cx="178" cy="192" r="19.5" fill="#FFC700" />
            <path 
              d="M 160 220 
                 C 160 212, 196 212, 196 220 
                 L 196 244 
                 C 196 268, 212 284, 234 284 
                 C 214 298, 160 292, 160 248 
                 Z" 
              fill="#FFC700" 
            />

            {/* BLUE FIGURE (RIGHT) */}
            <circle cx="250" cy="192" r="19.5" fill="#0056B3" />
            <path 
              d="M 232 220 
                 C 232 212, 268 212, 268 220 
                 L 268 248 
                 C 268 288, 222 292, 206 280 
                 C 222 280, 232 266, 232 244 
                 Z" 
              fill="#0056B3" 
            />

            {/* BOLD BENGALI BRAND NAME: উপায় */}
            <g transform="translate(155, 320)">
              <text 
                x="59" 
                y="32" 
                textAnchor="middle" 
                fill="#05070B" 
                fontFamily="'Hind Siliguri', sans-serif" 
                fontWeight="800" 
                fontSize="47" 
                letterSpacing="0.5"
              >উপায়</text>
            </g>

          </g>

        </svg>

        {/* Enter / Skip Splash button */}
        <button 
          onClick={onComplete}
          className="absolute bottom-10 px-6 py-2.5 rounded-full bg-upayBlue hover:bg-upayNavy text-white font-bold text-sm tracking-wide shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <span>অ্যাপে প্রবেশ করুন</span>
          <span>→</span>
        </button>

      </main>
    </div>
  );
};
