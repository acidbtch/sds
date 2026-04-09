import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { ChevronLeft, Camera, Video, CheckCircle, Info, Loader2, X } from 'lucide-react';
import RegionSelector from './RegionSelector';
import { CustomSelect } from './CustomSelect';
import { MultiSelect } from './MultiSelect';
import { useData } from '../context/DataContext';
import { dictsApi, customerApi, mediaApi } from '../lib/api';

interface Props {
  onNavigate: (view: ViewState) => void;
  carModels: Record<string, string[]>;
  previousView?: ViewState | null;
}

export default function OrderForm({ onNavigate, carModels, previousView }: Props) {
  const { serviceCategories, setOrders } = useData();
  const [submitted, setSubmitted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGearbox, setSelectedGearbox] = useState('');
  const [selectedBody, setSelectedBody] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('');
  const [engineVolume, setEngineVolume] = useState('');
  const [vin, setVin] = useState('');
  const [selectedDrive, setSelectedDrive] = useState('');
  const [phone, setPhone] = useState('+375 ');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Media states
  const [attachments, setAttachments] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // API Data States
  const [apiCategories, setApiCategories] = useState<any[]>([]);
  const [apiServices, setApiServices] = useState<any[]>([]);
  const [apiBrands, setApiBrands] = useState<any[]>([]);
  const [apiModels, setApiModels] = useState<any[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newAttachments = [...attachments];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const { upload_url, file_key } = await mediaApi.getPresignedUrl(file.name, file.type);
        await mediaApi.uploadToS3(upload_url, file);
        newAttachments.push({ url: file_key, type });
      }
      setAttachments(newAttachments);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Ошибка при загрузке файла');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    // Fetch initial dictionaries
    const fetchDicts = async () => {
      try {
        const [categories, brands] = await Promise.all([
          dictsApi.getServiceCategories(),
          dictsApi.getCarBrands()
        ]);
        setApiCategories(categories || []);
        setApiBrands(brands || []);
      } catch (error) {
        console.error('Failed to fetch dictionaries:', error);
      }
    };
    fetchDicts();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      dictsApi.getServices(selectedCategory)
        .then(services => setApiServices(services || []))
        .catch(console.error);
    } else {
      setApiServices([]);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedMake) {
      dictsApi.getCarModels(selectedMake)
        .then(models => setApiModels(models || []))
        .catch(console.error);
    } else {
      setApiModels([]);
    }
  }, [selectedMake]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1966 + 1 }, (_, i) => currentYear - i);

  const isFormValid = 
    selectedServices.length > 0 &&
    selectedRegions.length > 0 &&
    selectedMake !== '' &&
    selectedModel !== '' &&
    selectedYear !== '' &&
    selectedGearbox !== '' &&
    selectedBody !== '' &&
    selectedEngine !== '' &&
    selectedDrive !== '' &&
    name.trim() !== '' &&
    phone.length >= 17 &&
    description.trim() !== '' &&
    deadline !== '';

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
    setPhone(formatted);
  };

  const handleMakeChange = (value: string) => {
    setSelectedMake(value);
    setSelectedModel(''); // Reset model when make changes
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setSelectedServices([]);
  };

  const handleBack = () => {
    if (previousView === 'contractors_catalog') {
      onNavigate('contractors_catalog');
    } else {
      onNavigate('customer_menu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setIsLoading(true);
    
    try {
      // Create new order via API
      const orderData = {
        service_id: selectedServices[0],
        service_ids: selectedServices,
        region_id: selectedRegions[0],   // Assuming selectedRegions contains IDs
        car_brand_id: selectedMake,
        car_model_id: selectedModel,
        engine_type: selectedEngine,
        gearbox_type: selectedGearbox,
        drive_type: selectedDrive,
        body_type: selectedBody,
        engine_volume: engineVolume ? parseFloat(engineVolume.replace(',', '.')) : undefined,
        vin: vin || undefined,
        year: parseInt(selectedYear, 10),
        owner_name: name,
        owner_phone: phone,
        description: description,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        attachments: attachments.map(a => a.url) // Add attachments
      };
      
      await customerApi.createOrder(orderData);
      
      setSubmitted(true);
      setTimeout(() => {
        if (previousView === 'contractors_catalog') {
          onNavigate('contractors_catalog');
        } else {
          onNavigate('customer_orders');
        }
      }, 5000);
    } catch (error: any) {
      console.error('Failed to create order:', error);
      alert(`Ошибка при создании заказа: ${error.message || 'Пожалуйста, попробуйте еще раз.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white p-6 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Заказ успешно оформлен!</h2>
        <p className="text-gray-500">Ваш запрос отправлен исполнителям. Вы получите уведомление в Telegram при поступлении откликов.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-white p-4 flex items-center justify-center shadow-md sticky top-0 z-10 relative">
        <button 
          onClick={handleBack}
          className="absolute left-4 p-2 -ml-2 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Оформление заказа</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="p-4 flex flex-col gap-4 pb-64">
        <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3 border border-orange-100">
          <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-orange-800">В одном заказе доступны услуги только в рамках одной категории.</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Категория услуг <span className="text-red-500">*</span></label>
            <CustomSelect
              value={selectedCategory}
              onChange={handleCategoryChange}
              options={apiCategories.map(cat => ({ value: cat.id, label: cat.name }))}
              placeholder="Выберите категорию"
              error={showErrors && !selectedCategory}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Вид услуги <span className="text-red-500">*</span></label>
            <MultiSelect
              values={selectedServices}
              onChange={setSelectedServices}
              disabled={!selectedCategory}
              options={apiServices.map(srv => ({ value: srv.id, label: srv.name }))}
              placeholder={selectedCategory ? "Выберите услуги" : "Сначала выберите категорию"}
              error={showErrors && selectedServices.length === 0}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">Регион <span className="text-red-500">*</span></label>
          <button 
            type="button"
            onClick={() => setIsRegionModalOpen(true)}
            className={`w-full rounded-lg p-3 bg-gray-50 text-left text-gray-700 outline-none transition-colors ${showErrors && selectedRegions.length === 0 ? 'border-2 border-red-500' : 'border border-gray-300 focus:ring-orange-500 focus:border-orange-500'}`}
          >
            {selectedRegions.length > 0 ? selectedRegions.join(', ') : 'Выберите населенный пункт'}
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Марка автомобиля <span className="text-red-500">*</span></label>
            <CustomSelect
              value={selectedMake}
              onChange={handleMakeChange}
              options={apiBrands.map(brand => ({ value: brand.id, label: brand.name }))}
              placeholder="Выберите марку"
              error={showErrors && !selectedMake}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Модель <span className="text-red-500">*</span></label>
            <CustomSelect
              value={selectedModel}
              onChange={setSelectedModel}
              disabled={!selectedMake}
              options={apiModels.map(model => ({ value: model.id, label: model.name }))}
              placeholder="Выберите модель"
              error={showErrors && !selectedModel}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Год выпуска <span className="text-red-500">*</span></label>
            <CustomSelect
              value={selectedYear}
              onChange={setSelectedYear}
              options={years.map(year => ({ value: year.toString(), label: year.toString() }))}
              placeholder="Выберите год"
              error={showErrors && !selectedYear}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Объем двигателя</label>
            <input 
              type="text" 
              value={engineVolume}
              onChange={(e) => setEngineVolume(e.target.value)}
              placeholder="1.0 – 9.0 л" 
              className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-orange-500 focus:border-orange-500 outline-none" 
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип двигателя <span className="text-red-500">*</span></label>
            <CustomSelect
              value={selectedEngine}
              onChange={setSelectedEngine}
              options={[
                { value: 'Бензин', label: 'Бензин' },
                { value: 'Бензин (пропан-бутан)', label: 'Бензин (пропан-бутан)' },
                { value: 'Бензин (метан)', label: 'Бензин (метан)' },
                { value: 'Дизель', label: 'Дизель' },
                { value: 'Гибрид', label: 'Гибрид' },
                { value: 'Электро', label: 'Электро' },
              ]}
              placeholder="Выберите тип"
              error={showErrors && !selectedEngine}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип кузова <span className="text-red-500">*</span></label>
            <CustomSelect
              value={selectedBody}
              onChange={setSelectedBody}
              options={[
                { value: 'Седан', label: 'Седан' },
                { value: 'Универсал', label: 'Универсал' },
                { value: 'Хэтчбек', label: 'Хэтчбек' },
                { value: 'Внедорожник', label: 'Внедорожник' },
                { value: 'Минивэн', label: 'Минивэн' },
                { value: 'Купе', label: 'Купе' },
                { value: 'Пикап', label: 'Пикап' },
                { value: 'Кабриолет', label: 'Кабриолет' },
                { value: 'Фургон', label: 'Фургон' },
                { value: 'Микроавтобус', label: 'Микроавтобус' },
              ]}
              placeholder="Выберите кузов"
              error={showErrors && !selectedBody}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Коробка передач <span className="text-red-500">*</span></label>
            <CustomSelect
              value={selectedGearbox}
              onChange={setSelectedGearbox}
              options={[
                { value: 'Автомат', label: 'Автомат' },
                { value: 'Механика', label: 'Механика' },
                { value: 'У меня электромобиль', label: 'У меня электромобиль' },
              ]}
              placeholder="Выберите коробку"
              error={showErrors && !selectedGearbox}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Привод <span className="text-red-500">*</span></label>
            <CustomSelect
              value={selectedDrive}
              onChange={setSelectedDrive}
              options={[
                { value: 'Передний', label: 'Передний' },
                { value: 'Задний', label: 'Задний' },
                { value: 'Полный', label: 'Полный' },
              ]}
              placeholder="Выберите привод"
              error={showErrors && !selectedDrive}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">VIN-номер (№ кузова из техпаспорта)</label>
            <input 
              type="text" 
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder="ДЛЯ ЗАКАЗА ЗАПЧАСТЕЙ СТО" 
              className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-orange-500 focus:border-orange-500 outline-none uppercase" 
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">Имя владельца <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Иван Иванов" 
            className={`w-full rounded-lg p-3 bg-gray-50 outline-none mb-4 transition-colors ${showErrors && !name.trim() ? 'border-2 border-red-500' : 'border border-gray-300 focus:ring-orange-500 focus:border-orange-500'}`}
          />
          
          <label className="block text-sm font-medium text-gray-700 mb-1">Контактный телефон (Telegram) <span className="text-red-500">*</span></label>
          <input 
            type="tel" 
            value={phone} 
            onChange={handlePhoneChange} 
            placeholder="+375 (29) 000-00-00" 
            className={`w-full rounded-lg p-3 bg-gray-50 outline-none transition-colors ${showErrors && phone.length < 17 ? 'border-2 border-red-500' : 'border border-gray-300 focus:ring-orange-500 focus:border-orange-500'}`}
          />
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание проблемы или работ <span className="text-red-500">*</span></label>
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            rows={4} 
            placeholder="Опишите, что нужно сделать или какие симптомы..." 
            className={`w-full rounded-lg p-3 bg-gray-50 outline-none mb-4 transition-colors ${showErrors && !description.trim() ? 'border-2 border-red-500' : 'border border-gray-300 focus:ring-orange-500 focus:border-orange-500'}`}
          ></textarea>
          
          <label className="block text-sm font-medium text-gray-700 mb-1">Выполнить до <span className="text-red-500">*</span></label>
          <input 
            type="date" 
            value={deadline} 
            onChange={e => setDeadline(e.target.value)} 
            className={`w-full rounded-lg p-3 bg-gray-50 outline-none transition-colors ${showErrors && !deadline ? 'border-2 border-red-500' : 'border border-gray-300 focus:ring-orange-500 focus:border-orange-500'}`}
          />
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">Медиафайлы</label>
          <p className="text-xs text-gray-500 mb-3">Они помогут лучше оценить ваш заказ</p>
          
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((file, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  {file.type === 'image' ? (
                    <img src={file.url} alt="attachment" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Video className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <button 
                    type="button" 
                    onClick={() => removeAttachment(idx)}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-3">
            <label className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-orange-500 hover:text-orange-500 transition-colors cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                className="hidden" 
                onChange={(e) => handleFileUpload(e, 'image')}
                disabled={isUploading || attachments.filter(a => a.type === 'image').length >= 10}
              />
              {isUploading ? <Loader2 className="w-6 h-6 mb-1 animate-spin text-orange-500" /> : <Camera className="w-6 h-6 mb-1" />}
              <span className="text-xs">Фото (до 10)</span>
            </label>
            <label className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-orange-500 hover:text-orange-500 transition-colors cursor-pointer">
              <input 
                type="file" 
                accept="video/*" 
                className="hidden" 
                onChange={(e) => handleFileUpload(e, 'video')}
                disabled={isUploading || attachments.filter(a => a.type === 'video').length >= 1}
              />
              {isUploading ? <Loader2 className="w-6 h-6 mb-1 animate-spin text-orange-500" /> : <Video className="w-6 h-6 mb-1" />}
              <span className="text-xs">Видео (1)</span>
            </label>
          </div>
        </div>

        <div className="text-xs text-gray-500 px-2">
          Заказывая услугу я соглашаюсь с <a href="#" onClick={(e) => e.preventDefault()} className="text-orange-500 underline">Правилами работы приложения</a> и <a href="#" onClick={(e) => e.preventDefault()} className="text-orange-500 underline">Политикой обработки персональных данных</a>.
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20 flex gap-2 max-w-md mx-auto w-full">
          <button type="button" onClick={handleBack} className="flex-1 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] font-bold py-4 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" /> Назад
          </button>
          <button 
            type="submit" 
            className={`flex-[2] font-bold py-4 rounded-xl shadow-lg transition-all ${isFormValid ? 'bg-orange-500 text-white active:scale-[0.98]' : 'bg-orange-300 text-orange-50'}`}
          >
            Заказать
          </button>
        </div>
      </form>

      <RegionSelector 
        isOpen={isRegionModalOpen}
        onClose={() => setIsRegionModalOpen(false)}
        selectedRegions={selectedRegions}
        onSelect={setSelectedRegions}
        isCustomer={true}
      />
    </div>
  );
}
