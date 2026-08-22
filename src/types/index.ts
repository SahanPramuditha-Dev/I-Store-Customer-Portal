export interface StoreProfile {
  id: string;
  name: string;
  tagline: string;
  logo_url?: string;
  phone?: string;
  address?: string;
  whatsapp_number?: string;
  tax_id?: string;
  theme_color?: string;
  industry_type?: string;
  enable_repairs?: boolean;
  enable_warranty?: boolean;
  enable_trade_ins?: boolean;
  enable_loyalty_program?: boolean;
  loyalty_rate_lkr_per_point?: number;
}

export const DEFAULT_STORE: StoreProfile = {
  id: 'default',
  name: 'I-STORE',
  tagline: 'Digital Receipts & Warranty Portal',
  phone: '+94 11 234 5678',
  address: 'Liberty Plaza, Colombo 03',
  whatsapp_number: '94771234567',
  tax_id: '90218-VAT',
  theme_color: '#06b6d4',
  enable_loyalty_program: true,
  loyalty_rate_lkr_per_point: 1000,
};

export interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
  warrantyMonths: number;
  warrantyDays?: number;
  imeiOrSerial?: string;
}

export interface Invoice {
  id: string;
  token: string;
  storeId?: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  loyaltyPoints: number;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: 'Paid' | 'Pending';
  shortCode: string;
}

export interface RepairTicketRecord {
  id: string;
  store_id?: string;
  customer_phone: string;
  customer_name?: string;
  device_name: string;
  imei_or_serial?: string;
  issue_description: string;
  status: string;
  status_note?: string;
  estimated_cost?: number;
  advance_paid?: number;
  balance_due?: number;
  intake_photos?: Array<{ url: string; caption?: string; uploaded_at?: string }>;
  completion_photos?: Array<{ url: string; caption?: string; uploaded_at?: string }>;
  created_at: string;
}

export interface CustomerDevice {
  id: string;
  name: string;
  cleanName?: string;
  subTitle?: string;
  category?: 'phone' | 'laptop' | 'accessory' | 'repair_service';
  serialOrImei: string;
  purchaseDate: string;
  invoiceId: string;
  invoiceToken: string;
  warrantyMonths: number;
  warrantyDays: number;
  warrantyExpiryDate: Date;
  daysRemaining: number;
  status: 'active' | 'expiring' | 'expired';
  isNoWarranty?: boolean;
}

export interface WarrantyClaimRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  serialOrImei: string;
  invoiceId: string;
  issueCategory: string;
  issueDescription: string;
  contactPhone: string;
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Device Received' | 'Repairing' | 'Resolved' | 'Rejected';
  statusNote?: string;
  submittedAt: string;
  updatedAt: string;
}

export interface AppointmentRecord {
  id: string;
  deviceName: string;
  serviceType: string;
  date: string;
  timeSlot: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  notes?: string;
}
