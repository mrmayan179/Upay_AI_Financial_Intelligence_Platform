import React, { useState, useEffect } from 'react';
import { SplashView } from './components/modules/splash/SplashView';
import { LoginView } from './components/modules/login/LoginView';
import { Shell, ActiveTab } from './components/layout/Shell';
import { HomeView } from './components/modules/home/HomeView';
import { CardView } from './components/modules/card/CardView';
import { ReportView } from './components/modules/report/ReportView';
import { CreditView } from './components/modules/credit/CreditView';
import { VoiceView } from './components/modules/voice/VoiceView';
import { AuditView } from './components/modules/audit/AuditView';
import { EvidenceView } from './components/modules/evidence/EvidenceView';
import { BalanceBottomSheet } from './components/shared/BalanceBottomSheet';
import { NotificationModal } from './components/shared/NotificationModal';
import { api } from './services/api';
import { UserProfile, Card as CardType, Case, CreditProfile, AppNotification } from './types';

const DEMO_CARD_FALLBACK: CardType = {
  card_id: 'SYN-CRD-10082-1',
  customer_id: 'SYN-U-10082',
  card_type: 'DUAL_CURRENCY',
  card_title: 'Upay Global Smart Card',
  card_number_masked: '•••• •••• •••• 4821',
  card_number_full: '4532 8912 6543 4821',
  expiry_date: '12/29',
  cvv: '123',
  status: 'ACTIVE',
  card_enabled: true,
  online_enabled: true,
  international_enabled: true,
  nfc_enabled: true,
  endorsement_usd: 1200.0,
  used_usd: 392.5,
  available_usd: 807.5
};

const DEMO_CREDIT_FALLBACK: CreditProfile = {
  readiness_score: 86,
  risk_probability: 0.14,
  risk_category: 'LOW / DEMO RISK',
  suggested_limit_range_bdt: 'BDT 20,000 - BDT 30,000',
  recommendation: 'RECOMMENDED_FOR_PARTNER_REVIEW',
  disclaimer: 'Demonstration readiness signal only. Final lending decisions require partner licensed bank underwriting.',
  positive_factors: [
    '+ Stable monthly salary inflow exceeding BDT 65,000',
    '+ 100% on-time historical micro-credit repayment track record',
    '+ Healthy average daily wallet balance retention (>65%)'
  ],
  negative_factors: [
    '- Elevated cash-out ratio (28% of incoming funds converted to physical cash)',
    '- Limited utility bill payment history recorded through Upay app'
  ],
  review_status: 'UNDER_BANK_REVIEW',
  review_requested: true,
  model_version: 'credit-xgb-1.0.0'
};

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('upay_authenticated') === 'true';
  });
  const [currentTab, setCurrentTab] = useState<ActiveTab>('home');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [card, setCard] = useState<CardType | null>(() => DEMO_CARD_FALLBACK);
  const [cases, setCases] = useState<Case[]>([]);
  const [credit, setCredit] = useState<CreditProfile | null>(() => DEMO_CREDIT_FALLBACK);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isBalanceOpen, setIsBalanceOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  const fetchProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch (err) {
      console.warn('Using default demo profile:', err);
      setProfile({
        customer_id: 'SYN-U-10082',
        display_name: 'TANVIR KABIR',
        phone_masked: '01771449164',
        raw_phone: '01771449164',
        account_number: '01771449164',
        account_balance_bdt: 25450.00,
        cash_reward_bdt: 150.00,
        status: 'ACTIVE'
      });
    }
  };

  const fetchCardData = async () => {
    try {
      const cards = await api.getCards();
      if (cards && cards.length > 0) {
        setCard(cards[0]);
      } else {
        setCard(DEMO_CARD_FALLBACK);
      }
    } catch (err) {
      console.warn('Failed to load card data, using fallback:', err);
      setCard(prev => prev || DEMO_CARD_FALLBACK);
    }
  };

  const fetchCasesData = async () => {
    try {
      const activeCases = await api.getActiveCases();
      setCases(activeCases);
    } catch (err) {
      console.warn('Failed to load cases:', err);
    }
  };

  const fetchCreditData = async () => {
    try {
      const creditData = await api.getCreditReadiness();
      setCredit(creditData);
    } catch (err) {
      console.warn('Failed to load credit profile, using fallback:', err);
      setCredit(prev => prev || DEMO_CREDIT_FALLBACK);
    }
  };

  const fetchNotifications = async () => {
    try {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  };

  const refreshAll = () => {
    fetchProfile();
    fetchCardData();
    fetchCasesData();
    fetchCreditData();
    fetchNotifications();
  };

  const handleLoginSuccess = (loggedProfile: UserProfile) => {
    setProfile(loggedProfile);
    setIsAuthenticated(true);
    refreshAll();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('upay_authenticated');
  };

  useEffect(() => {
    refreshAll();
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  const isEvidencePath = typeof window !== 'undefined' && (
    window.location.pathname === '/evidence' ||
    window.location.pathname === '/evidence/' ||
    window.location.pathname.startsWith('/evidence')
  );

  if (isEvidencePath) {
    return <EvidenceView />;
  }

  if (showSplash) {
    return <SplashView onComplete={() => setShowSplash(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActiveModule = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeView
            onNavigateTab={setCurrentTab}
            onOpenBalanceSheet={() => setIsBalanceOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            profile={profile}
          />
        );
      case 'card':
        return (
          <CardView
            card={card}
            onRefresh={fetchCardData}
            profile={profile}
            onOpenBalanceSheet={() => setIsBalanceOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />
        );
      case 'report':
        return (
          <ReportView
            cases={cases}
            onRefresh={fetchCasesData}
            profile={profile}
            onOpenBalanceSheet={() => setIsBalanceOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />
        );
      case 'credit':
        return (
          <CreditView
            credit={credit}
            onRefresh={fetchCreditData}
            profile={profile}
            onOpenBalanceSheet={() => setIsBalanceOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />
        );
      case 'voice':
        return (
          <VoiceView
            profile={profile}
            onOpenBalanceSheet={() => setIsBalanceOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />
        );
      case 'audit':
        return (
          <AuditView
            profile={profile}
            onOpenBalanceSheet={() => setIsBalanceOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Shell
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        profile={profile}
        notifications={notifications}
        onRefreshProfile={refreshAll}
        onLogout={handleLogout}
      >
        {renderActiveModule()}
      </Shell>

      <BalanceBottomSheet
        isOpen={isBalanceOpen}
        onClose={() => setIsBalanceOpen(false)}
        balanceBdt={profile?.account_balance_bdt ?? 7.25}
        cashRewardBdt={profile?.cash_reward_bdt ?? 0.00}
      />

      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
      />
    </>
  );
};

export default App;
