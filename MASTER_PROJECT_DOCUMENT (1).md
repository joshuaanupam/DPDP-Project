# 🛡️ PRIVACYLENS — MASTER PROJECT DOCUMENT (v1.0)
### *Single Source of Truth & AI Context Handoff Document*
> **Project Status**: GREEN | **Last Updated**: August 8, 2026 (11:25 AM) | **Target Build Time**: 20 Hours  
> **DPDP Problem Statement**: "Privacy That People Can Understand and Organizations Can Prove"  
> **Core Architecture**: Passive Browser Extension (Manifest V3) + Centralized Web Dashboard + Node.js/Prisma Backend

---

## 01 — PROJECT IDENTITY

* **Project Name**: PrivacyLens
* **Working Pitch**: *"A browser extension and privacy control center that helps users discover where their personal data goes, understand what they agreed to, take privacy actions, and keep proof of every decision."*
* **What PrivacyLens IS**:
  * A **Centralized Privacy Control Layer** for a user's digital footprint across websites.
  * A **Passive Event Detector** via Chrome Extension Manifest V3.
  * An **Honest 3-Tier Management Platform** (Direct API / Guided Workflow / Legal Request Generator).
  * An **Audit & Evidence Engine** for DPDP Act compliance.
* **What PrivacyLens IS NOT**:
  * ❌ NOT a DigiLocker or government document storage system.
  * ❌ NOT for storing Aadhaar, PAN, certificates, or identity cards.
  * ❌ NOT a password manager or automated form-filler.
  * ❌ NOT claiming false universal one-click account deletion.

---

## 02 — PROBLEM STATEMENT

Every day, individuals interact with dozens of websites:
1. They create accounts using email addresses, names, and phone numbers.
2. They accept marketing communications, tracking cookies, and privacy terms.
3. They create accounts on forums, e-commerce stores, and apps, then forget about them.
4. They have zero visibility into:
   * *Which websites hold their personal data?*
   * *What consents are currently active?*
   * *Which services are retaining data unnecessarily?*
   * *How to exercise their DPDP rights (revocation, erasure, access) without visiting 50 sites manually?*

---

## 03 — PRODUCT VISION

PrivacyLens sits quietly as a privacy shield while the user browses normally. When a user creates an account or submits personal information:
1. The **Browser Extension** passively detects the event (without capturing passwords or credentials).
2. The **Backend** stores the metadata and recalculates the user's **Digital Privacy Score**.
3. The **Central Web Dashboard** presents a clean, consolidated view of their digital footprint.
4. The user takes **direct, guided, or structured legal actions** to revoke consents or request deletion.
5. An **Audit Trail** records timestamps, actions, and status updates as proof.

---

## 04 — UNIQUE VALUE PROPOSITION (UVP)

1. **Zero-Effort Automatic Discovery**: No manual logging — the extension detects privacy events live as you browse.
2. **Honest 3-Tier Action Engine**: Replaces fake "universal account deletion" with a working, realistic 3-level model (Direct API / Guided Redirect / Legal Request Generator).
3. **Plain-Language AI Transparency**: Converts complex legal privacy policies into simple bullet points.
4. **Audit-Ready DPDP Proof**: Gives Data Principals evidence of their consent revocations and data erasure requests.

---

## 05 — TARGET USERS

* **Primary User**: General digital consumer (Data Principal) managing 50+ online accounts.
* **Secondary User**: Compliance-conscious individual seeking DPDP Act rights enforcement.
* **Hackathon Audience**: Hackathon Judges assessing DPDP alignment, technical depth, UX clarity, and execution realism.

---

## 06 — USER JOURNEY

```
USER VISITS WEBSITE (e.g., ShopEase)
        ↓
EXTENSION DETECTS SIGNUP / FORM INPUT / CONSENT CHECKBOX
        ↓
USER SUBMITS FORM
        ↓
EXTENSION RECORDS PRIVACY EVENT (Metadata Only)
        ↓
EVENT SYNCS TO BACKEND REST API
        ↓
CENTRAL PRIVACY DASHBOARD UPDATES
        ↓
USER REVIEWS SHARED DATA & ACTIVE CONSENTS
        ↓
USER CLICKS REVOKE CONSENT / REQUEST DELETION
        ↓
TIER 1/2/3 ENGINE EXECUTES ACTION
        ↓
PRIVACY REQUEST TRACKER & AUDIT TIMELINE CREATES PROOF
```

