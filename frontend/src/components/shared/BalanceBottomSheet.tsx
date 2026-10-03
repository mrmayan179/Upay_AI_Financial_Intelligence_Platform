import React from 'react';
import { Wallet, Gift, X } from 'lucide-react';

interface BalanceBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  balanceBdt: number;
  cashRewardBdt: number;
}

export const BalanceBottomSheet: React.FC<BalanceBottomSheetProps> = ({
  isOpen,
  onClose,
  balanceBdt,
  cashRewardBdt
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity select-none">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Foreground Bottom Sheet */}
      <div className="relative w-full max-w-[430px] bg-[#F4F6F9] rounded-t-[28px] pt-3 pb-8 px-4 shadow-[0_-12px_30px_rgba(0,0,0,0.35)] z-10 animate-in slide-in-from-bottom duration-300">
        
        {/* Drag Handle Indicator */}
        <div className="w-12 h-1.5 bg-[#A8B3C4] rounded-full mx-auto mb-3" />

        {/* Header Title with Close Icon */}
        <div className="flex items-center justify-between px-2 mb-3.5">
          <h2 className="text-[19px] font-bold text-[#64748B] font-bengali">
            ব্যালেন্স এর বিস্তারিত
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card 1: ব্যালেন্স */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-3.5 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-xs text-white">
                <Wallet className="w-6 h-6" />
              </div>
              <span className="text-lg font-bold text-gray-900 font-bengali">ব্যালেন্স</span>
            </div>
            <span className="text-[21px] font-bold text-[#0F172A] font-sans">
              ৳ {balanceBdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[13px] text-[#64748B] font-medium leading-relaxed font-bengali pt-1">
            এই ব্যালেন্স আপনার প্রাইমারি, ডিসবার্সমেন্ট, স্যালারি এবং রেমিট্যান্স ওয়ালেট ব্যালেন্সের যোগফল।
          </p>
        </div>

        {/* Card 2: ক্যাশ রিওয়ার্ড */}
        <div className="bg-[#FFFDF4] rounded-2xl p-4 shadow-sm border border-amber-100/70">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#0284C7] flex items-center justify-center shadow-xs text-white">
                <Gift className="w-6 h-6" />
              </div>
              <span className="text-lg font-bold text-gray-900 font-bengali">ক্যাশ রিওয়ার্ড</span>
            </div>
            <span className="text-[21px] font-bold text-[#0F172A] font-sans">
              ৳ {cashRewardBdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[13px] text-[#64748B] font-medium leading-relaxed font-bengali pt-1">
            আপনি মোবাইল রিচার্জসহ, সব ধরনের পেমেন্ট এবং বিল পরিশোধের জন্য এই ক্যাশ রিওয়ার্ড ব্যালেন্স ব্যবহার করতে পারবেন।
          </p>
        </div>

      </div>
    </div>
  );
};
