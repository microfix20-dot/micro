
export enum JobStatus {
  PENDING = 'pending',
  CHECKING = 'checking',
  WAITING_PART = 'waiting_part',
  WAITING_PARTS = 'waiting_parts',
  DIAGNOSING = 'diagnosing',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  COMPLETED = 'completed',
  COLLECTED = 'collected',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export type StaffRole = 'Admin' | 'Manager' | 'Technician' | 'Receptionist' | 'Cashier' | 'Inventory';

export interface Staff {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: StaffRole;
  pin: string;
  active: boolean;
}

export interface Customer {
  id: string | number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
  // Supabase compatibility
  full_name?: string;
  phone_number?: string;
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  barcode?: string;
}

export interface SaleItem {
  inventoryItemId: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export interface PaymentSplit {
  method: string;
  amount: number;
  reference?: string;
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'Transfer' | 'DuitNow' | 'TNG eWallet' | 'GrabPay' | 'Split';
  paymentDetails?: PaymentSplit[];
  transactionRef?: string;
  customerId?: string | number;
  jobId?: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  template?: string;
}

export interface DiagnosisResult {
  causes: string[];
  steps: string[];
  difficulty: number;
  summary: string;
  sources?: { title: string; url: string }[];
}

export interface JobHistory {
  status: JobStatus;
  date: string;
  note: string;
}

export interface JobSheet {
  id: string;
  customer: Customer;
  device: {
    type: string;
    brand: string;
    model: string;
    serialNumber: string;
    condition: string;
    accessories: string;
    password?: string;
  };
  issueDescription: string;
  technicianNotes?: string;
  estimatedCost: number;
  finalCost?: number;
  advanceAmount: number;
  status: JobStatus;
  createdAt: string;
  expectedDelivery: string;
  images?: string[];
  customerSignature?: string;
  assignedTechnicianId?: string;
  selectedTCTemplateId?: string;
  parts?: SaleItem[];
  aiDiagnosis?: DiagnosisResult;
  history: JobHistory[];
}

export interface RepairJob {
  id: number;
  customer_id: number;
  device_model: string;
  problem_description: string;
  estimated_price: number;
  status: JobStatus;
  technician_id: string;
  created_at: string;
  technician_notes?: string;
  // Joined data
  customers?: Customer;
  profiles?: Profile;
}

export interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'technician';
  created_at: string;
}

export interface TCTemplate {
  id: string;
  name: string;
  content: string;
}

export interface PrintSettings {
  defaultPrinter: string;
  receiptPaperSize: string;
  receiptLayout: string;
  labelSize: string;
  autoPrint: boolean;
  showLogo: boolean;
}

export interface WhatsAppTemplates {
  jobCreated: string;
  statusUpdate: string;
  jobCompleted: string;
  invoice: string;
}

export interface MyInvoisSettings {
  environment: 'Sandbox' | 'Production';
  clientId: string;
  clientSecret: string;
  digitalCertPass: string;
  isConfigured: boolean;
}

export interface PaymentGatewayConfig {
  provider: 'Manual' | 'Stripe' | 'PayPal';
  enabled: boolean;
  apiKey: string;
  secretKey: string;
}

export interface TaxReliefItem {
  id: string;
  label: string;
  maxLimit: number;
  value: number;
}

export interface FinancialAdjustments {
  fixedAssets: number;
  otherCurrentAssets: number;
  currentLiabilities: number;
}

export interface AppSettings {
  storeName: string;
  tagline?: string;
  isActivated: boolean;
  licenseKey?: string;
  language: 'en' | 'ms';
  currency: string;
  address: string;
  phone: string;
  email: string;
  primaryColor?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  taxRate: number;
  taxName: string;
  tin?: string;
  sstNumber?: string;
  msicCode?: string;
  businessActivity?: string;
  companyRegNo?: string;
  termsAndConditions: string;
  termsTemplates: TCTemplate[];
  defaultTCTemplateId: string;
  invoicePrefix: string;
  invoiceNextNumber: number;
  defaultQuoteTemplate: QuoteTemplate;
  whatsappTemplates: WhatsAppTemplates;
  myInvois?: MyInvoisSettings;
  googleDrive?: {
    isConnected: boolean;
    autoBackup: boolean;
    lastBackupDate?: string;
    clientId?: string;
    apiKey?: string;
  };
  paymentGateways: PaymentGatewayConfig[];
  printSettings: PrintSettings;
  inventoryCategories: string[];
  deviceBrands: string[];
  deviceTypes: string[];
  commonAccessories: string[];
  commonConditions: string[];
  financialAdjustments?: FinancialAdjustments;
}

export interface ExpenseDocument {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  imageUrl: string;
}

export type ExpenseCategory = 'Bank Statement' | 'Sales Invoice' | 'Purchase Invoice' | 'Payment Voucher' | 'Cash Voucher' | 'Other';

export interface Quotation {
  id: string;
  customerId: string | number;
  date: string;
  expiryDate: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Converted';
  notes: string;
  template: QuoteTemplate;
  invoiceId?: string;
  eInvoice?: EInvoiceDetails;
}

export interface EInvoiceDetails {
  buyerTin: string;
  buyerRegNo: string;
  buyerSst: string;
  buyerMsic: string;
  classification: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  date: string;
  items: { inventoryItemId: string; quantity: number; cost: number }[];
  total: number;
  status: 'Ordered' | 'Received';
}

export type QuoteTemplate = 'modern' | 'classic' | 'technical';