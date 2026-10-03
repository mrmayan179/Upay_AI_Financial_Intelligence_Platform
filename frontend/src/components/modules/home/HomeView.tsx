import React, { useState, useEffect } from 'react';
import { UserProfile, Case } from '../../../types';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { DemoBadge, DemoWrapper } from '../../shared/DemoBadge';

interface HomeViewProps {
  onNavigateTab: (tab: 'home' | 'card' | 'report' | 'credit' | 'voice' | 'audit') => void;
  onOpenBalanceSheet: () => void;
  onOpenNotifications: () => void;
  profile?: UserProfile | null;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateTab,
  onOpenBalanceSheet,
  onOpenNotifications,
  profile
}) => {
  const { language, t } = useApp();
  const [clock, setClock] = useState<string>('11:00');
  const [balanceVisible, setBalanceVisible] = useState<boolean>(false);
  const [activeCases, setActiveCases] = useState<Case[]>([]);
  const [showWheelModal, setShowWheelModal] = useState<boolean>(false);
  const [showOfferModal, setShowOfferModal] = useState<boolean>(false);
  const [showChakaBadge, setShowChakaBadge] = useState<boolean>(true);

  // Live status bar clock
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

  // Fetch active cases for quick banner
  useEffect(() => {
    api.getActiveCases().then(cases => setActiveCases(cases)).catch(() => {});
  }, []);

  const toggleBalance = () => {
    setBalanceVisible(prev => !prev);
    if (!balanceVisible) {
      setTimeout(() => {
        setBalanceVisible(false);
      }, 4000);
    }
  };

  const displayName = profile?.display_name || 'NAKIB MD. ASHIK';
  const displayPhone = profile?.phone_masked || '01771449164';
  const balanceBDT = profile?.account_balance_bdt ?? 7.25;

  const isBn = language === 'bn';

  return (
    <div className="w-full flex flex-col bg-white text-slate-800 pb-28">
      {/* ================= 1. STATUS BAR ================= */}
      <div className="w-full bg-[#FFC820] px-4 pt-1.5 pb-1 flex justify-between items-center text-[12px] text-slate-900 select-none shrink-0 border-b border-amber-300/40">
        {/* Left: Clock & Telegram Notification Icon */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[12.5px] tracking-tight">{clock}</span>
          <svg className="w-3.5 h-3.5 text-sky-700 fill-current ml-0.5" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
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
            <path d="M2 20h2v-4H2v4zm4 0h2v-8H6v8zm4 0h2V8h-2v12zm4 0h2V4h-2v16z"/>
          </svg>
          <span className="text-[9.5px] font-bold">4G⁺</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 20h2v-4H2v4zm4 0h2v-8H6v8zm4 0h2V8h-2v12zm4 0h2V4h-2v16z"/>
          </svg>
          <div className="flex items-center gap-0.5 ml-0.5">
            <div className="border border-slate-900 rounded-[3px] w-5 h-2.5 p-[1px] flex items-center">
              <div className="h-full bg-slate-900 rounded-[1px] w-[31%]"></div>
            </div>
            <span className="text-[9.5px] font-bold ml-0.5">31</span>
          </div>
        </div>
      </div>

      {/* ================= 2. YELLOW BRAND HEADER ================= */}
      <header className="bg-[#FFC820] px-4 pt-2 pb-4 select-none shrink-0 shadow-xs">
        <div className="flex items-center justify-between">
          {/* User Profile Avatar & Upay Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-full bg-white p-1 shadow-sm flex items-center justify-center border-2 border-white shrink-0">
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

            {/* User Name and Phone Number */}
            <div>
              <h1 className="font-extrabold text-slate-950 text-[15px] leading-tight tracking-tight uppercase">
                {displayName}
              </h1>
              <p className="text-[12px] text-slate-800 font-mono font-medium mt-0.5 leading-none">
                {displayPhone}
              </p>
            </div>
          </div>

          {/* Right: ব্যালেন্স Capsule Toggle & Notification Bell */}
          <div className="flex items-center gap-2">
            <DemoWrapper tooltipText={isBn ? 'ব্যালেন্স দেখতে ক্লিক করুন (ডেমো)' : 'Click to toggle balance (Demo)'}>
              <button
                onClick={toggleBalance}
                onDoubleClick={onOpenBalanceSheet}
                title={isBn ? 'ক্লিক করে ব্যালেন্স দেখুন, বিস্তারিত দেখতে ডাবল ক্লিক করুন' : 'Click to view balance, double-click for breakdown'}
                className={`px-4 py-1.5 rounded-full text-white text-[12px] font-bold tracking-wide shadow-sm transition active:scale-95 flex items-center justify-center min-w-[80px] h-7 ${
                  balanceVisible ? 'bg-emerald-600' : 'bg-[#0047BA] hover:bg-[#002C6C]'
                }`}
              >
                <span>{balanceVisible ? `৳ ${balanceBDT.toFixed(2)}` : t('header.balance')}</span>
              </button>
            </DemoWrapper>

            <DemoWrapper tooltipText={isBn ? 'বিজ্ঞপ্তি সমূহ' : 'Notifications'}>
              <button
                onClick={onOpenNotifications}
                className="relative p-1 text-[#0047BA] hover:text-[#002C6C] transition"
                title={t('header.notifications')}
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"></span>
              </button>
            </DemoWrapper>
          </div>
        </div>
      </header>

      {/* ================= ACTIVE AI CASE BANNER (IF ANY) ================= */}
      {activeCases.length > 0 && (
        <DemoWrapper tooltipText={isBn ? 'সক্রিয় এআই কেস বিস্তারিত দেখুন' : 'View active AI case details'} className="w-full">
          <div
            onClick={() => onNavigateTab('report')}
            className="mx-4 mt-3 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md transition border border-blue-700/50 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0"></span>
              <div>
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>{isBn ? 'স্মার্ট অভিযোগ কেস ট্র্যাকিং' : 'Smart Case Tracking'}</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 rounded">{activeCases[0].status}</span>
                </div>
                <div className="text-xs font-semibold text-white mt-0.5 line-clamp-1">
                  {activeCases[0].case_title}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold bg-white/10 text-white px-2 py-1 rounded-lg hover:bg-white/20">
                {isBn ? `অগ্রগতি ${activeCases[0].progress_percent}% →` : `Progress ${activeCases[0].progress_percent}% →`}
              </span>
            </div>
          </div>
        </DemoWrapper>
      )}

      {/* ================= 3A. PRIMARY SERVICES 4-COLUMN GRID ================= */}
      <section className="px-3 pt-3.5 pb-2" aria-label="প্রধান সেবাসমূহ">
        <div className="grid grid-cols-4 gap-y-4 gap-x-1 text-center">
          {/* 1. Send Money */}
          <DemoWrapper tooltipText={isBn ? 'সেন্ড মানি (ডেমো)' : 'Send Money (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition" onClick={onOpenBalanceSheet}>
              <div className="w-12 h-12 rounded-xl bg-[#E8F1FC] border border-[#D0E2F9] flex items-center justify-center text-[#0047BA] shadow-xs">
                <div className="w-7 h-5 rounded border-2 border-[#0047BA] flex items-center justify-center font-bold text-[10px]">৳</div>
              </div>
              <span className="text-[11px] font-medium text-slate-800 mt-1 leading-tight">{t('service.send_money')}</span>
            </div>
          </DemoWrapper>

          {/* 2. Mobile Recharge */}
          <DemoWrapper tooltipText={isBn ? 'মোবাইল রিচার্জ (ডেমো)' : 'Mobile Recharge (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition" onClick={onOpenBalanceSheet}>
              <div className="w-12 h-12 rounded-xl bg-[#E8F1FC] border border-[#D0E2F9] flex items-center justify-center text-[#0047BA] shadow-xs">
                <div className="relative w-6 h-8 border-2 border-[#0047BA] rounded-md flex items-center justify-center">
                  <span className="text-[7.5px] font-bold">৳</span>
                  <div className="w-2 h-0.5 bg-[#0047BA] absolute bottom-0.5"></div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-800 mt-1 leading-tight">{t('service.mobile_recharge')}</span>
            </div>
          </DemoWrapper>

          {/* 3. Cash Out */}
          <DemoWrapper tooltipText={isBn ? 'ক্যাশ আউট (ডেমো)' : 'Cash Out (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition" onClick={onOpenBalanceSheet}>
              <div className="w-12 h-12 rounded-xl bg-[#E8F1FC] border border-[#D0E2F9] flex items-center justify-center text-[#0047BA] shadow-xs">
                <div className="relative flex items-center justify-center">
                  <div className="w-5 h-7 border-2 border-[#0047BA] rounded-sm bg-white"></div>
                  <div className="w-4 h-5 bg-amber-500 rounded-sm absolute -right-1.5 -bottom-0.5 border border-amber-600 shadow-xs"></div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-800 mt-1 leading-tight">{t('service.cash_out')}</span>
            </div>
          </DemoWrapper>

          {/* 4. Pay Bill */}
          <DemoWrapper tooltipText={isBn ? 'পে বিল (ডেমো)' : 'Pay Bill (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition" onClick={onOpenBalanceSheet}>
              <div className="w-12 h-12 rounded-xl bg-[#E8F1FC] border border-[#D0E2F9] flex items-center justify-center text-[#0047BA] shadow-xs">
                <div className="w-6 h-7 border-2 border-[#0047BA] rounded p-0.5 flex flex-col justify-between">
                  <div className="w-full h-0.5 bg-[#0047BA]"></div>
                  <div className="w-full h-0.5 bg-[#0047BA]"></div>
                  <div className="w-3/4 h-0.5 bg-[#0047BA]"></div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-800 mt-1 leading-tight">{t('service.pay_bill')}</span>
            </div>
          </DemoWrapper>

          {/* 5. Add Money */}
          <DemoWrapper tooltipText={isBn ? 'অ্যাড মানি (ডেমো)' : 'Add Money (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition" onClick={onOpenBalanceSheet}>
              <div className="w-12 h-12 rounded-xl bg-[#EAE8F8] border border-[#DDD8F4] flex items-center justify-center text-indigo-700 shadow-xs">
                <div className="w-6 h-5 bg-indigo-200 border-2 border-indigo-700 rounded flex items-center justify-center">
                  <span className="text-indigo-900 font-extrabold text-[11px] -mt-0.5">+</span>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-800 mt-1 leading-tight">{t('service.add_money')}</span>
            </div>
          </DemoWrapper>

          {/* 6. Savings */}
          <DemoWrapper tooltipText={isBn ? 'সেভিংস (ডেমো)' : 'Savings (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition" onClick={onOpenBalanceSheet}>
              <div className="w-12 h-12 rounded-xl bg-[#FFF5E5] border border-[#FFE4BA] flex items-center justify-center text-amber-700 shadow-xs">
                <div className="relative w-7 h-5 bg-amber-400 border border-amber-600 rounded flex items-center justify-center text-[9px] font-bold text-amber-950">
                  ৳
                  <div className="absolute -top-1 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-800 mt-1 leading-tight">{t('service.savings')}</span>
            </div>
          </DemoWrapper>

          {/* 7. Fund Transfer */}
          <DemoWrapper tooltipText={isBn ? 'ফান্ড ট্রান্সফার (ডেমো)' : 'Fund Transfer (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition" onClick={onOpenBalanceSheet}>
              <div className="w-12 h-12 rounded-xl bg-[#E8F8F5] border border-[#CCF0E8] flex items-center justify-center text-teal-700 shadow-xs">
                <div className="flex items-end gap-0.5">
                  <div className="w-3 h-5 border border-teal-700 rounded-xs"></div>
                  <div className="w-4 h-6 border-2 border-teal-700 rounded-t-sm flex flex-col justify-between p-0.5">
                    <div className="h-0.5 bg-teal-700"></div>
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-800 mt-1 leading-tight">{t('service.fund_transfer')}</span>
            </div>
          </DemoWrapper>

          {/* 8. Request Money */}
          <DemoWrapper tooltipText={isBn ? 'রিকোয়েস্ট মানি (ডেমো)' : 'Request Money (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition" onClick={onOpenBalanceSheet}>
              <div className="w-12 h-12 rounded-xl bg-[#EAF8FC] border border-[#CEF0F8] flex items-center justify-center text-cyan-700 shadow-xs">
                <div className="w-6 h-6 rounded-full bg-cyan-200 border-2 border-cyan-700 flex items-center justify-center font-bold text-cyan-900 text-xs">
                  ৳
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-800 mt-1 leading-tight">{t('service.request_money')}</span>
            </div>
          </DemoWrapper>

          {/* 9. Make Payment */}
          <DemoWrapper tooltipText={isBn ? 'মেক পেমেন্ট (ডেমো)' : 'Make Payment (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition" onClick={onOpenBalanceSheet}>
              <div className="w-12 h-12 rounded-xl bg-[#EBF5FB] border border-[#D4EBF7] flex items-center justify-center text-sky-700 shadow-xs">
                <svg className="w-6 h-6 text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                </svg>
              </div>
              <span className="text-[11px] font-medium text-slate-800 mt-1 leading-tight">{t('service.make_payment')}</span>
            </div>
          </DemoWrapper>

          {/* 10. Refer & Earn */}
          <DemoWrapper tooltipText={isBn ? 'রেফার ও আয় (ডেমো)' : 'Refer & Earn (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition" onClick={onOpenBalanceSheet}>
              <div className="w-12 h-12 rounded-xl bg-[#F6EEF8] border border-[#E9D6F0] flex items-center justify-center text-purple-700 shadow-xs">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-purple-300 border border-purple-700"></div>
                  <div className="w-3.5 h-5 bg-white border border-purple-700 rounded-sm -ml-1 flex items-center justify-center text-[7px] font-bold">
                    ৳
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-800 mt-1 leading-tight">{t('service.refer_earn')}</span>
            </div>
          </DemoWrapper>

          {/* 11. NPSB */}
          <DemoWrapper tooltipText={isBn ? 'ন্যাশনাল পেমেন্ট সুইচ বাংলাদেশ' : 'National Payment Switch BD'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition" onClick={onOpenBalanceSheet}>
              <div className="w-12 h-12 rounded-xl bg-[#FDF0ED] border border-[#F8D8CF] flex items-center justify-center text-rose-700 shadow-xs">
                <span className="font-extrabold italic text-[11px] tracking-tighter text-[#002A6A]">
                  =N<span className="text-rose-600">P</span>SB
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-800 mt-1 leading-tight">{t('service.npsb')}</span>
            </div>
          </DemoWrapper>

          {/* 12. AI Governance Audit */}
          <DemoWrapper tooltipText={isBn ? 'এআই ডিসিশন ও অডিট লগ দেখুন' : 'Inspect AI decision audit logs'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition" onClick={() => onNavigateTab('audit')}>
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 shadow-xs">
                <span className="text-sm">🛡️</span>
              </div>
              <span className="text-[11px] font-bold text-slate-900 mt-1 leading-tight">{t('service.ai_audit')}</span>
            </div>
          </DemoWrapper>
        </div>
      </section>

      {/* ================= 3B. GOZAYAAN PROMOTIONAL BANNER ================= */}
      <section className="px-4 py-2" aria-label="প্রমোশনাল ব্যানার">
        <DemoWrapper tooltipText={isBn ? 'GoZayaan ক্যাম্পেইন অফার (ডেমো)' : 'GoZayaan Campaign Offer (Demo)'} className="w-full">
          <div className="w-full rounded-2xl bg-gradient-to-r from-[#00A3E0] via-[#5AC8FA] to-[#FFCC00] p-3 text-slate-900 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="relative w-12 h-16 bg-white rounded-lg border-2 border-slate-900 shadow p-0.5 flex flex-col items-center justify-between shrink-0">
                  <div className="w-3 h-0.5 bg-slate-400 rounded-full"></div>
                  <div className="w-full h-8 bg-sky-600 rounded flex items-center justify-center text-white text-[7px] font-bold">
                    GoZayaan
                  </div>
                  <div className="w-2 h-2 rounded-full border border-slate-400"></div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-900 leading-tight">
                    {t('banner.destination')}
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="inline-block bg-[#002C6C] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  {t('banner.click_here')}
                </div>
                <div className="text-[9px] text-slate-900 font-medium">
                  {isBn ? 'উপায় থেকে GoZayaan-এ পেমেন্ট করলেই' : 'Pay via Upay on GoZayaan'}
                </div>

                <div className="flex items-center gap-1 justify-end pt-0.5">
                  <div className="bg-amber-300 border border-amber-400 text-slate-900 px-1.5 py-0.5 rounded text-center">
                    <div className="text-[7.5px] font-semibold">{isBn ? 'ফ্লাইট বুকিং' : 'Flights'}</div>
                    <div className="text-[13px] font-extrabold leading-none">১০%<span className="text-[7px]"> {isBn ? 'পর্যন্ত ছাড়*' : 'OFF*'}</span></div>
                  </div>
                  <div className="bg-amber-300 border border-amber-400 text-slate-900 px-1.5 py-0.5 rounded text-center">
                    <div className="text-[7.5px] font-semibold">{isBn ? 'হোটেল বুকিং' : 'Hotels'}</div>
                    <div className="text-[13px] font-extrabold leading-none">৬৫%<span className="text-[7px]"> {isBn ? 'পর্যন্ত ছাড়*' : 'OFF*'}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center items-center gap-1.5 mt-2">
              <span className="w-2.5 h-2 rounded-full bg-[#0047BA]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400/60"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400/60"></span>
            </div>
          </div>
        </DemoWrapper>
      </section>

      {/* ================= AI SUITE QUICK CARDS ================= */}
      <section className="px-4 py-2 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className={`text-sm font-bold text-slate-900 flex items-center gap-1.5 ${isBn ? 'font-bengali' : 'font-sans'}`}>
            <span className="w-2 h-2 rounded-full bg-[#0047BA]"></span>
            {t('ai.suite_title')}
          </h2>
          <span className="text-[10px] font-bold text-[#0047BA] uppercase">{t('ai.models_active')}</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Card Module Quick Access */}
          <DemoWrapper tooltipText={isBn ? 'ডুয়েল-কারেন্সি কার্ড ম্যানেজমেন্ট' : 'Dual-currency card engine'}>
            <div
              onClick={() => onNavigateTab('card')}
              className="p-3 bg-gradient-to-br from-indigo-900 to-blue-900 rounded-xl text-white cursor-pointer hover:shadow-md transition active:scale-98 flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-base">💳</span>
                  <DemoBadge label="USD/BDT" size="sm" pulse={false} />
                </div>
                <h3 className="font-bold text-xs mt-2 text-white">{t('ai.card_title')}</h3>
                <p className="text-[10px] text-blue-200 mt-0.5 leading-tight">
                  {t('ai.card_desc')}
                </p>
              </div>
              <div className="mt-3 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                {isBn ? 'কার্ড দেখুন →' : 'View Card →'}
              </div>
            </div>
          </DemoWrapper>

          {/* Report Module Quick Access */}
          <DemoWrapper tooltipText={isBn ? 'স্বয়ংক্রিয় এআই অভিযোগ ট্র্যাকিং' : 'Automated dispute resolution'}>
            <div
              onClick={() => onNavigateTab('report')}
              className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl text-white cursor-pointer hover:shadow-md transition active:scale-98 flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-base">📝</span>
                  <DemoBadge label="NLP AI" size="sm" pulse={false} />
                </div>
                <h3 className="font-bold text-xs mt-2 text-white">{t('ai.report_title')}</h3>
                <p className="text-[10px] text-slate-300 mt-0.5 leading-tight">
                  {t('ai.report_desc')}
                </p>
              </div>
              <div className="mt-3 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                {isBn ? 'রিপোর্ট লিখুন →' : 'File Report →'}
              </div>
            </div>
          </DemoWrapper>

          {/* Credit Module Quick Access */}
          <DemoWrapper tooltipText={isBn ? 'TreeSHAP ক্রেডিট স্কোর ও ব্যাংক রিভিও' : 'TreeSHAP credit score and bank review'}>
            <div
              onClick={() => onNavigateTab('credit')}
              className="p-3 bg-gradient-to-br from-amber-700 to-amber-900 rounded-xl text-white cursor-pointer hover:shadow-md transition active:scale-98 flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-base">📊</span>
                  <DemoBadge label="SHAP XAI" size="sm" pulse={false} />
                </div>
                <h3 className="font-bold text-xs mt-2 text-white">{t('ai.credit_title')}</h3>
                <p className="text-[10px] text-amber-200 mt-0.5 leading-tight">
                  {t('ai.credit_desc')}
                </p>
              </div>
              <div className="mt-3 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                {isBn ? 'স্কোর দেখুন →' : 'Check Score →'}
              </div>
            </div>
          </DemoWrapper>

          {/* Voice AI Quick Access */}
          <DemoWrapper tooltipText={isBn ? '২৪/৭ ইন্টারেক্টিভ ভয়েস এজেন্ট' : '24/7 interactive voice agent'}>
            <div
              onClick={() => onNavigateTab('voice')}
              className="p-3 bg-gradient-to-br from-teal-800 to-cyan-950 rounded-xl text-white cursor-pointer hover:shadow-md transition active:scale-98 flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-base">🎙️</span>
                  <DemoBadge label="Voice AI" size="sm" pulse={false} />
                </div>
                <h3 className="font-bold text-xs mt-2 text-white">{t('ai.voice_title')}</h3>
                <p className="text-[10px] text-teal-200 mt-0.5 leading-tight">
                  {t('ai.voice_desc')}
                </p>
              </div>
              <div className="mt-3 text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                {isBn ? 'কল শুরু করুন →' : 'Start Call →'}
              </div>
            </div>
          </DemoWrapper>
        </div>
      </section>

      {/* ================= 3C. 'উপায় পেমেন্ট' (UPAY PAYMENT) SERVICES ================= */}
      <section className="px-4 pt-3 pb-2 select-none" aria-label="উপায় পেমেন্ট">
        <h2 className={`text-sm font-bold text-[#0047BA] mb-3 ${isBn ? 'font-bengali' : 'font-sans'}`}>
          {t('payment.section_title')}
        </h2>

        <div className="grid grid-cols-4 gap-y-4 gap-x-1 text-center">
          <DemoWrapper tooltipText={isBn ? 'ট্রাফিক ফাইন পরিশোধ (ডেমো)' : 'Traffic Fine (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-700">
                <div className="w-5 h-7 bg-emerald-100 border border-emerald-500 rounded p-0.5 flex flex-col justify-between items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                </div>
              </div>
              <span className="text-[10.5px] font-medium text-slate-800 mt-1 leading-tight">{t('payment.traffic')}</span>
            </div>
          </DemoWrapper>

          <DemoWrapper tooltipText={isBn ? 'টোল ফি পরিশোধ (ডেমো)' : 'Toll Payment (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-700">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-1 bg-amber-500 rounded-full mb-1"></div>
                  <div className="w-4 h-4 bg-sky-200 border border-sky-500 rounded-xs flex items-center justify-center text-[7px] font-bold">
                    TOLL
                  </div>
                </div>
              </div>
              <span className="text-[10.5px] font-medium text-slate-800 mt-1 leading-tight">{t('payment.toll')}</span>
            </div>
          </DemoWrapper>

          <DemoWrapper tooltipText={isBn ? 'সরকারি ফি পরিশোধ (ডেমো)' : 'Govt. Payment (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-700">
                <div className="w-7 h-7 rounded-full border-2 border-red-500 bg-emerald-50 p-0.5 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center text-[6px] text-white font-bold">
                    ★
                  </div>
                </div>
              </div>
              <span className="text-[10.5px] font-medium text-slate-800 mt-1 leading-tight">{t('payment.govt')}</span>
            </div>
          </DemoWrapper>

          <DemoWrapper tooltipText={isBn ? 'শিক্ষা ফি প্রদান (ডেমো)' : 'Education Fee (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-700">
                <div className="flex flex-col items-center">
                  <span className="text-xs -mb-1">🎓</span>
                  <div className="w-6 h-3.5 bg-rose-100 border border-rose-400 rounded-xs flex items-center justify-center text-[6px] font-bold">
                    BOOK
                  </div>
                </div>
              </div>
              <span className="text-[10.5px] font-medium text-slate-800 mt-1 leading-tight">{t('payment.education')}</span>
            </div>
          </DemoWrapper>

          <DemoWrapper tooltipText={isBn ? 'এনজিও কিস্তি ও ফি (ডেমো)' : 'NGO payments (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-700">
                <div className="w-6 h-6 rounded bg-sky-100 border border-sky-500 flex items-center justify-center text-[8px] font-bold text-sky-800">
                  NGO
                </div>
              </div>
              <span className="text-[10.5px] font-medium text-slate-800 mt-1 leading-tight">{t('payment.ngo')}</span>
            </div>
          </DemoWrapper>

          <DemoWrapper tooltipText={isBn ? 'বীমা প্রিমিয়াম (ডেমো)' : 'Insurance Premium (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-700">
                <div className="w-6 h-7 rounded-t-sm rounded-b-xl bg-teal-100 border-2 border-teal-500 flex items-center justify-center text-teal-800 text-xs">
                  🛡️
                </div>
              </div>
              <span className="text-[10.5px] font-medium text-slate-800 mt-1 leading-tight">{t('payment.insurance')}</span>
            </div>
          </DemoWrapper>

          <DemoWrapper tooltipText={isBn ? 'দান ও অনুদান (ডেমো)' : 'Donation (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-700">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] -mb-1">🤲</span>
                  <div className="w-6 h-3 bg-amber-100 border border-amber-400 rounded-xs"></div>
                </div>
              </div>
              <span className="text-[10.5px] font-medium text-slate-800 mt-1 leading-tight">{t('payment.donation')}</span>
            </div>
          </DemoWrapper>

          <DemoWrapper tooltipText={isBn ? 'যাকাত হিসাব ও প্রদান (ডেমো)' : 'Zakat Calculator & Pay (Demo)'}>
            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-700">
                <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-500 flex items-center justify-center text-emerald-800 text-xs">
                  🕌
                </div>
              </div>
              <span className="text-[10.5px] font-medium text-slate-800 mt-1 leading-tight">{t('payment.zakat')}</span>
            </div>
          </DemoWrapper>
        </div>
      </section>

      {/* ================= 3D. FLOATING 'উপায় চাকা' (SPINNING WHEEL BADGE) ================= */}
      {showChakaBadge && (
        <DemoWrapper tooltipText={isBn ? 'উপায় চাকা ঘুরিয়ে পুরস্কার জিতুন!' : 'Spin Upay Chaka for cashback!'}>
          <div
            onClick={() => setShowWheelModal(true)}
            className="fixed md:absolute right-4 bottom-24 z-30 pointer-events-auto cursor-pointer"
            title={t('chaka.title')}
          >
            <div className="relative w-12 h-12 flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChakaBadge(false);
                }}
                className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] flex items-center justify-center font-bold z-20 border border-white hover:bg-slate-700"
              >
                ×
              </button>
              <div className="w-full h-full rounded-full border-2 border-white shadow-xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 animate-[spin_12s_linear_infinite] flex items-center justify-center p-0.5">
                <div className="w-full h-full rounded-full border-2 border-dashed border-[#0047BA] flex items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#0047BA] border border-white"></div>
                </div>
              </div>
            </div>
          </div>
        </DemoWrapper>
      )}

      {/* ================= 4. FLOATING ACTION PILLS ================= */}
      <div className="fixed md:absolute bottom-[68px] inset-x-0 px-4 flex justify-between gap-3 z-30 pointer-events-none">
        <DemoWrapper tooltipText={isBn ? 'উপায় স্মার্ট কার্ড ড্যাশবোর্ড' : 'Upay Smart Card Dashboard'} className="flex-1 pointer-events-auto">
          <div
            onClick={() => onNavigateTab('card')}
            className="py-2 px-3 rounded-full bg-[#FFF6D1] border border-amber-300 shadow-md flex items-center justify-between cursor-pointer active:scale-95 transition"
          >
            <span className={`text-[12px] font-bold text-slate-900 ml-1 ${isBn ? 'font-bengali' : 'font-sans'}`}>
              {t('pill.card')}
            </span>
            <div className="w-8 h-5 rounded bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-500 p-0.5 flex flex-col justify-between shadow-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-300"></div>
              <div className="w-4 h-0.5 bg-white/80"></div>
            </div>
          </div>
        </DemoWrapper>

        <DemoWrapper tooltipText={isBn ? 'বিশেষ ক্যাশব্যাক অফারসমূহ' : 'Special Cashback Offers'} className="flex-1 pointer-events-auto">
          <div
            onClick={() => setShowOfferModal(true)}
            className="py-2 px-3 rounded-full bg-[#FFF6D1] border border-amber-300 shadow-md flex items-center justify-between cursor-pointer active:scale-95 transition"
          >
            <div className="w-6 h-6 rounded-md bg-[#0047BA] text-white flex items-center justify-center text-[11px] shadow-xs">
              🎁
            </div>
            <span className={`text-[12px] font-bold text-slate-900 mr-1 ${isBn ? 'font-bengali' : 'font-sans'}`}>
              {t('pill.offer')}
            </span>
          </div>
        </DemoWrapper>
      </div>

      {/* ================= MODAL: উপায় চাকা (LUCKY WHEEL) ================= */}
      {showWheelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border-4 border-amber-300">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-400 p-2 animate-[spin_8s_linear_infinite] border-4 border-white shadow-lg flex items-center justify-center">
              <div className="w-full h-full rounded-full border-2 border-dashed border-[#0047BA] flex items-center justify-center">
                <span className="text-xl">🎁</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <h3 className={`text-lg font-black text-slate-900 ${isBn ? 'font-bengali' : 'font-sans'}`}>
                  {t('chaka.title')}
                </h3>
                <DemoBadge label="SIMULATION" size="sm" />
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {t('chaka.spin_msg')}
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-bold">
              {isBn ? 'অভিনন্দন! আপনার জন্য আজকের স্পিন সক্রিয় রয়েছে।' : 'Congratulations! Your daily spin is unlocked.'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  alert(isBn ? '🎉 অভিনন্দন! আপনি ৳২৫ ক্যাশ রিওয়ার্ড জিতেছেন!' : '🎉 Congratulations! You won BDT 25 cash reward!');
                  setShowWheelModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#0047BA] text-white font-bold text-xs hover:bg-[#002C6C] transition shadow-md active:scale-95"
              >
                {t('chaka.btn_spin')}
              </button>
              <button
                onClick={() => setShowWheelModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                {isBn ? 'বন্ধ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: উপায় অফার (OFFERS) ================= */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className={`text-base font-bold text-slate-900 flex items-center gap-2 ${isBn ? 'font-bengali' : 'font-sans'}`}>
                <span>🎁</span> {t('pill.offer')}
              </h3>
              <button
                onClick={() => setShowOfferModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="font-bold text-amber-900">GoZayaan Hotels</div>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {isBn ? 'উপায় পেমেন্টে ফ্ল্যাট ৬৫% পর্যন্ত ছাড়।' : 'Flat up to 65% off via Upay payment.'}
                </p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="font-bold text-blue-900">Dual Currency Card Reward</div>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  {isBn ? 'আন্তর্জাতিক ট্রানজেকশনে ৩% ক্যাশব্যাক পয়েন্ট।' : '3% cashback on international USD usage.'}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="font-bold text-emerald-900">Mobile Recharge Cashback</div>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  {isBn ? '৫০ টাকা রিচার্জে ১০ টাকা ক্যাশব্যাক।' : 'BDT 10 cashback on BDT 50 recharge.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowOfferModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
            >
              {isBn ? 'ঠিক আছে' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
