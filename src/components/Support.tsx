import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ViewState } from '../types';
import { ChevronLeft, MessageCircle, PhoneCall, Mail, Send, Plus } from 'lucide-react';
import { supportApi, miscApi } from '../lib/api';
import { parseSupportTicketApiError, validateSupportTicketForm, type SupportFieldErrors } from '../lib/supportValidation';

interface Props {
  onNavigate: (view: ViewState) => void;
}

type LocalView = 'list' | 'create' | 'chat';

interface TicketSummary {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface TicketMessage {
  id: string;
  content: string;
  is_from_support: boolean;
  created_at: string;
}

interface TicketDetail {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  messages: TicketMessage[];
}

export default function Support({ onNavigate }: Props) {
  const [localView, setLocalView] = useState<LocalView>('list');

  // Tickets list
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  // Create form
  const [subject, setSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<SupportFieldErrors>({});

  // Chat
  const [activeTicket, setActiveTicket] = useState<TicketDetail | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sendMessage, setSendMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  // Contact info
  const [supportPhone, setSupportPhone] = useState('+375 (29) 000-00-00');
  const [supportEmail, setSupportEmail] = useState('support@sds.by');

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  // Load tickets
  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      const data = await supportApi.getTickets();
      const items = Array.isArray(data) ? data : (data?.items ?? data?.tickets ?? []);
      setTickets(items);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setTicketsError(err instanceof Error ? err.message : 'Не удалось загрузить обращения');
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  // Load contact info
  useEffect(() => {
    miscApi.getSupport().then((data) => {
      if (data?.phone) setSupportPhone(data.phone);
      if (data?.email) setSupportEmail(data.email);
    }).catch(() => {});
  }, []);

  // Load tickets on mount
  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Scroll to bottom when chat messages change
  useEffect(() => {
    if (localView === 'chat' && activeTicket?.messages?.length) {
      scrollToBottom();
    }
  }, [localView, activeTicket?.messages?.length, scrollToBottom]);

  // Open ticket chat
  const openChat = useCallback(async (ticketId: string) => {
    setChatLoading(true);
    setChatError(null);
    setSendMessage('');
    try {
      const data = await supportApi.getTicket(ticketId);
      setActiveTicket(data);
      setLocalView('chat');
    } catch (err) {
      console.error('Failed to load ticket:', err);
      setChatError('Не удалось загрузить обращение');
    } finally {
      setChatLoading(false);
    }
  }, []);

  // Create ticket
  const handleCreateTicket = async () => {
    const fieldErrors = validateSupportTicketForm(subject, newMessage);
    if (fieldErrors.subject || fieldErrors.message) {
      setCreateFieldErrors(fieldErrors);
      setCreateError(null);
      return;
    }

    setCreating(true);
    setCreateError(null);
    setCreateFieldErrors({});
    try {
      const created = await supportApi.createTicket({
        subject: subject.trim(),
        message: newMessage.trim(),
      });
      await loadTickets();
      // Open the newly created ticket
      const ticketId = created?.id?.toString() ?? created?.ticket_id?.toString();
      if (ticketId) {
        await openChat(ticketId);
      } else {
        setLocalView('list');
      }
      setSubject('');
      setNewMessage('');
      setCreateFieldErrors({});
    } catch (err) {
      console.error('Failed to create ticket:', err);
      const parsedErrors = parseSupportTicketApiError(
        err instanceof Error ? err.message : 'Не удалось создать обращение'
      );
      setCreateFieldErrors(parsedErrors);
      setCreateError(parsedErrors.form || null);
    } finally {
      setCreating(false);
    }
  };

  // Send message in chat
  const handleSendMessage = async () => {
    if (!sendMessage.trim() || !activeTicket) return;
    const content = sendMessage.trim();
    setSendMessage('');
    setSending(true);
    try {
      await supportApi.sendMessage(activeTicket.id, content);
      // Reload ticket to get new messages
      const data = await supportApi.getTicket(activeTicket.id);
      setActiveTicket(data);
    } catch (err) {
      console.error('Failed to send message:', err);
      setSendMessage(content); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  // Close ticket
  const handleCloseTicket = async () => {
    if (!activeTicket) return;
    setClosing(true);
    try {
      await supportApi.closeTicket(activeTicket.id);
      setActiveTicket(prev => prev ? { ...prev, status: 'closed' } : null);
      await loadTickets();
    } catch (err) {
      console.error('Failed to close ticket:', err);
    } finally {
      setClosing(false);
    }
  };

  // Format time
  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  const normalizeStatus = (status: string) => String(status || '').toUpperCase();

  const statusLabel = (status: string) => {
    switch (normalizeStatus(status)) {
      case 'OPEN': return 'Открыто';
      case 'IN_PROGRESS': return 'В работе';
      case 'WAITING_CUSTOMER': return 'Ждет ответа';
      case 'CLOSED': return 'Закрыто';
      case 'RESOLVED': return 'Решено';
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (normalizeStatus(status)) {
      case 'OPEN': return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700';
      case 'WAITING_CUSTOMER': return 'bg-amber-100 text-amber-700';
      case 'CLOSED': return 'bg-gray-100 text-gray-500';
      case 'RESOLVED': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  // ===================== CHAT VIEW =====================
  if (localView === 'chat' && activeTicket) {
    const ticketStatus = normalizeStatus(activeTicket.status);
    const isClosed = ticketStatus === 'CLOSED' || ticketStatus === 'RESOLVED';

    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTicket(null);
                setLocalView('list');
                loadTickets();
              }}
              className="p-2 -ml-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{activeTicket.subject || 'Чат с поддержкой'}</h1>
              <p className={`text-xs font-medium ${isClosed ? 'text-gray-400' : 'text-green-500'}`}>
                {isClosed ? statusLabel(activeTicket.status) : 'Онлайн'}
              </p>
            </div>
          </div>
          {!isClosed && (
            <button
              onClick={handleCloseTicket}
              disabled={closing}
              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {closing ? 'Закрытие...' : 'Закрыть'}
            </button>
          )}
        </div>

        {chatLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : chatError ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-red-500 mb-3">{chatError}</p>
              <button
                onClick={() => openChat(activeTicket.id)}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 p-4 overflow-y-auto pb-24 space-y-4">
              {activeTicket.messages?.map((msg) => (
                <div key={msg.id} className={`flex ${msg.is_from_support ? 'justify-start' : 'justify-end'}`}>
                  <div className={`p-3 rounded-2xl max-w-[80%] shadow-sm ${
                    msg.is_from_support
                      ? 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                      : 'bg-blue-500 text-white rounded-tr-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[10px] text-right mt-1 ${msg.is_from_support ? 'text-gray-400' : 'text-blue-100'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {isClosed ? (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20 max-w-md mx-auto w-full">
                <div className="text-center text-sm text-gray-400 py-2">
                  Обращение закрыто
                </div>
              </div>
            ) : (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20 max-w-md mx-auto w-full">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sendMessage}
                    onChange={e => setSendMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Введите сообщение..."
                    disabled={sending}
                    className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3 text-sm transition-all outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!sendMessage.trim() || sending}
                    className={`p-3 rounded-xl flex items-center justify-center transition-colors ${
                      sendMessage.trim() && !sending
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ===================== CREATE VIEW =====================
  if (localView === 'create') {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <div className="bg-white p-4 flex items-center shadow-md sticky top-0 z-10 relative">
          <button
            onClick={() => {
              setLocalView('list');
              setSubject('');
              setNewMessage('');
              setCreateError(null);
              setCreateFieldErrors({});
            }}
            className="absolute left-4 p-2 -ml-2 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 w-full text-center">Новое обращение</h1>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-4">
          {createError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{createError}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Тема</label>
            <input
              type="text"
              value={subject}
              onChange={e => {
                setSubject(e.target.value);
                setCreateFieldErrors((current) => ({ ...current, subject: undefined }));
              }}
              placeholder="Кратко опишите проблему"
              className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm transition-all outline-none ${
                createFieldErrors.subject
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }`}
            />
            {createFieldErrors.subject && (
              <p className="mt-1.5 text-sm text-red-500">{createFieldErrors.subject}</p>
            )}
          </div>

          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Сообщение</label>
            <textarea
              value={newMessage}
              onChange={e => {
                setNewMessage(e.target.value);
                setCreateFieldErrors((current) => ({ ...current, message: undefined }));
              }}
              placeholder="Опишите вашу проблему подробнее..."
              rows={6}
              className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm transition-all outline-none resize-none flex-1 ${
                createFieldErrors.message
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }`}
            />
            {createFieldErrors.message && (
              <p className="mt-1.5 text-sm text-red-500">{createFieldErrors.message}</p>
            )}
          </div>

          <button
            onClick={handleCreateTicket}
            disabled={!subject.trim() || !newMessage.trim() || creating}
            className={`w-full font-bold py-3 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center ${
              subject.trim() && newMessage.trim() && !creating
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Отправка...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Отправить
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ===================== LIST VIEW =====================
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
        {/* Create ticket button */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Связь с администратором</h2>
          <p className="text-sm text-gray-500 mb-6">
            Если у вас возникли вопросы по работе приложения, оплате или модерации профиля, напишите нам в чат.
          </p>
          <button
            onClick={() => setLocalView('create')}
            className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Написать в поддержку
          </button>
        </div>

        {/* Existing tickets */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Мои обращения</h3>

          {ticketsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            </div>
          ) : ticketsError ? (
            <div className="text-center py-6">
              <p className="text-sm text-red-500 mb-3">{ticketsError}</p>
              <button
                onClick={loadTickets}
                className="text-sm text-blue-500 hover:underline"
              >
                Попробовать снова
              </button>
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">У вас пока нет обращений</p>
          ) : (
            <div className="max-h-[42vh] overflow-y-auto pr-1 space-y-2">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => openChat(ticket.id.toString())}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ticket.subject || 'Без темы'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(ticket.created_at)}</p>
                  </div>
                  <span className={`ml-3 px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 whitespace-nowrap ${statusColor(ticket.status)}`}>
                    {statusLabel(ticket.status)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contact info */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Другие способы связи</h3>

          <a href={`tel:${supportPhone.replace(/[\s()-]/g, '')}`} className="flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors mb-2">
            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Телефон</p>
              <p className="font-bold text-gray-900">{supportPhone}</p>
            </div>
          </a>

          <a href={`mailto:${supportEmail}`} className="flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
            <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-bold text-gray-900">{supportEmail}</p>
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
