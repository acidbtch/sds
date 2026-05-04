/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState } from './types';
import Home from './components/Home';

const CustomerMenu = lazy(() => import('./components/CustomerMenu'));
const OrderForm = lazy(() => import('./components/OrderForm'));
const CustomerOrders = lazy(() => import('./components/CustomerOrders'));
const ContractorMenu = lazy(() => import('./components/ContractorMenu'));
const ContractorRegister = lazy(() => import('./components/ContractorRegister'));
const ContractorCabinet = lazy(() => import('./components/ContractorCabinet'));
const ContractorsCatalog = lazy(() => import('./components/ContractorsCatalog'));
const FAQ = lazy(() => import('./components/FAQ'));
const Support = lazy(() => import('./components/Support'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));

import { DataProvider, useData } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { APP_IDLE_SESSION_MS, isLongAppPause } from './lib/appLifecycle';

const INITIAL_CAR_MODELS: Record<string, unknown[]> = {
  "Audi": ["A3", "A4", "A6", "Q3", "Q5", "Q7"],
  "BMW": ["3 Series", "5 Series", "X3", "X5", "X6"],
  "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "GLE"],
  "Volkswagen": ["Golf", "Passat", "Polo", "Tiguan"],
  "Toyota": ["Camry", "Corolla", "RAV4", "Land Cruiser"],
  "Ford": ["Focus", "Mondeo", "Kuga", "Transit"],
  "Hyundai": ["Accent", "Elantra", "Tucson", "Santa Fe"],
  "Kia": ["Rio", "Ceed", "Sportage", "Sorento"],
  "Skoda": ["Octavia", "Rapid", "Superb", "Kodiaq"],
  "Renault": ["Logan", "Duster", "Sandero", "Kaptur"],
  "Peugeot": ["208", "308", "3008", "5008"],
  "Nissan": ["Qashqai", "X-Trail", "Almera", "Juke"],
  "Mazda": ["Mazda3", "Mazda6", "CX-5", "CX-9"],
  "Honda": ["Civic", "Accord", "CR-V", "HR-V"],
  "Lada": ["Vesta", "Granta", "Largus", "Niva"],
  "Geely": ["Coolray", "Atlas", "Tugella", "Emgrand"],
  "Другая марка": ["Другая модель"]
};

function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-100 text-black font-sans flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen min-h-[100dvh] relative shadow-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <AppFrame>
      <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    </AppFrame>
  );
}

function BlockedAccountScreen() {
  return (
    <AppFrame>
      <div className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center bg-white px-6 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <span className="text-3xl font-bold">!</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Аккаунт заблокирован</h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-600">
          Ваш аккаунт заблокирован администратором. Доступ к приложению ограничен.
        </p>
      </div>
    </AppFrame>
  );
}

function SessionExpiredNotice({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900">Сессия устарела</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Приложение долго было открыто без действий. Обновим данные и вернёмся на главную страницу.
        </p>
        <button
          type="button"
          onClick={onAccept}
          className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-bold text-white transition active:scale-[0.98]"
        >
          Принять
        </button>
      </div>
    </div>
  );
}

