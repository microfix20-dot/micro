
import { InventoryItem, JobSheet, Customer, Staff, AppSettings, ExpenseDocument, JobStatus, StaffRole } from '../types';

// Helper to create items quickly
const createItem = (id: number, name: string, price: number, category: string): InventoryItem => ({
  id: `INIT-${id}`,
  name: name.trim(),
  sku: `SKU-${category.substring(0, 3).toUpperCase()}-${id.toString().padStart(4, '0')}`,
  category: category,
  quantity: 5, // Default stock for imported items
  costPrice: Math.floor(price * 0.5), // Estimate cost as 50% of sell price
  sellingPrice: price,
  lowStockThreshold: 2,
});

// Role Access Configuration
export const ROLE_ACCESS_CONFIG: Record<string, string[]> = {
  dashboard: ['Admin', 'Manager', 'Technician', 'Receptionist', 'Cashier', 'Inventory'],
  pos: ['Admin', 'Manager', 'Receptionist', 'Cashier'],
  quotations: ['Admin', 'Manager', 'Receptionist'],
  jobs: ['Admin', 'Manager', 'Technician', 'Receptionist'],
  customers: ['Admin', 'Manager', 'Receptionist', 'Cashier'],
  inventory: ['Admin', 'Manager', 'Technician', 'Inventory'],
  purchases: ['Admin', 'Manager', 'Inventory'],
  expenses: ['Admin', 'Manager'],
  reports: ['Admin', 'Manager'],
  settings: ['Admin', 'Manager'],
};

