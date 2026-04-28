/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, Suspense, lazy } from 'react';
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

import { DataProvider } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';

const INITIAL_CAR_MODELS: Record<string, string[]> = {
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

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [previousView, setPreviousView] = useState<ViewState | null>(null);
  const [carModels, setCarModels] = useState<Record<string, string[]>>(INITIAL_CAR_MODELS);
  const [hasCatalogAccess, setHasCatalogAccess] = useState(false);
  const [catalogSource, setCatalogSource] = useState<'customer' | 'admin'>('customer');

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
    <AuthProvider>
      <DataProvider>
        <div className="min-h-screen min-h-[100dvh] bg-gray-100 text-black font-sans flex justify-center">
          <div className="w-full max-w-md bg-white min-h-screen min-h-[100dvh] relative shadow-2xl overflow-hidden">
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
          </div>
        </div>
      </DataProvider>
    </AuthProvider>
  );
}
