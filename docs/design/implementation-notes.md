# Implementation Notes, Technical Debt & Migration Roadmap

This document outlines technical architecture decisions, historical documentation discrepancies, and the migration architecture to Node.js, Express, and PostgreSQL deployed on Render.

---

## 1. Documentation Discrepancies & Historical Evolution

During the codebase audit, certain discrepancies between early documentation and the current codebase were identified:

| Subject | Early Document (`docs/data-model.md` / `docs/codebase-audit.md`) | Current Codebase (`frontend/src/lib/constants.ts`, `001_initial_schema.sql`, `store.ts`) | Status & Resolution |
| :--- | :--- | :--- | :--- |
| **Desk Count per Class** | Documented as `25 desks` (50 seats, 5×5 grid). | Standardized to **`20 desks`** (40 seats, 4 columns × 5 rows). | **Current Code is Authoritative.** Updated in schema migration `001` and `constants.ts`. |
| **Class Maximum Students** | Documented as default `30`, max `45`. | Standardized to **default `30` (active dataset), maximum allowed ceiling `40`**. | **Current Code is Authoritative.** Capped at 40 seats in `CLASS_CONSTANTS.MAX_STUDENTS` and PostgreSQL check `max_students <= 40`. |
| **Timetable Shift Model** | Documented as generic 5-period morning model. | Implemented as **2-shift model (Khối 6 & 9 Sáng, Khối 7 & 8 Chiều)** with mandatory Saturday Homeroom slot. | **Current Code is Authoritative.** Full shift rules tested in `frontend/tests/timetable.test.ts`. |

---

## 2. Technical Decisions & Architectural Upgrades
 
### 2.1. Dual-Persistence & REST API Integration
* **Implementation:** The client application provides both offline-ready fallback (`LocalStore`) and a full REST API client (`frontend/src/lib/api-client.ts`) connecting to the standalone Express backend.
* **Impact:** In development/standalone mode, the app functions offline; when connected to the backend, mutations persist to native PostgreSQL on Render with multi-device synchronization.

### 2.2. Production Authentication & Security Hardening
* **Implementation:** Passwords in PostgreSQL are hashed with `bcryptjs` (10 rounds). The Express backend validates credentials, issues signed JWTs in `httpOnly`, `sameSite: 'lax'` cookies, and extracts claims via `auth.middleware.ts`.
* **Impact:** Full protection against XSS token theft, CSRF-resistant cookies, and timing-safe password verification.

### 2.3. Browser Memory Cache vs. Multi-Tab Synchronization
* **Limitation:** In offline `LocalStore` mode, `memoryCache` maintains state in memory. When connecting to the backend via `/api/*`, all queries reflect live database state.

---

## 3. Completed Backend Architecture & Render Deployment

The backend has been migrated from Supabase to a self-managed Node.js + Express + PostgreSQL architecture ready for deployment to Render:

1. **Backend Service (`backend/`):**
   - Express 5 + TypeScript layered architecture (`controllers/`, `services/`, `repositories/`, `middleware/`, `validators/`, `config/`).
   - Connection pool via `pg.Pool` with SSL rejection handling for Render PostgreSQL.
   - Centralized error handling (`AppError` -> `{ error: { code, message, details } }`).
   - Zod schema validation for all endpoints.

2. **Database Migrations (`backend/migrations/`):**
   - `001_initial_schema.sql`: 12 relational tables including unified `users` table.
   - `002_constraints.sql`: Grade limits, seat capacities, and timetable unique constraints.
   - `003_indexes.sql`: Foreign key and query optimization indexes.
   - `004_functions.sql` & `005_triggers.sql`: PostgreSQL triggers for capacity and grade limits.
   - `006_seed.sql`: Pre-hashed bcrypt credentials and full school master data.
   - Migration runner: `npm run migrate` in `backend/`.

3. **Frontend Integration:**
   - Centralized `api-client.ts` with transparent authentication cookie handling.
   - Next.js rewrites in `next.config.ts` proxying `/api/:path*` and `/health` to `http://localhost:4000` (or `BACKEND_URL`).
   - Edge middleware in `frontend/src/middleware.ts` verifying session cookies without any third-party SDK dependencies.

4. **Render Deployment:**
   - Database: Render PostgreSQL instance with standard `DATABASE_URL`.
   - Web Service: Node.js environment running `npm run build && npm start` in `backend/` with health check at `/health`.
