import React, { useState } from 'react';
import { CreditProfile } from '../../../types';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { DemoBadge, DemoWrapper } from '../../shared/DemoBadge';
import { 
  Sparkles, CheckCircle2, AlertCircle, ArrowUpRight, 
  Send, ShieldCheck, HelpCircle, Building2, Clock
} from 'lucide-react';

interface CreditViewProps {
  credit: CreditProfile | null;
  onRefresh: () => void;
}

export const CreditView: React.FC<CreditViewProps> = ({ credit, onRefresh }) => {
  const { language, t } = useApp();
  const isBn = language === 'bn';
  const [requesting, setRequesting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  if (!credit) {
    return (
      <div className="p-8 text-center text-slate-500 font-sans">
        {isBn ? 'ক্রেডিট তথ্য লোড হচ্ছে...' : 'Loading credit profile...'}
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
      showToast("রিভিউ রিকোয়েস্ট সফলভাবে পার্টনার ব্যাংকে পাঠানো হয়েছে!");
    } catch (e: any) {
      showToast(e.message || "রিকোয়েস্ট ব্যর্থ হয়েছে");
    } finally {
      setRequesting(false);
    }
  };

  const isLow = credit.risk_category.includes("LOW");

  return (
    <div className="space-y-5 pb-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-slate-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top duration-200">
          {toastMsg}
        </div>
      )}

      {/* 1. CREDIT SCORE HERO DIAL CARD */}
      <section className="bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden text-center border border-slate-800">
        
        {/* Glow ambient circle */}
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-bold tracking-wider uppercase mb-4 text-amber-300">
          <Sparkles className="w-3.5 h-3.5" />
          AI Credit Readiness Engine
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
            <span className="text-[10px] text-slate-400 font-sans tracking-widest uppercase">Out of 100</span>
          </div>
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold mb-3 font-sans">
          {credit.risk_category}
        </div>

        {/* Suggested Borrowing Range */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 max-w-[320px] mx-auto">
          <span className="text-[11px] text-slate-400 block font-bengali">মডেল নির্দেশিত সম্ভাব্য মাইক্রো-লোন রেঞ্জ:</span>
          <span className="text-lg font-bold text-amber-300 font-mono mt-0.5 block">
            {credit.suggested_limit_range_bdt}
          </span>
        </div>

      </section>

      {/* 2. SHAP XAI EXPLAINABILITY: WHY THIS RESULT? */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-bengali">{isBn ? 'ফলাফলের পেছনের কারণসমূহ (XAI)' : 'Reasons Behind the Result (XAI)'}</h3>
          <p className="text-xs text-slate-500 font-sans">SHAP Feature Attribution Factor Analysis</p>
        </div>

        {/* Positive Factors */}
        <div>
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-2 font-sans">
            ✓ Positive Readiness Drivers (+ Boost)
          </span>
          <div className="space-y-2">
            {credit.positive_factors.map((factor, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2 text-xs text-emerald-950 font-sans">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Negative Factors */}
        <div>
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-2 font-sans">
            ⚠ Improvement Areas (- Risk Weight)
          </span>
          <div className="space-y-2">
            {credit.negative_factors.map((factor, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-start gap-2 text-xs text-amber-950 font-sans">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FORMAL BANK REVIEW ACTION & STATUS */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-upayBlue flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 font-bengali">{isBn ? 'পার্টনার ব্যাংক রিভিউ স্ট্যাটাস' : 'Partner Bank Review Status'}</h4>
            <p className="text-xs text-slate-500 font-bengali">{isBn ? 'লাইসেন্সপ্রাপ্ত বাণিজ্যিক ব্যাংক কর্তৃক চূড়ান্ত যাচাই' : 'Final verification by licensed commercial banks'}</p>
          </div>
        </div>

        {credit.review_requested ? (
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-center gap-2 mb-2">
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
              className="w-full py-3 rounded-2xl bg-[#0047BA] hover:bg-[#002C6C] text-white font-bold text-xs tracking-wide shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mb-2"
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
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 mt-3 font-sans leading-relaxed">
          <strong>{isBn ? 'বাধ্যতামূলক রেগুলেটরি সতর্কতা:' : 'Mandatory Regulatory Notice:'}</strong>{' '}
          {t('credit.disclaimer')}
        </div>
      </section>

    </div>
  );
};
