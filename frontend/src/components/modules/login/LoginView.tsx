import React, { useState, useEffect } from 'react';
import { Shield, Fingerprint, Delete, ArrowRight, UserCheck, AlertCircle, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { UserProfile } from '../../../types';

interface LoginViewProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { language, toggleLanguage, viewMode, setViewMode, toggleViewMode, isMobileDevice, t } = useApp();
  const isBn = language === 'bn';

  // State
  const [phoneNumber, setPhoneNumber] = useState<string>('01771449164');
  const [isEditingPhone, setIsEditingPhone] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [shakeError, setShakeError] = useState<boolean>(false);
  const [biometricSuccess, setBiometricSuccess] = useState<boolean>(false);
  const [showForgotTip, setShowForgotTip] = useState<boolean>(false);

  // Keypad Handlers
  const handleDigitPress = (digit: string) => {
    if (pin.length < 4) {
      setErrorMessage('');
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        // Auto submit when 4 digits are filled
        executeLogin(phoneNumber, nextPin);
      }
    }
  };

  const handleDelete = () => {
    setErrorMessage('');
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setErrorMessage('');
    setPin('');
  };

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        if (pin.length === 4) {
          executeLogin(phoneNumber, pin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, phoneNumber, isLoading]);

  // Execute Login
  const executeLogin = async (phone: string, pinToSubmit: string) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // In demo mode: accept '1234'
      if (pinToSubmit !== '1234') {
        setShakeError(true);
        setTimeout(() => setShakeError(false), 500);
        setErrorMessage(isBn ? 'ভুল পিন! ডেমো অ্যাকাউন্টের পিন হলো ১২৩৪' : 'Incorrect PIN! Demo PIN is 1234');
        setPin('');
        setIsLoading(false);
        return;
      }

      // Call API
      const user = await api.login(phone, pinToSubmit);
      localStorage.setItem('upay_authenticated', 'true');
      localStorage.setItem('upay_phone', phone);
      onLoginSuccess(user);
    } catch (err: any) {
      // Fallback demo user if backend is offline
      const fallbackUser: UserProfile = {
        customer_id: 'SYN-U-10082',
        display_name: 'TANVIR KABIR',
        phone_masked: '01771 *** 164',
        raw_phone: phone || '01771449164',
        account_number: '01771449164-9',
        account_balance_bdt: 25450.00,
        cash_reward_bdt: 150.00,
        status: 'ACTIVE'
      };
      localStorage.setItem('upay_authenticated', 'true');
      onLoginSuccess(fallbackUser);
    } finally {
      setIsLoading(false);
    }
  };

  // Instant 1-Click Fast Login
  const handleFastDemoLogin = () => {
    setPin('1234');
    executeLogin('01771449164', '1234');
  };

  // Simulate Biometric Login
  const handleBiometricLogin = () => {
    setBiometricSuccess(true);
    setPin('1234');
    setTimeout(() => {
      executeLogin(phoneNumber, '1234');
    }, 700);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-900 relative">
      
      {/* Top Bar with Language & View Mode Switcher */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-xs z-40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFB800]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#0047BA]" />
            <span className="font-extrabold text-amber-400 font-bengali text-sm ml-1">
              {t('brand.title')}
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title={isBn ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
          >
            <span>🌐</span>
            <span className="font-mono">{isBn ? 'EN' : 'বাং'}</span>
          </button>

          {/* View Mode Switcher */}
          <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'mobile' ? 'bg-slate-950 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="স্মার্টফোন প্রিভিউ ফ্রেম"
            >
              <span>📱</span>
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'desktop' ? 'bg-slate-950 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="ডেস্কটপ ওয়াইডস্ক্রিন"
            >
              <span>💻</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex justify-center items-center p-0 md:p-6 overflow-y-auto">
        <div
          className={`w-full ${
            viewMode === 'mobile'
              ? isMobileDevice
                ? 'h-[100dvh]'
                : 'md:w-[412px] h-[100dvh] md:h-[870px] md:rounded-[44px] md:border-[8px] md:border-slate-800 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]'
              : 'max-w-[480px] my-auto rounded-3xl border border-slate-800 shadow-2xl'
          } bg-white text-slate-900 relative flex flex-col overflow-hidden`}
        >
          {/* Top Decorative Ambient Header with Upay Colors */}
          <div className="relative bg-gradient-to-b from-blue-50/90 via-sky-50/40 to-white pt-7 pb-4 px-6 border-b border-slate-100 flex flex-col items-center text-center">
            {/* Ambient subtle glow circles */}
            <div className="absolute top-0 right-10 w-24 h-24 bg-amber-300/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-4 left-8 w-24 h-24 bg-blue-400/15 rounded-full blur-2xl pointer-events-none" />

            {/* Upay Logo Graphic */}
            <div className="relative w-16 h-16 mb-2">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm select-none">
                <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#0047BA" strokeWidth="2.5" />
                {/* Yellow Figure */}
                <circle cx="39" cy="38" r="8" fill="#FFC700" />
                <path d="M 32 49 C 32 46 46 46 46 49 L 46 59 C 46 68 53 74 62 74 C 54 80 32 78 32 60 Z" fill="#FFC700" />
                {/* Blue Figure */}
                <circle cx="68" cy="38" r="8" fill="#0047BA" />
                <path d="M 61 49 C 61 46 75 46 75 49 L 75 60 C 75 76 57 77 50 72 C 57 72 61 67 61 58 Z" fill="#0047BA" />
              </svg>
            </div>

            {/* Title & Tagline */}
            <h1 className="text-xl font-black text-slate-900 font-bengali tracking-tight flex items-center justify-center gap-1.5">
              <span>{isBn ? 'স্বাগতম' : 'Welcome to'}</span>
              <span className="text-[#0047BA]">{isBn ? 'উপায়' : 'Upay'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-sans font-bold border border-amber-300 shadow-2xs">
                AI
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-bengali mt-1 max-w-[280px]">
              {isBn ? 'স্মার্ট ও সুরক্ষিত মোবাইল ফাইন্যান্সিয়াল সার্ভিস' : 'Smart & Secure AI Financial Platform'}
            </p>
          </div>

          {/* Scrollable / Interactive Login Body */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 flex flex-col justify-between">
            
            {/* Account Selector Card */}
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-blue-50/90 to-sky-50/70 border border-blue-200/80 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-900 font-extrabold flex items-center justify-center shadow-xs text-sm font-mono border border-amber-200">
                    TK
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">TANVIR KABIR</span>
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    {isEditingPhone ? (
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        className="text-xs font-mono font-semibold bg-white border border-blue-300 rounded px-1.5 py-0.5 text-slate-800 w-28 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="01XXXXXXXXX"
                        maxLength={11}
                      />
                    ) : (
                      <div className="text-xs text-slate-600 font-mono flex items-center gap-1">
                        <span>🇧🇩</span>
                        <span>{phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingPhone(!isEditingPhone)}
                  className="text-[11px] font-bold text-[#0047BA] hover:text-blue-800 font-bengali hover:underline cursor-pointer"
                >
                  {isEditingPhone ? (isBn ? 'সংরক্ষণ' : 'Save') : (isBn ? 'নম্বর পরিবর্তন' : 'Change')}
                </button>
              </div>

              {/* Fast 1-Click Demo Login Banner */}
              <button
                type="button"
                onClick={handleFastDemoLogin}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer border border-amber-400/80"
              >
                <Sparkles className="w-4 h-4 text-slate-950 fill-amber-300" />
                <span className="font-bengali">
                  {isBn ? '⚡ ১-ক্লিক ডেমো লগইন (তানভীর কবির)' : '⚡ 1-Click Fast Login (TANVIR KABIR)'}
                </span>
              </button>
            </div>

            {/* PIN Entry Area */}
            <div className="my-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 font-bengali mb-1.5">
                <Lock className="w-3.5 h-3.5 text-[#0047BA]" />
                <span>{isBn ? '৪ সংখ্যার গোপন পিন লিখুন' : 'Enter 4-Digit Secret PIN'}</span>
              </div>

              {/* 4 PIN Dots */}
              <div
                className={`flex justify-center items-center gap-4 my-3 transition-transform ${
                  shakeError ? 'translate-x-[-8px] text-rose-500' : ''
                }`}
              >
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = index < pin.length;
                  return (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full transition-all duration-200 ${
                        isFilled
                          ? 'bg-[#0047BA] scale-125 shadow-md ring-4 ring-blue-100'
                          : 'bg-slate-100 border-2 border-slate-300'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Error or Biometric Success Message */}
              {errorMessage && (
                <div className="flex items-center justify-center gap-1 text-xs font-semibold text-rose-600 font-bengali mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {biometricSuccess && (
                <div className="flex items-center justify-center gap-1 text-xs font-semibold text-emerald-600 font-bengali mt-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{isBn ? 'বায়োমেট্রিক সফলভাবে যাচাই হয়েছে!' : 'Biometric Verified!'}</span>
                </div>
              )}

              {/* Demo Helper Pill */}
              <div className="mt-1">
                <span className="inline-block text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {isBn ? 'ডেমো পিন: ১২৩৪' : 'Demo PIN: 1234'}
                </span>
              </div>
            </div>

            {/* 3x4 Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 my-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleDigitPress(digit)}
                  className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-blue-50 text-slate-800 text-xl font-bold font-mono transition-all active:scale-92 flex items-center justify-center shadow-2xs border border-slate-200/80 cursor-pointer"
                >
                  {digit}
                </button>
              ))}

              {/* Bottom Row: Biometric, 0, Backspace */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleBiometricLogin}
                className="h-12 rounded-2xl bg-blue-50 hover:bg-blue-100 text-[#0047BA] transition-all active:scale-92 flex flex-col items-center justify-center shadow-2xs border border-blue-200 cursor-pointer"
                title={isBn ? 'বায়োমেট্রিক লগইন' : 'Biometric Login'}
              >
                <Fingerprint className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase mt-0.5">Touch ID</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDigitPress('0')}
                className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-blue-50 text-slate-800 text-xl font-bold font-mono transition-all active:scale-92 flex items-center justify-center shadow-2xs border border-slate-200/80 cursor-pointer"
              >
                0
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleDelete}
                className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-92 flex items-center justify-center cursor-pointer border border-slate-200"
                title={isBn ? 'মুছুন' : 'Backspace'}
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Action Buttons & Footer Links */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                disabled={pin.length !== 4 || isLoading}
                onClick={() => executeLogin(phoneNumber, pin)}
                className={`w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 font-bengali shadow-md ${
                  pin.length === 4 && !isLoading
                    ? 'bg-gradient-to-r from-[#0047BA] to-[#003388] text-white hover:from-[#003893] hover:to-[#002766] active:scale-98 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isBn ? 'লগইন করুন' : 'Log In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Forgot PIN & Help */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  onClick={() => setShowForgotTip(!showForgotTip)}
                  className="text-slate-500 hover:text-slate-800 font-bengali transition hover:underline cursor-pointer"
                >
                  {isBn ? 'পিন ভুলে গেছেন?' : 'Forgot PIN?'}
                </button>

                <button
                  type="button"
                  onClick={handleFastDemoLogin}
                  className="text-[#0047BA] font-bold font-bengali hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>{isBn ? 'ডেমো অ্যাকাউন্ট' : 'Demo Account'}</span>
                  <span>→</span>
                </button>
              </div>

              {/* Forgot PIN Tooltip */}
              {showForgotTip && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bengali animate-in fade-in">
                  💡 {isBn ? 'ডেমো অ্যাকাউন্টের ডিফল্ট পিন হলো: ১২৩৪ (1234)। আপনি সরাসরি ১-ক্লিক ডেমো লগইনেও ট্যাপ করতে পারেন।' : 'The default Demo PIN is 1234. You can also tap the 1-Click Fast Login button.'}
                </div>
              )}
            </div>

          </div>

          {/* Authentic Bottom Brand Bar */}
          <footer className="py-2.5 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3 text-blue-600" />
            <span>UCB Fintech Company Ltd. • 256-bit SSL</span>
          </footer>

        </div>
      </main>

    </div>
  );
};
