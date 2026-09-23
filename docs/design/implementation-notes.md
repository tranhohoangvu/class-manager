# Implementation Notes, Technical Debt & Migration Roadmap

This document outlines observable technical debt, edge cases, historical documentation discrepancies, and the migration checklist to Supabase/PostgreSQL.

---

## 1. Documentation Discrepancies & Historical Evolution

During the codebase audit, certain discrepancies between early documentation and the current codebase were identified:

| Subject | Early Document (`docs/data-model.md` / `docs/codebase-audit.md`) | Current Codebase (`src/lib/constants.ts`, `001_initial_schema.sql`, `store.ts`) | Status & Resolution |
| :--- | :--- | :--- | :--- |
| **Desk Count per Class** | Documented as `25 desks` (50 seats, 5×5 grid). | Standardized to **`20 desks`** (40 seats, 4 columns × 5 rows). | **Current Code is Authoritative.** Updated in schema migration `001` and `constants.ts`. |
| **Class Maximum Students** | Documented as default `30`, max `45`. | Standardized to **default `30` (active dataset), maximum allowed ceiling `40`**. | **Current Code is Authoritative.** Capped at 40 seats in `CLASS_CONSTANTS.MAX_STUDENTS` and PostgreSQL check `max_students <= 40`. |
| **Timetable Shift Model** | Documented as generic 5-period morning model. | Implemented as **2-shift model (Khối 6 & 9 Sáng, Khối 7 & 8 Chiều)** with mandatory Saturday Homeroom slot. | **Current Code is Authoritative.** Full shift rules tested in `tests/timetable.test.ts`. |

---

## 2. Known Limitations & Technical Debt

### 2.1. Client-Side State Persistence
* **Limitation:** All mutations persist only to the active browser's `localStorage`. Opening the application in another browser or incognito window starts with the default seed data.
* **Impact:** Multiple teachers cannot collaborate in real time on separate devices until the Supabase backend is connected.

### 2.2. Mock Authentication & Plaintext Passwords
* **Limitation:** In `src/lib/mock-data.ts`, test accounts have plaintext passwords (`admin`, `teacher1`, `teacher23`). In `src/lib/auth.ts`, session verification compares passwords directly.
* **Impact:** Suitable only for local demonstration and automated testing. In production, Supabase Auth handles bcrypt hashing and secure HTTP-only cookie issuance.

### 2.3. Browser Memory Cache vs. Multi-Tab Synchronization
* **Limitation:** `LocalStore` maintains an in-memory object `memoryCache`. If a user mutates data in Tab A, Tab B will only synchronize upon a full page reload or when reading keys that bypass the cache.
* **Impact:** Minor in single-tab usage; would require a `storage` event listener for multi-tab sync.

---

## 3. Concrete Supabase Migration Checklist

When transitioning from `LocalStore` to Supabase:

1. **Environment Setup:**
   - Create a project on Supabase Cloud or self-hosted Supabase.
   - Update `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. **Execute Database Migrations:**
   - Run `supabase/migrations/001_initial_schema.sql` to generate tables, constraints, indexes, triggers, and RLS policies.
   - Run `supabase/seed.sql` to populate initial subjects, classes, 20 desks per class, and teacher profiles.
3. **Activate Edge Middleware (`src/middleware.ts`):**
   - The middleware will automatically detect valid credentials and begin validating auth tokens via `supabase.auth.getUser()`.
4. **Service Layer Transition:**
   - Swap `LocalStore.*` calls in `src/services/*` to Supabase client calls:
     - `StudentService`: `supabase.from('students').insert(...)`
     - `AttendanceService`: `supabase.from('attendance').upsert(...)`
     - `TimetableService`: `supabase.from('timetable_entries').insert(...)`
   - Because all UI components call `src/services/*`, zero UI component modifications are required.
