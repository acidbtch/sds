export type ViewState = 
  | 'home' 
  | 'customer_menu'
  | 'order_form' 
  | 'customer_orders' 
  | 'contractor_menu' 
  | 'contractor_register' 
  | 'contractor_cabinet' 
  | 'contractors_catalog'
  | 'faq' 
  | 'support'
  | 'admin_panel';

export interface Contractor {
  id: string;
  userId?: string;
  name: string;
  shortName: string;
  description: string;
  services: string[];
  regions: string[];
  rating: number;
  reviewsCount: number;
  completedOrders: number;
  profileType: 'partner' | 'pro' | 'leader' | 'Партнёр' | 'Профи' | 'Лидер';
  registrationDate: string;
  phone: string;
  address?: string;
  logo?: string;
  workingHours?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
  photos?: string[];
  legalStatus?: string;
  unp?: string;
  legalDocs?: string[];
  schedule?: any;
  subEnd?: string;
  reviews?: any[];
  bannerText?: string;
}

export interface Order {
  id: string;
  serviceType: string;
  carMake: string;
  carModel: string;
  year?: string;
  gearbox?: string;
  body?: string;
  engine?: string;
  drive?: string;
  region?: string;
  phone?: string;
  customerName?: string;
  customerId?: string;
  customerUserId?: string;
  customerTelegramId?: string;
  customerUsername?: string;
  deadline?: string;
  vin?: string;
  media?: string[];
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  date: string;
  createdAt?: string;
  description: string;
  responses: ContractorResponse[];
  responsesCount?: number;
  refusedBy?: string[];
  acceptedContractorId?: string;
}

export interface ContractorResponse {
  id: string;
  contractorId?: string;
  contractorName: string;
  rating: number;
  reviewsCount: number;
  profileType: 'partner' | 'pro' | 'leader' | 'Партнёр' | 'Профи' | 'Лидер';
  message?: string;
  workingHours?: string;
  price?: string;
}

export interface SupportMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  isAdmin: boolean;
  read: boolean;
}
