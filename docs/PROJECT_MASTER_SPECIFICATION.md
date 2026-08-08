# PrivacyLens (RECLAIM) — Comprehensive Master Project Specification

> **Notice for Artificial Intelligence & LLM Agents**:  
> This document serves as the **authoritative, single-source-of-truth specification** for the PrivacyLens (RECLAIM) digital footprint & DPDP Act 2023 compliance platform. Reading this single document provides a complete, 360-degree technical, architectural, and operational understanding of the entire codebase.

---

## 1. Executive Summary & Core Mission

**PrivacyLens (RECLAIM)** is an enterprise-grade, privacy-by-design Digital Footprint & Data Rights Control Platform designed specifically for compliance with **India's Digital Personal Data Protection (DPDP) Act 2023**.

### Primary Value Proposition
Web users routinely share personal data (email, phone, name, consents) across dozens of web services without visibility into their accumulated digital exposure. PrivacyLens bridges this gap by providing:
1. **Real-Time Exposure & Visit Interception**: Automatically detects website visits and registration/form submission activities.
2. **Zero-Credentials / Privacy Guarantee**: Extracts *only* privacy-preserving metadata categories. Never harvests, stores, inspects, or transmits passwords, OTPs, auth tokens, or PII.
3. **Single Source of Truth Extension Engine**: Tracks unique websites ($O(1)$ Hash Set) and confirmed account creations separately.
4. **Child Safe Protection (§9)**: Detects behavioral tracking and targeted advertising networks when Child Safe Mode is enabled.
5. **3-Tier Statutory Action Execution**: Enables users to execute DPDP §6 consent revocations and §12 data erasure notices with immutable audit logging.

---

## 2. Component Topology & Tech Stack

```
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │                          PrivacyLens Ecosystem Architecture                      │
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

| Component | Technology Stack | Responsibility |
|---|---|---|
| **Chrome Extension** | Manifest V3, JavaScript, Closed Shadow DOM | Real-time page interception, floating overlay, popup UI, Hash Set domain tracking, Account Creation detector, Child Safe tracker detector. |
| **Dashboard Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons | Main user web app (`localhost:5173`) rendering data footprints, active consents, DPDP score, and 3-Tier action modals. |
| **Backend API** | Node.js, Express, Prisma ORM, SQLite | Persistent relational database storing users, websites, data items, consents, privacy requests, and audit logs (`localhost:5000`). |
| **Partner Demo** | Node.js, Express, HTML/JS | Simulated e-commerce site ShopEase (`localhost:3000`) for testing Tier 1 Direct API consent revocations. |

---

## 3. Chrome Extension Architecture (Single Source of Truth)

The Chrome Extension (`extension/`) operates as the **authoritative single source of truth** for all metrics and tracked events in the ecosystem.

### 3.1. $O(1)$ Hash Set Unique Website Counter (`webCount`)
- **In-Memory Hash Set (`visitedWebsitesSet`)**: Maintained in `extension/background.js` for $O(1)$ domain membership checks.
- **Service Worker Restart Resilience (`initVisitedWebsitesSet`)**: On wake-up, the Set is automatically initialized from `chrome.storage.local`. It consolidates unique domains from:
  1. `visitedWebsites` (stored array)
  2. `recentWebsiteVisits` (recent activity queue)
  3. `exposures` (recorded exposures map)
- **Domain Normalization**: Converts `https://www.amazon.in/cart/item1` → `amazon.in`.
- **Deduplication**: Submitting page visits to `visitedWebsitesSet` only increments `webCount` when `!visitedWebsitesSet.has(domain)`.

### 3.2. Account Creation Counter (`exposureCount`)
- **Definition**: Increments by **exactly 1** whenever the user successfully creates a new account on any web service.
- **Privacy-by-Design Barrier**: Zero input value reading. No passwords, OTPs, or PII are ever collected or inspected.
- **Registration Form Classification (`isRegistrationForm`)**: Analyzes safe DOM metadata (button text like "Create Account", "Sign Up", "Register", form attributes) to distinguish signup forms from login forms ("Sign In", "Log In").
- **Post-Submission Confirmation Signals (`checkForRegistrationConfirmation`)**:
  - Submitting a signup form sets a temporary pending token in `sessionStorage`.
  - The event is counted **only upon confirmation** via:
    1. **Confirmation URL Path**: Post-submit navigation to `/welcome`, `/dashboard`, `/account-created`, `/verify-email`, `/onboarding`, etc.
    2. **Confirmation DOM Text**: Presence of confirmation messages like `"account created"`, `"registration successful"`, `"welcome to"`, `"verification email sent"`, etc.
    3. **Post-Submit Navigation**: Successful redirect to a non-signup page.
