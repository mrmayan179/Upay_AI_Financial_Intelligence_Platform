import React, { useState } from 'react';
import { Case, CaseEvent } from '../../../types';
import { api } from '../../../services/api';
import { 
  FileText, PlusCircle, AlertCircle, Clock, CheckCircle2, 
  ArrowRight, ShieldAlert, Sparkles, X, ChevronRight, Send, AlertTriangle
} from 'lucide-react';

interface ReportViewProps {
  cases: Case[];
  onRefresh: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ cases, onRefresh }) => {
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Real-time AI classification as user types
  const handleTextChange = async (text: string) => {
    setComplaintText(text);
    if (text.trim().length > 10) {
      try {
        const res: any = await api.classifyComplaint(text);
        setAiPreview(res);
      } catch {}
    } else {
      setAiPreview(null);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;

    setLoading(true);
    try {
      const res: any = await api.createReport(complaintText);
      setIsCreateOpen(false);
      setComplaintText("");
      setAiPreview(null);
      onRefresh();
      setSelectedCase(res);
      showToast(`অভিযোগ সফলভাবে নথিভুক্ত হয়েছে: কেস #${res.case_id}`);
    } catch (e: any) {
      showToast(e.message || "কেস তৈরিতে ত্রুটি হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleEscalateCase = async () => {
    if (!selectedCase) return;
    setEscalating(true);
    try {
      const res: any = await api.escalateCase(
        selectedCase.case_id,
        "Customer requested priority supervisory intervention due to unresolved delay."
      );
      setSelectedCase(res);
      onRefresh();
      showToast(`কেস #${selectedCase.case_id} সুপারভাইজর টিমে এসকেলেট করা হয়েছে`);
    } catch (e: any) {
      showToast(e.message || "এসকেলেশন ব্যর্থ হয়েছে");
    } finally {
      setEscalating(false);
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

      {/* 1. HEADER HERO & CREATE BUTTON */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-3xl p-5 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AI Dispute Copilot
          </div>
          <h2 className="text-xl font-bold font-bengali leading-tight">স্মার্ট রিপোর্ট ও কেস ট্র্যাকিং</h2>
          <p className="text-xs text-white/80 font-bengali mt-1 max-w-[340px]">
            যেকোনো লেনদেন বা সেবা সংক্রান্ত সমস্যা রিপোর্ট করুন এবং রিয়েলটাইমে তদন্তের অগ্রগতি ট্র্যাক করুন।
          </p>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 px-5 py-2.5 rounded-full bg-upayYellow text-slate-950 hover:bg-amber-400 font-bold text-xs font-bengali shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন অভিযোগ করুন</span>
          </button>
        </div>
      </div>

      {/* 2. ACTIVE CASES SECTION (SRS Section 9.1: Must show active cases prominently) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900 font-bengali">
            সক্রিয় বিরোধ ও কেসসমূহ ({cases.length})
          </h3>
          <span className="text-[11px] text-slate-500 font-sans">Active Cases Only</span>
        </div>

        {cases.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-slate-800 font-bengali">কোনো সক্রিয় কেস নেই</h4>
            <p className="text-xs text-slate-500 font-bengali mt-1">আপনার সব অভিযোগ সফলভাবে সমাধান হয়েছে।</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cases.map((c) => {
              const isCrit = c.priority === 'CRITICAL';
              const isHigh = c.priority === 'HIGH';
              return (
                <div
                  key={c.case_id}
                  onClick={() => setSelectedCase(c)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-blue-200 transition cursor-pointer group active:scale-98"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-upayBlue bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                        #{c.case_id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCrit ? 'bg-rose-100 text-rose-700' : isHigh ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {c.priority}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-slate-700 font-sans">
                      {c.progress_percent}%
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 font-sans mb-1.5 group-hover:text-upayBlue transition">
                    {c.case_title}
                  </h4>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        c.status === 'ESCALATED' ? 'bg-rose-500' : 'bg-upayBlue'
                      }`}
                      style={{ width: `${c.progress_percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span className="font-bengali">স্ট্যাটাস: <strong className="text-slate-800">{c.status}</strong></span>
                    <span className="text-[11px] text-upayBlue font-semibold flex items-center gap-1 group-hover:translate-x-1 transition">
                      বিস্তারিত দেখুন <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. CREATE COMPLAINT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
          <div className="relative w-full max-w-[440px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-blue-100 text-upayBlue">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-bengali">নতুন অভিযোগ দায়ের করুন</h3>
                <p className="text-xs text-slate-400 font-bengali">এআই স্বয়ংক্রিয়ভাবে ক্যাটাগরি ও প্রায়োরিটি নির্ধারণ করবে</p>
              </div>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 font-bengali">
                  সমস্যার বিস্তারিত বিবরণ দিন
                </label>
                <textarea
                  rows={4}
                  value={complaintText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="যেমন: আজ সকালে মীনা বাজার কিউআর পেমেন্টে ১৪০০ টাকা কেটেছে কিন্তু মার্চেন্ট পেমেন্ট পায়নি..."
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-sans focus:outline-none focus:border-upayBlue focus:ring-1 focus:ring-upayBlue resize-none"
                  required
                />
              </div>

              {/* Real-time AI Classification Preview */}
              {aiPreview && (
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-upayBlue flex items-center gap-1 font-bengali">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> এআই বিশ্লেষণ
                    </span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full font-mono text-slate-600">
                      {(aiPreview.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 mt-2">
                    <div>ক্যাটাগরি: <strong className="text-slate-900">{aiPreview.category}</strong></div>
                    <div>প্রায়োরিটি: <strong className="text-slate-900">{aiPreview.priority}</strong></div>
                    <div className="col-span-2">দায়িত্বপ্রাপ্ত দল: <strong>{aiPreview.suggested_team}</strong></div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !complaintText.trim()}
                className="w-full py-3 rounded-2xl bg-upayBlue hover:bg-upayNavy text-white font-bold text-xs tracking-wide shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer font-bengali"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? "অভিযোগ জমা হচ্ছে..." : "অভিযোগ জমা দিন"}</span>
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 4. CASE DETAIL & TIMELINE MODAL */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
          <div className="relative w-full max-w-[460px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setSelectedCase(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Case Title & Status Pill */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-upayBlue bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                  #{selectedCase.case_id}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedCase.status === 'ESCALATED' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {selectedCase.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 font-sans">
                {selectedCase.case_title}
              </h3>
            </div>

            {/* AI Summary Box */}
            {selectedCase.ai_summary && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                  AI Investigation Summary:
                </span>
                <p className="text-slate-700 leading-relaxed font-sans">{selectedCase.ai_summary}</p>
              </div>
            )}

            {/* Progress Section */}
            <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 mb-5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-800 font-bengali">তদন্তের অগ্রগতি</span>
                <span className="font-bold text-upayBlue font-mono">{selectedCase.progress_percent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div 
                  className="h-full bg-upayBlue rounded-full" 
                  style={{ width: `${selectedCase.progress_percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-sans">
                <span>Team: {selectedCase.assigned_team}</span>
                <span>Agent: {selectedCase.assigned_agent}</span>
              </div>
            </div>

            {/* Interactive Timeline */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 font-sans">
                Resolution Timeline
              </h4>
              
              <div className="space-y-4 relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {selectedCase.events?.map((ev, i) => (
                  <div key={ev.event_id || i} className="relative">
                    <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-upayBlue border-2 border-white shadow-xs" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 font-sans">{ev.event_type}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-snug font-sans">{ev.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Escalation Button (SRS Requirement: Support escalation to specialist queue) */}
            {selectedCase.status !== 'ESCALATED' && selectedCase.status !== 'RESOLVED' && (
              <button
                onClick={handleEscalateCase}
                disabled={escalating}
                className="w-full py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs tracking-wide transition flex items-center justify-center gap-2 cursor-pointer font-bengali"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{escalating ? "এসকেলেট করা হচ্ছে..." : "সুপারভাইজরের কাছে এসকেলেট করুন"}</span>
              </button>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
