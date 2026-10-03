import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { DemoBadge, DemoWrapper } from '../../shared/DemoBadge';
import { 
  Phone, PhoneOff, Mic, Volume2, ShieldCheck, ShieldAlert, 
  Sparkles, KeyRound, ArrowRight, UserCheck, AlertTriangle, CheckCircle2, MessageSquare
} from 'lucide-react';

export const VoiceView: React.FC = () => {
  const { language, t } = useApp();
  const isBn = language === 'bn';
  const [callActive, setCallActive] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [transcripts, setTranscripts] = useState<Array<{ speaker: string; text: string; time: string }>>([]);
  const [loadingTool, setLoadingTool] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyPin, setVerifyPin] = useState("1234");
  const [verifyFatherName, setVerifyFatherName] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Speak text with Web Speech API
  const speakBengali = (text: string) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'bn-BD';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  const handleStartCall = async () => {
    try {
      const res: any = await api.startVoiceSession('01771449164');
      setCallId(res.call_id);
      setCallActive(true);
      setVerified(res.verified);
      const newT = [{
        speaker: 'AI_AGENT',
        text: res.welcome_message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
      setTranscripts(newT);
      speakBengali(res.welcome_message);
      showToast("ভয়েস সেশন শুরু হয়েছে");
    } catch (e: any) {
      showToast(e.message || "কল শুরু করা যায়নি");
    }
  };

  const handleEndCall = () => {
    setCallActive(false);
    setCallId(null);
    setVerified(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    showToast("কল শেষ হয়েছে");
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callId) return;

    try {
      const res: any = await api.verifyVoiceCaller({
        call_id: callId,
        voice_pin: verifyPin,
        father_name: verifyFatherName
      });

      if (res.verified) {
        setVerified(true);
        setIsVerifyModalOpen(false);
        const t = {
          speaker: 'AI_AGENT',
          text: res.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setTranscripts(prev => [...prev, t]);
        speakBengali(res.message);
        showToast("কলার ভেরিফিকেশন সম্পন্ন হয়েছে!");
      } else {
        showToast(res.message);
      }
    } catch (e: any) {
      showToast(e.message || "ভেরিফিকেশন ব্যর্থ হয়েছে");
    }
  };

  const handleCallTool = async (toolName: string, promptText: string, args: any = {}) => {
    if (!callId) return;

    // Add user query to transcript
    const userT = {
      speaker: 'CALLER',
      text: promptText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTranscripts(prev => [...prev, userT]);

    setLoadingTool(true);
    try {
      const res: any = await api.executeVoiceTool({
        call_id: callId,
        tool_name: toolName,
        arguments: args
      });

      const aiT = {
        speaker: 'AI_AGENT',
        text: res.ai_spoken_response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setTranscripts(prev => [...prev, aiT]);
      speakBengali(res.ai_spoken_response);

      if (res.should_escalate) {
        showToast("কলটি সিনিয়র স্পেশালিস্টে এসকেলেট করা হয়েছে!");
      }
    } catch (e: any) {
      showToast(e.message || "টুল এক্সেকিউশন ব্যর্থ হয়েছে");
    } finally {
      setLoadingTool(false);
    }
  };

  return (
    <div className="space-y-5 pb-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-slate-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top duration-200">
          {toastMsg}
        </div>
      )}

      {/* 1. CALL CONTROLLER HERO */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden text-center border border-slate-800">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-bold tracking-wider uppercase text-amber-300">
            <Sparkles className="w-3.5 h-3.5" /> Realtime Voice Agent
          </div>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-full border transition ${
              audioEnabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title="ভয়েস অডিও অন/অফ"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Big Avatar / Waveform */}
        <div className="my-4 flex flex-col items-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center p-1 border-4 transition-all duration-300 ${
            callActive ? 'border-emerald-400 shadow-emerald-500/40 shadow-2xl scale-105' : 'border-slate-700 bg-slate-800'
          }`}>
            <div className="w-full h-full rounded-full bg-upayBlue flex items-center justify-center text-white">
              {callActive ? <Mic className="w-10 h-10 animate-pulse text-amber-300" /> : <Phone className="w-10 h-10 text-white/60" />}
            </div>
          </div>

          {callActive && (
            <div className="flex items-center gap-1 mt-4">
              <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-6 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-8 bg-amber-400 rounded-full animate-bounce" />
              <span className="w-1 h-6 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            </div>
          )}

          <h3 className="text-base font-bold mt-3 flex items-center justify-center gap-2">
            <span>
              {callActive
                ? (isBn ? 'উপায় এআই ভয়েস অ্যাসিস্ট্যান্ট (সক্রিয়)' : 'Upay Voice Assistant (Active)')
                : (isBn ? 'উপায় ১৬২৪৭ ভয়েস সাপোর্ট' : 'Upay 16247 Voice Support')}
            </span>
            <DemoBadge label="VOICE AI" size="sm" />
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            {callActive
              ? (verified
                  ? (isBn ? '🟢 কলার যাচাইকৃত (Verified Session)' : '🟢 Caller Verified (Authorized Session)')
                  : (isBn ? '🟡 যাচাই বাকি (Verification Challenge Pending)' : '🟡 Verification Pending'))
              : (isBn ? 'কল শুরু করতে নিচের বাটনে চাপ দিন' : 'Press button below to simulate incoming/outgoing call')}
          </p>
        </div>

        {/* Call Action Button */}
        {!callActive ? (
          <DemoWrapper tooltipText={isBn ? '১৬২৪৭ ভয়েস এজেন্টের সাথে কল শুরু করুন (ডেমো)' : 'Simulate 16247 Voice Session (Demo)'}>
            <button
              onClick={handleStartCall}
              className="w-full max-w-[280px] py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer mx-auto"
            >
              <Phone className="w-5 h-5" />
              <span>{isBn ? '১৬২৪৭ হেল্পলাইনে কল করুন' : 'Call 16247 Helpline'}</span>
              <DemoBadge label="DEMO" size="sm" pulse={false} />
            </button>
          </DemoWrapper>
        ) : (
          <div className="flex items-center justify-center gap-3">
            {!verified && (
              <DemoWrapper tooltipText={isBn ? 'নিরাপত্তা পিন দিয়ে কলার যাচাই করুন' : 'Verify caller identity with PIN challenge'}>
                <button
                  onClick={() => setIsVerifyModalOpen(true)}
                  className="px-4 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isBn ? 'পরিচয় নিশ্চিত করুন' : 'Verify Identity'}</span>
                  <DemoBadge label="CHALLENGE" size="sm" pulse={false} />
                </button>
              </DemoWrapper>
            )}

            <button
              onClick={handleEndCall}
              className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wide shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>{isBn ? 'কল শেষ করুন' : 'End Call'}</span>
            </button>
          </div>
        )}

      </section>

      {/* 2. CALL CONTROLLED TOOLS (When Call Active) */}
      {callActive && (
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 font-bengali uppercase tracking-wider">
              ভয়েস কমান্ড / নিয়ন্ত্রিত অ্যাকাউন্ট টুলস
            </h4>
            <span className="text-[10px] text-slate-400 font-sans">Controlled Allow-list Tools</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left">
            
            <button
              onClick={() => handleCallTool("get_account_summary", "আমার অ্যাকাউন্ট ব্যালেন্স কত আছে?")}
              disabled={loadingTool}
              className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition text-xs font-medium cursor-pointer"
            >
              <span className="font-bold text-slate-900 block font-bengali">💰 ব্যালেন্স জানুন</span>
              <span className="text-[10px] text-slate-500">get_account_summary</span>
            </button>

            <button
              onClick={() => handleCallTool("get_recent_transactions", "আমার শেষ কয়েকটি লেনদেনের তথ্য দিন")}
              disabled={loadingTool}
              className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition text-xs font-medium cursor-pointer"
            >
              <span className="font-bold text-slate-900 block font-bengali">📜 শেষ লেনদেনসমূহ</span>
              <span className="text-[10px] text-slate-500">get_recent_transactions</span>
            </button>

            <button
              onClick={() => handleCallTool("get_card_status", "আমার স্মার্ট কার্ডের এনডোর্সমেন্ট ব্যালেন্স কত?")}
              disabled={loadingTool}
              className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition text-xs font-medium cursor-pointer"
            >
              <span className="font-bold text-slate-900 block font-bengali">💳 কার্ড ও ইউএসডি কোটা</span>
              <span className="text-[10px] text-slate-500">get_card_status</span>
            </button>

            <button
              onClick={() => handleCallTool("get_case_status", "আমার সক্রিয় অভিযোগের অবস্থা কী?")}
              disabled={loadingTool}
              className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition text-xs font-medium cursor-pointer"
            >
              <span className="font-bold text-slate-900 block font-bengali">📋 কেস ট্র্যাকিং স্ট্যাটাস</span>
              <span className="text-[10px] text-slate-500">get_case_status</span>
            </button>

            <button
              onClick={() => handleCallTool("create_case", "আমার কিউআর পেমেন্টে ১৪০০ টাকা কেটেছে কিন্তু দোকানদার পায়নি, কেস খুলুন", {
                complaint_text: "Customer reported grocery QR deduction delayed via phone call",
                category: "PAYMENT"
              })}
              disabled={loadingTool}
              className="p-3 rounded-2xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition text-xs font-medium cursor-pointer"
            >
              <span className="font-bold text-amber-900 block font-bengali">🚨 অভিযোগ কেস তৈরি</span>
              <span className="text-[10px] text-amber-700">create_case (Voice Dispatch)</span>
            </button>

            <button
              onClick={() => handleCallTool("escalate_case", "আমাকে একজন সিনিয়র ম্যানেজারের কাছে পাঠান", {})}
              disabled={loadingTool}
              className="p-3 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition text-xs font-medium cursor-pointer"
            >
              <span className="font-bold text-rose-900 block font-bengali">👨‍💼 হিউম্যান এসকেলেশন</span>
              <span className="text-[10px] text-rose-700">escalate_to_human_agent</span>
            </button>

          </div>
        </section>
      )}

      {/* 3. LIVE TRANSCRIPT SECTION */}
      {callActive && (
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
            <MessageSquare className="w-4 h-4 text-upayBlue" />
            <h4 className="text-xs font-bold text-slate-900 font-bengali">রিয়েলটাইম অডিও ট্রান্সক্রিপ্ট</h4>
          </div>

          <div className="space-y-3 max-h-[260px] overflow-y-auto no-scrollbar pr-1">
            {transcripts.map((t, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col ${t.speaker === 'CALLER' ? 'items-end' : 'items-start'}`}
              >
                <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                  t.speaker === 'CALLER'
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-slate-100 text-slate-900 rounded-bl-xs'
                }`}>
                  <div className="text-[10px] font-bold opacity-75 mb-0.5 font-sans">
                    {t.speaker === 'CALLER' ? 'আপনি (Customer)' : 'উপায় এআই অ্যাসিস্ট্যান্ট'}
                  </div>
                  <div className="font-bengali">{t.text}</div>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">{t.time}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. VERIFICATION CHALLENGE MODAL */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 select-none">
          <div className="relative w-full max-w-[380px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 rounded-xl bg-blue-50 text-upayBlue">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-bengali">কলার আইডেন্টিটি ভেরিফিকেশন</h3>
                <p className="text-xs text-slate-400 font-bengali">ব্যালেন্স ও স্পর্শকাতর তথ্য দেখার পূর্বে যাচাইকরণ</p>
              </div>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1 font-bengali">৪ সংখ্যার পিন নম্বর (Default: 1234)</label>
                <input
                  type="password"
                  maxLength={4}
                  value={verifyPin}
                  onChange={(e) => setVerifyPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-sm tracking-widest text-center focus:outline-none focus:border-upayBlue"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 font-bengali">অথবা পিতার নাম (বিকল্প ভেরিফিকেশন)</label>
                <input
                  type="text"
                  placeholder="যেমন: MD. SHAHIDUL ISLAM"
                  value={verifyFatherName}
                  onChange={(e) => setVerifyFatherName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-upayBlue"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-bengali"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-upayBlue hover:bg-upayNavy text-white font-bold font-bengali shadow-md"
                >
                  যাচাই করুন
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