// Parsed data from provided OCR text
export const INITIAL_INVENTORY_DATA: InventoryItem[] = [
  // --- BATTERIES (Apple) ---
  createItem(1, "BATT (OEM) IP-5", 13, "Battery"),
  createItem(2, "BATT (OEM) IP-5S/IP-5C", 13, "Battery"),
  createItem(3, "BATT (OEM) IP-6", 16, "Battery"),
  createItem(4, "BATT (OEM) IP-6PLUS", 20, "Battery"),
  createItem(5, "BATT (OEM) IP-6S", 17, "Battery"),
  createItem(6, "BATT (OEM) IP-6SPLUS", 20, "Battery"),
  createItem(7, "BATT (OEM) IP-7", 17, "Battery"),
  createItem(8, "BATT (OEM) IP-7PLUS", 22, "Battery"),
  createItem(9, "BATT (OEM) IP-8", 17, "Battery"),
  createItem(10, "BATT (OEM) IP-8PLUS", 22, "Battery"),
  createItem(11, "BATT (OEM) IP-X", 35, "Battery"),
  createItem(12, "BATT (OEM) IP-XR", 32, "Battery"),
  createItem(13, "BATT (OEM) IP-XS", 35, "Battery"),
  createItem(14, "BATT (OEM) IP-XSMAX", 36, "Battery"),
  createItem(15, "BATT (OEM) IP-11", 32, "Battery"),
  createItem(16, "BATT (OEM) IP-11PRO", 42, "Battery"),
  createItem(17, "BATT (OEM) IP-11PROMAX", 45, "Battery"),
  createItem(18, "BATT (OEM) IP-12 MINI", 32, "Battery"),
  createItem(19, "BATT (OEM) IP-12/12 PRO", 32, "Battery"),
  createItem(20, "BATT (OEM) IP-12 PROMAX", 45, "Battery"),
  createItem(21, "BATT (OEM) IP-13", 32, "Battery"),
  createItem(22, "BATT (OEM) IP-13PRO", 45, "Battery"),
  createItem(23, "BATT (OEM) IP-13PM", 50, "Battery"),
  
  // --- BATTERIES (Android/Other) ---
  createItem(30, "BATT OEM (BLP537) OPPO", 20, "Battery"),
  createItem(31, "BATT OEM (BLP631) OPPO-F7", 29, "Battery"),
  createItem(32, "BATT OEM (BLP597) ONE PLUS", 24, "Battery"),
  createItem(33, "BATT OEM (BLP657) ONEPLUS 6", 27, "Battery"),
  createItem(34, "BATT OEM (BLP721) REALME-C2", 26, "Battery"),
  createItem(35, "BATT OEM (BM46) REDMI-NOTE3", 24, "Battery"),
  createItem(36, "BATT OEM (BN30) REDMI-4A", 20, "Battery"),
  createItem(37, "BATT OEM (HB366481ECW) HW-P9/HONOR 8", 22, "Battery"),
  createItem(38, "BATT OEM - SAM-J7", 13, "Battery"),

  // --- LCD SCREENS (Apple) ---
  createItem(500, "LCD FULL SET (AA TFT) IP 11", 40, "Screen"),
  createItem(501, "LCD FULL SET (GX OLED) IP 11", 155, "Screen"),
  createItem(502, "LCD FULL SET (JK TFT INCELL) IP 12", 115, "Screen"),
  createItem(503, "LCD FULL SET (GX OLED) IP 12", 165, "Screen"),
  createItem(504, "LCD FULL SET (JK TFT INCELL) IP 13", 76, "Screen"),
  createItem(505, "LCD FULL SET (GX OLED) IP 13", 175, "Screen"),
  createItem(506, "LCD FULL SET (JK TFT INCELL) IP 14", 80, "Screen"),
  createItem(507, "LCD FULL SET (GX OLED) IP 14", 175, "Screen"),
  createItem(508, "LCD FULL SET (JK TFT INCELL) IP 15", 92, "Screen"),
  createItem(509, "LCD FULL SET (GX OLED) IP 15", 535, "Screen"),
  createItem(519, "LCD FULL SET (ORI) IP 13 PRO (NO WARRANTY)", 1190, "Screen"),
  createItem(520, "LCD FULL SET (ORI NEW) IP 14 PRO", 1280, "Screen"),

  // --- LCD SCREENS (Android) ---
  createItem(510, "LCD FULL SET (ORI) SAM A10", 28, "Screen"),
  createItem(511, "LCD FULL SET (ORI) SAM A12", 32, "Screen"),
  createItem(512, "LCD FULL SET (ORI) SAM A32 (4G)", 110, "Screen"),
  createItem(513, "LCD FULL SET (ORI) SAM A51", 220, "Screen"),
  createItem(514, "LCD FULL SET (ORI) OPPO A15", 26, "Screen"),
  createItem(515, "LCD FULL SET (ORI) OPPO A53", 28, "Screen"),
  createItem(516, "LCD FULL SET (ORI) VIVO Y20", 25, "Screen"),
  createItem(517, "LCD FULL SET (ORI) REDMI 9", 30, "Screen"),
  createItem(518, "LCD FULL SET (ORI) REDMI NOTE 10", 255, "Screen"),

  // --- CHARGING PORTS ---
  createItem(400, "RIBBON FLEX CHARGING (ORI) IPHONE 11", 20, "ChargingPort"),
  createItem(401, "RIBBON FLEX CHARGING (ORI) IPHONE 12", 25, "ChargingPort"),
  createItem(402, "RIBBON FLEX CHARGING (ORI) IPHONE 13", 35, "ChargingPort"),
  createItem(403, "RIBBON FLEX CHARGING (ORI) IPHONE 14", 40, "ChargingPort"),
  createItem(404, "RIBBON FLEX CHARGING (ORI) IPHONE 15", 55, "ChargingPort"),
  createItem(405, "CHARGING BOARD (AA) SAMSUNG A10", 6, "ChargingPort"),
  createItem(406, "CHARGING BOARD (ORI) SAMSUNG A51", 12, "ChargingPort"),
  createItem(407, "CHARGING BOARD (AA) OPPO A5 2020", 8, "ChargingPort"),
  createItem(408, "CHARGING BOARD (ORI) VIVO Y20", 16, "ChargingPort"),
  createItem(409, "CHARGING BOARD (AA) REDMI NOTE 8", 8, "ChargingPort"),
  createItem(410, "RIBBON FLEX CHARGING - AIRPODS 3", 15, "ChargingPort"),

  // --- CAMERAS ---
  createItem(300, "REAR CAMERA - IP 11", 38, "Camera"),
  createItem(301, "REAR CAMERA - IP 12", 75, "Camera"),
  createItem(302, "REAR CAMERA - IP 13", 45, "Camera"),
  createItem(303, "REAR CAMERA - IP 14", 135, "Camera"),
  createItem(304, "REAR CAMERA - IP 15", 105, "Camera"),
  createItem(305, "FRONT CAMERA - IP 11", 15, "Camera"),
  createItem(306, "FRONT CAMERA - IP 12", 16, "Camera"),
  createItem(310, "REAR CAMERA - SAMSUNG A12", 18, "Camera"),
  createItem(311, "REAR CAMERA - OPPO A15", 20, "Camera"),
  createItem(312, "REAR CAMERA - VIVO Y20", 18, "Camera"),
  createItem(313, "REAR CAMERA - XIAOMI 11 (1SET 3PCS)", 110, "Camera"),

  // --- BUTTONS ---
  createItem(100, "ON/OFF + VOLUME BUTTON - IP 12/12MINI", 5, "Button"),
  createItem(101, "ON/OFF + VOLUME BUTTON - IP 13/13MINI", 5, "Button"),
  createItem(104, "HOME BUTTON - IPHONE 5", 1, "Button"),
  createItem(105, "HOME BUTTON - IPAD 2", 1, "Button"),
  createItem(106, "ON/OFF BUTTON - SAMSUNG A10/A20", 3, "Button"),
  createItem(107, "ON/OFF BUTTON - OPPO A3S", 3, "Button"),
  createItem(109, "POWER BUTTON - APP WATCH S4/S5", 5, "Button"),

  // --- BUZZERS & SPEAKERS ---
  createItem(200, "BUZZER FULL SET - IPHONE 11", 10, "Buzzer"),
  createItem(201, "BUZZER FULL SET - IPHONE 12", 25, "Buzzer"),
  createItem(206, "SPEAKER - IPHONE 11", 10, "Speaker"),
  createItem(207, "SPEAKER - IPHONE 12", 22, "Speaker"),
  createItem(211, "SPEAKER - AIRPODS 3", 45, "Speaker"),

  // --- SIM TRAYS ---
  createItem(600, "SIM TRAY - IPHONE 11", 3, "SimTray"),
  createItem(601, "SIM TRAY - IPHONE 12", 3, "SimTray"),
  createItem(602, "SIM TRAY - IPHONE 13", 3, "SimTray"),
  createItem(603, "SIM TRAY - IPHONE 14", 3, "SimTray"),
  createItem(605, "SIM TRAY - SAMSUNG A01", 3, "SimTray"),

  // --- ICs ---
  createItem(700, "AUDIO IC (338S00537) IPHONE 12", 12, "IC"),
  createItem(701, "AUDIO IC - IPHONE 13 (338S00739)", 16, "IC"),
  createItem(702, "CHARGING IC - 1618A0 IP 14SERIES", 10, "IC"),
  createItem(703, "POWER IC - 343S00354 IPHONE 11", 18, "IC"),
  createItem(704, "NAND FLASH 128GB IPHONE 8-11", 40, "IC"),
  createItem(705, "WIFI IC - 339S00761 IP 12-14 SERIES", 12, "IC"),

  // --- HOUSING ---
  createItem(800, "LCD FRAME - IP 11", 4, "Housing"),
  createItem(801, "LCD FRAME - IP 12", 4, "Housing"),
  createItem(802, "LCD FRAME - IP 13", 5, "Housing"),
  createItem(805, "BACK GLASS - IP 11", 15, "Housing"),
  createItem(807, "MIDDLE FRAME + RIBBON - APP WATCH S4", 55, "Housing"),

  // --- LENS ---
  createItem(900, "CAMERA LENS - IPHONE 11", 2, "Lens"),
  createItem(901, "CAMERA LENS - IPHONE 12", 2, "Lens"),
  createItem(902, "CAMERA LENS - IPHONE 13", 2, "Lens"),
  createItem(903, "CAMERA LENS - IPHONE 14", 3, "Lens"),

  // --- TOUCH SCREENS & GLASS ---
  createItem(950, "TOUCH SCREEN (ORI) IPAD 10 (2022)", 60, "TouchScreen"),
  createItem(951, "TOUCH SCREEN (AA) IPAD 2", 22, "TouchScreen"),
  createItem(952, "FRONT GLASS + OCA - IPHONE 11", 6, "Glass"),
  createItem(953, "FRONT GLASS + OCA - IPHONE 12", 6, "Glass"),
  
  // --- RIBBONS ---
  createItem(1000, "RIBBON FACE ID SENSOR - IPAD PRO 11", 45, "Ribbon"),
  createItem(1001, "RIBBON VOLUME - IPAD PRO 11", 18, "Ribbon"),
  createItem(1002, "RIBBON FLASH LIGHT - IPHONE 12", 15, "Ribbon"),
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'John Doe', phone: '1234567890', createdAt: new Date().toISOString() },
  { id: 'c2', name: 'Sarah Smith', phone: '9876543210', createdAt: new Date().toISOString() },
];

