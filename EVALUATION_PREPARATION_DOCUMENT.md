# 🛡️ RECLAIM (PrivacyLens) — COMPLETE EVALUATION PREPARATION DOCUMENT
### *Comprehensive Technical & Non-Technical Master Guide for Evaluation / Pitch Round*

> **Project Name**: RECLAIM (PrivacyLens)  
> **Target Problem Domain**: DPDP Act 2023 Compliance & Digital Footprint Privacy  
> **Core Deliverable**: Manifest V3 Chrome Extension + Privacy Exposure & Risk Engine  
> **Last Updated**: August 8, 2026  

---

# SECTION 1: NON-TECHNICAL OVERVIEW & PITCH (FOR GENERAL AUDIENCE & JUDGES)

## 1.1 The 30-Second Elevator Pitch
> *"RECLAIM is a privacy-focused browser extension and digital identity assistant. It passively monitors where your personal data goes as you browse the web—without ever capturing your passwords or credit cards. It highlights high-risk exposures, tracks active marketing consents, calculates your digital privacy score, and provides a realistic 3-tier cleanup engine to revoke consents and request account deletions under the DPDP Act."*

---

## 1.2 The Problem Statement
Every day, internet users sign up for dozens of websites (e-commerce stores, forums, newsletters, streaming apps):
1. **Data Sprawl**: Users share names, emails, and phone numbers, accept marketing terms, and then forget about these accounts.
2. **Zero Visibility**: Users have no single dashboard showing which websites still hold their personal data or active marketing consents.
3. **DPDP Compliance Gap**: Under India's Digital Personal Data Protection (DPDP) Act 2023, users (*Data Principals*) have the legal right to withdraw consent and request data erasure. However, manually finding deletion settings across 50+ websites is practically impossible.

---

## 1.3 The Solution — RECLAIM
RECLAIM acts as an automated privacy shield while users browse normally:
* **Passive Discovery**: Automatically recognizes visited domains and form submissions.
* **Privacy Score**: Gives users an instant 0–100 privacy health score.
* **Risk Warnings**: Identifies high-risk websites holding sensitive data (email + phone + name) with active marketing consent or long inactivity.
* **Actionable Cleanup**: Provides an honest 3-tier mechanism to clean up unnecessary online accounts.

---

## 1.4 Core Value Propositions (Why RECLAIM Stand Out)
1. **Zero-Effort Automatic Discovery**: No manual logging required.
2. **Strict Privacy-by-Design**: Never harvests passwords, OTPs, credit cards, or raw personal data.
3. **Honest 3-Tier Deletion Model**: Unlike unrealistic tools claiming "magic 1-click universal account deletion", RECLAIM implements a realistic, working 3-tier action model (Direct API / Guided Official Link / DPDP Legal Request Generator).
4. **Full Transparency**: Every assigned risk score is backed by an explainable reason list.

---

## 1.5 The 1-Minute Live Demo Story
1. **Fresh Start**: Show RECLAIM in Chrome. In normal user mode, it starts completely clean (0 websites, 0 exposures, 100/100 privacy score).
2. **Live Browsing**: Visit `amazon.in`, `github.com`, and `youtube.com`. Show **Recent Website Activity** updating dynamically in real time (top 5 rolling list).
3. **Exposure Interception**: Open a test form, enter Name & Email, check "Marketing Consent", and click Submit.
4. **Notification & Snapshot**: RECLAIM intercepts the event metadata (zero passwords/PII captured). The extension popup shows:
   * **Domain**: `amazon.in`
   * **Status**: `EXPOSURE DETECTED`
   * **Categories**: `Email`, `Name`, `Marketing Consent`
   * **Risk**: `MEDIUM`
5. **Dashboard & Cleanup**: Show the explainable risk reasons (*"Email & Name linked"*, *"Marketing consent active"*). Click **[Start Cleanup]** to view the official deletion link and copyable DPDP Erasure Request template.

---

# SECTION 2: TECHNICAL ARCHITECTURE & DEEP DIVE (FOR TECHNICAL JUDGES)

