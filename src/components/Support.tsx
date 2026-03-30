import React, { useState, useRef, useEffect } from 'react';
import { ViewState } from '../types';
import { ChevronLeft, MessageCircle, PhoneCall, Mail, Send, X } from 'lucide-react';
import { useData } from '../context/DataContext';

interface Props {
  onNavigate: (view: ViewState) => void;
}

export default function Support({ onNavigate }: Props) {
  const { support, setSupport } = useData();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Find user's ticket or create a new one
  const userTicket = support.find(t => t.user === 'Иван Иванов (Заказчик)') || {
    id: Date.now(),
    user: 'Иван Иванов (Заказчик)',
    text: '',
    status: 'in_progress',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    replies: [],
    updatedAt: Date.now()
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [isChatOpen, userTicket.replies]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newReply = {
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      admin: false
    };

    const existingTicket = support.find(t => t.id === userTicket.id);

    if (existingTicket) {
      setSupport(support.map(t => 
        t.id === userTicket.id 
          ? { ...t, replies: [...(t.replies || []), newReply], status: 'in_progress', updatedAt: Date.now() }
          : t
      ));
    } else {
      setSupport([...support, {
        ...userTicket,
        text: message,
        replies: [],
        updatedAt: Date.now()
      }]);
    }

    setMessage('');
  };

  if (isChatOpen) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsChatOpen(false)}
              className="p-2 -ml-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Чат с поддержкой</h1>
              <p className="text-xs text-green-500 font-medium">Онлайн</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto pb-24 space-y-4">
          <div className="text-center text-xs text-gray-400 my-4">Сегодня</div>
          
          {userTicket.text && (
            <div className="flex justify-end">
              <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
                <p className="text-sm">{userTicket.text}</p>
                <p className="text-[10px] text-blue-100 text-right mt-1">{userTicket.time}</p>
              </div>
            </div>
          )}

          {userTicket.replies?.map((reply, idx) => (
            <div key={idx} className={`flex ${reply.admin ? 'justify-start' : 'justify-end'}`}>
              <div className={`p-3 rounded-2xl max-w-[80%] shadow-sm ${
                reply.admin 
                  ? 'bg-white text-gray-800 rounded-tl-sm border border-gray-100' 
                  : 'bg-blue-500 text-white rounded-tr-sm'
              }`}>
                <p className="text-sm">{reply.text}</p>
                <p className={`text-[10px] text-right mt-1 ${reply.admin ? 'text-gray-400' : 'text-blue-100'}`}>
                  {reply.time}
                </p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20 max-w-md mx-auto w-full">
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Введите сообщение..."
              className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3 text-sm transition-all outline-none"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className={`p-3 rounded-xl flex items-center justify-center transition-colors ${
                message.trim() ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-200 text-gray-400'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      <div className="bg-white p-4 flex items-center justify-center shadow-md sticky top-0 z-10 relative">
        <button 
          onClick={() => onNavigate('home')}
          className="absolute left-4 p-2 -ml-2 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Поддержка</h1>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4 pb-10">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Связь с администратором</h2>
          <p className="text-sm text-gray-500 mb-6">
            Если у вас возникли вопросы по работе приложения, оплате или модерации профиля, напишите нам в чат.
          </p>
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Написать в чат
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Другие способы связи</h3>
          
          <a href="tel:+375290000000" className="flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors mb-2">
            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Телефон</p>
              <p className="font-bold text-gray-900">+375 (29) 000-00-00</p>
            </div>
          </a>

          <a href="mailto:support@sds.by" className="flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
            <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-bold text-gray-900">support@sds.by</p>
            </div>
          </a>
        </div>
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
