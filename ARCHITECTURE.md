# System Architecture

## Overview

FixMaster Pro is built as a **Single Page Application (SPA)** using React. It follows a monolithic frontend architecture where the state is centralized in the root component and passed down to specialized Views. This ensures immediate UI consistency but relies on "Prop Drilling" for data flow.

## 📂 Directory Structure

```
/
├── components/         # Reusable UI components (Sidebar, etc.)
├── services/          # External API integrations and business logic
│   ├── gemini.ts      # Google Gemini AI integration
│   ├── googleDrive.ts # Google Drive Backup/Restore API
│   └── initialData.ts # Mock data for initialization
├── views/             # Main application screens (Pages)
│   ├── Dashboard.tsx
│   ├── Jobs.tsx
│   ├── POS.tsx
│   ├── Inventory.tsx
│   └── ...
├── types.ts           # TypeScript interfaces (Domain Models)
├── App.tsx            # Main Controller & State Holder
├── index.tsx          # Entry Point
└── index.html         # HTML Template
```

## 🧩 Key Components

### 1. State Management (`App.tsx`)
The `App` component serves as the central store. It initializes state hooks (`useState`) for:
- `jobs`: Repair tickets.
- `inventory`: Stock items.
- `sales`: Transaction history.
- `customers`: Client database.
- `settings`: Application configuration.

These state objects and their setters are passed as props to the `View` components.

### 2. View Routing
Routing is handled manually within `App.tsx` via a `currentView` string state. The `renderView()` function switches between components based on this state.

### 3. Services Layer
- **Gemini Service**: Handles all AI interactions. It constructs prompts for specific models (`gemini-3-pro-preview`, `gemini-2.5-flash`) to perform tasks like diagnosis, summarization, and image editing.
- **Google Drive Service**: Manages authentication (OAuth2) and file upload/download to Google Drive, acting as a cloud persistence layer.

## 🔄 Data Flow

1. **User Action**: User interacts with a View (e.g., adds an item in `POS.tsx`).
2. **State Update**: The View calls a function passed via props (e.g., `addSale`).
3. **Re-render**: `App.tsx` updates its state, triggering a re-render of the relevant components.
4. **Persistence**: 
   - **Short-term**: In-memory (lost on refresh).
   - **Long-term**: User manually triggers Backup or Auto-Backup runs, serializing the state to JSON and uploading to Google Drive.

## 🤖 AI Integration Strategy

The app uses the `@google/genai` SDK directly in the browser.
- **Thinking Models**: Used for complex diagnostics (`gemini-3-pro-preview`).
- **Fast Models**: Used for text summarization and generation (`gemini-2.5-flash`).
- **Vision Models**: Used for image manipulation (`gemini-2.5-flash-image`).
- **Grounding**: Google Search is used via tools configuration to provide real-world repair data.

## 🔐 Security Considerations

- **API Keys**: Currently stored in `process.env`. In a production build, these should be proxied through a backend to prevent exposure.
- **Auth**: Simple PIN-based local authentication. Google Drive Auth uses OAuth2 with restricted scopes (`drive.file`).
