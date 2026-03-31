import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { ChevronRight, Wrench, User, HelpCircle, MessageCircle, Star, Settings, ChevronDown, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

interface Props {
  onNavigate: (view: ViewState) => void;
}

export default function Home({ onNavigate }: Props) {
  const { content, banners } = useData();
  const { login } = useAuth();
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'rules' | 'privacy' | null>(null);

  useEffect(() => {
    const initData = (window as any).Telegram?.WebApp?.initData;
    if (initData) {
      console.log('Found Telegram initData, attempting login...');
      login(initData).catch(console.error);
    } else {
      console.log('No Telegram initData found. Login request skipped. (Are you opening this outside of Telegram?)');
    }
  }, [login]);

  const activeBanners = banners.filter(b => b.status === 'active');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  React.useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % activeBanners.length);
    }, 60000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const currentBanner = activeBanners[currentBannerIndex];
  const faqItems = content.faq || [];

  return (
    <div className="flex flex-col min-h-screen bg-white pb-10">
      {/* Header Banner */}
      <div className="bg-orange-500 text-white p-6 rounded-b-3xl shadow-lg w-full">
        <h1 className="text-2xl font-bold mb-2">SDS | Simple Drive Solution</h1>
        <p className="text-orange-100 text-sm">Заказ услуг автосервиса в Беларуси</p>
      </div>

      {/* Leader Ads Banner */}
      {currentBanner && (
        <div className="px-4 mt-6 max-w-md mx-auto w-full space-y-4">
          <div key={currentBanner.id} className="bg-white rounded-md p-4 shadow-lg border-l-4 border-orange-500 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-md uppercase tracking-wider">
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

      {/* Main Menu */}
      <div className="p-4 mt-4 flex flex-col gap-3 max-w-md mx-auto w-full">
        <MenuButton 
          icon={<Wrench className="w-8 h-8 text-orange-500" />}
          title="Заказать услугу"
          subtitle="Поиск подходящего автосервиса"
          onClick={() => onNavigate('customer_menu')}
          large={true}
        />
        <MenuButton 
          icon={<User className="w-8 h-8 text-blue-500" />}
          title="Исполнитель"
          subtitle="Для автосервисов и СТО"
          onClick={() => onNavigate('contractor_menu')}
          large={true}
        />
        <MenuButton 
          icon={<HelpCircle className="w-6 h-6 text-gray-500" />}
          title="Как это работает (FAQ)"
          subtitle="Правила и ответы на вопросы"
          onClick={() => onNavigate('faq')}
        />
        <MenuButton 
          icon={<MessageCircle className="w-6 h-6 text-green-500" />}
          title="Поддержка"
          subtitle="Связаться с администратором"
          onClick={() => onNavigate('support')}
        />
        <MenuButton 
          icon={<Settings className="w-6 h-6 text-slate-700" />}
          title="Панель администратора"
          subtitle="Управление приложением"
          onClick={() => onNavigate('admin_panel')}
        />
      </div>

      {/* Legal Links */}
      <div className="mt-auto pt-8 pb-4 px-4 text-center text-xs text-gray-400 space-y-2">
        <p>
          При использовании приложения Вы соглашаетесь с{' '}
          <button onClick={() => setLegalModal('rules')} className="text-gray-500 underline hover:text-gray-700">пользовательским соглашением</button>
        </p>
        <p>
          При использовании приложения Вы соглашаетесь с{' '}
          <button onClick={() => setLegalModal('privacy')} className="text-gray-500 underline hover:text-gray-700">обработкой персональных данных</button>
        </p>
      </div>

      {/* Legal Modal */}
      {legalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-gray-900">
                {legalModal === 'rules' ? 'Правила сервиса' : 'Политика конфиденциальности'}
              </h2>
              <button onClick={() => setLegalModal(null)} className="p-2 bg-white rounded-full text-gray-500 hover:bg-gray-100 shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
              {legalModal === 'rules' ? content.rules : content.privacy}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuButton({ icon, title, subtitle, onClick, large = false }: { icon: React.ReactNode, title: string, subtitle: string, onClick: () => void, large?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center w-full bg-white ${large ? 'p-5 rounded-3xl border-2 border-gray-200' : 'p-4 rounded-2xl border border-gray-100'} shadow-md active:scale-[0.98] transition-transform text-left`}
    >
      <div className={`${large ? 'w-14 h-14' : 'w-12 h-12'} bg-gray-50 rounded-full flex items-center justify-center mr-4 flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className={`font-semibold text-gray-900 ${large ? 'text-xl' : 'text-lg'}`}>{title}</h3>
        <p className={`${large ? 'text-base' : 'text-sm'} text-gray-500`}>{subtitle}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300" />
    </button>
  );
}
