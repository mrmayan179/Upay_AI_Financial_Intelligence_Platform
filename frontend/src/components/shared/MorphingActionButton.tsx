import React, { useState } from 'react';

interface MorphingActionButtonProps {
  icon: React.ReactNode;
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

  const isActive = isHovered || isTouched;

  const bgGradient =
    variant === 'card'
      ? 'from-[#002C6C] via-[#0047BA] to-indigo-900 border-amber-300 text-white'
      : 'from-amber-400 via-amber-500 to-yellow-400 border-white text-slate-950';

  const glowShadow =
    variant === 'card'
      ? 'shadow-[0_10px_30px_rgba(0,71,186,0.55)] hover:shadow-[0_12px_35px_rgba(0,71,186,0.7)]'
      : 'shadow-[0_10px_30px_rgba(245,158,11,0.55)] hover:shadow-[0_12px_35px_rgba(245,158,11,0.7)]';

  const isRight = align === 'right';

  return (
    <div
      className={`relative select-none pointer-events-auto transition-transform duration-300 ${
        isRight ? 'origin-right' : 'origin-left'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsTouched(true)}
      onTouchEnd={() => {
        // Keep active briefly on mobile touch before morphing back
        setTimeout(() => setIsTouched(false), 2200);
      }}
    >
      <button
        onClick={onClick}
        title={title || label}
        className={`group relative flex items-center border-2 backdrop-blur-md transition-all duration-300 ease-out cursor-pointer active:scale-95 ${bgGradient} ${glowShadow} ${
          isActive
            ? 'rounded-2xl px-3.5 py-2.5 min-w-[145px] md:min-w-[170px]'
            : 'rounded-full w-12 h-12 p-0 justify-center'
        } ${isRight ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Subtle Ambient Pulse Ring */}
        <span
          className={`absolute inset-0 rounded-inherit transition-opacity duration-300 pointer-events-none ${
            isActive ? 'opacity-35 animate-pulse' : 'opacity-0'
          } ${variant === 'card' ? 'bg-sky-400' : 'bg-amber-200'}`}
        />

        {/* Inner Content Layout */}
        <div
          className={`flex items-center gap-2.5 z-10 overflow-hidden ${
            isRight ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          {/* Icon with interactive scaling and angle */}
          <div
            className={`transition-all duration-300 shrink-0 flex items-center justify-center ${
              isActive ? 'scale-115 rotate-6' : 'scale-100 rotate-0'
            }`}
          >
            {icon}
          </div>

          {/* Morphing Animated Text Container */}
          <div
            className={`flex flex-col transition-all duration-300 ease-out overflow-hidden ${
              isRight ? 'text-right items-end' : 'text-left items-start'
            } ${
              isActive
                ? 'max-w-[140px] opacity-100 translate-x-0'
                : `max-w-0 opacity-0 ${isRight ? 'translate-x-2' : '-translate-x-2'}`
            }`}
          >
            <div className="flex items-center gap-1 leading-tight">
              <span className="font-extrabold text-xs whitespace-nowrap tracking-tight font-bengali">
                {label}
              </span>
              {badge && (
                <span className="text-[8px] font-mono font-bold bg-white/25 px-1 py-0.2 rounded uppercase">
                  {badge}
                </span>
              )}
            </div>
            {sublabel && (
              <span className="text-[9.5px] opacity-85 whitespace-nowrap leading-none mt-0.5 font-sans">
                {sublabel}
              </span>
            )}
          </div>
        </div>
      </button>
    </div>
  );
};
