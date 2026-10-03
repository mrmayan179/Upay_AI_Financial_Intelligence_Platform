import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'bn' | 'en';
export type ViewMode = 'mobile' | 'desktop';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  isMobileDevice: boolean;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  bn: {
    // Brand & Header
    'brand.title': 'উপায়',
    'brand.subtitle': 'AI ইন্টেলিজেন্স প্ল্যাটফর্ম',
    'header.balance': 'ব্যালেন্স',
    'header.notifications': 'বিজ্ঞপ্তি',
    'header.welcome': 'স্বাগতম',
    'header.phone': 'মোবাইল নম্বর',

    // Nav & Tabs
    'nav.home': 'হোম',
    'nav.card': 'স্মার্ট কার্ড',
    'nav.report': 'রিপোর্ট ও কেস',
    'nav.credit': 'লোন ও ক্রেডিট',
    'nav.voice': 'ভয়েস এআই',
    'nav.audit': 'এআই অডিট ও লগ',

    // View mode & Language
    'mode.desktop': 'ডেস্কটপ ভিউ',
    'mode.mobile': 'মোবাইল ভিউ',
    'lang.current': 'বাংলা',
    'lang.switch': 'English',
    'demo.badge': 'ডেমো ফিচার',
    'demo.tooltip': 'হ্যাকথন সিমুলেশন — সুরক্ষিত ডেমো ডাটা',

    // Services Grid
    'service.send_money': 'Send Money',
    'service.mobile_recharge': 'Mobile Recharge',
    'service.cash_out': 'Cash Out',
    'service.pay_bill': 'Pay Bill',
    'service.add_money': 'Add Money',
    'service.savings': 'Savings',
    'service.fund_transfer': 'Fund Transfer',
    'service.request_money': 'Request Money',
    'service.make_payment': 'Make Payment',
    'service.refer_earn': 'Refer & Earn',
    'service.npsb': 'NPSB',
    'service.ai_audit': 'AI Audit',

    // Banners & Sections
    'banner.destination': 'পাহাড় নাকি সমুদ্র? ডেস্টিনেশন এবার কোথায়?',
    'banner.discount_flight': 'ফ্লাইট বুকিং-এ ১০% ছাড়',
    'banner.discount_hotel': 'হোটেল বুকিং-এ ৬৫% ছাড়',
    'banner.click_here': 'ক্লিক করুন',
    'payment.section_title': 'উপায় পেমেন্ট',
    'payment.traffic': 'Traffic Fine',
    'payment.toll': 'Toll Payment',
    'payment.govt': 'Govt. Payment',
    'payment.education': 'Education',
    'payment.ngo': 'NGO',
    'payment.insurance': 'Insurance',
    'payment.donation': 'Donation',
    'payment.zakat': 'Zakat',

    // AI Cards
    'ai.suite_title': 'উপায় কৃত্রিম বুদ্ধিমত্তা (AI) সেবাসমূহ',
    'ai.card_title': 'উপায় স্মার্ট কার্ড',
    'ai.card_desc': 'AI ফ্রড শিল্ড ও ডুয়েল কারেন্সি পাসপোর্ট ট্র্যাকার',
    'ai.report_title': 'অভিযোগ সমাধান',
    'ai.report_desc': 'AI ক্যাটাগরি ডিটেকশন ও স্বয়ংক্রিয় টাইমলাইন ট্র্যাকিং',
    'ai.credit_title': 'লোন ও ক্রেডিট স্কোর',
    'ai.credit_desc': 'ব্যাংক রিভিউর জন্য স্বচ্ছ AI স্কোর ও ব্যাখ্যা',
    'ai.voice_title': 'AI ভয়েস কাস্টমার কেয়ার',
    'ai.voice_desc': '২৪/৭ ভেরিফিকেশন ও একাউন্ট সমাধান',
    'ai.models_active': '৩টি সক্রিয় মডেল',

    // Action Pills & Chaka
    'pill.card': 'উপায় কার্ড',
    'pill.offer': 'উপায় অফার',
    'chaka.title': 'উপায় চাকা',
    'chaka.spin_msg': 'প্রতিদিন চাকা ঘুরিয়ে নিশ্চিত ক্যাশব্যাক জিতে নিন!',
    'chaka.btn_spin': 'এখনই ঘুরান!',

    // BANGLA QR
    'qr.title': 'বাংলা কিউআর (BANGLA QR)',
    'qr.subtitle': 'বাংলাদেশ ব্যাংক অনুমোদিত ইন্টারঅপারেবল কিউআর',
    'qr.scan_instruction': 'যেকোনো মার্চেন্ট কিউআর কোড স্ক্যান করুন',
    'qr.pay_btn': 'পে করুন',

    // Card View
    'card.title': 'উপায় ডুয়েল-কারেন্সি স্মার্ট কার্ড',
    'card.subtitle': 'বাংলাদেশ ব্যাংক নীতিমালা অনুযায়ী আন্তর্জাতিক পাসপোর্ট ট্র্যাকার ও AI ফ্রড সুরক্ষা',
    'card.endorsement_title': 'পাসপোর্ট এনডোর্সমেন্ট ট্র্যাকার (USD)',
    'card.endorsement_limit': 'বার্ষিক অনুমোদন সীমা',
    'card.endorsement_used': 'ব্যয়িত পরিমাণ',
    'card.endorsement_available': 'অবশিষ্ট সীমা',
    'card.toggle_active': 'কার্ড স্ট্যাটাস (সক্রিয়/লক)',
    'card.toggle_online': 'ই-কমার্স ও অনলাইন পেমেন্ট',
    'card.toggle_intl': 'আন্তর্জাতিক USD পেমেন্ট',
    'card.toggle_nfc': 'NFC কনট্যাক্টলেস ট্যাপ',
    'card.btn_pin_reset': 'পিন পরিবর্তন (Mock PIN Reset)',
    'card.btn_simulate': 'AI ট্রানজেকশন ফ্রড টেস্ট',
    'card.live_simulator': 'রিয়েল-টাইম AI রিস্ক সিমুলেটর',

    // Report View
    'report.title': 'স্মার্ট রিপোর্ট ও অভিযোগ ব্যবস্থাপনা',
    'report.subtitle': 'স্বয়ংক্রিয় NLP অভিযোগ শ্রেণীকরণ ও টাইমলাইন ট্র্যাকিং',
    'report.btn_new': 'নতুন অভিযোগ দাখিল করুন',
    'report.input_placeholder': 'আপনার অভিযোগের বিবরণ লিখুন (যেমন: এটিএম থেকে টাকা কাটলেও ক্যাশ আসেনি...)',
    'report.active_cases': 'চলমান অভিযোগসমূহ',
    'report.case_timeline': 'তদন্তের টাইমলাইন',
    'report.escalate_btn': 'উচ্চপদস্থ কর্মকর্তার কাছে পাঠান (Escalate)',

    // Credit View
    'credit.title': 'AI ক্রেডিট রেডিনেস ও লোন বিশ্লেষণ',
    'credit.subtitle': 'স্বচ্ছ TreeSHAP ব্যাখ্যাভিত্তিক ক্ষুদ্রঋণ পূর্ব-যোগ্যতা যাচাই',
    'credit.score_dial': 'ক্রেডিট রেডিনেস স্কোর',
    'credit.suggested_limit': 'প্রস্তাবিত লোন সীমা',
    'credit.positive_factors': 'ইতিবাচক প্রভাবকসমূহ (+SHAP)',
    'credit.negative_factors': 'উন্নতিযোগ্য প্রভাবকসমূহ (-SHAP)',
    'credit.btn_request_bank': 'অংশীদার ব্যাংকে আনুষ্ঠানিক রিভিউর আবেদন পাঠান',
    'credit.disclaimer': 'সতর্কবার্তা: এটি স্বয়ংক্রিয় অনুমোদন নয়। বাংলাদেশ ব্যাংকের নির্দেশনা অনুযায়ী চূড়ান্ত অনুমোদন অংশীদার ব্যাংকের বিবেচ্য।',

    // Voice View
    'voice.title': 'AI ভয়েস কাস্টমার কেয়ার (২৪/৭)',
    'voice.subtitle': 'নিরাপদ কলার ভেরিফিকেশন ও নিয়ন্ত্রিত একাউন্ট টুলস',
    'voice.btn_start': 'এআই এজেন্টের সাথে কল শুরু করুন',
    'voice.btn_end': 'কল শেষ করুন',
    'voice.challenge_title': 'নিরাপত্তা যাচাইকরণ',
    'voice.transcript_title': 'লাইভ কথোপকথন ট্রানস্ক্রিপ্ট',
    'voice.tools_title': 'অনুমোদিত একাউন্ট টুলস',

    // Audit View
    'audit.title': 'এআই গভর্ন্যান্স ও ডিসিশন অবজার্ভেবিলিটি',
    'audit.subtitle': 'প্রতিটি এআই অনুমানের অপরিবর্তনীয় অডিট লগ, লেটেন্সি ও পিআইআই-স্ক্রাবড ট্রেস',
    'audit.total_decisions': 'মোট এআই সিদ্ধান্ত',
    'audit.avg_latency': 'গড় রেসপন্স লেটেন্সি',
    'audit.blocked': 'ঝুঁকিপূর্ণ লেনদেন প্রতিরোধ',
    'audit.compliance': 'নিয়মকানুন সম্মতি হার'
  },
  en: {
    // Brand & Header
    'brand.title': 'upay',
    'brand.subtitle': 'AI Financial Intelligence Platform',
    'header.balance': 'Balance',
    'header.notifications': 'Notifications',
    'header.welcome': 'Welcome',
    'header.phone': 'Mobile Number',

    // Nav & Tabs
    'nav.home': 'Home',
    'nav.card': 'Smart Card',
    'nav.report': 'Disputes & Cases',
    'nav.credit': 'Credit & Loans',
    'nav.voice': 'Voice AI Care',
    'nav.audit': 'AI Governance',

    // View mode & Language
    'mode.desktop': 'Desktop View',
    'mode.mobile': 'Mobile View',
    'lang.current': 'English',
    'lang.switch': 'বাংলা',
    'demo.badge': 'DEMO FEATURE',
    'demo.tooltip': 'Hackathon Simulation — Synthetic Safe Data',

    // Services Grid
    'service.send_money': 'Send Money',
    'service.mobile_recharge': 'Mobile Recharge',
    'service.cash_out': 'Cash Out',
    'service.pay_bill': 'Pay Bill',
    'service.add_money': 'Add Money',
    'service.savings': 'Savings',
    'service.fund_transfer': 'Fund Transfer',
    'service.request_money': 'Request Money',
    'service.make_payment': 'Make Payment',
    'service.refer_earn': 'Refer & Earn',
    'service.npsb': 'NPSB',
    'service.ai_audit': 'AI Audit',

    // Banners & Sections
    'banner.destination': 'Mountains or Sea? Where is your next trip?',
    'banner.discount_flight': 'Up to 10% off Flight Bookings',
    'banner.discount_hotel': 'Up to 65% off Hotel Bookings',
    'banner.click_here': 'Click Here',
    'payment.section_title': 'Upay Payment',
    'payment.traffic': 'Traffic Fine',
    'payment.toll': 'Toll Payment',
    'payment.govt': 'Govt. Payment',
    'payment.education': 'Education',
    'payment.ngo': 'NGO',
    'payment.insurance': 'Insurance',
    'payment.donation': 'Donation',
    'payment.zakat': 'Zakat',

    // AI Cards
    'ai.suite_title': 'Upay Artificial Intelligence (AI) Suites',
    'ai.card_title': 'Upay Smart Card',
    'ai.card_desc': 'AI Fraud Shield & Dual-Currency Passport Tracker',
    'ai.report_title': 'Dispute Resolution',
    'ai.report_desc': 'NLP Category Detection & Automated Case Timelines',
    'ai.credit_title': 'Loan & Credit Score',
    'ai.credit_desc': 'Transparent AI Scoring & Attribution for Bank Review',
    'ai.voice_title': 'AI Voice Customer Care',
    'ai.voice_desc': '24/7 Verification & Least-Privileged Account Actions',
    'ai.models_active': '3 Active Models',

    // Action Pills & Chaka
    'pill.card': 'Upay Card',
    'pill.offer': 'Upay Offers',
    'chaka.title': 'Upay Chaka',
    'chaka.spin_msg': 'Spin the wheel daily for guaranteed cashback!',
    'chaka.btn_spin': 'Spin Now!',

    // BANGLA QR
    'qr.title': 'BANGLA QR Interoperable Scanner',
    'qr.subtitle': 'Bangladesh Bank Interoperable Standard QR System',
    'qr.scan_instruction': 'Scan any merchant QR code to simulate checkout',
    'qr.pay_btn': 'Pay Now',

    // Card View
    'card.title': 'Upay Dual-Currency Smart Card',
    'card.subtitle': 'Bangladesh Bank Passport Quota Compliance & Real-Time AI Fraud Guard',
    'card.endorsement_title': 'Passport Endorsement Tracker (USD)',
    'card.endorsement_limit': 'Annual Quota Limit',
    'card.endorsement_used': 'Amount Utilized',
    'card.endorsement_available': 'Remaining Balance',
    'card.toggle_active': 'Card Status (Active/Frozen)',
    'card.toggle_online': 'Online E-Commerce Payments',
    'card.toggle_intl': 'International (USD) Usage',
    'card.toggle_nfc': 'NFC Contactless Tap',
    'card.btn_pin_reset': 'Change PIN (Mock PIN Reset)',
    'card.btn_simulate': 'AI Transaction Fraud Test',
    'card.live_simulator': 'Real-Time AI Risk Simulator',

    // Report View
    'report.title': 'Smart Report & Dispute Management',
    'report.subtitle': 'Automated NLP Categorization, Priority Triage & Case Tracking',
    'report.btn_new': 'File New Dispute',
    'report.input_placeholder': 'Describe your issue (e.g., Charged twice at merchant POS, cash not dispensed...)',
    'report.active_cases': 'Active Dispute Cases',
    'report.case_timeline': 'Investigation Timeline',
    'report.escalate_btn': 'Escalate to Tier-1 Supervisor',

    // Credit View
    'credit.title': 'AI Credit Readiness & Microcredit Recommendation',
    'credit.subtitle': 'Explainable TreeSHAP Factor Attribution for Digital Lending',
    'credit.score_dial': 'Credit Readiness Score',
    'credit.suggested_limit': 'Suggested Loan Range',
    'credit.positive_factors': 'Positive Contributing Factors (+SHAP)',
    'credit.negative_factors': 'Factors to Improve (-SHAP)',
    'credit.btn_request_bank': 'Forward Request to Licensed Partner Bank',
    'credit.disclaimer': 'Regulatory Notice: This readiness assessment is not a final loan approval. All underwriting is performed by licensed partner banks under Bangladesh Bank regulations.',

    // Voice View
    'voice.title': 'AI Voice Customer Care (24/7)',
    'voice.subtitle': 'Caller Identity Challenge & Least-Privileged Account Tools',
    'voice.btn_start': 'Start Call with Upay AI Agent',
    'voice.btn_end': 'End Call',
    'voice.challenge_title': 'Caller Security Verification',
    'voice.transcript_title': 'Live Call Transcript',
    'voice.tools_title': 'Permitted Account Tools',

    // Audit View
    'audit.title': 'AI Governance & Decision Observability',
    'audit.subtitle': 'Immutable audit traces, sub-50ms execution latency, and PII-scrubbed feature logs',
    'audit.total_decisions': 'Total AI Decisions',
    'audit.avg_latency': 'Average Latency',
    'audit.blocked': 'High-Risk Interventions',
    'audit.compliance': 'Regulatory Compliance'
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language state: default to 'bn' (authentic Bengali Upay experience), switchable to 'en'
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('upay_language') as Language) || 'bn';
  });

  // 2. ViewMode: Auto-detect based on screen width!
  // If desktop screen (>=1024px), default to 'desktop' full widescreen.
  // If mobile screen, default to 'mobile'.
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 ? 'desktop' : 'mobile';
    }
    return 'desktop';
  });

  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  // Auto-detect on resize
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileDevice(isMobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('upay_language', lang);
  };

  const toggleLanguage = () => {
    const next = language === 'bn' ? 'en' : 'bn';
    setLanguage(next);
  };

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
  };

  const toggleViewMode = () => {
    setViewModeState(prev => (prev === 'desktop' ? 'mobile' : 'desktop'));
  };

  const t = (key: string): string => {
    const currentDict = translations[language] || translations.bn;
    return currentDict[key] || translations.en[key] || key;
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        viewMode,
        setViewMode,
        toggleViewMode,
        isMobileDevice,
        t
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
