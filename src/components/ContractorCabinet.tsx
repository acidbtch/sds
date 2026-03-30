import React, { useState, useEffect } from 'react';
import { ViewState, Order } from '../types';
import { ChevronLeft, CheckCircle, XCircle, AlertCircle, Settings, Edit3, Upload, X, ChevronDown, Clock } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import RegionSelector from './RegionSelector';
import { ScheduleSelector, defaultSchedule, WeeklySchedule, formatSchedule } from './ScheduleSelector';
import { useData } from '../context/DataContext';

interface Props {
  onNavigate: (view: ViewState) => void;
}

export default function ContractorCabinet({ onNavigate }: Props) {
  const { orders, setOrders, contractors, setContractors, moderation, setModeration, serviceCategories } = useData();
  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'profile'>('incoming');
  
  // Use the first contractor as the "logged in" contractor for demo purposes
  const currentContractor = contractors[0] || {
    id: '1',
    legalStatus: 'ООО',
    name: 'ООО "Лидер-Авто"',
    unp: '193000000',
    shortName: 'СТО Лидер',
    description: 'Ремонт и обслуживание автомобилей всех марок',
    bannerText: 'Лучшее СТО в городе!',
    services: ['Ремонт и обслуживание двигателя', 'Компьютерная диагностика'],
    regions: ['Минск', 'Минская область'],
    address: 'г. Минск, ул. Пушкина, 10',
    schedule: defaultSchedule as WeeklySchedule | string,
    phone: '+375 (29) 555-44-33',
    instagram: 'https://instagram.com/sto_lider',
    tiktok: 'https://tiktok.com/@sto_lider',
    website: 'https://stolider.by',
    profileType: 'leader',
    subEnd: '15.06.2026',
    rating: 4.8,
    reviewsCount: 124,
    regDate: '10.05.2026',
    orders: 15
  };

  const incomingOrders = orders.filter(o => 
    o.status === 'pending' && 
    !(o.refusedBy || []).includes(currentContractor.id)
  );
  const activeOrders = orders.filter(o => o.status === 'active' && o.acceptedContractorId === currentContractor.id);

  const [profileData, setProfileData] = useState(currentContractor);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };
  
  useEffect(() => {
    if (contractors[0]) {
      setProfileData(contractors[0]);
      setEditForm(contractors[0]);
    }
  }, [contractors]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState(profileData);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d+]/g, '');
    if (!val.startsWith('+375')) {
      val = '+375';
    }
    let formatted = '+375';
    const numbers = val.substring(4);
    if (numbers.length > 0) formatted += ' ' + numbers.substring(0, 2);
    if (numbers.length > 2) formatted += ' ' + numbers.substring(2, 5);
    if (numbers.length > 5) formatted += ' ' + numbers.substring(5, 7);
    if (numbers.length > 7) formatted += ' ' + numbers.substring(7, 9);
    setEditForm({ ...editForm, phone: formatted });
  };

  const toggleService = (service: string) => {
    setEditForm(prev => ({
      ...prev,
      services: prev.services.includes(service) 
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleRefuse = (id: string) => {
    setOrders(orders.map(o => {
      if (o.id === id) {
        return {
          ...o,
          refusedBy: [...(o.refusedBy || []), currentContractor.id],
          responses: (o.responses || []).filter(r => r.contractorId !== currentContractor.id)
        };
      }
      return o;
    }));
  };

  const handleAccept = (id: string) => {
    setOrders(orders.map(o => {
      if (o.id === id) {
        return {
          ...o,
          responses: [
            ...(o.responses || []),
            {
              id: String(Date.now()),
              contractorId: currentContractor.id,
              contractorName: currentContractor.name,
              rating: currentContractor.rating,
              reviewsCount: currentContractor.reviewsCount,
              profileType: currentContractor.profileType,
              message: 'Готов выполнить заказ',
              workingHours: currentContractor.schedule 
                ? formatSchedule(currentContractor.schedule)
                : (currentContractor.workingHours || 'Пн-Пт 09:00-18:00')
            }
          ]
        };
      }
      return o;
    }));
  };

  const handleComplete = (id: string) => {
    setOrders(orders.map(o => {
      if (o.id === id) {
        return { ...o, status: 'completed' };
      }
      return o;
    }));
    
    // Update contractor's completedOrders count
    setContractors(contractors.map(c => {
      if (c.id === profileData.id) {
        return { ...c, completedOrders: (c.completedOrders || 0) + 1 };
      }
      return c;
    }));
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

  const hasChanges = JSON.stringify(editForm) !== JSON.stringify(profileData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    
    // Send to moderation
    setModeration([
      ...moderation,
      {
        id: Date.now(),
        type: 'edit',
        name: editForm.name,
        profile: editForm.profileType,
        date: new Date().toLocaleDateString('ru-RU'),
        status: 'new',
        data: editForm,
        oldData: profileData
      }
    ]);
    
    setSubmitted(true);
  };

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
          <h2 className="font-bold text-gray-900">{profileData.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded">Лидер</span>
            <span className="flex items-center text-xs text-green-600 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Активно
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">124</div>
          <div className="text-xs text-gray-500">выполнено</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200">
        <button 
          className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${activeTab === 'incoming' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('incoming')}
        >
          Новые ({incomingOrders.length})
        </button>
        <button 
          className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${activeTab === 'active' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('active')}
        >
          В работе ({activeOrders.length})
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
            {incomingOrders.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">Нет новых заказов</div>
            ) : (
              incomingOrders.map(order => {
                const hasResponded = (order.responses || []).some(r => r.contractorId === currentContractor.id);
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
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-gray-400 bg-[#E8EDF2] px-2 py-1 rounded-md">
                          № {order.id} от {order.date}
                        </span>
                        <span className="flex items-center text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Новый
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{order.serviceType}</h3>
                      <p className="text-sm font-medium text-gray-800 mb-3">{order.carMake} {order.carModel} {order.year && `(${order.year})`}</p>
                      
                      <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {order.customerName && <div className="col-span-2"><span className="text-gray-500">Заказчик:</span> <span className="font-medium text-gray-900">{order.customerName}</span></div>}
                          {order.deadline && <div className="col-span-2"><span className="text-gray-500">Выполнить до:</span> <span className="font-medium text-gray-900">{order.deadline}</span></div>}
                          {order.engine && <div><span className="text-gray-500">Двигатель:</span> <span className="font-medium text-gray-900">{order.engine} {(order as any).engineVolume ? `(${(order as any).engineVolume})` : ''}</span></div>}
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
                          onClick={() => handleAccept(order.id)}
                          className="flex-1 bg-blue-500 text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-transform"
                        >
                          Готов выполнить
                        </button>
                      )}
                      <button 
                        onClick={() => handleRefuse(order.id)}
                        className="flex-1 bg-[#E8EDF2] text-[#0F2846] text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-transform"
                      >
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
            {activeOrders.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">Нет активных заказов</div>
            ) : (
              activeOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-gray-400 bg-[#E8EDF2] px-2 py-1 rounded-md">
                        № {order.id} от {order.date}
                      </span>
                      <span className="flex items-center text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-md">
                        В работе
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{order.serviceType}</h3>
                    <p className="text-sm font-medium text-gray-800 mb-3">{order.carMake} {order.carModel} {order.year && `(${order.year})`}</p>
                    
                    <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {order.customerName && <div className="col-span-2"><span className="text-gray-500">Заказчик:</span> <span className="font-medium text-gray-900">{order.customerName}</span></div>}
                        {order.deadline && <div className="col-span-2"><span className="text-gray-500">Выполнить до:</span> <span className="font-medium text-gray-900">{order.deadline}</span></div>}
                        {order.engine && <div><span className="text-gray-500">Двигатель:</span> <span className="font-medium text-gray-900">{order.engine} {(order as any).engineVolume ? `(${(order as any).engineVolume})` : ''}</span></div>}
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
                      className="w-full bg-green-500 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center active:scale-[0.98] transition-transform"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Отметить как выполненный
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Данные организации</h3>
                {!isEditingProfile ? (
                  <button 
                    onClick={() => {
                      setEditForm(profileData);
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
                          {(editForm as any).logo ? (
                            <img src={(editForm as any).logo} alt="Логотип" className="absolute inset-0 w-full h-full object-contain p-1" />
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
                      disabled={!isFormValid || !hasChanges}
                      className="flex-[2] bg-blue-500 text-white font-bold py-3 rounded-xl text-sm shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100"
                    >
                      Отправить на модерацию
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">Юридическое наименование</span>
                    <span className="font-medium text-gray-900">{profileData.legalStatus} "{profileData.name.replace(/ООО |ИП |ЧУП |ОАО |"/g, '')}"</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">УНП</span>
                    <span className="font-medium text-gray-900">{profileData.unp}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Краткое название</span>
                    <span className="font-medium text-gray-900">{profileData.shortName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Описание</span>
                    <span className="font-medium text-gray-900">{profileData.description}</span>
                  </div>
                  {profileData.profileType === 'leader' && profileData.bannerText && (
                    <div>
                      <span className="text-gray-500 block text-xs">Текст рекламного баннера</span>
                      <span className="font-medium text-gray-900">{profileData.bannerText}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 block text-xs">Услуги</span>
                    <span className="font-medium text-gray-900">{profileData.services.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Регион</span>
                    <span className="font-medium text-gray-900">{profileData.regions.join(', ')}</span>
                  </div>
                  {profileData.address && (
                    <div>
                      <span className="text-gray-500 block text-xs">Адрес</span>
                      <span className="font-medium text-gray-900">{profileData.address}</span>
                    </div>
                  )}
                  {profileData.schedule && (
                    <div>
                      <span className="text-gray-500 block text-xs">Режим работы</span>
                      <span className="font-medium text-gray-900">{formatSchedule(profileData.schedule)}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 block text-xs">Телефон</span>
                    <span className="font-medium text-gray-900">{profileData.phone}</span>
                  </div>
                  {(profileData.profileType === 'pro' || profileData.profileType === 'leader') && (
                    <>
                      {profileData.instagram && (
                        <div>
                          <span className="text-gray-500 block text-xs">Instagram</span>
                          <a href={profileData.instagram} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-500 underline">{profileData.instagram}</a>
                        </div>
                      )}
                      {profileData.tiktok && (
                        <div>
                          <span className="text-gray-500 block text-xs">TikTok</span>
                          <a href={profileData.tiktok} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-500 underline">{profileData.tiktok}</a>
                        </div>
                      )}
                      {profileData.website && (
                        <div>
                          <span className="text-gray-500 block text-xs">Сайт</span>
                          <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-500 underline">{profileData.website}</a>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
              <h3 className="font-bold text-orange-800 mb-2">Профиль "{profileData.profileType === 'leader' ? 'Лидер' : profileData.profileType === 'pro' ? 'Pro' : 'Базовая'}"</h3>
              <p className="text-sm text-orange-700 mb-3">Оплачена до {profileData.subEnd || '15.06.2026'}</p>
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