- **Deduplication**: Client-side `sessionStorage` token clearing + service worker `processedAccountEventsSet` guarantee that reloads, DOM mutations, or repeated script execution never double-count an account creation.

### 3.3. Child Safe Mode (§9 Protection)
- When `childSafeMode` is toggled ON in popup or storage:
  - `detectBehavioralTracking()` scans page DOM scripts and iframes for ad-tech & tracking indicators (Google Analytics, GTM, Facebook Pixel/fbevents, DoubleClick, Criteo, Taboola, Clarity, etc.).
  - If behavioral tracking is detected on a child profile (<18), a prominent red alert chip is rendered on Popup and Shadow DOM overlay:  
    `⚠️ WARNING: Children's Behavioral Tracking Detected (§9)`

### 3.4. Centralized Domain Exclusion Engine (`isExcludedDomain`)
Filtering out internal pages prevents phantom count increments:
- **Internal Schemes**: `chrome://`, `edge://`, `about:`, `chrome-extension://`, `devtools://`, `file://`, `blob:`, `data:`
- **New Tab Pages**: `about:blank`, `about:newtab`, `chrome://newtab`, `newtab`
- **Google Domains**: `google.com`, `mail.google.com`, `maps.google.com`, and regional domains (`google.co.in`, etc.)

### 3.5. In-Page Closed Shadow DOM Overlay (`extension/content.js`)
- Uses `attachShadow({ mode: 'closed' })` attached to a host `<div>` (`#reclaim-privacy-overlay-root`).
- Completely isolates PrivacyLens floating overlay CSS from host website styles.
- Renders live domain exposure details, privacy score badge, risk indicators, Child Safe alert chip, and recent visits list.
- Works dynamically across full page loads and Single Page Application (SPA) `history.pushState` navigations.

---

## 4. Extension → Dashboard Communication Pipeline

To prevent data inconsistencies, the Dashboard operates strictly as **Receiver + Visualization** (`Dashboard = Receiver + Visualization`).

```
Extension Event Detected / Storage Update
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

### Idempotency & Synchronization Rules
1. **Unique Event ID**: Every sync payload includes `eventId: 'sync_' + Date.now() + '_' + rand`.
2. **Idempotent Receiver**: `PrivacyContext.jsx` maintains `processedSyncIds` set. If an `eventId` was already processed, it is ignored.
3. **No Independent Increments**: The Dashboard **never calculates or increments** `webCount`, `exposureCount`, or `privacyScore` independently. It renders values received from the Extension.
4. **Focus Re-Sync**: On mount and when window gains focus (`window.addEventListener('focus')`), the Dashboard posts `REQUEST_EXTENSION_SYNC` to pull the latest state from Extension.

---

## 5. DPDP Act 2023 Statutory 3-Tier Action Framework

PrivacyLens implements a 3-tier action framework aligned with statutory provisions of the DPDP Act 2023:

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
- Designed for integrated partners (e.g. ShopEase demo).
- Dispatches automated `POST` payload to partner API (e.g. `http://localhost:3000/api/partner/revoke`).
- Instantly revokes targeted consent (Marketing, Analytics, Data Sharing) and logs audit proof.

### Tier 2: Guided Self-Serve Deletion (DPDP §12)
- For web services without direct API integrations.
- Opens target service's self-serve privacy/account deletion portal URL.
- Tracks initiation status and records audit proof under DPDP §12.

### Tier 3: Generated Statutory Legal Notice (DPDP §6 & §12)
- Formally generates a structured DPDP statutory notice including:
  - Data Fiduciary Name & Domain
  - Statutory Reference (`DPDP-NOTICE-2026-XXX`)
  - Explicit demand for complete data erasure or consent withdrawal
  - 30-day statutory compliance deadline