---

## 07 — CORE FEATURES

* **Form & Consent Interceptor**: Chrome MV3 content script detecting form submissions and checkboxes.
* **Extension Quick Snapshot**: Popup UI showing current site privacy status, detected fields, and active consents.
* **Central Privacy Dashboard**: Consolidated view of connected websites, active consents, pending requests, and Digital Privacy Score (0–100).
* **Website Detail View**: Account age, data categories shared (Name, Email, Phone), active consents with `[Revoke]` triggers.
* **3-Tier Revocation & Deletion Engine**:
  * *Tier 1*: Direct API execution (for integrated partner sites).
  * *Tier 2*: Guided drawer with direct link to the site's privacy/deletion URL.
  * *Tier 3*: Structured DPDP §12 Erasure / §6 Revocation legal letter generator (copyable/mailto).
* **Privacy Request Tracker**: Status tracking (`CREATED` ➔ `SUBMITTED` ➔ `AWAITING RESPONSE` ➔ `COMPLETED`).
* **Immutable Audit Log**: Chronological timeline of all privacy events and user actions.
* **AI Policy Summarizer**: Translates privacy policies into human-understandable terms.

---

## 08 — THE FIVE PRODUCT PILLARS

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ 1. DISCOVER  │   │ 2.UNDERSTAND │   │  3. CONTROL  │   │ 4. CLEAN UP  │   │   5. PROVE   │
├──────────────┤   ├──────────────┤   ├──────────────┤   ├──────────────┤   ├──────────────┤
│ Passive MV3  │   │ AI Policy    │   │ 3-Tier       │   │ Inactive     │   │ Immutable    │
│ Event        │   │ Summaries &  │   │ Revocation & │   │ Account      │   │ Audit Log &  │
│ Interceptor  │   │ Risk Scores  │   │ Deletion UI  │   │ Cleanup Alert│   │ Status Proof │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

---

## 09 — HACKATHON MVP SCOPE (P0 / P1 / P2)

| Level | Component | Features |
|---|---|---|
| **P0 (Must Have)** | Extension | Content script DOM interceptor, background worker, Popup UI |
| **P0 (Must Have)** | Dashboard | Overview stats, Digital Footprint grid, Website Detail page, Revoke/Delete buttons |
| **P0 (Must Have)** | Backend & DB | REST API endpoints, Prisma SQLite database, seed script |
| **P0 (Must Have)** | Deletion Engine | Tier 1 (Direct API), Tier 2 (Guided URL), Tier 3 (Legal Letter Generator) |
| **P0 (Must Have)** | Request & Proof| Privacy Request Tracker, Audit Log timeline |
| **P0 (Must Have)** | Demo Setup | Mock "ShopEase" website with account creation & consent checkboxes |
| **P1 (Should Have)**| Intelligence | Dynamic Privacy Score algorithm (0–100), AI Policy Summarizer |
| **P1 (Should Have)**| UX Polish | Privacy risk tags (High/Med/Low), mailto request auto-trigger |
| **P2 (Nice to Have)**| Advanced | Automated email status parsing, multi-language notices |

---

## 10 — TECHNICAL REALITY & 3-TIER DELETION MODEL

 universal automated account deletion is technically impossible across the open web due to authentication, CSRF protections, and missing public APIs. **PrivacyLens solves this by using an honest 3-tier approach**:

* **LEVEL 1 — DIRECT AUTOMATION (Direct API)**:
  * Used when the target site provides an integrated API endpoint (e.g., ShopEase demo site).
  * Platform calls `POST /api/partner/revoke` or `POST /api/partner/delete`.
* **LEVEL 2 — GUIDED ACTION (Guided URL)**:
  * Used when the website requires authenticated manual deletion.
  * Platform opens a guided drawer with direct link (e.g., `https://example.com/account/privacy/delete`) and step-by-step instructions.
* **LEVEL 3 — REQUEST GENERATION (Legal Notice Generator)**:
  * Used when no direct web flow exists.
  * Platform generates a structured legal request citing DPDP Act §6 (Consent Withdrawal) or §12 (Data Erasure).
  * User copies text or clicks `[Send via Email]`. Platform tracks request status.

---

