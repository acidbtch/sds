import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Contractor, Order, ViewState } from '../types';
import { dictsApi, miscApi, adminApi } from '../lib/api';
import { mapAdminCustomerFromApi } from '../lib/adminCustomerOrders';
import { mapExecutorModerationFromApi } from '../lib/executorModeration';
import { mapOrderFromApi } from '../lib/orderMapping';
import { useAuth } from './AuthContext';
import { shouldRefreshAfterAppResume } from '../lib/appLifecycle';
import { getFulfilledAdminData } from '../lib/adminRefresh';
import { getSupportTicketUserLabel } from '../lib/supportTicketDisplay';
import { isAdminRole, normalizeUserRole } from '../lib/authUser';
import { getContentTextByKey, mapFaqItemsFromApi } from '../lib/contentMapping';
import { getExecutorDisplayProfile, getExecutorMediaUrl } from '../lib/executorProfileDisplay';

// Define the types for our context state
interface Customer {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  tgId: string;
  telegramId?: string;
  username?: string;
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
  refreshPublicData: (showLoading?: boolean) => Promise<void>;
  refreshAdminData: (options?: { force?: boolean }) => Promise<void>;
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

  const refreshAdminData = useCallback(async (options: { force?: boolean } = {}) => {
    if (!options.force && !isAdminRole(user?.role)) return;

    try {
      const [usersResult, executorsResult, ordersResult, paymentsResult, bannersResult, faqResult, contentResult, brandsResult, categoriesResult, supportResult, regionsResult] = await Promise.allSettled([
        adminApi.getUsers(),
        adminApi.getExecutors(),
        adminApi.getOrders(),
        adminApi.getPayments(),
        adminApi.getBanners(),
        adminApi.getFaq(),
        adminApi.getContent(),
        adminApi.getCarBrands(),
        adminApi.getServiceCategories(),
        adminApi.getSupportTickets(),
        dictsApi.getRegions(),
      ]);

      const usersData = getFulfilledAdminData(usersResult, 'users');
      const executorsData = getFulfilledAdminData(executorsResult, 'executors');
      const ordersData = getFulfilledAdminData(ordersResult, 'orders');
      const paymentsData = getFulfilledAdminData(paymentsResult, 'payments');
      const bannersData = getFulfilledAdminData(bannersResult, 'banners');
      const faqData = getFulfilledAdminData(faqResult, 'faq');
      const contentData = getFulfilledAdminData(contentResult, 'content');
      const brandsData = getFulfilledAdminData(brandsResult, 'car brands');
      const categoriesData = getFulfilledAdminData(categoriesResult, 'service categories');
      const supportData = getFulfilledAdminData(supportResult, 'support tickets');
      const moderationRegionsData = getFulfilledAdminData(regionsResult, 'regions');

      const mappedOrders = ordersData !== undefined
        ? (ordersData || []).map(mapOrderFromApi)
        : undefined;
      const mappedCustomers = usersData !== undefined && mappedOrders !== undefined
        ? (usersData || [])
          .filter((u: any) => {
            const role = normalizeUserRole(u.role);
            return role === 'CUSTOMER' || isAdminRole(role);
          })
          .map((u: any) => mapAdminCustomerFromApi(u, mappedOrders))
        : undefined;

      if (mappedCustomers !== undefined) {
        setCustomers(mappedCustomers);
      }

      if (executorsData !== undefined) {
        setContractors((executorsData || []).map((c: any) => {
          const profile = getExecutorDisplayProfile(c, {
            preferPending: c.moderation_status === 'PENDING' && !c.current_profile && !c.currentProfile,
          });

          return {
          id: c.id,
          userId: c.user_id,
          name: profile.legal_name || profile.name || profile.short_name || '',
          shortName: profile.short_name || '',
          profileType: ((profile.tier || c.tier) === 'LEADER' ? 'leader' : (profile.tier || c.tier) === 'PROFI' ? 'pro' : 'partner') as Contractor['profileType'],
          rating: c.rating || profile.rating || 5,
          reviewsCount: c.reviews_count || profile.reviews_count || 0,
          completedOrders: c.completed_orders_count || profile.completed_orders_count || 0,
          registrationDate: c.created_at ? new Date(c.created_at).toLocaleDateString('ru-RU') : '',
          description: profile.description || '',
          services: (c.services || profile.services || []).map((s: any) => s.name || s),
          regions: (c.regions || profile.regions || []).map((r: any) => r.name || r),
          address: profile.address || '',
          workingHours: profile.working_hours || profile.workingHours || '',
          phone: profile.phone || '',
          instagram: profile.instagram_url || profile.instagram || '',
          website: profile.website_url || profile.website || '',
          logo: profile.logo_url || getExecutorMediaUrl(profile.logo) || '',
          photos: profile.portfolio_photos || [],
          legalDocs: profile.legal_documents || [],
          video: '',
          unp: profile.unp || '',
          legalStatus: profile.legal_status || '',
          subEnd: c.subscription_until ? new Date(c.subscription_until).toLocaleDateString('ru-RU') : '',
          };
        }));

        setModeration((executorsData || [])
          .filter((c: any) => c.moderation_status === 'PENDING')
          .map((c: any, index: number) => mapExecutorModerationFromApi(c, index, {
            services: categoriesData || [],
            regions: moderationRegionsData || [],
          })));
      }

      if (mappedOrders !== undefined) {
        setOrders(mappedOrders);
      }

      if (paymentsData !== undefined) {
        setPayments((paymentsData || []).map((p: any) => ({
        id: p.id,
        user: p.user_name || p.user_id || '',
        purpose: p.purpose || '',
        amount: `${p.amount || 0} BYN`,
        status: p.status === 'SUCCESS' ? 'Успешно' : 'Ошибка',
        date: p.created_at ? new Date(p.created_at).toLocaleString('ru-RU') : '',
        error: p.error || undefined,
        })));
      }

      if (bannersData !== undefined) {
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
      }

      if (faqData !== undefined || contentData !== undefined) {
        setContent(prev => ({
          faq: faqData !== undefined
            ? mapFaqItemsFromApi(faqData)
            : prev.faq,
          rules: contentData !== undefined
            ? getContentTextByKey(contentData, 'rules')
            : prev.rules,
          privacy: contentData !== undefined
            ? getContentTextByKey(contentData, 'privacy')
            : prev.privacy,
          templates: contentData !== undefined
            ? getContentTextByKey(contentData, 'templates')
            : prev.templates,
        }));
      }

      if (supportData !== undefined) {
        const supportUsers = mappedCustomers || usersData || [];
        setSupport(extractSupportTickets(supportData).map((t: any) => ({
        id: String(t.id),
        user: getSupportTicketUserLabel(t, supportUsers),
        subject: t.subject || '',
        text: t.last_message || t.subject || '',
        status: normalizeSupportStatus(t.status),
        time: t.created_at ? new Date(t.created_at).toLocaleString('ru-RU') : '',
        replies: [],
        updatedAt: t.last_message_at ? new Date(t.last_message_at).getTime() : Date.now(),
        })));
      }

      if (brandsData !== undefined) {
        setCarBrands(brandsData || []);
      }

      if (categoriesData !== undefined) {
        setServiceCategories((categoriesData || []).map((cat: any) => ({ 
          id: cat.id, 
          name: cat.name, 
          services: (cat.services || []).map((s: any) => s.name) 
        })));
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  }, [user?.role]);

  const refreshPublicData = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
        const [faqData, bannersData, regionsApiData, categoriesData, brandsData, rulesContent, privacyContent] = await Promise.all([
          miscApi.getFaq().catch((e) => { console.error('API Error:', e); return []; }),
          miscApi.getBanners().catch((e) => { console.error('API Error:', e); return []; }),
          dictsApi.getRegions().catch((e) => { console.error('API Error:', e); return []; }),
          dictsApi.getServiceCategories().catch((e) => { console.error('API Error:', e); return []; }),
          Promise.resolve([]), // Removed getCarBrands() to save initial load
          miscApi.getContent('rules').catch((e) => { console.error('API Error:', e); return null; }),
          miscApi.getContent('privacy').catch((e) => { console.error('API Error:', e); return null; }),
        ]);

        if (faqData && faqData.length > 0) {
          setContent(prev => ({ ...prev, faq: mapFaqItemsFromApi(faqData) }));
        }

        if (rulesContent || privacyContent) {
          setContent(prev => ({
            ...prev,
            rules: rulesContent ? (rulesContent.content ?? rulesContent.value ?? prev.rules) : prev.rules,
            privacy: privacyContent ? (privacyContent.content ?? privacyContent.value ?? prev.privacy) : prev.privacy,
          }));
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
          newRegionsData['Беларусь'] = [];
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
      console.error('Failed to fetch public data:', error);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshPublicData(true);
  }, [refreshPublicData]);

  useEffect(() => {
    refreshAdminData();
  }, [refreshAdminData]);

  useEffect(() => {
    let hiddenAt: number | null = null;
    let lastResumeRefreshAt = Date.now();

    const refreshAfterResume = () => {
      const now = Date.now();
      if (!shouldRefreshAfterAppResume({ now, hiddenAt, lastRefreshAt: lastResumeRefreshAt })) {
        return;
      }

      lastResumeRefreshAt = now;
      hiddenAt = null;
      void refreshPublicData(false);
      void refreshAdminData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }

      refreshAfterResume();
    };

    window.addEventListener('focus', refreshAfterResume);
    window.addEventListener('pageshow', refreshAfterResume);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', refreshAfterResume);
      window.removeEventListener('pageshow', refreshAfterResume);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshPublicData, refreshAdminData]);

  useEffect(() => {
    if (!isAdminRole(user?.role)) return;

    const intervalId = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      refreshAdminData();
    }, 20000);

    return () => {
      clearInterval(intervalId);
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
      refreshPublicData,
      refreshAdminData
    }}>
      {children}
    </DataContext.Provider>
  );
};
