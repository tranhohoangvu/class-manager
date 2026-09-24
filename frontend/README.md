# Class Manager — Frontend Application

A modern web application engineered for secondary school management (Trường THCS), built on **Next.js 16 (App Router)** and **React 19**.

---

## 🛠️ Technology Stack

* **Framework:** Next.js 16.3.5 (App Router, Turbopack)
* **Core Library:** React 19.2.8, TypeScript 5
* **Styling:** TailwindCSS v4 (@tailwindcss/postcss), Phosphor Icons (`@phosphor-icons/react`)
* **State Management:** React Context (`AuthContext`, `ClassContext`) + Layered Domain Service Architecture
* **Validation & Forms:** Zod 3.25
* **Testing:** Vitest 5.0 (8 test suites, 105 passing unit tests)
* **Data Processing & Export:** SheetJS (`xlsx`) for bidirectional Excel import and export
* **UI Feedback:** Sonner (Toast notifications)

---

## 📁 Directory Structure

```text
frontend/
├── src/
│   ├── app/                      # Next.js App Router (Pages, Layouts, Route Groups)
│   │   ├── (admin)/admin/        # Administrative governance (Classes, Teachers, Timetable Management, Reports)
│   │   │   └── timetable/        # School-wide Admin Timetable matrix, filtering, editor & audit engine
│   │   ├── (auth)/login/         # Authentication view & 1-click test personas
│   │   ├── (dashboard)/          # Operational views (Seating, Attendance, Timetable, Students)
│   │   │   ├── announcements/    # Class announcements board
│   │   │   ├── attendance/       # Smart period-based attendance tracking
│   │   │   ├── dashboard/        # Homeroom classroom overview
│   │   │   ├── history/          # Attendance history across custom date ranges
│   │   │   ├── seating/          # 20 Desks / 40 Students grid (Click-to-Swap, Fisher-Yates shuffle)
│   │   │   ├── settings/         # Class capacity & room settings
│   │   │   ├── students/         # Student roster management & Excel import
│   │   │   │   └── [id]/         # Student profile & 1-touch parent contact cards
│   │   │   └── timetable/        # 2-shift weekly timetable matrix (Morning / Afternoon)
│   │   ├── access-denied/        # 403 Forbidden roadblock view
│   │   ├── globals.css           # OKLCH design tokens & landscape A4 print styles (@media print)
│   │   ├── layout.tsx            # Root HTML shell & Auth Provider wrapper
│   │   └── page.tsx              # Root redirector based on authenticated role
│   │
│   ├── components/
│   │   ├── shell/                # Chrome navigation (Sidebar, AdminSidebar, MobileNav, ClassSwitcher)
│   │   └── ui/                   # Design system primitives (Button, Input, Modal, Badge, StateViews)
│   │
│   ├── contexts/
│   │   ├── auth-context.tsx      # Session lifecycle & authenticated staff state
│   │   └── class-context.tsx     # Active class selection & dynamic role resolver (GVCN vs GVBM)
│   │
│   ├── lib/
│   │   ├── api-client.ts         # Centralized REST API client for Express backend communication
│   │   ├── auth.ts               # Local authentication service & persona accounts
│   │   ├── constants.ts          # Core domain numbers (shifts, subjects, palette constants)
│   │   ├── export.ts             # Excel generator & import template definitions
│   │   ├── mock-data.ts          # Deterministic seed data (16 classes, 480 students)
│   │   ├── store.ts              # LocalStore (Client-side persistence singleton)
│   │   ├── utils.ts              # Formatting utilities (Vietnamese dates, cn helper)
│   │   └── validations/          # Zod runtime validation schemas
│   │
│   ├── services/                 # Business logic & invariant enforcement layer
│   │   ├── admin-report.service.ts
│   │   ├── announcement.service.ts
│   │   ├── attendance.service.ts
│   │   ├── auth-guard.ts         # Role-Based Access Control (RBAC) matrix
│   │   ├── class.service.ts
│   │   ├── note.service.ts
│   │   ├── seating.service.ts
│   │   ├── student.service.ts
│   │   ├── teacher.service.ts
│   │   └── timetable.service.ts
│   │
│   ├── types/                    # Canonical TypeScript interfaces & domain models
│   └── middleware.ts             # Next.js route protection & redirect middleware
│
├── tests/                        # Vitest automated test suite (105 unit tests)
├── next.config.ts                # Next.js configuration & API proxy rewrites to Backend (:4000)
├── postcss.config.mjs            # Tailwind PostCSS configuration
├── tsconfig.json                 # TypeScript compiler configuration with @/* alias
├── vitest.config.mjs             # Test runner configuration
├── .env.example                  # Environment variable template
└── package.json                  # Frontend dependencies and scripts
```

---

## 🚀 Running Locally

### 1. Install Dependencies (from within `frontend/`):
```bash
npm install
```

### 2. Configure Environment Variables:
Copy `.env.example` to create your local environment file:
```bash
cp .env.example .env.local
```

Default configuration in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Start Development Server:
```bash
npm run dev
```
The application will be running at: **`http://localhost:3000`**

### 4. Run Automated Tests:
```bash
npm test
```
Executes all 8 test suites covering RBAC permissions, seating algorithms, timetable scheduling, attendance logic, and roster imports.

### 5. Production Build:
```bash
npm run build
npm run start
```

---

## 🔗 Backend API Proxy Rewrites

Configured inside `next.config.ts`, Next.js transparently forwards API traffic:
* Incoming requests to `/api/:path*` are rewritten to the Express Backend (default: `http://localhost:4000/api/:path*`).
* Endpoint `/health` is rewritten to `http://localhost:4000/health`.

This eliminates CORS friction during local development and allows seamless client communication without hardcoding remote origin URLs.