## 11 — DEMO WEBSITE SPECIFICATION ("ShopEase")

To ensure a **100% reliable live hackathon demo**, we build a mock e-commerce store called **ShopEase**:
* **URL**: `http://localhost:3000` (or `http://localhost:5173/shopease`)
* **Page Features**:
  * Registration Form: Name, Email, Phone Number.
  * Checkbox 1: `[✓] I agree to the Terms of Service`
  * Checkbox 2: `[✓] I agree to receive promotional communications` (Marketing Consent)
  * Checkbox 3: `[✓] I agree to share data with 3rd party advertising partners`
  * Privacy Policy Link: Opens modal with dummy legal text for AI summarizer.
  * Account Management Page: Simulates Tier 1 Direct API response for testing.

---

## 12 — IDEAL HACKATHON DEMO FLOW (14 Steps)

1. **Step 1**: Show browser with Extension active.
2. **Step 2**: Navigate to **ShopEase** (`localhost:3000`).
3. **Step 3**: Fill out signup form: Name, Email, Phone. Check Marketing Consent box.
4. **Step 4**: Submit form.
5. **Step 5**: Extension shows notification toast: *"Privacy Activity Detected on ShopEase"*.
6. **Step 6**: Click Extension popup to see detected fields and consents.
7. **Step 7**: Open **PrivacyLens Web Dashboard** (`localhost:5173`).
8. **Step 8**: Dashboard automatically shows ShopEase card, shared data (Email, Phone, Name), and active consents.
9. **Step 9**: Point out updated **Digital Privacy Score** (e.g. dropped from 85 to 72 due to active marketing consent).
10. **Step 10**: Click **"AI Policy Summary"** to see simple English breakdown of ShopEase policy.
11. **Step 11**: Click **[Revoke Marketing Consent]** ➔ Tier 1 API executes ➔ Status changes to `REVOKED`.
12. **Step 12**: Click **[Request Account Deletion]** ➔ Tier 3 Legal Generator opens ➔ Click **[Submit Request]**.
13. **Step 13**: Show **Privacy Request Tracker** update ➔ Status: `PENDING RESPONSE`.
14. **Step 14**: Show **Audit Log Timeline** displaying exact chronological timestamps for creation, revocation, and erasure request.

---

## 13 — SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             BROWSER EXTENSION                               │
│  Content Script (DOM listener) ──► Background Worker ──► Extension Popup UI │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ POST /api/events
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NODE.JS / EXPRESS API                             │
│  Auth Middleware │ Event Parser │ 3-Tier Action Engine │ AI Summarizer     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Prisma ORM
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             SQLITE / POSTGRESQL                             │
│  Users │ Websites │ DataItems │ Consents │ PrivacyRequests │ AuditLogs      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST Responses
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            REACT WEB DASHBOARD                              │
│  Overview Stats │ Footprint Grid │ Website Detail │ Request Tracker │ Audit │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 14 — BROWSER EXTENSION ARCHITECTURE (MV3)

* **Manifest File**: `manifest.json` (MV3, permissions: `activeTab`, `storage`, `scripting`, `host_permissions: [<all_urls>]`).
* **Content Script (`content.js`)**:
  * Runs on all pages.
  * Attaches event listeners to `<form>` submit events.
  * Inspects `input` elements for `type="email"`, `type="tel"`, `name="name"`.
  * Inspects `input[type="checkbox"]` for labels containing keywords: `marketing`, `promotional`, `newsletter`, `terms`, `agree`.
  * **SECURITY MANDATE**: Explicitly ignores `input[type="password"]`, credit cards, and OTP fields.
* **Background Worker (`background.js`)**:
  * Receives payload from `content.js`.
  * Sends `POST /api/events` to Backend API.
  * Stores recent 5 events in `chrome.storage.local`.
* **Popup UI (`popup.html` / `popup.jsx`)**:
  * Displays status for current domain, active consents, and recent event feed.

---

## 15 — FRONTEND ARCHITECTURE (REACT + VITE + TAILWIND)

