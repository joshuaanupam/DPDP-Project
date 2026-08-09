# PrivacyLens (RECLAIM) — Comprehensive Master Project & Architecture Specification Document

> **Authoritative Single-Source-of-Truth Project Document**  
> **Repository**: `PrivacyLens (RECLAIM) DPDP Rights Control Center`  
> **Compliance Standard**: India's **Digital Personal Data Protection (DPDP) Act 2023**  
> **Document Status**: Active & Fully Synchronized  
> **Last Updated**: August 2026

---

## 1. Executive Summary & Project Identity

### 1.1. Core Mission
**PrivacyLens (RECLAIM)** is an enterprise-grade, privacy-by-design Digital Exposure Monitor and Statutory Rights Control Platform. Built specifically for compliance with **India's Digital Personal Data Protection (DPDP) Act 2023**, PrivacyLens bridges the critical visibility gap between everyday internet users and the web services accumulating their personal data.

### 1.2. The Problem Statement
Modern web users routinely share identifiers (email addresses, phone numbers, full names, demographics) and grant implicit/explicit consent across hundreds of web services. Users face three major challenges:
1. **Zero Exposure Visibility**: Users have no unified view of which web domains store their personal data.
2. **Statutory Action Barrier**: Exercising data erasure rights or revoking consent under DPDP §6 & §12 is convoluted, obscure, or manually exhausting.
3. **Children's Behavioral Profiling (§9)**: Minor profiles (< 18 years old) are continuously targeted by behavioral advertising and tracking networks without parental or statutory safeguards.

### 1.3. The PrivacyLens Solution
PrivacyLens provides an end-to-end ecosystem comprising a **Manifest V3 Chrome Extension**, a **React 18 Web Dashboard**, a **Node.js/Prisma Express REST API**, and a **Simulated Partner Portal (ShopEase)**:
- **Real-Time Exposure & Visit Interception**: Intercepts domain visits and form registrations using zero-PII DOM inspection.
- **Single Source of Truth Extension Engine**: Maintains immutable $O(1)$ Hash Set unique website counting and confirmed account creation tracking.
- **Child Safe Protection Engine (§9)**: Scans for ad-tech scripts and alerts users when children's behavioral tracking is detected.
- **3-Tier DPDP Statutory Action Framework**: Enables instant consent revocations (Tier 1), guided portal deletions (Tier 2), and legally structured statutory notices (Tier 3) with immutable audit logging.

---

## 2. Full Ecosystem Architecture & Technology Stack

```
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │                       PrivacyLens Ecosystem Topology & Flow                      │
 └──────────────────────────────────────────────────────────────────────────────────┘

   ┌────────────────────────────────┐         ┌─────────────────────────────────┐
   │    Chrome Extension (MV3)      │         │     React Web Dashboard         │
   │   (SINGLE SOURCE OF TRUTH)     │         │   (RECEIVER + VISUALIZATION)    │
   │                                │         │                                 │
   │  • background.js (Worker)      │         │  • PrivacyContext.jsx           │
   │  • content.js (Shadow DOM UI)  │─────────►  • OverviewStats.jsx            │
   │  • popup.js (Toolbar App)      │ (Bridge)│  • DigitalFootprintGrid.jsx     │
   └───────────────┬────────────────┘         └────────────────┬────────────────┘
                   │                                           │
                   │ (HTTP POST /api/events)                   │ (HTTP GET /api/dashboard)
                   ▼                                           ▼
   ┌────────────────────────────────────────────────────────────────────────────────┐
   │                       Express + Prisma + SQLite Backend                        │
   │                               (Port 5000)                                      │
   │                                                                                │
   │  • eventController.js     • dashboardController.js     • requestController.js   │
   │  • auditController.js     • websiteController.js       • aiController.js        │
   └───────────────────────────────────────┬────────────────────────────────────────┘
                                           │
                                           ▼
   ┌────────────────────────────────────────────────────────────────────────────────┐
   │                          ShopEase Partner Demo Portal                          │
   │                               (Port 3000)                                      │
   │  • Simulates Tier 1 Direct API Consent Revocation & Partner Integration        │
   └────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1. System Component Breakdown

| Layer | Component | Technology | Role & Responsibility |
|---|---|---|---|
| **Client Core** | Chrome Extension | Manifest V3, ES6 JavaScript, Closed Shadow DOM | Primary data interceptor, Hash Set domain counter, account creation detector, overlay UI renderer, popup application. Authoritative single source of truth. |
| **User Interface** | Web Dashboard | React 18, Vite, Tailwind CSS, Lucide Icons | Main user web app (`localhost:5173` & `172.20.21.109:5173`) displaying exposure metrics, active consents, DPDP score, and 3-Tier statutory action modals. Receiver + Visualization. |
| **Backend REST API** | Express Backend | Node.js, Express, Prisma ORM, SQLite (`dev.db`) | Data persistence engine (`localhost:5000`), user authentication, audit log storage, AI policy summarizer interface. |
| **Integration Sandbox**| ShopEase Demo | Node.js, Express, HTML5, CSS3 | Simulated e-commerce partner portal (`localhost:3000`) demonstrating Tier 1 Direct API consent revocation (`POST /api/partner/revoke`). |

---

## 3. Chrome Extension Architecture (Single Source of Truth)

The Chrome Extension (`extension/`) is the central intelligence engine of the platform.

### 3.1. $O(1)$ Hash Set Unique Website Counter (`webCount`)
- **In-Memory Set (`visitedWebsitesSet`)**: Maintained in `extension/background.js` for $O(1)$ constant-time domain membership lookup.
- **Service Worker Resilience (`initVisitedWebsitesSet`)**: On worker wake-up or browser restart, the Set is automatically populated from `chrome.storage.local`. It consolidates unique domains across:
  1. `visitedWebsites` (stored array)
  2. `recentWebsiteVisits` (rolling visit activity queue)
  3. `exposures` (recorded domain exposure map)
- **Domain Normalization**: Normalizes URLs into clean domain strings (`https://www.amazon.in/cart/item1` → `amazon.in`).
- **Deduplication**: Submitting page visits to `visitedWebsitesSet` increments `webCount` **only when** `!visitedWebsitesSet.has(domain)`. Re-visiting or refreshing a domain does not increment `webCount`.

