import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserProfile } from '../../types';

interface UpayPageHeaderProps {
  moduleName?: string;
  moduleBadge?: string;
  profile?: UserProfile | null;
  onOpenBalanceSheet?: () => void;
  onOpenNotifications?: () => void;
  showStatusBar?: boolean;
}

export const UpayPageHeader: React.FC<UpayPageHeaderProps> = ({
  moduleName,
  moduleBadge,
  profile,
  onOpenBalanceSheet,
  onOpenNotifications,
  showStatusBar = true
}) => {
  const { language, t, viewMode } = useApp();
  const isBn = language === 'bn';
  const isDesktop = viewMode === 'desktop';

  const [clock, setClock] = useState<string>('11:00');
  const [balanceVisible, setBalanceVisible] = useState<boolean>(false);

  // Live status bar clock for mobile view
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = now.getHours().toString();
      const mins = now.getMinutes().toString().padStart(2, '0');
      setClock(`${hrs}:${mins}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleBalance = () => {
    setBalanceVisible(prev => !prev);
    if (!balanceVisible) {
      setTimeout(() => {
        setBalanceVisible(false);
      }, 5000);
    }
  };

  const displayName = profile?.display_name || 'TANVIR KABIR';
  const displayPhone = profile?.phone_masked || '01771449164';
  const balanceBDT = profile?.account_balance_bdt ?? 7.25;

  return (
    <div className="w-full shrink-0 select-none">
      {/* 1. Status Bar (Mobile Smartphone Mockup Only) */}
      {!isDesktop && showStatusBar && (
        <div className="w-full bg-[#FFC820] px-4 pt-1.5 pb-1 flex justify-between items-center text-[12px] text-slate-900 border-b border-amber-300/40">
          {/* Left: Clock & Telegram Notification Icon */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[12.5px] tracking-tight">{clock}</span>
            <svg className="w-3.5 h-3.5 text-sky-700 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
            </svg>
          </div>

          {/* Right: Network Speed, Cellular 4G, 4G+, Battery Indicator */}
          <div className="flex items-center gap-1 text-[11px] font-mono tracking-tighter">
            <div className="flex flex-col text-[7.5px] leading-[8px] text-right font-sans font-bold pr-0.5">
              <span>20</span>
              <span>B/s</span>
            </div>
            <span className="text-[9.5px] font-bold">4G</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 20h2v-4H2v4zm4 0h2v-8H6v8zm4 0h2V8h-2v12zm4 0h2V4h-2v16z" />
            </svg>
            <span className="text-[9.5px] font-bold">4G⁺</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 20h2v-4H2v4zm4 0h2v-8H6v8zm4 0h2V8h-2v12zm4 0h2V4h-2v16z" />
            </svg>
            {/* 31% Battery capsule */}
            <div className="flex items-center gap-0.5 ml-0.5">
              <div className="border border-slate-900 rounded-[3px] w-5 h-2.5 p-[1px] flex items-center">
                <div className="h-full bg-slate-900 rounded-[1px] w-[31%]"></div>
              </div>
              <span className="text-[9.5px] font-bold ml-0.5">31</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Authentic Yellow Upay Brand Header */}
      <header className={`bg-[#FFC820] shadow-xs ${isDesktop ? 'px-6 py-4 md:px-8' : 'px-4 pt-2 pb-4'}`}>
        <div className="flex items-center justify-between">
          {/* User Profile Avatar & Upay Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white p-1 shadow-sm flex items-center justify-center border-2 border-white shrink-0">
              {/* Authentic Upay Logo figure meeting */}
              <div className="flex flex-col items-center scale-90">
                <div className="flex items-center gap-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFB800]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0047BA]"></div>
                </div>
                <div className="flex items-center gap-0.5 -mt-0.5">
                  <div className="w-2.5 h-4 rounded-t-full rounded-b-md bg-[#FFB800]"></div>
                  <div className="w-2.5 h-4 rounded-t-full rounded-b-md bg-[#0047BA]"></div>
                </div>
                <span className="text-[7.5px] font-extrabold text-black font-bengali -mt-0.5 tracking-tighter">উপায়</span>
              </div>
            </div>

            {/* User Name, Phone & Module Badges */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-extrabold text-slate-950 text-[15px] md:text-base leading-tight tracking-tight uppercase">
                  {displayName}
                </h1>
                {isDesktop && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    VERIFIED
                  </span>
                )}
                {moduleBadge && (
                  <span className="px-2 py-0.5 rounded-full bg-[#0047BA] text-white text-[9.5px] font-bold font-mono tracking-wider uppercase shadow-xs">
                    {moduleBadge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[12px] text-slate-800 font-mono font-medium leading-none">
                  {displayPhone}
                </p>
                {moduleName && (
                  <span className="text-[11px] font-semibold text-slate-900 border-l border-amber-400 pl-2 leading-none">
                    {moduleName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: ব্যালেন্স Capsule Toggle & Notification Bell */}
          <div className="flex items-center gap-2.5">
            {/* Balance Pill Button */}
            <button
              onClick={toggleBalance}
              onDoubleClick={onOpenBalanceSheet}
              title={isBn ? "ক্লিক করে ব্যালেন্স দেখুন, বিস্তারিত দেখতে ডাবল ক্লিক করুন" : "Click to view balance, double-click for breakdown"}
              className={`px-4 py-1.5 rounded-full text-white text-[12px] font-bold tracking-wide shadow-sm transition active:scale-95 flex items-center justify-center min-w-[85px] h-7.5 cursor-pointer ${
                balanceVisible ? 'bg-emerald-600' : 'bg-[#0047BA] hover:bg-[#002C6C]'
              }`}
            >
              <span>{balanceVisible ? `৳ ${balanceBDT.toFixed(2)}` : (isBn ? 'ব্যালেন্স' : 'Balance')}</span>
            </button>

            {/* Notification Bell with Red Badge */}
            <button
              onClick={onOpenNotifications}
              className="relative p-1 text-[#0047BA] hover:text-[#002C6C] transition cursor-pointer"
              title={isBn ? "বিজ্ঞপ্তি সমূহ" : "Notifications"}
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"></span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};