export const INITIAL_JOBS: JobSheet[] = [
  {
    id: 'JOB-1001',
    customer: INITIAL_CUSTOMERS[0],
    device: { type: 'Smartphone', brand: 'Apple', model: 'iPhone 13', serialNumber: 'SN123', condition: 'Used', accessories: 'None' },
    issueDescription: 'Screen cracked, touch not working',
    estimatedCost: 150,
    advanceAmount: 0,
    status: JobStatus.IN_PROGRESS,
    createdAt: new Date().toISOString(),
    expectedDelivery: new Date().toISOString(),
    images: [],
    history: [{ status: JobStatus.IN_PROGRESS, date: new Date().toISOString(), note: 'Started repair' }]
  },
  {
    id: 'JOB-1002',
    customer: INITIAL_CUSTOMERS[1],
    device: { type: 'Laptop', brand: 'Dell', model: 'XPS 15', serialNumber: 'SN999', condition: 'Good', accessories: 'Charger' },
    issueDescription: 'Overheating and shutting down',
    estimatedCost: 80,
    advanceAmount: 20,
    status: JobStatus.PENDING,
    createdAt: new Date().toISOString(),
    expectedDelivery: new Date().toISOString(),
    images: [],
    history: []
  }
];

export const INITIAL_STAFF: Staff[] = [
   { id: 's1', name: 'Admin azulrustam', username: 'azulrustam', email: 'azulrustam@gmail.com', role: 'Admin', pin: '123456', active: true },
   { id: 's2', name: 'Mike Tech', username: 'mike', email: 'mike@fixmaster.com', role: 'Technician', pin: '000000', active: true },
];

