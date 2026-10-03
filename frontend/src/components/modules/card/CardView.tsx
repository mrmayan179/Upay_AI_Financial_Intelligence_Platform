import React, { useState } from 'react';
import { Card as CardType, CardTransaction } from '../../../types';
import { UpaySmartCardVisual } from './UpaySmartCardVisual';
import { PinKeypadModal } from '../../shared/PinKeypadModal';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { DemoBadge, DemoWrapper } from '../../shared/DemoBadge';
import { 
  ShieldCheck, ShieldAlert, Wifi, Globe, ShoppingBag, 
  Lock, KeyRound, Radio, PlayCircle, CheckCircle2, AlertTriangle, X
} from 'lucide-react';

interface CardViewProps {
  card: CardType | null;
  onRefresh: () => void;
}

export const CardView: React.FC<CardViewProps> = ({ card, onRefresh }) => {
  const { language, t } = useApp();
  const isBn = language === 'bn';
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [simTxnResult, setSimTxnResult] = useState<CardTransaction | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Simulation form state
  const [simAmount, setSimAmount] = useState(45.0);
  const [simMerchant, setSimMerchant] = useState("Coursera Inc.");
  const [simChannel, setSimChannel] = useState("ONLINE");
  const [simCountry, setSimCountry] = useState("US");
  const [simNewDevice, setSimNewDevice] = useState(0);

  if (!card) {
    return (
      <div className="p-8 text-center text-slate-500 font-sans">
        {isBn ? 'কার্ড লোড হচ্ছে...' : 'Loading card...'}
      </div>
    );
  }

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const toggleSetting = async (field: string, val: boolean) => {
    try {
      await api.updateCardSettings(card.card_id, { [field]: val });
      onRefresh();
      showToast(`সেটিংস সফলভাবে আপডেট হয়েছে`);
    } catch (e: any) {
      showToast(e.message || "আপডেট ব্যর্থ হয়েছে");
    }
  };

  const handleFreezeToggle = async () => {
    try {
      await api.freezeCard(card.card_id);
      onRefresh();
      showToast(card.status === 'FROZEN' ? 'কার্ড আনফ্রিজ করা হয়েছে' : 'কার্ড ফ্রিজ করা হয়েছে');
    } catch (e: any) {
      showToast(e.message || "ব্যর্থ হয়েছে");
    }
  };

  const handlePinResetSuccess = async (newPin: string) => {
    try {
      await api.resetCardPin(card.card_id, "1234", newPin);
      setIsPinModalOpen(false);
      showToast("কার্ড পিন সফলভাবে পরিবর্তন করা হয়েছে!");
    } catch (e: any) {
      showToast(e.message || "পিন পরিবর্তন ব্যর্থ হয়েছে");
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
      setIsSimModalOpen(true);
      onRefresh();
    } catch (e: any) {
      showToast(e.message || "NFC লেনদেন ব্যর্থ হয়েছে");
    } finally {
      setSimLoading(false);
    }
  };

  // Run Custom Transaction Simulation
  const handleExecuteSimTxn = async () => {
    setSimLoading(true);
    try {
      const res: any = await api.simulateCardTransaction({
        card_id: card.card_id,
        amount_usd: simAmount,
        merchant_name: simMerchant,
        channel: simChannel,
        country: simCountry,
        is_new_merchant: simMerchant.includes("Unknown") ? 1 : 0,
        is_new_device: simNewDevice
      });
      setSimTxnResult(res);
      onRefresh();
    } catch (e: any) {
      showToast(e.message || "লেনদেন বিশ্লেষণ ব্যর্থ হয়েছে");
    } finally {
      setSimLoading(false);
    }
  };

  const usedPercent = Math.min(100, Math.round((card.used_usd / Math.max(1, card.endorsement_usd)) * 100));

  return (
    <div className="space-y-5 pb-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-slate-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top duration-200">
          {toastMsg}
        </div>
      )}

      {/* 1. VISUAL 3D FLIP CARD */}
      <section className="pt-1">
        <UpaySmartCardVisual card={card} />
      </section>

      {/* 2. USD ENDORSEMENT TRACKER CARD */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-sans uppercase tracking-wider">USD Endorsement Quota</h3>
            <p className="text-xs text-slate-500 font-bengali">পাসপোর্ট বার্ষিক ট্রাভেল কোটা বরাদ্দ</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-upayBlue border border-blue-100 font-sans">
            {usedPercent}% Used
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500" 
            style={{ width: `${usedPercent}%` }}
          />
        </div>

        {/* 3 Metric Columns */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Total Quota</span>
            <span className="text-base font-extrabold text-slate-900 font-mono">${card.endorsement_usd.toFixed(0)}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Used USD</span>
            <span className="text-base font-extrabold text-amber-600 font-mono">${card.used_usd.toFixed(2)}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100">
            <span className="text-[11px] text-emerald-700 font-medium block">Available</span>
            <span className="text-base font-extrabold text-emerald-800 font-mono">${card.available_usd.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* 3. CARD CONTROLS TOGGLES */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 font-bengali mb-1">কার্ড সিকিউরিটি ও চ্যানেল নিয়ন্ত্রণ</h3>
        
        {/* Toggle 1: Card Active / Freeze */}
        <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.card_enabled ? 'bg-blue-100 text-upayBlue' : 'bg-rose-100 text-rose-600'}`}>
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 font-bengali">কার্ড স্ট্যাটাস (Card Power)</div>
              <div className="text-xs text-slate-500">{card.card_enabled ? 'কার্ড সক্রিয় আছে' : 'কার্ডটি সাময়িক ফ্রিজ করা'}</div>
            </div>
          </div>
          <button
            onClick={handleFreezeToggle}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${card.card_enabled ? 'bg-upayBlue' : 'bg-slate-300'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${card.card_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Toggle 2: Online Transactions */}
        <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 font-bengali">অনলাইন পেমেন্ট (E-Commerce)</div>
              <div className="text-xs text-slate-500">ই-কমার্স এবং অ্যাপে কার্ড ব্যবহারের অনুমতি</div>
            </div>
          </div>
          <button
            onClick={() => toggleSetting('online_enabled', !card.online_enabled)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${card.online_enabled ? 'bg-upayBlue' : 'bg-slate-300'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${card.online_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Toggle 3: International Payments */}
        <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 font-bengali">আন্তর্জাতিক লেনদেন (USD)</div>
              <div className="text-xs text-slate-500">বিদেশে অথবা আন্তর্জাতিক ওয়েবসাইটে লেনদেন</div>
            </div>
          </div>
          <button
            onClick={() => toggleSetting('international_enabled', !card.international_enabled)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${card.international_enabled ? 'bg-upayBlue' : 'bg-slate-300'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${card.international_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Toggle 4: NFC / Contactless */}
        <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Wifi className="w-5 h-5 rotate-90" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 font-bengali">ট্যাপ অ্যান্ড গো (NFC Contactless)</div>
              <div className="text-xs text-slate-500">POS মেশিনে কার্ড স্পর্শ করে দ্রুত পেমেন্ট</div>
            </div>
          </div>
          <button
            onClick={() => toggleSetting('nfc_enabled', !card.nfc_enabled)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${card.nfc_enabled ? 'bg-upayBlue' : 'bg-slate-300'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${card.nfc_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </section>

      {/* 4. ACTIONS: PIN RESET, NFC DEMO & AI TRANSACTION TESTER */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Action 1: PIN Reset */}
        <DemoWrapper tooltipText={isBn ? 'নিরাপদ ডেমো পিন পরিবর্তন' : 'Mock Card PIN Reset'} className="w-full">
          <button
            onClick={() => setIsPinModalOpen(true)}
            className="w-full p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition text-left flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>{isBn ? 'পিন পরিবর্তন করুন' : 'Reset Card PIN'}</span>
                <DemoBadge label="DEMO" size="sm" pulse={false} />
              </div>
              <div className="text-[11px] text-slate-500">
                {isBn ? 'নিরাপদ ডেমো পিন সেটআপ' : 'Secure Enclave Simulation'}
              </div>
            </div>
          </button>
        </DemoWrapper>

        {/* Action 2: NFC Tap Simulator */}
        <DemoWrapper tooltipText={isBn ? 'POS মেশিনে ফোন স্পর্শ সিমুলেশন' : 'POS Contactless Tap Simulation'} className="w-full">
          <button
            onClick={handleNfcTapDemo}
            disabled={simLoading}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 shadow-sm hover:shadow-md transition text-left flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <span>{isBn ? 'NFC ফোন-ট্যাপ টেস্ট' : 'NFC Tap Simulation'}</span>
                <DemoBadge label="DEMO" size="sm" pulse={false} />
              </div>
              <div className="text-[11px] text-teal-700">
                {isBn ? 'POS টার্মিনালে $12.50 ট্যাপ টেস্ট' : 'Simulate $12.50 POS Tap'}
              </div>
            </div>
          </button>
        </DemoWrapper>

        {/* Action 3: AI Fraud Risk Tester */}
        <DemoWrapper tooltipText={isBn ? 'XGBoost ও Isolation Forest রিয়েলটাইম রিস্ক টেস্ট' : 'Test Real-Time Fraud & Anomaly Inferences'} className="w-full">
          <button
            onClick={() => {
              setSimTxnResult(null);
              setIsSimModalOpen(true);
            }}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 shadow-sm hover:shadow-md transition text-left flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0047BA] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <span>{isBn ? 'AI রিয়েলটাইম রিস্ক টেস্টার' : 'AI Risk Evaluator'}</span>
                <DemoBadge label="AI LIVE" size="sm" />
              </div>
              <div className="text-[11px] text-blue-700">
                {isBn ? 'XGBoost ও অ্যানোমালি টেস্ট' : 'XGBoost & IForest Test'}
              </div>
            </div>
          </button>
        </DemoWrapper>
      </section>

      {/* PIN RESET MODAL */}
      <PinKeypadModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title={isBn ? 'নতুন কার্ড পিন লিখুন' : 'Enter New Card PIN'}
        subtitle={isBn ? 'আপনার স্মার্ট কার্ডের জন্য ৪ সংখ্যার ডেমো পিন সেট করুন' : 'Set a 4-digit demo PIN for your smart card'}
        onSuccess={handlePinResetSuccess}
      />

      {/* AI TRANSACTION SIMULATOR MODAL */}
      {isSimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 select-none">
          <div className="relative w-full max-w-[440px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setIsSimModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-blue-100 text-upayBlue">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-bengali">AI কার্ড লেনদেন রিস্ক সিমুলেটর</h3>
                <p className="text-xs text-slate-500 font-sans">Real-time XGBoost + Isolation Forest Risk Analysis</p>
              </div>
            </div>

            {/* Test Case Preset Buttons */}
            <div className="mb-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 font-sans">Quick Scenarios:</span>
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
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left font-medium"
                >
                  <span className="font-bold text-slate-800 block">🟢 Normal Spend</span>
                  <span className="text-[10px] text-slate-500">$45 • Coursera Online</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimAmount(850.0);
                    setSimMerchant("Unknown International Terminal");
                    setSimCountry("NG");
                    setSimChannel("ONLINE");
                    setSimNewDevice(1);
                  }}
                  className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-left font-medium"
                >
                  <span className="font-bold text-rose-800 block">🔴 High Risk Fraud</span>
                  <span className="text-[10px] text-rose-600">$850 • New Device Spike</span>
                </button>
              </div>
            </div>

            {/* Input Controls */}
            <div className="space-y-3 mb-5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Transaction Amount (USD)</label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-sm focus:outline-none focus:border-upayBlue"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Merchant Counterparty</label>
                <input
                  type="text"
                  value={simMerchant}
                  onChange={(e) => setSimMerchant(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-upayBlue"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Channel</label>
                  <select
                    value={simChannel}
                    onChange={(e) => setSimChannel(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-upayBlue"
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="POS">POS Terminal</option>
                    <option value="CONTACTLESS">CONTACTLESS Tap</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Country</label>
                  <select
                    value={simCountry}
                    onChange={(e) => setSimCountry(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-upayBlue"
                  >
                    <option value="BD">BD (Domestic)</option>
                    <option value="US">US (International)</option>
                    <option value="SG">SG (Singapore)</option>
                    <option value="NG">NG (High Risk Flag)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={handleExecuteSimTxn}
              disabled={simLoading}
              className="w-full py-2.5 rounded-2xl bg-upayBlue hover:bg-upayNavy text-white font-bold text-xs tracking-wide shadow-md transition disabled:opacity-50 cursor-pointer mb-4"
            >
              {simLoading ? "AI মডেল বিশ্লেষণ করছে..." : "AI রিস্ক ইঞ্জিন রান করুন"}
            </button>

            {/* Result Box */}
            {simTxnResult && (
              <div className={`p-4 rounded-2xl border text-xs animate-in fade-in duration-300 ${
                simTxnResult.decision === 'ALLOW' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : simTxnResult.decision === 'CHALLENGE_2FA'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {simTxnResult.decision === 'ALLOW' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    )}
                    <span className="font-bold font-sans uppercase">Decision: {simTxnResult.decision}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white font-mono font-bold shadow-xs">
                    Score: {simTxnResult.risk_score}/100
                  </span>
                </div>

                <div className="space-y-1 pt-1 text-[11px]">
                  <p><strong>Merchant:</strong> {simTxnResult.merchant_name} (${simTxnResult.amount_usd.toFixed(2)})</p>
                  <p><strong>Risk Level:</strong> {simTxnResult.risk_level}</p>
                  <p><strong>Status:</strong> {simTxnResult.status}</p>
                  
                  {simTxnResult.reasons && simTxnResult.reasons.length > 0 && (
                    <div className="pt-2 border-t border-black/10 mt-2">
                      <span className="font-bold block mb-1">SHAP XAI / Rule Reasons:</span>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {simTxnResult.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
