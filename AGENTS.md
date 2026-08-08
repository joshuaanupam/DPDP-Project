# 🛡️ PRIVACYLENS — ANTIGRAVITY TEAM WORKFLOW & CONSTRAINTS

## 1. PROJECT IDENTITY & SINGLE SOURCE OF TRUTH
- **Master Specification File**: `MASTER_PROJECT_DOCUMENT (1).md`
- All AI sessions must strictly obey the file ownership matrix and API contracts.

## 2. 4-MEMBER TEAM ROLE ALLOCATION & FILE OWNERSHIP MATRIX
To prevent Git merge conflicts in this fast-paced sprint, NO TEAM MEMBER / AI AGENT MAY EDIT A FILE OWNED BY ANOTHER MEMBER.

### MEMBER 1: Team Lead, Integration Architect & AI Intelligence
- **Files Owned**: `shared/contracts.json`, `MASTER_PROJECT_DOCUMENT.md`, `backend/services/aiService.js`, `backend/utils/privacyScore.js`
- **Tasks**: Contracts, Gemini API Policy Summarizer, Privacy Score formula, cross-system integration & pitch.

### MEMBER 2: Chrome Extension Engineer
- **Files Owned**: `extension/manifest.json`, `extension/content.js`, `extension/background.js`, `extension/popup/*`
- **Tasks**: Chrome MV3 manifest, DOM form listener (ignore passwords/credit cards), background event logger, extension popup UI.

### MEMBER 3: Web Dashboard Frontend Engineer
- **Files Owned**: `src/components/*`, `src/pages/*`, `src/mocks/mockDashboardData.json`
- **Tasks**: React + Tailwind dashboard overview, website detail modal, 3-tier action modals, request tracker, audit log timeline.

### MEMBER 4: Backend, Database & Demo Site Engineer
- **Files Owned**: `backend/server.js`, `backend/prisma/schema.prisma`, `backend/controllers/*`, `shopease-demo/*`
- **Tasks**: Prisma SQLite schema & migrations, REST API endpoints, 3-tier action backend handlers, "ShopEase" mock e-commerce site on port 3000.

## 3. ANTI-BLOCKING PROTOCOL
- Do NOT wait for another team member's component.
- Frontend (Member 3) works off `src/mocks/mockDashboardData.json`.
- Extension (Member 2) logs to console & local mock fallback.
- Backend (Member 4) tests via curl/Postman scripts.
- AI Service (Member 1) uses rule-based fallback if Gemini API is unavailable.

<!-- TM1: MaheshKaranam2006 - AI Intelligence, Privacy Score, Website Brief - DPDP Act Compliance -->
