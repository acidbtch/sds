import React, { useState, useEffect } from 'react';
import { ViewState, Order, Contractor } from '../types';
import { ChevronLeft, ChevronRight, Star, AlertCircle, CheckCircle, XCircle, ChevronDown, X, Clock, MapPin, Award, Briefcase, Globe, Instagram, Video, CreditCard, Loader2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { customerApi, paymentsApi } from '../lib/api';

const REVIEW_CRITERIA = [
  'Быстрый отклик',
  'Оперативное начало оказания услуги',
  'Вежливость',
  'Понятное объяснение выполняемых работ',
  'Согласование работ и стоимости',
  'Расчет цены по фото',
  'Можно посмотреть на ремонт/сервис',
  'Присылают фото/видео отчет о ходе и результатах',
  'Удобное место ожидания',
  'Используют защитные накидки на сиденье и руль',
  'Сами подбирают запчасти по разумной цене',
  'Полное оформление документов до/после оказания услуги',
  'Дают гарантию на выполненные работы'
];

const normalizeTier = (tier: string | null | undefined): 'partner' | 'pro' | 'leader' => {
  if (!tier) return 'partner';
  const t = tier.toUpperCase();
  if (t === 'LEADER') return 'leader';
  if (t === 'PROFI' || t === 'PRO') return 'pro';
  return 'partner';
};

interface Props {
  onNavigate: (view: ViewState) => void;
  hasCatalogAccess: boolean;
  setHasCatalogAccess: (access: boolean) => void;
}

export default function CustomerOrders({ onNavigate, hasCatalogAccess, setHasCatalogAccess }: Props) {
  const { orders, setOrders, contractors, banners } = useData();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [showCatalogPayment, setShowCatalogPayment] = useState(false);
  const [reviews, setReviews] = useState<Record<string, { rating: number, criteria: string[], text: string }>>({});
  const [isCriteriaOpen, setIsCriteriaOpen] = useState<Record<string, boolean>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const fetchedOrders = await customerApi.getOrders();
        if (fetchedOrders) {
          // Map API orders to our Order interface
          const mappedOrders = fetchedOrders.map((o: any) => ({
            id: o.id,
            serviceType: o.service_name || o.service_id || 'Услуга',
            carMake: o.car_brand_name || o.car_brand_id || '',
            carModel: o.car_model_name || o.car_model_id || '',
            year: o.year?.toString() || '',
            region: o.region_name || o.region_id || '',
            customerName: o.owner_name || '',
            date: new Date(o.created_at).toLocaleDateString('ru-RU'),
            deadline: o.deadline ? new Date(o.deadline).toLocaleDateString('ru-RU') : '',
            status: (o.status === 'SEARCHING' ? 'pending' : o.status === 'MATCHED' ? 'active' : o.status === 'COMPLETED' ? 'completed' : 'cancelled') as 'pending' | 'active' | 'completed' | 'cancelled',
            description: o.description || '',
            responses: [],
            engine: o.engine_type,
            gearbox: o.gearbox_type,
            drive: o.drive_type,
            body: o.body_type,
            phone: o.owner_phone,
            media: o.photos || []
          }));
          setOrders(mappedOrders);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [setOrders]);

  const activeBanners = banners.filter(b => b.status === 'active');

  React.useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % activeBanners.length);
    }, 60000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const currentBanner = activeBanners[currentBannerIndex];

  const handleCatalogClick = () => {
    if (hasCatalogAccess) {
      onNavigate('contractors_catalog');
    } else {
      setShowCatalogPayment(true);
    }
  };

  const handlePayment = async () => {
    try {
      const { payment_url } = await paymentsApi.checkout(5, 'CUSTOMER_ACCESS');
      window.open(payment_url, '_blank');
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Ошибка при оплате');
    }
  };

  const handleAcceptResponse = async (orderId: string, responseId: string) => {
    try {
      await customerApi.acceptResponse(orderId, responseId);
      setOrders(orders.map(o => {
        if (o.id === orderId) {
          const acceptedResponse = (o.responses || []).find(r => r.id === responseId);
          return {
            ...o,
            status: 'active',
            acceptedContractorId: acceptedResponse?.contractorId
          };
        }
        return o;
      }));
    } catch (error) {
      console.error('Failed to accept response:', error);
      alert('Ошибка при принятии отклика');
    }
  };

  const handleRejectResponse = async (orderId: string, responseId: string) => {
    try {
      await customerApi.rejectResponse(orderId, responseId);
      setOrders(orders.map(o => {
        if (o.id === orderId) {
          const rejectedResponse = (o.responses || []).find(r => r.id === responseId);
          const rejectedContractorId = rejectedResponse?.contractorId;
          if (o.status === 'active' && o.acceptedContractorId === rejectedContractorId) {
            return {
              ...o,
              status: 'pending',
              acceptedContractorId: undefined,
              responses: (o.responses || []).filter(r => r.id !== responseId)
            };
          }
          return {
            ...o,
            responses: (o.responses || []).filter(r => r.id !== responseId)
          };
        }
        return o;
      }));
    } catch (error) {
      console.error('Failed to reject response:', error);
      alert('Ошибка при отклонении отклика');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await customerApi.cancelOrder(orderId);
      setOrders(orders.map(o => {
        if (o.id === orderId) {
          return { ...o, status: 'cancelled' };
        }
        return o;
      }));
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Ошибка при отмене заказа');
    }
  };

  const getProfileBadge = (type: string) => {
    switch (type) {
      case 'leader':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><Award className="w-3 h-3" /> Лидер</span>;
      case 'pro':
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Профи</span>;
      case 'partner':
        return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><Briefcase className="w-3 h-3" /> Партнер</span>;
      default:
        return null;
    }
  };

  const handleRating = (orderId: string, rating: number) => {
    setReviews(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], rating, criteria: prev[orderId]?.criteria || [], text: prev[orderId]?.text || '' }
    }));
  };

  const toggleCriteria = (orderId: string, criterion: string) => {
    setReviews(prev => {
      const current = prev[orderId]?.criteria || [];
      const newCriteria = current.includes(criterion) 
        ? current.filter(c => c !== criterion)
        : [...current, criterion];
      return {
        ...prev,
        [orderId]: { ...prev[orderId], rating: prev[orderId]?.rating || 0, criteria: newCriteria, text: prev[orderId]?.text || '' }
      };
    });
  };

  const handleTextChange = (orderId: string, text: string) => {
    setReviews(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], rating: prev[orderId]?.rating || 0, criteria: prev[orderId]?.criteria || [], text }
    }));
  };

  const toggleOrder = async (id: string) => {
    const isExpanding = !expandedOrders.includes(id);
    setExpandedOrders(prev => 
      isExpanding ? [...prev, id] : prev.filter(orderId => orderId !== id)
    );

    if (isExpanding) {
      const order = orders.find(o => o.id === id);
      if (order && (order.status === 'pending' || order.status === 'active')) {
        try {
          const responses = await customerApi.getOrderResponses(id);
          if (responses) {
            const mappedResponses = responses.map((r: any) => ({
              id: r.id,
              contractorId: r.executor_id,
              contractorName: r.executor_name || 'Исполнитель',
              profileType: normalizeTier(r.executor_tier),
              rating: r.executor_rating || 5.0,
              reviewsCount: r.completed_orders_count || 0,
              workingHours: r.estimated_duration || '',
              message: r.comment || '',
              price: r.price ? `${r.price} BYN` : ''
            }));
            setOrders(prevOrders => prevOrders.map(o => 
              o.id === id ? { ...o, responses: mappedResponses } : o
            ));
          }
        } catch (error) {
          console.error('Failed to fetch responses:', error);
        }
      }
    }
  };

  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'active');
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  const ordersToShow = activeTab === 'active' ? activeOrders : completedOrders;

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      <div className="bg-white p-4 flex items-center justify-center shadow-md sticky top-0 z-10 relative">
        <button 
          onClick={() => onNavigate('customer_menu')}
          className="absolute left-4 p-2 -ml-2 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Мои заказы</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200">
        <button 
          className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${activeTab === 'active' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('active')}
        >
          Действующие ({activeOrders.length})
        </button>
        <button 
          className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${activeTab === 'completed' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('completed')}
        >
          Архив ({completedOrders.length})
        </button>
      </div>

      {/* Leader Ads Banner */}
      {currentBanner && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-md p-3 shadow-lg border-l-4 border-orange-500 flex items-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-md uppercase tracking-wider">
              Лидер
            </div>
            <div className="w-12 h-12 bg-[#E8EDF2] rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
              {currentBanner.logo ? (
                <img src={currentBanner.logo} alt={currentBanner.contractor} className="w-full h-full object-cover" />
              ) : (
                <Star className="w-6 h-6 text-orange-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <h3 className="font-bold text-gray-900 text-sm">{currentBanner.contractor}</h3>
                <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{currentBanner.description || 'Рекламный блок исполнителя'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 flex-1 overflow-y-auto pb-24">
        {ordersToShow.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <p>Нет заказов в этой категории</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {ordersToShow.map(order => (
              <div key={order.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <div 
                  className="p-4 cursor-pointer active:bg-gray-50 transition-colors"
                  onClick={() => toggleOrder(order.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-gray-400 bg-[#E8EDF2] px-2 py-1 rounded-md">
                      № {order.id} от {order.date}
                    </span>
                    {order.status === 'pending' && (
                      <span className="flex items-center text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {(order.responses || []).length} отклик(ов)
                      </span>
                    )}
                    {order.status === 'active' && (
                      <span className="flex items-center text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md">
                        <Clock className="w-3 h-3 mr-1" />
                        В работе
                      </span>
                    )}
                    {order.status === 'completed' && (
                      <span className="flex items-center text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-md">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Выполнен
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{order.serviceType}</h3>
                  <p className="text-sm text-gray-600 mb-2">{order.carMake} {order.carModel} {order.year && `(${order.year})`}</p>
                  
                  {expandedOrders.includes(order.id) && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-2 mt-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
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
                            {order.media.map((file: any, idx) => (
                              <div key={idx} className="relative w-16 h-16 flex-shrink-0">
                                {file.type === 'video' ? (
                                  <video 
                                    src={file.url} 
                                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                                    controls
                                  />
                                ) : (
                                  <img 
                                    src={file.url || file} 
                                    alt={`Фото ${idx + 1}`} 
                                    className="w-full h-full object-cover rounded-lg cursor-pointer border border-gray-200 hover:opacity-80 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedImage(file.url || file);
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className={`text-sm text-gray-500 ${!expandedOrders.includes(order.id) && 'line-clamp-2'}`}>{order.description}</p>
                </div>

                {/* Review Prompt for Completed Orders */}
                {expandedOrders.includes(order.id) && order.status === 'completed' && (
                  <div className="bg-gray-50 p-4 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Оцените работу исполнителя</h4>
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          onClick={() => handleRating(order.id, star)}
                          className={`w-8 h-8 cursor-pointer transition-colors ${
                            (reviews[order.id]?.rating || 0) >= star 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-gray-300 hover:text-yellow-400'
                          }`} 
                        />
                      ))}
                    </div>
                    
                    <div className="mb-3 relative">
                      <label className="block text-xs text-gray-500 mb-1">Что вам больше всего понравилось?</label>
                      <button
                        type="button"
                        onClick={() => setIsCriteriaOpen(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                        className="w-full flex items-center justify-between rounded-lg p-3 bg-white border border-gray-300 text-sm text-left outline-none focus:ring-orange-500 focus:border-orange-500"
                      >
                        <span className="truncate text-gray-700">
                          {reviews[order.id]?.criteria?.length 
                            ? `Выбрано: ${reviews[order.id].criteria.length}` 
                            : 'Выберите критерии (необязательно)'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isCriteriaOpen[order.id] ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isCriteriaOpen[order.id] && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {REVIEW_CRITERIA.map(criterion => (
                            <label key={criterion} className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                              <input 
                                type="checkbox" 
                                checked={reviews[order.id]?.criteria?.includes(criterion) || false}
                                onChange={() => toggleCriteria(order.id, criterion)}
                                className="mt-0.5 w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                              />
                              <span className="text-sm text-gray-700 leading-tight">{criterion}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <textarea 
                      rows={2} 
                      placeholder="Напишите отзыв..." 
                      value={reviews[order.id]?.text || ''}
                      onChange={(e) => handleTextChange(order.id, e.target.value)}
                      className="w-full border-gray-300 rounded-lg p-3 bg-white focus:ring-orange-500 focus:border-orange-500 outline-none mb-3 text-sm"
                    ></textarea>
                    <button 
                      onClick={async () => {
                        try {
                          await customerApi.submitReview(order.id, reviews[order.id]);
                          setExpandedOrders(prev => prev.filter(id => id !== order.id));
                          alert('Отзыв успешно отправлен!');
                        } catch (error) {
                          console.error('Failed to submit review:', error);
                          alert('Ошибка при отправке отзыва');
                        }
                      }}
                      disabled={!reviews[order.id]?.rating}
                      className="w-full bg-orange-500 text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100"
                    >
                      Оставить отзыв
                    </button>
                  </div>
                )}

                {/* Responses Section (Expanded) */}
                {expandedOrders.includes(order.id) && (order.status === 'pending' || order.status === 'active') && (
                  <div className="bg-gray-50 p-4 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                      {order.status === 'active' ? 'Выбранный исполнитель:' : 'Отклики исполнителей:'}
                    </h4>
                    <div className="flex flex-col gap-3">
                      {(order.responses || [])
                        .filter(resp => order.status !== 'active' || resp.contractorId === order.acceptedContractorId)
                        .map(resp => (
                        <div key={resp.id} className={`bg-white p-3 rounded-xl border ${resp.profileType === 'leader' ? 'border-orange-300 shadow-md' : 'border-gray-200'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center gap-1">
                                <h5 className="font-bold text-gray-900 text-sm">{resp.contractorName}</h5>
                                {resp.profileType === 'leader' && (
                                  <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                                )}
                              </div>
                              <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1" />
                                <span>{resp.rating} ({resp.reviewsCount} отзывов)</span>
                              </div>
                            </div>
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                const contractor = contractors.find(c => c.id === resp.contractorId);
                                if (contractor) {
                                  setSelectedContractor(contractor);
                                  return;
                                }

                                try {
                                  const data = await customerApi.getExecutors();
                                  const found = (data || []).find((c: any) => c.id === resp.contractorId);
                                  if (found) {
                                    setSelectedContractor({
                                      id: found.id,
                                      name: found.name || '',
                                      shortName: found.short_name || '',
                                      profileType: found.profile_type || 'partner',
                                      rating: found.rating || 5.0,
                                      reviewsCount: found.reviews_count || 0,
                                      completedOrders: found.completed_orders || 0,
                                      registrationDate: found.created_at || new Date().toISOString(),
                                      description: found.description || '',
                                      services: found.services || [],
                                      regions: found.regions || [],
                                      address: found.address || '',
                                      workingHours: found.working_hours || '',
                                      phone: found.phone || '',
                                      instagram: found.instagram || '',
                                      tiktok: found.tiktok || '',
                                      website: found.website || '',
                                      avatar: found.avatar_url || '',
                                      photos: found.photos || [],
                                      video: found.video_url || '',
                                      unp: found.unp || '',
                                      legalStatus: found.legal_status || ''
                                    } as Contractor);
                                  }
                                } catch (error) {
                                  console.error('Failed to load executor details:', error);
                                }
                              }}
                              className="text-xs text-blue-500 font-medium underline"
                            >
                              Подробнее
                            </button>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            {resp.workingHours && (
                              <div className="flex items-center text-base font-bold text-gray-900 mb-1">
                                <Clock className="w-4 h-4 mr-1.5 text-blue-500" />
                                <span>{resp.workingHours}</span>
                              </div>
                            )}
                            {resp.message && (
                              <p className="text-sm text-gray-700 italic">"{resp.message}"</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {order.status === 'pending' && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleAcceptResponse(order.id, resp.id); }}
                                className="flex-1 bg-orange-500 text-white text-sm font-bold py-2 rounded-lg active:scale-[0.98] transition-transform"
                              >
                                Хочу заказать
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleRejectResponse(order.id, resp.id); }}
                              className="flex-1 bg-red-50 text-red-600 border border-red-200 text-sm font-bold py-2 rounded-lg active:bg-red-100 transition-colors"
                            >
                              Отказаться
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {(order.status === 'pending' || order.status === 'active') && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }}
                        className="w-full mt-4 text-red-500 text-sm font-medium py-2 border border-red-200 rounded-lg bg-red-50 active:bg-red-100 transition-colors"
                      >
                        Отменить заказ
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Catalog Button */}
        <div className="mt-8">
          <button 
            onClick={handleCatalogClick}
            className="w-full bg-blue-50 text-blue-600 border border-blue-200 p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="text-left">
              <h3 className="font-bold text-lg">Посмотреть всех исполнителей</h3>
              <p className="text-xs text-blue-500 mt-1">{hasCatalogAccess ? 'Доступ открыт' : 'Доступ к полному каталогу автосервисов'}</p>
            </div>
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showCatalogPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">Доступ к каталогу</h3>
              <button 
                onClick={() => setShowCatalogPayment(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Каталог исполнителей</h4>
              <p className="text-sm text-gray-600 mb-6">
                Получите полный доступ к базе проверенных исполнителей с возможностью фильтрации и прямого контакта.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Стоимость доступа</span>
                  <span className="font-bold text-gray-900">5.00 BYN</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Срок действия</span>
                  <span className="font-medium text-gray-700">Навсегда</span>
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

      {/* Full Profile Modal */}
      {selectedContractor && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col w-full max-w-md mx-auto shadow-2xl overflow-y-auto">
          <div className="p-4 flex items-center justify-between sticky top-0 bg-white z-10">
            <h2 className="text-lg font-bold text-[#0F2846]">Профиль исполнителя</h2>
            <button onClick={() => setSelectedContractor(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-5 space-y-6 pb-32">
            {/* Header Info */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-2xl font-bold text-[#0F2846]">
                  {selectedContractor.shortName || selectedContractor.name.replace(/ООО |ИП |ЧУП |ОАО |"/g, '')}
                </h1>
                {selectedContractor.profileType === 'leader' && (
                  <span className="bg-[#FFF4E5] text-[#D97706] text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    Лидер
                  </span>
                )}
                {selectedContractor.profileType === 'pro' && (
                  <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    PRO
                  </span>
                )}
              </div>
              <div className="text-[13px] text-gray-500">
                {selectedContractor.legalStatus || 'ООО'} "{selectedContractor.name.replace(/ООО |ИП |ЧУП |ОАО |"/g, '')}"
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FFF9F0] rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1.5 text-[#D97706] font-bold text-lg mb-0.5">
                  <Star className="w-5 h-5 fill-current" />
                  {selectedContractor.rating || '4.8'}
                </div>
                <div className="text-[11px] text-[#D97706]">
                  {selectedContractor.reviews || '210'} отзывов
                </div>
              </div>
              <div className="bg-[#F0FDF4] rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1.5 text-[#16A34A] font-bold text-lg mb-0.5">
                  <CheckCircle className="w-5 h-5" />
                  {selectedContractor.completedOrders || '890'}
                </div>
                <div className="text-[11px] text-[#16A34A]">
                  выполнено заказов
                </div>
              </div>
            </div>

            {/* О себе */}
            {selectedContractor.description && (
              <div>
                <h3 className="text-[15px] font-bold text-[#0F2846] mb-3">О себе</h3>
                <div className="text-[14px] text-[#0F2846] leading-relaxed">
                  {selectedContractor.description}
                </div>
              </div>
            )}

            {/* Контакты и адрес */}
            <div>
              <h3 className="text-[15px] font-bold text-[#0F2846] mb-3">Контакты и адрес</h3>
              <div className="bg-[#F8FAFC] rounded-2xl p-4 space-y-4">
                {selectedContractor.address && (
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[14px] font-semibold text-[#0F2846] mb-0.5">{selectedContractor.address}</div>
                      {selectedContractor.regions && selectedContractor.regions.length > 0 && (
                        <div className="text-[12px] text-gray-500">Регионы выезда: {selectedContractor.regions.join(', ')}</div>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedContractor.workingHours && (
                  <div className="flex gap-3 items-center">
                    <Clock className="w-5 h-5 text-gray-400 shrink-0" />
                    <div className="text-[14px] font-semibold text-[#0F2846]">{selectedContractor.workingHours}</div>
                  </div>
                )}

                {selectedContractor.phone && (
                  <>
                    {(selectedContractor.address || selectedContractor.workingHours) && (
                      <div className="h-px bg-gray-200 w-full"></div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[14px] font-semibold text-[#0F2846] mb-0.5">{selectedContractor.phone}</div>
                        <div className="text-[12px] text-gray-500">Телефон</div>
                      </div>
                      <a href={`tel:${selectedContractor.phone.replace(/[^0-9+]/g, '')}`} className="bg-[#DCFCE7] text-[#16A34A] font-bold text-[13px] px-4 py-2 rounded-xl hover:bg-[#BBF7D0] transition-colors">
                        Позвонить
                      </a>
                    </div>
                  </>
                )}

                {(selectedContractor.address || selectedContractor.workingHours || selectedContractor.phone) && (
                  <div className="h-px bg-gray-200 w-full"></div>
                )}
                <div>
                  <div className="text-[14px] font-semibold text-[#0F2846] mb-0.5">5 августа 2022 г.</div>
                  <div className="text-[12px] text-gray-500">На сервисе с</div>
                </div>
              </div>
            </div>

            {/* Оказываемые услуги */}
            {selectedContractor.services && selectedContractor.services.length > 0 && (
              <div>
                <h3 className="text-[15px] font-bold text-[#0F2846] mb-3">Оказываемые услуги</h3>
                <div className="space-y-2">
                  {selectedContractor.services.map((service, idx) => (
                    <div key={idx} className="bg-[#F8FAFC] rounded-xl p-3.5 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
                      <div className="text-[14px] text-[#0F2846]">{service}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links if Pro/Leader */}
            {(selectedContractor.profileType === 'pro' || selectedContractor.profileType === 'leader') && 
             (selectedContractor.instagram || selectedContractor.tiktok || selectedContractor.website) && (
              <div>
                <h3 className="text-[15px] font-bold text-[#0F2846] mb-3">Ссылки</h3>
                <div className="bg-[#F8FAFC] rounded-2xl p-4 space-y-4">
                  {selectedContractor.instagram && (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[14px] font-semibold text-[#0F2846] mb-0.5">Instagram</div>
                        <a href={selectedContractor.instagram} target="_blank" rel="noopener noreferrer" className="text-[12px] text-blue-500 hover:underline">
                          {selectedContractor.instagram}
                        </a>
                      </div>
                    </div>
                  )}
                  {selectedContractor.tiktok && (
                    <>
                      {selectedContractor.instagram && <div className="h-px bg-gray-200 w-full"></div>}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[14px] font-semibold text-[#0F2846] mb-0.5">TikTok</div>
                          <a href={selectedContractor.tiktok} target="_blank" rel="noopener noreferrer" className="text-[12px] text-blue-500 hover:underline">
                            {selectedContractor.tiktok}
                          </a>
                        </div>
                      </div>
                    </>
                  )}
                  {selectedContractor.website && (
                    <>
                      {(selectedContractor.instagram || selectedContractor.tiktok) && <div className="h-px bg-gray-200 w-full"></div>}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[14px] font-semibold text-[#0F2846] mb-0.5">Сайт</div>
                          <a href={selectedContractor.website} target="_blank" rel="noopener noreferrer" className="text-[12px] text-blue-500 hover:underline">
                            {selectedContractor.website}
                          </a>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Фото работ */}
            {selectedContractor.photos && selectedContractor.photos.length > 0 && (
              <div>
                <h3 className="text-[15px] font-bold text-[#0F2846] mb-3">Фото работ</h3>
                <div className="grid grid-cols-3 gap-3">
                  {selectedContractor.photos.map((photo, idx) => (
                    <img 
                      key={idx}
                      src={photo} 
                      alt={`Фото работы ${idx + 1}`} 
                      className="w-full aspect-square object-cover rounded-2xl cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                      onClick={() => setSelectedImage(photo)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20 w-full max-w-md mx-auto">
            <button 
              onClick={() => setSelectedContractor(null)}
              className="w-full bg-[#F3F4F6] text-[#0F2846] font-bold py-4 rounded-xl active:scale-[0.98] transition-transform"
            >
              Закрыть профиль
            </button>
          </div>
        </div>
      )}

      {/* Bottom Back Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20 max-w-md mx-auto w-full">
        <button 
          onClick={() => onNavigate('customer_menu')} 
          className="w-full flex items-center justify-center gap-2 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] font-bold py-4 rounded-xl active:scale-[0.98] transition-all"
        >
          <ChevronLeft className="w-5 h-5" /> Назад
        </button>
      </div>

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
    </div>
  );
}
