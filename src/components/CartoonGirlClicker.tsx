import React from 'react';

interface CartoonGirlClickerProps {
  onClick: () => void;
  buttonText?: string;
  subText?: string;
}

export const CartoonGirlClicker: React.FC<CartoonGirlClickerProps> = ({
  onClick,
  buttonText = "Get Started with Google",
  subText = "Free forever • Google Drive Cloud Vault • No credit card required"
}) => {
  return (
    <div className="relative inline-flex flex-col items-center select-none pt-12 pb-4">
      {/* Cartoon Girl Illustration Positioned Above & Reaching to Click */}
      <div 
        onClick={onClick}
        className="relative cursor-pointer group transition-transform duration-300 hover:scale-105"
        title="Click to Get Started!"
      >
        {/* Floating Speech Bubble */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-lg shadow-purple-500/30 flex items-center gap-1.5 animate-bounce z-20">
          <span>✨</span>
          <span>Click here to get started!</span>
          <span>👉</span>
          {/* Speech bubble beak */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-500 rotate-45" />
        </div>

        {/* Animated Cartoon Girl SVG Character */}
        <div className="w-36 h-36 sm:w-44 sm:h-44 relative mx-auto filter drop-shadow-xl animate-float">
          <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
            <defs>
              {/* Hair Gradient */}
              <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="50%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#C084FC" />
              </linearGradient>
              {/* Skin Gradient */}
              <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFE0BD" />
                <stop offset="100%" stopColor="#FCD5B5" />
              </linearGradient>
              {/* Jacket Gradient */}
              <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
              {/* Glow Filter */}
              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Anime Sparkles */}
            <circle cx="35" cy="40" r="3" fill="#FDE047" className="animate-ping opacity-75" />
            <circle cx="165" cy="50" r="2.5" fill="#F472B6" className="animate-ping opacity-75" />
            <polygon points="170,30 173,38 181,41 173,44 170,52 167,44 159,41 167,38" fill="#FDE047" className="animate-pulse" />
            <polygon points="30,80 32,85 37,87 32,89 30,94 28,89 23,87 28,85" fill="#67E8F9" className="animate-pulse" />

            {/* Back Hair Tufts */}
            <path d="M 50 100 C 35 120, 30 150, 45 180 C 60 170, 65 140, 65 110 Z" fill="url(#hairGrad)" />
            <path d="M 150 100 C 165 120, 170 150, 155 180 C 140 170, 135 140, 135 110 Z" fill="url(#hairGrad)" />

            {/* Torso & Cute Hoodie Jacket */}
            <path d="M 68 140 C 68 130, 85 125, 100 125 C 115 125, 132 130, 132 140 L 140 190 C 140 195, 60 195, 60 190 Z" fill="url(#jacketGrad)" />
            {/* White Hoodie Collar / Shirt */}
            <path d="M 88 128 L 100 148 L 112 128 Z" fill="#FFFFFF" />

            {/* Neck */}
            <rect x="92" y="112" width="16" height="18" rx="6" fill="url(#skinGrad)" />

            {/* Head / Face */}
            <ellipse cx="100" cy="85" rx="36" ry="34" fill="url(#skinGrad)" />

            {/* Cute Anime Cheeks Blush */}
            <ellipse cx="78" cy="94" rx="7" ry="4" fill="#F472B6" opacity="0.6" />
            <ellipse cx="122" cy="94" rx="7" ry="4" fill="#F472B6" opacity="0.6" />

            {/* Big Expressive Anime Eyes with Blink Animation */}
            <g className="animate-blink">
              {/* Left Eye */}
              <ellipse cx="83" cy="84" rx="7.5" ry="10" fill="#1E1B4B" />
              <ellipse cx="83" cy="86" rx="6.5" ry="8" fill="#4338CA" />
              {/* Left Eye Highlights */}
              <circle cx="81" cy="81" r="3" fill="#FFFFFF" />
              <circle cx="85" cy="88" r="1.5" fill="#FFFFFF" />
              {/* Eyelash */}
              <path d="M 73 78 Q 83 72 91 78" stroke="#1E1B4B" strokeWidth="2.5" fill="none" strokeLinecap="round" />

              {/* Right Eye - Playful Winking or Open */}
              <ellipse cx="117" cy="84" rx="7.5" ry="10" fill="#1E1B4B" />
              <ellipse cx="117" cy="86" rx="6.5" ry="8" fill="#4338CA" />
              {/* Right Eye Highlights */}
              <circle cx="115" cy="81" r="3" fill="#FFFFFF" />
              <circle cx="119" cy="88" r="1.5" fill="#FFFFFF" />
              {/* Eyelash */}
              <path d="M 109 78 Q 117 72 127 78" stroke="#1E1B4B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </g>

            {/* Cute Little Smile */}
            <path d="M 94 96 Q 100 102 106 96" stroke="#991B1B" strokeWidth="2" fill="#FECDD3" strokeLinecap="round" />

            {/* Eyebrows */}
            <path d="M 75 72 Q 83 67 90 71" stroke="#3730A3" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 110 71 Q 117 67 125 72" stroke="#3730A3" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Hair Bangs & Front Curls */}
            <path d="M 64 80 C 60 55, 75 42, 100 42 C 125 42, 140 55, 136 80 C 130 65, 122 62, 114 74 C 108 62, 92 62, 86 74 C 78 62, 70 65, 64 80 Z" fill="url(#hairGrad)" />

            {/* Hair Accessories / Purple Bunny Hairclip */}
            <circle cx="128" cy="54" r="5" fill="#F472B6" />
            <circle cx="125" cy="46" r="3" fill="#F472B6" />
            <circle cx="131" cy="46" r="3" fill="#F472B6" />

            {/* Animated Pointing Arm & Clicking Hand Reaching Down to Click */}
            <g className="animate-clicking-hand origin-bottom">
              {/* Sleeve */}
              <path d="M 118 140 Q 128 160 120 178" stroke="url(#jacketGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
              {/* Wrist & Cute Hand */}
              <ellipse cx="120" cy="184" rx="7" ry="7" fill="url(#skinGrad)" />
              {/* Pointing Finger reaching straight down */}
              <path d="M 120 184 L 120 198" stroke="url(#skinGrad)" strokeWidth="5.5" strokeLinecap="round" />
              {/* Click Ripple Indicator */}
              <circle cx="120" cy="200" r="6" fill="none" stroke="#F43F5E" strokeWidth="2" className="animate-ping" />
            </g>

            {/* Left Hand Waving Cutest Hello */}
            <g className="animate-wave origin-top-left">
              <path d="M 72 142 Q 60 152 50 148" stroke="url(#jacketGrad)" strokeWidth="12" strokeLinecap="round" fill="none" />
              <circle cx="46" cy="146" r="6.5" fill="url(#skinGrad)" />
            </g>
          </svg>
        </div>
      </div>

      {/* The Get Started Button Target */}
      <div className="relative -mt-3 z-10 w-full max-w-sm sm:max-w-md px-2">
        <button
          onClick={onClick}
          className="w-full py-4 px-6 sm:px-8 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] text-white font-extrabold text-base sm:text-lg rounded-2xl shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 border border-indigo-400/40 flex items-center justify-center gap-3.5 transition-all group overflow-hidden"
        >
          {/* Shimmer sweep */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Official Google Icon */}
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>

          <span className="tracking-tight">{buttonText}</span>
          
          <span className="text-xl group-hover:translate-x-1.5 transition-transform duration-200">
            ➔
          </span>
        </button>

        <p className="text-center text-[11px] text-slate-400 mt-2.5">
          {subText}
        </p>
      </div>

      {/* Inlined CSS styles for the keyframe animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        @keyframes clickingHand {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(6px) scale(0.97); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-12deg); }
          75% { transform: rotate(8deg); }
        }
        @keyframes blink {
          0%, 92%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.08); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-clicking-hand {
          animation: clickingHand 1.2s ease-in-out infinite;
        }
        .animate-wave {
          animation: wave 2.2s ease-in-out infinite;
        }
        .animate-blink {
          transform-origin: center 84px;
          animation: blink 4s infinite;
        }
      `}</style>
    </div>
  );
};
