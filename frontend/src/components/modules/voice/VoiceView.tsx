import React, { useState } from 'react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { DemoBadge, DemoWrapper } from '../../shared/DemoBadge';
import { UpayPageHeader } from '../../shared/UpayPageHeader';
import { UserProfile } from '../../../types';
import { 
  Phone, PhoneOff, Mic, Volume2, ShieldCheck, ShieldAlert, 
  Sparkles, KeyRound, ArrowRight, UserCheck, AlertTriangle, CheckCircle2, MessageSquare
} from 'lucide-react';

interface VoiceViewProps {
  profile?: UserProfile | null;
  onOpenBalanceSheet?: () => void;
  onOpenNotifications?: () => void;
}

export const VoiceView: React.FC<VoiceViewProps> = ({
  profile,
  onOpenBalanceSheet,
  onOpenNotifications
}) => {
  const { language, t, viewMode } = useApp();
  const isBn = language === 'bn';
  const isDesktop = viewMode === 'desktop';

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
      utterance.lang = isBn ? 'bn-BD' : 'en-US';
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
        text: isBn 
          ? (res.welcome_message || 'স্বাগতম উপায় ১৬২৪৭ হেল্পলাইনে। আমি আপনার এআই কেয়ার অ্যাসিস্ট্যান্ট। কীভাবে সাহায্য করতে পারি?')
          : 'Welcome to Upay 16247 AI Helpline. I am your automated care assistant. How may I assist you today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
      setTranscripts(newT);
      speakBengali(newT[0].text);
      showToast(isBn ? "ভয়েস সেশন শুরু হয়েছে" : "Voice helpline session started");
    } catch (e: any) {
      showToast(e.message || (isBn ? "কল শুরু করা যায়নি" : "Failed to start call"));
    }
  };

  const handleEndCall = () => {
    setCallActive(false);
    setCallId(null);
    setVerified(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    showToast(isBn ? "কল শেষ হয়েছে" : "Call session ended");
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
          text: isBn ? res.message : 'Identity successfully verified. You now have access to balance and confidential services.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setTranscripts(prev => [...prev, t]);
        speakBengali(t.text);
        showToast(isBn ? "কলার ভেরিফিকেশন সম্পন্ন হয়েছে!" : "Caller identity verified successfully!");
      } else {
        showToast(res.message);
      }
    } catch (e: any) {
      showToast(e.message || (isBn ? "ভেরিফিকেশন ব্যর্থ হয়েছে" : "Verification challenge failed"));
    }
  };

  const handleCallTool = async (toolName: string, promptText: string, args: any = {}) => {
    if (!callId) return;

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
        showToast(isBn ? "কলটি সিনিয়র স্পেশালিস্টে এসকেলেট করা হয়েছে!" : "Call escalated to senior supervisor queue!");
      }
    } catch (e: any) {
      showToast(e.message || (isBn ? "টুল এক্সেকিউশন ব্যর্থ হয়েছে" : "Tool execution failed"));
    } finally {
      setLoadingTool(false);
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
        moduleName={isBn ? 'এআই ভয়েস কেয়ার' : '24/7 AI Voice Care'}
        moduleBadge="16247 HELPLINE"
        profile={profile}
        onOpenBalanceSheet={onOpenBalanceSheet}
        onOpenNotifications={onOpenNotifications}
      />

      {/* ================= 2. MAIN VOICE VIEW CONTENT ================= */}
      <div className={`w-full ${isDesktop ? 'px-6 md:px-8 py-6' : 'p-4'} space-y-6`}>
        
        {/* Desktop 2-Column Responsive Layout */}
        <div className={`grid grid-cols-1 ${isDesktop ? 'lg:grid-cols-12 gap-8 items-start' : 'gap-5'}`}>
          
          {/* LEFT COLUMN: Call Dial & Controller */}
          <div className={`${isDesktop ? 'lg:col-span-5 space-y-6' : 'space-y-5'}`}>
            
            {/* Call Controller Hero Card */}
            <section className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden text-center border border-slate-800">
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-bold tracking-wider uppercase text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" /> 
                  <span>{isBn ? 'রিয়েলটাইম ভয়েস এজেন্ট' : 'Realtime Voice Agent'}</span>
                </div>
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`p-2 rounded-full border transition cursor-pointer ${
                    audioEnabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                  title={isBn ? "ভয়েস অডিও অন/অফ" : "Toggle voice synthesis audio"}
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
                      : (isBn ? 'উপায় ১৬২৪৭ ভয়েস সাপোর্ট' : 'Upay 16247 Helpline Support')}
                  </span>
                  <DemoBadge label="VOICE AI" size="sm" />
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {callActive
                    ? (verified
                        ? (isBn ? '🟢 কলার যাচাইকৃত (Verified Session)' : '🟢 Caller Verified (Authorized Session)')
                        : (isBn ? '🟡 যাচাই বাকি (Verification Challenge Pending)' : '🟡 Identity Verification Pending'))
                    : (isBn ? 'কল শুরু করতে নিচের বাটনে চাপ দিন' : 'Click the button below to start voice call')}
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

            {/* Quick Action Commands (When Call Active) */}
            {callActive && (
              <section className="bg-slate-50/70 rounded-3xl p-5 shadow-xs border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                    {isBn ? 'ভয়েস কমান্ড / নিয়ন্ত্রিত অ্যাকাউন্ট অ্যাকশন' : 'Voice Command / Allow-listed Tools'}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Controlled Tools</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left">
                  <button
                    onClick={() => handleCallTool("get_account_summary", isBn ? "আমার অ্যাকাউন্ট ব্যালেন্স কত আছে?" : "What is my account balance?")}
                    disabled={loadingTool}
                    className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition text-xs font-medium cursor-pointer shadow-2xs"
                  >
                    <span className="font-bold text-slate-900 block">{isBn ? '💰 ব্যালেন্স জানুন' : '💰 Check Balance'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">get_account_summary</span>
                  </button>

                  <button
                    onClick={() => handleCallTool("get_recent_transactions", isBn ? "আমার শেষ কয়েকটি লেনদেনের তথ্য দিন" : "Show my recent transactions")}
                    disabled={loadingTool}
                    className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition text-xs font-medium cursor-pointer shadow-2xs"
                  >
                    <span className="font-bold text-slate-900 block">{isBn ? '📜 শেষ লেনদেনসমূহ' : '📜 Recent Activity'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">get_recent_txns</span>
                  </button>

                  <button
                    onClick={() => handleCallTool("get_card_status", isBn ? "আমার স্মার্ট কার্ডের এনডোর্সমেন্ট ব্যালেন্স কত?" : "Check USD endorsement quota")}
                    disabled={loadingTool}
                    className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition text-xs font-medium cursor-pointer shadow-2xs"
                  >
                    <span className="font-bold text-slate-900 block">{isBn ? '💳 কার্ড ও ইউএসডি কোটা' : '💳 Card & USD Quota'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">get_card_status</span>
                  </button>

                  <button
                    onClick={() => handleCallTool("get_case_status", isBn ? "আমার সক্রিয় অভিযোগের অবস্থা কী?" : "What is my active dispute status?")}
                    disabled={loadingTool}
                    className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition text-xs font-medium cursor-pointer shadow-2xs"
                  >
                    <span className="font-bold text-slate-900 block">{isBn ? '📋 কেস ট্র্যাকিং স্ট্যাটাস' : '📋 Case Status'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">get_case_status</span>
                  </button>

                  <button
                    onClick={() => handleCallTool("create_case", isBn ? "আমার কিউআর পেমেন্টে ১৪০০ টাকা কেটেছে কিন্তু দোকানদার পায়নি, কেস খুলুন" : "Create a dispute case for delayed QR payment", {
                      complaint_text: "Customer reported grocery QR deduction delayed via phone call",
                      category: "PAYMENT"
                    })}
                    disabled={loadingTool}
                    className="p-3 rounded-2xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition text-xs font-medium cursor-pointer shadow-2xs"
                  >
                    <span className="font-bold text-amber-900 block">{isBn ? '🚨 অভিযোগ কেস তৈরি' : '🚨 Open Dispute'}</span>
                    <span className="text-[10px] text-amber-700 font-mono">create_case (Voice)</span>
                  </button>

                  <button
                    onClick={() => handleCallTool("escalate_case", isBn ? "আমাকে একজন সিনিয়র ম্যানেজারের কাছে পাঠান" : "Escalate to human manager", {})}
                    disabled={loadingTool}
                    className="p-3 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition text-xs font-medium cursor-pointer shadow-2xs"
                  >
                    <span className="font-bold text-rose-900 block">{isBn ? '👨‍💼 হিউম্যান এসকেলেশন' : '👨‍💼 Human Agent'}</span>
                    <span className="text-[10px] text-rose-700 font-mono">escalate_to_human</span>
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN: Realtime Audio Transcript */}
          <div className={`${isDesktop ? 'lg:col-span-7 space-y-4' : 'space-y-3'}`}>
            
            <section className="bg-slate-50/70 rounded-3xl p-5 shadow-xs border border-slate-200/80 min-h-[380px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-upayBlue" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                      {isBn ? 'রিয়েলটাইম অডিও ট্রান্সক্রিপ্ট ও রেসপন্স' : 'Realtime Audio Transcript & Response'}
                    </h4>
                  </div>
                  <DemoBadge label="SPEECH-TO-TEXT" size="sm" pulse={false} />
                </div>

                {!callActive ? (
                  <div className="p-12 text-center text-slate-400">
                    <Mic className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs">
                      {isBn ? 'কল শুরু হলে অডিও ট্রান্সক্রিপ্ট এখানে প্রদর্শিত হবে।' : 'Audio speech transcripts and automated voice agent responses will appear here.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[460px] overflow-y-auto no-scrollbar pr-1">
                    {transcripts.map((t, idx) => (
                      <div 
                        key={idx} 
                        className={`flex flex-col ${t.speaker === 'CALLER' ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-2xs ${
                          t.speaker === 'CALLER'
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-xs'
                        }`}>
                          <div className="text-[10px] font-bold opacity-80 mb-0.5 font-mono">
                            {t.speaker === 'CALLER' ? (isBn ? 'আপনি (Customer)' : 'You (Customer)') : (isBn ? 'উপায় এআই অ্যাসিস্ট্যান্ট' : 'Upay Voice Copilot')}
                          </div>
                          <div>{t.text}</div>
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">{t.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* VERIFICATION CHALLENGE MODAL */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 select-none">
          <div className="relative w-full max-w-[380px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 rounded-xl bg-blue-50 text-upayBlue">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isBn ? 'কলার আইডেন্টিটি ভেরিফিকেশন' : 'Caller Identity Verification'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isBn ? 'ব্যালেন্স ও স্পর্শকাতর তথ্য দেখার পূর্বে যাচাইকরণ' : 'Verification required before viewing balance and sensitive data'}
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isBn ? '৪ সংখ্যার পিন নম্বর (Default: 1234)' : '4-digit PIN (Default: 1234)'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={verifyPin}
                  onChange={(e) => setVerifyPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-sm tracking-widest text-center focus:outline-none focus:border-upayBlue"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isBn ? 'অথবা পিতার নাম (বিকল্প ভেরিফিকেশন)' : 'Or Father\'s Name (Alternative Verification)'}
                </label>
                <input
                  type="text"
                  placeholder={isBn ? "যেমন: MD. SHAHIDUL ISLAM" : "e.g., MD. SHAHIDUL ISLAM"}
                  value={verifyFatherName}
                  onChange={(e) => setVerifyFatherName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-upayBlue"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-upayBlue hover:bg-upayNavy text-white font-bold shadow-md"
                >
                  {isBn ? 'যাচাই করুন' : 'Verify'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
