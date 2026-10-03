import React, { useState } from 'react';
import { CreditProfile, UserProfile } from '../../../types';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { DemoBadge, DemoWrapper } from '../../shared/DemoBadge';
import { UpayPageHeader } from '../../shared/UpayPageHeader';
import { 
  Sparkles, CheckCircle2, AlertCircle, ArrowUpRight, 
  Send, ShieldCheck, HelpCircle, Building2, Clock, Landmark
} from 'lucide-react';

interface CreditViewProps {
  credit: CreditProfile | null;
  onRefresh: () => void;
  profile?: UserProfile | null;
  onOpenBalanceSheet?: () => void;
  onOpenNotifications?: () => void;
}

export const CreditView: React.FC<CreditViewProps> = ({ 
  credit, 
  onRefresh,
  profile,
  onOpenBalanceSheet,
  onOpenNotifications
}) => {
  const { language, t, viewMode } = useApp();
  const isBn = language === 'bn';
  const isDesktop = viewMode === 'desktop';

  const [requesting, setRequesting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  if (!credit) {
    return (
      <div className={`w-full flex flex-col bg-white text-slate-800 ${isDesktop ? 'rounded-3xl shadow-xl overflow-hidden pb-12' : 'pb-28'}`}>
        <UpayPageHeader
          moduleName={isBn ? 'লোন ও ক্রেডিট স্কোর' : 'Credit Readiness & Loans'}
          moduleBadge="TreeSHAP"
          profile={profile}
          onOpenBalanceSheet={onOpenBalanceSheet}
          onOpenNotifications={onOpenNotifications}
        />
        <div className="p-12 text-center text-slate-500 font-sans">
          {isBn ? 'ক্রেডিট তথ্য লোড হচ্ছে...' : 'Loading credit readiness profile...'}
        </div>
      </div>
    );
  }

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleRequestReview = async () => {
    setRequesting(true);
    try {
      await api.requestCreditReview();
      onRefresh();
      showToast(isBn ? "রিভিউ রিকোয়েস্ট সফলভাবে পার্টনার ব্যাংকে পাঠানো হয়েছে!" : "Review application forwarded to partner bank!");
    } catch (e: any) {
      showToast(e.message || (isBn ? "রিকোয়েস্ট ব্যর্থ হয়েছে" : "Application request failed"));
    } finally {
      setRequesting(false);
    }
  };

  const isLow = credit.risk_category.includes("LOW") || credit.risk_category.includes("PRIME");

  return (
    <div className={`w-full flex flex-col bg-white text-slate-800 ${isDesktop ? 'rounded-3xl shadow-xl overflow-hidden pb-12' : 'pb-28'}`}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-slate-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top duration-200">
          {toastMsg}
        </div>
      )}

      {/* ================= 1. REUSABLE TOP YELLOW HEADER ================= */}
      <UpayPageHeader
        moduleName={isBn ? 'লোন ও ক্রেডিট স্কোর' : 'Credit Readiness & Loans'}
        moduleBadge="TreeSHAP"
        profile={profile}
        onOpenBalanceSheet={onOpenBalanceSheet}
        onOpenNotifications={onOpenNotifications}
      />

      {/* ================= 2. MAIN CREDIT VIEW CONTENT ================= */}
      <div className={`w-full ${isDesktop ? 'px-6 md:px-8 py-6' : 'p-4'} space-y-6`}>
        
        {/* Desktop 2-Column Responsive Layout */}
        <div className={`grid grid-cols-1 ${isDesktop ? 'lg:grid-cols-12 gap-8 items-start' : 'gap-5'}`}>
          
          {/* LEFT COLUMN: Dial & Loan Recommendation */}
          <div className={`${isDesktop ? 'lg:col-span-5 space-y-6' : 'space-y-5'}`}>
            
            {/* Credit Score Hero Dial Card */}
            <section className="bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden text-center border border-slate-800">
              
              {/* Glow ambient circle */}
              <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-bold tracking-wider uppercase mb-4 text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isBn ? 'এআই ক্রেডিট স্কোর মডেল' : 'AI Credit Readiness Engine'}</span>
              </div>

              {/* Circular Progress Score Badge */}
              <div className="relative w-36 h-36 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="text-slate-800"
                    strokeWidth="9"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className={isLow ? "text-emerald-500" : "text-amber-500"}
                    strokeWidth="9"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * credit.readiness_score) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold font-mono tracking-tight">{credit.readiness_score}</span>
                  <span className="text-[10px] text-slate-400 tracking-widest uppercase font-mono">
                    {isBn ? '১০০ এর মধ্যে' : 'Out of 100'}
                  </span>
                </div>
              </div>

              <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold mb-3 font-mono">
                {credit.risk_category}
              </div>

              {/* Suggested Borrowing Range */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 max-w-[320px] mx-auto text-center">
                <span className="text-[11px] text-slate-300 block">
                  {isBn ? 'মডেল নির্দেশিত সম্ভাব্য মাইক্রো-লোন রেঞ্জ:' : 'Eligible Pre-Approved Nano-Loan Range:'}
                </span>
                <span className="text-lg font-bold text-amber-300 font-mono mt-0.5 block">
                  {credit.suggested_limit_range_bdt}
                </span>
              </div>
            </section>

            {/* Formal Bank Review Action & Status */}
            <section className="bg-slate-50/70 rounded-3xl p-5 shadow-xs border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-upayBlue flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {isBn ? 'পার্টনার ব্যাংক রিভিউ স্ট্যাটাস' : 'Partner Bank Review Application'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isBn ? 'লাইসেন্সপ্রাপ্ত বাণিজ্যিক ব্যাংক কর্তৃক চূড়ান্ত যাচাই' : 'Final underwriting by licensed commercial banks'}
                  </p>
                </div>
              </div>

              {credit.review_requested ? (
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0047BA] shrink-0" />
                  <span>
                    {isBn
                      ? 'আপনার প্রোফাইলটি বর্তমানে ইউনাইটেড কমার্শিয়াল ব্যাংক (UCB) ক্রেডিট দলের পর্যালোচনায় রয়েছে।'
                      : 'Your profile has been forwarded to United Commercial Bank (UCB) Credit Committee.'}
                  </span>
                  <DemoBadge label="PENDING" size="sm" />
                </div>
              ) : (
                <DemoWrapper tooltipText={isBn ? 'ব্যাংকে আনুষ্ঠানিক ঋণ আবেদনের ডেমো সিমুলেশন' : 'Formal bank review application (Demo)'} className="w-full">
                  <button
                    onClick={handleRequestReview}
                    disabled={requesting}
                    className="w-full py-3 rounded-2xl bg-[#0047BA] hover:bg-[#002C6C] text-white font-bold text-xs tracking-wide shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {requesting
                        ? (isBn ? 'অনুরোধ জমা হচ্ছে...' : 'Submitting to Bank...')
                        : (isBn ? 'পার্টনার ব্যাংকে ফর্মাল রিভিউর আবেদন করুন' : 'Submit Application to Partner Bank')}
                    </span>
                    <DemoBadge label="DEMO" size="sm" pulse={false} />
                  </button>
                </DemoWrapper>
              )}

              {/* Mandatory Regulatory Notice (SRS Section 11.1) */}
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed shadow-2xs">
                <strong>{isBn ? 'বাধ্যতামূলক রেগুলেটরি সতর্কতা:' : 'Mandatory Regulatory Notice:'}</strong>{' '}
                {t('credit.disclaimer')}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: TreeSHAP Factors & Pre-Approved Product */}
          <div className={`${isDesktop ? 'lg:col-span-7 space-y-6' : 'space-y-5'}`}>
            
            {/* SHAP XAI Explainability Card */}
            <section className="bg-slate-50/70 rounded-3xl p-5 shadow-xs border border-slate-200/80 space-y-4">
              <div className="border-b border-slate-200/80 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{isBn ? 'স্বচ্ছ এআই সিদ্ধান্ত বিশ্লেষণ (TreeSHAP)' : 'Explainable Decision Factors (TreeSHAP)'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isBn ? 'আপনার ক্রেডিট স্কোরে যেসব নিয়ামক প্রভাব রেখেছে' : 'SHAP Feature Attribution & Algorithmic Transparency'}
                  </p>
                </div>
                <DemoBadge label="SHAP XAI" size="sm" pulse={false} />
              </div>

              {/* Positive Factors */}
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-2 font-mono">
                  {isBn ? '✓ ইতিবাচক স্কোর প্রবৃদ্ধি (+ পয়েন্ট)' : '✓ Positive Readiness Drivers (+ Boost)'}
                </span>
                <div className="space-y-2">
                  {credit.positive_factors.map((factor, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-950 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Negative Factors / Improvement Areas */}
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-2 font-mono">
                  {isBn ? '⚠ উন্নতির সুযোগ (- ঝুঁকি হ্রাস পরামর্শ)' : '⚠ Improvement Areas (- Risk Weight)'}
                </span>
                <div className="space-y-2">
                  {credit.negative_factors.map((factor, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-950 shadow-2xs">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Pre-Approved Nano-Loan Offer Card */}
            <section className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-blue-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono font-bold text-amber-300 tracking-wider">
                  {isBn ? 'প্রাক-অনুমোদিত অফার' : 'PRE-APPROVED NANO-LOAN'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold font-mono">
                  ZERO COLLATERAL
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <h4 className="text-2xl font-black text-white font-mono">৳ 25,000 BDT</h4>
                  <p className="text-xs text-blue-200 mt-0.5">
                    {isBn ? 'ইউনাইটেড কমার্শিয়াল ব্যাংক (UCB) ফিনটেক ডিভিশন' : 'United Commercial Bank (UCB) FinTech Division'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-400 block font-mono">3-Month Tenure</span>
                  <span className="text-[10px] text-blue-300 block">Instant Disbursement</span>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};