## 2.1 Technology Stack & System Architecture
* **Manifest Version**: Chrome Extension Manifest V3 (MV3)
* **Frontend Components**: Vanilla JavaScript, HTML5, Modular CSS3
* **Background Layer**: Service Worker (`background.js`) using Service Worker event architecture
* **Data Storage**: `chrome.storage.local` with bounded size limits (max 200 exposure records)
* **API Integration**: RESTful API endpoints (`POST http://localhost:5000/api/events`) with offline-resilient fallback

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             BROWSER EXTENSION                               │
│                                                                             │
│  ┌───────────────────┐    PAGE_VISIT /    ┌──────────────────────────────┐  │
│  │   content.js      │ ─────────────────► │        background.js         │  │
│  │ (DOM Interceptor) │  FORM_SUBMISSION   │   (Service Worker & Engine)  │  │
│  └───────────────────┘                    └──────────────┬───────────────┘  │
│                                                          │                  │
│                                              Updates     │ Storage &        │
│                                              Real-time   │ Messaging        │
│                                                          ▼                  │
│                                           ┌──────────────────────────────┐  │
│                                           │   popup.html / popup.js      │  │
│                                           │      (User Interface)        │  │
│                                           └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2.2 Core Technical Modules & Implementation Details

### Module A: Privacy-by-Design Interceptor (`content.js`)
* **Role**: Runs on web pages at `document_end`.
* **Security Barrier (`isSensitiveField`)**: Explicitly ignores inputs with `type="password"`, `type="hidden"`, `type="file"` or names/IDs/autocompletes containing `password`, `cc`, `creditcard`, `cvv`, `otp`, `pin`, `ssn`, `token`, `secret`.
* **Abstract Category Detection**: Only extracts category labels (`email`, `phone`, `name`, `marketing`, `terms`). Raw input values are **never** read, logged, or transmitted.
* **Passive Page Visit Listener**: On page load, if protocol is `http:` or `https:`, sends a `PAGE_VISIT` event to `background.js`.

### Module B: Shared Domain Normalization Algorithm
```javascript
function normalizeDomain(hostname) {
  if (!hostname) return '';
  let domain = hostname.toLowerCase().trim().split(':')[0];
  if (domain.startsWith('www.')) {
    domain = domain.substring(4);
  }
  return domain;
}
```
* **Purpose**: Standardizes URLs like `https://www.amazon.in/dp/B08X` $\rightarrow$ `amazon.in`. Used uniformly across content script, service worker, and popup.

### Module C: Internal Browser URL Filtering
* **Function**: `isInternalUrl(urlOrDomain)`
* **Filter List**: Filters out `chrome://`, `chrome-extension://`, `edge://`, `about:`, `devtools://`, `file://`, `blob:`, `data:`. Internal browser navigation is **never** added to user activity.

### Module D: Rolling 5 Most Recently Visited Unique Domains Queue
* **Storage Key**: `recentWebsiteVisits`
* **Capacity Limit**: `MAX_RECENT_VISITS = 5`
* **Duplicate Domain Handling**:
  When a visit to domain $D$ occurs:
  1. Remove any existing entry for domain $D$ from the queue.
  2. Insert `{ domain: D, timestamp: now, isDemo: false }` at index 0 (TOP).
  3. Trim array length to max 5.
  *Result*: Guarantees the list represents the 5 most recently visited **unique** domains in recency order.

### Module E: Explainable Risk Classification Engine
* **Location**: `evaluateRisk()` in `background.js`.
* **Scoring Rules**:
  * `email` captured $\Rightarrow$ +1 point
  * `phone` captured $\Rightarrow$ +2 points (Higher severity)
  * `name` captured $\Rightarrow$ +1 point
  * `marketing` consent granted $\Rightarrow$ +2 points
  * `promotional` consent active $\Rightarrow$ +2 points
  * Inactivity $>30$ days $\Rightarrow$ +1 point; $>90$ days $\Rightarrow$ +2 points
* **Classification Thresholds**:
  * Score $\ge 6 \Rightarrow$ **HIGH RISK**
  * Score $\ge 3 \Rightarrow$ **MEDIUM RISK**
  * Score $< 3 \Rightarrow$ **LOW RISK**
* **Explainability Output**: Generates human-readable reason strings (e.g. *"Phone number captured (+2 severity)"*, *"Marketing communications consent granted"*).