- Dispatches request, logs audit proof, and provides downloadable notice copy.

---

## 6. Database Schema & REST API Reference

The backend (`backend/`) uses **Prisma ORM with SQLite** (`backend/prisma/schema.prisma`).

### 6.1. Core Database Entities
- **User**: User credentials, email, profile name, dynamic `privacyScore`.
- **Website**: Domain, name, category, `riskLevel`, `deletionTier`, `directApiUrl`, `guidedUrl`.
- **DataItem**: Data category tracked per site (`email`, `phone`, `name`, `account`).
- **Consent**: Active/revoked consent records (`consentType`, `status`, `grantedAt`, `revokedAt`).
- **PrivacyRequest**: Statutory action logs (`requestType`, `tier`, `methodUsed`, `status`, `referenceId`).
- **AuditLog**: Immutable audit trail entries (`action`, `description`, `timestamp`).

### 6.2. REST API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Service health check |
| `/api/events` | POST | Ingests extension event payloads (upserts website, data items, consents) |
| `/api/dashboard/:userId` | GET | Returns user details, summary stats, digital footprint website list |
| `/api/requests/create` | POST | Creates and executes 3-Tier privacy request |
| `/api/requests/:userId` | GET | Fetches all requests for a user |
| `/api/audit/:userId` | GET | Fetches immutable audit logs |
| `/api/websites/:websiteId` | GET | Returns detailed website profile |
| `/api/demo/reset` | POST | Resets database and re-seeds default demo records |
| `/api/ai/summarize-policy` | POST | AI policy summarization endpoint |

---

## 7. Complete Repository File Structure

```
DPDP-Project/
├── docs/                                   # Project Documentation Directory
│   ├── PROJECT_MASTER_SPECIFICATION.md     # This Master Specification Document
│   ├── EVALUATION_PREPARATION_DOCUMENT.md  # Evaluation & Testing Guide
│   ├── MASTER_PROJECT_DOCUMENT (1).md      # Project Presentation & Context Notes
│   ├── PRESENTATION_SPEAKER_NOTES_&_SCRIPT.md # Presentation Speaker Script
│   └── maneesh.txt                         # Additional Project Notes
│
├── extension/                              # Manifest V3 Chrome Extension (Source of Truth)
│   ├── manifest.json                       # Extension Manifest V3 configuration
│   ├── background.js                       # Service Worker (Hash Set, Accounts Counter, Event Bus)
│   ├── content.js                          # Content Script (Form Interceptor, Account & Tracker Detector, Overlay)
│   └── popup/                              # Popup UI (Toolbar Application)
│       ├── popup.html                      # Popup markup template
│       ├── popup.css                       # Popup styling & alerts
│       └── popup.js                        # Popup UI logic & Child Safe toggle
│
├── src/                                    # React Web Dashboard (Receiver + Visualization)
│   ├── main.jsx                            # React entry point
│   ├── App.jsx                             # Main layout & routing
│   ├── index.css                           # Global Tailwind CSS styles
│   ├── context/
│   │   └── PrivacyContext.jsx              # Authoritative Extension Sync Receiver & State Manager
│   ├── components/
│   │   ├── Navbar.jsx                      # Top navigation bar
│   │   ├── OverviewStats.jsx               # Top metrics cards (Connected Sites, Active Consents, Score)
│   │   ├── DigitalFootprintGrid.jsx        # Tracked website cards grid
│   │   ├── WebsiteDetailModal.jsx          # Website details & risk modal
│   │   ├── Tier1DirectAction.jsx           # Tier 1 Direct API modal
│   │   ├── Tier2GuidedAction.jsx            # Tier 2 Guided portal modal
│   │   ├── Tier3LetterGenerator.jsx        # Tier 3 Legal notice generator modal
│   │   ├── RequestTracker.jsx              # In-flight privacy requests tracker
│   │   └── AuditLogTimeline.jsx            # Immutable audit log timeline
│   └── mocks/
│       └── mockDashboardData.json          # Initial mock data template
│
├── backend/                                # Express + Prisma REST API Backend
│   ├── server.js                           # Express server entry point (Port 5000)
│   ├── controllers/                        # REST Controllers
│   │   ├── eventController.js              # Extension events handler
│   │   ├── dashboardController.js          # Dashboard data provider
│   │   ├── requestController.js            # 3-Tier request handler
│   │   ├── auditController.js              # Audit logs provider
│   │   ├── websiteController.js            # Website details provider
│   │   └── aiController.js                 # AI policy summarizer
│   ├── prisma/
│   │   ├── schema.prisma                   # Database schema definitions
│   │   ├── seed.js                         # Database seed script
│   │   └── dev.db                          # SQLite database file
│   └── utils/
│       └── privacyScore.js                 # Backend privacy score algorithm
│
├── shopease-demo/                          # Simulated Partner Website (Port 3000)
│   ├── server.js                           # Express demo server & Tier 1 API endpoint
│   └── public/                             # Demo shop frontend (index.html, app.js, style.css)
│
├── package.json                            # Root Node.js dependencies & scripts
├── vite.config.js                          # Vite build configuration
└── tailwind.config.js                      # Tailwind CSS configuration
```

