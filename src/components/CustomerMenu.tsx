import React, { useState } from 'react';
import { ViewState } from '../types';
import { ChevronLeft, PlusCircle, List, ChevronRight, Star, Users, X, CreditCard } from 'lucide-react';
import { useData } from '../context/DataContext';
import { BANNER_ROTATION_INTERVAL_MS, getNextBannerIndex, getVisibleBannerIndex } from '../lib/bannerRotation';

interface Props {
  onNavigate: (view: ViewState) => void;
  hasCatalogAccess: boolean;
  setHasCatalogAccess: (access: boolean) => void;
}

export default function CustomerMenu({ onNavigate, hasCatalogAccess, setHasCatalogAccess }: Props) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { banners } = useData();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const activeBanners = banners.filter(b => b.status === 'active');

  React.useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => getNextBannerIndex(prev, activeBanners.length));
    }, BANNER_ROTATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const currentBanner = activeBanners[getVisibleBannerIndex(currentBannerIndex, activeBanners.length)];

  const handleCatalogClick = () => {
    if (hasCatalogAccess) {
      onNavigate('contractors_catalog');
    } else {
      setIsPaymentModalOpen(true);
    }
  };

  const handlePayment = () => {
    // Simulate payment process
    setTimeout(() => {
      setHasCatalogAccess(true);
      setIsPaymentModalOpen(false);
      onNavigate('contractors_catalog');
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      <div className="bg-white p-4 flex items-center justify-center shadow-md sticky top-0 z-10 relative">
        <button 
          onClick={() => onNavigate('home')}
          className="absolute left-4 p-2 -ml-2 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Заказать услугу</h1>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4 mt-4">
        {/* Leader Ads Banner */}
        {currentBanner && (
          <div className="space-y-4">
            <div key={currentBanner.id} className="bg-white rounded-md p-4 shadow-lg border-l-4 border-orange-500 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 whitespace-nowrap bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-md uppercase tracking-wider">
                Лидер
              </div>
              <div className="w-16 h-16 bg-[#E8EDF2] rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                {currentBanner.logo ? (
                  <img src={currentBanner.logo} alt={currentBanner.contractor} className="w-full h-full object-cover" />
                ) : (
                  <Star className="w-8 h-8 text-orange-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <h3 className="font-bold text-gray-900">{currentBanner.contractor}</h3>
                  <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{currentBanner.description || 'Рекламный блок исполнителя'}</p>
              </div>
            </div>
          </div>
        )}

        <button 
          onClick={() => onNavigate('order_form')}
          className="flex flex-col items-center justify-center bg-orange-500 text-white p-6 rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
        >
          <PlusCircle className="w-12 h-12 mb-3 opacity-90" />
          <h2 className="text-xl font-bold">Оформить заказ услуги</h2>
          <p className="text-orange-100 text-sm mt-1 text-center">Заполните форму, чтобы отправить<br/>ваш заказ исполнителям</p>
        </button>

        <button 
          onClick={() => onNavigate('customer_orders')}
          className="flex items-center bg-white p-5 rounded-2xl shadow-md border border-gray-100 active:scale-[0.98] transition-transform text-left"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
            <List className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">Мои заказы</h3>
            <p className="text-sm text-gray-500">Личный кабинет заказчика</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </button>

        <button 
          onClick={handleCatalogClick}
          className="flex items-center bg-white p-5 rounded-2xl shadow-md border border-gray-100 active:scale-[0.98] transition-transform text-left"
        >
          <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">Каталог исполнителей</h3>
            <p className="text-sm text-gray-500">Доступ к полной базе автосервисов</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </button>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">Доступ к каталогу</h3>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Каталог исполнителей</h4>
              <p className="text-sm text-gray-600 mb-6">
                Получите доступ к полной базе автосервисов с возможностью фильтрации и прямого контакта.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Стоимость доступа</span>
                  <span className="font-bold text-gray-900">5.00 BYN</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Срок действия</span>
                  <span className="font-medium text-gray-700">10 дней</span>
                </div>
              </div>
              <button 
                onClick={handlePayment}
                className="w-full bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Оплатить 5.00 BYN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Back Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20 max-w-md mx-auto w-full">
        <button 
          onClick={() => onNavigate('home')} 
          className="w-full flex items-center justify-center gap-2 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] font-bold py-4 rounded-xl active:scale-[0.98] transition-all"
        >
          <ChevronLeft className="w-5 h-5" /> Назад на главную
        </button>
      </div>
    </div>
  );
}