function AppShell() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [previousView, setPreviousView] = useState<ViewState | null>(null);
  const [carModels, setCarModels] = useState<Record<string, unknown[]>>(INITIAL_CAR_MODELS);
  const [hasCatalogAccess, setHasCatalogAccess] = useState(false);
  const [catalogSource, setCatalogSource] = useState<'customer' | 'admin'>('customer');
  const [isSessionNoticeVisible, setIsSessionNoticeVisible] = useState(false);
  const hiddenAtRef = useRef<number | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { refreshUser } = useAuth();
  const { refreshPublicData, refreshAdminData } = useData();

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();

    if (currentView === 'home') {
      if (tg.isVersionAtLeast?.('6.1')) tg.BackButton?.hide();
    } else {
      if (tg.isVersionAtLeast?.('6.1')) tg.BackButton?.show();
    }

    const handleBack = () => {
      if (currentView === 'contractors_catalog' && catalogSource === 'admin') {
        setCurrentView('admin_panel');
      } else if (previousView && previousView !== currentView) {
        setCurrentView(previousView);
      } else {
        setCurrentView('home');
      }
      setPreviousView('home');
    };

    if (tg.isVersionAtLeast?.('6.1') && tg.BackButton) {
      tg.BackButton.onClick(handleBack);
      return () => {
        tg.BackButton.offClick(handleBack);
      };
    }
  }, [currentView, previousView, catalogSource]);

  const handleNavigate = (view: ViewState) => {
    if (view === 'contractors_catalog') {
      if (currentView === 'admin_panel') {
        setCatalogSource('admin');
      } else if (currentView === 'customer_menu' || currentView === 'home' || currentView === 'customer_orders') {
        setCatalogSource('customer');
      }
    }
    setPreviousView(currentView);
    setCurrentView(view);
  };

  const showSessionNotice = useCallback(() => {
    setIsSessionNoticeVisible(true);
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    if (isSessionNoticeVisible || document.visibilityState !== 'visible') {
      return;
    }

    idleTimerRef.current = setTimeout(showSessionNotice, APP_IDLE_SESSION_MS);
  }, [isSessionNoticeVisible, showSessionNotice]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
        }
        return;
      }

      if (isLongAppPause(Date.now(), hiddenAtRef.current)) {
        showSessionNotice();
        return;
      }

      hiddenAtRef.current = null;
      resetIdleTimer();
    };

    const handleActivity = () => {
      resetIdleTimer();
    };

    const handlePageShow = () => {
      if (isLongAppPause(Date.now(), hiddenAtRef.current)) {
        showSessionNotice();
        return;
      }

      hiddenAtRef.current = null;
      resetIdleTimer();
    };

    const activityEvents: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'scroll'];

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }));
    resetIdleTimer();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [resetIdleTimer, showSessionNotice]);

  const handleSessionAccept = useCallback(() => {
    setIsSessionNoticeVisible(false);
    hiddenAtRef.current = null;
    setPreviousView(null);
    setCurrentView('home');
    void Promise.allSettled([
      refreshUser(),
      refreshPublicData(false),
      refreshAdminData(),
    ]).finally(() => {
      resetIdleTimer();
    });
  }, [refreshAdminData, refreshPublicData, refreshUser, resetIdleTimer]);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'customer_menu':
        return <CustomerMenu onNavigate={handleNavigate} hasCatalogAccess={hasCatalogAccess} setHasCatalogAccess={setHasCatalogAccess} />;
      case 'order_form':
        return <OrderForm onNavigate={handleNavigate} carModels={carModels} previousView={previousView} />;
      case 'customer_orders':
        return <CustomerOrders onNavigate={handleNavigate} />;
      case 'contractor_menu':
        return <ContractorMenu onNavigate={handleNavigate} />;
      case 'contractor_register':
        return <ContractorRegister onNavigate={handleNavigate} previousView={previousView} />;
      case 'contractor_cabinet':
        return <ContractorCabinet onNavigate={handleNavigate} />;
      case 'contractors_catalog':
        return <ContractorsCatalog onNavigate={handleNavigate} isCustomer={catalogSource === 'customer'} previousView={previousView} />;
      case 'faq':
        return <FAQ onNavigate={handleNavigate} />;
      case 'support':
        return <Support onNavigate={handleNavigate} />;
      case 'admin_panel':
        return <AdminPanel onNavigate={handleNavigate} carModels={carModels} setCarModels={setCarModels} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <AppFrame>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full min-h-screen min-h-[100dvh] bg-white relative"
        >
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
            {renderView()}
          </Suspense>
        </motion.div>
      </AnimatePresence>
      {isSessionNoticeVisible && <SessionExpiredNotice onAccept={handleSessionAccept} />}
    </AppFrame>
  );
}

function AppGate() {
  const { user, isBlocked, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isBlocked || user?.isBlocked) {
    return <BlockedAccountScreen />;
  }

  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}
