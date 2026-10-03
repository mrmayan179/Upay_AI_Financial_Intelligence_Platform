import React, { useState } from 'react';
import { UserProfile, AppNotification } from '../../types';
import { useApp } from '../../context/AppContext';
import { BalanceBottomSheet } from '../shared/BalanceBottomSheet';
import { PinKeypadModal } from '../shared/PinKeypadModal';
import { NotificationModal } from '../shared/NotificationModal';
import { BanglaQrModal } from '../shared/BanglaQrModal';
import { DemoBadge } from '../shared/DemoBadge';

export type ActiveTab = 'home' | 'card' | 'report' | 'credit' | 'voice' | 'audit';

interface ShellProps {
  currentTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  profile: UserProfile | null;
  notifications?: AppNotification[];
  onRefreshProfile: () => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  currentTab,
  onTabChange,
  profile,
  notifications = [],
  onRefreshProfile,
  onLogout,
  children
}) => {
  const { language, toggleLanguage, viewMode, toggleViewMode, setViewMode, t, isMobileDevice } = useApp();

  const [isBalanceOpen, setIsBalanceOpen] = useState<boolean>(false);
  const [isPinOpen, setIsPinOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);

  const tabs: { id: ActiveTab; labelKey: string; icon: string; shortKey: string }[] = [
    { id: 'home', labelKey: 'nav.home', icon: '🏠', shortKey: 'nav.home' },
    { id: 'card', labelKey: 'nav.card', icon: '💳', shortKey: 'nav.card' },
    { id: 'report', labelKey: 'nav.report', icon: '📝', shortKey: 'nav.report' },
    { id: 'credit', labelKey: 'nav.credit', icon: '📊', shortKey: 'nav.credit' },
    { id: 'voice', labelKey: 'nav.voice', icon: '🎙️', shortKey: 'nav.voice' },
    { id: 'audit', labelKey: 'nav.audit', icon: '🛡️', shortKey: 'nav.audit' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-900 relative">
      {/* ================= TOP HACKATHON PLATFORM CONTROL BAR ================= */}
      <header className="bg-slate-900 border-b border-slate-800 px-3 md:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-40 shrink-0 shadow-md">
        {/* Left: Branding & Model status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFB800]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#0047BA]"></span>
            </div>
            <span className="font-extrabold text-amber-400 tracking-tight font-bengali text-base ml-1">
              {t('brand.title')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline ml-1 border-l border-slate-700 pl-2">
              {t('brand.subtitle')}
            </span>
            <DemoBadge label="DEMO" size="sm" />
          </div>

          <div className="hidden xl:flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span className="bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Fraud XGB: READY
            </span>
            <span className="bg-amber-950/80 border border-amber-600/40 text-amber-400 px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Anomaly IF: READY
            </span>
            <span className="bg-blue-950/80 border border-blue-600/40 text-blue-400 px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              Credit XGB: READY
            </span>
          </div>
        </div>

        {/* Center: Module Nav Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                currentTab === tab.id
                  ? 'bg-[#FFC820] text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span className={language === 'bn' ? 'font-bengali' : 'font-sans'}>
                {t(tab.labelKey)}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Language Switcher + Screen View Switcher */}
        <div className="flex items-center gap-2">
          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-xs"
            title={language === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
          >
            <span>🌐</span>
            <span className="font-mono">{language === 'bn' ? 'EN' : 'বাং'}</span>
          </button>

          {/* Desktop vs Mobile Mode Switcher */}
          <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex items-center text-xs font-semibold shadow-xs">
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                viewMode === 'mobile'
                  ? 'bg-slate-950 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="স্মার্টফোন প্রিভিউ ফ্রেম"
            >
              <span>📱</span>
              <span className="hidden sm:inline">{t('mode.mobile')}</span>
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                viewMode === 'desktop'
                  ? 'bg-slate-950 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="ডেস্কটপ ওয়াইডস্ক্রিন ড্যাশবোর্ড"
            >
              <span>💻</span>
              <span className="hidden sm:inline">{t('mode.desktop')}</span>
            </button>
          </div>

          {/* PIN Pad Trigger */}
          <button
            onClick={() => setIsPinOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer"
            title="উপায় পিন কিপ্যাড টেস্ট (ডেমো)"
          >
            <span>🔢</span>
            <span className="hidden md:inline">PIN</span>
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-2.5 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
              title={language === 'bn' ? 'লগআউট করুন' : 'Log Out'}
            >
              <span>🚪</span>
              <span className="hidden sm:inline font-bengali">
                {language === 'bn' ? 'লগআউট' : 'Logout'}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* ================= FLOATING QUICK CONTROLS (ALWAYS ACCESSIBLE) ================= */}
      <aside className="fixed bottom-6 right-6 z-40 flex flex-col gap-2 pointer-events-none select-none">
        {/* Toggle Mode Floating Pill */}
        <button
          onClick={toggleViewMode}
          className="pointer-events-auto bg-slate-900/90 hover:bg-slate-800 text-amber-400 border-2 border-amber-400/80 px-3 py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="ক্লিক করে মোবাইল ফ্রেম ও ডেস্কটপ ওয়াইডস্ক্রিন মোড পরিবর্তন করুন"
        >
          <span>{viewMode === 'desktop' ? '📱' : '💻'}</span>
          <span className="hidden md:inline">
            {viewMode === 'desktop' ? t('mode.mobile') : t('mode.desktop')}
          </span>
          <DemoBadge label="VIEW" size="sm" pulse={false} />
        </button>

        {/* Toggle Language Floating Pill */}
        <button
          onClick={toggleLanguage}
          className="pointer-events-auto bg-slate-900/90 hover:bg-slate-800 text-sky-400 border-2 border-sky-400/80 px-3 py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="ভাষা পরিবর্তন করুন (বাং / EN)"
        >
          <span>🌐</span>
          <span className="font-mono">{language === 'bn' ? 'English' : 'বাংলা'}</span>
        </button>
      </aside>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="flex-1 flex justify-center items-start overflow-y-auto p-0 md:p-4">
        {viewMode === 'mobile' ? (
          /* Mobile Smartphone Mockup Frame */
          <div
            className={`w-full ${
              isMobileDevice ? 'h-[100dvh]' : 'md:w-[412px] h-[100dvh] md:h-[870px]'
            } bg-white text-slate-900 md:rounded-[44px] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] relative flex flex-col overflow-hidden border-0 ${
              isMobileDevice ? '' : 'md:border-[8px] md:border-slate-800'
            }`}
          >
            {/* Speaker & Sensor Bezel Bar (Only on Desktop Frame preview) */}
            {!isMobileDevice && (
              <div className="hidden md:flex justify-center items-center py-1 bg-slate-800 shrink-0">
                <div className="w-16 h-1 bg-slate-600 rounded-full"></div>
              </div>
            )}

            {/* Scrollable Mobile Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative bg-white">
              {children}
            </div>

            {/* Authentic Curved Bottom Navigation with Elevated BANGLA QR */}
            <nav className="absolute bottom-0 inset-x-0 h-16 bg-white border-t border-slate-200 px-3 flex items-center justify-between z-30 select-none shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
              {/* Tab: হোম */}
              <button
                onClick={() => onTabChange('home')}
                className={`flex flex-col items-center flex-1 transition active:scale-90 ${
                  currentTab === 'home' ? 'text-[#0047BA]' : 'text-slate-400 hover:text-[#0047BA]'
                }`}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
                <span className={`text-[11px] font-bold mt-0.5 ${language === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                  {t('nav.home')}
                </span>
              </button>

              {/* Tab: কার্ড */}
              <button
                onClick={() => onTabChange('card')}
                className={`flex flex-col items-center flex-1 transition active:scale-90 ${
                  currentTab === 'card' ? 'text-[#0047BA]' : 'text-slate-400 hover:text-[#0047BA]'
                }`}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                </svg>
                <span className={`text-[11px] font-semibold mt-0.5 ${language === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                  {t('nav.card')}
                </span>
              </button>

              {/* CENTER ELEVATED BUTTON: BANGLA QR SCANNER */}
              <div className="flex-1 flex justify-center -mt-6">
                <button
                  onClick={() => setIsQrOpen(true)}
                  className="w-14 h-14 rounded-full bg-white p-1 shadow-xl border-2 border-sky-400 flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer"
                  title="বাংলা কিউআর স্ক্যান করুন"
                >
                  <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center border border-blue-200">
                    <span className="text-[7px] font-extrabold text-slate-700 tracking-tighter">BANGLA</span>
                    <svg className="w-5 h-5 text-[#0047BA] -my-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <span className="text-[7px] font-extrabold text-rose-500 tracking-tighter">QR</span>
                  </div>
                </button>
              </div>

              {/* Tab: রিপোর্ট */}
              <button
                onClick={() => onTabChange('report')}
                className={`flex flex-col items-center flex-1 transition active:scale-90 ${
                  currentTab === 'report' ? 'text-[#0047BA]' : 'text-slate-400 hover:text-[#0047BA]'
                }`}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
                <span className={`text-[11px] font-semibold mt-0.5 ${language === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                  {t('nav.report')}
                </span>
              </button>

              {/* Tab: লোন / ক্রেডিট */}
              <button
                onClick={() => onTabChange('credit')}
                className={`flex flex-col items-center flex-1 transition active:scale-90 ${
                  currentTab === 'credit' ? 'text-[#0047BA]' : 'text-slate-400 hover:text-[#0047BA]'
                }`}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
                </svg>
                <span className={`text-[11px] font-semibold mt-0.5 ${language === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                  {t('nav.credit')}
                </span>
              </button>
            </nav>
          </div>
        ) : (
          /* Desktop Widescreen Layout (Enterprise Dashboard Website) */
          <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-8 animate-in fade-in duration-200">
            {children}
          </div>
        )}
      </main>

      {/* ================= SHARED MODALS ================= */}
      <BalanceBottomSheet
        isOpen={isBalanceOpen}
        onClose={() => setIsBalanceOpen(false)}
        balanceBdt={profile?.account_balance_bdt ?? 7.25}
        cashRewardBdt={profile?.cash_reward_bdt ?? 0.00}
      />

      <PinKeypadModal
        isOpen={isPinOpen}
        onClose={() => setIsPinOpen(false)}
        onSuccess={(pin) => {
          alert(`✅ প্রবেশকৃত পিন: ${pin} (যাচাই সফল / Verified)`);
          setIsPinOpen(false);
        }}
      />

      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
      />

      <BanglaQrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        onPaySuccess={(_merchant, _amount) => {
          onRefreshProfile();
        }}
      />
    </div>
  );
};
