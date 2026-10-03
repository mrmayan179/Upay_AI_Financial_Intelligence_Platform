import React, { useState, useEffect } from 'react';
import { UserProfile, Case } from '../../../types';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { DemoBadge, DemoWrapper } from '../../shared/DemoBadge';
import { MorphingActionButton } from '../../shared/MorphingActionButton';

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
  const { language, t, viewMode } = useApp();
  const isBn = language === 'bn';

  const [clock, setClock] = useState<string>('11:00');
  const [balanceVisible, setBalanceVisible] = useState<boolean>(true);
  const [activeCases, setActiveCases] = useState<Case[]>([]);
  const [showWheelModal, setShowWheelModal] = useState<boolean>(false);
  const [showOfferModal, setShowOfferModal] = useState<boolean>(false);
  const [showChakaBadge, setShowChakaBadge] = useState<boolean>(true);

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

  // Fetch active cases
  useEffect(() => {
    api.getActiveCases().then(cases => setActiveCases(cases)).catch(() => {});
  }, []);

  const toggleBalance = () => {
    setBalanceVisible(prev => !prev);
  };

  const displayName = profile?.display_name || 'NAKIB MD. ASHIK';
  const displayPhone = profile?.phone_masked || '01771449164';
  const balanceBDT = profile?.account_balance_bdt ?? 25450.00;
  const cashRewardBDT = profile?.cash_reward_bdt ?? 25.00;

  // =========================================================================
  // 1. DESKTOP FULL-SCREEN ADAPTIVE VIEW (Like Modern Fintech Portals)
  // =========================================================================
  if (viewMode === 'desktop') {
    return (
      <div className="w-full space-y-6 select-none">
        {/* Top Financial Hero Card */}
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
          {/* Subtle decorative circles */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
          <div className="absolute right-40 -bottom-20 w-60 h-60 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* User Greeting & Badges */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center border border-amber-300">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-0.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FFB800]"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0047BA]"></div>
                    </div>
                    <div className="flex items-center gap-0.5 -mt-0.5">
                      <div className="w-2.5 h-4 rounded-t-full rounded-b-md bg-[#FFB800]"></div>
                      <div className="w-2.5 h-4 rounded-t-full rounded-b-md bg-[#0047BA]"></div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-mono font-bold text-amber-300 tracking-wider">
                      {isBn ? 'স্বাগতম' : 'Welcome back'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                      VERIFIED ACCOUNT
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-0.5">
                    {displayName}
                  </h1>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    Account: {displayPhone} • Customer ID: SYN-U-10082
                  </p>
                </div>
              </div>
            </div>

            {/* Account Balance & Quick Actions */}
            <div className="flex flex-wrap items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div className="pr-4 border-r border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {t('header.balance')} (BDT)
                  </span>
                  <button
                    onClick={toggleBalance}
                    className="text-xs text-amber-300 hover:text-white transition"
                    title={balanceVisible ? 'ব্যালেন্স লুকান' : 'ব্যালেন্স দেখুন'}
                  >
                    {balanceVisible ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <div className="text-3xl font-black font-mono text-white mt-1">
                  {balanceVisible ? `৳ ${balanceBDT.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••••'}
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                  + ৳ {cashRewardBDT.toFixed(2)} Cash Reward Reserve
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={onOpenBalanceSheet}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>৳</span>
                  <span>{isBn ? 'ব্যালেন্স স্টেটমেন্ট' : 'Balance Breakdown'}</span>
                </button>
                <button
                  onClick={onOpenNotifications}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <span>🔔</span>
                  <span>{t('header.notifications')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-slate-400 block text-[11px]">Smart Card Quota</span>
              <span className="text-white font-bold font-mono text-sm mt-0.5 block">$3,820 / $5,000 USD</span>
              <span className="text-emerald-400 text-[10px]">Endorsed &amp; Active</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-slate-400 block text-[11px]">Dispute Resolution</span>
              <span className="text-white font-bold font-mono text-sm mt-0.5 block">1 Active Investigation</span>
              <span className="text-amber-300 text-[10px]">Escalated to Tier-1</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-slate-400 block text-[11px]">Credit Readiness Score</span>
              <span className="text-white font-bold font-mono text-sm mt-0.5 block">86 / 100 (Prime)</span>
              <span className="text-blue-400 text-[10px]">BDT 20K - 30K Eligible</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-slate-400 block text-[11px]">AI Voice Helpline</span>
              <span className="text-white font-bold font-mono text-sm mt-0.5 block">16247 Available</span>
              <span className="text-emerald-400 text-[10px]">24/7 Verified Sessions</span>
            </div>
          </div>
        </section>

        {/* 4 AI Core Suites (Desktop 4-Column Grid) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#FFB800]"></span>
              <span>{t('ai.suite_title')}</span>
            </h2>
            <DemoBadge label="3 ML MODELS ONLINE" size="md" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Suite 1: Smart Card */}
            <div
              onClick={() => onNavigateTab('card')}
              className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white cursor-pointer hover:shadow-xl hover:-translate-y-1 transition duration-200 border border-blue-800 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl p-2 rounded-xl bg-white/10">💳</span>
                  <DemoBadge label="USD/BDT" size="sm" pulse={false} />
                </div>
                <h3 className="font-extrabold text-base mt-4 text-white group-hover:text-amber-300 transition">
                  {t('ai.card_title')}
                </h3>
                <p className="text-xs text-blue-200 mt-1 leading-relaxed">
                  {t('ai.card_desc')}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-blue-800/80 text-xs font-bold text-amber-300 flex items-center justify-between">
                <span>{isBn ? 'কার্ড ম্যানেজমেন্ট' : 'Manage Card'}</span>
                <span>→</span>
              </div>
            </div>

            {/* Suite 2: Report & Case */}
            <div
              onClick={() => onNavigateTab('report')}
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white cursor-pointer hover:shadow-xl hover:-translate-y-1 transition duration-200 border border-slate-700 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl p-2 rounded-xl bg-white/10">📝</span>
                  <DemoBadge label="NLP AI" size="sm" pulse={false} />
                </div>
                <h3 className="font-extrabold text-base mt-4 text-white group-hover:text-emerald-300 transition">
                  {t('ai.report_title')}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {t('ai.report_desc')}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-700/80 text-xs font-bold text-emerald-400 flex items-center justify-between">
                <span>{isBn ? 'কেস ট্র্যাকিং' : 'Track Cases'}</span>
                <span>→</span>
              </div>
            </div>

            {/* Suite 3: Credit Readiness */}
            <div
              onClick={() => onNavigateTab('credit')}
              className="p-5 rounded-2xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 text-white cursor-pointer hover:shadow-xl hover:-translate-y-1 transition duration-200 border border-amber-600 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl p-2 rounded-xl bg-white/10">📊</span>
                  <DemoBadge label="TreeSHAP" size="sm" pulse={false} />
                </div>
                <h3 className="font-extrabold text-base mt-4 text-white group-hover:text-amber-200 transition">
                  {t('ai.credit_title')}
                </h3>
                <p className="text-xs text-amber-100 mt-1 leading-relaxed">
                  {t('ai.credit_desc')}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-amber-700/80 text-xs font-bold text-amber-300 flex items-center justify-between">
                <span>{isBn ? 'স্কোর ও ব্যাখ্যা' : 'Score & Factors'}</span>
                <span>→</span>
              </div>
            </div>

            {/* Suite 4: Voice AI Agent */}
            <div
              onClick={() => onNavigateTab('voice')}
              className="p-5 rounded-2xl bg-gradient-to-br from-teal-800 via-cyan-900 to-slate-950 text-white cursor-pointer hover:shadow-xl hover:-translate-y-1 transition duration-200 border border-teal-700 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl p-2 rounded-xl bg-white/10">🎙️</span>
                  <DemoBadge label="Voice AI" size="sm" pulse={false} />
                </div>
                <h3 className="font-extrabold text-base mt-4 text-white group-hover:text-cyan-300 transition">
                  {t('ai.voice_title')}
                </h3>
                <p className="text-xs text-teal-200 mt-1 leading-relaxed">
                  {t('ai.voice_desc')}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-teal-800/80 text-xs font-bold text-cyan-300 flex items-center justify-between">
                <span>{isBn ? 'ভয়েস সেশন' : 'Start Session'}</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </section>

        {/* GoZayaan Travel Banner (Desktop Widescreen) */}
        <section className="w-full rounded-3xl bg-gradient-to-r from-[#00A3E0] via-[#5AC8FA] to-[#FFCC00] p-6 text-slate-900 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl border-2 border-slate-900 shadow-lg p-1.5 flex flex-col items-center justify-center shrink-0">
              <span className="font-black text-sky-700 text-xs">GoZayaan</span>
              <span className="text-xl">✈️</span>
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
                PARTNER CAMPAIGN
              </span>
              <h3 className="text-lg md:text-xl font-black text-slate-950 mt-1">
                {t('banner.destination')}
              </h3>
              <p className="text-xs text-slate-800 mt-0.5 font-medium">
                {isBn ? 'উপায় দিয়ে GoZayaan-এ পেমেন্ট করলেই দেশ-বিদেশের ফ্লাইট ও হোটেলে বিশাল ছাড়!' : 'Pay with Upay on GoZayaan for massive savings on flights and hotels worldwide!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-amber-300 border border-amber-400 text-slate-900 px-3 py-2 rounded-xl text-center shadow-xs">
              <div className="text-[10px] font-bold">{isBn ? 'ফ্লাইট বুকিং' : 'Flights'}</div>
              <div className="text-lg font-black leading-none">১০%<span className="text-xs"> OFF</span></div>
            </div>
            <div className="bg-amber-300 border border-amber-400 text-slate-900 px-3 py-2 rounded-xl text-center shadow-xs">
              <div className="text-[10px] font-bold">{isBn ? 'হোটেল বুকিং' : 'Hotels'}</div>
              <div className="text-lg font-black leading-none">৬৫%<span className="text-xs"> OFF</span></div>
            </div>
            <button
              onClick={() => setShowOfferModal(true)}
              className="px-5 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs transition shadow-lg active:scale-95"
            >
              {t('banner.click_here')}
            </button>
          </div>
        </section>

        {/* MFS Services & Bill Payment (Desktop Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Box 1: Core MFS Services */}
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>{isBn ? 'উপায় মোবাইল ফিন্যান্সিয়াল সার্ভিসেস' : 'Upay Financial Services'}</span>
              </h3>
              <DemoBadge label="DEMO GRID" size="sm" pulse={false} />
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { label: t('service.send_money'), icon: '৳', bg: 'bg-blue-950/80 text-blue-400 border-blue-800/40' },
                { label: t('service.mobile_recharge'), icon: '📱', bg: 'bg-sky-950/80 text-sky-400 border-sky-800/40' },
                { label: t('service.cash_out'), icon: '🏧', bg: 'bg-amber-950/80 text-amber-400 border-amber-800/40' },
                { label: t('service.pay_bill'), icon: '🧾', bg: 'bg-indigo-950/80 text-indigo-400 border-indigo-800/40' },
                { label: t('service.add_money'), icon: '➕', bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40' },
                { label: t('service.savings'), icon: '💰', bg: 'bg-yellow-950/80 text-yellow-400 border-yellow-800/40' },
                { label: t('service.fund_transfer'), icon: '🔄', bg: 'bg-teal-950/80 text-teal-400 border-teal-800/40' },
                { label: t('service.request_money'), icon: '📩', bg: 'bg-rose-950/80 text-rose-400 border-rose-800/40' },
              ].map((s, idx) => (
                <DemoWrapper key={idx} tooltipText={`${s.label} (${isBn ? 'সিমুলেশন' : 'Demo'})`}>
                  <div
                    onClick={onOpenBalanceSheet}
                    className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 hover:border-amber-400/80 hover:bg-slate-800 transition cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95 group"
                  >
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center font-bold text-base shadow-xs ${s.bg}`}>
                      {s.icon}
                    </div>
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-white mt-1 line-clamp-1">
                      {s.label}
                    </span>
                  </div>
                </DemoWrapper>
              ))}
            </div>
          </div>

          {/* Box 2: Institutional & Utility Payments */}
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-[#5AC8FA] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5AC8FA]"></span>
                <span>{t('payment.section_title')}</span>
              </h3>
              <DemoBadge label="PAYMENT RAILS" size="sm" pulse={false} />
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { label: t('payment.traffic'), icon: '🚦', bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40' },
                { label: t('payment.toll'), icon: '🛣️', bg: 'bg-sky-950/80 text-sky-400 border-sky-800/40' },
                { label: t('payment.govt'), icon: '🏛️', bg: 'bg-red-950/80 text-red-400 border-red-800/40' },
                { label: t('payment.education'), icon: '🎓', bg: 'bg-rose-950/80 text-rose-400 border-rose-800/40' },
                { label: t('payment.ngo'), icon: '🤝', bg: 'bg-indigo-950/80 text-indigo-400 border-indigo-800/40' },
                { label: t('payment.insurance'), icon: '🛡️', bg: 'bg-teal-950/80 text-teal-400 border-teal-800/40' },
                { label: t('payment.donation'), icon: '🤲', bg: 'bg-amber-950/80 text-amber-400 border-amber-800/40' },
                { label: t('payment.zakat'), icon: '🕌', bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40' },
              ].map((p, idx) => (
                <DemoWrapper key={idx} tooltipText={`${p.label} (${isBn ? 'সিমুলেশন' : 'Demo'})`}>
                  <div
                    onClick={onOpenBalanceSheet}
                    className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 hover:border-[#5AC8FA]/80 hover:bg-slate-800 transition cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95 group"
                  >
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-base shadow-xs ${p.bg}`}>
                      {p.icon}
                    </div>
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-white mt-1 line-clamp-1">
                      {p.label}
                    </span>
                  </div>
                </DemoWrapper>
              ))}
            </div>
          </div>
        </div>

        {/* 2 MORPHING ACTION BUTTONS (DESKTOP DOCK) */}
        <div className="fixed bottom-6 left-6 z-40 flex items-center gap-3 pointer-events-none">
          {/* Morphing Button 1: Upay Smart Card */}
          <MorphingActionButton
            variant="card"
            align="left"
            icon={<span className="text-xl">💳</span>}
            label={t('pill.card')}
            sublabel={isBn ? 'ডুয়েল কারেন্সি ড্যাশবোর্ড' : 'Dual-Currency Controls'}
            badge="AI"
            onClick={() => onNavigateTab('card')}
            title="উপায় স্মার্ট কার্ড ড্যাশবোর্ড"
          />

          {/* Morphing Button 2: Upay Offers */}
          <MorphingActionButton
            variant="offer"
            align="left"
            icon={<span className="text-xl">🎁</span>}
            label={t('pill.offer')}
            sublabel={isBn ? 'বিশেষ ক্যাশব্যাক ডিলস' : 'Exclusive Cashbacks'}
            badge="65% OFF"
            onClick={() => setShowOfferModal(true)}
            title="উপায় বিশেষ অফার"
          />
        </div>

        {/* Floating Upay Chaka */}
        {showChakaBadge && (
          <div
            onClick={() => setShowWheelModal(true)}
            className="fixed right-6 bottom-24 z-30 pointer-events-auto cursor-pointer"
            title={t('chaka.title')}
          >
            <div className="relative w-14 h-14 flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChakaBadge(false);
                }}
                className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold z-20 border border-white hover:bg-slate-700"
              >
                ×
              </button>
              <div className="w-full h-full rounded-full border-2 border-white shadow-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 animate-[spin_12s_linear_infinite] flex items-center justify-center p-0.5">
                <div className="w-full h-full rounded-full border-2 border-dashed border-[#0047BA] flex items-center justify-center">
                  <span className="text-base">🎁</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lucky Wheel Modal */}
        {showWheelModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border-4 border-amber-300">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-400 p-2 animate-[spin_8s_linear_infinite] border-4 border-white shadow-lg flex items-center justify-center">
                <div className="w-full h-full rounded-full border-2 border-dashed border-[#0047BA] flex items-center justify-center">
                  <span className="text-xl">🎁</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{t('chaka.title')}</h3>
                <p className="text-xs text-slate-600 mt-1">{t('chaka.spin_msg')}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    alert(isBn ? '🎉 অভিনন্দন! আপনি ৳২৫ ক্যাশ রিওয়ার্ড জিতেছেন!' : '🎉 Congratulations! You won BDT 25 cash reward!');
                    setShowWheelModal(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#0047BA] text-white font-bold text-xs hover:bg-[#002C6C] transition shadow-md"
                >
                  {t('chaka.btn_spin')}
                </button>
                <button
                  onClick={() => setShowWheelModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  {isBn ? 'বন্ধ' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Offers Modal */}
        {showOfferModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>🎁</span> {t('pill.offer')}
                </h3>
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="font-bold text-amber-900">GoZayaan Hotels &amp; Flights</div>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    {isBn ? 'উপায় পেমেন্টে ফ্ল্যাট ৬৫% পর্যন্ত ছাড়।' : 'Up to 65% off hotels & 10% off flights via Upay.'}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="font-bold text-blue-900">Dual Currency Card Cashback</div>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    {isBn ? 'আন্তর্জাতিক USD লেনদেনে ৩% ইনস্ট্যান্ট ক্যাশব্যাক।' : '3% cashback on all international USD payments.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOfferModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                {isBn ? 'ঠিক আছে' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. MOBILE PHONE APP VIEW (Authentic Upay Smartphone Layout)
  // =========================================================================
  return (
    <div className="w-full flex flex-col bg-white text-slate-800 pb-28 select-none">
      {/* 1. Status Bar */}
      <div className="w-full bg-[#FFC820] px-4 pt-1.5 pb-1 flex justify-between items-center text-[12px] text-slate-900 shrink-0 border-b border-amber-300/40">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[12.5px] tracking-tight">{clock}</span>
          <svg className="w-3.5 h-3.5 text-sky-700 fill-current ml-0.5" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
          </svg>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono tracking-tighter">
          <span className="text-[9.5px] font-bold">4G</span>
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

      {/* 2. Yellow Header */}
      <header className="bg-[#FFC820] px-4 pt-2 pb-4 shrink-0 shadow-xs">
        <div className="flex items-center justify-between">
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
            <div>
              <h1 className="font-extrabold text-slate-950 text-[15px] leading-tight tracking-tight uppercase">
                {displayName}
              </h1>
              <p className="text-[12px] text-slate-800 font-mono font-medium mt-0.5 leading-none">
                {displayPhone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleBalance}
              onDoubleClick={onOpenBalanceSheet}
              className={`px-4 py-1.5 rounded-full text-white text-[12px] font-bold tracking-wide shadow-sm transition active:scale-95 flex items-center justify-center min-w-[80px] h-7 ${
                balanceVisible ? 'bg-emerald-600' : 'bg-[#0047BA] hover:bg-[#002C6C]'
              }`}
            >
              <span>{balanceVisible ? `৳ ${balanceBDT.toFixed(2)}` : t('header.balance')}</span>
            </button>
            <button
              onClick={onOpenNotifications}
              className="relative p-1 text-[#0047BA] hover:text-[#002C6C] transition"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Active Case Banner */}
      {activeCases.length > 0 && (
        <div
          onClick={() => onNavigateTab('report')}
          className="mx-4 mt-3 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md transition border border-blue-700/50 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0"></span>
            <div>
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>{isBn ? 'স্মার্ট অভিযোগ ট্র্যাকিং' : 'Smart Case Tracking'}</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 rounded">{activeCases[0].status}</span>
              </div>
              <div className="text-xs font-semibold text-white mt-0.5 line-clamp-1">
                {activeCases[0].case_title}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-white/10 text-white px-2 py-1 rounded-lg">
            {activeCases[0].progress_percent}% →
          </span>
        </div>
      )}

      {/* 4-Column Primary Grid */}
      <section className="px-3 pt-3.5 pb-2" aria-label="প্রধান সেবাসমূহ">
        <div className="grid grid-cols-4 gap-y-4 gap-x-1 text-center">
          {[
            { label: t('service.send_money'), icon: '৳', bg: 'bg-[#E8F1FC] border-[#D0E2F9] text-[#0047BA]' },
            { label: t('service.mobile_recharge'), icon: '📱', bg: 'bg-[#E8F1FC] border-[#D0E2F9] text-[#0047BA]' },
            { label: t('service.cash_out'), icon: '🏧', bg: 'bg-[#E8F1FC] border-[#D0E2F9] text-[#0047BA]' },
            { label: t('service.pay_bill'), icon: '🧾', bg: 'bg-[#E8F1FC] border-[#D0E2F9] text-[#0047BA]' },
            { label: t('service.add_money'), icon: '➕', bg: 'bg-[#EAE8F8] border-[#DDD8F4] text-indigo-700' },
            { label: t('service.savings'), icon: '💰', bg: 'bg-[#FFF5E5] border-[#FFE4BA] text-amber-700' },
            { label: t('service.fund_transfer'), icon: '🔄', bg: 'bg-[#E8F8F5] border-[#CCF0E8] text-teal-700' },
            { label: t('service.request_money'), icon: '📩', bg: 'bg-[#EAF8FC] border-[#CEF0F8] text-cyan-700' },
            { label: t('service.make_payment'), icon: '⛶', bg: 'bg-[#EBF5FB] border-[#D4EBF7] text-sky-700' },
            { label: t('service.refer_earn'), icon: '🎁', bg: 'bg-[#F6EEF8] border-[#E9D6F0] text-purple-700' },
            { label: t('service.npsb'), icon: '=NPSB', bg: 'bg-[#FDF0ED] border-[#F8D8CF] text-rose-700' },
            { label: t('service.ai_audit'), icon: '🛡️', bg: 'bg-slate-900 border-slate-700 text-amber-400', isAudit: true },
          ].map((item, i) => (
            <div
              key={i}
              onClick={() => item.isAudit ? onNavigateTab('audit') : onOpenBalanceSheet()}
              className="flex flex-col items-center cursor-pointer active:scale-95 transition"
            >
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-xs shadow-xs ${item.bg}`}>
                {item.icon}
              </div>
              <span className="text-[11px] font-medium text-slate-800 mt-1 leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="px-4 py-2">
        <div className="w-full rounded-2xl bg-gradient-to-r from-[#00A3E0] via-[#5AC8FA] to-[#FFCC00] p-3 text-slate-900 shadow-sm relative overflow-hidden flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-900 leading-tight">
              {t('banner.destination')}
            </div>
            <div className="text-[9px] text-slate-800 font-medium mt-0.5">
              {isBn ? 'উপায় থেকে GoZayaan-এ পেমেন্ট করলেই বিশাল ছাড়' : 'Special discounts with Upay on GoZayaan'}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-amber-300 border border-amber-400 text-slate-900 px-1.5 py-0.5 rounded text-center">
              <div className="text-[7px] font-semibold">{isBn ? 'ফ্লাইট' : 'Flights'}</div>
              <div className="text-[12px] font-extrabold leading-none">১০%<span className="text-[7px]"> OFF</span></div>
            </div>
            <div className="bg-amber-300 border border-amber-400 text-slate-900 px-1.5 py-0.5 rounded text-center">
              <div className="text-[7px] font-semibold">{isBn ? 'হোটেল' : 'Hotels'}</div>
              <div className="text-[12px] font-extrabold leading-none">৬৫%<span className="text-[7px]"> OFF</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Suites Mobile Cards */}
      <section className="px-4 py-2 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0047BA]"></span>
            {t('ai.suite_title')}
          </h2>
          <span className="text-[9px] font-bold text-[#0047BA] uppercase">{t('ai.models_active')}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div
            onClick={() => onNavigateTab('card')}
            className="p-3 bg-gradient-to-br from-indigo-900 to-blue-900 rounded-xl text-white cursor-pointer active:scale-95 transition flex flex-col justify-between"
          >
            <div>
              <span className="text-base">💳</span>
              <h3 className="font-bold text-xs mt-1">{t('ai.card_title')}</h3>
              <p className="text-[9.5px] text-blue-200 leading-tight mt-0.5">{t('ai.card_desc')}</p>
            </div>
            <div className="mt-2 text-[9.5px] font-bold text-amber-300">→</div>
          </div>

          <div
            onClick={() => onNavigateTab('report')}
            className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl text-white cursor-pointer active:scale-95 transition flex flex-col justify-between"
          >
            <div>
              <span className="text-base">📝</span>
              <h3 className="font-bold text-xs mt-1">{t('ai.report_title')}</h3>
              <p className="text-[9.5px] text-slate-300 leading-tight mt-0.5">{t('ai.report_desc')}</p>
            </div>
            <div className="mt-2 text-[9.5px] font-bold text-emerald-400">→</div>
          </div>

          <div
            onClick={() => onNavigateTab('credit')}
            className="p-3 bg-gradient-to-br from-amber-700 to-amber-900 rounded-xl text-white cursor-pointer active:scale-95 transition flex flex-col justify-between"
          >
            <div>
              <span className="text-base">📊</span>
              <h3 className="font-bold text-xs mt-1">{t('ai.credit_title')}</h3>
              <p className="text-[9.5px] text-amber-200 leading-tight mt-0.5">{t('ai.credit_desc')}</p>
            </div>
            <div className="mt-2 text-[9.5px] font-bold text-amber-300">→</div>
          </div>

          <div
            onClick={() => onNavigateTab('voice')}
            className="p-3 bg-gradient-to-br from-teal-800 to-cyan-950 rounded-xl text-white cursor-pointer active:scale-95 transition flex flex-col justify-between"
          >
            <div>
              <span className="text-base">🎙️</span>
              <h3 className="font-bold text-xs mt-1">{t('ai.voice_title')}</h3>
              <p className="text-[9.5px] text-teal-200 leading-tight mt-0.5">{t('ai.voice_desc')}</p>
            </div>
            <div className="mt-2 text-[9.5px] font-bold text-cyan-300">→</div>
          </div>
        </div>
      </section>

      {/* Upay Payment Grid */}
      <section className="px-4 pt-2 pb-2">
        <h2 className="text-xs font-bold text-[#0047BA] mb-2">{t('payment.section_title')}</h2>
        <div className="grid grid-cols-4 gap-y-3 gap-x-1 text-center">
          {[
            { label: t('payment.traffic'), icon: '🚦' },
            { label: t('payment.toll'), icon: '🛣️' },
            { label: t('payment.govt'), icon: '🏛️' },
            { label: t('payment.education'), icon: '🎓' },
            { label: t('payment.ngo'), icon: '🤝' },
            { label: t('payment.insurance'), icon: '🛡️' },
            { label: t('payment.donation'), icon: '🤲' },
            { label: t('payment.zakat'), icon: '🕌' },
          ].map((item, i) => (
            <div key={i} onClick={onOpenBalanceSheet} className="flex flex-col items-center cursor-pointer active:scale-95 transition">
              <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sm shadow-xs">
                {item.icon}
              </div>
              <span className="text-[10px] font-medium text-slate-800 mt-1 leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Animated Upay Chaka */}
      {showChakaBadge && (
        <div
          onClick={() => setShowWheelModal(true)}
          className="fixed md:absolute right-4 bottom-24 z-30 pointer-events-auto cursor-pointer"
        >
          <div className="relative w-12 h-12 flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowChakaBadge(false);
              }}
              className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] flex items-center justify-center font-bold z-20 border border-white"
            >
              ×
            </button>
            <div className="w-full h-full rounded-full border-2 border-white shadow-xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 animate-[spin_12s_linear_infinite] flex items-center justify-center p-0.5">
              <div className="w-full h-full rounded-full border-2 border-dashed border-[#0047BA] flex items-center justify-center">
                <span className="text-xs">🎁</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2 MORPHING ACTION BUTTONS (MOBILE DOCK) - Smooth circle to rounded square expansion */}
      <div className="fixed md:absolute bottom-[72px] inset-x-0 px-4 flex justify-between items-center z-30 pointer-events-none">
        <MorphingActionButton
          variant="card"
          align="left"
          icon={<span className="text-xl">💳</span>}
          label={t('pill.card')}
          sublabel={isBn ? 'ডুয়েল কারেন্সি' : 'Smart Card'}
          badge="AI"
          onClick={() => onNavigateTab('card')}
          title="উপায় স্মার্ট কার্ড ড্যাশবোর্ড"
        />

        <MorphingActionButton
          variant="offer"
          align="right"
          icon={<span className="text-xl">🎁</span>}
          label={t('pill.offer')}
          sublabel={isBn ? 'ক্যাশব্যাক' : 'Special Deals'}
          badge="OFFERS"
          onClick={() => setShowOfferModal(true)}
          title="উপায় বিশেষ অফার"
        />
      </div>

      {/* Lucky Wheel Modal */}
      {showWheelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border-4 border-amber-300">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-400 p-2 animate-[spin_8s_linear_infinite] border-4 border-white shadow-lg flex items-center justify-center">
              <span className="text-2xl">🎁</span>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{t('chaka.title')}</h3>
              <p className="text-xs text-slate-600 mt-1">{t('chaka.spin_msg')}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  alert(isBn ? '🎉 অভিনন্দন! আপনি ৳২৫ ক্যাশ রিওয়ার্ড জিতেছেন!' : '🎉 Congratulations! You won BDT 25 cash reward!');
                  setShowWheelModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#0047BA] text-white font-bold text-xs shadow-md"
              >
                {t('chaka.btn_spin')}
              </button>
              <button
                onClick={() => setShowWheelModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                {isBn ? 'বন্ধ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offers Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-3 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>🎁</span> {t('pill.offer')}
              </h3>
              <button onClick={() => setShowOfferModal(false)} className="text-slate-400 text-xs">✕</button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="font-bold text-amber-900">GoZayaan Hotels &amp; Flights</div>
                <p className="text-[10px] text-amber-700 mt-0.5">
                  {isBn ? 'উপায় পেমেন্টে ৬৫% পর্যন্ত ছাড়।' : 'Up to 65% off via Upay.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowOfferModal(false)}
              className="w-full py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              {isBn ? 'ঠিক আছে' : 'OK'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
