# Product Roadmap

This roadmap outlines the future development strategy for FixMaster Pro, moving from a standalone client-side tool to a robust, cloud-integrated platform.

## 🟢 Phase 1: Stabilization & Persistence (Current Focus)
- [x] **Core Features**: POS, Inventory, Job Tracking implemented.
- [x] **AI Integration**: Diagnostics and generative text features active.
- [ ] **Data Persistence**: Migrate from in-memory state to **IndexedDB** for offline-first local storage.
- [ ] **Mobile Responsiveness**: Optimize `POS` and `Dashboard` views for tablet and mobile screens.

## 🟡 Phase 2: Backend & Multi-User
- [ ] **Dedicated Backend**: Implement a backend (Node.js/Supabase/Firebase) to replace local state.
- [ ] **Real-time Sync**: Enable multiple devices (e.g., Technician Tablet + Front Desk PC) to work on the same data simultaneously.
- [ ] **RBAC**: Enforce strict Role-Based Access Control on the server side (prevent Technicians from seeing Financial Reports).
- [ ] **Audit Logs**: Track every action (who deleted an item, who changed a price).

## 🟠 Phase 3: Customer Experience & Integrations
- [ ] **Customer Portal**: A public-facing web link where customers can track repair status by entering their Job ID.
- [ ] **WhatsApp API Integration**: Direct integration with Twilio/Meta API for automated message sending (removing manual "Click to Chat").
- [ ] **Payment Gateway**: Full integration with Stripe/ToyyibPay for generating payment links on digital invoices.
- [ ] **Booking System**: Allow customers to book repair slots online.

## 🔴 Phase 4: Enterprise Features
- [ ] **Multi-Branch Support**: Manage inventory and sales across multiple physical store locations.
- [ ] **Advanced Analytics**: AI-driven predictive analytics for stock ordering (predicting when parts will run out).
- [ ] **Accounting Integration**: One-click sync with Xero, QuickBooks, or SQL Accounting.
- [ ] **Marketplace**: Feature to list "Refurbished Devices" directly to a public e-commerce storefront.

## 🧠 AI R&D
- **Vision Diagnosis**: Train a custom model to identify physical damage (cracks, water damage) from uploaded photos.
- **Voice Memos**: Voice-to-text for technicians to record repair notes hands-free.
