import React, { useState } from 'react';
import { Card as CardType } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { RotateCw, ShieldCheck, Wifi } from 'lucide-react';

interface UpaySmartCardVisualProps {
  card: CardType;
}

export const UpaySmartCardVisual: React.FC<UpaySmartCardVisualProps> = ({ card }) => {
  const { language } = useApp();
  const isBn = language === 'bn';
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="w-full flex flex-col items-center">
      {/* 3D Perspective Card Container */}
      <div 
        className="w-full max-w-[420px] aspect-[1.586/1] perspective-1000 cursor-pointer select-none group"
        onClick={() => setIsFlipped(!isFlipped)}
        title={isBn ? "ক্লিক করে কার্ড উল্টান (Click to Flip)" : "Click to flip card"}
      >
        <div 
          className={`relative w-full h-full rounded-[24px] transition-transform duration-700 transform-style-preserve-3d shadow-2xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* ================= FRONT OF CARD ================= */}
          <div className="absolute inset-0 w-full h-full rounded-[24px] upay-card-gradient text-white overflow-hidden p-6 flex flex-col justify-between backface-hidden border border-white/20">
            
            {/* Decorative concentric circles */}
            <div className="absolute -right-28 -top-32 w-80 h-80 rounded-full border-[45px] border-[#5242C8]/25 pointer-events-none" />
            <div className="absolute -right-32 -bottom-24 w-80 h-44 rounded-full border-[35px] border-[#2874F0]/35 pointer-events-none" />

            {/* Top Bar: Upay Logo & Contactless */}
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                {/* Logo Figure Symbol */}
                <div className="relative w-10 h-10 shrink-0">
                  <div className="absolute w-5 h-7 border-l-[11px] border-b-[11px] border-[#FFD000] rounded-b-[20px] left-0.5 top-2.5 -rotate-[5deg]" />
                  <div className="absolute w-5 h-7 border-r-[11px] border-b-[11px] border-[#1261AA] rounded-b-[20px] right-0.5 top-2.5 rotate-[5deg]" />
                  <div className="absolute w-3 h-3 rounded-full bg-[#FFD000] left-0.5 top-0" />
                  <div className="absolute w-3 h-3 rounded-full bg-[#1261AA] right-0.5 top-0" />
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight leading-none">upay</div>
                  <div className="text-[9px] text-white/80 font-medium tracking-wider">Digital Financial Services</div>
                </div>
              </div>

              {/* Contactless Wave Icon */}
              <div className="flex items-center gap-1.5 opacity-90">
                <Wifi className="w-6 h-6 rotate-90" />
              </div>
            </div>

            {/* Middle: EMV Chip */}
            <div className="relative z-10 mt-1">
              <div className="w-12 h-9 rounded-md chip-gradient relative border border-[#503C0A]/40 flex items-center justify-center">
                <div className="w-5 h-8 border border-[#503C0A]/30 rounded-xs" />
                <div className="absolute w-11 h-3 border border-[#503C0A]/30 rounded-xs" />
              </div>
            </div>

            {/* Card Number */}
            <div className="relative z-10 text-xl md:text-2xl font-mono tracking-[4px] text-white/95 font-semibold mt-1">
              {card.card_number_full || '4532  8912  6543  4821'}
            </div>

            {/* Bottom Bar: Name, Expiry, Concept Tag */}
            <div className="flex items-end justify-between relative z-10 pt-1">
              <div>
                <div className="text-[8px] uppercase tracking-widest text-white/70">Cardholder Name</div>
                <div className="text-sm md:text-base font-bold tracking-wider uppercase font-sans">
                  NAKIB MD. ASHIK
                </div>
              </div>

              <div>
                <div className="text-[8px] uppercase tracking-widest text-white/70">Valid Thru</div>
                <div className="text-sm md:text-base font-mono font-bold tracking-wider">
                  {card.expiry_date || '12/29'}
                </div>
              </div>

              <div className="px-2.5 py-1 rounded-full border border-white/70 text-[9px] font-semibold tracking-wider bg-white/10 backdrop-blur-xs">
                GLOBAL SMART
              </div>
            </div>

          </div>

          {/* ================= BACK OF CARD ================= */}
          <div className="absolute inset-0 w-full h-full rounded-[24px] upay-back-card-gradient text-white overflow-hidden flex flex-col justify-between backface-hidden rotate-y-180 border border-white/20 select-none">
            
            {/* Top Customer Care Bar */}
            <div className="h-9 px-6 bg-[#4B2496]/60 flex items-center justify-between text-[11px] font-medium text-white/90">
              <span>Customer Care: 16247</span>
              <span>www.upaybd.com</span>
            </div>

            {/* Magnetic Stripe */}
            <div className="w-full h-11 bg-[#08090D] shadow-inner" />

            {/* Signature Area & CVV */}
            <div className="px-6 flex items-center justify-between">
              <div className="w-[62%] h-8 bg-[#ECEEF2] rounded flex items-center px-3">
                <span className="text-[10px] text-slate-500 font-mono italic">Authorized Signature</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/80 font-bold uppercase">CVV</span>
                <div className="w-11 h-8 bg-white text-slate-900 rounded font-mono font-bold flex items-center justify-center text-xs shadow-xs">
                  {card.cvv || '123'}
                </div>
              </div>
            </div>

            {/* Bottom: Mini Logo, Slogan & QR Code */}
            <div className="px-6 pb-5 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-1.5 opacity-90 mb-1">
                  <span className="text-lg font-bold tracking-tight">upay</span>
                  <span className="text-[8px] text-white/75">Global Card</span>
                </div>
                <div className="text-[11px] tracking-wider text-amber-300 font-semibold font-sans">
                  Safer · Faster · Simpler
                </div>
              </div>

              {/* Mock QR Code Pattern */}
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-white rounded p-1 grid grid-cols-5 gap-0.5">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`rounded-xs ${i % 2 === 0 || i % 5 === 0 ? 'bg-black' : 'bg-transparent'}`} 
                    />
                  ))}
                </div>
                <div className="text-[8px] text-white/70 leading-tight">
                  Scan to<br />use Upay
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Flip Prompt Hint */}
      <button 
        onClick={() => setIsFlipped(!isFlipped)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-upayBlue transition font-semibold"
      >
        <RotateCw className="w-3.5 h-3.5" />
        <span>
          {isBn
            ? `কার্ডের অপর পাশ দেখতে ক্লিক করুন (${isFlipped ? 'সামনের পাশ' : 'পেছনের পাশ'})`
            : `Click to flip card (${isFlipped ? 'Front side' : 'Back side'})`}
        </span>
      </button>
    </div>
  );
};
