import React, { useState } from 'react';

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
  title
}) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onTouchStart={() => setIsActive(true)}
      onTouchEnd={() => setTimeout(() => setIsActive(false), 2200)}
      title={title || label}
      className={`pointer-events-auto flex-1 py-2 px-3 rounded-2xl bg-white border-2 transition-all duration-300 cursor-pointer active:scale-95 flex items-center justify-between select-none shadow-sm hover:shadow-md ${
        isActive ? 'border-amber-400 shadow-md bg-amber-50/20' : 'border-amber-300/80'
      }`}
    >
      {variant === 'card' ? (
        <>
          {/* Left Text details */}
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[12.5px] font-extrabold text-slate-950 font-bengali leading-none">
                {label}
              </span>
              {badge && (
                <span className="text-[8px] font-mono font-bold bg-[#0047BA] text-white px-1.5 py-0.5 rounded-full uppercase">
                  {badge}
                </span>
              )}
            </div>
            {sublabel && (
              <span className="text-[9.5px] font-medium text-slate-500 mt-0.5 leading-none">
                {sublabel}
              </span>
            )}
          </div>

          {/* Morphing element: round -> square on hover/touch */}
          <div
            className={`w-9 h-9 transition-all duration-300 ease-out flex items-center justify-center text-white shadow-xs ${
              isActive
                ? 'rounded-xl scale-110 rotate-6 bg-gradient-to-r from-blue-700 via-sky-600 to-[#0047BA] ring-2 ring-amber-300'
                : 'rounded-full scale-100 rotate-0 bg-gradient-to-r from-blue-700 to-[#0047BA]'
            }`}
          >
            {icon || <span className="text-base">💳</span>}
          </div>
        </>
      ) : (
        <>
          {/* Morphing element: round -> square on hover/touch */}
          <div
            className={`w-9 h-9 transition-all duration-300 ease-out flex items-center justify-center text-slate-950 shadow-xs ${
              isActive
                ? 'rounded-xl scale-110 -rotate-6 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 ring-2 ring-[#0047BA]'
                : 'rounded-full scale-100 rotate-0 bg-gradient-to-r from-amber-400 to-yellow-400'
            }`}
          >
            {icon || <span className="text-base">🎁</span>}
          </div>

          {/* Right Text details */}
          <div className="flex flex-col text-right">
            <div className="flex items-center justify-end gap-1.5">
              {badge && (
                <span className="text-[8px] font-mono font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full uppercase">
                  {badge}
                </span>
              )}
              <span className="text-[12.5px] font-extrabold text-slate-950 font-bengali leading-none">
                {label}
              </span>
            </div>
            {sublabel && (
              <span className="text-[9.5px] font-medium text-slate-500 mt-0.5 leading-none">
                {sublabel}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