export const INITIAL_EXPENSES: ExpenseDocument[] = [
  {
     id: 'EXP-1',
     description: 'Shop Rent - Current Month',
     amount: 1500,
     category: 'Payment Voucher',
     date: new Date().toISOString(),
     imageUrl: ''
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  storeName: 'FixMaster Pro',
  tagline: 'Repair Shop OS',
  isActivated: true, 
  language: 'en',
  primaryColor: '#2563eb',
  address: '123 Tech Street, Silicon Valley, CA',
  phone: '(555) 123-4567',
  email: 'contact@fixmaster.com',
  currency: 'RM',
  taxName: 'SST',
  taxRate: 0.06,
  tin: '',
  sstNumber: '',
  msicCode: '95211', 
  businessActivity: 'Repair and maintenance of mobile phones',
  companyRegNo: '',
  termsAndConditions: 'Warranty void if seal broken. Not responsible for data loss.',
  termsTemplates: [
    { id: 'standard', name: 'Standard Terms', content: 'Warranty void if seal broken. Not responsible for data loss.' }
  ],
  defaultTCTemplateId: 'standard',
  invoicePrefix: 'INV-',
  invoiceNextNumber: 1001,
  defaultQuoteTemplate: 'modern',
  heroImageUrl: 'https://i.imgur.com/hFaII7U.jpeg',
  deviceBrands: ['Apple', 'Samsung', 'Google', 'Dell', 'HP', 'Lenovo', 'Sony', 'Microsoft', 'Huawei', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'OnePlus'],
  deviceTypes: ['Smartphone', 'Laptop', 'Tablet', 'Smartwatch', 'Console', 'Desktop', 'Other'],
  commonAccessories: ['SIM Card', 'Charger', 'Casing', 'Memory Card', 'Box', 'Stylus', 'Bag', 'Cable', 'SD Tray', 'Keyboard', 'Mouse', 'Pen'],
  commonConditions: ['Cracked Screen', 'Water Damage', 'No Power', 'Charging Issue', 'Dented Body', 'Pristine', 'Boot Loop', 'Overheating', 'No Signal', 'Battery Swollen'],
  inventoryCategories: ['Part', 'Battery', 'Screen', 'TouchScreen', 'Glass', 'Camera', 'ChargingPort', 'Ribbon', 'Button', 'Buzzer', 'Speaker', 'Housing', 'IC', 'Lens', 'SimTray', 'Accessory', 'UsedDevice', 'Service', 'Tool', 'Other'],
  printSettings: {
    defaultPrinter: '',
    receiptPaperSize: '80mm',
    receiptLayout: 'Standard',
    labelSize: 'Standard',
    autoPrint: true,
    showLogo: true
  },
  whatsappTemplates: {
    jobCreated: "Hello {customer}, your device ({device}) has been received. Ticket: {ticket}. You can track status here: {link}",
    statusUpdate: "Update for {customer}: Your device ({device}) status is now '{status}'. Track here: {link}",
    jobCompleted: "Great news {customer}! Your device ({device}) is ready for pickup. Total due: {total}. See you soon!",
    invoice: "Hello {customer}, here is your invoice {invoice} for {total}. Thank you for your business!"
  },
  myInvois: {
    environment: 'Sandbox',
    clientId: '',
    clientSecret: '',
    digitalCertPass: '',
    isConfigured: false
  },
  googleDrive: {
     isConnected: false,
     autoBackup: false
  },
  paymentGateways: [
    { provider: 'Manual', enabled: true, apiKey: '', secretKey: '' },
    { provider: 'Stripe', enabled: false, apiKey: '', secretKey: '' },
    { provider: 'PayPal', enabled: false, apiKey: '', secretKey: '' }
  ],
  financialAdjustments: {
    fixedAssets: 0,
    otherCurrentAssets: 0,
    currentLiabilities: 0
  }
};