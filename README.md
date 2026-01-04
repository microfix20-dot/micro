# FixMaster Pro (Profixer System Pos Pro)

FixMaster Pro is an all-in-one Repair Shop Management System designed for electronics repair businesses. It integrates Job Sheet management, Point of Sale (POS), Inventory tracking, and AI-powered diagnostics into a single, modern web application.

## 🚀 Key Features

### 🛠 Repair Management
- **Job Tracking**: End-to-end workflow from "Pending" to "Delivered".
- **AI Diagnosis**: Uses Google Gemini 3 Pro to suggest potential faults and repair steps based on device model and issue description.
- **Status Updates**: Automated WhatsApp message drafting for customer updates.
- **History**: Detailed timeline of device status changes and technician notes.

### 💰 Point of Sale (POS)
- **Retail & Service**: Unified cart for selling inventory items and collecting repair payments.
- **Barcode Support**: Compatible with USB scanners and device cameras.
- **Split Payments**: Support for mixed payment methods (Cash, Card, E-Wallet).
- **Invoicing**: Generates thermal receipts or A4 invoices.

### 📦 Inventory Control
- **Stock Management**: Low stock alerts and categorization.
- **Barcode Tools**: Built-in generator for Code128 and QR codes.
- **Import/Export**: CSV support for bulk inventory management.
- **Purchase Orders**: Manage suppliers and stock replenishment.

### 🤖 AI-Powered Tools
- **Smart Quoting**: Generates professional terms and email drafts using AI.
- **Image Editor**: AI-driven image manipulation for marketing or repair documentation.
- **Technician Note Summarizer**: Converts technical jargon into customer-friendly status updates.

### 📊 Finance & Compliance
- **Reporting**: Profit & Loss, Staff Performance, and Balance Sheet.
- **Taxation**: Malaysian Tax & Zakat estimation calculator.
- **E-Invoicing**: Ready for Malaysia MyInvois (IRB) compliance with validation QR codes.

## 🛠 Tech Stack

- **Frontend**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **AI Engine**: Google Gemini API (`@google/genai`)
- **Persistence**: Google Drive API (Backup/Restore) & Local State

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fixmaster-pro.git
   cd fixmaster-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   API_KEY=your_google_gemini_api_key
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

## 📝 Usage Guide

- **Login**: Use the default Admin PIN `1234`.
- **Navigation**: Use the sidebar to access Dashboard, POS, Jobs, etc.
- **AI Features**: Ensure you have a valid API Key to use the Diagnosis and Image Editing tools.
- **Backup**: Go to Settings > Backup to connect your Google Drive for data persistence.

## 📄 License

Proprietary software. All rights reserved.