---

## 8. Installation, Execution & Demonstration Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Browser**: Google Chrome / Microsoft Edge (Manifest V3 support)

### Step 1: Start React Dashboard
```bash
cd e:\DPDP\DPDP-Project
npm install
npm run dev
```
*Access Dashboard at:* `http://localhost:5173/`

### Step 2: Start Backend Server (Optional for Persistence)
```bash
cd e:\DPDP\DPDP-Project\backend
npm install
npx prisma db push
node server.js
```
*API Base URL:* `http://localhost:5000/api`

### Step 3: Start ShopEase Partner Demo (Optional for Tier 1 Testing)
```bash
cd e:\DPDP\DPDP-Project\shopease-demo
npm install
node server.js
```
*Access Demo Store at:* `http://localhost:3000/`

### Step 4: Load Chrome Extension
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle switch in top-right corner).
3. Click **Load unpacked**.
4. Select the directory: `e:\DPDP\DPDP-Project\extension`.
5. The **RECLAIM / PrivacyLens** extension icon will appear in the toolbar.

---

## 9. Verification & Test Matrix

| # | Test Scenario | Verified Behavior |
|---|---|---|
| **1** | Visit normal website (e.g. Amazon) | Overlay appears automatically; `webCount` increments by **+1** (O(1) Hash Set check). |
| **2** | Refresh or revisit same website | Overlay refreshes site info; `webCount` stays **UNCHANGED** (deduplicated). |
| **3** | Open signup page without submitting | `exposureCount` stays **UNCHANGED** (no form submission or confirmation). |
| **4** | Complete successful registration | Form submit + confirmation signal detected → `exposureCount` increments by **+1**. |
| **5** | Login to existing account | Login keywords matched → `exposureCount` stays **UNCHANGED**. |
| **6** | Duplicate confirmation signal / reload | Session token + `processedAccountEventsSet` → `exposureCount` stays **UNCHANGED** (only +1). |
| **7** | Toggle Child Safe Mode ON on site with trackers | Red warning chip `⚠️ WARNING: Children's Behavioral Tracking Detected (§9)` appears on Overlay and Popup. |
| **8** | Open Dashboard (`localhost:5173`) | Receives real-time sync (`RECLAIM_EXTENSION_SYNC`); CONNECTED SITES and Score match Extension state. |
| **9** | Execute Tier 1 Revocation on ShopEase | Direct API posts to `localhost:3000/api/partner/revoke`; consent status updates to REVOKED + Audit Log entry created. |
| **10**| Generate Tier 3 DPDP Notice | Generates formal legal notice with statutory reference ID (`DPDP-NOTICE-2026-XXX`); records audit log proof. |

---

## 10. Summary Statement

PrivacyLens (RECLAIM) represents a state-of-the-art solution for DPDP Act 2023 compliance. By maintaining the **Chrome Extension as the immutable Single Source of Truth**, combining $O(1)$ Hash Set domain membership tracking with privacy-preserving Account Creation detection, and bridging live metrics seamlessly into the React Dashboard, the platform guarantees complete data integrity, legal auditability, and optimal user privacy.
