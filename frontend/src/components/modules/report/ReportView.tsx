import React, { useState } from 'react';
import { Case, CaseEvent, UserProfile } from '../../../types';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { DemoBadge, DemoWrapper } from '../../shared/DemoBadge';
import { UpayPageHeader } from '../../shared/UpayPageHeader';
import { StackingReportCards } from './StackingReportCards';
import { 
  FileText, PlusCircle, AlertCircle, Clock, CheckCircle2, 
  ArrowRight, ShieldAlert, Sparkles, X, ChevronRight, Send, AlertTriangle
} from 'lucide-react';

interface ReportViewProps {
  cases: Case[];
  onRefresh: () => void;
  profile?: UserProfile | null;
  onOpenBalanceSheet?: () => void;
  onOpenNotifications?: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ 
  cases, 
  onRefresh,
  profile,
  onOpenBalanceSheet,
  onOpenNotifications
}) => {
  const { language, t, viewMode } = useApp();
  const isBn = language === 'bn';
  const isDesktop = viewMode === 'desktop';

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
      showToast(isBn ? `অভিযোগ সফলভাবে নথিভুক্ত হয়েছে: কেস #${res.case_id}` : `Complaint registered successfully: Case #${res.case_id}`);
    } catch (e: any) {
      showToast(e.message || (isBn ? "কেস তৈরিতে ত্রুটি হয়েছে" : "Error creating case"));
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
      showToast(isBn ? `কেস #${selectedCase.case_id} সুপারভাইজর টিমে এসকেলেট করা হয়েছে` : `Case #${selectedCase.case_id} escalated to supervisor team`);
    } catch (e: any) {
      showToast(e.message || (isBn ? "এসকেলেশন ব্যর্থ হয়েছে" : "Escalation failed"));
    } finally {
      setEscalating(false);
    }
  };

  return (
    <div className={`w-full flex flex-col bg-white text-slate-800 ${isDesktop ? 'rounded-3xl shadow-xl pb-12' : 'pb-28'}`}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-slate-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top duration-200">
          {toastMsg}
        </div>
      )}

      {/* ================= 1. REUSABLE TOP YELLOW HEADER ================= */}
      <UpayPageHeader
        moduleName={isBn ? 'স্মার্ট বিরোধ ও কেস ট্র্যাকিং' : 'Dispute Copilot & Cases'}
        moduleBadge="NLP COPILOT"
        profile={profile}
        onOpenBalanceSheet={onOpenBalanceSheet}
        onOpenNotifications={onOpenNotifications}
      />

      {/* ================= 2. MAIN REPORT VIEW CONTENT ================= */}
      <div className={`w-full ${isDesktop ? 'px-6 md:px-8 py-6' : 'p-4'} space-y-6`}>
        
        {/* Desktop 2-Column Responsive Layout */}
        <div className={`grid grid-cols-1 ${isDesktop ? 'lg:grid-cols-12 gap-8 items-start' : 'gap-5'}`}>
          
          {/* LEFT COLUMN: Hero & Create Form (Sticky on Desktop) */}
          <div className={`${isDesktop ? 'lg:col-span-4 space-y-6 sticky top-24' : 'space-y-5'}`}>
            
            {/* Header Hero & Create Button */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold tracking-wider uppercase mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI Dispute Copilot</span>
                  <DemoBadge label="NLP LIVE" size="sm" />
                </div>
                <h2 className="text-xl font-bold leading-tight">
                  {t('report.title')}
                </h2>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  {t('report.subtitle')}
                </p>

                <DemoWrapper tooltipText={isBn ? 'নতুন বিরোধ বা লেনদেনের অভিযোগ করুন (ডেমো)' : 'File a new dispute (Demo)'}>
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="mt-4 px-5 py-2.5 rounded-full bg-[#FFC820] text-slate-950 hover:bg-amber-400 font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{t('report.btn_new')}</span>
                  </button>
                </DemoWrapper>
              </div>
            </div>

            {/* Quick NLP Category Cards */}
            <div className="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  {isBn ? 'স্বয়ংক্রিয় এআই ক্যাটাগরি' : 'Automated Routing Engine'}
                </h3>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                  98.4% Precision
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isBn 
                  ? 'আপনার লেখা বা ভয়েস অভিযোগ বিশ্লেষণ করে সাথে সাথে সংশ্লিষ্ট ব্রাঞ্চ ও ফ্রড টিমে কেস পৌঁছে দেওয়া হয়।'
                  : 'Natural Language Processing parses user dispute narratives in real-time, auto-routing cases to specialized tier-1 and tier-2 fraud teams.'}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                  <span className="font-bold text-slate-800 block text-[11px]">QR Payment Glitch</span>
                  <span className="text-[10px] text-slate-500">SLA: 2 hours</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                  <span className="font-bold text-slate-800 block text-[11px]">Cash-Out Discrepancy</span>
                  <span className="text-[10px] text-slate-500">SLA: 4 hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Active Cases List (Stacking Deck from it farm web) */}
          <div className={`${isDesktop ? 'lg:col-span-8 space-y-4' : 'space-y-3'}`}>
            
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{isBn ? 'রিপোর্ট' : 'Report'}</span>
                <span className="bg-blue-100 text-[#0047BA] text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                  {cases.length}
                </span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono font-bold">
                {isBn ? 'রিয়েলটাইম টাইমলাইন' : 'Realtime Track'}
              </span>
            </div>

            {cases.length === 0 ? (
              <div className="p-12 text-center bg-slate-50/70 rounded-3xl border border-slate-200/80 shadow-xs">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h4 className="text-sm font-bold text-slate-800">
                  {isBn ? 'কোনো সক্রিয় কেস নেই' : 'No active cases'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isBn ? 'আপনার সব অভিযোগ সফলভাবে সমাধান হয়েছে।' : 'All your complaints have been resolved successfully.'}
                </p>
              </div>
            ) : (
              <StackingReportCards
                cases={cases}
                onSelectCase={setSelectedCase}
                isBn={isBn}
              />
            )}
          </div>
        </div>
      </div>

      {/* 3. CREATE COMPLAINT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
          <div className="relative w-full max-w-[460px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200">
            
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
                <h3 className="text-base font-bold text-slate-900">
                  {isBn ? 'নতুন অভিযোগ দায়ের করুন' : 'File New Dispute Report'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isBn ? 'এআই স্বয়ংক্রিয়ভাবে ক্যাটাগরি ও প্রায়োরিটি নির্ধারণ করবে' : 'AI will automatically classify category, SLA & priority'}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isBn ? 'সমস্যার বিস্তারিত বিবরণ দিন' : 'Provide detailed description of the dispute'}
                </label>
                <textarea
                  rows={4}
                  value={complaintText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={isBn 
                    ? "যেমন: আজ সকালে মীনা বাজার কিউআর পেমেন্টে ১৪০০ টাকা কেটেছে কিন্তু মার্চেন্ট পেমেন্ট পায়নি..." 
                    : "e.g., Today morning 1400 BDT was deducted for Meena Bazar QR payment but merchant terminal timed out..."}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-sans focus:outline-none focus:border-upayBlue focus:ring-1 focus:ring-upayBlue resize-none"
                  required
                />
              </div>

              {/* Real-time AI Classification Preview */}
              {aiPreview && (
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-upayBlue flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> {isBn ? 'এআই বিশ্লেষণ' : 'Realtime NLP Prediction'}
                    </span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full font-mono text-slate-600">
                      {(aiPreview.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 mt-2">
                    <div>{isBn ? 'ক্যাটাগরি:' : 'Category:'} <strong className="text-slate-900">{aiPreview.category}</strong></div>
                    <div>{isBn ? 'প্রায়োরিটি:' : 'Priority:'} <strong className="text-slate-900">{aiPreview.priority}</strong></div>
                    <div className="col-span-2">{isBn ? 'দায়িত্বপ্রাপ্ত দল:' : 'Assigned Team:'} <strong>{aiPreview.suggested_team}</strong></div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !complaintText.trim()}
                className="w-full py-3 rounded-2xl bg-upayBlue hover:bg-upayNavy text-white font-bold text-xs tracking-wide shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? (isBn ? "অভিযোগ জমা হচ্ছে..." : "Submitting...") : (isBn ? "অভিযোগ জমা দিন" : "Submit Complaint")}</span>
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 4. CASE DETAIL & TIMELINE MODAL */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
          <div className="relative w-full max-w-[480px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200">
            
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
              <h3 className="text-base font-bold text-slate-900">
                {selectedCase.case_title}
              </h3>
            </div>

            {/* AI Summary Box */}
            {selectedCase.ai_summary && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                  {isBn ? 'এআই তদন্ত সারসংক্ষেপ:' : 'AI Investigation Summary:'}
                </span>
                <p className="text-slate-700 leading-relaxed">{selectedCase.ai_summary}</p>
              </div>
            )}

            {/* Progress Section */}
            <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 mb-5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-800">
                  {isBn ? 'তদন্তের অগ্রগতি' : 'Investigation Progress'}
                </span>
                <span className="font-bold text-upayBlue font-mono">{selectedCase.progress_percent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div 
                  className="h-full bg-upayBlue rounded-full" 
                  style={{ width: `${selectedCase.progress_percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
                <span>Team: {selectedCase.assigned_team}</span>
                <span>Agent: {selectedCase.assigned_agent}</span>
              </div>
            </div>

            {/* Interactive Timeline */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 font-mono">
                {isBn ? 'কেস সমাধান টাইমলাইন' : 'Resolution Event Timeline'}
              </h4>
              
              <div className="space-y-4 relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {selectedCase.events?.map((ev, i) => (
                  <div key={ev.event_id || i} className="relative">
                    <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-upayBlue border-2 border-white shadow-xs" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{ev.event_type}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-snug">{ev.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Escalation Button */}
            {selectedCase.status !== 'ESCALATED' && selectedCase.status !== 'RESOLVED' && (
              <button
                onClick={handleEscalateCase}
                disabled={escalating}
                className="w-full py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs tracking-wide transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{escalating ? (isBn ? "এসকেলেট করা হচ্ছে..." : "Escalating...") : (isBn ? "সুপারভাইজরের কাছে এসকেলেট করুন" : "Escalate to Supervisor")}</span>
              </button>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