### 3.2. Account Creation Counter (`exposureCount`)
- **Definition**: Increments by **exactly 1** whenever the user successfully creates a new account on any web service.
- **Privacy-by-Design Barrier**: Zero input value reading. Passwords, OTPs, auth tokens, credit cards, or PII are **never harvested, inspected, or transmitted**.
- **Registration Form Classification (`isRegistrationForm`)**: Analyzes safe DOM metadata (button labels like `"Create Account"`, `"Sign Up"`, `"Register"`, form attributes) to distinguish signup forms from login forms (`"Sign In"`, `"Log In"`).
- **Post-Submission Confirmation Signals (`checkForRegistrationConfirmation`)**:
  - Submitting a signup form sets a temporary pending token in `sessionStorage`.
  - The event is counted **only upon confirmation** via:
    1. **Confirmation URL Path**: Navigation to `/welcome`, `/dashboard`, `/account-created`, `/verify-email`, `/onboarding`, etc.
    2. **Confirmation DOM Text**: Display of confirmation messages like `"account created"`, `"registration successful"`, `"welcome to"`, `"verification email sent"`, etc.
    3. **Post-Submit Navigation**: Successful redirect away from the registration form to a non-signup page.
- **Deduplication**: Client-side `sessionStorage` token clearing + service worker `processedAccountEventsSet` ensure page reloads or DOM mutations never double-count an account creation.

### 3.3. Child Safe Protection Engine (§9 Compliance)
- When `childSafeMode` is toggled **ON** (via Extension Popup or storage):
  - `detectBehavioralTracking()` in `content.js` scans page DOM script elements and `<iframe>` sources for ad-tech, behavioral tracking, and user profiling indicators (Google Analytics, GTM, Facebook Pixel/fbevents, DoubleClick, Criteo, Taboola, Clarity, Hotjar, etc.).
  - If behavioral tracking is detected on a child profile (< 18), prominent warning alert chips are rendered on the Floating Overlay and Extension Popup:  
    `⚠️ WARNING: Children's Behavioral Tracking Detected (§9)`

### 3.4. Dual Exclusion Engine (`isExcludedDomain` vs `isExcludedPage`)
To ensure seamless user experience, the system separates **automatic overlay rendering** from **background service worker processing**:

