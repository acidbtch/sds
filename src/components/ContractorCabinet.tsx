import React, { useState, useEffect, useCallback } from 'react';
import { ViewState, Order } from '../types';
import { ChevronLeft, CheckCircle, AlertCircle, Edit3, Upload, X, ChevronDown, Clock, Loader2 } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import RegionSelector from './RegionSelector';
import { ScheduleSelector, defaultSchedule, formatSchedule } from './ScheduleSelector';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { executorApi, dictsApi } from '../lib/api';
import { uploadMediaFile } from '../lib/media';
import { mapOrderFromApi } from '../lib/orderMapping';

// --- Helpers ---

const normalizeTier = (tier: string | null | undefined): 'partner' | 'pro' | 'leader' => {
  if (!tier) return 'partner';
  const t = tier.toUpperCase();
  if (t === 'LEADER') return 'leader';
  if (t === 'PROFI' || t === 'PRO') return 'pro';
  return 'partner';
};

const tierLabel = (tier: 'partner' | 'pro' | 'leader'): string => {
  switch (tier) {
    case 'leader': return 'Лидер';
    case 'pro': return 'Pro';
    case 'partner': return 'Партнёр';
  }
};

const tierBadgeClass = (tier: 'partner' | 'pro' | 'leader'): string => {
  switch (tier) {
    case 'leader': return 'bg-orange-100 text-orange-600';
    case 'pro': return 'bg-purple-100 text-purple-600';
    case 'partner': return 'bg-blue-100 text-blue-600';
  }
};

// --- Profile form types ---

interface ProfileFormData {
  legalStatus: string;
  name: string;
  unp: string;
  shortName: string;
  description: string;
  services: string[];
  regions: string[];
  address: string;
  schedule: any;
  phone: string;
  instagram: string;
  tiktok: string;
  website: string;
  profileType: 'partner' | 'pro' | 'leader';
  bannerText: string;
  logo: string;
  logoKey: string;
}

const defaultFormData: ProfileFormData = {
  legalStatus: '',
  name: '',
  unp: '',
  shortName: '',
  description: '',
  services: [],
  regions: [],
  address: '',
  schedule: defaultSchedule,
  phone: '',
  instagram: '',
  tiktok: '',
  website: '',
  profileType: 'partner',
  bannerText: '',
  logo: '',
  logoKey: '',
};

const mapProfileToForm = (p: any): ProfileFormData => ({
  legalStatus: p.legal_status || '',
  name: p.name || '',
  unp: p.unp || '',
  shortName: p.short_name || '',
  description: p.description || '',
  services: Array.isArray(p.services) ? p.services.map((s: any) => s.name || s) : [],
  regions: Array.isArray(p.regions) ? p.regions.map((r: any) => r.name || r) : [],
  address: p.address || '',
  schedule: p.schedule || defaultSchedule,
  phone: p.phone || '',
  instagram: p.instagram || '',
  tiktok: p.tiktok || '',
  website: p.website || '',
  profileType: normalizeTier(p.tier),
  bannerText: p.banner_text || '',
  logo: p.logo_url || '',
  logoKey: p.logo_key || '',
});

const mapFormToApi = (f: ProfileFormData, serviceIds: string[], regionIds: string[]) => ({
  legal_status: f.legalStatus,
  name: f.name,
  unp: f.unp,
  short_name: f.shortName,
  description: f.description,
  service_ids: serviceIds,
  region_ids: regionIds,
  address: f.address,
  schedule: f.schedule,
  phone: f.phone,
  instagram: f.instagram,
  tiktok: f.tiktok,
  website: f.website,
  tier: f.profileType.toUpperCase(),
  banner_text: f.bannerText,
  logo_key: f.logoKey,
});

// --- Component ---

interface Props {
  onNavigate: (view: ViewState) => void;
}