* **Framework**: React 18 (Vite) + Tailwind CSS + Lucide Icons.
* **State Management**: React Context / Custom Hooks (`usePrivacyStore`).
* **Key Components**:
  * `Navbar.jsx`: Brand header, privacy score pill, current user profile.
  * `OverviewStats.jsx`: Stat cards (Connected Sites, Active Consents, Pending Requests, Score).
  * `DigitalFootprintGrid.jsx`: Searchable card grid of tracked websites with risk tags.
  * `WebsiteDetailModal.jsx`: Shared data list, active consents, Tier 1/2/3 action triggers.
  * `Tier1DirectAction.jsx`: Instant API execution modal.
  * `Tier2GuidedAction.jsx`: Step-by-step drawer with website direct URL.
  * `Tier3LetterGenerator.jsx`: Formatted legal DPDP request drafter.
  * `RequestTracker.jsx`: Table of active/past privacy requests with status steps.
  * `AuditLogTimeline.jsx`: Chronological timeline of all system events.

---

## 16 — BACKEND ARCHITECTURE (NODE.JS + EXPRESS)

* **Framework**: Node.js + Express.js + Prisma ORM + SQLite (`dev.db`).
* **Middleware**: `cors`, `express.json()`, `authMiddleware` (JWT validation).
* **Core Controllers**:
  * `eventController.js`: Receives extension events, creates DB records, updates score.
  * `websiteController.js`: Returns user's tracked digital footprint and site details.
  * `consentController.js`: Processes consent revocation.
  * `requestController.js`: Manages Tier 1/2/3 privacy requests and updates status.
  * `auditController.js`: Fetches user's audit log timeline.
  * `aiController.js`: Parses policy text using Gemini API (or rule-based fallback).

---

## 17 — DATABASE SCHEMA (PRISMA SQLITE)

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String           @id @default(uuid())
  name         String
  email        String           @unique
  passwordHash String
  privacyScore Int              @default(85)
  createdAt    DateTime         @default(now())
  dataItems    DataItem[]
  consents     Consent[]
  requests     PrivacyRequest[]
  auditLogs    AuditLog[]
}

model Website {
  id           String           @id @default(uuid())
  domain       String           @unique
  name         String
  category     String           @default("General")
  riskLevel    String           @default("Medium") // Low, Medium, High
  faviconUrl   String?
  deletionTier Int              @default(2) // 1: Direct API, 2: Guided URL, 3: Letter
  directApiUrl String?
  guidedUrl    String?
  dataItems    DataItem[]
  consents     Consent[]
  requests     PrivacyRequest[]
  auditLogs    AuditLog[]
}

model DataItem {
  id         String   @id @default(uuid())
  userId     String
  websiteId  String
  dataType   String   // Email, Phone, Name, Location
  detectedAt DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
  website    Website  @relation(fields: [websiteId], references: [id])
}

model Consent {
  id          String    @id @default(uuid())
  userId      String
  websiteId   String
  consentType String    // Account Creation, Marketing Emails, 3rd-Party Ads
  status      String    @default("ACTIVE") // ACTIVE, REVOKED
  grantedAt   DateTime  @default(now())
  revokedAt   DateTime?
  user        User      @relation(fields: [userId], references: [id])
  website     Website   @relation(fields: [websiteId], references: [id])
}

model PrivacyRequest {
  id          String   @id @default(uuid())
  userId      String
  websiteId   String
  requestType String   // CONSENT_REVOCATION, DATA_ERASURE, ACCOUNT_DELETION
  status      String   @default("SUBMITTED") // SUBMITTED, AWAITING_RESPONSE, COMPLETED
  methodUsed  String   // TIER1_DIRECT_API, TIER2_GUIDED, TIER3_GENERATED_NOTICE
  requestText String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id])
  website     Website  @relation(fields: [websiteId], references: [id])
}

model AuditLog {
  id          String   @id @default(uuid())
  userId      String
  websiteId   String
  action      String   // EVENT_DETECTED, CONSENT_REVOKED, DELETION_REQUESTED
  description String
  timestamp   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
  website     Website  @relation(fields: [websiteId], references: [id])
}
```

---

## 18 — API CONTRACTS (SHARED INTERFACES)

### 1. Extension ➔ Backend (`POST /api/events`)
```json
// Request
{
  "userId": "usr_12345",
  "domain": "shopease.com",
  "siteName": "ShopEase",
  "detectedFields": ["Email", "Phone", "Name"],
  "consents": [
    { "consentType": "Account Creation", "granted": true },
    { "consentType": "Marketing Emails", "granted": true }
  ],
  "timestamp": "2026-08-08T11:30:00Z"
}

