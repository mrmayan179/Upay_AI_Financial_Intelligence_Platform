import React, { useRef } from 'react';

export const EvidenceView: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      window.print();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 font-sans">
      {/* Top Evidence Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 shadow-sm active:scale-95"
          >
            <span>←</span>
            <span>Upay Banking App</span>
          </button>

          <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFB800]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#0047BA]"></span>
            </div>
            <div>
              <span className="font-extrabold text-amber-400 text-sm tracking-tight">
                Upay AI Evidence & Benchmark Report
              </span>
              <span className="hidden md:inline-block ml-2 text-[11px] text-slate-400 font-mono">
                Part 1 Foundation: Data & ML Certification
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700 active:scale-95"
            title="Print or save as PDF"
          >
            <span>🖨️</span>
            <span className="hidden sm:inline">Print / Save PDF</span>
          </button>

          <a
            href="/evidence.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 text-purple-200 text-xs font-bold transition border border-purple-600/40 shadow-sm active:scale-95"
            title="Open pure standalone HTML file directly"
          >
            <span>📄</span>
            <span>Raw HTML</span>
            <span className="text-[10px] text-purple-300">↗</span>
          </a>

          <a
            href="https://upay-ai-financial-intelligence-platform.onrender.com/evidence"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition border border-slate-700 active:scale-95"
            title="Open backend Render API mirror"
          >
            <span>🌐</span>
            <span>Backend Mirror</span>
            <span className="text-[10px] text-slate-400">↗</span>
          </a>
        </div>
      </header>

      {/* Main Full-Height IFrame Area */}
      <main className="flex-1 w-full bg-slate-100 relative">
        <iframe
          ref={iframeRef}
          src="/evidence.html"
          title="Upay AI Foundation Evidence and Performance Report"
          className="w-full h-full min-h-[calc(100vh-61px)] border-0 block"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
        />
      </main>
    </div>
  );
};
