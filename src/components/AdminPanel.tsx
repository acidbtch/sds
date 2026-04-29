import React, { useState, useRef, useEffect } from 'react';
import { ViewState } from '../types';
import { 
  ChevronLeft, Users, Briefcase, FileText, CreditCard, 
  Image as ImageIcon, ShieldCheck, MessageSquare, Settings,
  Search, Filter, MoreVertical, CheckCircle, XCircle, AlertCircle,
  Menu, X, Car, Upload, ChevronDown, ArrowUp, ArrowDown, Send
} from 'lucide-react';
import RegionSelector from './RegionSelector';
import { CustomSelect } from './CustomSelect';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ScheduleSelector, formatSchedule, defaultSchedule } from './ScheduleSelector';
import { adminApi } from '../lib/api';
import { getAdminRoleUpdateErrorMessage, isAdminRoleEndpointMissing } from '../lib/adminRoleErrors';
import type { AdminCarModelsByBrand } from '../lib/adminCars';
import { getAdminCarBrandOptions, getAdminCarEntityId, getAdminCarModelOptions } from '../lib/adminCars';
import { canManageCustomerAdminRole, canManageCustomerBlockStatus, getCustomerContactRows, getCustomerStateBadge, getCustomerStateDotClass, getNextCustomerAdminRole, getOrdersForCustomer } from '../lib/adminCustomerOrders';
import { uploadMediaFile } from '../lib/media';
import { getFaqItemsForEditor, insertEditorBullet, insertFaqBullet, saveFaqEditorItem } from '../lib/faqEditor';

interface Props {
  onNavigate: (view: ViewState) => void;
  carModels: AdminCarModelsByBrand;
  setCarModels: React.Dispatch<React.SetStateAction<AdminCarModelsByBrand>>;
}

type AdminTab = 'dashboard' | 'customers' | 'contractors' | 'orders' | 'payments' | 'banners' | 'moderation' | 'support' | 'content' | 'cars' | 'services';

