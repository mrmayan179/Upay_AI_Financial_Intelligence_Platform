import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DemoBadge, DemoWrapper } from './DemoBadge';

interface BanglaQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaySuccess?: (merchant: string, amount: number) => void;
}

export const BanglaQrModal: React.FC<BanglaQrModalProps> = ({ isOpen, onClose, onPaySuccess }) => {
  const { language, t } = useApp();
  const isBn = language === 'bn';
  const [selectedMerchant, setSelectedMerchant] = useState<string>('GoZayaan Travel (Dhaka)');
  const [amount, setAmount] = useState<string>('450');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setScanSuccess(true);
      if (onPaySuccess) {
        onPaySuccess(selectedMerchant, parseFloat(amount) || 450);
      }
      setTimeout(() => {
        setScanSuccess(false);
        onClose();
      }, 1800);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border-2 border-sky-400">
        {/* Header */}
        <div className="bg-[#0047BA] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white text-slate-900 flex flex-col items-center justify-center font-bold text-[8px]">
              <span className="text-[#0047BA]">BANGLA</span>
              <span className="text-rose-600 -mt-1 font-black">QR</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm leading-tight">{t('qr.title')}</h3>
                <DemoBadge label="SIMULATOR" size="sm" />
              </div>
              <p className="text-[10px] text-sky-200">{t('qr.subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-amber-300 font-bold text-sm">✕</button>
        </div>

        {/* Viewfinder simulation */}
        <div className="p-4 bg-slate-900 text-center relative flex flex-col items-center justify-center min-h-[220px]">
          {scanSuccess ? (
            <div className="space-y-2 text-white animate-bounce">
              <span className="text-4xl">✅</span>
              <div className="text-sm font-bold text-emerald-400">
                {isBn ? 'পেমেন্ট সফল হয়েছে!' : 'Payment Authorized Successfully!'}
              </div>
              <div className="text-xs text-slate-300">৳ {amount} BDT Paid to {selectedMerchant}</div>
            </div>
          ) : (
            <>
              {/* QR Scanner Frame with moving laser */}
              <div className="relative w-44 h-44 border-2 border-dashed border-sky-400 rounded-2xl flex items-center justify-center overflow-hidden bg-slate-800/60 shadow-inner">
                <div className="absolute inset-x-0 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-[bounce_2s_infinite]"></div>
                <div className="w-24 h-24 bg-white/10 rounded-lg flex items-center justify-center text-white/50 text-3xl">
                  ⛶
                </div>
              </div>
              <p className="text-[11px] text-slate-300 mt-3">
                {t('qr.scan_instruction')}
              </p>
            </>
          )}
        </div>

        {/* Merchant & Amount Selector */}
        {!scanSuccess && (
          <div className="p-4 space-y-3 bg-white text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {isBn ? 'মার্চেন্ট নির্বাচন করুন (সিমুলেশন):' : 'Select Test Merchant (Simulation):'}
              </label>
              <select
                value={selectedMerchant}
                onChange={(e) => setSelectedMerchant(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#0047BA]"
              >
                <option value="GoZayaan Travel (Dhaka)">GoZayaan Travel (Dhaka) — Verified</option>
                <option value="Shwapno Super Shop (Banani)">Shwapno Super Shop (Banani) — Verified</option>
                <option value="Aarong Retail (Gulshan)">Aarong Retail (Gulshan) — Verified</option>
                <option value="Pathao Food Express">Pathao Food Express — Verified</option>
                <option value="Unknown Overseas Vendor">Unknown Overseas Vendor (High Risk Trigger)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {isBn ? 'টাকার পরিমাণ (BDT):' : 'Amount (BDT):'}
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-[#0047BA]"
                placeholder="450"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <DemoWrapper tooltipText={isBn ? 'রিয়েলটাইম বাংলা কিউআর পেমেন্ট টেস্ট' : 'Test BANGLA QR payment with AI risk evaluation'} className="flex-1">
                <button
                  disabled={isProcessing}
                  onClick={handlePay}
                  className="w-full py-2.5 rounded-xl bg-[#0047BA] hover:bg-[#002C6C] text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>{isProcessing ? (isBn ? 'পেমেন্ট যাচাই হচ্ছে...' : 'Verifying...') : `৳ ${amount} ${t('qr.pay_btn')}`}</span>
                  <DemoBadge label="TEST" size="sm" pulse={false} />
                </button>
              </DemoWrapper>

              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
