import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Case } from '../../../types';
import { ChevronRight } from 'lucide-react';

interface StackingReportCardsProps {
  cases: Case[];
  onSelectCase: (c: Case) => void;
  isBn: boolean;
}

// Single Card in the Stacking Deck (Original case data with it farm web card color style & stacking effect)
const StackingCaseCard: React.FC<{
  c: Case;
  index: number;
  total: number;
  scrollYProgress: any;
  onSelectCase: (c: Case) => void;
  isBn: boolean;
}> = ({ c, index, total, scrollYProgress, onSelectCase, isBn }) => {
  // Calculate scale based on scroll position: earlier cards scale down slightly to simulate depth
  const targetScale = 1 - ((total - index) * 0.025);
  const range = [index * (1 / Math.max(1, total)), 1];
  const scale = useTransform(scrollYProgress, range, [1, targetScale]);

  const isCrit = c.priority === 'CRITICAL';
  const isHigh = c.priority === 'HIGH';

  return (
    <motion.div
      style={{
        scale,
        top: `calc(75px + ${index * 24}px)`,
        zIndex: index + 10,
      }}
      className="sticky"
    >
      <div
        onClick={() => onSelectCase(c)}
        className="bg-[#0A1628]/95 backdrop-blur-xl border border-sky-500/30 rounded-2xl p-4.5 shadow-xl hover:border-sky-400/70 hover:shadow-[0_0_25px_rgba(14,165,233,0.25)] transition-all duration-300 cursor-pointer group active:scale-98"
      >
        {/* Top: Case ID, Priority, Progress */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-sky-300 bg-sky-500/20 px-2.5 py-0.5 rounded-md border border-sky-400/40 shadow-xs">
              #{c.case_id}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isCrit
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : isHigh
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              }`}
            >
              {c.priority}
            </span>
          </div>

          <span className="text-xs font-bold text-sky-200 font-mono">
            {c.progress_percent}%
          </span>
        </div>

        {/* Middle: Case Title */}
        <h4 className="text-sm md:text-base font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
          {c.case_title}
        </h4>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden mb-3 border border-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              c.status === 'ESCALATED' ? 'bg-rose-500' : 'bg-gradient-to-r from-sky-400 to-[#0047BA]'
            }`}
            style={{ width: `${Math.max(5, c.progress_percent)}%` }}
          />
        </div>

        {/* Bottom: Status & View Details */}
        <div className="flex items-center justify-between text-xs text-sky-100/70 pt-2 border-t border-white/10">
          <span>
            {isBn ? 'স্ট্যাটাস:' : 'Status:'}{' '}
            <strong className="text-white font-mono">{c.status}</strong>
          </span>
          <span className="text-[11px] text-sky-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition">
            {isBn ? 'বিস্তারিত দেখুন' : 'View Details'} <ChevronRight className="w-3.5 h-3.5" />
          </span>
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
    <div ref={containerRef} className="w-full relative space-y-6 pb-24">
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