export default function AdminPanel({ onNavigate, carModels, setCarModels }: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { refreshAdminData } = useData();

  const {
    customers, setCustomers,
    contractors, setContractors,
    orders, setOrders,
    payments, setPayments,
    banners, setBanners,
    moderation, setModeration,
    support, setSupport,
    content,
    serviceCategories, setServiceCategories
  } = useData();

  const newModeration = moderation.filter(m => m.status === 'new').length;
  const newSupport = support.filter(s => s.status !== 'resolved' && s.status !== 'closed').length;

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Общая панель', icon: <Settings className="w-5 h-5" /> },
    { id: 'customers', label: 'Заказчики', icon: <Users className="w-5 h-5" /> },
    { id: 'contractors', label: 'Исполнители', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'orders', label: 'Заказы', icon: <FileText className="w-5 h-5" /> },
    { id: 'payments', label: 'Платежи', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'banners', label: 'Баннеры', icon: <ImageIcon className="w-5 h-5" /> },
    { id: 'moderation', label: 'Модерация', icon: <ShieldCheck className="w-5 h-5" />, badge: newModeration },
    { id: 'support', label: 'Поддержка', icon: <MessageSquare className="w-5 h-5" />, badge: newSupport },
    { id: 'content', label: 'Контент', icon: <FileText className="w-5 h-5" /> },
    { id: 'cars', label: 'Авто', icon: <Car className="w-5 h-5" /> },
    { id: 'services', label: 'Услуги', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleTabChange = (tabId: AdminTab) => {
    setActiveTab(tabId);
    setIsMenuOpen(false);
    if (tabId === 'dashboard' || tabId === 'moderation' || tabId === 'support' || tabId === 'customers' || tabId === 'contractors') {
      refreshAdminData();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white relative [&_button]:transition-all [&_button:not(:disabled)]:active:scale-[0.98] [&_button:not(:disabled)]:active:opacity-90">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-center shadow-md sticky top-0 z-30 relative">
        <button 
          onClick={() => onNavigate('home')}
          className="absolute left-4 p-2 -ml-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <h1 className="text-xl font-bold">SDS Admin</h1>
      </div>

      {/* Permanent Grid Menu */}
      <div className="bg-white border-b border-gray-200 p-2 z-20">
        <div className="grid grid-cols-3 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'contractors') {
                  onNavigate('contractors_catalog');
                } else {
                  handleTabChange(tab.id);
                }
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white' 
                  : 'text-gray-600 hover:bg-[#E8EDF2]'
              }`}
            >
              <div className="mb-1 relative">
                {tab.icon}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-center leading-tight">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto pb-24">
        {activeTab === 'dashboard' && <DashboardView onNavigateTab={setActiveTab} onNavigate={onNavigate} />}
        {activeTab === 'customers' && <CustomersView customers={customers} setCustomers={setCustomers} orders={orders} />}
        {activeTab === 'contractors' && <ContractorsView contractors={contractors} setContractors={setContractors} orders={orders} />}
        {activeTab === 'orders' && <OrdersView orders={orders} />}
        {activeTab === 'payments' && <PaymentsView payments={payments} />}
        {activeTab === 'banners' && <BannersView banners={banners} setBanners={setBanners} contractors={contractors} setContractors={setContractors} />}
        {activeTab === 'moderation' && <ModerationView moderation={moderation} setModeration={setModeration} contractors={contractors} setContractors={setContractors} banners={banners} setBanners={setBanners} />}
        {activeTab === 'support' && <SupportView support={support} setSupport={setSupport} />}
        {activeTab === 'content' && <ContentView content={content} />}
        {activeTab === 'cars' && <CarsView carModels={carModels} setCarModels={setCarModels} />}
        {activeTab === 'services' && <ServicesView serviceCategories={serviceCategories} setServiceCategories={setServiceCategories} contractors={contractors} setContractors={setContractors} orders={orders} setOrders={setOrders} />}
      </div>
    </div>
  );
}

// --- View Components ---

function DashboardView({ onNavigateTab, onNavigate }: { onNavigateTab: (tab: AdminTab) => void, onNavigate: (view: ViewState) => void }) {
  const { customers, orders, payments, contractors, moderation, support } = useData();
  const [dashboard, setDashboard] = useState<any | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await adminApi.getDashboard();
        setDashboard(data);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      }
    };

    loadDashboard();
  }, []);

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split(' ')[0].split('.');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(0);
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const ordersToday = dashboard?.orders_today ?? orders.filter(o => parseDate(o.date) >= today).length;
  const ordersWeek = dashboard?.orders_week ?? orders.filter(o => parseDate(o.date) >= startOfWeek).length;
  const ordersMonth = dashboard?.orders_month ?? orders.filter(o => parseDate(o.date) >= startOfMonth).length;

  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const successfulPayments = dashboard?.successful_transactions ?? payments.filter(p => p.status === 'Успешно').length;
  
  const newModeration = moderation.filter(m => m.status === 'new').length;
  const newSupport = support.filter(s => s.status !== 'resolved' && s.status !== 'closed').length;

  const partnerCount = dashboard?.executors_by_tier?.PARTNER ?? contractors.filter(c => c.profileType === 'partner' || c.profileType === 'Партнёр').length;
  const proCount = dashboard?.executors_by_tier?.PROFI ?? contractors.filter(c => c.profileType === 'pro' || c.profileType === 'Профи').length;
  const leaderCount = dashboard?.executors_by_tier?.LEADER ?? contractors.filter(c => c.profileType === 'leader' || c.profileType === 'Лидер').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Гости" value={(dashboard?.users_count ?? customers.length).toString()} subtitle="открыли приложение" color="bg-blue-50 text-blue-600" />
        <StatCard title="Выполнено" value={completedOrders.toString()} subtitle="заказов всего" color="bg-green-50 text-green-600" />
        <StatCard title="Успешных оплат" value={successfulPayments.toString()} subtitle="всего транзакций" color="bg-purple-50 text-purple-600" />
        <StatCard title="Исполнителей" value={contractors.length.toString()} subtitle="всего в базе" color="bg-orange-50 text-orange-600" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onNavigateTab('moderation')} className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col items-center justify-center gap-2 text-gray-700 hover:bg-gray-50">
          <ShieldCheck className="w-8 h-8 text-blue-500" />
          <span className="font-bold text-sm">Модерация ({newModeration})</span>
        </button>
        <button onClick={() => onNavigateTab('support')} className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col items-center justify-center gap-2 text-gray-700 hover:bg-gray-50">
          <MessageSquare className="w-8 h-8 text-orange-500" />
          <span className="font-bold text-sm">Поддержка ({newSupport})</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-3">Оформленные заказы</h3>
        <div className="flex justify-between text-sm">
          <div className="text-center"><div className="font-bold text-lg">{ordersToday}</div><div className="text-gray-500">Сегодня</div></div>
          <div className="text-center"><div className="font-bold text-lg">{ordersWeek}</div><div className="text-gray-500">Неделя</div></div>
          <div className="text-center"><div className="font-bold text-lg">{ordersMonth}</div><div className="text-gray-500">Месяц</div></div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-3">Исполнители по подпискам</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Партнёр (Бесплатно)</span>
            <span className="font-bold">{partnerCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-600">Профи (30 BYN)</span>
            <span className="font-bold">{proCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-orange-600">Лидер (50 BYN)</span>
            <span className="font-bold">{leaderCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, color, onClick }: { title: string, value: string, subtitle: string, color: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl ${color} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
    >
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs opacity-80 mt-1">{subtitle}</div>
    </div>
  );
}

function CustomersView({ customers, setCustomers, orders }: { customers: any[], setCustomers: any, orders: any[] }) {
  const { refreshAdminData } = useData();
  const { user } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [roleConfirm, setRoleConfirm] = useState<{ customer: any; nextRole: 'CUSTOMER' | 'EXECUTOR' | 'ADMIN' } | null>(null);
  const [isRoleUpdating, setIsRoleUpdating] = useState(false);
  const [isRoleApiUnavailable, setIsRoleApiUnavailable] = useState(false);

  useEffect(() => {
    let isMounted = true;

    adminApi.supportsUserRoleUpdate()
      .then((isSupported) => {
        if (isMounted) setIsRoleApiUnavailable(!isSupported);
      })
      .catch((error) => {
        console.error('Failed to check user role endpoint support:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  const toggleStatus = async () => {
    if (!selectedCustomer || !canManageCustomerBlockStatus(user, selectedCustomer)) return;

    try {
      await adminApi.toggleUserBlock(selectedCustomer.id);
      await refreshAdminData();
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Ошибка при изменении статуса пользователя');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Админ';
      case 'EXECUTOR': return 'Исполнитель';
      case 'CUSTOMER': return 'Клиент';
      default: return role || 'Клиент';
    }
  };

  const openRoleConfirm = () => {
    if (!selectedCustomer) return;
    if (!canManageCustomerAdminRole(user, selectedCustomer)) return;
    if (isRoleApiUnavailable) return;
    setRoleConfirm({
      customer: selectedCustomer,
      nextRole: getNextCustomerAdminRole(selectedCustomer),
    });
  };

  const confirmRoleChange = async () => {
    if (!roleConfirm) return;

    const currentRole = roleConfirm.customer.role || 'CUSTOMER';
    const previousRole = roleConfirm.nextRole === 'ADMIN'
      ? (currentRole === 'ADMIN' ? roleConfirm.customer.previousRole : currentRole)
      : roleConfirm.nextRole;
    const updatedCustomer = {
      ...roleConfirm.customer,
      role: roleConfirm.nextRole,
      previousRole,
    };

    setIsRoleUpdating(true);
    try {
      await adminApi.updateUserRole(roleConfirm.customer.id, roleConfirm.nextRole);
      setCustomers((current: any[]) => current.map(customer => (
        customer.id === roleConfirm.customer.id ? updatedCustomer : customer
      )));
      setSelectedCustomer(updatedCustomer);
      setRoleConfirm(null);
      await refreshAdminData();
    } catch (error) {
      console.error('Failed to update user role:', error);
      if (isAdminRoleEndpointMissing(error)) {
        setIsRoleApiUnavailable(true);
        setRoleConfirm(null);
      }
      alert(getAdminRoleUpdateErrorMessage(error));
    } finally {
      setIsRoleUpdating(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Новый';
      case 'active': return 'В работе';
      case 'completed': return 'Выполнен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  if (selectedCustomer) {
    const customerOrders = getOrdersForCustomer(orders, selectedCustomer);
    const selectedCustomerContactRows = getCustomerContactRows(selectedCustomer);
    const canChangeAdminRole = canManageCustomerAdminRole(user, selectedCustomer);
    const canChangeBlockStatus = canManageCustomerBlockStatus(user, selectedCustomer);
    const isRoleButtonDisabled = isRoleUpdating || !canChangeAdminRole || isRoleApiUnavailable;
    const customerStateBadge = getCustomerStateBadge(selectedCustomer);

    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedCustomer(null)} className="text-sm text-blue-600 font-medium flex items-center">
          <ChevronLeft className="w-4 h-4 mr-1" /> Назад к списку
        </button>
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
            <span className={`shrink-0 whitespace-nowrap px-2 py-1 text-xs rounded-md font-bold ${customerStateBadge.className}`}>
              {customerStateBadge.label}
            </span>
          </div>
          <div className="space-y-2 text-sm mb-6">
            {selectedCustomerContactRows.length > 0 ? (
              selectedCustomerContactRows.map(row => (
                <p key={row.label}><span className="text-gray-500">{row.label}:</span> {row.value}</p>
              ))
            ) : (
              <p><span className="text-gray-500">Контакты:</span> Не указаны</p>
            )}
            <p><span className="text-gray-500">Регистрация:</span> {selectedCustomer.regDate}</p>
            <p><span className="text-gray-500">Всего заказов:</span> {customerOrders.length}</p>
          </div>
          
          <h3 className="font-bold mb-2">История заказов</h3>
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-6 space-y-2">
            {customerOrders.length > 0 ? (
              customerOrders.map(o => (
                <div key={o.id} className="flex justify-between items-center gap-2 border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                  <div className="min-w-0 flex-1 truncate">
                    <span className="font-medium">Заказ #{o.id}</span> - {o.serviceType}
                  </div>
                  <span className={`shrink-0 whitespace-nowrap text-xs font-bold px-2 py-1 rounded ${
                    o.status === 'completed' ? 'bg-green-100 text-green-700' : 
                    o.status === 'active' ? 'bg-blue-100 text-blue-700' : 
                    o.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {getStatusLabel(o.status)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Нет заказов</p>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={openRoleConfirm}
              disabled={isRoleButtonDisabled}
              className={`w-full py-3 rounded-lg font-bold text-white transition active:scale-[0.98] disabled:opacity-60 ${!canChangeAdminRole || isRoleApiUnavailable ? 'bg-gray-400' : selectedCustomer.role === 'ADMIN' ? 'bg-slate-700' : 'bg-blue-600'}`}
            >
              {!canChangeAdminRole
                ? 'Нельзя изменить свой статус'
                : isRoleApiUnavailable
                  ? 'Смена роли недоступна'
                : selectedCustomer.role === 'ADMIN'
                  ? `Вернуть статус ${getRoleLabel(selectedCustomer.previousRole)}`
                  : 'Сделать админом'}
            </button>
            {!canChangeAdminRole && (
              <p className="text-xs text-gray-500 text-center">Для своего аккаунта эта кнопка недоступна.</p>
            )}
            {isRoleApiUnavailable && canChangeAdminRole && (
              <p className="text-xs text-gray-500 text-center">На сервере пока нет endpoint-а для смены роли.</p>
            )}
            <button
              onClick={toggleStatus}
              disabled={!canChangeBlockStatus}
              className={`w-full py-3 rounded-lg font-bold text-white transition active:scale-[0.98] ${!canChangeBlockStatus ? 'bg-gray-400 cursor-not-allowed active:scale-100' : selectedCustomer.status === 'active' ? 'bg-red-500' : 'bg-green-500'}`}
            >
              {!canChangeBlockStatus ? 'Нельзя заблокировать свой аккаунт' : selectedCustomer.status === 'active' ? 'Заблокировать пользователя' : 'Разблокировать пользователя'}
            </button>
            {!canChangeBlockStatus && (
              <p className="text-xs text-gray-500 text-center">Для своего аккаунта эта кнопка недоступна.</p>
            )}
          </div>
        </div>
        {roleConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900">
                {roleConfirm.nextRole === 'ADMIN' ? 'Сделать пользователя админом?' : 'Вернуть предыдущий статус?'}
              </h3>
              <p className="mt-3 text-sm text-gray-600">
                {roleConfirm.nextRole === 'ADMIN'
                  ? `Пользователь ${roleConfirm.customer.name} получит доступ к админке. Будет отправлен статус: ADMIN.`
                  : `Пользователю ${roleConfirm.customer.name} будет возвращен статус: ${roleConfirm.nextRole}.`}
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRoleConfirm(null)}
                  disabled={isRoleUpdating}
                  className="flex-1 rounded-lg bg-gray-100 py-3 font-bold text-gray-700 transition active:scale-[0.98] disabled:opacity-60"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={confirmRoleChange}
                  disabled={isRoleUpdating}
                  className="flex-1 rounded-lg bg-blue-600 py-3 font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
                >
                  {isRoleUpdating ? 'Сохраняем...' : 'Подтвердить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Поиск заказчиков..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" 
          />
        </div>
      </div>

      {filtered.map(c => {
        const customerOrdersCount = getOrdersForCustomer(orders, c).length;

        return (
          <div key={c.id} onClick={() => setSelectedCustomer(c)} className="bg-white p-4 rounded-xl shadow-md border border-gray-100 cursor-pointer hover:bg-gray-50">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold text-gray-900">{c.name}</h3>
              <span className={`w-2 h-2 rounded-full mt-1.5 ${getCustomerStateDotClass(c)}`}></span>
            </div>
            <div className="space-y-0.5 text-sm text-gray-500">
              {getCustomerContactRows(c).map(row => (
                <p key={row.label}><span>{row.label}:</span> {row.value}</p>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>Заказов: {customerOrdersCount}</span>
              <span>Рег: {c.regDate}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContractorsView({ contractors, setContractors, orders }: { contractors: any[], setContractors: any, orders: any[] }) {
  const { serviceCategories, refreshAdminData } = useData();
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filtered = contractors.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async () => {
    try {
      await adminApi.updateContractor(editForm.id, editForm);
      setIsEditing(false);
      setSelected(null);
      await refreshAdminData();
    } catch (error) {
      console.error('Failed to update contractor:', error);
      alert('Ошибка при сохранении');
    }
  };

  if (selected) {
    if (isEditing) {
      return (
        <div className="space-y-4">
          <button onClick={() => setIsEditing(false)} className="text-sm text-blue-600 font-medium flex items-center">
            <ChevronLeft className="w-4 h-4 mr-1" /> Назад к просмотру
          </button>
          <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Редактирование исполнителя</h2>
            
            <div className="space-y-4 text-sm mb-6">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Статус юридического лица <span className="text-red-500">*</span></label>
                <CustomSelect
                  value={editForm.legalStatus || 'ООО'}
                  onChange={(val) => setEditForm({...editForm, legalStatus: val})}
                  options={[
                    { value: 'ИП', label: 'ИП' },
                    { value: 'ООО', label: 'ООО' },
                    { value: 'ЧУП', label: 'ЧУП' },
                    { value: 'ОАО', label: 'ОАО' },
                  ]}
                  placeholder="Выберите статус"
                  theme="blue"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Полное юридическое наименование <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">УНП <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={editForm.unp || ''} 
                  onChange={e => setEditForm({...editForm, unp: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Краткое название (для приложения) <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={editForm.shortName || ''} 
                  onChange={e => setEditForm({...editForm, shortName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Описание вашей деятельности <span className="text-red-500">*</span></label>
                <textarea 
                  rows={3}
                  value={editForm.description || ''} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              {(editForm.profileType === 'leader' || editForm.profileType === 'Лидер') && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Текст рекламного баннера</label>
                  <textarea 
                    rows={2}
                    value={editForm.bannerText || ''} 
                    onChange={e => setEditForm({...editForm, bannerText: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Категории и виды оказываемых услуг <span className="text-red-500">*</span></label>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 rounded-lg p-2 border border-gray-200">
                  {serviceCategories.map(category => {
                    const currentServices = Array.isArray(editForm.services) ? editForm.services : [];
                    const allSelected = category.services.length > 0 && category.services.every(s => currentServices.includes(s));
                    const someSelected = category.services.some(s => currentServices.includes(s)) && !allSelected;
                    const isExpanded = expandedCategories.includes(category.id);
                    
                    return (
                      <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div 
                          className="flex items-center justify-between bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => toggleCategoryExpand(category.id)}
                        >
                          <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={allSelected}
                              ref={input => { if (input) input.indeterminate = someSelected; }}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const newServices = new Set([...currentServices, ...category.services]);
                                  setEditForm({...editForm, services: Array.from(newServices)});
                                } else {
                                  const newServices = currentServices.filter((s: string) => !category.services.includes(s));
                                  setEditForm({...editForm, services: newServices});
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <h4 className="font-medium text-sm text-gray-900 select-none">{category.name}</h4>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                        
                        {isExpanded && (
                          <div className="p-3 bg-white border-t border-gray-100 space-y-1">
                            {category.services.map(type => (
                              <label key={type} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                <input 
                                  type="checkbox" 
                                  checked={currentServices.includes(type)}
                                  onChange={() => {
                                    if (currentServices.includes(type)) {
                                      setEditForm({...editForm, services: currentServices.filter((s: string) => s !== type)});
                                    } else {
                                      setEditForm({...editForm, services: [...currentServices, type]});
                                    }
                                  }}
                                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                                />
                                <span className="text-sm text-gray-700">{type}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Регион оказания услуг <span className="text-red-500">*</span></label>
                <button 
                  type="button"
                  onClick={() => setIsRegionModalOpen(true)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-gray-50 text-left text-gray-700 outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {editForm.regions && editForm.regions.length > 0 ? editForm.regions.join(', ') : 'Выберите регион'}
                </button>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">График работы</label>
                <ScheduleSelector 
                  value={editForm.schedule || defaultSchedule}
                  onChange={val => setEditForm({...editForm, schedule: val})}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Контактный телефон (Telegram) <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={editForm.phone || ''} 
                  onChange={e => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ссылка на Instagram</label>
                <input 
                  type="text" 
                  value={editForm.instagram || ''} 
                  onChange={e => setEditForm({...editForm, instagram: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ссылка на сайт</label>
                <input 
                  type="text" 
                  value={editForm.website || ''} 
                  onChange={e => setEditForm({...editForm, website: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              
              <div className="pt-2">
                <label className="block text-xs text-gray-500 mb-2">Медиафайлы</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="border border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-colors">
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] text-center">Документы юр. лица</span>
                  </button>
                  <button type="button" className="border border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-colors">
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] text-center">Логотип</span>
                  </button>
                  <button type="button" className="border border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-colors">
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] text-center">Фото работ</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 mt-6">
                <h3 className="font-bold text-gray-900 mb-4">Настройки администратора</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Тип подписки</label>
                    <select 
                      value={editForm.profile} 
                      onChange={e => setEditForm({...editForm, profile: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="Лидер">Лидер</option>
                      <option value="Партнёр">Партнёр</option>
                      <option value="Базовый">Базовый</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Статус подписки</label>
                    <select 
                      value={editForm.subStatus} 
                      onChange={e => setEditForm({...editForm, subStatus: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="Активна">Активна</option>
                      <option value="Неактивна">Неактивна</option>
                      <option value="Бесплатно">Бесплатно</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Начало подписки</label>
                      <input 
                        type="date" 
                        value={editForm.subStart || ''} 
                        onChange={e => setEditForm({...editForm, subStart: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Конец подписки</label>
                      <input 
                        type="date" 
                        value={editForm.subEnd || ''} 
                        onChange={e => setEditForm({...editForm, subEnd: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Статус аккаунта</label>
                    <select 
                      value={editForm.status || 'active'} 
                      onChange={e => setEditForm({...editForm, status: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="active">Активен</option>
                      <option value="blocked">Заблокирован</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl font-bold text-white bg-green-500 text-sm">
                Сохранить
              </button>
              <button onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl font-bold bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] text-sm">
                Отмена
              </button>
            </div>
          </div>
          <RegionSelector 
            isOpen={isRegionModalOpen}
            onClose={() => setIsRegionModalOpen(false)}
            selectedRegions={editForm.regions || []}
            onSelect={(regions) => setEditForm({...editForm, regions})}
            multiSelect={true}
          />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="text-sm text-blue-600 font-medium flex items-center">
          <ChevronLeft className="w-4 h-4 mr-1" /> Назад к списку
        </button>
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold">{selected.name}</h2>
              <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded mt-1 inline-block">{selected.profile}</span>
            </div>
            <span className={`px-2 py-1 text-xs rounded-md font-bold ${selected.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {selected.status === 'blocked' ? 'Заблокирован' : 'Активен'}
            </span>
          </div>
          
          <div className="space-y-3 text-sm mb-6">
            <div>
              <span className="text-gray-500 block text-xs">Юридическое наименование</span>
              <span className="font-medium text-gray-900">{selected.legalStatus || 'ООО'} "{selected.name.replace(/ООО |ИП |ЧУП |ОАО |"/g, '')}"</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">УНП</span>
              <span className="font-medium text-gray-900">{selected.unp || 'Не указан'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Краткое название</span>
              <span className="font-medium text-gray-900">{selected.shortName || 'Не указано'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Описание</span>
              <span className="font-medium text-gray-900">{selected.description || 'Не указано'}</span>
            </div>
            {(selected.profileType === 'leader' || selected.profileType === 'Лидер') && (
              <div>
                <span className="text-gray-500 block text-xs">Текст рекламного баннера</span>
                <span className="font-medium text-gray-900">{selected.bannerText || 'Не указано'}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500 block text-xs">Услуги</span>
              <span className="font-medium text-gray-900">{Array.isArray(selected.services) ? selected.services.join(', ') : selected.services || 'Не указаны'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Регион</span>
              <span className="font-medium text-gray-900">{selected.regions && selected.regions.length > 0 ? selected.regions.join(', ') : selected.region}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">График работы</span>
              <span className="font-medium text-gray-900">{selected.schedule ? formatSchedule(selected.schedule) : selected.workingHours || 'Не указан'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Телефон</span>
              <span className="font-medium text-gray-900">{selected.phone || 'Не указан'}</span>
            </div>
            {selected.instagram && (
              <div>
                <span className="text-gray-500 block text-xs">Instagram</span>
                <a href={selected.instagram} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-500 underline">{selected.instagram}</a>
              </div>
            )}
            {selected.website && (
              <div>
                <span className="text-gray-500 block text-xs">Сайт</span>
                <a href={selected.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-500 underline">{selected.website}</a>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-200 mt-4">
              <h3 className="font-bold text-gray-900 mb-3">Настройки администратора</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-500 block text-xs">Тип подписки</span>
                  <span className="font-medium text-gray-900">{selected.profile}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Статус подписки</span>
                  <span className="font-medium text-gray-900">{selected.subStatus}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Период подписки</span>
                  <span className="font-medium text-gray-900">{selected.subStart || 'Не указано'} - {selected.subEnd || 'Не указано'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Статистика</span>
                  <span className="font-medium text-gray-900">Выполнено заказов: {selected.completedOrders}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 mt-4">
              <h3 className="font-bold text-gray-900 mb-3">История заказов (отклики)</h3>
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-6 space-y-2">
                {orders.filter(o => o.responses?.some((r: any) => r.contractorId === selected.id)).length > 0 ? (
                  orders.filter(o => o.responses?.some((r: any) => r.contractorId === selected.id)).map(o => (
                    <div key={o.id} className="flex flex-col border-b border-gray-200 last:border-0 pb-3 last:pb-0">
                      <div className="flex justify-between items-center gap-2 mb-1">
                        <div className="min-w-0 flex-1 truncate">
                          <span className="font-medium">Заказ #{o.id}</span> - {o.serviceType}
                        </div>
                        <span className={`shrink-0 whitespace-nowrap text-[10px] font-bold px-2 py-1 rounded ${
                          o.status === 'completed' ? 'bg-green-100 text-green-700' : 
                          o.status === 'active' ? 'bg-blue-100 text-blue-700' : 
                          o.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {o.status === 'completed' ? 'Выполнен' : o.status === 'active' ? 'В работе' : o.status === 'cancelled' ? 'Отменен' : 'Новый'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {o.carMake} {o.carModel} {o.year ? `(${o.year})` : ''}
                      </div>
                      {o.acceptedContractorId === selected.id && (
                        <div className="mt-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block self-start">
                          Выбран исполнителем
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic text-center py-2">Нет откликов на заказы</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={async () => {
                try {
                  await adminApi.toggleUserBlock(selected.id);
                  const newStatus = selected.status === 'blocked' ? 'active' : 'blocked';
                  const updated = { ...selected, status: newStatus };
                  setSelected(updated);
                  await refreshAdminData();
                } catch (error) {
                  console.error('Failed to toggle status:', error);
                  alert('Ошибка при изменении статуса');
                }
              }}
              className={`flex-1 py-3 rounded-xl font-bold text-white text-sm ${selected.status === 'blocked' ? 'bg-green-500' : 'bg-red-500'}`}
            >
              {selected.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}
            </button>
            <button 
              onClick={() => {
                setEditForm({ ...selected });
                setIsEditing(true);
              }} 
              className="flex-1 py-3 rounded-xl font-bold bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] text-sm"
            >
              Редактировать
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Поиск СТО..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" 
          />
        </div>
      </div>

      {filtered.map(c => (
        <div key={c.id} onClick={() => setSelected(c)} className="bg-white p-4 rounded-xl shadow-md border border-gray-100 cursor-pointer hover:bg-gray-50">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-gray-900">{c.name}</h3>
            <span className="text-xs font-bold text-orange-500">{c.profile}</span>
          </div>
          <p className="text-sm text-gray-500">{c.regions && c.regions.length > 0 ? c.regions.join(', ') : c.region} • Выполнено: {c.completedOrders}</p>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-green-600">Модерация: {c.modStatus}</span>
            <span className="text-blue-600">Подписка: {c.subStatus}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrdersView({ orders }: { orders: any[] }) {
  const [search, setSearch] = useState('');
  const filtered = orders.filter(o => o.serviceType?.toLowerCase().includes(search.toLowerCase()) || o.customerName?.toLowerCase().includes(search.toLowerCase()));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="shrink-0 whitespace-nowrap text-xs font-bold px-2 py-1 rounded bg-orange-100 text-orange-700">Новый</span>;
      case 'active': return <span className="shrink-0 whitespace-nowrap text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-700">В работе</span>;
      case 'completed': return <span className="shrink-0 whitespace-nowrap text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700">Выполнен</span>;
      case 'cancelled': return <span className="shrink-0 whitespace-nowrap text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700">Отменен</span>;
      default: return <span className="shrink-0 whitespace-nowrap text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Поиск заказов..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" 
          />
        </div>
      </div>

      {filtered.map(o => (
        <div key={o.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <div className="flex justify-between items-start gap-2 mb-2">
            <span className="min-w-0 flex-1 truncate text-xs font-bold text-gray-500">#{o.id} от {o.date}</span>
            {getStatusBadge(o.status)}
          </div>
          <h3 className="font-bold text-gray-900 mb-1">{o.serviceType}</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium text-gray-700">Заказчик:</span> {o.customerName || 'Не указан'} {o.phone ? `(${o.phone})` : ''}</p>
            <p><span className="font-medium text-gray-700">Автомобиль:</span> {o.carMake} {o.carModel} {o.year ? `(${o.year})` : ''}</p>
            <div className="grid grid-cols-2 gap-2 mt-2 mb-2 bg-gray-50 p-2 rounded-lg text-xs">
              {o.engine && <div><span className="text-gray-500">Двигатель:</span> <span className="font-medium text-gray-900">{o.engine}</span></div>}
              {o.gearbox && <div><span className="text-gray-500">КПП:</span> <span className="font-medium text-gray-900">{o.gearbox}</span></div>}
              {o.drive && <div><span className="text-gray-500">Привод:</span> <span className="font-medium text-gray-900">{o.drive}</span></div>}
              {o.body && <div><span className="text-gray-500">Кузов:</span> <span className="font-medium text-gray-900">{o.body}</span></div>}
              {o.vin && <div className="col-span-2"><span className="text-gray-500">VIN:</span> <span className="font-medium text-gray-900 uppercase">{o.vin}</span></div>}
              {o.region && <div className="col-span-2"><span className="text-gray-500">Регион:</span> <span className="font-medium text-gray-900">{o.region}</span></div>}
              {o.deadline && <div className="col-span-2"><span className="text-gray-500">Срок:</span> <span className="font-medium text-gray-900">{o.deadline}</span></div>}
            </div>
            {o.description && <p><span className="font-medium text-gray-700">Описание:</span> {o.description}</p>}
            {o.media && o.media.length > 0 && (
              <div className="mt-2">
                <span className="font-medium text-gray-700 text-xs">Медиафайлы:</span>
                <div className="flex gap-2 mt-1 overflow-x-auto">
                  {o.media.map((file: string, idx: number) => (
                    <img key={idx} src={file} alt={`Фото ${idx + 1}`} className="w-12 h-12 object-cover rounded-md border border-gray-200" />
                  ))}
                </div>
              </div>
            )}
            {o.responses && o.responses.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-gray-700 text-xs mb-2">Все отклики ({o.responses.length}):</p>
                <div className="space-y-2">
                  {o.responses.map((r: any) => (
                    <div key={r.id} className={`p-2 rounded-lg border text-xs ${r.contractorId === o.acceptedContractorId ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-900">{r.contractorName}</span>
                        {r.contractorId === o.acceptedContractorId && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">Выбран</span>
                        )}
                      </div>
                      {r.workingHours && <p className="text-gray-500 mb-1">Часы работы: {r.workingHours}</p>}
                      {r.message && <p className="text-gray-700 italic">"{r.message}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentsView({ payments }: { payments: any[] }) {
  return (
    <div className="space-y-4">
      {payments.map(p => (
        <div key={p.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <div className="flex justify-between items-start gap-2 mb-2">
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-500">{p.id}</span>
            <span className={`shrink-0 whitespace-nowrap text-xs font-bold px-2 py-1 rounded ${p.status === 'Успешно' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-900">{p.amount}</h3>
            <span className="text-xs text-gray-500">{p.date}</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Пользователь: {p.user}</p>
            <p>Назначение: {p.purpose}</p>
            {p.error && <p className="text-red-500 text-xs mt-1">Ошибка: {p.error}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function BannersView({ banners, setBanners, contractors, setContractors }: { banners: any[], setBanners: any, contractors: any[], setContractors: any }) {
  const { refreshAdminData } = useData();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  const toggleBanner = async (id: number) => {
    const banner = banners.find(b => b.id === id);
    if (!banner) return;
    try {
      const newStatus = banner.status === 'active' ? 'inactive' : 'active';
      await adminApi.updateBanner(id, { ...banner, status: newStatus });
      await refreshAdminData();
    } catch (error) {
      console.error('Failed to toggle banner:', error);
      alert('Ошибка при изменении статуса баннера');
    }
  };

  const startEdit = (banner: any) => {
    setEditingId(banner.id);
    setEditForm({
      ...banner,
      logo: banner.image_url || banner.logo || '',
      imageKey: banner.image_key || banner.imageKey || '',
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMediaFile(file)
        .then(uploaded => {
          setEditForm({ ...editForm, logo: uploaded.previewUrl, imageKey: uploaded.key });
        })
        .catch(error => {
          console.error('Failed to upload banner image:', error);
          alert('Ошибка при загрузке изображения');
        })
        .finally(() => {
          e.target.value = '';
        });
    }
  };

  const saveEdit = async () => {
    try {
      const executorId = editForm.contractorId || editForm.executor_id;
      if (!executorId) {
        alert('Выберите исполнителя для баннера');
        return;
      }

      const payload = {
        executor_id: executorId,
        title: editForm.contractor || editForm.title || '',
        description: editForm.description || '',
        image_key: editForm.imageKey || editForm.image_key || '',
        link_url: editForm.link_url || null,
        position: editForm.position || 'main',
      };

      if (editingId === -1) {
        await adminApi.createBanner(payload);
      } else {
        await adminApi.updateBanner(editingId!, payload);
      }
      
      setEditingId(null);
      await refreshAdminData();
    } catch (error) {
      console.error('Failed to save banner:', error);
      alert('Ошибка при сохранении баннера');
    }
  };

  const deleteBanner = async (id: number) => {
    try {
      await adminApi.deleteBanner(id);
      await refreshAdminData();
    } catch (error) {
      console.error('Failed to delete banner:', error);
      alert('Ошибка при удалении баннера');
    }
  };

  const addBanner = () => {
    setEditingId(-1);
    setEditForm({
      id: -1,
      contractorId: '',
      contractor: '',
      description: '',
      status: 'inactive',
      views: 0,
      clicks: 0,
      logo: '',
      imageKey: '',
    });
  };

  return (
    <div className="space-y-4">
      {editingId !== -1 && (
        <button onClick={addBanner} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl shadow-md mb-4">
          + Добавить баннер
        </button>
      )}

      {editingId === -1 && (
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 mb-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Исполнитель</label>
              <select 
                value={editForm.contractorId} 
                onChange={e => {
                  const contractor = contractors.find(c => c.userId === e.target.value || c.id === e.target.value);
                  setEditForm({
                    ...editForm, 
                    contractorId: e.target.value,
                    contractor: contractor ? contractor.shortName || contractor.name : ''
                  });
                }} 
                className="w-full border border-gray-300 p-2 rounded-lg text-sm"
              >
                <option value="">Выберите исполнителя</option>
                {contractors.map(c => (
                  <option key={c.userId || c.id} value={c.userId || c.id}>{c.shortName || c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Текст на баннере</label>
              <textarea 
                value={editForm.description || ''} 
                onChange={e => setEditForm({...editForm, description: e.target.value})} 
                className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Логотип / Баннер</label>
              <label className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer relative overflow-hidden">
                {editForm.logo ? (
                  <img src={editForm.logo} alt="Логотип" className="absolute inset-0 w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-xs">Загрузить изображение</span>
                )}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-lg text-sm">Отмена</button>
              <button onClick={saveEdit} className="flex-1 bg-blue-500 text-white font-bold py-2 rounded-lg text-sm">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {banners.map((b: any) => {
        const contractor = contractors.find(c => c.userId === b.contractorId || c.id === b.contractorId || c.name === b.contractor || c.shortName === b.contractor);
        const period = contractor?.subEnd ? `До ${contractor.subEnd}` : 'Неограничен';

        return (
          <div key={b.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
            {editingId === b.id ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Текст на баннере</label>
                  <textarea 
                    value={editForm.description || ''} 
                    onChange={e => setEditForm({...editForm, description: e.target.value})} 
                    className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Логотип / Баннер</label>
                  <label className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer relative overflow-hidden">
                    {editForm.logo ? (
                      <img src={editForm.logo} alt="Логотип" className="absolute inset-0 w-full h-full object-contain p-2" />
                    ) : (
                      <span className="text-xs">Загрузить изображение</span>
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={saveEdit} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold text-sm">Сохранить</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 bg-[#E8EDF2] text-[#0F2846] py-2 rounded-lg font-bold text-sm">Отмена</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-3">
                  <span className={`shrink-0 whitespace-nowrap text-xs font-bold px-2 py-1 rounded ${b.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-[#E8EDF2] text-[#0F2846]'}`}>
                    {b.status === 'active' ? 'Активен' : 'Неактивен'}
                  </span>
                  <div className="flex gap-3">
                    <button onClick={() => startEdit(b)} className="text-sm text-slate-600 font-medium">Редактировать</button>
                    <button onClick={() => toggleBanner(b.id)} className="text-sm text-blue-600 font-medium">
                      {b.status === 'active' ? 'Отключить' : 'Включить'}
                    </button>
                    <button onClick={() => deleteBanner(b.id)} className="text-sm text-red-600 font-medium">Удалить</button>
                  </div>
                </div>
                <div className="w-full h-24 bg-orange-100 rounded-lg mb-3 flex items-center justify-center border border-orange-200 relative overflow-hidden">
                  {b.logo ? (
                    <img src={b.logo} alt={b.contractor} className="absolute inset-0 w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-orange-800 font-bold">{b.contractor}</span>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Компания:</span> {b.contractor}</p>
                  <p><span className="font-medium">Период:</span> {period}</p>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ModerationView({ moderation, setModeration, contractors, setContractors, banners, setBanners }: { moderation: any[], setModeration: any, contractors: any[], setContractors: any, banners: any[], setBanners: any }) {
  const { refreshAdminData } = useData();
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    const request = moderation.find(m => m.id === id);
    if (!request) return;

    try {
      await adminApi.moderateExecutor(request.data.id || String(id), action === 'approve' ? 'APPROVED' : 'REJECTED');
      
      setSelectedRequest(null);
      await refreshAdminData();
    } catch (error: any) {
      console.error('Failed to moderate executor:', error);
      alert(`Ошибка при модерации: ${error.message || 'Пожалуйста, попробуйте еще раз.'}`);
    }
  };

  if (selectedRequest) {
    const isEdit = selectedRequest.type === 'edit';
    const data = selectedRequest.data;
    const oldData = selectedRequest.oldData || {};

    const renderField = (label: string, key: string, isArray: boolean = false) => {
      const newValue = isArray ? data[key]?.join(', ') : data[key];
      const oldValue = isArray ? oldData[key]?.join(', ') : oldData[key];
      const isChanged = isEdit && newValue !== oldValue;

      return (
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">{label}</label>
          {isChanged ? (
            <div className="space-y-1">
              <div className="text-sm text-red-500 line-through bg-red-50 p-2 rounded-lg border border-red-100">{oldValue || '—'}</div>
              <div className="text-sm text-green-600 font-medium bg-green-50 p-2 rounded-lg border border-green-200">{newValue || '—'}</div>
            </div>
          ) : (
            <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-100">{newValue || '—'}</div>
          )}
        </div>
      );
    };

    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-[#D8DFE8] rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="font-bold text-gray-900">Заявка #{selectedRequest.id}</h2>
              <p className="text-xs text-gray-500">{isEdit ? 'Редактирование профиля' : 'Новая регистрация'}</p>
            </div>
          </div>
          <span className={`shrink-0 whitespace-nowrap text-xs font-bold px-2 py-1 rounded ${isEdit ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            {isEdit ? 'Редактирование' : 'Новая заявка'}
          </span>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Данные организации</h3>
          {renderField('Статус юридического лица', 'legalStatus')}
          {renderField('Полное юридическое наименование', 'name')}
          {renderField('УНП', 'unp')}
          {renderField('Краткое название', 'shortName')}
          {renderField('Описание деятельности', 'description')}
          {(selectedRequest.profile === 'leader' || selectedRequest.profile === 'Лидер' || selectedRequest.data?.profileType === 'leader' || selectedRequest.data?.profileType === 'Лидер') && renderField('Текст рекламного баннера', 'bannerText')}
          {renderField('Категории и виды оказываемых услуг', 'services', true)}
          {renderField('Регион оказания услуг', 'regions', true)}
          {renderField('Контактный телефон', 'phone')}
          {renderField('Ссылка на Instagram', 'instagram')}
          {renderField('Ссылка на сайт', 'website')}
          
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">График работы</label>
            {isEdit && data.schedule !== oldData.schedule ? (
              <div className="space-y-1">
                <div className="text-sm text-red-500 line-through bg-red-50 p-2 rounded-lg border border-red-100">{oldData.schedule ? formatSchedule(oldData.schedule) : '—'}</div>
                <div className="text-sm text-green-600 font-medium bg-green-50 p-2 rounded-lg border border-green-200">{data.schedule ? formatSchedule(data.schedule) : '—'}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-100">{data.schedule ? formatSchedule(data.schedule) : '—'}</div>
            )}
          </div>

          <h3 className="font-bold text-gray-900 mt-6 mb-4 border-b pb-2">Медиафайлы</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="border border-gray-200 rounded-lg p-3 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-[#E8EDF2] rounded-lg flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-gray-500" />
              </div>
              <span className="text-xs text-gray-700 font-medium">Документы юр. лица</span>
              <button className="text-blue-500 text-xs mt-1 hover:underline">Просмотреть</button>
            </div>
            
            {(selectedRequest.profile === 'leader' || selectedRequest.profile === 'pro' || selectedRequest.profile === 'Лидер' || selectedRequest.profile === 'Профи') && (
              <div className="border border-gray-200 rounded-lg p-3 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-[#E8EDF2] rounded-lg flex items-center justify-center mb-2">
                  <ImageIcon className="w-6 h-6 text-gray-500" />
                </div>
                <span className="text-xs text-gray-700 font-medium">Логотип</span>
                <button className="text-blue-500 text-xs mt-1 hover:underline">Просмотреть</button>
              </div>
            )}

            <div className="border border-gray-200 rounded-lg p-3 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-[#E8EDF2] rounded-lg flex items-center justify-center mb-2">
                <ImageIcon className="w-6 h-6 text-gray-500" />
              </div>
              <span className="text-xs text-gray-700 font-medium">Фото работ (5)</span>
              <button className="text-blue-500 text-xs mt-1 hover:underline">Просмотреть</button>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => handleAction(selectedRequest.id, 'reject')} className="flex-1 bg-red-100 text-red-600 text-sm font-bold py-3 rounded-xl hover:bg-red-200 transition-colors">
              Отклонить
            </button>
            <button onClick={() => handleAction(selectedRequest.id, 'approve')} className="flex-[2] bg-green-500 text-white text-sm font-bold py-3 rounded-xl hover:bg-green-600 transition-colors shadow-md">
              Одобрить заявку
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (moderation.length === 0 || moderation.every(m => m.status !== 'new')) {
    return (
      <div className="text-center py-10 text-gray-500">
        <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Нет новых заявок на модерацию</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {moderation.filter(m => m.status === 'new').map(m => (
        <div key={m.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-200 hover:border-blue-300 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className={`shrink-0 whitespace-nowrap text-xs font-bold px-2 py-1 rounded ${m.type === 'edit' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {m.type === 'edit' ? 'Редактирование' : 'Новая заявка'}
            </span>
            <span className="text-xs text-gray-500">{m.date}</span>
          </div>
          <h3 className="font-bold text-gray-900 mb-1">{m.name}</h3>
          <p className="text-sm text-gray-600 mb-4">Профиль: {m.profile}</p>
          
          <div className="flex gap-2">
            <button onClick={() => handleAction(m.id, 'approve')} className="flex-1 bg-green-500 text-white text-sm font-bold py-2 rounded-lg hover:bg-green-600 transition-colors">Одобрить</button>
            <button onClick={() => handleAction(m.id, 'reject')} className="flex-1 bg-red-100 text-red-600 text-sm font-bold py-2 rounded-lg hover:bg-red-200 transition-colors">Отклонить</button>
          </div>
          <button 
            onClick={() => setSelectedRequest(m)}
            className="w-full mt-2 bg-[#E8EDF2] text-[#0F2846] text-sm font-bold py-2 rounded-lg hover:bg-[#D8DFE8] transition-colors"
          >
            Смотреть анкету
          </button>
        </div>
      ))}
    </div>
  );
}

function SupportView({ support, setSupport }: { support: any[], setSupport: any }) {
  const { refreshAdminData } = useData();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadChat = async (id: string) => {
    setChatLoading(true);
    setChatError(null);
    try {
      const data = await adminApi.getSupportTicket(id);
      setActiveChat(data);
    } catch (error) {
      console.error('Failed to load support ticket:', error);
      setChatError('Не удалось загрузить обращение');
    } finally {
      setChatLoading(false);
    }
  };

  const openChat = async (id: string) => {
    setActiveChatId(id);
    setReplyText('');
    setActiveChat(null);
    await loadChat(id);
  };

  const handleResolve = async (id: string) => {
    try {
      await adminApi.resolveSupportTicket(id);
    } catch (error) {
      console.error('Failed to resolve support ticket:', error);
    } finally {
      setActiveChatId(null);
      await refreshAdminData();
    }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;
    try {
      await adminApi.replySupportTicket(id, replyText);
      await loadChat(id);
    } catch (error) {
      console.error('Failed to reply to support ticket:', error);
    } finally {
      setReplyText('');
      await refreshAdminData();
    }
  };

  useEffect(() => {
    if (activeChatId) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChatId, support]);

  const sortedSupport = [...support].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  if (activeChatId) {
    const chat = activeChat || support.find(s => s.id === activeChatId);
    if (chatLoading && !chat) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-140px)] -m-4 bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      );
    }

    if (chatError && !chat) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-140px)] -m-4 bg-gray-50 p-4">
          <div className="text-center">
            <p className="text-sm text-red-500 mb-3">{chatError}</p>
            <button
              onClick={() => openChat(activeChatId)}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      );
    }

    if (!chat) return null;

    const ticketStatus = String(chat.status || '').toUpperCase();
    const isClosed = ticketStatus === 'CLOSED' || ticketStatus === 'RESOLVED';
    const isWaiting = ticketStatus === 'WAITING_CUSTOMER';
    const isInProgress = !isClosed;
    const messages = chat.messages || [];

    return (
      <div className="flex flex-col h-[calc(100vh-140px)] -m-4 bg-gray-50">
        <div className="bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveChatId(null)}
              className="p-2 -ml-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{chat.user}</h1>
              <p className="text-xs text-green-500 font-medium">
                {isClosed ? 'Решено' : isWaiting ? 'Ждет ответа' : 'В работе'}
              </p>
            </div>
          </div>
          {isInProgress && (
            <button 
              onClick={() => handleResolve(chat.id)}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              Решено
            </button>
          )}
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="text-center text-xs text-gray-400 my-4">Начало чата</div>
          {chatError ? (
            <div className="text-center text-sm text-red-500 py-6">{chatError}</div>
          ) : messages.length > 0 ? (
            messages.map((message: any) => (
              <div key={message.id} className={`flex ${message.is_from_support ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[80%] shadow-sm ${
                  message.is_from_support
                    ? 'bg-blue-500 text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-[10px] text-right mt-1 ${message.is_from_support ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(message.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-gray-400 py-6">Сообщений пока нет</div>
          )}
          <div ref={chatEndRef} />
        </div>

        {isInProgress && (
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReply(chat.id)}
                placeholder="Введите ответ..."
                className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3 text-sm transition-all outline-none"
              />
              <button 
                onClick={() => handleReply(chat.id)}
                disabled={!replyText.trim()}
                className={`p-3 rounded-xl flex items-center justify-center transition-colors ${
                  replyText.trim() ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-200 text-gray-400'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedSupport.map(s => (
        <div 
          key={s.id} 
          onClick={() => openChat(s.id)}
          className="bg-white p-4 rounded-xl shadow-md border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex justify-between items-start mb-2">
            <span className={`shrink-0 whitespace-nowrap text-xs font-bold px-2 py-1 rounded ${s.status === 'open' ? 'bg-blue-100 text-blue-700' : s.status === 'waiting_customer' ? 'bg-amber-100 text-amber-700' : s.status === 'in_progress' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
              {s.status === 'open' ? 'Открыто' : s.status === 'waiting_customer' ? 'Ждет ответа' : s.status === 'in_progress' ? 'В работе' : 'Решено'}
            </span>
            <span className="text-xs text-gray-500">
              {s.replies && s.replies.length > 0 ? s.replies[s.replies.length - 1].time : s.time}
            </span>
          </div>
          <h3 className="font-bold text-gray-900 mb-1">{s.user}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {s.replies && s.replies.length > 0 
              ? (s.replies[s.replies.length - 1].admin ? 'Вы: ' : '') + s.replies[s.replies.length - 1].text 
              : s.text}
          </p>
        </div>
      ))}
    </div>
  );
}

function CarsView({ carModels, setCarModels }: { carModels: AdminCarModelsByBrand, setCarModels: React.Dispatch<React.SetStateAction<AdminCarModelsByBrand>> }) {
  const { refreshAdminData, carBrands } = useData();
  const [localCarModels, setLocalCarModels] = useState<AdminCarModelsByBrand>(carModels);
  const [newMake, setNewMake] = useState('');
  const [selectedMake, setSelectedMake] = useState<string | null>(null);
  const [newModel, setNewModel] = useState('');
  
  const [editingMake, setEditingMake] = useState<{old: string, new: string} | null>(null);
  const [editingModel, setEditingModel] = useState<{old: string, new: string} | null>(null);

  useEffect(() => {
    setLocalCarModels(carModels);
  }, [carModels]);

  useEffect(() => {
    if (!carBrands.length) return;

    const brandIds = carBrands.map(getAdminCarEntityId).filter(Boolean);
    const knownBrandIds = Object.keys(carModels);
    const needsLoad = brandIds.length > 0 && brandIds.some((id) => !knownBrandIds.includes(id));

    if (!needsLoad) return;

    let cancelled = false;

    const loadCarModels = async () => {
      const entries = await Promise.all(
        brandIds.map(async (brandId) => [brandId, await adminApi.getCarModels(brandId).catch(() => [])] as const)
      );

      if (cancelled) return;

      const nextModels = Object.fromEntries(entries) as AdminCarModelsByBrand;
      setLocalCarModels(nextModels);
      setCarModels(nextModels);
    };

    loadCarModels();

    return () => {
      cancelled = true;
    };
  }, [carBrands, carModels, setCarModels]);

  const syncCarModels = (nextModels: AdminCarModelsByBrand) => {
    setLocalCarModels(nextModels);
    setCarModels(nextModels);
  };

  const brandOptions = getAdminCarBrandOptions(carBrands, localCarModels);
  const selectedBrand = brandOptions.find((brand) => brand.id === selectedMake);
  const selectedBrandModels = getAdminCarModelOptions(localCarModels, selectedMake);

  const handleAddMake = async () => {
    const makeName = newMake.trim();
    if (makeName && !brandOptions.some((brand) => brand.name.toLowerCase() === makeName.toLowerCase())) {
      try {
        await adminApi.createCarMake(makeName);
        setNewMake('');
        await refreshAdminData();
      } catch (error) {
        console.error('Failed to add car make:', error);
        alert('Ошибка при добавлении марки');
      }
    }
  };

  const handleDeleteMake = async (make: string) => {
    try {
      await adminApi.deleteCarMake(make);
      const newModels = { ...localCarModels };
      delete newModels[make];
      syncCarModels(newModels);
      if (selectedMake === make) setSelectedMake(null);
      await refreshAdminData();
    } catch (error) {
      console.error('Failed to delete car make:', error);
      alert('Ошибка при удалении марки');
    }
  };

  const handleEditMake = async () => {
    if (editingMake && editingMake.new.trim() && editingMake.new.trim() !== editingMake.old) {
      const newMakeName = editingMake.new.trim();
      try {
        await adminApi.updateCarMake(editingMake.old, newMakeName);
        await refreshAdminData();
      } catch (error) {
        console.error('Failed to update car make:', error);
        alert('Ошибка при обновлении марки');
      }
    }
    setEditingMake(null);
  };

  const handleAddModel = async () => {
    const modelName = newModel.trim();
    if (selectedMake && modelName && !selectedBrandModels.some((model) => model.name.toLowerCase() === modelName.toLowerCase())) {
      try {
        const createdModel = await adminApi.createCarModel(selectedMake, modelName);
        const createdModelId = getAdminCarEntityId(createdModel) || modelName;
        syncCarModels({
          ...localCarModels,
          [selectedMake]: [...(localCarModels[selectedMake] || []), { id: createdModelId, name: modelName }]
        });
        setNewModel('');
        await refreshAdminData();
      } catch (error) {
        console.error('Failed to add car model:', error);
        alert('Ошибка при добавлении модели');
      }
    }
  };

  const handleDeleteModel = async (make: string, model: string) => {
    try {
      await adminApi.deleteCarModel(make, model);
      syncCarModels({
        ...localCarModels,
        [make]: (localCarModels[make] || []).filter(m => getAdminCarEntityId(m) !== model)
      });
      await refreshAdminData();
    } catch (error) {
      console.error('Failed to delete car model:', error);
      alert('Ошибка при удалении модели');
    }
  };

  const handleEditModel = async () => {
    if (selectedMake && editingModel && editingModel.new.trim() && editingModel.new.trim() !== editingModel.old) {
      const newModelName = editingModel.new.trim();
      try {
        await adminApi.updateCarModel(selectedMake, editingModel.old, newModelName);
        syncCarModels({
          ...localCarModels,
          [selectedMake]: (localCarModels[selectedMake] || []).map((model) => {
            if (getAdminCarEntityId(model) !== editingModel.old) return model;
            if (typeof model === 'object' && model !== null) {
              return { ...model as Record<string, unknown>, name: newModelName };
            }
            return newModelName;
          })
        });
        await refreshAdminData();
      } catch (error) {
        console.error('Failed to update car model:', error);
        alert('Ошибка при обновлении модели');
      }
    }
    setEditingModel(null);
  };

  const handleSave = () => {
    setCarModels(localCarModels);
    refreshAdminData();
    alert('Изменения сохранены');
  };

  const hasChanges = JSON.stringify(localCarModels) !== JSON.stringify(carModels);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={!hasChanges}
          className={`px-6 py-2 rounded-xl font-bold transition-colors shadow-sm ${hasChanges ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          Сохранить изменения
        </button>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-3">Марки автомобилей</h3>
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            placeholder="Новая марка..." 
            className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
            value={newMake}
            onChange={e => setNewMake(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddMake()}
          />
          <button onClick={handleAddMake} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold">Добавить</button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {brandOptions.map(brand => (
            <div 
              key={brand.id}
              onClick={() => setSelectedMake(brand.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${selectedMake === brand.id ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8]'}`}
            >
              {editingMake?.old === brand.id ? (
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <input 
                    type="text" 
                    value={editingMake.new} 
                    onChange={e => setEditingMake({...editingMake, new: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && handleEditMake()}
                    autoFocus
                    className="border border-blue-300 rounded px-1 py-0.5 text-sm w-24 outline-none"
                  />
                  <button onClick={handleEditMake} className="text-green-600 hover:text-green-700"><CheckCircle className="w-4 h-4" /></button>
                  <button onClick={() => setEditingMake(null)} className="text-red-500 hover:text-red-600"><XCircle className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <span className="font-medium" onDoubleClick={(e) => { e.stopPropagation(); setEditingMake({old: brand.id, new: brand.name}); }}>{brand.name}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteMake(brand.id); }}
                    className="text-gray-400 hover:text-red-500 ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">Двойной клик по названию для редактирования</p>
      </div>

      {selectedMake && (
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">Модели: {selectedBrand?.name || selectedMake}</h3>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Новая модель..." 
              className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
              value={newModel}
              onChange={e => setNewModel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddModel()}
            />
            <button onClick={handleAddModel} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold">Добавить</button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedBrandModels.map(model => (
              <div key={model.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                {editingModel?.old === model.id ? (
                  <div className="flex items-center gap-1">
                    <input 
                      type="text" 
                      value={editingModel.new} 
                      onChange={e => setEditingModel({...editingModel, new: e.target.value})}
                      onKeyDown={e => e.key === 'Enter' && handleEditModel()}
                      autoFocus
                      className="border border-gray-300 rounded px-1 py-0.5 text-sm w-24 outline-none"
                    />
                    <button onClick={handleEditModel} className="text-green-600 hover:text-green-700"><CheckCircle className="w-4 h-4" /></button>
                    <button onClick={() => setEditingModel(null)} className="text-red-500 hover:text-red-600"><XCircle className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-700" onDoubleClick={() => setEditingModel({old: model.id, new: model.name})}>{model.name}</span>
                    <button 
                      onClick={() => handleDeleteModel(selectedMake, model.id)}
                      className="text-gray-400 hover:text-red-500 ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {selectedBrandModels.length === 0 && (
              <p className="text-sm text-gray-500 w-full text-center py-2">Нет добавленных моделей</p>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-3">Двойной клик по названию для редактирования</p>
        </div>
      )}
    </div>
  );
}
function ContentView({ content }: { content: any }) {
  const { refreshAdminData } = useData();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  
  // For FAQ
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [draftFaqItem, setDraftFaqItem] = useState<any | null>(null);
  const faqAnswerRef = useRef<HTMLTextAreaElement | null>(null);
  const editTextRef = useRef<HTMLTextAreaElement | null>(null);

  const sections = [
    { id: 'faq', title: 'FAQ (Вопросы и ответы)' },
    { id: 'rules', title: 'Правила сервиса' },
    { id: 'privacy', title: 'Политика конфиденциальности' },
    { id: 'templates', title: 'Шаблоны уведомлений (Telegram)' },
  ];

  const startEdit = (id: string) => {
    setEditingSection(id);
    if (id !== 'faq') {
      setEditText(content[id]);
    }
  };

  const saveEdit = async () => {
    if (editingSection && editingSection !== 'faq') {
      try {
        await adminApi.updateContent(editingSection as 'rules' | 'privacy' | 'templates', editText);
        setEditingSection(null);
        await refreshAdminData();
      } catch (error) {
        console.error('Failed to update content:', error);
        alert('Ошибка при сохранении контента');
      }
    }
  };

  const handleAddFaq = () => {
    if (editingFaqId) {
      requestAnimationFrame(() => faqAnswerRef.current?.focus());
      return;
    }

    const newId = Date.now().toString();
    const newItem = { id: newId, question: 'Новый вопрос', answer: 'Ответ на вопрос' };
    setDraftFaqItem(newItem);
    startEditFaq(newId, 'Новый вопрос', 'Ответ на вопрос');
  };

  const cancelFaqEdit = () => {
    if (editingFaqId && draftFaqItem?.id === editingFaqId) {
      setDraftFaqItem(null);
    }
    setEditingFaqId(null);
  };

  const startEditFaq = (id: string, question: string, answer: string) => {
    setEditingFaqId(id);
    setFaqQuestion(question);
    setFaqAnswer(answer);
  };

  const saveFaqEdit = async () => {
    if (editingFaqId) {
      try {
        const isDraft = draftFaqItem?.id === editingFaqId;
        const newFaq = saveFaqEditorItem(
          content.faq,
          { id: editingFaqId, question: faqQuestion, answer: faqAnswer },
          isDraft,
        );
        await adminApi.updateFaq(newFaq);
        setEditingFaqId(null);
        if (isDraft) {
          setDraftFaqItem(null);
        }
        await refreshAdminData();
      } catch (error) {
        console.error('Failed to update FAQ:', error);
        alert('Ошибка при сохранении FAQ');
      }
    }
  };

  const insertBulletIntoText = (
    textarea: HTMLTextAreaElement | null,
    value: string,
    onChange: (nextValue: string) => void,
    insertBullet = insertEditorBullet,
  ) => {
    const selectionStart = textarea?.selectionStart ?? value.length;
    const selectionEnd = textarea?.selectionEnd ?? selectionStart;
    const next = insertBullet(value, selectionStart, selectionEnd);

    onChange(next.text);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(next.cursor, next.cursor);
    });
  };

  const handleInsertFaqBullet = () => {
    insertBulletIntoText(faqAnswerRef.current, faqAnswer, setFaqAnswer, insertFaqBullet);
  };

  const handleInsertContentBullet = () => {
    insertBulletIntoText(editTextRef.current, editText, setEditText);
  };

  const deleteFaq = async (id: string) => {
    try {
      const newFaq = content.faq.filter((item: any) => item.id !== id);
      await adminApi.updateFaq(newFaq);
      await refreshAdminData();
    } catch (error) {
      console.error('Failed to delete FAQ:', error);
      alert('Ошибка при удалении FAQ');
    }
  };

  const moveFaqUp = async (index: number) => {
    if (index === 0) return;
    const newFaq = [...content.faq];
    const temp = newFaq[index];
    newFaq[index] = newFaq[index - 1];
    newFaq[index - 1] = temp;
    try {
      await adminApi.updateFaq(newFaq);
      await refreshAdminData();
    } catch (error) {
      console.error('Failed to move FAQ:', error);
      alert('Ошибка при перемещении FAQ');
    }
  };

  const moveFaqDown = async (index: number) => {
    if (index === content.faq.length - 1) return;
    const newFaq = [...content.faq];
    const temp = newFaq[index];
    newFaq[index] = newFaq[index + 1];
    newFaq[index + 1] = temp;
    try {
      await adminApi.updateFaq(newFaq);
      await refreshAdminData();
    } catch (error) {
      console.error('Failed to move FAQ:', error);
      alert('Ошибка при перемещении FAQ');
    }
  };

  if (editingSection === 'faq') {
    const sectionTitle = sections.find(s => s.id === editingSection)?.title;
    const faqItemsForEditor = getFaqItemsForEditor(content.faq, draftFaqItem);
    return (
      <div className="space-y-4">
        <button onClick={() => setEditingSection(null)} className="text-sm text-blue-600 font-medium flex items-center">
          <ChevronLeft className="w-4 h-4 mr-1" /> Назад
        </button>
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Редактирование: {sectionTitle}</h2>
            <button
              onClick={handleAddFaq}
              disabled={Boolean(editingFaqId)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold ${editingFaqId ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
            >
              + Добавить вопрос
            </button>
          </div>
          
          <div className="space-y-3">
            {faqItemsForEditor.map((item: any) => {
              const savedIndex = content.faq.findIndex((savedItem: any) => savedItem.id === item.id);
              const isSavedItem = savedIndex !== -1;

              return (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                  {editingFaqId === item.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Вопрос</label>
                      <input 
                        type="text" 
                        value={faqQuestion}
                        onChange={e => setFaqQuestion(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label className="block text-xs font-medium text-gray-700">Ответ (Markdown: **жирный**, списки)</label>
                        <button
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={handleInsertFaqBullet}
                          className="shrink-0 bg-[#E8EDF2] text-[#0F2846] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#D8DFE8]"
                        >
                          • Пункт
                        </button>
                      </div>
                      <textarea 
                        ref={faqAnswerRef}
                        value={faqAnswer}
                        onChange={e => setFaqAnswer(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm min-h-[100px]"
                      ></textarea>
                      <p className="text-xs text-gray-500 mt-1">
                        Поставьте курсор в нужное место и нажмите "• Пункт", добавится новая строка с точкой.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveFaqEdit} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold">Сохранить</button>
                      <button onClick={cancelFaqEdit} className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold">Отмена</button>
                    </div>
                  </div>
                  ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <h3 className="font-bold text-gray-900 text-sm">{item.question}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.answer}</p>
                    </div>
                    <div className="flex flex-col gap-1 ml-2 items-end">
                      <div className="flex gap-1 mb-1">
                        <button 
                          onClick={() => moveFaqUp(savedIndex)}
                          disabled={!isSavedItem || savedIndex === 0}
                          className={`p-1 rounded ${!isSavedItem || savedIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                          title="Поднять выше"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => moveFaqDown(savedIndex)}
                          disabled={!isSavedItem || savedIndex === content.faq.length - 1}
                          className={`p-1 rounded ${!isSavedItem || savedIndex === content.faq.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                          title="Опустить ниже"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => startEditFaq(item.id, item.question, item.answer)} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1">Изменить</button>
                        <button onClick={() => deleteFaq(item.id)} className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1">Удалить</button>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              );
            })}
            {faqItemsForEditor.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Нет добавленных вопросов</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (editingSection) {
    const sectionTitle = sections.find(s => s.id === editingSection)?.title;
    const canInsertContentBullet = editingSection === 'rules' || editingSection === 'privacy';
    return (
      <div className="space-y-4">
        <button onClick={() => setEditingSection(null)} className="text-sm text-blue-600 font-medium flex items-center">
          <ChevronLeft className="w-4 h-4 mr-1" /> Назад
        </button>
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-lg font-bold mb-4">Редактирование: {sectionTitle}</h2>
          <div className="flex items-center justify-between gap-2 mb-1">
            <label className="block text-xs font-medium text-gray-700">
              Текст (Markdown: **жирный**, списки)
            </label>
            {canInsertContentBullet && (
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={handleInsertContentBullet}
                className="shrink-0 bg-[#E8EDF2] text-[#0F2846] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#D8DFE8]"
              >
                • Пункт
              </button>
            )}
          </div>
          {canInsertContentBullet && (
            <div className="mb-2">
              <p className="text-xs text-gray-500">Поставьте курсор в текст и добавьте пункт с новой строки.</p>
            </div>
          )}
          <textarea 
            ref={editTextRef}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[300px] mb-4"
            value={editText}
            onChange={e => setEditText(e.target.value)}
            placeholder="Поддерживается Markdown: **жирный текст**"
          ></textarea>
          <button onClick={saveEdit} className="w-full bg-green-500 text-white font-bold py-3 rounded-xl">
            Сохранить изменения
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map(section => (
        <button 
          key={section.id}
          onClick={() => startEdit(section.id)}
          className="w-full bg-white p-4 rounded-xl shadow-md border border-gray-100 text-left font-bold text-gray-900 flex justify-between items-center hover:bg-gray-50 transition-colors"
        >
          {section.title} <ChevronLeft className="w-5 h-5 rotate-180 text-gray-400" />
        </button>
      ))}
    </div>
  );
}

function ServicesView({ 
  serviceCategories, setServiceCategories,
  contractors, setContractors,
  orders, setOrders
}: { 
  serviceCategories: any[], setServiceCategories: any,
  contractors: any[], setContractors: any,
  orders: any[], setOrders: any
}) {
  const { refreshAdminData } = useData();
  const [localCategories, setLocalCategories] = useState(serviceCategories);
  const [localContractors, setLocalContractors] = useState(contractors);
  const [localOrders, setLocalOrders] = useState(orders);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newService, setNewService] = useState('');
  const [editingCategory, setEditingCategory] = useState<{id: string, name: string} | null>(null);
  const [editingService, setEditingService] = useState<{old: string, new: string} | null>(null);

  useEffect(() => {
    setLocalCategories(serviceCategories);
    setLocalContractors(contractors);
    setLocalOrders(orders);
  }, [serviceCategories, contractors, orders]);

  const handleAddCategory = () => {
    if (newCategory.trim() && !localCategories.find((c: any) => c.name === newCategory.trim())) {
      setLocalCategories([
        ...localCategories,
        { id: String(Date.now()), name: newCategory.trim(), services: [] }
      ]);
      setNewCategory('');
    }
  };

  const handleDeleteCategory = (id: string) => {
    const categoryToDelete = localCategories.find((c: any) => c.id === id);
    if (categoryToDelete) {
      // Remove services from contractors and orders
      const servicesToDelete = categoryToDelete.services;
      
      setLocalContractors(localContractors.map((c: any) => ({
        ...c,
        services: c.services.filter((s: string) => !servicesToDelete.includes(s))
      })));

      setLocalOrders(localOrders.map((o: any) => ({
        ...o,
        serviceType: servicesToDelete.includes(o.serviceType) ? '' : o.serviceType
      })));
    }

    setLocalCategories(localCategories.filter((c: any) => c.id !== id));
    if (selectedCategory === id) setSelectedCategory(null);
  };

  const handleEditCategory = () => {
    if (editingCategory && editingCategory.name.trim()) {
      setLocalCategories(localCategories.map((c: any) => 
        c.id === editingCategory.id ? { ...c, name: editingCategory.name.trim() } : c
      ));
    }
    setEditingCategory(null);
  };

  const handleAddService = () => {
    if (selectedCategory && newService.trim()) {
      setLocalCategories(localCategories.map((c: any) => {
        if (c.id === selectedCategory && !c.services.includes(newService.trim())) {
          return { ...c, services: [...c.services, newService.trim()] };
        }
        return c;
      }));
      setNewService('');
    }
  };

  const handleDeleteService = (categoryId: string, service: string) => {
    // Remove service from contractors and orders
    setLocalContractors(localContractors.map((c: any) => ({
      ...c,
      services: c.services.filter((s: string) => s !== service)
    })));

    setLocalOrders(localOrders.map((o: any) => ({
      ...o,
      serviceType: o.serviceType === service ? '' : o.serviceType
    })));

    setLocalCategories(localCategories.map((c: any) => {
      if (c.id === categoryId) {
        return { ...c, services: c.services.filter((s: string) => s !== service) };
      }
      return c;
    }));
  };

  const handleEditService = () => {
    if (selectedCategory && editingService && editingService.new.trim() && editingService.new.trim() !== editingService.old) {
      const newServiceName = editingService.new.trim();
      
      // Update service name in contractors and orders
      setLocalContractors(localContractors.map((c: any) => ({
        ...c,
        services: c.services.map((s: string) => s === editingService.old ? newServiceName : s)
      })));

      setLocalOrders(localOrders.map((o: any) => ({
        ...o,
        serviceType: o.serviceType === editingService.old ? newServiceName : o.serviceType
      })));

      setLocalCategories(localCategories.map((c: any) => {
        if (c.id === selectedCategory) {
          return {
            ...c,
            services: c.services.map((s: string) => s === editingService.old ? newServiceName : s)
          };
        }
        return c;
      }));
    }
    setEditingService(null);
  };

  const handleSave = async () => {
    try {
      await adminApi.updateServiceCategories(localCategories);
      alert('Изменения сохранены');
      await refreshAdminData();
    } catch (error) {
      console.error('Failed to save categories:', error);
      alert('Ошибка при сохранении');
    }
  };

  const hasChanges = JSON.stringify(localCategories) !== JSON.stringify(serviceCategories);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={!hasChanges}
          className={`px-6 py-2 rounded-xl font-bold transition-colors shadow-sm ${hasChanges ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          Сохранить изменения
        </button>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-200">
        <h2 className="font-bold text-gray-900 mb-4">Категории услуг</h2>
        
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            placeholder="Новая категория..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button 
            onClick={handleAddCategory}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm"
          >
            Добавить
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {localCategories.map((cat: any) => (
            <div 
              key={cat.id} 
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${selectedCategory === cat.id ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8]'}`}
            >
              {editingCategory?.id === cat.id ? (
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <input 
                    type="text" 
                    value={editingCategory.name}
                    onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && handleEditCategory()}
                    className="border border-blue-300 rounded px-1 py-0.5 text-sm w-24 outline-none"
                    autoFocus
                  />
                  <button onClick={handleEditCategory} className="text-green-600 hover:text-green-700"><CheckCircle className="w-4 h-4" /></button>
                  <button onClick={() => setEditingCategory(null)} className="text-red-500 hover:text-red-600"><XCircle className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <span className="font-medium" onDoubleClick={(e) => { e.stopPropagation(); setEditingCategory({id: cat.id, name: cat.name}); }}>{cat.name}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                    className="text-gray-400 hover:text-red-500 ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">Двойной клик по названию для редактирования</p>
      </div>

      {selectedCategory && (
        <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-900">
              Услуги: {localCategories.find((c: any) => c.id === selectedCategory)?.name}
            </h2>
          </div>
          
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={newService}
              onChange={e => setNewService(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddService()}
              placeholder="Новая услуга..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button 
              onClick={handleAddService}
              className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm"
            >
              Добавить
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {localCategories.find((c: any) => c.id === selectedCategory)?.services.map((service: string) => (
              <div key={service} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                {editingService?.old === service ? (
                  <div className="flex items-center gap-1">
                    <input 
                      type="text" 
                      value={editingService.new}
                      onChange={e => setEditingService({...editingService, new: e.target.value})}
                      onKeyDown={e => e.key === 'Enter' && handleEditService()}
                      className="border border-gray-300 rounded px-1 py-0.5 text-sm w-24 outline-none"
                      autoFocus
                    />
                    <button onClick={handleEditService} className="text-green-600 hover:text-green-700"><CheckCircle className="w-4 h-4" /></button>
                    <button onClick={() => setEditingService(null)} className="text-red-500 hover:text-red-600"><XCircle className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-700" onDoubleClick={() => setEditingService({old: service, new: service})}>{service}</span>
                    <button 
                      onClick={() => handleDeleteService(selectedCategory, service)}
                      className="text-gray-400 hover:text-red-500 ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {localCategories.find((c: any) => c.id === selectedCategory)?.services.length === 0 && (
              <p className="text-sm text-gray-500 w-full text-center py-2">Нет добавленных услуг</p>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-3">Двойной клик по названию для редактирования</p>
        </div>
      )}
    </div>
  );
}
