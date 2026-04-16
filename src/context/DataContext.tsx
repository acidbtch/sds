import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Contractor, Order, ViewState } from '../types';
import { dictsApi, miscApi, adminApi } from '../lib/api';
import { useAuth } from './AuthContext';

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
  contractorUserId?: string;
  contractor: string;
  description?: string;
  status: 'active' | 'inactive';
  views?: number;
  clicks?: number;
  imageKey?: string;
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
  id: string;
  user: string;
  subject: string;
  text: string;
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  time: string;
  replies: SupportReply[];
  updatedAt?: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  services: string[];
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
  regionsData: Record<string, string[]>;
  carBrands: any[];
  setCarBrands: React.Dispatch<React.SetStateAction<any[]>>;
  carModels: Record<string, any[]>;
  setCarModels: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  isLoading: boolean;
  refreshAdminData: () => Promise<void>;
}

function extractSupportTickets(response: any): any[] {
  if (Array.isArray(response)) return response;
  return response?.items ?? response?.tickets ?? [];
}

function normalizeSupportStatus(status: any): SupportTicket['status'] {
  switch (String(status || '').toUpperCase()) {
    case 'OPEN':
      return 'open';
    case 'IN_PROGRESS':
      return 'in_progress';
    case 'WAITING_CUSTOMER':
      return 'waiting_customer';
    case 'RESOLVED':
      return 'resolved';
    case 'CLOSED':
      return 'closed';
    default:
      return 'open';
  }
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
  const { user } = useAuth();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [moderation, setModeration] = useState<ModerationItem[]>([]);
  const [support, setSupport] = useState<SupportTicket[]>([]);
  const [content, setContent] = useState<ContentState>({
    faq: [],
    rules: '',
    privacy: '',
    templates: ''
  });
  const [regionsData, setRegionsData] = useState<Record<string, string[]>>({});
  const [carBrands, setCarBrands] = useState<any[]>([]);
  const [carModels, setCarModels] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const refreshAdminData = useCallback(async () => {
    if (user?.role !== 'ADMIN') return;

    try {
        const [usersData, executorsData, ordersData, paymentsData, bannersData, faqData, contentData, brandsData, categoriesData, supportData] = await Promise.all([
          adminApi.getUsers().catch((e) => { console.error('API Error:', e); return []; }),
          adminApi.getExecutors().catch((e) => { console.error('API Error:', e); return []; }),
          adminApi.getOrders().catch((e) => { console.error('API Error:', e); return []; }),
        adminApi.getPayments().catch((e) => { console.error('API Error:', e); return []; }),
        adminApi.getBanners().catch((e) => { console.error('API Error:', e); return []; }),
        adminApi.getFaq().catch((e) => { console.error('API Error:', e); return []; }),
        adminApi.getContent().catch((e) => { console.error('API Error:', e); return []; }),
        adminApi.getCarBrands().catch((e) => { console.error('API Error:', e); return []; }),
        adminApi.getServiceCategories().catch((e) => { console.error('API Error:', e); return []; }),
        adminApi.getSupportTickets().catch((e) => { console.error('API Error:', e); return []; }),
      ]);

      setCustomers((usersData || [])
        .filter((u: any) => u.role === 'CUSTOMER')
        .map((u: any) => ({
          id: u.id,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
          phone: u.profile?.phone || '',
          tgId: u.username,
          regDate: u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : '',
          orders: 0,
          status: u.is_blocked ? 'blocked' : 'active',
        })));

      setContractors((executorsData || []).map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        name: c.legal_name || c.short_name || '',
        shortName: c.short_name || '',
        profileType: (c.tier === 'LEADER' ? 'leader' : c.tier === 'PROFI' ? 'pro' : 'partner') as Contractor['profileType'],
        rating: c.rating || 5,
        reviewsCount: c.reviews_count || 0,
        completedOrders: c.completed_orders_count || 0,
        registrationDate: c.created_at ? new Date(c.created_at).toLocaleDateString('ru-RU') : '',
        description: c.description || '',
        services: (c.services || []).map((s: any) => s.name),
        regions: (c.regions || []).map((r: any) => r.name),
        address: c.address || '',
        workingHours: c.working_hours || '',
        phone: c.phone || '',
        instagram: c.instagram_url || '',
        website: c.website_url || '',
        logo: c.logo_url || '',
        photos: c.portfolio_photos || [],
        legalDocs: c.legal_documents || [],
        video: '',
        unp: c.unp || '',
        legalStatus: c.legal_status || '',
        subEnd: c.subscription_until ? new Date(c.subscription_until).toLocaleDateString('ru-RU') : '',
      })));

      setOrders((ordersData || []).map((o: any) => ({
        id: o.id,
        serviceType: o.service_name || o.service_id || '',
        carMake: o.car_brand_name || o.car_brand_id || '',
        carModel: o.car_model_name || o.car_model_id || '',
        year: o.year?.toString() || '',
        region: o.region_name || o.region_id || '',
        customerName: o.owner_name || '',
        date: o.created_at ? new Date(o.created_at).toLocaleDateString('ru-RU') : '',
        deadline: o.deadline ? new Date(o.deadline).toLocaleDateString('ru-RU') : '',
        status: o.status === 'SEARCHING' ? 'pending' : o.status === 'MATCHED' ? 'active' : o.status === 'COMPLETED' ? 'completed' : 'cancelled',
        description: o.description || '',
        responses: [],
        engine: o.engine_type,
        gearbox: o.gearbox_type,
        drive: o.drive_type,
        body: o.body_type,
        phone: o.owner_phone,
        media: o.photos || [],
      })));

      setPayments((paymentsData || []).map((p: any) => ({
        id: p.id,
        user: p.user_name || p.user_id || '',
        purpose: p.purpose || '',
        amount: `${p.amount || 0} BYN`,
        status: p.status === 'SUCCESS' ? 'Успешно' : 'Ошибка',
        date: p.created_at ? new Date(p.created_at).toLocaleString('ru-RU') : '',
        error: p.error || undefined,
      })));

      setBanners((bannersData || []).map((b: any) => ({
        id: b.id,
        contractorId: b.executor_id,
        contractorUserId: b.executor_id,
        contractor: b.title || '',
        description: b.description || '',
        status: b.is_active ? 'active' : 'inactive',
        views: b.views || 0,
        clicks: b.clicks || 0,
        imageKey: b.image_key || '',
        logo: b.image_url || '',
      })));

      setContent({
        faq: (faqData || []).map((f: any) => ({ id: f.id, question: f.question, answer: f.answer })),
        rules: (contentData || []).find((c: any) => c.key === 'rules')?.value || '',
        privacy: (contentData || []).find((c: any) => c.key === 'privacy')?.value || '',
        templates: (contentData || []).find((c: any) => c.key === 'templates')?.value || '',
      });

      setModeration((executorsData || [])
        .filter((c: any) => c.moderation_status === 'PENDING')
        .map((c: any, index: number) => ({
          id: index + 1,
          type: 'new' as const,
          name: c.short_name || c.legal_name || '',
          profile: (c.tier === 'LEADER' ? 'leader' : c.tier === 'PROFI' ? 'pro' : 'partner') as 'leader' | 'pro' | 'partner',
          date: c.created_at ? new Date(c.created_at).toLocaleDateString('ru-RU') : '',
          status: 'new' as const,
          data: {
            id: c.id,
            legalStatus: c.legal_status,
            name: c.legal_name,
            unp: c.unp,
            shortName: c.short_name,
            description: c.description,
            services: (c.services || []).map((s: any) => s.name),
            regions: (c.regions || []).map((r: any) => r.name),
            phone: c.phone,
            instagram: c.instagram_url,
            website: c.website_url,
            logo: c.logo_url,
          },
          oldData: undefined,
        })));

      setSupport(extractSupportTickets(supportData).map((t: any) => ({
        id: String(t.id),
        user: `Пользователь ${t.user_id}`,
        subject: t.subject || '',
        text: t.last_message || t.subject || '',
        status: normalizeSupportStatus(t.status),
        time: t.created_at ? new Date(t.created_at).toLocaleString('ru-RU') : '',
        replies: [],
        updatedAt: t.last_message_at ? new Date(t.last_message_at).getTime() : Date.now(),
      }))); 

        setCarBrands(brandsData || []);
        setServiceCategories((categoriesData || []).map((cat: any) => ({ 
          id: cat.id, 
          name: cat.name, 
          services: (cat.services || []).map((s: any) => s.name) 
        })));
      } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  }, [user?.role]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [faqData, bannersData, regionsApiData, categoriesData, brandsData] = await Promise.all([
          miscApi.getFaq().catch((e) => { console.error('API Error:', e); return []; }),
          miscApi.getBanners().catch((e) => { console.error('API Error:', e); return []; }),
          dictsApi.getRegions().catch((e) => { console.error('API Error:', e); return []; }),
          dictsApi.getServiceCategories().catch((e) => { console.error('API Error:', e); return []; }),
          Promise.resolve([]), // Removed getCarBrands() to save initial load
        ]);

        if (faqData && faqData.length > 0) {
          setContent(prev => ({ ...prev, faq: faqData }));
        }
        
        if (bannersData && bannersData.length > 0) {
          const mappedBanners = bannersData.map((b: any) => ({
            id: b.id,
            contractor: b.title,
            description: b.description,
            status: 'active' as const,
            imageKey: b.image_key || '',
            logo: b.image_url
          }));
          setBanners(mappedBanners);
        }

        if (regionsApiData && regionsApiData.length > 0) {
          const newRegionsData: Record<string, string[]> = {};
          const parentRegions = regionsApiData.filter((r: any) => !r.parent_id);
          
          parentRegions.forEach((parent: any) => {
            newRegionsData[parent.name] = regionsApiData
              .filter((r: any) => r.parent_id === parent.id)
              .map((r: any) => r.name);
          });
          newRegionsData['Вся Беларусь'] = [];
          setRegionsData(newRegionsData);
        }

        if (categoriesData && categoriesData.length > 0) {
          const mappedCategories = categoriesData.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            services: (cat.services || []).map((s: any) => s.name)
          }));
          setServiceCategories(mappedCategories);
        }

        if (brandsData && brandsData.length > 0) {
          setCarBrands(brandsData);
        }

      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    refreshAdminData();
  }, [refreshAdminData]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;

    let intervalId: ReturnType<typeof setTimeout> | null = null;

    const handleFocus = () => {
      refreshAdminData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAdminData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    intervalId = setInterval(() => {
      refreshAdminData();
    }, 20000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalId) {
        clearTimeout(intervalId);
      }
    };
  }, [user?.role, refreshAdminData]);

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
      serviceCategories, setServiceCategories,
      regionsData,
      carBrands, setCarBrands,
      carModels, setCarModels,
      isLoading,
      refreshAdminData
    }}>
      {children}
    </DataContext.Provider>
  );
};