1. **`isExcludedPage()` in `extension/content.js` (In-Page Overlay Exclusion)**:
   - Suppresses ONLY the automatic floating Closed Shadow DOM overlay (`#reclaim-privacy-overlay-root`).
   - Applies to:
     - Internal schemes: `chrome://`, `edge://`, `about:`, `chrome-extension://`, `devtools://`, `file://`, `blob:`, `data:`
     - New Tab / Empty pages: `about:blank`, `about:newtab`, `chrome://newtab`
     - Google services: `google.com`, `colab.research.google.com`, `drive.google.com`, `docs.google.com`, `sheets.google.com`, `mail.google.com`, regional Google domains.
     - Local project hosts: `localhost`, `127.0.0.1`, `172.20.21.109` (all dev ports `5173`, `5000`, `3000`, etc.).

2. **Manual Chrome Extension Toolbar Popup (`extension/popup/popup.js`)**:
   - Opens when the user clicks the PrivacyLens toolbar icon in Chrome.
   - Operates **on ALL pages**, including Google Colab, Google Drive, Google Docs, Gmail, Google New Tab, `localhost`, `172.20.21.109`, and external sites.
   - Fetches `GET_EXTENSION_STATE` directly from `background.js` via service worker messaging.
   - Completely decoupled from `content.js` tab messaging. Optional tab queries (`CHECK_BEHAVIORAL_TRACKING`, `GET_DOM_METADATA`) use safe callback promise fallbacks (`chrome.runtime.lastError` handling), ensuring the popup always renders `webCount`, `exposureCount`, `privacyScore`, and `recentVisits` regardless of page injection status.

3. **Safe Context Invalidation Guard (`isExtensionContextValid()`)**:
   - Evaluates `chrome?.runtime?.id` safely inside `try ... catch` blocks across `content.js`.
   - Protects against synchronous V8 getter exceptions (`Uncaught Error: Extension context invalidated`) when the unpacked extension is reloaded or updated on `chrome://extensions`.

### 3.5. In-Page Closed Shadow DOM Overlay Lifecycle (`extension/content.js`)
- **CSS Isolation**: Uses `attachShadow({ mode: 'closed' })` attached to `#reclaim-privacy-overlay-root` host element. Completely isolates overlay styling from target website CSS.
- **30-Second Automatic Timer**: `_automaticOverlayTimer` runs for 30,000ms after page load. Expiration hides the overlay via `host.style.display = 'none'` with zero side-effects on persistent storage or counters.
- **Same-Domain Navigation Filtering**: `_lastOverlayDomain` check in `handleUrlChange()` prevents same-domain URL path/hash changes (`amazon.in` → `amazon.in/cart` → `amazon.in/product/123`) from re-triggering the overlay or resetting the active 30s timer.
- **Successful Login Overlay Trigger**: `checkForLoginConfirmation()` bypasses same-domain path restrictions to display/refresh the overlay for 30 seconds upon a confirmed successful login event.

---

## 4. Extension → Dashboard Synchronization Pipeline

To guarantee data consistency across the ecosystem, the React Web Dashboard operates strictly under the rule: **`Dashboard = Receiver + Visualization`**.

```
Extension Event Detected / Storage Change
                   ↓
      background.js updates storage
                   ↓
content.js queries background via GET_SITE_DATA
                   ↓
Generates RECLAIM_EXTENSION_SYNC payload with unique eventId
                   ↓
      ┌────────────┴────────────┐
      ▼                         ▼
window.postMessage         CustomEvent
      │                         │
      └────────────┬────────────┘
                   ▼
  localStorage.setItem('reclaim_extension_sync')
                   ▼
PrivacyContext.jsx (React Dashboard) receives payload
                   ↓
Checks if eventId in processedSyncIds (Idempotency Guard)
                   ↓
Updates extensionData state directly → Renders UI
```

### Synchronization Protocol Rules
1. **Authoritative Extension Source**: The Dashboard **never independently calculates, increments, or modifies** `webCount`, `exposureCount`, or `privacyScore`.
2. **Idempotency Guard**: Every sync payload includes a unique `eventId` (`sync_TIMESTAMP_RAND`). `PrivacyContext.jsx` tracks processed IDs to ignore duplicates.
3. **Focus & Mount Re-Sync**: When the Dashboard mounts or gains window focus (`window.addEventListener('focus')`), it posts `REQUEST_EXTENSION_SYNC` to pull the latest state from the extension.
4. **Offline Backend Resilience**: If the Node.js backend server is offline or unreachable, `PrivacyContext.jsx` retains the active extension sync data in state rather than overwriting it with empty fallback data.

---

## 5. DPDP Act 2023 Statutory 3-Tier Action Framework

PrivacyLens implements a 3-tier action execution model matching the statutory structure of the DPDP Act 2023:

```
                                  DPDP ACT 2023 
                             STATUTORY ACTION FRAMEWORK
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         ▼                               ▼                               ▼
  TIER 1: DIRECT API            TIER 2: GUIDED PORTAL          TIER 3: LEGAL NOTICE
  (DPDP §6(4) Revocation)       (DPDP §12 Account Removal)     (DPDP Statutory Notice)
         │                               │                               │
  • Instant automated POST       • One-click navigation to       • Generates formal legal
    to partner endpoint            partner deletion portal         notice with reference ID
  • Real-time revocation         • Guided user instructions      • Downloads copy & logs
    confirmation                   and state tracking              immutable audit proof
```

### Tier 1: Direct API Consent Revocation (DPDP §6(4))
- **Applicability**: Integrated Data Fiduciary partner websites (e.g. ShopEase demo at `localhost:3000`).
- **Execution**: Dispatches an automated HTTP `POST` payload directly to the partner's API endpoint (`http://localhost:3000/api/partner/revoke`).
- **Outcome**: Instantly revokes specified consents (Marketing Emails, Analytics, 3rd-Party Ads) and generates an immutable audit record.

### Tier 2: Guided Self-Serve Portal Deletion (DPDP §12)
- **Applicability**: External web services without a direct API integration.
- **Execution**: Opens the service's official privacy or account deletion portal URL in a new browser tab with step-by-step user instructions.
- **Outcome**: Marks the request status as `AWAITING_RESPONSE` and records an audit log entry under DPDP §12 data erasure provisions.

### Tier 3: Statutory Legal Notice Generator (DPDP §6 & §12)
- **Applicability**: Non-compliant web services or formal legal enforcement.
- **Execution**: Dynamically compiles a formal DPDP statutory legal notice containing:
  - Data Fiduciary Name & Domain
  - Unique Statutory Reference (`DPDP-NOTICE-2026-XXX`)
  - Explicit demand for complete personal data erasure and consent withdrawal
  - 30-day statutory compliance deadline
- **Outcome**: Dispatches notice record to backend, logs immutable audit proof, and allows the user to download a formatted legal notice document.

---

## 6. Database Schema & REST API Documentation

The backend (`backend/`) uses **Express.js with Prisma ORM and SQLite** (`backend/prisma/dev.db`).

### 6.1. Prisma Database Schema (`schema.prisma`)

```prisma
model User {
  id           String           @id @default(uuid())
  email        String           @unique
  name         String
  passwordHash String
  privacyScore Int              @default(100)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  requests     PrivacyRequest[]
  auditLogs    AuditLog[]
}

model Website {
  id           String           @id @default(uuid())
  domain       String           @unique
  name         String
  category     String
  riskLevel    String           @default("Low") // Low, Medium, High
  deletionTier Int              @default(3)     // 1 (Direct API), 2 (Guided), 3 (Legal Notice)
  directApiUrl String?
  guidedUrl    String?
  faviconUrl   String?
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  dataItems    DataItem[]
  consents     Consent[]
  requests     PrivacyRequest[]
}

model DataItem {
  id        String   @id @default(uuid())
  websiteId String
  website   Website  @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  category  String   // Email, Phone, Name, Location, etc.
  createdAt DateTime @default(now())
}

model Consent {
  id          String    @id @default(uuid())
  websiteId   String
  website     Website   @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  consentType String    // Account Creation, Marketing Emails, 3rd-Party Ads
  status      String    @default("ACTIVE") // ACTIVE, REVOKED
  grantedAt   DateTime  @default(now())
  revokedAt   DateTime?
}

model PrivacyRequest {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  websiteId   String
  website     Website  @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  requestType String   // CONSENT_REVOCATION, ACCOUNT_DELETION, DATA_ERASURE
  tier        Int      // 1, 2, or 3
  methodUsed  String   // TIER1_DIRECT_API, TIER2_GUIDED, TIER3_LEGAL_NOTICE
  status      String   @default("SUBMITTED") // SUBMITTED, IN_PROGRESS, COMPLETED, AWAITING_RESPONSE
  requestText String?
  referenceId String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AuditLog {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action      String   // REVOKE_CONSENT, INITIATE_DELETION, GENERATE_NOTICE
  description String
  timestamp   DateTime @default(now())
}
```

### 6.2. REST API Endpoints