### Module F: Dynamic Privacy Health Score Algorithm
* **Formula**: Base score of 100, decremented based on total domain exposures:
  $$\text{Score} = \max\left(15, \min\left(100, 100 - (10 \times N_{\text{High}}) - (5 \times N_{\text{Med}}) - (2 \times N_{\text{Low}}) - (2 \times N_{\text{Marketing}})\right)\right)$$
* Clearly labeled in UI as **MVP Heuristic**.

### Module G: Honest 3-Tier Cleanup Engine
1. **Tier 1 (Direct API)**: Partner sites providing integrated revocation endpoints (`POST /api/partner/revoke`).
2. **Tier 2 (Guided URL)**: Sites with official privacy pages registered in `CLEANUP_REGISTRY` (e.g., `google.com`, `facebook.com`, `amazon.in`, `linkedin.com`).
3. **Tier 3 (DPDP Legal Request Generator)**: Generates a copyable, formal legal request notice citing DPDP Act §6 (Consent Withdrawal) and §12 (Data Erasure).

---

## 2.3 Storage Architecture (3 Isolated Data Models)

| Data Model | Storage Key | Capacity Limit | Primary Purpose |
|---|---|---|---|
| **Full Exposure Database** | `exposures` | Max 200 records | Domain exposure records, risk scores, cleanup statuses. **NOT capped at 5**. |
| **Recent Website Activity** | `recentWebsiteVisits` | Max 5 records | Rolling list of top 5 recently visited unique domains. Used in extension popup. |
| **Timeline Audit Log** | `timeline` | Max 50 records | Chronological audit trail of privacy actions and form submissions. |

---

# SECTION 3: ANTICIPATED EVALUATION QUESTIONS & ANSWERS (Q&A)

### Q1: How does RECLAIM protect sensitive user data like passwords or credit card numbers?
**Answer**: RECLAIM implements strict Privacy-by-Design at the content script level (`isSensitiveField` function). Inputs of type `password`, `hidden`, `file` or attributes containing keywords like `pass`, `card`, `cvv`, `otp`, `pin`, `ssn` are **completely bypassed**. Furthermore, RECLAIM **never extracts or stores raw input values**—it extracts only abstract category flags like `email` or `phone`.

### Q2: Does RECLAIM claim to automatically delete accounts across any website with 1 click?
**Answer**: No. Universal 1-click deletion across the open web is technically impossible due to authentication and CSRF barriers. RECLAIM uses an **honest 3-tier action engine**:
* Direct API for partner sites.
* Guided direct URLs for official deletion pages.
* Formal DPDP Act Legal Erasure Notices for manual outreach.

### Q3: Why does fresh installation show 0 websites and 100/100 score?
**Answer**: To prevent false reporting. Real user mode starts completely clean. Fake/demo data is strictly isolated under `demoMode` and is only injected if the user explicitly enables "Hackathon Demo Mode" in settings.

### Q4: How does the Recent Website Activity list handle duplicate domain visits?
**Answer**: When a user re-visits a domain (e.g., visiting `amazon.in` again after `github.com`), RECLAIM removes the older `amazon.in` entry and unshifts the new visit to index 0 (top) with the updated timestamp. This keeps the list deduplicated to the 5 most recently visited **unique** domains.

### Q5: How does this project align with the DPDP Act 2023?
**Answer**: Under DPDP §6 (Right to Withdraw Consent) and §12 (Right to Erasure of Personal Data), Data Principals require visibility into who holds their data and an audit trail of erasure requests. RECLAIM provides this visibility, generates compliant legal requests, and maintains an immutable local audit timeline.

---

# SECTION 4: FILE DIRECTORY & CODE STRUCTURE SUMMARY

```
DPDP-Project/
├── extension/
│   ├── manifest.json       # Manifest V3 configuration (activeTab, storage permissions)
│   ├── content.js          # DOM Interceptor, category detector & PAGE_VISIT trigger
│   ├── background.js       # Service worker, risk engine, cleanup registry & 5-visit queue
│   ├── popup/
│   │   ├── popup.html      # Popup UI markup (Current Site, Overview Stats, Recent Activity)
│   │   └── popup.js        # Popup controller, real-time storage listener & score renderer
│   └── test_page.html      # Local interactive form test harness
├── MASTER_PROJECT_DOCUMENT (1).md
└── EVALUATION_PREPARATION_DOCUMENT.md  <-- This Document
```

---
*End of Evaluation Preparation Document.*
