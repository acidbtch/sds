import React, { useState, useMemo } from 'react';
import { ViewState, Contractor } from '../types';
import { ChevronLeft, Search, Filter, Star, MapPin, CheckCircle, Award, Briefcase, X, Clock, Globe, Instagram, Video, ArrowUpDown, Phone, Image as ImageIcon } from 'lucide-react';
import RegionSelector from './RegionSelector';
import { useData } from '../context/DataContext';
import { customerApi } from '../lib/api';

interface Props {
  onNavigate: (view: ViewState) => void;
  isCustomer?: boolean;
  previousView?: ViewState | null;
}

interface FilterState {
  serviceCategory: string | null;
  serviceType: string | null;
  regions: string[];
  ratingSort: 'high' | 'low' | null;
  profileType: 'leader' | 'pro' | 'partner' | null;
  ordersSort: 'more' | 'less' | null;
}

export default function ContractorsCatalog({ onNavigate, isCustomer = false, previousView }: Props) {
  const { contractors, setContractors, serviceCategories } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    serviceCategory: null,
    serviceType: null,
    regions: [],
    ratingSort: null,
    profileType: null,
    ordersSort: null,
  });

  const [tempFilters, setTempFilters] = useState<FilterState>(filters);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    const fetchExecutors = async () => {
      setIsLoading(true);
      try {
        const data = await customerApi.getExecutors();
        if (data) {
          const mappedData = data.map((c: any) => ({
            id: c.id,
            name: c.name || '',
            shortName: c.short_name || '',
            profileType: (c.tier === 'LEADER' ? 'leader' : c.tier === 'PROFI' ? 'pro' : 'partner') as Contractor['profileType'],
            rating: c.rating || 5.0,
            reviewsCount: c.reviews_count || 0,
            completedOrders: c.completed_orders || 0,
            registrationDate: c.created_at || new Date().toISOString(),
            description: c.description || '',
            services: (c.services || []).map((s: any) => s.name || s),
            regions: (c.regions || []).map((r: any) => r.name || r),
            address: c.address || '',
            workingHours: c.working_hours || '',
            phone: c.phone || '',
            instagram: c.instagram || '',
            website: c.website || '',
            logo: c.logo_url || c.avatar_url || '',
            photos: c.portfolio_photos || c.photos || [],
            legalDocs: c.legal_documents || [],
            video: c.video_url || '',
            unp: c.unp || '',
            legalStatus: c.legal_status || ''
          }));
          setContractors(mappedData);
        }
      } catch (error) {
        console.error('Failed to fetch executors:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExecutors();
  }, [setContractors]);

  const handleOpenFilters = () => {
    setTempFilters(filters);
    setIsFilterOpen(true);
  };

  const handleOpenSort = () => {
    setTempFilters(filters);
    setIsSortOpen(true);
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterOpen(false);
  };

  const handleApplySort = () => {
    setFilters(tempFilters);
    setIsSortOpen(false);
  };

  const handleResetFilters = () => {
    const resetState: FilterState = {
      ...filters,
      serviceCategory: null,
      serviceType: null,
      regions: [],
      profileType: null,
    };
    setTempFilters(resetState);
    setFilters(resetState);
    setIsFilterOpen(false);
  };

  const handleResetSort = () => {
    const resetState: FilterState = {
      ...filters,
      ratingSort: null,
      ordersSort: null,
    };
    setTempFilters(resetState);
    setFilters(resetState);
    setIsSortOpen(false);
  };

  const filteredContractors = useMemo(() => {
    let result = [...contractors];

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.shortName.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
      );
    }

    // Service type filter
    if (filters.serviceType) {
      result = result.filter(c => c.services.includes(filters.serviceType!));
    }

    // Region filter
    if (filters.regions.length > 0) {
      result = result.filter(c => c.regions.some(r => filters.regions.includes(r)));
    }

    // Profile type filter
    if (filters.profileType) {
      result = result.filter(c => c.profileType === filters.profileType);
    }

    // Sorting
    result.sort((a, b) => {
      // 1. Explicit Rating sort
      if (filters.ratingSort) {
        if (a.rating !== b.rating) {
          return filters.ratingSort === 'high' ? b.rating - a.rating : a.rating - b.rating;
        }
      }

      // 2. Explicit Orders sort
      if (filters.ordersSort) {
        if (a.completedOrders !== b.completedOrders) {
          return filters.ordersSort === 'more' ? b.completedOrders - a.completedOrders : a.completedOrders - b.completedOrders;
        }
      }

      // 3. Profile type priority (default)
      if (!filters.profileType) {
        const profileWeight = { leader: 3, pro: 2, partner: 1 };
        const weightA = profileWeight[a.profileType] || 0;
        const weightB = profileWeight[b.profileType] || 0;
        if (weightA !== weightB) {
          return weightB - weightA;
        }
      }

      // 4. Registration date (older first)
      return new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
    });

    return result;
  }, [searchQuery, filters]);

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (previousView === 'customer_orders') {
                onNavigate('customer_orders');
              } else {
                onNavigate(isCustomer ? 'customer_menu' : 'admin_panel');
              }
            }}
            className="p-2 -ml-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Каталог исполнителей</h1>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 border-b border-gray-100 sticky top-[68px] z-10 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Поиск по названию..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button 
            onClick={handleOpenFilters}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-colors ${
              (filters.serviceType !== null || filters.regions.length > 0 || filters.profileType !== null)
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
          <button 
            onClick={handleOpenSort}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-colors ${
              (filters.ratingSort !== null || filters.ordersSort !== null)
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ArrowUpDown className="w-5 h-5" />
          </button>
        </div>
        
        {/* Active Filters Display */}
        {(filters.serviceType !== null || filters.regions.length > 0 || filters.profileType !== null) && (
          <div className="flex flex-wrap gap-2">
            {filters.serviceType && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                Услуга: {filters.serviceType.split('.')[0]}
                <button onClick={() => setFilters({...filters, serviceType: null})}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.regions.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                Регион: {filters.regions.length}
                <button onClick={() => setFilters({...filters, regions: []})}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.profileType && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                Профиль: {filters.profileType === 'leader' ? 'Лидер' : filters.profileType === 'pro' ? 'Профи' : 'Партнер'}
                <button onClick={() => setFilters({...filters, profileType: null})}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Contractors List */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredContractors.length > 0 ? (
          filteredContractors.map(contractor => (
            <div 
              key={contractor.id} 
              onClick={() => setSelectedContractor(contractor)}
              className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition-shadow hover:shadow-md ${contractor.profileType === 'leader' ? 'border-orange-500 bg-orange-50/10' : 'border-gray-100'}`}
            >
              <div className="flex gap-4 mb-4">
                {/* Logo */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                  {contractor.logo ? (
                    <img src={contractor.logo} alt={contractor.shortName} className="w-full h-full object-cover" />
                  ) : (
                    <Briefcase className="w-8 h-8 text-gray-400" />
                  )}
                  {contractor.profileType === 'leader' && (
                    <div className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-sm z-10">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    </div>
                  )}
                </div>
                
                {/* Name, Description, Button */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 text-lg truncate">{contractor.shortName}</h3>
                    {getProfileBadge(contractor.profileType)}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{contractor.description}</p>
                </div>
              </div>

              {/* Photos */}
              {contractor.photos && contractor.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
                  {contractor.photos.map((photo, idx) => (
                    <img key={idx} src={photo} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-200" />
                  ))}
                </div>
              )}

              {/* Services */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-gray-900 mb-2">Виды оказываемых услуг</h4>
                <div className="flex flex-wrap gap-1.5">
                  {contractor.services.map((service, idx) => (
                    <span key={idx} className="bg-gray-50 text-gray-600 text-[11px] px-2.5 py-1 rounded-lg border border-gray-200">
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {/* Region and Contacts */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm border-t border-b border-gray-100 py-3">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-1">Регион работы</h4>
                  <div className="flex items-start gap-1.5 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                    <span className="text-xs leading-tight">{contractor.regions?.join(', ') || (contractor as any).region}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-1">Контакты</h4>
                  <div className="flex flex-col gap-1.5 text-xs">
                    {contractor.phone && (
                      <a href={`tel:${contractor.phone}`} onClick={e => e.stopPropagation()} className="text-blue-600 hover:underline flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> {contractor.phone}
                      </a>
                    )}
                    {(contractor.profileType === 'leader' || contractor.profileType === 'pro') && (
                      <>
                        {contractor.instagram && (
                          <a href={contractor.instagram} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-blue-600 hover:underline flex items-center gap-1.5">
                            <Instagram className="w-3.5 h-3.5" /> Instagram
                          </a>
                        )}
                        {contractor.tiktok && (
                          <a href={contractor.tiktok} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-blue-600 hover:underline flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5" /> TikTok
                          </a>
                        )}
                        {contractor.website && (
                          <a href={contractor.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-blue-600 hover:underline flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" /> Сайт
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Orders count and Rating */}
              <div className="flex justify-between items-center text-sm mb-4">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium">{contractor.completedOrders || 0} выполненных заказов</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-gray-900">{contractor.rating || 0}</span>
                  <span className="text-xs">({contractor.reviewsCount || 0} отз.)</span>
                </div>
              </div>

              {isCustomer && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onNavigate('order_form');
                  }}
                  className="w-full bg-orange-500 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-orange-600 transition-colors"
                >
                  Предложить заказ
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>По вашему запросу ничего не найдено.</p>
            <button 
              onClick={handleResetFilters}
              className="text-blue-500 font-medium mt-2"
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col w-full max-w-md mx-auto shadow-2xl">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <h2 className="text-lg font-bold text-gray-900">Фильтры</h2>
            <button onClick={() => setIsFilterOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
            {/* Service Type */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Категория услуг</label>
              <select 
                value={tempFilters.serviceCategory || ''}
                onChange={(e) => setTempFilters({...tempFilters, serviceCategory: e.target.value || null, serviceType: null})}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none bg-white mb-4"
              >
                <option value="">Все категории</option>
                {serviceCategories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>

              <label className="block text-sm font-bold text-gray-900 mb-2">Вид услуги</label>
              <select 
                value={tempFilters.serviceType || ''}
                onChange={(e) => setTempFilters({...tempFilters, serviceType: e.target.value || null})}
                disabled={!tempFilters.serviceCategory}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">Все услуги</option>
                {tempFilters.serviceCategory && serviceCategories.find(c => c.id === tempFilters.serviceCategory)?.services.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Регион</label>
              <button 
                onClick={() => setIsRegionModalOpen(true)}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm text-left flex justify-between items-center bg-white"
              >
                <span className={tempFilters.regions.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                  {tempFilters.regions.length > 0 ? tempFilters.regions.join(', ') : 'Все регионы'}
                </span>
                <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
              </button>
            </div>

            {/* Profile Type */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Профиль исполнителя</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setTempFilters({...tempFilters, profileType: tempFilters.profileType === 'leader' ? null : 'leader'})}
                  className={`p-2 rounded-xl border text-sm font-medium transition-colors ${tempFilters.profileType === 'leader' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-200 text-gray-700'}`}
                >
                  Лидер
                </button>
                <button 
                  onClick={() => setTempFilters({...tempFilters, profileType: tempFilters.profileType === 'pro' ? null : 'pro'})}
                  className={`p-2 rounded-xl border text-sm font-medium transition-colors ${tempFilters.profileType === 'pro' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700'}`}
                >
                  Профи
                </button>
                <button 
                  onClick={() => setTempFilters({...tempFilters, profileType: tempFilters.profileType === 'partner' ? null : 'partner'})}
                  className={`p-2 rounded-xl border text-sm font-medium transition-colors ${tempFilters.profileType === 'partner' ? 'bg-gray-100 border-gray-300 text-gray-800' : 'bg-white border-gray-200 text-gray-700'}`}
                >
                  Партнер
                </button>
              </div>
            </div>

          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-2 z-20 w-full max-w-md mx-auto">
            <button 
              onClick={handleResetFilters}
              className="flex-1 bg-[#F3F4F6] text-[#0F2846] font-bold py-4 rounded-xl active:scale-[0.98] transition-transform"
            >
              Сбросить
            </button>
            <button 
              onClick={handleApplyFilters}
              className="flex-[2] bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform"
            >
              Применить фильтр
            </button>
          </div>
        </div>
      )}

      {/* Sort Modal */}
      {isSortOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col w-full max-w-md mx-auto shadow-2xl">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <h2 className="text-lg font-bold text-[#0F2846]">Сортировка</h2>
            <button onClick={() => setIsSortOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
            {/* Rating Sort */}
            <div>
              <label className="block text-sm font-bold text-[#0F2846] mb-2">Рейтинг</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setTempFilters({...tempFilters, ratingSort: tempFilters.ratingSort === 'high' ? null : 'high'})}
                  className={`p-3 rounded-xl border text-[13px] font-semibold transition-colors ${tempFilters.ratingSort === 'high' ? 'bg-[#F3F4F6] border-[#F3F4F6] text-[#0F2846]' : 'bg-white border-gray-200 text-[#0F2846]'}`}
                >
                  Сначала высокий
                </button>
                <button 
                  onClick={() => setTempFilters({...tempFilters, ratingSort: tempFilters.ratingSort === 'low' ? null : 'low'})}
                  className={`p-3 rounded-xl border text-[13px] font-semibold transition-colors ${tempFilters.ratingSort === 'low' ? 'bg-[#F3F4F6] border-[#F3F4F6] text-[#0F2846]' : 'bg-white border-gray-200 text-[#0F2846]'}`}
                >
                  Сначала низкий
                </button>
              </div>
            </div>

            {/* Orders Sort */}
            <div>
              <label className="block text-sm font-bold text-[#0F2846] mb-2">Выполненные заказы</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setTempFilters({...tempFilters, ordersSort: tempFilters.ordersSort === 'more' ? null : 'more'})}
                  className={`p-3 rounded-xl border text-[13px] font-semibold transition-colors ${tempFilters.ordersSort === 'more' ? 'bg-[#F3F4F6] border-[#F3F4F6] text-[#0F2846]' : 'bg-white border-gray-200 text-[#0F2846]'}`}
                >
                  Сначала больше
                </button>
                <button 
                  onClick={() => setTempFilters({...tempFilters, ordersSort: tempFilters.ordersSort === 'less' ? null : 'less'})}
                  className={`p-3 rounded-xl border text-[13px] font-semibold transition-colors ${tempFilters.ordersSort === 'less' ? 'bg-[#F3F4F6] border-[#F3F4F6] text-[#0F2846]' : 'bg-white border-gray-200 text-[#0F2846]'}`}
                >
                  Сначала меньше
                </button>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-2 z-20 w-full max-w-md mx-auto">
            <button 
              onClick={handleResetSort}
              className="flex-1 bg-[#F3F4F6] text-[#0F2846] font-bold py-4 rounded-xl active:scale-[0.98] transition-transform"
            >
              Сбросить
            </button>
            <button 
              onClick={handleApplySort}
              className="flex-[2] bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform"
            >
              Применить
            </button>
          </div>
        </div>
      )}

      <RegionSelector 
        isOpen={isRegionModalOpen}
        onClose={() => setIsRegionModalOpen(false)}
        selectedRegions={tempFilters.regions}
        onSelect={(regions) => setTempFilters({ ...tempFilters, regions })}
        multiSelect={true}
      />

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
            <div className="flex items-start gap-4">
              {selectedContractor.logo && (
                <img 
                  src={selectedContractor.logo} 
                  alt={selectedContractor.shortName} 
                  className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-gray-100 shadow-sm"
                />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h1 className="text-2xl font-bold text-[#0F2846] leading-tight">
                    {selectedContractor.shortName || selectedContractor.name.replace(/ООО |ИП |ЧУП |ОАО |"/g, '')}
                  </h1>
                  <div className="shrink-0 ml-2 mt-1">
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
                </div>
                <div className="text-[13px] text-gray-500 mt-1">
                  {selectedContractor.legalStatus || 'ООО'} "{selectedContractor.name.replace(/ООО |ИП |ЧУП |ОАО |"/g, '')}"
                  {selectedContractor.unp && <span className="block mt-0.5">УНП: {selectedContractor.unp}</span>}
                </div>
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
                  {selectedContractor.reviewsCount || 0} отзывов
                </div>
              </div>
              <div className="bg-[#F0FDF4] rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1.5 text-[#16A34A] font-bold text-lg mb-0.5">
                  <CheckCircle className="w-5 h-5" />
                  {selectedContractor.completedOrders || 0}
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

            {/* Фото документов */}
            {selectedContractor.legalDocs && selectedContractor.legalDocs.length > 0 && (
              <div>
                <h3 className="text-[15px] font-bold text-[#0F2846] mb-3">Документы</h3>
                <div className="grid grid-cols-3 gap-3">
                  {selectedContractor.legalDocs.map((doc, idx) => (
                    <img 
                      key={idx}
                      src={doc} 
                      alt={`Документ ${idx + 1}`} 
                      className="w-full aspect-square object-cover rounded-2xl cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                      onClick={() => setSelectedImage(doc)}
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

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={selectedImage} 
            alt="Full size" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