| Endpoint | Method | Input Payload / Query | Response Description |
|---|---|---|---|
| `/api/health` | GET | None | `200 OK` service status & timestamp |
| `/api/events` | POST | `{ domain, dataTypes, consents, eventType }` | Ingests extension event; upserts Website, DataItems, Consents |
| `/api/dashboard/:userId` | GET | `userId` (URL param) | Returns User profile, summary stats, digital footprint website list |
| `/api/requests/create` | POST | `{ userId, websiteId, requestType, tier }` | Executes 3-Tier action; returns PrivacyRequest & AuditLog entry |
| `/api/requests/:userId` | GET | `userId` (URL param) | Returns array of all privacy requests for user |
| `/api/audit/:userId` | GET | `userId` (URL param) | Returns array of immutable audit log records for user |
| `/api/websites/:websiteId` | GET | `websiteId` (URL param) | Returns detailed profile, data items, and consents for a website |
| `/api/demo/reset` | POST | None | Resets SQLite database and re-seeds default demo data |
| `/api/ai/website-brief` | POST | `{ domain, title, metaDescription, headings }` | Generates AI privacy & business model summary for domain |

---

## 7. Complete Repository File Structure

```
DPDP-Project/
├── docs/                                   # Documentation Directory
│   ├── PROJECT_CURRENT_STATE_MASTER_DOCUMENT.md # This Comprehensive Master State Document
│   ├── PROJECT_MASTER_SPECIFICATION.md     # Architectural Project Specification
│   ├── EVALUATION_PREPARATION_DOCUMENT.md  # Evaluation & Verification Matrix Guide
│   ├── MASTER_PROJECT_DOCUMENT (1).md      # Core Presentation & Context Notes
│   ├── PRESENTATION_SPEAKER_NOTES_&_SCRIPT.md # Presentation Speaker Script
│   └── maneesh.txt                         # Context Notes
│
├── extension/                              # Manifest V3 Chrome Extension (Source of Truth)
│   ├── manifest.json                       # Extension Manifest V3 configuration
│   ├── background.js                       # Service Worker (Hash Set, Account Counter, Event Bus)
│   ├── content.js                          # Content Script (Form Interceptor, Shadow DOM Overlay, Ad-Tech Detector)
│   └── popup/                              # Extension Toolbar Application
│       ├── popup.html                      # Popup HTML template
│       ├── popup.css                       # Popup styling & status pills
│       └── popup.js                        # Popup UI logic & GET_EXTENSION_STATE controller
│
├── src/                                    # React Web Dashboard (Receiver + Visualization)
│   ├── main.jsx                            # React entry point
│   ├── App.jsx                             # Application layout & navigation routing
│   ├── index.css                           # Global Tailwind CSS & custom styles
│   ├── context/
│   │   └── PrivacyContext.jsx              # Authoritative Extension Sync Receiver & Global State Manager
│   ├── components/
│   │   ├── Navbar.jsx                      # Top header navigation bar
│   │   ├── Sidebar.jsx                     # Left navigation sidebar
      ├── OverviewStats.jsx               # Stat cards (Connected Sites, Active Consents, Score)
│   │   ├── DigitalFootprintGrid.jsx        # Tracked website footprint grid
│   │   ├── WebsiteDetailModal.jsx          # Website exposure details modal
│   │   ├── Tier1DirectAction.jsx           # Tier 1 Direct API modal
│   │   ├── Tier2GuidedAction.jsx            # Tier 2 Guided portal modal
│   │   ├── Tier3LetterGenerator.jsx        # Tier 3 Statutory legal notice generator modal
│   │   ├── RequestTracker.jsx              # Active privacy requests tracker
│   │   └── AuditLogTimeline.jsx            # Immutable audit log timeline
│   └── pages/
│       ├── DashboardPage.jsx               # Main Privacy Dashboard view
│       └── LoginPage.jsx                   # User Authentication page
│
├── backend/                                # Express + Prisma REST API Backend (Port 5000)
│   ├── server.js                           # Server entry point
│   ├── package.json                        # Backend Node.js dependencies
│   ├── controllers/                        # REST Controllers
│   │   ├── eventController.js              # Event ingestion handler
│   │   ├── dashboardController.js          # Dashboard data provider
│   │   ├── requestController.js            # 3-Tier request execution handler
│   │   ├── auditController.js              # Audit log provider
│   │   ├── websiteController.js            # Website details provider
      └── aiController.js                 # AI website brief summarizer
│   ├── prisma/
│   │   ├── schema.prisma                   # Relational database schema
│   │   ├── seed.js                         # Database seed script
│   │   └── dev.db                          # SQLite database file
│   └── utils/
│       └── privacyScore.js                 # Privacy Score calculation algorithm
│
├── shopease-demo/                          # Simulated Partner Website (Port 3000)
│   ├── server.js                           # Demo server & Tier 1 revocation API endpoint
│   └── public/                             # Demo shop frontend (index.html, app.js, style.css)
│
├── package.json                            # Root Node.js dependencies & scripts
├── vite.config.js                          # Vite build configuration
└── tailwind.config.js                      # Tailwind CSS configuration
```

