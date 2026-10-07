import React, { useState, useEffect } from 'react';
import { Card as CardType, CardTransaction, CardPreCheckResult, UserProfile, RiskDimension } from '../../../types';
import { UpaySmartCardVisual } from './UpaySmartCardVisual';
import { PinKeypadModal } from '../../shared/PinKeypadModal';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { DemoBadge, DemoWrapper } from '../../shared/DemoBadge';
import { UpayPageHeader } from '../../shared/UpayPageHeader';
import { 
  ShieldCheck, ShieldAlert, Wifi, Globe, ShoppingBag, 
  Lock, KeyRound, Radio, PlayCircle, CheckCircle2, AlertTriangle, X,
  Eye, Activity, History, ChevronRight, AlertOctagon, Info, ArrowRight, Shield, RefreshCw
} from 'lucide-react';

interface CardViewProps {
  card: CardType | null;
  onRefresh: () => void;
  profile?: UserProfile | null;
  onOpenBalanceSheet?: () => void;
  onOpenNotifications?: () => void;
}

export const CardView: React.FC<CardViewProps> = ({ 
  card, 
  onRefresh,
  profile,
  onOpenBalanceSheet,
  onOpenNotifications
}) => {
  const { language, viewMode } = useApp();
  const isBn = language === 'bn';
  const isDesktop = viewMode === 'desktop';

  // Modals & Popups
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Recent Transactions & DB State
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [selectedTxnAnalysis, setSelectedTxnAnalysis] = useState<any | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // 2-Step Simulation & Proactive Warning State
  const [simStep, setSimStep] = useState<'INPUT' | 'PRECHECK' | 'EXECUTED'>('INPUT');
  const [preCheckLoading, setPreCheckLoading] = useState(false);
  const [preCheckResult, setPreCheckResult] = useState<CardPreCheckResult | null>(null);
  const [simTxnResult, setSimTxnResult] = useState<CardTransaction | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  // Simulation form state
  const [simAmount, setSimAmount] = useState(45.0);
  const [simMerchant, setSimMerchant] = useState("Coursera Inc.");
  const [simChannel, setSimChannel] = useState("ONLINE");
  const [simCountry, setSimCountry] = useState("US");
  const [simNewDevice, setSimNewDevice] = useState(0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

const DEMO_TXNS_FALLBACK: CardTransaction[] = [
  {
    transaction_id: "SYN-CTXN-101",
    card_id: "SYN-CRD-10082-1",
    amount_usd: 12.50,
    amount_bdt: 1475.00,
    merchant_name: "Gloria Jean's Coffees",
    channel: "CONTACTLESS",
    risk_score: 12,
    composite_score: 12,
    risk_level: "LOW",
    decision: "ALLOW",
    reasons: ["Habitual coffee purchase at recognized domestic terminal"],
    status: "APPROVED",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    transaction_id: "SYN-CTXN-102",
    card_id: "SYN-CRD-10082-1",
    amount_usd: 15.99,
    amount_bdt: 1886.82,
    merchant_name: "Netflix International",
    channel: "ONLINE",
    risk_score: 18,
    composite_score: 18,
    risk_level: "LOW",
    decision: "ALLOW",
    reasons: ["Recurring monthly streaming subscription payment"],
    status: "APPROVED",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    transaction_id: "SYN-CTXN-103",
    card_id: "SYN-CRD-10082-1",
    amount_usd: 49.00,
    amount_bdt: 5782.00,
    merchant_name: "Coursera Inc. Learning",
    channel: "ONLINE",
    risk_score: 22,
    composite_score: 22,
    risk_level: "LOW",
    decision: "ALLOW",
    reasons: ["Verified professional certification payment"],
    status: "APPROVED",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

  // Load transactions from real database runtime
  const loadTransactions = async () => {
    if (!card) return;
    setLoadingTxns(true);
    try {
      const data = await api.getCardTransactions(card.card_id);
      if (data && data.length > 0) {
        setTransactions(data);
      } else {
        setTransactions(DEMO_TXNS_FALLBACK);
      }
    } catch (err) {
      console.warn("Using fallback transactions", err);
      setTransactions(prev => (prev.length > 0 ? prev : DEMO_TXNS_FALLBACK));
    } finally {
      setLoadingTxns(false);
    }
  };

  useEffect(() => {
    if (card?.card_id) {
      loadTransactions();
    } else {
      onRefresh();
    }
  }, [card?.card_id]);

  if (!card) {
    return (
      <div className={`w-full flex flex-col bg-white text-slate-800 ${isDesktop ? 'rounded-3xl shadow-xl overflow-hidden pb-12' : 'pb-28'}`}>
        <UpayPageHeader 
          moduleName={isBn ? 'স্মার্ট কার্ড' : 'Smart Card'}
          moduleBadge="AI SHIELD"
          profile={profile}
          onOpenBalanceSheet={onOpenBalanceSheet}
          onOpenNotifications={onOpenNotifications}
        />
        <div className="p-12 text-center text-slate-500 font-sans">
          {isBn ? 'কার্ড তথ্য লোড হচ্ছে...' : 'Loading card details...'}
        </div>
      </div>
    );
  }

  const toggleSetting = async (field: string, val: boolean) => {
    try {
      await api.updateCardSettings(card.card_id, { [field]: val });
      onRefresh();
      showToast(isBn ? 'সেটিংস সফলভাবে আপডেট হয়েছে' : 'Settings successfully updated');
    } catch (e: any) {
      showToast(e.message || (isBn ? 'আপডেট ব্যর্থ হয়েছে' : 'Update failed'));
    }
  };

  const handleFreezeToggle = async () => {
    try {
      await api.freezeCard(card.card_id);
      onRefresh();
      showToast(
        card.status === 'FROZEN' 
          ? (isBn ? 'কার্ড আনফ্রিজ করা হয়েছে' : 'Card un-frozen successfully')
          : (isBn ? 'কার্ড সাময়িক ফ্রিজ করা হয়েছে' : 'Card frozen successfully')
      );
    } catch (e: any) {
      showToast(e.message || (isBn ? 'ব্যর্থ হয়েছে' : 'Operation failed'));
    }
  };

  const handlePinResetSuccess = async (newPin: string) => {
    try {
      await api.resetCardPin(card.card_id, "1234", newPin);
      setIsPinModalOpen(false);
      showToast(isBn ? 'কার্ড পিন সফলভাবে পরিবর্তন করা হয়েছে!' : 'Card PIN successfully updated!');
    } catch (e: any) {
      showToast(e.message || (isBn ? 'পিন পরিবর্তন ব্যর্থ হয়েছে' : 'PIN update failed'));
    }
  };

  // Run NFC Tap Simulation
  const handleNfcTapDemo = async () => {
    setSimLoading(true);
    try {
      const res: any = await api.simulateCardTransaction({
        card_id: card.card_id,
        amount_usd: 12.50,
        merchant_name: "Gloria Jean's Coffees (NFC Tap)",
        channel: "CONTACTLESS",
        country: "BD",
        is_new_merchant: 0,
        is_new_device: 0
      });
      setSimTxnResult(res);
      setSimStep('EXECUTED');
      setIsSimModalOpen(true);
      onRefresh();
      loadTransactions();
    } catch (e: any) {
      showToast(e.message || (isBn ? 'NFC লেনদেন ব্যর্থ হয়েছে' : 'NFC transaction simulation failed'));
    } finally {
      setSimLoading(false);
    }
  };

  // Step 1: Pre-check & Proactive Predictive Warning
  const handleRunPreCheck = async () => {
    setPreCheckLoading(true);
    try {
      const result = await api.preCheckCardTransaction({
        card_id: card.card_id,
        amount_usd: simAmount,
        merchant_name: simMerchant,
        channel: simChannel,
        country: simCountry,
        device_id: simNewDevice ? "DEV-NEW-UNRECOGNIZED" : "DEV-APP-01",
        is_new_merchant: simMerchant.includes("Unknown") ? 1 : 0,
        is_new_device: simNewDevice
      });
      setPreCheckResult(result);
      setSimStep('PRECHECK');
    } catch (e: any) {
      showToast(e.message || (isBn ? 'প্রি-চেক ব্যর্থ হয়েছে' : 'Pre-check failed'));
    } finally {
      setPreCheckLoading(false);
    }
  };

  // Step 2: Authorize & Execute Transaction into Database
  const handleExecuteSimTxn = async () => {
    setSimLoading(true);
    try {
      const res = await api.simulateCardTransaction({
        card_id: card.card_id,
        amount_usd: simAmount,
        merchant_name: simMerchant,
        channel: simChannel,
        country: simCountry,
        is_new_merchant: simMerchant.includes("Unknown") ? 1 : 0,
        is_new_device: simNewDevice
      });
      setSimTxnResult(res);
      setSimStep('EXECUTED');
      onRefresh();
      loadTransactions();
    } catch (e: any) {
      showToast(e.message || (isBn ? 'লেনদেন বিশ্লেষণ ব্যর্থ হয়েছে' : 'Transaction analysis failed'));
    } finally {
      setSimLoading(false);
    }
  };

  // Open Full Risk Analysis for past transaction
  const handleOpenAnalysis = async (txnId: string) => {
    setAnalysisLoading(true);
    try {
      const data = await api.getTransactionAnalysis(txnId);
      setSelectedTxnAnalysis(data);
    } catch (err: any) {
      showToast(err.message || (isBn ? "বিশ্লেষণ লোড ব্যর্থ হয়েছে" : "Failed to load analysis"));
    } finally {
      setAnalysisLoading(false);
    }
  };

  const usedPercent = Math.min(100, Math.round((card.used_usd / Math.max(1, card.endorsement_usd)) * 100));

  // Risk Level color helper
  const getRiskColorClasses = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MEDIUM':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision?.toUpperCase()) {
      case 'APPROVED':
      case 'ALLOW':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">APPROVED</span>;
      case 'CHALLENGE_REQUIRED':
      case 'CHALLENGE_2FA':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">2FA CHALLENGE</span>;
      case 'HELD_FOR_REVIEW':
      case 'FLAGGED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">HELD REVIEW</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">DECLINED</span>;
    }
  };

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
        moduleName={isBn ? 'স্মার্ট কার্ড ড্যাশবোর্ড' : 'Smart Card Dashboard'}
        moduleBadge="AI SHIELD"
        profile={profile}
        onOpenBalanceSheet={onOpenBalanceSheet}
        onOpenNotifications={onOpenNotifications}
      />

      {/* ================= 2. MAIN CARD VIEW CONTENT ================= */}
      <div className={`w-full ${isDesktop ? 'px-6 md:px-8 py-6' : 'p-4'} space-y-6`}>
        
        {/* Desktop 2-Column Responsive Layout */}
        <div className={`grid grid-cols-1 ${isDesktop ? 'lg:grid-cols-12 gap-8 items-start' : 'gap-5'}`}>
          
          {/* LEFT COLUMN: 3D Card Visual + USD Quota */}
          <div className={`${isDesktop ? 'lg:col-span-5 space-y-6' : 'space-y-5'}`}>
            
            {/* Visual 3D Flip Card */}
            <section className="pt-1">
              <UpaySmartCardVisual card={card} />
            </section>

            {/* USD Endorsement Tracker Card */}
            <section className="bg-slate-50/70 rounded-3xl p-5 shadow-xs border border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {isBn ? 'ইউএসডি ট্রাভেল কোটা বরাদ্দ' : 'USD Endorsement Quota'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn ? 'পাসপোর্ট বার্ষিক ট্রাভেল কোটা বরাদ্দ ($৫,০০০)' : 'Passport Annual Travel Quota ($5,000 USD)'}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-upayBlue border border-blue-100 font-sans">
                  {usedPercent}% {isBn ? 'ব্যবহৃত' : 'Used'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 rounded-full bg-slate-200/80 overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500" 
                  style={{ width: `${usedPercent}%` }}
                />
              </div>

              {/* 3 Metric Columns */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    {isBn ? 'মোট কোটা' : 'Total Quota'}
                  </span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    ${card.endorsement_usd.toFixed(0)}
                  </span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    {isBn ? 'ব্যবহৃত' : 'Used USD'}
                  </span>
                  <span className="text-base font-extrabold text-amber-600 font-mono">
                    ${card.used_usd.toFixed(2)}
                  </span>
                </div>
                <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-2xs">
                  <span className="text-[11px] text-emerald-700 font-medium block">
                    {isBn ? 'অবশিষ্ট' : 'Available'}
                  </span>
                  <span className="text-base font-extrabold text-emerald-800 font-mono">
                    ${card.available_usd.toFixed(2)}
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Controls & Simulation Tools */}
          <div className={`${isDesktop ? 'lg:col-span-7 space-y-6' : 'space-y-5'}`}>
            
            {/* Card Security & Channel Controls */}
            <section className="bg-gradient-to-br from-blue-50/95 via-sky-50/80 to-teal-50/50 rounded-3xl p-5 md:p-6 shadow-[0_8px_30px_rgba(0,71,186,0.08)] border border-blue-200/90 space-y-3.5 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-400/15 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-blue-200/70 pb-3 relative z-10">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-blue-100 text-[#0047BA] shadow-2xs">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span>{isBn ? 'কার্ড সিকিউরিটি ও চ্যানেল নিয়ন্ত্রণ' : 'Card Security & Channel Control'}</span>
                </h3>
                <span className="text-[10px] font-mono font-bold bg-blue-100/90 text-[#0047BA] px-2.5 py-0.5 rounded-full border border-blue-200/80 shadow-2xs">
                  {isBn ? 'লাইভ নিরাপত্তা শিল্ড' : 'ACTIVE ENCLAVE'}
                </span>
              </div>
              
              {/* Toggle 1: Card Active / Freeze */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-blue-50/30 transition-all border border-blue-100/90 shadow-[0_2px_8px_rgba(0,71,186,0.04)] relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${card.card_enabled ? 'bg-blue-100 text-upayBlue' : 'bg-rose-100 text-rose-600'}`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {isBn ? 'কার্ড স্ট্যাটাস (Card Power)' : 'Card Status (Power)'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {card.card_enabled 
                        ? (isBn ? 'কার্ড সক্রিয় আছে' : 'Card is active & operational')
                        : (isBn ? 'কার্ডটি সাময়িক ফ্রিজ করা' : 'Card is temporarily frozen')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleFreezeToggle}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 shadow-xs ${card.card_enabled ? 'bg-upayBlue' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${card.card_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Toggle 2: Online Transactions */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-blue-50/30 transition-all border border-blue-100/90 shadow-[0_2px_8px_rgba(0,71,186,0.04)] relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {isBn ? 'অনলাইন পেমেন্ট (E-Commerce)' : 'Online Payments (E-Commerce)'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {isBn ? 'ই-কমার্স এবং অ্যাপে কার্ড ব্যবহারের অনুমতি' : 'Enable transactions for digital services & shopping'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('online_enabled', !card.online_enabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 shadow-xs ${card.online_enabled ? 'bg-upayBlue' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${card.online_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Toggle 3: International Payments */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-blue-50/30 transition-all border border-blue-100/90 shadow-[0_2px_8px_rgba(0,71,186,0.04)] relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {isBn ? 'আন্তর্জাতিক লেনদেন (USD)' : 'International Transactions (USD)'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {isBn ? 'বিদেশে অথবা আন্তর্জাতিক ওয়েবসাইটে লেনদেন' : 'Enable spending abroad and on global USD merchants'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('international_enabled', !card.international_enabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 shadow-xs ${card.international_enabled ? 'bg-upayBlue' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${card.international_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Toggle 4: NFC / Contactless */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-blue-50/30 transition-all border border-blue-100/90 shadow-[0_2px_8px_rgba(0,71,186,0.04)] relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Wifi className="w-5 h-5 rotate-90" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {isBn ? 'ট্যাপ অ্যান্ড গো (NFC Contactless)' : 'Tap & Go (NFC Contactless)'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {isBn ? 'POS মেশিনে কার্ড স্পর্শ করে দ্রুত পেমেন্ট' : 'Fast tap-to-pay at POS terminals with zero contact'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('nfc_enabled', !card.nfc_enabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 shadow-xs ${card.nfc_enabled ? 'bg-upayBlue' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${card.nfc_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </section>

            {/* Quick Simulation & Action Tools */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Action 1: PIN Reset */}
              <DemoWrapper tooltipText={isBn ? 'নিরাপদ ডেমো পিন পরিবর্তন' : 'Mock Card PIN Reset'} className="w-full">
                <button
                  onClick={() => setIsPinModalOpen(true)}
                  className="w-full p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition text-left flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{isBn ? 'পিন পরিবর্তন' : 'Reset Card PIN'}</span>
                      <DemoBadge label="DEMO" size="sm" pulse={false} />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isBn ? 'নিরাপদ ডেমো পিন' : 'Secure Simulation'}
                    </div>
                  </div>
                </button>
              </DemoWrapper>

              {/* Action 2: NFC Tap Simulator */}
              <DemoWrapper tooltipText={isBn ? 'POS মেশিনে ফোন স্পর্শ সিমুলেশন' : 'POS Contactless Tap Simulation'} className="w-full">
                <button
                  onClick={handleNfcTapDemo}
                  disabled={simLoading}
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 shadow-2xs hover:shadow-md transition text-left flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                      <span>{isBn ? 'NFC ট্যাপ টেস্ট' : 'NFC Tap Test'}</span>
                      <DemoBadge label="DEMO" size="sm" pulse={false} />
                    </div>
                    <div className="text-[11px] text-teal-700">
                      {isBn ? 'POS টার্মিনাল $12.50' : 'Simulate $12.50 Tap'}
                    </div>
                  </div>
                </button>
              </DemoWrapper>

              {/* Action 3: AI Fraud Risk Tester & Proactive Warning */}
              <DemoWrapper tooltipText={isBn ? 'রিয়েলটাইম ঝুঁকি প্রি-চেক ও ভবিষ্যত ভুল প্রতিরোধ' : 'Run Real-Time AI Pre-Check & Mistake Prevention Warning'} className="w-full">
                <button
                  onClick={() => {
                    setSimTxnResult(null);
                    setPreCheckResult(null);
                    setSimStep('INPUT');
                    setIsSimModalOpen(true);
                  }}
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 shadow-2xs hover:shadow-md transition text-left flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0047BA] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <span>{isBn ? 'AI প্রাক-সতর্কতা টেস্ট' : 'AI Pre-Warning Test'}</span>
                      <DemoBadge label="RUNTIME" size="sm" />
                    </div>
                    <div className="text-[11px] text-blue-700">
                      {isBn ? '৯-ধাপের ঝুঁকি বিশ্লেষণ' : '9-Dim Risk & Advice'}
                    </div>
                  </div>
                </button>
              </DemoWrapper>
            </section>
          </div>
        </div>

        {/* ================= 3. RUNTIME DATABASE TRANSACTIONS & RISK AUDIT ================= */}
        <section className="mt-8 bg-slate-50/70 rounded-3xl p-5 md:p-6 border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 text-[#0047BA]">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>{isBn ? 'ডাটাবেস লেনদেন ও রিয়েলটাইম AI ঝুঁকি লগ' : 'Database Transactions & Real-time AI Risk Audit'}</span>
                  <DemoBadge label="SUPABASE RUNTIME" size="sm" />
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  {isBn ? 'প্রতিটি লেনদেনের রানটাইম ডেভিয়েশন, ভেলোসিটি ও ৯-ধাপের ঝুঁকি স্কোর' : 'Live DB records evaluated dynamically with XGBoost & Isolation Forest'}
                </p>
              </div>
            </div>
            
            <button
              onClick={loadTransactions}
              disabled={loadingTxns}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-medium text-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer transition active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTxns ? 'animate-spin' : ''}`} />
              <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>
          </div>

          {/* Transactions List Table / Cards */}
          {loadingTxns && transactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              {isBn ? 'ডাটাবেস থেকে লেনদেন লোড হচ্ছে...' : 'Loading transactions from database runtime...'}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/60 text-xs text-slate-500">
              {isBn ? 'কোনো লেনদেন পাওয়া যায়নি।' : 'No transactions recorded yet.'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {transactions.map((txn) => (
                <div 
                  key={txn.transaction_id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-50 group-hover:text-upayBlue transition">
                      {txn.channel === 'CONTACTLESS' ? (
                        <Wifi className="w-5 h-5 rotate-90" />
                      ) : txn.channel === 'ONLINE' ? (
                        <ShoppingBag className="w-5 h-5" />
                      ) : (
                        <Radio className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{txn.merchant_name}</span>
                        {getDecisionBadge(txn.decision)}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{txn.transaction_id}</span>
                        <span>•</span>
                        <span>{new Date(txn.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span className="font-sans uppercase text-[10px] px-1.5 py-0.2 bg-slate-100 rounded">{txn.channel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Amounts & Risk Score Pill */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-slate-900">
                        ${txn.amount_usd.toFixed(2)} USD
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        ৳{txn.amount_bdt ? txn.amount_bdt.toLocaleString() : (txn.amount_usd * 122.5).toFixed(0)} BDT
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono border shadow-2xs ${getRiskColorClasses(txn.final_level || txn.risk_level)}`}>
                        Risk: {txn.composite_score || txn.risk_score}/100
                      </span>

                      <button
                        onClick={() => handleOpenAnalysis(txn.transaction_id)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-upayBlue transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                        title={isBn ? "বিস্তারিত ঝুঁকি বিশ্লেষণ দেখুন" : "View 9-dimensional AI risk breakdown"}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isBn ? "AI বিশ্লেষণ" : "Audit"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* ================= 4. PIN RESET MODAL ================= */}
      <PinKeypadModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title={isBn ? 'নতুন কার্ড পিন লিখুন' : 'Enter New Card PIN'}
        subtitle={isBn ? 'আপনার স্মার্ট কার্ডের জন্য ৪ সংখ্যার ডেমো পিন সেট করুন' : 'Set a 4-digit demo PIN for your smart card'}
        onSuccess={handlePinResetSuccess}
      />

      {/* ================= 5. AI TRANSACTION PRE-CHECK & SIMULATOR MODAL ================= */}
      {isSimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 select-none">
          <div className="relative w-full max-w-[520px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setIsSimModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-blue-100 text-upayBlue">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isBn ? 'AI কার্ড লেনদেন ও প্রাক-সতর্কতা সিস্টেম' : 'AI Card Pre-Warning & Risk Simulator'}
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  {isBn ? 'রানটাইম ডাটাবেস ডেভিয়েশন ও ৯-ধাপের ঝুঁকি মূল্যায়ন' : 'Runtime DB Deviation, Velocity & 9-Dimension Risk Breakdown'}
                </p>
              </div>
            </div>

            {/* Step 1: Input Form */}
            {simStep === 'INPUT' && (
              <div className="space-y-4">
                {/* Quick Presets */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 font-sans">
                    {isBn ? 'দ্রুত সিনারিও টেস্ট:' : 'Quick Test Scenarios:'}
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSimAmount(45.0);
                        setSimMerchant("Coursera Online");
                        setSimCountry("US");
                        setSimChannel("ONLINE");
                        setSimNewDevice(0);
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left font-medium cursor-pointer"
                    >
                      <span className="font-bold text-slate-800 block">🟢 {isBn ? 'স্বাভাবিক খরচ' : 'Normal Spending'}</span>
                      <span className="text-[10px] text-slate-500">$45 • Coursera Online</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSimAmount(850.0);
                        setSimMerchant("Unknown Terminal Lagos");
                        setSimCountry("NG");
                        setSimChannel("ONLINE");
                        setSimNewDevice(1);
                      }}
                      className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-left font-medium cursor-pointer"
                    >
                      <span className="font-bold text-rose-800 block">🔴 {isBn ? 'উচ্চ বিচ্যুতি ও সতর্কতা' : 'High Deviation Spike'}</span>
                      <span className="text-[10px] text-rose-600">$850 • New Device Spike</span>
                    </button>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isBn ? 'লেনদেনের পরিমাণ (USD)' : 'Transaction Amount (USD)'}
                    </label>
                    <input
                      type="number"
                      value={simAmount}
                      onChange={(e) => setSimAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isBn ? 'মার্চেন্টের নাম' : 'Merchant Name'}
                    </label>
                    <input
                      type="text"
                      value={simMerchant}
                      onChange={(e) => setSimMerchant(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        {isBn ? 'চ্যানেল' : 'Channel'}
                      </label>
                      <select
                        value={simChannel}
                        onChange={(e) => setSimChannel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="ONLINE">ONLINE (E-Com)</option>
                        <option value="CONTACTLESS">CONTACTLESS (NFC)</option>
                        <option value="POS">POS Terminal</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        {isBn ? 'দেশ' : 'Country'}
                      </label>
                      <select
                        value={simCountry}
                        onChange={(e) => setSimCountry(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="US">US - United States</option>
                        <option value="BD">BD - Bangladesh</option>
                        <option value="SG">SG - Singapore</option>
                        <option value="NG">NG - Nigeria</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="newDeviceCheck"
                      checked={simNewDevice === 1}
                      onChange={(e) => setSimNewDevice(e.target.checked ? 1 : 0)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="newDeviceCheck" className="text-slate-700 font-medium cursor-pointer">
                      {isBn ? 'নতুন অচেনা ডিভাইস থেকে লেনদেন' : 'Transaction from Unrecognized / New Device'}
                    </label>
                  </div>
                </div>

                {/* Step 1 Button: Pre-Check & Proactive Warning */}
                <button
                  onClick={handleRunPreCheck}
                  disabled={preCheckLoading || simAmount <= 0}
                  className="w-full py-3 rounded-2xl bg-[#0047BA] hover:bg-blue-900 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {preCheckLoading ? (
                    <span>{isBn ? 'AI প্রাক-বিশ্লেষণ চলছে...' : 'Computing Runtime Features & AI Models...'}</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isBn ? '১ম ধাপ: AI প্রাক-সতর্কতা ও ঝুঁকি বিশ্লেষণ' : 'Step 1: Check Risk & Pre-Warning'}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 2: Pre-Check Risk Breakdown & Proactive User Warning */}
            {simStep === 'PRECHECK' && preCheckResult && (
              <div className="space-y-4 animate-in fade-in duration-200">
                
                {/* PROACTIVE USER WARNING BANNER */}
                {preCheckResult.proactive_warning?.is_warning_active ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-900">
                          {isBn ? 'লেনদেনটি কিছুটা অস্বাভাবিক মনে হচ্ছে' : preCheckResult.proactive_warning.title}
                        </h4>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          {preCheckResult.proactive_warning.subtitle}
                        </p>
                      </div>
                    </div>

                    {preCheckResult.proactive_warning.reasons?.length > 0 && (
                      <div className="bg-white/80 rounded-xl p-2.5 border border-amber-200 text-[11px]">
                        <span className="font-bold text-amber-900 block mb-1">
                          {isBn ? 'অস্বাভাবিক কারণসমূহ:' : 'Unusual Factors Detected:'}
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-amber-900">
                          {preCheckResult.proactive_warning.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300/80 text-[11px]">
                      <span className="font-bold text-amber-950 block">
                        💡 {isBn ? 'পরামর্শ ও নির্দেশিকা:' : 'Recommended Action:'}
                      </span>
                      <p className="text-amber-900 mt-0.5">{preCheckResult.proactive_warning.recommended_action}</p>
                    </div>

                    <p className="text-[10px] text-amber-700 italic">
                      ℹ️ {preCheckResult.proactive_warning.disclaimer}
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900">
                        {isBn ? 'স্বাভাবিক লেনদেন প্রোফাইল' : 'Normal Spending Profile'}
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        {isBn ? 'আপনার সাধারণ ব্যয়ের সাথে সামঞ্জস্যপূর্ণ।' : 'Transaction matches your historical spending patterns.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* COMPOSITE SCORE & SUMMARY */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      {isBn ? 'প্রত্যাশিত সিদ্ধান্ত' : 'Preliminary Decision'}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {getDecisionBadge(preCheckResult.decision)}
                      <span className="font-mono text-[11px] text-slate-600">Level: {preCheckResult.final_level}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Composite Score</span>
                    <span className="text-base font-extrabold font-mono text-slate-900">
                      {preCheckResult.composite_score}/100
                    </span>
                  </div>
                </div>

                {/* 9-DIMENSIONAL RISK BREAKDOWN CARDS */}
                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2 font-sans">
                    {isBn ? '৯-ধাপের ঝুঁকি বিভাজন (Risk Breakdown):' : '9-Dimension Risk Type Scores:'}
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(preCheckResult.risk || {}).map(([key, dim]: [string, any]) => (
                      <div key={key} className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800 capitalize text-[11px]">{key.replace('_', ' ')}</span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${getRiskColorClasses(dim.level)}`}>
                            {dim.score} • {dim.level}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mb-1">
                          <div 
                            className={`h-full ${dim.score > 70 ? 'bg-rose-500' : dim.score > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${dim.score}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">{dim.reason}</p>
                        <span className="text-[9px] text-slate-400 font-mono block mt-1">Source: {dim.source}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 2 Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSimStep('INPUT')}
                    className="w-1/3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer text-center"
                  >
                    {isBn ? 'পুনরায় পরিবর্তন' : 'Edit Input'}
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteSimTxn}
                    disabled={simLoading || preCheckResult.decision === 'DECLINED'}
                    className={`w-2/3 py-2.5 rounded-2xl font-bold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                      preCheckResult.decision === 'DECLINED'
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : preCheckResult.decision === 'CHALLENGE_REQUIRED' || preCheckResult.decision === 'HELD_FOR_REVIEW'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {simLoading ? (
                      <span>{isBn ? 'লেনদেন কার্যকর হচ্ছে...' : 'Executing in Database...'}</span>
                    ) : preCheckResult.decision === 'DECLINED' ? (
                      <span>{isBn ? 'ঝুঁকির কারণে ব্লকড' : 'Blocked by Policy'}</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isBn ? '২য় ধাপ: লেনদেন নিশ্চিত করুন' : 'Step 2: Confirm & Execute'}</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

            {/* Step 3: Executed Result */}
            {simStep === 'EXECUTED' && simTxnResult && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className={`p-4 rounded-2xl border text-xs ${
                  simTxnResult.decision === 'APPROVED' || simTxnResult.decision === 'ALLOW'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : simTxnResult.decision === 'CHALLENGE_REQUIRED' || simTxnResult.decision === 'CHALLENGE_2FA'
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {simTxnResult.decision === 'APPROVED' || simTxnResult.decision === 'ALLOW' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      )}
                      <span className="font-bold uppercase">
                        {isBn ? 'লেনদেন সম্পন্ন:' : 'Executed:'} {simTxnResult.decision}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-white font-mono font-bold shadow-xs">
                      Txn #{simTxnResult.transaction_id}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] pt-1">
                    <p><strong>{isBn ? 'মার্চেন্ট:' : 'Merchant:'}</strong> {simTxnResult.merchant_name} (${simTxnResult.amount_usd.toFixed(2)})</p>
                    <p><strong>{isBn ? 'ঝুঁকি স্কোর:' : 'Composite Risk Score:'}</strong> {simTxnResult.composite_score || simTxnResult.risk_score}/100 ({simTxnResult.final_level || simTxnResult.risk_level})</p>
                    <p><strong>{isBn ? 'স্ট্যাটাস:' : 'Recorded Status:'}</strong> {simTxnResult.status}</p>
                    {simTxnResult.recommended_action && (
                      <p><strong>{isBn ? 'প্রস্তাবিত পদক্ষেপ:' : 'Recommended Action:'}</strong> {simTxnResult.recommended_action}</p>
                    )}
                  </div>

                  {simTxnResult.reasons?.length > 0 && (
                    <div className="pt-2 border-t border-black/10 mt-2 text-[11px]">
                      <span className="font-bold block mb-1">
                        {isBn ? 'ব্যাখ্যা ও কারণসমূহ (SHAP XAI):' : 'SHAP XAI Explanation:'}
                      </span>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {simTxnResult.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSimStep('INPUT');
                    setIsSimModalOpen(false);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs transition cursor-pointer text-center"
                >
                  {isBn ? 'বন্ধ করুন ও ড্যাশবোর্ডে ফিরুন' : 'Close & Return to Dashboard'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ================= 6. HISTORICAL TRANSACTION AI RISK BREAKDOWN MODAL ================= */}
      {selectedTxnAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 select-none">
          <div className="relative w-full max-w-[500px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setSelectedTxnAnalysis(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-blue-100 text-upayBlue">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isBn ? 'রিয়েলটাইম AI ঝুঁকি বিশ্লেষণ অডিট' : 'Runtime AI Risk Analysis Audit'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Txn ID: {selectedTxnAnalysis.transaction_id}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    ⚡ AI analyzed from runtime transaction history (Supabase Cloud PostgreSQL)
                  </span>
                </div>
              </div>
            </div>

            {/* Header Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-4 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{selectedTxnAnalysis.merchant_name}</span>
                <span className="font-mono font-bold text-slate-900">${selectedTxnAnalysis.amount_usd.toFixed(2)} USD</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>Channel: {selectedTxnAnalysis.channel} • {selectedTxnAnalysis.country}</span>
                <span>{getDecisionBadge(selectedTxnAnalysis.decision)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span>Risk Score: <strong>{selectedTxnAnalysis.risk_score}/100</strong> ({selectedTxnAnalysis.risk_level})</span>
                <span className="font-mono text-slate-500">{selectedTxnAnalysis.model_version || "XGBoost-v1.2"}</span>
              </div>
            </div>

            {/* 9 Dimensions Breakdown */}
            <div className="space-y-3 mb-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                {isBn ? '৯-ধাপের ঝুঁকি বিশ্লেষণ স্কোর:' : '9-Dimension Risk Breakdown Matrix:'}
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(selectedTxnAnalysis.risk || {}).map(([dimKey, dimVal]: [string, any]) => (
                  <div key={dimKey} className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold capitalize text-slate-800 text-[11px]">{dimKey.replace('_', ' ')}</span>
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${getRiskColorClasses(dimVal.level)}`}>
                        {dimVal.score} • {dimVal.level}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">{dimVal.reason}</p>
                    <span className="text-[9px] text-slate-400 font-mono block mt-1">Source: {dimVal.source}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reasons / SHAP XAI */}
            {selectedTxnAnalysis.reasons?.length > 0 && (
              <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200/80 text-xs mb-4">
                <span className="font-bold text-upayBlue block mb-1">
                  {isBn ? 'মডেল সিদ্ধান্ত ও যুক্তি (SHAP XAI):' : 'Model Decisions & XAI Factors:'}
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[11px]">
                  {selectedTxnAnalysis.reasons.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => setSelectedTxnAnalysis(null)}
              className="w-full py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs cursor-pointer text-center"
            >
              {isBn ? 'বন্ধ করুন' : 'Close'}
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
