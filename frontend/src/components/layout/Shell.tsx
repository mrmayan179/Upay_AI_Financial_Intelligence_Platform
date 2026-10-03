import React, { useState } from 'react';
import { UserProfile, AppNotification } from '../../types';
import { BalanceBottomSheet } from '../shared/BalanceBottomSheet';
import { PinKeypadModal } from '../shared/PinKeypadModal';
import { NotificationModal } from '../shared/NotificationModal';
import { BanglaQrModal } from '../shared/BanglaQrModal';

export type ActiveTab = 'home' | 'card' | 'report' | 'credit' | 'voice' | 'audit';

interface ShellProps {
  currentTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  profile: UserProfile | null;
  notifications?: AppNotification[];
  onRefreshProfile: () => void;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  currentTab,
  onTabChange,
  profile,
  notifications = [],
  onRefreshProfile,
  children
}) => {
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [isBalanceOpen, setIsBalanceOpen] = useState<boolean>(false);
  const [isPinOpen, setIsPinOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);

  const tabs: { id: ActiveTab; label: string; icon: string; shortLabel: string }[] = [
    { id: 'home', label: 'হোম', icon: '🏠', shortLabel: 'হোম' },
    { id: 'card', label: 'স্মার্ট কার্ড', icon: '💳', shortLabel: 'কার্ড' },
    { id: 'report', label: 'স্মার্ট রিপোর্ট ও কেস', icon: '📝', shortLabel: 'রিপোর্ট' },
    { id: 'credit', label: 'লোন ও ক্রেডিট স্কোর', icon: '📊', shortLabel: 'ক্রেডিট' },
    { id: 'voice', label: 'ভয়েস এআই কেয়ার', icon: '🎙️', shortLabel: 'ভয়েস' },
    { id: 'audit', label: 'এআই গভর্নেন্স ও অডিট', icon: '🛡️', shortLabel: 'অডিট' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-900">
      {/* ================= HACKATHON PLATFORM CONTROL BAR ================= */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-40 shrink-0">
        {/* Left: Branding & Model status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFB800]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#0047BA]"></span>
            <span className="font-extrabold text-amber-400 tracking-tight font-bengali text-sm ml-1">upay</span>
            <span className="text-[10px] text-slate-400 font-mono ml-1">AI Intelligence Platform</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span className="bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 px-2 py-0.5 rounded">
              ● Fraud XGBoost: READY
            </span>
            <span className="bg-amber-950/80 border border-amber-600/40 text-amber-400 px-2 py-0.5 rounded">
              ● Anomaly IForest: READY
            </span>
            <span className="bg-blue-950/80 border border-blue-600/40 text-blue-400 px-2 py-0.5 rounded">
              ● Credit XGBoost: READY
            </span>
          </div>
        </div>

        {/* Center: Module Nav Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                currentTab === tab.id
                  ? 'bg-[#FFC820] text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-bengali">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Viewport mode switcher & PIN reset demo trigger */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center text-[11px] font-semibold">
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-2.5 py-1 rounded-md transition ${
                viewMode === 'mobile'
                  ? 'bg-slate-950 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="স্মার্টফোন প্রিভিউ ফ্রেম"
            >
              📱 Mobile
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`px-2.5 py-1 rounded-md transition ${
                viewMode === 'desktop'
                  ? 'bg-slate-950 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="ডেস্কটপ ওয়াইডস্ক্রিন ড্যাশবোর্ড"
            >
              💻 Desktop
            </button>
          </div>

          <button
            onClick={() => setIsPinOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition"
            title="উপায় পিন কিপ্যাড টেস্ট"
          >
            🔢 PIN Pad
          </button>
        </div>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="flex-1 flex justify-center items-start overflow-y-auto p-0 md:p-4">
        {viewMode === 'mobile' ? (
          /* Mobile Smartphone Mockup Frame */
          <div className="w-full md:w-[412px] h-[100dvh] md:h-[870px] bg-white text-slate-900 md:rounded-[44px] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] relative flex flex-col overflow-hidden border-0 md:border-[8px] md:border-slate-800">
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
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span className="text-[11px] font-bold mt-0.5 font-bengali">হোম</span>
              </button>

              {/* Tab: কার্ড */}
              <button
                onClick={() => onTabChange('card')}
                className={`flex flex-col items-center flex-1 transition active:scale-90 ${
                  currentTab === 'card' ? 'text-[#0047BA]' : 'text-slate-400 hover:text-[#0047BA]'
                }`}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
                <span className="text-[11px] font-semibold mt-0.5 font-bengali">কার্ড</span>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
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
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                <span className="text-[11px] font-semibold mt-0.5 font-bengali">রিপোর্ট</span>
              </button>

              {/* Tab: লোন / ক্রেডিট */}
              <button
                onClick={() => onTabChange('credit')}
                className={`flex flex-col items-center flex-1 transition active:scale-90 ${
                  currentTab === 'credit' ? 'text-[#0047BA]' : 'text-slate-400 hover:text-[#0047BA]'
                }`}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
                </svg>
                <span className="text-[11px] font-semibold mt-0.5 font-bengali">ক্রেডিট</span>
              </button>
            </nav>
          </div>
        ) : (
          /* Desktop Widescreen Layout */
          <div className="w-full max-w-7xl bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl p-6 min-h-[85vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{tabs.find(t => t.id === currentTab)?.icon}</span>
                  <span>{tabs.find(t => t.id === currentTab)?.label}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upay AI Financial Intelligence Platform — Evaluation Workspace
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBalanceOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                >
                  ব্যালেন্স শিট ৳
                </button>
                <button
                  onClick={() => setIsNotificationsOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  বিজ্ঞপ্তি 🔔
                </button>
                <button
                  onClick={() => setIsQrOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#0047BA] hover:bg-blue-700 text-white font-bold text-xs transition"
                >
                  BANGLA QR ⛶
                </button>
              </div>
            </div>

            <div className="bg-white text-slate-900 rounded-2xl p-4 md:p-6 shadow-inner">
              {children}
            </div>
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
          alert(`✅ প্রবেশকৃত পিন: ${pin} (যাচাই সফল)`);
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