---

## 8. Installation, Execution & System Startup Guide

### 8.1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Browser**: Google Chrome / Microsoft Edge (Manifest V3 support)

### 8.2. Step-by-Step Startup Sequence

#### Terminal 1: React Web Dashboard (Port 5173)
```bash
cd e:\DPDP\DPDP-Project
npm install
npm run dev
```
*Access URL:* `http://localhost:5173/` or LAN IP `http://172.20.21.109:5173/`

#### Terminal 2: Express Backend Server (Port 5000)
```bash
cd e:\DPDP\DPDP-Project\backend
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
node server.js
```
*Access API Base:* `http://localhost:5000/api`

#### Terminal 3: ShopEase Partner Portal (Port 3000)
```bash
cd e:\DPDP\DPDP-Project\shopease-demo
npm install
node server.js
```
*Access Partner Store:* `http://localhost:3000/`

#### Load Chrome Extension in Browser
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle switch in top-right corner).
3. Click **Load unpacked**.
4. Select directory: `e:\DPDP\DPDP-Project\extension`.
5. The **RECLAIM / PrivacyLens** shield icon will appear in your Chrome toolbar.

---

## 9. Comprehensive System Verification Matrix

| # | Test Scenario | Target Surface | Verified System Behavior | Status |
|---|---|---|---|---|
| **1** | Open `amazon.in` | External Web | Automatic overlay appears for 30s; `webCount` increments by **+1** ($O(1)$ Hash Set check). | **PASSED** |
| **2** | Navigate `amazon.in` → `amazon.in/cart` | Same Domain | Same-domain filter (`_lastOverlayDomain`) suppresses overlay re-trigger; 30s timer continues running. | **PASSED** |
| **3** | Log in on `amazon.in` | Same Domain | Login confirmed safely → overlay refreshes/displays for 30s. | **PASSED** |
| **4** | Open Google Colab / Drive / Docs / Sheets / Gmail | Google Services | Automatic overlay **SUPPRESSED** (`isExcludedPage()`). Manual toolbar popup **OPENS & RENDERS METRICS**. | **PASSED** |
| **5** | Open `localhost:5173` / `172.20.21.109:5173` | Local Dashboard | Automatic overlay **SUPPRESSED** (`isExcludedPage()`). Manual toolbar popup **OPENS & RENDERS METRICS**. | **PASSED** |
| **6** | Toggle Child Safe Mode ON on site with ad trackers | Ad-Tech Sites | Red warning chip `⚠️ WARNING: Children's Behavioral Tracking Detected (§9)` renders on Overlay & Popup. | **PASSED** |
| **7** | Execute Tier 1 Revocation on ShopEase | ShopEase Demo | Automated `POST` to `localhost:3000/api/partner/revoke`; consent status becomes REVOKED + Audit Log created. | **PASSED** |
| **8** | Generate Tier 3 Statutory Notice | Dashboard | Compiles formal legal notice with reference ID (`DPDP-NOTICE-2026-XXX`); records audit log proof. | **PASSED** |
| **9** | Open Extension Popup without active dashboard session | Extension Toolbar | Toolbar popup opens cleanly via `GET_EXTENSION_STATE` without creating fake session storage records. | **PASSED** |
| **10**| Extension Reloaded Unpacked | Browser Tabs | `isExtensionContextValid()` try-catch guards prevent `Uncaught Error: Extension context invalidated` errors. | **PASSED** |

---

## 10. Summary Statement

PrivacyLens (RECLAIM) represents a state-of-the-art implementation of India's Digital Personal Data Protection (DPDP) Act 2023. By combining an **authoritative Manifest V3 Chrome Extension engine** with zero-PII domain and account creation tracking, strict separation of automatic overlay exclusions from toolbar popup functionality, real-time React Dashboard synchronization, and an immutable 3-Tier statutory action framework, the platform achieves complete technical compliance, robust user privacy, and legal auditability.
