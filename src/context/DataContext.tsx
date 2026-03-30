import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Contractor, Order, ViewState } from '../types';
import { mockContractors } from '../data/mockContractors';
import { ServiceCategory, initialServiceCategories } from '../data/services';

// Define the types for our context state
interface Customer {
  id: string;
  name: string;
  phone: string;
  tgId: string;
  regDate: string;
  orders: number;
  status: 'active' | 'blocked';
}

interface Payment {
  id: string;
  user: string;
  purpose: string;
  amount: string;
  status: 'Успешно' | 'Ошибка';
  date: string;
  error?: string;
}

interface Banner {
  id: number;
  contractorId?: string;
  contractor: string;
  description?: string;
  status: 'active' | 'inactive';
  views?: number;
  clicks?: number;
  logo?: string;
}

interface ModerationItem {
  id: number;
  type: 'new' | 'edit';
  name: string;
  profile: string;
  date: string;
  status: 'new' | 'approved' | 'rejected';
  data: any;
  oldData?: any;
}

export interface SupportReply {
  text: string;
  time: string;
  admin: boolean;
}

export interface SupportTicket {
  id: number;
  user: string;
  text: string;
  status: 'in_progress' | 'resolved';
  time: string;
  replies: SupportReply[];
  updatedAt?: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface ContentState {
  faq: FAQItem[];
  rules: string;
  privacy: string;
  templates: string;
}

interface DataContextType {
  contractors: Contractor[];
  setContractors: React.Dispatch<React.SetStateAction<Contractor[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  banners: Banner[];
  setBanners: React.Dispatch<React.SetStateAction<Banner[]>>;
  moderation: ModerationItem[];
  setModeration: React.Dispatch<React.SetStateAction<ModerationItem[]>>;
  support: SupportTicket[];
  setSupport: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  content: ContentState;
  setContent: React.Dispatch<React.SetStateAction<ContentState>>;
  serviceCategories: ServiceCategory[];
  setServiceCategories: React.Dispatch<React.SetStateAction<ServiceCategory[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contractors, setContractors] = useState<Contractor[]>(mockContractors);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(initialServiceCategories);
  
    const [orders, setOrders] = useState<Order[]>([
      {
        id: '101',
        serviceType: 'Ремонт двигателя',
        carMake: 'BMW',
        carModel: 'X5',
        year: '2018',
        region: 'Минск',
        customerName: 'Иван Иванов',
        date: '15.05.2026',
        deadline: '20.05.2026',
        status: 'active',
        description: 'Троит двигатель, горит чек',
        responses: []
      },
      {
        id: '102',
        serviceType: 'Шиномонтаж',
        carMake: 'Audi',
        carModel: 'A6',
        year: '2020',
        region: 'Брест',
        customerName: 'Петр Петров',
        date: '16.05.2026',
        deadline: '17.05.2026',
        status: 'pending',
        description: 'Переобуть на лето',
        responses: []
      }
    ]);

  const [customers, setCustomers] = useState<Customer[]>([
    { id: '1', name: 'Иван Иванов', phone: '+375291112233', tgId: '@ivan_iv', regDate: '10.05.2026', orders: 5, status: 'active' },
    { id: '2', name: 'Петр Петров', phone: '+375294445566', tgId: '@petr_p', regDate: '12.05.2026', orders: 2, status: 'blocked' },
  ]);

  const [payments, setPayments] = useState<Payment[]>([
    { id: 'TX-9921', user: 'СТО "Лидер-Авто"', purpose: 'Подписка Лидер', amount: '50.00 BYN', status: 'Успешно', date: '15.05.2026 14:30' },
    { id: 'TX-9922', user: 'Иван Иванов', purpose: 'Доступ к каталогу', amount: '5.00 BYN', status: 'Успешно', date: '16.05.2026 09:15' },
    { id: 'TX-9923', user: 'СТО "АвтоМир"', purpose: 'Подписка Профи', amount: '30.00 BYN', status: 'Ошибка', date: '16.05.2026 11:20', error: 'Недостаточно средств' },
  ]);

  const [banners, setBanners] = useState<Banner[]>([
    { id: 1, contractorId: '1', contractor: 'СТО "Лидер-Авто"', description: 'Лучшее СТО в городе!', status: 'active', views: 1250, clicks: 45 }
  ]);

  const [moderation, setModeration] = useState<ModerationItem[]>([
    { 
      id: 1, 
      type: 'new',
      name: 'ИП Сидоров В.А.', 
      profile: 'pro', 
      date: '16.05.2026', 
      status: 'new',
      data: {
        legalStatus: 'ИП',
        name: 'ИП Сидоров В.А.',
        unp: '123456789',
        shortName: 'Автомастер Сидоров',
        description: 'Качественный ремонт автомобилей всех марок. Опыт работы более 10 лет.',
        services: ['Диагностика двигателя', 'Ремонт двигателя', 'Замена моторного масла и масляного фильтра'],
        regions: ['Минск', 'Минская область'],
        phone: '+375 (29) 111-22-33',
        instagram: 'https://instagram.com/auto_sidorov',
        website: 'https://autosidorov.by'
      }
    }
  ]);

  const [support, setSupport] = useState<SupportTicket[]>([
    { id: 1, user: 'Иван Иванов (Заказчик)', text: 'Здравствуйте, я случайно отменил заказ, как его восстановить?', status: 'in_progress', time: '10 мин назад', replies: [] }
  ]);

  const [content, setContent] = useState<ContentState>({
    faq: [
      {
        id: 'how',
        question: 'Как это работает?',
        answer: '**Для заказчиков**\n1. Выберите услугу и заполните форму заказа.\n2. Ваш заказ отправляется всем подходящим СТО.\n3. Получайте отклики с предложениями и ценами.\n4. Выберите лучшее предложение и свяжитесь с исполнителем.\n\n**Для исполнителей**\n1. Зарегистрируйте свой профиль (Партнер, Профи или Лидер).\n2. Получайте уведомления о новых заказах в вашем регионе.\n3. Отправляйте отклики клиентам.\n4. Выполняйте работу и получайте отзывы.'
      }
    ],
    rules: 'Здесь будут описаны подробные правила работы приложения, права и обязанности сторон, а также условия использования сервиса.',
    privacy: 'Здесь будет описана политика конфиденциальности, информация о том, как мы собираем, используем и защищаем ваши персональные данные.',
    templates: 'Шаблон 1: Ваш заказ принят!\nШаблон 2: Исполнитель найден.'
  });

  return (
    <DataContext.Provider value={{
      contractors, setContractors,
      orders, setOrders,
      customers, setCustomers,
      payments, setPayments,
      banners, setBanners,
      moderation, setModeration,
      support, setSupport,
      content, setContent,
      serviceCategories, setServiceCategories
    }}>
      {children}
    </DataContext.Provider>
  );
};
