import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface DemoBadgeProps {
  label?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({
  label,
  size = 'sm',
  pulse = true
}) => {
  const { language } = useApp();
  const text = label || (language === 'bn' ? 'ডেমো' : 'DEMO');

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-extrabold uppercase rounded-full shadow-xs select-none transition-all ${
        size === 'sm'
          ? 'px-1.5 py-0.5 text-[9px] leading-none'
          : 'px-2.5 py-1 text-[11px] leading-tight'
      } bg-amber-400 text-slate-950 border border-amber-500 hover:bg-amber-300 cursor-help`}
      title={
        language === 'bn'
          ? 'ডেমো ফিচার: হ্যাকথন সিমুলেশন ডাটা — নিরাপদ এনভায়রনমেন্ট'
          : 'DEMO FEATURE: Hackathon Simulation Data — Safe Environment'
      }
    >
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-ping"></span>}
      <span>{text}</span>
    </span>
  );
};

interface DemoWrapperProps {
  children: React.ReactNode;
  tooltipText?: string;
  className?: string;
}

export const DemoWrapper: React.FC<DemoWrapperProps> = ({
  children,
  tooltipText,
  className = ''
}) => {
  const { language } = useApp();
  const [isHovered, setIsHovered] = useState(false);
  const [showMobileHint, setShowMobileHint] = useState(false);

  const defaultText =
    language === 'bn'
      ? '⚡ ডেমো ফিচার: হ্যাকথন সিমুলেশন'
      : '⚡ DEMO FEATURE: Hackathon Simulation';

  const tip = tooltipText || defaultText;

  const handleInteraction = () => {
    setShowMobileHint(true);
    setTimeout(() => setShowMobileHint(false), 2200);
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleInteraction}
    >
      {children}

      {/* Floating Tooltip on Hover or Mobile Tap */}
      {(isHovered || showMobileHint) && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-90 duration-150">
          <div className="bg-slate-950 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg border border-amber-400/60 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <span>{tip}</span>
          </div>
          <div className="w-2 h-2 bg-slate-950 border-r border-b border-amber-400/60 rotate-45 mx-auto -mt-1"></div>
        </div>
      )}
    </div>
  );
};
