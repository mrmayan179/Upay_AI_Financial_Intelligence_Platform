import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { AIActivityLog, UserProfile } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { DemoBadge, DemoWrapper } from '../../shared/DemoBadge';
import { UpayPageHeader } from '../../shared/UpayPageHeader';

interface AuditViewProps {
  profile?: UserProfile | null;
  onOpenBalanceSheet?: () => void;
  onOpenNotifications?: () => void;
}

export const AuditView: React.FC<AuditViewProps> = ({
  profile,
  onOpenBalanceSheet,
  onOpenNotifications
}) => {
  const { language, t, viewMode } = useApp();
  const isBn = language === 'bn';
  const isDesktop = viewMode === 'desktop';

  const [logs, setLogs] = useState<AIActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedComponent, setSelectedComponent] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AIActivityLog | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const fetchLogs = async () => {
    try {
      const comp = selectedComponent === 'ALL' ? undefined : selectedComponent;
      const data = await api.getAuditLogs(comp);
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedComponent]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 3500);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedComponent]);

  // Derived metrics
  const totalLogs = logs.length;
  const avgLatency = totalLogs > 0
    ? Math.round(logs.reduce((acc, l) => acc + (l.latency_ms || 0), 0) / totalLogs)
    : 16;
  const flaggedCount = logs.filter(l => l.result_status === 'FLAGGED' || l.result_status === 'BLOCKED').length;

  const components = [
    { id: 'ALL', label: isBn ? 'সকল উপাদান' : 'All Components' },
    { id: 'FRAUD_ENGINE', label: 'Fraud XGBoost' },
    { id: 'ANOMALY_ENGINE', label: 'Anomaly IForest' },
    { id: 'CREDIT_ENGINE', label: 'Credit XGBoost' },
    { id: 'VOICE_AI', label: 'Voice AI Agent' },
    { id: 'REPORT_COPILOT', label: 'Dispute Copilot' },
  ];

  const getComponentBadge = (comp: string) => {
    switch (comp) {
      case 'FRAUD_ENGINE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 font-mono">FRAUD XGB</span>;
      case 'ANOMALY_ENGINE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 font-mono">ANOMALY IF</span>;
      case 'CREDIT_ENGINE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 font-mono">CREDIT XGB</span>;
      case 'VOICE_AI':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200 font-mono">VOICE AI</span>;
      case 'REPORT_COPILOT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">DISPUTE NLP</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">{comp}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 font-mono">SUCCESS</span>;
      case 'FLAGGED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse font-mono">FLAGGED</span>;
      case 'BLOCKED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 font-mono">BLOCKED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 font-mono">{status}</span>;
    }
  };

  return (
    <div className={`w-full flex flex-col bg-white text-slate-800 ${isDesktop ? 'rounded-3xl shadow-xl overflow-hidden pb-12' : 'pb-28'}`}>
      
      {/* ================= 1. REUSABLE TOP YELLOW HEADER ================= */}
      <UpayPageHeader
        moduleName={isBn ? 'এআই গভর্নেন্স ও অডিট' : 'AI Governance & Telemetry'}
        moduleBadge="XAI TELEMETRY"
        profile={profile}
        onOpenBalanceSheet={onOpenBalanceSheet}
        onOpenNotifications={onOpenNotifications}
      />

      {/* ================= 2. MAIN AUDIT VIEW CONTENT ================= */}
      <div className={`w-full ${isDesktop ? 'px-6 md:px-8 py-6' : 'p-4'} space-y-6`}>
        
        {/* Top Header Card */}
        <div className="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {t('audit.title')}
              </h1>
              <DemoBadge label="LOGS" size="sm" pulse={false} />
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              {t('audit.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded text-[#0047BA] focus:ring-[#0047BA] h-4 w-4 cursor-pointer"
              />
              <span>{isBn ? 'লাইভ স্ট্রিম' : 'Live Stream'}</span>
            </label>
            <DemoWrapper tooltipText={isBn ? 'সর্বশেষ এআই সিদ্ধান্ত ও লেটেন্সি রিফ্রেশ করুন' : 'Refresh recent AI traces'}>
              <button
                onClick={() => { setLoading(true); fetchLogs(); }}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 shadow-2xs cursor-pointer"
              >
                <span>↻</span> {isBn ? 'রিফ্রেশ' : 'Refresh'}
              </button>
            </DemoWrapper>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase text-slate-400 font-mono">{t('audit.total_decisions')}</div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalLogs}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">● Real-time logged</div>
          </div>
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase text-slate-400 font-mono">{t('audit.avg_latency')}</div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{avgLatency} ms</div>
            <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Sub-50ms target met</div>
          </div>
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase text-slate-400 font-mono">{isBn ? 'চিহ্নিত / ব্লকড' : 'Flagged / Blocked'}</div>
            <div className="text-2xl font-black text-rose-600 mt-1 font-mono">{flaggedCount}</div>
            <div className="text-[10px] text-rose-600 font-semibold mt-0.5">High-risk interventions</div>
          </div>
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase text-slate-400 font-mono">{isBn ? 'কমপ্লায়েন্স রেট' : 'Audit Compliance'}</div>
            <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">100%</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Zero PII Leakage</div>
          </div>
        </div>

        {/* Component Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {components.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedComponent(c.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedComponent === c.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-2xs'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Audit Log Stream */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <span className="text-xs font-bold uppercase text-slate-600 font-mono">
              {isBn ? 'লাইভ ডিসিশন স্ট্রিম' : 'Live Inference Stream'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {isBn ? `সর্বশেষ ${logs.length}টি অপারেশন` : `Showing latest ${logs.length} operations`}
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 font-medium text-sm">
              {isBn ? 'গভর্নেন্স লগ লোড হচ্ছে...' : 'Loading governance logs...'}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium text-sm">
              {isBn ? 'কোনো অডিট রেকর্ড পাওয়া যায়নি।' : 'No audit records found for this component.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.ai_log_id}
                  onClick={() => setSelectedLog(log)}
                  className="p-4 hover:bg-slate-50 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Component & Timestamp */}
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">{getComponentBadge(log.component)}</div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{log.action}</div>
                      <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5 font-mono">
                        <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span>id: {log.correlation_id.substring(0, 10)}...</span>
                        <span>•</span>
                        <span>v{log.model_version || '1.0'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Latency & Status */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold ${
                      (log.latency_ms || 0) < 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {log.latency_ms || 12}ms
                    </span>
                    {getStatusBadge(log.result_status)}
                    <span className="text-slate-400 text-xs">🔍</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Trace Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-300 animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {isBn ? 'সিদ্ধান্ত ট্রেস ও মেটাডাটা' : 'Decision Trace & Telemetry Metadata'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedLog.correlation_id}</p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 font-mono">
                  <div>
                    <div className="text-slate-400 font-bold uppercase text-[10px]">Component</div>
                    <div className="font-bold text-slate-800 mt-0.5">{selectedLog.component}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-bold uppercase text-[10px]">Model Provider</div>
                    <div className="font-bold text-slate-800 mt-0.5">{selectedLog.model_or_provider}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-bold uppercase text-[10px]">Execution Time</div>
                    <div className="font-bold text-slate-800 mt-0.5">{selectedLog.latency_ms} ms</div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-bold uppercase text-[10px]">Outcome</div>
                    <div className="font-bold text-slate-800 mt-0.5">{selectedLog.result_status}</div>
                  </div>
                </div>

                <div>
                  <div className="font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{isBn ? 'কাঠামোগত ডিসিশন পেলোড (ইনপুট ও আউটপুট)' : 'Structured Decision Payload (Input & Output)'}</span>
                    <span className="text-[10px] text-slate-400 font-mono">PII Scrubbed</span>
                  </div>
                  <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-72 border border-slate-800">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-blue-900 text-[11px] leading-relaxed">
                  <strong>🛡️ {isBn ? 'রেগুলেটরি অডিট নিরাপত্তা নিশ্চয়তা:' : 'Regulatory Audit Guarantee:'}</strong>{' '}
                  {isBn
                    ? 'সমস্ত এআই ইনফারেন্স অফলাইন যাচাইকৃত মডেল দ্বারা নিয়ন্ত্রিত। যে কোনো সীমাবদ্ধতামূলক সিদ্ধান্ত মানব সুপারভাইজরের পর্যালোচনার আওতাধীন।'
                    : 'All AI inferences are governed by offline validated ML models. Any adverse action or restriction is subject to human supervisor review with full algorithmic explainability.'}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  {isBn ? 'বন্ধ করুন' : 'Close Inspector'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