export default function ContractorCabinet({ onNavigate }: Props) {
  const { serviceCategories } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'profile'>('incoming');

  // Profile
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Orders
  const [feedOrders, setFeedOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [activeLoading, setActiveLoading] = useState(false);
  const [respondedOrderIds, setRespondedOrderIds] = useState<Set<string>>(new Set());

  // Action loading per order
  const [actionLoadingOrderId, setActionLoadingOrderId] = useState<string | null>(null);

  // Profile edit
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<ProfileFormData>(defaultFormData);
  const [profileSaving, setProfileSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // UI
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Derived
  const profileTier = profile ? normalizeTier(profile.tier) : 'partner';

  // --- Load profile on mount ---
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await executorApi.getProfile();
        setProfile(data);
        setEditForm(mapProfileToForm(data));
        setLogoPreview(data.logo_url || '');
      } catch (error: any) {
        if (error?.status === 404) {
          onNavigate('contractor_register');
          return;
        }
        console.error('Failed to load executor profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  // --- Load orders when switching tabs ---
  const loadFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const data = await executorApi.getFeed();
      setFeedOrders((data || []).map(mapOrderFromApi));
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  const loadActiveOrders = useCallback(async () => {
    setActiveLoading(true);
    try {
      const data = await executorApi.getActiveOrders();
      setActiveOrders((data || []).map(mapOrderFromApi));
    } catch (error) {
      console.error('Failed to load active orders:', error);
    } finally {
      setActiveLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profileLoading) return;
    if (activeTab === 'incoming') {
      loadFeed();
    } else if (activeTab === 'active') {
      loadActiveOrders();
    }
  }, [activeTab, profileLoading, loadFeed, loadActiveOrders]);

  // --- Order actions ---

  const handleRespond = async (orderId: string) => {
    setActionLoadingOrderId(orderId);
    try {
      await executorApi.respondToOrder(orderId, { comment: 'Готов выполнить' });
      setRespondedOrderIds(prev => {
        const next = new Set(prev);
        next.add(orderId);
        return next;
      });
    } catch (error) {
      console.error('Failed to respond to order:', error);
    } finally {
      setActionLoadingOrderId(null);
    }
  };

  const handleReject = async (orderId: string) => {
    setActionLoadingOrderId(orderId);
    try {
      await executorApi.rejectOrder(orderId);
      setFeedOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (error) {
      console.error('Failed to reject order:', error);
    } finally {
      setActionLoadingOrderId(null);
    }
  };

  const handleComplete = async (orderId: string) => {
    setActionLoadingOrderId(orderId);
    try {
      await executorApi.completeOrder(orderId);
      setActiveOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: 'completed' as const } : o))
      );
      if (profile) {
        setProfile({
          ...profile,
          completed_orders_count: (profile.completed_orders_count || 0) + 1,
        });
      }
    } catch (error) {
      console.error('Failed to complete order:', error);
    } finally {
      setActionLoadingOrderId(null);
    }
  };

  // --- Profile edit helpers ---

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMediaFile(file)
        .then(uploaded => {
          setLogoPreview(uploaded.previewUrl);
          setEditForm({ ...editForm, logo: uploaded.previewUrl, logoKey: uploaded.key });
        })
        .catch(error => {
          console.error('Failed to upload logo:', error);
        })
        .finally(() => {
          e.target.value = '';
        });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    if (input.length < 4) input = '+375';
    let val = input.replace(/[^\d]/g, '');
    if (val.startsWith('375')) val = val.substring(3);
    let formatted = '+375';
    if (val.length > 0) formatted += ' ' + val.substring(0, 2);
    if (val.length > 2) formatted += ' ' + val.substring(2, 5);
    if (val.length > 5) formatted += ' ' + val.substring(5, 7);
    if (val.length > 7) formatted += ' ' + val.substring(7, 9);
    setEditForm({ ...editForm, phone: formatted });
  };

  const isFormValid =
    editForm.legalStatus !== '' &&
    editForm.name.trim() !== '' &&
    editForm.unp.trim() !== '' &&
    editForm.shortName.trim() !== '' &&
    editForm.description.trim() !== '' &&
    (editForm.profileType !== 'leader' || (editForm.bannerText && editForm.bannerText.trim() !== '')) &&
    editForm.services.length > 0 &&
    editForm.regions.length > 0 &&
    editForm.phone.length >= 17;

  const hasChanges = profile
    ? JSON.stringify(editForm) !== JSON.stringify(mapProfileToForm(profile))
    : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setProfileSaving(true);
    try {
      const [allServices, allRegions] = await Promise.all([
        dictsApi.getServices(),
        dictsApi.getRegions(),
      ]);
      const serviceIds = (allServices || [])
        .filter((service: any) => editForm.services.includes(service.name))
        .map((service: any) => service.id);
      const regionIds = (allRegions || [])
        .filter((region: any) => editForm.regions.includes(region.name))
        .map((region: any) => region.id);

      const apiData = mapFormToApi(editForm, serviceIds, regionIds);
      await executorApi.updateProfile(apiData);
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setProfileSaving(false);
    }
  };

  // --- Loading / error screens ---

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500">Загрузка профиля...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ошибка загрузки профиля</h2>
        <p className="text-gray-500 mb-6">Не удалось загрузить данные профиля исполнителя.</p>
        <button
          onClick={() => onNavigate('contractor_menu')}
          className="w-full max-w-xs bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform"
        >
          Вернуться назад
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white p-6 text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Данные отправлены на модерацию</h2>
        <p className="text-gray-500 mb-6">После проверки администратором они будут обновлены в вашем профиле.</p>
        <button
          onClick={() => {
            setSubmitted(false);
            setIsEditingProfile(false);
          }}
          className="w-full bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform"
        >
          Вернуться в профиль
        </button>
      </div>
    );
  }

  // --- Main render ---

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-white p-4 flex items-center justify-center shadow-md sticky top-0 z-10 relative">
        <button
          onClick={() => onNavigate('contractor_menu')}
          className="absolute left-4 p-2 -ml-2 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Мой автосервис</h1>
      </div>

      {/* Profile Header */}
      <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900">{profile.short_name || profile.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${tierBadgeClass(profileTier)}`}>
              {tierLabel(profileTier)}
            </span>
            {profile.moderation_status === 'APPROVED' ? (
              <span className="flex items-center text-xs text-green-600 font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Активно
              </span>
            ) : profile.moderation_status === 'PENDING' ? (
              <span className="flex items-center text-xs text-yellow-600 font-medium">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                На модерации
              </span>
            ) : (
              <span className="flex items-center text-xs text-red-600 font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                Отклонено
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{profile.completed_orders_count || 0}</div>
          <div className="text-xs text-gray-500">выполнено</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200">
        <button
          className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${activeTab === 'incoming' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('incoming')}
        >
          Новые ({feedOrders.length})
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${activeTab === 'active' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('active')}
        >
          В работе ({activeOrders.filter(o => o.status === 'active').length})
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${activeTab === 'profile' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('profile')}
        >
          Профиль
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto pb-24">
        {activeTab === 'incoming' && (
          <div className="flex flex-col gap-4">
            {feedLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <span className="text-gray-500 text-sm">Загрузка заказов...</span>
              </div>
            ) : feedOrders.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">Нет новых заказов</div>
            ) : (
              feedOrders.map(order => {
                const hasResponded = respondedOrderIds.has(order.id);
                const isActionLoading = actionLoadingOrderId === order.id;
                return (
                <div key={order.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden relative flex flex-col">
                  <div className="p-4 relative flex-1">
                    {hasResponded && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                        <div className="bg-white/90 px-6 py-4 rounded-2xl shadow-lg border border-gray-200 flex flex-col items-center gap-2 backdrop-blur-md">
                          <Clock className="w-8 h-8 text-blue-500" />
                          <span className="font-bold text-sm text-gray-800 text-center leading-tight">На рассмотрении<br/>у заказчика</span>
                        </div>
                      </div>
                    )}
                    <div className={hasResponded ? 'opacity-40 blur-[1px] transition-all' : ''}>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-400 bg-[#E8EDF2] px-2 py-1 rounded-md">
                          № {order.id} от {order.date}
                        </span>
                        <span className="flex shrink-0 items-center justify-center gap-1 whitespace-nowrap text-xs font-bold leading-none text-blue-500 bg-blue-50 px-2 py-1 rounded-md min-h-[30px]">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          Новый
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{order.serviceType}</h3>
                      <p className="text-sm font-medium text-gray-800 mb-3">{order.carMake} {order.carModel} {order.year && `(${order.year})`}</p>

                      <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {order.customerName && <div className="col-span-2"><span className="text-gray-500">Заказчик:</span> <span className="font-medium text-gray-900">{order.customerName}</span></div>}
                          {order.deadline && <div className="col-span-2"><span className="text-gray-500">Выполнить до:</span> <span className="font-medium text-gray-900">{order.deadline}</span></div>}
                          {order.engine && <div><span className="text-gray-500">Двигатель:</span> <span className="font-medium text-gray-900">{order.engine}</span></div>}
                          {order.gearbox && <div><span className="text-gray-500">КПП:</span> <span className="font-medium text-gray-900">{order.gearbox}</span></div>}
                          {order.drive && <div><span className="text-gray-500">Привод:</span> <span className="font-medium text-gray-900">{order.drive}</span></div>}
                          {order.body && <div><span className="text-gray-500">Кузов:</span> <span className="font-medium text-gray-900">{order.body}</span></div>}
                          {order.vin && <div className="col-span-2"><span className="text-gray-500">VIN:</span> <span className="font-medium text-gray-900 uppercase">{order.vin}</span></div>}
                          {order.region && <div className="col-span-2"><span className="text-gray-500">Регион:</span> <span className="font-medium text-gray-900">{order.region}</span></div>}
                          {order.phone && <div className="col-span-2"><span className="text-gray-500">Телефон:</span> <span className="font-medium text-gray-900">{order.phone}</span></div>}
                        </div>
                        {order.media && order.media.length > 0 && (
                          <div className="pt-2 border-t border-gray-200">
                            <span className="text-xs text-gray-500 block mb-2">Прикрепленные медиафайлы:</span>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {order.media.map((file, idx) => (
                                <img
                                  key={idx}
                                  src={file}
                                  alt={`Фото ${idx + 1}`}
                                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0 cursor-pointer border border-gray-200 hover:opacity-80 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(file);
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-xs text-gray-500 block mb-1">Описание:</span>
                          <p className="text-sm text-gray-800">"{order.description}"</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 relative z-20 bg-white">
                    <div className="flex gap-2">
                      {!hasResponded && (
                        <button
                          onClick={() => handleRespond(order.id)}
                          disabled={isActionLoading}
                          className="flex-1 bg-blue-500 text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Готов выполнить
                        </button>
                      )}
                      <button
                        onClick={() => handleReject(order.id)}
                        disabled={isActionLoading}
                        className="flex-1 bg-[#E8EDF2] text-[#0F2846] text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isActionLoading && !hasResponded ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Отказаться
                      </button>
                    </div>
                  </div>
                </div>
              )})
            )}
          </div>
        )}

        {activeTab === 'active' && (
          <div className="flex flex-col gap-4">
            {activeLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <span className="text-gray-500 text-sm">Загрузка заказов...</span>
              </div>
            ) : activeOrders.filter(o => o.status === 'active').length === 0 ? (
              <div className="text-center text-gray-500 mt-10">Нет активных заказов</div>
            ) : (
              activeOrders.filter(o => o.status === 'active').map(order => {
                const isActionLoading = actionLoadingOrderId === order.id;
                return (
                <div key={order.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-400 bg-[#E8EDF2] px-2 py-1 rounded-md">
                        № {order.id} от {order.date}
                      </span>
                      <span className="flex shrink-0 items-center justify-center whitespace-nowrap text-xs font-bold leading-none text-green-500 bg-green-50 px-2 py-1 rounded-md min-h-[30px]">
                        В работе
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{order.serviceType}</h3>
                    <p className="text-sm font-medium text-gray-800 mb-3">{order.carMake} {order.carModel} {order.year && `(${order.year})`}</p>

                    <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {order.customerName && <div className="col-span-2"><span className="text-gray-500">Заказчик:</span> <span className="font-medium text-gray-900">{order.customerName}</span></div>}
                        {order.deadline && <div className="col-span-2"><span className="text-gray-500">Выполнить до:</span> <span className="font-medium text-gray-900">{order.deadline}</span></div>}
                        {order.engine && <div><span className="text-gray-500">Двигатель:</span> <span className="font-medium text-gray-900">{order.engine}</span></div>}
                        {order.gearbox && <div><span className="text-gray-500">КПП:</span> <span className="font-medium text-gray-900">{order.gearbox}</span></div>}
                        {order.drive && <div><span className="text-gray-500">Привод:</span> <span className="font-medium text-gray-900">{order.drive}</span></div>}
                        {order.body && <div><span className="text-gray-500">Кузов:</span> <span className="font-medium text-gray-900">{order.body}</span></div>}
                        {order.vin && <div className="col-span-2"><span className="text-gray-500">VIN:</span> <span className="font-medium text-gray-900 uppercase">{order.vin}</span></div>}
                        {order.region && <div className="col-span-2"><span className="text-gray-500">Регион:</span> <span className="font-medium text-gray-900">{order.region}</span></div>}
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-500 block mb-1">Описание:</span>
                        <p className="text-sm text-gray-800">"{order.description}"</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-xl mb-4 border border-blue-100">
                      <p className="text-xs text-blue-800 font-medium mb-1">Контакты заказчика:</p>
                      <p className="text-sm font-bold text-blue-900">{order.customerName}</p>
                      <p className="text-sm font-bold text-blue-900">{order.phone}</p>
                    </div>

                    <button
                      onClick={() => handleComplete(order.id)}
                      disabled={isActionLoading}
                      className="w-full bg-green-500 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center active:scale-[0.98] transition-transform disabled:opacity-50"
                    >
                      {isActionLoading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5 mr-2" />
                      )}
                      Отметить как выполненный
                    </button>
                  </div>
                </div>
              )})
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="flex flex-col gap-4">
            {/* Moderation status banner */}
            {profile.moderation_status === 'PENDING' && (
              <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-yellow-800">Профиль на модерации</p>
                  <p className="text-xs text-yellow-700">Изменения отправлены и ожидают проверки администратором.</p>
                </div>
              </div>
            )}
            {profile.moderation_status === 'REJECTED' && (
              <div className="bg-red-50 p-4 rounded-2xl border border-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-800">Профиль отклонён</p>
                  <p className="text-xs text-red-700">Внесите изменения и отправьте профиль на повторную модерацию.</p>
                </div>
              </div>
            )}

            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Данные организации</h3>
                {!isEditingProfile ? (
                  <button
                    onClick={() => {
                      setEditForm(mapProfileToForm(profile));
                      setIsEditingProfile(true);
                    }}
                    className="text-blue-500 p-2 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      setShowErrors(false);
                    }}
                    className="text-gray-500 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Статус юридического лица <span className="text-red-500">*</span></label>
                    <CustomSelect
                      value={editForm.legalStatus}
                      onChange={(val) => setEditForm({...editForm, legalStatus: val})}
                      options={[
                        { value: 'ИП', label: 'ИП' },
                        { value: 'ООО', label: 'ООО' },
                        { value: 'ЧУП', label: 'ЧУП' },
                        { value: 'ОАО', label: 'ОАО' },
                      ]}
                      placeholder="Выберите статус"
                      theme="blue"
                      error={showErrors && !editForm.legalStatus}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Полное юридическое наименование <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className={`w-full rounded-lg p-2 text-sm outline-none transition-colors ${showErrors && !editForm.name.trim() ? 'border-2 border-red-500' : 'border border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">УНП <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={editForm.unp}
                      onChange={e => setEditForm({...editForm, unp: e.target.value})}
                      className={`w-full rounded-lg p-2 text-sm outline-none transition-colors ${showErrors && !editForm.unp.trim() ? 'border-2 border-red-500' : 'border border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Краткое название (для приложения) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={editForm.shortName}
                      onChange={e => setEditForm({...editForm, shortName: e.target.value})}
                      className={`w-full rounded-lg p-2 text-sm outline-none transition-colors ${showErrors && !editForm.shortName.trim() ? 'border-2 border-red-500' : 'border border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Описание вашей деятельности <span className="text-red-500">*</span></label>
                    <textarea
                      rows={3}
                      value={editForm.description}
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                      className={`w-full rounded-lg p-2 text-sm outline-none transition-colors ${showErrors && !editForm.description.trim() ? 'border-2 border-red-500' : 'border border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Виды оказываемых услуг <span className="text-red-500">*</span></label>
                    <div className={`space-y-3 max-h-80 overflow-y-auto pr-2 rounded-lg p-2 relative transition-colors ${showErrors && editForm.services.length === 0 ? 'border-2 border-red-500' : 'border border-gray-200'}`}>
                      {serviceCategories.map(category => {
                        const allSelected = category.services.length > 0 && category.services.every(s => editForm.services.includes(s));
                        const someSelected = category.services.some(s => editForm.services.includes(s)) && !allSelected;
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
                                      const newServices = new Set([...editForm.services, ...category.services]);
                                      setEditForm({...editForm, services: Array.from(newServices)});
                                    } else {
                                      const newServices = editForm.services.filter((s: string) => !category.services.includes(s));
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
                                      checked={editForm.services.includes(type)}
                                      onChange={() => {
                                        if (editForm.services.includes(type)) {
                                          setEditForm({...editForm, services: editForm.services.filter((s: string) => s !== type)});
                                        } else {
                                          setEditForm({...editForm, services: [...editForm.services, type]});
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
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsRegionModalOpen(true)}
                        className={`w-full rounded-lg p-2 text-sm bg-gray-50 text-left text-gray-700 outline-none transition-colors ${showErrors && editForm.regions.length === 0 ? 'border-2 border-red-500' : 'border border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      >
                        {editForm.regions.length > 0 ? editForm.regions.join(', ') : 'Выберите регион'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Адрес оказания услуги</label>
                    <input
                      type="text"
                      value={editForm.address || ''}
                      onChange={e => setEditForm({...editForm, address: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Режим работы</label>
                    <ScheduleSelector
                      value={editForm.schedule || defaultSchedule}
                      onChange={val => setEditForm({...editForm, schedule: val})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Контактный телефон (Telegram) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={handlePhoneChange}
                      className={`w-full rounded-lg p-2 text-sm outline-none transition-colors ${showErrors && editForm.phone.length < 17 ? 'border-2 border-red-500' : 'border border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                  </div>
                  {(editForm.profileType === 'pro' || editForm.profileType === 'leader') && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Ссылка на Instagram</label>
                        <input
                          type="url"
                          value={editForm.instagram}
                          onChange={e => setEditForm({...editForm, instagram: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Ссылка на TikTok</label>
                        <input
                          type="url"
                          value={editForm.tiktok || ''}
                          onChange={e => setEditForm({...editForm, tiktok: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Ссылка на сайт</label>
                        <input
                          type="url"
                          value={editForm.website}
                          onChange={e => setEditForm({...editForm, website: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </>
                  )}
                  <div className="pt-2">
                    <label className="block text-xs text-gray-500 mb-2">Медиафайлы</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" className="border border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-colors">
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[10px] text-center">Документы юр. лица</span>
                      </button>
                      {(editForm.profileType === 'pro' || editForm.profileType === 'leader') && (
                        <label className="border border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer relative overflow-hidden">
                                {(logoPreview || editForm.logo) ? (
                                  <img src={logoPreview || editForm.logo} alt="Логотип" className="absolute inset-0 w-full h-full object-contain p-1" />
                                ) : (
                            <>
                              <Upload className="w-5 h-5 mb-1" />
                              <span className="text-[10px] text-center">Логотип</span>
                            </>
                          )}
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                      )}
                      <button type="button" className="border border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-colors">
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[10px] text-center">Фото работ</span>
                      </button>
                    </div>
                  </div>

                  {editForm.profileType === 'leader' && (
                    <div className="pt-2">
                      <label className="block text-xs text-gray-500 mb-1">Текст для рекламного баннера <span className="text-red-500">*</span></label>
                      <textarea
                        rows={2}
                        value={editForm.bannerText || ''}
                        onChange={e => setEditForm({...editForm, bannerText: e.target.value})}
                        className={`w-full rounded-lg p-2 text-sm outline-none transition-colors ${showErrors && !editForm.bannerText?.trim() ? 'border-2 border-red-500' : 'border border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                        placeholder="Краткий рекламный текст для показа на баннере"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 bg-[#E8EDF2] text-[#0F2846] py-3 rounded-xl text-sm font-bold hover:bg-[#D8DFE8] transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={!isFormValid || !hasChanges || profileSaving}
                      className="flex-[2] bg-blue-500 text-white font-bold py-3 rounded-xl text-sm shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                      {profileSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Отправить на модерацию
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">Юридическое наименование</span>
                    <span className="font-medium text-gray-900">{profile.legal_status || ''} "{(profile.name || '').replace(/ООО |ИП |ЧУП |ОАО |"/g, '')}"</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">УНП</span>
                    <span className="font-medium text-gray-900">{profile.unp}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Краткое название</span>
                    <span className="font-medium text-gray-900">{profile.short_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Описание</span>
                    <span className="font-medium text-gray-900">{profile.description}</span>
                  </div>
                  {profileTier === 'leader' && profile.banner_text && (
                    <div>
                      <span className="text-gray-500 block text-xs">Текст рекламного баннера</span>
                      <span className="font-medium text-gray-900">{profile.banner_text}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 block text-xs">Услуги</span>
                    <span className="font-medium text-gray-900">{(Array.isArray(profile.services) ? profile.services : []).join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Регион</span>
                    <span className="font-medium text-gray-900">{(Array.isArray(profile.regions) ? profile.regions : []).join(', ')}</span>
                  </div>
                  {profile.address && (
                    <div>
                      <span className="text-gray-500 block text-xs">Адрес</span>
                      <span className="font-medium text-gray-900">{profile.address}</span>
                    </div>
                  )}
                  {profile.schedule && (
                    <div>
                      <span className="text-gray-500 block text-xs">Режим работы</span>
                      <span className="font-medium text-gray-900">{formatSchedule(profile.schedule)}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 block text-xs">Телефон</span>
                    <span className="font-medium text-gray-900">{profile.phone}</span>
                  </div>
                  {(profileTier === 'pro' || profileTier === 'leader') && (
                    <>
                      {profile.instagram && (
                        <div>
                          <span className="text-gray-500 block text-xs">Instagram</span>
                          <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-500 underline">{profile.instagram}</a>
                        </div>
                      )}
                      {profile.tiktok && (
                        <div>
                          <span className="text-gray-500 block text-xs">TikTok</span>
                          <a href={profile.tiktok} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-500 underline">{profile.tiktok}</a>
                        </div>
                      )}
                      {profile.website && (
                        <div>
                          <span className="text-gray-500 block text-xs">Сайт</span>
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-500 underline">{profile.website}</a>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
              <h3 className="font-bold text-orange-800 mb-2">Профиль "{tierLabel(profileTier)}"</h3>
              <p className="text-sm text-orange-700 mb-3">
                Оплачена до {profile.subscription_until ? new Date(profile.subscription_until).toLocaleDateString('ru-RU') : '—'}
              </p>
              <button className="w-full bg-orange-500 text-white text-sm font-bold py-2 rounded-xl active:scale-[0.98] transition-transform">
                Продлить подписку
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mt-4">
              <h3 className="font-bold text-gray-900 mb-2">Хочу изменить профиль исполнителя</h3>
              <button
                onClick={() => onNavigate('contractor_register')}
                className="w-full bg-white border border-gray-300 text-gray-700 text-sm font-bold py-2 rounded-xl active:scale-[0.98] transition-transform"
              >
                Изменить профиль
              </button>
            </div>
          </div>
        )}
      </div>

      <RegionSelector
        isOpen={isRegionModalOpen}
        onClose={() => setIsRegionModalOpen(false)}
        selectedRegions={editForm.regions}
        onSelect={(regions) => setEditForm({ ...editForm, regions })}
        multiSelect={true}
      />

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 max-w-md mx-auto w-full"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 p-2 bg-black/50 rounded-full transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Bottom Back Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20 max-w-md mx-auto w-full">
        <button
          onClick={() => onNavigate('contractor_menu')}
          className="w-full flex items-center justify-center gap-2 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] font-bold py-4 rounded-xl active:scale-[0.98] transition-all"
        >
          <ChevronLeft className="w-5 h-5" /> Назад
        </button>
      </div>
    </div>
  );
}