// Response (201 Created)
{
  "success": true,
  "eventId": "evt_998877",
  "updatedPrivacyScore": 72,
  "websiteId": "web_shopease"
}
```

### 2. Dashboard ➔ Backend (`GET /api/dashboard/:userId`)
```json
// Response (200 OK)
{
  "user": { "name": "Joshua", "email": "joshua@example.com", "privacyScore": 72 },
  "stats": { "totalWebsites": 12, "activeConsents": 18, "pendingRequests": 2 },
  "websites": [
    {
      "id": "web_shopease",
      "domain": "shopease.com",
      "name": "ShopEase",
      "riskLevel": "Medium",
      "deletionTier": 1,
      "dataItems": ["Email", "Phone", "Name"],
      "activeConsents": ["Account Creation", "Marketing Emails"]
    }
  ]
}
```

### 3. Action Execution ➔ Backend (`POST /api/requests/create`)
```json
// Request
{
  "userId": "usr_12345",
  "websiteId": "web_shopease",
  "requestType": "CONSENT_REVOCATION",
  "targetConsent": "Marketing Emails",
  "tier": 1
}

// Response (200 OK)
{
  "success": true,
  "requestId": "req_554433",
  "status": "COMPLETED",
  "auditLogId": "aud_112233",
  "message": "Marketing consent revoked via Tier 1 Direct API."
}
```

---

## 19 — TEAM STRUCTURE & WORKSTREAM ALLOCATION

The project is divided into **5 logical roles**. (If team size is 4, Team Member 1 covers PM/Integration and assists Member 4).

* **TM1 — Project Lead & Integration Architect**: Shared contracts, master document, integration testing, pitch deck, demo flow.
* **TM2 — Browser Extension Engineer**: Chrome MV3 manifest, DOM interceptor, background script, Extension popup.
* **TM3 — Web Dashboard Frontend Engineer**: React App, Footprint grid, Website detail modal, Request Tracker UI, Audit log component.
* **TM4 — Backend & Database Engineer**: Express server, Prisma schema, REST APIs, 3-tier deletion handlers, ShopEase demo site.
* **TM5 — AI & Privacy Intelligence Engineer**: Gemini API integration, Policy summarizer controller, Privacy Score algorithm.

---

## 20 — FILE OWNERSHIP MATRIX (STRICT CONFLICT PREVENTION)

To prevent git merge conflicts in a 20-hour sprint, **no team member may edit a file owned by another member**.

| File / Folder Path | Owner | Read-Only For | Status |
|---|---|---|---|
| `shared/contracts.json` | **TM1** | TM2, TM3, TM4, TM5 | LOCKED |
| `MASTER_PROJECT_DOCUMENT.md` | **TM1** | TM2, TM3, TM4, TM5 | LIVE TRUTH |
| `extension/manifest.json` | **TM2** | TM1 | ACTIVE |
| `extension/content.js` | **TM2** | None | ACTIVE |
| `extension/background.js` | **TM2** | None | ACTIVE |
| `extension/popup/*` | **TM2** | TM3 | ACTIVE |
| `src/components/Dashboard.jsx` | **TM3** | TM1 | ACTIVE |
| `src/components/WebsiteDetail.jsx` | **TM3** | None | ACTIVE |
| `src/components/RequestTracker.jsx`| **TM3** | None | ACTIVE |
| `src/components/AuditLog.jsx` | **TM3** | None | ACTIVE |
| `backend/server.js` | **TM4** | TM1 | ACTIVE |
| `backend/prisma/schema.prisma` | **TM4** | TM5 | ACTIVE |
| `backend/controllers/*` | **TM4** | None | ACTIVE |
| `shopease-demo/*` | **TM4** | TM1, TM2 | ACTIVE |
| `backend/services/aiService.js` | **TM5** | TM4 | ACTIVE |

---

## 21 — ANTI-BLOCKING & MOCK DATA PROTOCOL

No team member shall wait for another team member's component to be finished. All components must operate against mock data until Integration Phase (Hour 12):

* **Extension (TM2)**: Logs events to `console.log` and uses `mockApiCall()` if backend is offline.
* **Dashboard (TM3)**: Operates 100% on `src/mocks/mockDashboardData.json`.
* **Backend (TM4)**: Uses Postman / curl scripts to test endpoints independently of Extension/Dashboard.
* **AI (TM5)**: Returns fallback JSON policies if Gemini API key or internet fails.

---

## 22 — 20-HOUR TIMELINE & MILESTONES

```
┌─────────────┬──────────────────────────────────────────────────────────────┐
│  TIMELINE   │ MILESTONE OBJECTIVES                                         │
├─────────────┼──────────────────────────────────────────────────────────────┤
│ Hour 0 – 1  │ Alignment, Master Document review, API contracts locked      │
│ Hour 1 – 4  │ Parallel Core Build (Extension listener, React UI, Prisma DB)│
│ Hour 4 – 8  │ Core Module Completion (Popup UI, 3-Tier drawers, REST APIs) │
│ Hour 8 – 12 │ Module Testing & AI Summarizer integration                   │
│ Hour 12–15  │ FULL SYSTEM INTEGRATION (Extension ➔ Backend ➔ Dashboard)    │
│ Hour 15–17  │ ShopEase Demo Site validation & 3-Tier Deletion dry-runs      │
│ Hour 17–18  │ P0/P1 Bug Fixes & Code Freeze                                │
│ Hour 18–19  │ Demo Video Recording & Pitch Deck Finalization               │
│ Hour 19–20  │ Final Submission & Presentation Rehearsal                    │
└─────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 23 — INDIVIDUAL TEAM MEMBER INSTRUCTION SHEETS

### 📄 TEAM MEMBER 1 (Project Lead / Integration Architect)
* **Role**: PM, Master Document Manager, System Integration & Pitch Lead.
* **Files Owned**: `shared/contracts.json`, `MASTER_PROJECT_DOCUMENT.md`, `pitch_deck.pptx`.
* **Key Tasks**:
  1. Maintain master document and ensure contracts are respected.
  2. Perform initial system integration at Hour 12 (`Extension -> API -> React UI`).
  3. Prepare pitch deck and 5-minute demo script.
* **Handoff Checklist**: Verified end-to-end data flow from ShopEase form submission to Dashboard card rendering.

### 📄 TEAM MEMBER 2 (Browser Extension Developer)
* **Role**: Chrome Extension MV3 Engineer.
* **Files Owned**: `extension/manifest.json`, `extension/content.js`, `extension/background.js`, `extension/popup/*`.
* **Key Tasks**:
  1. Write DOM form listener targeting `email`, `tel`, `name` inputs and consent checkboxes.
  2. Implement security mask (ignore passwords and credit card fields).
  3. Send `POST /api/events` payload to backend upon form submit.
  4. Build Extension Popup showing active domain privacy summary.
* **AI Handoff Prompt**: *"I am Team Member 2 building the Chrome MV3 Extension. Load MASTER_PROJECT_DOCUMENT.md. My files are extension/content.js and extension/background.js."*

### 📄 TEAM MEMBER 3 (Web Dashboard Developer)
* **Role**: React Frontend Engineer.
* **Files Owned**: `src/components/*`, `src/pages/*`, `src/mocks/mockDashboardData.json`.
* **Key Tasks**:
  1. Build Main Dashboard Overview (Stats, Privacy Score pill, Connected Sites grid).
  2. Build Website Detail View showing shared data items and active consents.
  3. Implement Tier 1 (Direct API), Tier 2 (Guided Drawer), and Tier 3 (Letter Generator) UI components.
  4. Build Privacy Request Tracker table and Audit Log timeline.
* **AI Handoff Prompt**: *"I am Team Member 3 building the React Dashboard. Load MASTER_PROJECT_DOCUMENT.md. My files are src/components/* using mock JSON data."*

### 📄 TEAM MEMBER 4 (Backend & Database Developer)
* **Role**: Node.js Express API & Database Engineer.
* **Files Owned**: `backend/server.js`, `backend/prisma/schema.prisma`, `backend/controllers/*`, `shopease-demo/*`.
* **Key Tasks**:
  1. Initialize Prisma SQLite schema and run migration.
  2. Implement REST endpoints: `POST /api/events`, `GET /api/dashboard/:userId`, `POST /api/requests/create`.
  3. Build "ShopEase" mock e-commerce demo site on port 3000 with signup form & consent checkboxes.
* **AI Handoff Prompt**: *"I am Team Member 4 building the Express API & Prisma DB. Load MASTER_PROJECT_DOCUMENT.md. My files are backend/server.js and shopease-demo/*."*

### 📄 TEAM MEMBER 5 (AI & Privacy Intelligence Developer)
* **Role**: AI & Privacy Algorithm Engineer.
* **Files Owned**: `backend/services/aiService.js`, `backend/utils/privacyScore.js`.
* **Key Tasks**:
  1. Implement Gemini API prompt to turn raw legal terms into 2-sentence plain English summaries.
  2. Implement rule-based fallback if Gemini API fails or times out.
  3. Implement Digital Privacy Score formula (`Score = 100 - (ActiveMarketing * 5) - (HighRiskSites * 10) + (RevokedConsents * 3)`).
* **AI Handoff Prompt**: *"I am Team Member 5 building AI Policy Summaries & Privacy Score. Load MASTER_PROJECT_DOCUMENT.md. My files are backend/services/aiService.js."*

---

## 24 — AI AGENT CONTINUATION PROTOCOL

If any team member opens a **NEW AI Chat Session**, copy and paste the following snippet along with this document:

```markdown
I am [TEAM MEMBER NUMBER: e.g. Team Member 3].
I am working on the PrivacyLens Hackathon project.
Attached is our MASTER_PROJECT_DOCUMENT.md which is our single source of truth.

Please read the document and confirm:
1. What component I own and what files I am allowed to edit.
2. What files I must NOT edit.
3. My current implementation task and next steps.
4. The exact API contracts I must adhere to.

Do NOT redesign the project or change the database schema without explicit approval.
```

---

## 25 — BUG MANAGEMENT & SEVERITY CLASSIFICATION

During the final 4 hours (Hours 16–20), bugs are handled strictly by priority:

* 🚨 **P0 (CRITICAL BLOCKER)**: Extension fails to send event; Dashboard crashes on render; ShopEase demo broken. -> **FIX IMMEDIATELY**.
* ⚠️ **P1 (MAJOR)**: Tier 3 letter formatting misaligned; Privacy Score calculation off by 5 points. -> **FIX IF TIME PERMITS**.
* ℹ️ **P2 / P3 (MINOR/COSMETIC)**: Favicon missing; CSS padding off by 4px. -> **DO NOT FIX DURING CODE FREEZE**.

---

## 26 — SECURITY & PRIVACY MODEL

1. **Zero Credential Retention**: Password inputs (`input[type="password"]`), credit card inputs, and security codes are strictly stripped out by `content.js` prior to any state update.
2. **Metadata-Only Processing**: The extension captures data *categories* (e.g., `"Email"`, `"Phone"`) rather than storing raw text strings wherever possible.
3. **Environment Isolation**: API Keys (e.g. Gemini API Key) are stored exclusively in backend `.env` files and never exposed in frontend bundles.

---

## 27 — DECISION LOG

* **DECISION #001**: Use Chrome Manifest V3 for browser extension (Mandated by modern Chrome standard).
* **DECISION #002**: Implement 3-Tier Deletion/Revocation Engine (Acknowledges open web reality instead of claiming false universal one-click account deletion).
* **DECISION #003**: Build "ShopEase" mock e-commerce site for live hackathon demo (Guarantees 100% reliable demo independent of 3rd party site changes).
* **DECISION #004**: Use SQLite with Prisma ORM for zero-configuration hackathon database setup.

---

## 28 — FINAL SUBMISSION CHECKLIST

- [ ] Chrome MV3 Extension builds cleanly with no console errors.
- [ ] Content script successfully detects signup on ShopEase (`http://localhost:3000`).
- [ ] Extension popup displays active domain privacy status.
- [ ] React Dashboard renders Digital Footprint cards and Privacy Score.
- [ ] Tier 1 (Direct API) consent revocation updates status to `REVOKED`.
- [ ] Tier 2 (Guided Drawer) opens direct website URL.
- [ ] Tier 3 (Legal Generator) creates formatted DPDP §12 erasure request letter.
- [ ] Privacy Request Tracker shows active request timeline.
- [ ] Audit Log displays chronological event proof.
- [ ] Pitch Deck finalized & 2-minute backup Loom video recorded.

---

*PrivacyLens Master Project Document v1.0 — Grounded in the DPDP Act 2023.*
