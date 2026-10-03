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
    // Initial peek after 2.5 seconds
    const timer = setTimeout(() => {
      setAutoPeek(true);
      setTimeout(() => setAutoPeek(false), 2400);
    }, 2500);

    // Recurring peek every 11 seconds
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
            ? 'w-48 sm:w-56 h-13 rounded-2xl bg-white border-2 border-[#0047BA] ring-4 ring-blue-100 px-3'
            : 'w-48 sm:w-56 h-13 rounded-2xl bg-white border-2 border-[#FFB800] ring-4 ring-amber-100 px-3'
          : isCard
          ? 'w-13 h-13 rounded-full bg-white border-2 border-[#0047BA] ring-2 ring-blue-500/20 p-0 justify-center hover:scale-105 animate-[pulse_4s_ease-in-out_infinite]'
          : 'w-13 h-13 rounded-full bg-white border-2 border-[#FFB800] ring-2 ring-amber-500/20 p-0 justify-center hover:scale-105 animate-[pulse_4s_ease-in-out_infinite]'
      } ${
        align === 'left' ? 'justify-start' : 'justify-end'
      }`}
    >
      {/* Shimmer sweep effect when expanded */}
      {expanded && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 animate-[shimmer_1.4s_infinite]" />
        </div>
      )}

      {/* LEFT-ALIGNED (CARD): Icon on Left, Text on Right */}
      {align === 'left' ? (
        <div className="flex items-center gap-2.5 w-full">
          {/* Round-to-Square Morphing Icon Badge */}
          <div
            className={`transition-all duration-500 flex items-center justify-center shrink-0 shadow-sm ${
              expanded
                ? 'w-9 h-9 rounded-xl bg-gradient-to-tr from-[#002C6C] via-[#0047BA] to-blue-500 text-white scale-105 rotate-3'
                : 'w-10 h-10 rounded-full bg-gradient-to-tr from-[#002C6C] via-[#0047BA] to-blue-500 text-white scale-100 rotate-0'
            }`}
          >
            {icon ? (
              icon
            ) : (
              <span className="text-base">💳</span>
            )}
          </div>

          {/* Text Details (Smooth reveal when expanded) */}
          <div
            className={`flex flex-col text-left z-10 transition-all duration-400 ease-out whitespace-nowrap overflow-hidden ${
              expanded
                ? 'opacity-100 translate-x-0 max-w-[150px]'
                : 'opacity-0 -translate-x-3 max-w-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[12.5px] font-extrabold text-[#0047BA] font-bengali leading-none">
                {label}
              </span>
              {badge && (
                <span className="text-[8px] font-mono font-bold bg-[#0047BA] text-white px-1.5 py-0.5 rounded-full uppercase shadow-xs">
                  {badge}
                </span>
              )}
            </div>
            {sublabel && (
              <span className="text-[9.5px] font-medium text-slate-500 mt-1 leading-none">
                {sublabel}
              </span>
            )}
          </div>
        </div>
      ) : (
        /* RIGHT-ALIGNED (OFFERS): Text on Left, Icon on Right */
        <div className="flex items-center justify-end gap-2.5 w-full">
          {/* Text Details (Smooth reveal when expanded) */}
          <div
            className={`flex flex-col text-right z-10 transition-all duration-400 ease-out whitespace-nowrap overflow-hidden ${
              expanded
                ? 'opacity-100 translate-x-0 max-w-[150px]'
                : 'opacity-0 translate-x-3 max-w-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-end gap-1.5">
              {badge && (
                <span className="text-[8px] font-mono font-bold bg-[#FFB800] text-slate-950 px-1.5 py-0.5 rounded-full uppercase shadow-xs">
                  {badge}
                </span>
              )}
              <span className="text-[12.5px] font-extrabold text-amber-700 font-bengali leading-none">
                {label}
              </span>
            </div>
            {sublabel && (
              <span className="text-[9.5px] font-medium text-slate-500 mt-1 leading-none">
                {sublabel}
              </span>
            )}
          </div>

          {/* Round-to-Square Morphing Icon Badge */}
          <div
            className={`transition-all duration-500 flex items-center justify-center shrink-0 shadow-sm ${
              expanded
                ? 'w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-[#FFB800] text-slate-950 scale-105 -rotate-3'
                : 'w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-[#FFB800] text-slate-950 scale-100 rotate-0'
            }`}
          >
            {icon ? (
              icon
            ) : (
              <span className="text-base">🎁</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
