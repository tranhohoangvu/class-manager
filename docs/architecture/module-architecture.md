# Module Architecture

## 1. Directory & Package Structure

The application is structured into two primary workspace components: the **Frontend** (`frontend/`) and the **Backend** (`backend/`), coordinated by a root Monorepo workspace.

```text
school-ops/
├── frontend/                 # Next.js 16 App Router Frontend
│   ├── frontend/src/                  # Application source code
│   │   ├── app/              # Application pages and layout route groups
│   │   │   ├── (admin)/admin/    # Administrative governance pages
│   │   │   ├── (auth)/login/     # User login & test personas
│   │   │   ├── (dashboard)/      # Teacher & classroom operational pages
│   │   │   ├── access-denied/    # 403 Forbidden roadblock view
│   │   │   ├── globals.css       # Design tokens, OKLCH variables, print CSS
│   │   │   ├── layout.tsx        # Root HTML shell
│   │   │   └── page.tsx          # Root redirector based on auth & role
│   │   │
│   │   ├── components/       # Reusable UI & Shell Components
│   │   │   ├── shell/        # Navigational layout chrome (Sidebars, Topbar, Switcher)
│   │   │   └── ui/           # Design system primitives (Button, Modal, Input, Badge, etc.)
│   │   │
│   │   ├── contexts/         # Client-side React State Contexts
│   │   │   ├── auth-context.tsx  # Session persistence and active user state
│   │   │   └── class-context.tsx # Active class selection and contextual role resolver
│   │   │
│   │   ├── lib/              # Foundational utilities, API client, constants
│   │   │   ├── api-client.ts # Centralized REST API client (Fetch + credentials)
│   │   │   ├── auth.ts       # Authentication service & session helpers
│   │   │   ├── constants.ts  # Core business numbers, period schedules, subject colors
│   │   │   ├── export.ts     # Excel generation (xlsx) & template generator
│   │   │   ├── utils.ts      # Tailwind cn helper, date formatting
│   │   │   └── validations/  # Zod runtime schema definitions
│   │   │
│   │   ├── services/         # Domain services and business logic
│   │   └── types/            # Canonical TypeScript interfaces & domain models
│   │       └── index.ts
│   │
│   ├── frontend/tests/                # Vitest unit test suite (91 passing tests)
│   ├── next.config.ts        # Next.js configuration with API proxy rewrites
│   ├── postcss.config.mjs    # Tailwind PostCSS configuration
│   ├── tsconfig.json         # TypeScript configuration with @/* paths alias
│   ├── vitest.config.mjs     # Test environment configuration
│   └── package.json          # Frontend dependencies and build scripts
│
├── backend/                  # Dedicated Node.js + Express + TypeScript Backend
│   ├── frontend/src/
│   │   ├── config/           # Database pool (pg) and environment configuration
│   │   ├── controllers/      # Request handlers for Auth, Classes, Students, etc.
│   │   ├── middleware/       # JWT auth, RBAC guards, Zod validation, error handling
│   │   ├── repositories/     # Parameterized PostgreSQL data access layer
│   │   ├── routes/           # Express router endpoints
│   │   ├── services/         # Domain business logic and transaction management
│   │   ├── types/            # Backend types and Express Request extensions
│   │   ├── utils/            # Bcrypt hashing, JWT tokens, AppError classes
│   │   ├── app.ts            # Express application setup
│   │   └── server.ts         # Server bootstrapper & graceful shutdown
│   │
│   ├── migrations/           # PostgreSQL migration SQL files (001 -> 006)
│   ├── scripts/              # Migration runner script (migrate.ts)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── docs/                     # Technical documentation & architecture specifications
├── package.json              # Monorepo root workspace configuration
└── README.md
```

---

## 2. Component Hierarchy & Module Boundaries

### 2.1. Presentation Shell (`frontend/src/components/shell`)
* **`Sidebar` (`sidebar.tsx`)**: Primary navigation sidebar for teachers. Renders the school crest, class switcher, navigation links, active role indicator, user profile summary, and logout button.
* **`AdminSidebar` (`admin-sidebar.tsx`)**: Specialized navigation for administrators containing management links (`/admin/dashboard`, `/admin/classes`, `/admin/teachers`, `/admin/settings`).
* **`ClassSwitcher` (`class-switcher.tsx`)**: Context-aware dropdown allowing teachers to switch between assigned classes and showing contextual role badges (`GVCN`, `GVBM`).
* **`MobileNav` (`mobile-nav.tsx`)**: Responsive mobile drawer.

### 2.2. Design System Primitives (`frontend/src/components/ui`)
* **`Button` (`button.tsx`)**: Buttons with variant styles (`primary`, `secondary`, `outline`, `ghost`, `danger`).
* **`Badge` (`badge.tsx`)**: Attendance badges, student status badges, and role chips.
* **`Modal` & `ConfirmDialog` (`modal.tsx`)**: Accessible dialog modals for forms and destructive action confirmations.
* **`Input` (`input.tsx`)**: Form inputs with validation error states.
* **`StateViews` (`state-views.tsx`)**: Standardized loading skeletons and empty states.

---

## 3. Backend Module Hierarchy (`backend/src`)

```text
Request (HTTP)
   │
   ▼
[Route] ──> [Authenticate] ──> [RBAC Middleware] ──> [Zod Validate]
                                                            │
                                                            ▼
                                                     [Controller]
                                                            │
                                                            ▼
                                                      [Service]
                                                            │
                                                            ▼
                                                     [Repository]
                                                            │
                                                            ▼
                                                   [PostgreSQL DB]
```

* **Authentication & RBAC**: The backend derives teacher identity strictly from the verified JWT token (`req.user.id`). Client-provided teacher IDs are never trusted on write operations.
* **Database Access**: Direct parameterized SQL using connection pool (`pg.Pool`).
