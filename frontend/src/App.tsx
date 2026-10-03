import React, { useState, useEffect } from 'react';
import { SplashView } from './components/modules/splash/SplashView';
import { Shell, ActiveTab } from './components/layout/Shell';
import { HomeView } from './components/modules/home/HomeView';
import { CardView } from './components/modules/card/CardView';
import { ReportView } from './components/modules/report/ReportView';
import { CreditView } from './components/modules/credit/CreditView';
import { VoiceView } from './components/modules/voice/VoiceView';
import { AuditView } from './components/modules/audit/AuditView';
import { BalanceBottomSheet } from './components/shared/BalanceBottomSheet';
import { NotificationModal } from './components/shared/NotificationModal';
import { api } from './services/api';
import { UserProfile, Card as CardType, Case, CreditProfile, AppNotification } from './types';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<ActiveTab>('home');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [card, setCard] = useState<CardType | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [credit, setCredit] = useState<CreditProfile | null>(null);
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
        account_balance_bdt: 7.25,
        cash_reward_bdt: 25.00,
        status: 'ACTIVE'
      });
    }
  };

  const fetchCardData = async () => {
    try {
      const cards = await api.getCards();
      if (cards && cards.length > 0) {
        setCard(cards[0]);
      }
    } catch (err) {
      console.warn('Failed to load card data:', err);
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
      console.warn('Failed to load credit profile:', err);
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

  useEffect(() => {
    refreshAll();
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashView onComplete={() => setShowSplash(false)} />;
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
