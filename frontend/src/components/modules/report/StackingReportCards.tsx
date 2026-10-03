import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Case } from '../../../types';
import { ArrowRight } from 'lucide-react';

interface StackingReportCardsProps {
  cases: Case[];
  onSelectCase: (c: Case) => void;
  isBn: boolean;
}

const CASE_IMAGES = [
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800", // FinTech Analytics
  "/ai-face.png", // AI Face from it farm web
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800", // Cyber Shield
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800", // Enterprise Dashboard
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=800", // Travel / Cloud
];

// Single Card in the Stacking Deck (Copied from it farm web ServicesSection)
const StackingCaseCard: React.FC<{
  c: Case;
  index: number;
  total: number;
  scrollYProgress: any;
  onSelectCase: (c: Case) => void;
  isBn: boolean;
}> = ({ c, index, total, scrollYProgress, onSelectCase, isBn }) => {
  // Calculate scale based on scroll position. Earlier cards scale down to simulate depth.
  const targetScale = 1 - ((total - index) * 0.03);
  const range = [index * (1 / Math.max(1, total)), 1];
  const scale = useTransform(scrollYProgress, range, [1, targetScale]);

  const isCrit = c.priority === 'CRITICAL';
  const isHigh = c.priority === 'HIGH';
  const imageSrc = CASE_IMAGES[index % CASE_IMAGES.length];

  return (
    <motion.div
      style={{
        scale,
        top: `calc(75px + ${index * 28}px)`,
        zIndex: index + 10,
      }}
      className="sticky"
    >
      <div
        onClick={() => onSelectCase(c)}
        className="flex flex-col md:flex-row overflow-hidden bg-[#0A1628]/95 backdrop-blur-xl border border-sky-500/30 rounded-[2rem] shadow-2xl group hover:border-sky-400/70 hover:shadow-[0_0_35px_rgba(14,165,233,0.35)] transition-all duration-500 min-h-[290px] md:min-h-[310px] cursor-pointer"
      >
        {/* Left Side: Text & Case Details */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between z-10">
          <div>
            {/* Top metadata tags */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-sky-500/20 text-sky-300 border border-sky-400/40 px-2.5 py-0.5 rounded-lg shadow-xs">
                  #{c.case_id}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isCrit
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : isHigh
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  }`}
                >
                  {c.priority}
                </span>
                {c.category && (
                  <span className="hidden sm:inline text-[10px] font-mono text-slate-300 bg-white/10 border border-white/15 px-2 py-0.5 rounded-md">
                    {c.category}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-sky-200">
                <span className="text-sm text-sky-300">{c.progress_percent}%</span>
                <span className="text-[10px] text-slate-400 font-sans">{isBn ? 'অগ্রগতি' : 'Progress'}</span>
              </div>
            </div>

            {/* Case Title */}
            <h3 className="text-lg md:text-2xl font-bold text-white group-hover:text-sky-300 transition-colors leading-snug">
              {c.case_title}
            </h3>

            {/* AI Narrative Description */}
            <p className="text-sky-100/70 text-xs md:text-sm mt-2 leading-relaxed line-clamp-2 max-w-xl">
              {c.ai_summary || (isBn
                ? 'এআই ডিস্পিউট কোপাইলট রিয়েলটাইমে ট্রানজেকশন বিরোধ ও ফ্রড ট্র্যাক করছে।'
                : 'AI Dispute Copilot actively monitoring transaction discrepancy with automatic merchant forensics.')}
            </p>
          </div>

          <div>
            {/* Progress Bar with smooth gradient */}
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden my-3 border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  c.status === 'ESCALATED'
                    ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-400'
                    : 'bg-gradient-to-r from-sky-400 via-blue-500 to-[#0047BA]'
                }`}
                style={{ width: `${Math.max(5, c.progress_percent)}%` }}
              />
            </div>

            {/* Status & Learn More Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-sky-200/80 flex items-center gap-1.5">
                <span>{isBn ? 'স্ট্যাটাস:' : 'Status:'}</span>
                <strong className="text-white font-mono text-[11px] bg-white/10 border border-white/15 px-2 py-0.5 rounded">
                  {c.status}
                </strong>
                {c.assigned_team && (
                  <span className="hidden lg:inline text-[10px] text-slate-400 font-mono ml-1">
                    • {c.assigned_team}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCase(c);
                }}
                className="rounded-full bg-sky-500 hover:bg-sky-400 text-white font-semibold px-5 py-2 text-xs shadow-md transition-all border border-sky-400/50 hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] flex items-center gap-1.5 group-hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>{isBn ? 'বিস্তারিত দেখুন' : 'Learn more'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Asset Panel */}
        <div className="w-full md:w-[40%] relative min-h-[160px] md:min-h-full overflow-hidden shrink-0">
          <img
            src={imageSrc}
            alt={c.case_title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Subtle gradient to blend into card background */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0A1628] via-[#0A1628]/40 to-transparent" />

          {/* Floating Live Badge */}
          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md border border-white/20 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{isBn ? 'লাইভ এআই ট্র্যাকার' : 'AI Forensic Guard'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const StackingReportCards: React.FC<StackingReportCardsProps> = ({
  cases,
  onSelectCase,
  isBn,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={containerRef} className="w-full relative space-y-16 pb-28">
      {cases.map((c, index) => (
        <StackingCaseCard
          key={c.case_id}
          c={c}
          index={index}
          total={cases.length}
          scrollYProgress={scrollYProgress}
          onSelectCase={onSelectCase}
          isBn={isBn}
        />
      ))}
    </div>
  );
};
