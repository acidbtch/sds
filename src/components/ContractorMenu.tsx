import React from 'react';
import { ViewState } from '../types';
import { ChevronLeft, Briefcase, Settings, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  onNavigate: (view: ViewState) => void;
}

export default function ContractorMenu({ onNavigate }: Props) {
  const { user } = useAuth();
  const hasExecutorProfile = Boolean(user?.executor_profile);

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      <div className="bg-white p-4 flex items-center justify-center shadow-md sticky top-0 z-10 relative">
        <button 
          onClick={() => onNavigate('home')}
          className="absolute left-4 p-2 -ml-2 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Исполнитель</h1>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4 mt-4">
        {!hasExecutorProfile && (
          <button 
            onClick={() => onNavigate('contractor_register')}
            className="flex flex-col items-center justify-center bg-blue-500 text-white p-6 rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
          >
            <Briefcase className="w-12 h-12 mb-3 opacity-90" />
            <h2 className="text-xl font-bold">Стать исполнителем</h2>
            <p className="text-blue-100 text-sm mt-1 text-center">Зарегистрируйте свой автосервис</p>
          </button>
        )}

        <button 
          onClick={() => onNavigate('contractor_cabinet')}
          className="flex items-center bg-white p-5 rounded-2xl shadow-md border border-gray-100 active:scale-[0.98] transition-transform text-left"
        >
          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">Мой автосервис</h3>
            <p className="text-sm text-gray-500">Личный кабинет исполнителя</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </button>
      </div>

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
