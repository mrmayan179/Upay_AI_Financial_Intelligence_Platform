import React, { useState, useEffect } from 'react';
import { X, Delete, Shield } from 'lucide-react';

interface PinKeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  onSuccess: (pin: string) => void;
}

export const PinKeypadModal: React.FC<PinKeypadModalProps> = ({
  isOpen,
  onClose,
  title = "পিন নম্বর লিখুন",
  subtitle = "নিরাপত্তা নিশ্চিত করতে ৪ সংখ্যার পিন লিখুন",
  onSuccess
}) => {
  const [currentPin, setCurrentPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCurrentPin("");
      setErrorMsg("");
    }
  }, [isOpen]);

  // Physical Keyboard Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (currentPin.length < 4) {
          setCurrentPin(prev => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        setCurrentPin(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        if (currentPin.length === 4) {
          handleSubmit(currentPin);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPin]);

  if (!isOpen) return null;

  const pressDigit = (num: string) => {
    if (currentPin.length < 4) {
      const nextPin = currentPin + num;
      setCurrentPin(nextPin);
      if (nextPin.length === 4) {
        // Auto check or allow manual submit
      }
    }
  };

  const deleteDigit = () => {
    setCurrentPin(prev => prev.slice(0, -1));
    setErrorMsg("");
  };

  const handleSubmit = (pin: string) => {
    if (pin.length === 4) {
      onSuccess(pin);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 select-none">
      <div className="relative w-full max-w-[360px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Shield Icon */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-upayBlue mb-2 shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-bengali">{title}</h3>
          <p className="text-xs text-slate-500 font-bengali mt-1">{subtitle}</p>
        </div>

        {/* 4 PIN Dots Display */}
        <div className="flex justify-center items-center gap-4 mb-8">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < currentPin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  isFilled 
                    ? 'bg-upayBlue scale-115 shadow-sm' 
                    : 'bg-slate-200 border border-slate-300'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="text-center text-xs font-semibold text-rose-600 -mt-4 mb-4">
            {errorMsg}
          </div>
        )}

        {/* Number Keypad 3x4 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => pressDigit(digit)}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-2xl font-bold font-mono transition active:scale-92 flex items-center justify-center shadow-xs border border-slate-200/60"
            >
              {digit}
            </button>
          ))}
          
          <button
            type="button"
            onClick={deleteDigit}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition active:scale-92 flex items-center justify-center"
            title="মুছুন (Backspace)"
          >
            <Delete className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={() => pressDigit('0')}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-2xl font-bold font-mono transition active:scale-92 flex items-center justify-center shadow-xs border border-slate-200/60"
          >
            0
          </button>

          <button
            type="button"
            disabled={currentPin.length !== 4}
            onClick={() => handleSubmit(currentPin)}
            className={`h-14 rounded-2xl font-bold text-sm transition active:scale-92 flex items-center justify-center font-bengali ${
              currentPin.length === 4 
                ? 'bg-upayBlue text-white shadow-md hover:bg-upayNavy cursor-pointer' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            নিশ্চিত
          </button>
        </div>

      </div>
    </div>
  );
};
