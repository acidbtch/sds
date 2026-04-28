import React, { useState } from 'react';
import { ViewState } from '../types';
import { ChevronLeft, CheckCircle, Upload, Info, X, ChevronDown, Loader2 } from 'lucide-react';
import RegionSelector from './RegionSelector';
import { CustomSelect } from './CustomSelect';
import { ScheduleSelector, defaultSchedule, WeeklySchedule } from './ScheduleSelector';
import { useData } from '../context/DataContext';
import { executorApi, dictsApi } from '../lib/api';
import { uploadMediaFile } from '../lib/media';

interface Props {
  onNavigate: (view: ViewState) => void;
  previousView?: ViewState | null;
}

type ProfileType = 'leader' | 'pro' | 'partner' | null;

export default function ContractorRegister({ onNavigate, previousView }: Props) {
  const { serviceCategories } = useData();
  const [selectedProfile, setSelectedProfile] = useState<ProfileType>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [phone, setPhone] = useState('+375 ');
  const [schedule, setSchedule] = useState<WeeklySchedule | string>(defaultSchedule);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['Вся Беларусь']);
  const [legalStatus, setLegalStatus] = useState('');
  const [legalName, setLegalName] = useState('');
  const [unp, setUnp] = useState('');
  const [shortName, setShortName] = useState('');
  const [description, setDescription] = useState('');
  const [bannerText, setBannerText] = useState('');
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [website, setWebsite] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoKey, setLogoKey] = useState('');
  const [documentFiles, setDocumentFiles] = useState<{ name: string; key: string }[]>([]);
  const [workPhotos, setWorkPhotos] = useState<{ name: string; key: string }[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMediaFile(file)
        .then(uploaded => {
          setLogoPreview(uploaded.previewUrl);
          setLogoKey(uploaded.key);
        })
        .catch(err => {
          console.error('Failed to upload logo:', err);
          setError('Не удалось загрузить логотип');
        })
        .finally(() => {
          e.target.value = '';
        });
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      const uploaded = await Promise.all(files.map(file => uploadMediaFile(file)));
      setDocumentFiles(prev => [...prev, ...uploaded.map(file => ({ name: file.name, key: file.key }))]);
    } catch (err) {
      console.error('Failed to upload documents:', err);
      setError('Не удалось загрузить документы');
    } finally {
      e.target.value = '';
    }
  };

  const handleWorkPhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, selectedProfile === 'partner' ? 3 : 10);
    if (!files.length) return;

    try {
      const uploaded = await Promise.all(files.map(file => uploadMediaFile(file)));
      setWorkPhotos(prev => [...prev, ...uploaded.map(file => ({ name: file.name, key: file.key }))]);
    } catch (err) {
      console.error('Failed to upload work photos:', err);
      setError('Не удалось загрузить фото работ');
    } finally {
      e.target.value = '';
    }
  };

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    const category = serviceCategories.find(c => c.id === categoryId);
    if (!category) return;
    
    if (checked) {
      const newServices = new Set([...selectedServices, ...category.services]);
      setSelectedServices(Array.from(newServices));
    } else {
      const newServices = selectedServices.filter(s => !category.services.includes(s));
      setSelectedServices(newServices);
    }
  };

  const handleServiceToggle = (service: string) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter(s => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
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
    setPhone(formatted);
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const [allServices, allRegions] = await Promise.all([
        dictsApi.getServices(),
        dictsApi.getRegions()
      ]);
      
      const serviceIds = allServices
        .filter((s: any) => selectedServices.includes(s.name))
        .map((s: any) => s.id);
      
      const regionIds = allRegions
        .filter((r: any) => selectedRegions.includes(r.name))
        .map((r: any) => r.id);
      
      const tierMap: Record<string, string> = {
        'partner': 'PARTNER',
        'pro': 'PROFI',
        'leader': 'LEADER'
      };
      
      const profileData = {
        tier: tierMap[selectedProfile || 'partner'],
        legal_status: legalStatus,
        legal_name: legalName,
        unp: unp,
        short_name: shortName,
        description: description,
        service_ids: serviceIds,
        region_ids: regionIds,
        phone: phone.replace(/\s/g, ''),
        instagram_url: instagram || null,
        website_url: website || null,
        logo_key: logoKey || null,
        legal_document_keys: documentFiles.map(file => file.key),
        portfolio_photo_keys: workPhotos.map(file => file.key),
      };
      
      await executorApi.createProfile(profileData);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Failed to register:', err);
      setError(err.message || 'Произошла ошибка при регистрации. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white p-6 text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Данные отправлены на модерацию</h2>
        <p className="text-gray-500 mb-6">После проверки администратором вы получите уведомление в Telegram об успешной регистрации.</p>
        <button 
          onClick={() => onNavigate('home')}
          className="w-full bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  if (!selectedProfile) {
    return (
      <div className="flex flex-col min-h-screen bg-white pb-20">
        <div className="bg-white p-4 flex items-center justify-center shadow-md sticky top-0 z-10 relative">
          <button 
            onClick={() => onNavigate('contractor_menu')}
            className="absolute left-4 p-2 -ml-2 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Выбор профиля</h1>
        </div>

        <div className="p-4 flex flex-col gap-4 pb-10">
          {/* Leader */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-orange-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Максимум</div>
            <h2 className="text-xl font-bold text-orange-500 mb-2">Лидер</h2>
            <div className="text-sm text-gray-600 mb-4 space-y-2">
              <p className="flex items-start"><CheckCircle className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" /> Все возможности «Профи»</p>
              <p className="flex items-start"><CheckCircle className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" /> Размещение в карусели автосервисов на основных экранах</p>
              <p className="flex items-start"><CheckCircle className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" /> Выделение цветом и значком в каталоге автосервисов</p>
              <p className="flex items-start"><CheckCircle className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" /> Акции и бонусы от SDS</p>
            </div>
            <div className="text-lg font-bold text-gray-900 mb-4">50 BYN / 30 дней</div>
            <button 
              onClick={() => setSelectedProfile('leader')}
              className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-md active:scale-[0.98] transition-transform"
            >
              Заполнить форму регистрации
            </button>
          </div>

          {/* Pro */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-blue-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Популярный</div>
            <h2 className="text-xl font-bold text-blue-600 mb-2">Профи</h2>
            <div className="text-sm text-gray-600 mb-4 space-y-2">
              <p className="flex items-start"><CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" /> Все возможности «Партнер»</p>
              <p className="flex items-start"><CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" /> Ссылки на ваши соц.сети и сайты</p>
              <p className="flex items-start"><CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" /> Прямые контакты для связи с вами</p>
            </div>
            <div className="text-lg font-bold text-gray-900 mb-4">30 BYN / 30 дней</div>
            <button 
              onClick={() => setSelectedProfile('pro')}
              className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl shadow-md active:scale-[0.98] transition-transform"
            >
              Заполнить форму регистрации
            </button>
          </div>

          {/* Partner */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 relative overflow-hidden">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Партнер</h2>
            <div className="text-sm text-gray-600 mb-4 space-y-2">
              <p className="flex items-start"><CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" /> Неограниченное число откликов</p>
              <p className="flex items-start"><CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" /> Включение в каталог автосервисов</p>
            </div>
            <div className="text-lg font-bold text-gray-900 mb-4">Бесплатно</div>
            <button 
              onClick={() => setSelectedProfile('partner')}
              className="w-full bg-[#E8EDF2] text-[#0F2846] font-bold py-3 rounded-xl active:scale-[0.98] transition-transform"
            >
              Заполнить форму регистрации
            </button>
          </div>
        </div>

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

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-white p-4 flex items-center justify-center shadow-md sticky top-0 z-10 relative">
        <button 
          onClick={() => setSelectedProfile(null)}
          className="absolute left-4 p-2 -ml-2 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Регистрация: {selectedProfile === 'leader' ? 'Лидер' : selectedProfile === 'pro' ? 'Профи' : 'Партнер'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 pb-64">
        <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 border border-blue-100">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">Все данные проходят ручную модерацию. Убедитесь в корректности заполнения.</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">Статус юридического лица <span className="text-red-500">*</span></label>
          <div className="mb-4">
            <CustomSelect
              value={legalStatus}
              onChange={setLegalStatus}
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

          <label className="block text-sm font-medium text-gray-700 mb-1">Полное юридическое наименование <span className="text-red-500">*</span></label>
          <input required type="text" value={legalName} onChange={e => setLegalName(e.target.value)} placeholder='ООО "АвтоСервис"' className="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4" />

          <label className="block text-sm font-medium text-gray-700 mb-1">УНП <span className="text-red-500">*</span></label>
          <input required type="text" value={unp} onChange={e => setUnp(e.target.value)} placeholder="123456789" className="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4" />

          <label className="block text-sm font-medium text-gray-700 mb-2">Фото документов юридического лица <span className="text-red-500">*</span></label>
          <label className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer mb-4">
            <Upload className="w-6 h-6 mb-1" />
            <span className="text-xs">Загрузить скан/фото</span>
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleDocumentUpload}
              className="hidden"
            />
          </label>
          {documentFiles.length > 0 && (
            <div className="text-xs text-gray-500 mb-4 space-y-1">
              {documentFiles.map(file => (
                <div key={file.key}>{file.name}</div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">Краткое название (для приложения) <span className="text-red-500">*</span></label>
          <input required type="text" value={shortName} onChange={e => setShortName(e.target.value)} placeholder="СТО Лидер" className="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4" />

          {(selectedProfile === 'pro' || selectedProfile === 'leader') && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">Логотип</label>
              <label className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-colors mb-4 cursor-pointer relative overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Логотип" className="absolute inset-0 w-full h-full object-contain p-2" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-xs">Загрузить логотип</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-1">Описание вашей деятельности <span className="text-red-500">*</span></label>
          <textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Кратко опишите оказываемые услуги и ваши преимущества" className="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4"></textarea>

          <label className="block text-sm font-medium text-gray-700 mb-2">Фото работ (до {selectedProfile === 'partner' ? '3' : '10'} шт)</label>
          <label className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-colors mb-4 cursor-pointer">
            <Upload className="w-6 h-6 mb-1" />
            <span className="text-xs">Загрузить фото</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleWorkPhotosUpload}
              className="hidden"
            />
          </label>
          {workPhotos.length > 0 && (
            <div className="text-xs text-gray-500 mb-4 space-y-1">
              {workPhotos.map(file => (
                <div key={file.key}>{file.name}</div>
              ))}
            </div>
          )}

          {selectedProfile === 'leader' && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1">Текст для рекламного баннера <span className="text-red-500">*</span></label>
              <textarea required rows={2} value={bannerText} onChange={e => setBannerText(e.target.value)} placeholder="Краткий рекламный текст для показа на баннере" className="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 outline-none"></textarea>
            </>
          )}
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">Категории и виды оказываемых услуг <span className="text-red-500">*</span></label>
          
          <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-2">
            {serviceCategories.map(category => {
              const allSelected = category.services.length > 0 && category.services.every(s => selectedServices.includes(s));
              const someSelected = category.services.some(s => selectedServices.includes(s)) && !allSelected;
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
                        onChange={(e) => handleCategoryToggle(category.id, e.target.checked)}
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
                            checked={selectedServices.includes(type)}
                            onChange={() => handleServiceToggle(type)}
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

          <label className="block text-sm font-medium text-gray-700 mb-1">Регион оказания услуг <span className="text-red-500">*</span></label>
          <button 
            type="button"
            onClick={() => setIsRegionModalOpen(true)}
            className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 text-left text-gray-700 outline-none focus:ring-blue-500 focus:border-blue-500 mb-4"
          >
            {selectedRegions.length > 0 ? selectedRegions.join(', ') : 'Выберите регион'}
          </button>

          <label className="block text-sm font-medium text-gray-700 mb-1">Адрес оказания услуги</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="г. Минск, ул. Пушкина, 10" className="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4" />

          <label className="block text-sm font-medium text-gray-700 mb-1">Режим работы</label>
          <ScheduleSelector value={schedule} onChange={setSchedule} className="mb-4" />
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">Контактный телефон (Telegram) <span className="text-red-500">*</span></label>
          <input required type="tel" value={phone} onChange={handlePhoneChange} placeholder="+375 (29) 000-00-00" className="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4" />

          {(selectedProfile === 'pro' || selectedProfile === 'leader') && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на Instagram</label>
              <input type="url" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4" />

              <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на TikTok</label>
              <input type="url" value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="https://tiktok.com/@..." className="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4" />

              <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на сайт</label>
              <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20 flex gap-2 max-w-md mx-auto w-full">
          <button 
            type="button"
            onClick={() => setSelectedProfile(null)}
            className="flex-1 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] font-bold py-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" /> Назад
          </button>
          <button type="submit" disabled={selectedServices.length === 0 || selectedRegions.length === 0} className="flex-[2] bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100">
            Отправить на модерацию
          </button>
        </div>
      </form>

      <RegionSelector 
        isOpen={isRegionModalOpen}
        onClose={() => setIsRegionModalOpen(false)}
        selectedRegions={selectedRegions}
        onSelect={setSelectedRegions}
        multiSelect={true}
      />
    </div>
  );
}
