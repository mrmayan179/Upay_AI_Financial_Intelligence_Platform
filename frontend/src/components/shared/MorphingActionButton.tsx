import React, { useState, useEffect } from 'react';

interface MorphingActionButtonProps {
  icon?: React.ReactNode;
  label: string;
  sublabel?: string;
  badge?: string;
  onClick: () => void;
  variant?: 'card' | 'offer';
  align?: 'left' | 'right';
  title?: string;
}

export const MorphingActionButton: React.FC<MorphingActionButtonProps> = ({
  icon,
  label,
  sublabel,
  badge,
  onClick,
  variant = 'card',
  align = 'left',
  title
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [autoPeek, setAutoPeek] = useState(false);

  // Periodic subtle auto-peek animation so user discovers the morphing animation without touching
  useEffect(() => {
    const timer = setTimeout(() => {
      setAutoPeek(true);
      setTimeout(() => setAutoPeek(false), 2400);
    }, 2800);

    const interval = setInterval(() => {
      setAutoPeek(true);
      setTimeout(() => setAutoPeek(false), 2400);
    }, 11000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const expanded = isHovered || isTouched || autoPeek;
  const isCard = variant === 'card';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => {
        setIsTouched(true);
        setTimeout(() => setIsTouched(false), 3200);
      }}
      title={title || label}
      className={`group pointer-events-auto relative cursor-pointer select-none transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) flex items-center overflow-hidden active:scale-95 shadow-lg hover:shadow-2xl ${
        expanded
          ? isCard
            ? 'w-[174px] sm:w-[188px] h-13 rounded-2xl bg-gradient-to-r from-[#002661] via-[#0047BA] to-[#085BD9] text-white border-2 border-amber-300 ring-4 ring-blue-500/25 px-2.5'
            : 'w-[174px] sm:w-[188px] h-13 rounded-2xl bg-gradient-to-r from-[#FFB800] via-[#FFC820] to-amber-400 text-slate-950 border-2 border-[#0047BA] ring-4 ring-amber-500/25 px-2.5'
          : isCard
          ? 'w-13 h-13 rounded-full bg-gradient-to-tr from-[#002661] via-[#0047BA] to-[#085BD9] text-white border-2 border-white ring-2 ring-blue-500/40 p-0 justify-center hover:scale-105 animate-[pulse_4s_ease-in-out_infinite]'
          : 'w-13 h-13 rounded-full bg-gradient-to-tr from-[#FFB800] via-[#FFC820] to-amber-400 text-slate-950 border-2 border-white ring-2 ring-amber-500/40 p-0 justify-center hover:scale-105 animate-[pulse_4s_ease-in-out_infinite]'
      } ${
        align === 'left' ? 'justify-start' : 'justify-end'
      }`}
    >
      {/* Shimmer sweep effect when expanded */}
      {expanded && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-[shimmer_1.4s_infinite]" />
        </div>
      )}

      {/* LEFT-ALIGNED (CARD): Icon on Left, Text on Right */}
      {align === 'left' ? (
        <div className="flex items-center gap-2 w-full">
          {/* Morphing Icon Badge */}
          <div
            className={`transition-all duration-500 flex items-center justify-center shrink-0 shadow-xs ${
              expanded
                ? 'w-9 h-9 rounded-xl bg-white/20 border border-white/40 text-white scale-105 rotate-3'
                : 'w-10 h-10 rounded-full text-white scale-100 rotate-0'
            }`}
          >
            {icon ? icon : <span className="text-base">💳</span>}
          </div>

          {/* Text Details (Revealed with zero excess white gap) */}
          <div
            className={`flex flex-col text-left z-10 transition-all duration-400 ease-out whitespace-nowrap overflow-hidden ${
              expanded
                ? 'opacity-100 translate-x-0 max-w-[130px]'
                : 'opacity-0 -translate-x-3 max-w-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[12.5px] font-extrabold text-white font-bengali leading-none">
                {label}
              </span>
              {badge && (
                <span className="text-[8px] font-mono font-bold bg-[#FFC820] text-slate-950 px-1.5 py-0.5 rounded-full uppercase shadow-xs">
                  {badge}
                </span>
              )}
            </div>
            {sublabel && (
              <span className="text-[9.5px] font-medium text-blue-100 mt-0.5 leading-none">
                {sublabel}
              </span>
            )}
          </div>
        </div>
      ) : (
        /* RIGHT-ALIGNED (OFFERS): Text on Left, Icon on Right */
        <div className="flex items-center justify-end gap-2 w-full">
          {/* Text Details (Revealed with zero excess white gap) */}
          <div
            className={`flex flex-col text-right z-10 transition-all duration-400 ease-out whitespace-nowrap overflow-hidden ${
              expanded
                ? 'opacity-100 translate-x-0 max-w-[130px]'
                : 'opacity-0 translate-x-3 max-w-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-end gap-1.5">
              {badge && (
                <span className="text-[8px] font-mono font-bold bg-[#0047BA] text-white px-1.5 py-0.5 rounded-full uppercase shadow-xs">
                  {badge}
                </span>
              )}
              <span className="text-[12.5px] font-extrabold text-slate-950 font-bengali leading-none">
                {label}
              </span>
            </div>
            {sublabel && (
              <span className="text-[9.5px] font-medium text-slate-800 mt-0.5 leading-none">
                {sublabel}
              </span>
            )}
          </div>

          {/* Morphing Icon Badge */}
          <div
            className={`transition-all duration-500 flex items-center justify-center shrink-0 shadow-xs ${
              expanded
                ? 'w-9 h-9 rounded-xl bg-slate-950/15 border border-slate-950/25 text-slate-950 scale-105 -rotate-3'
                : 'w-10 h-10 rounded-full text-slate-950 scale-100 rotate-0'
            }`}
          >
            {icon ? icon : <span className="text-base">🎁</span>}
          </div>
        </div>
      )}
    </div>
  );
};
