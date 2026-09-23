# Technical Design & Implementation Rationale

This document explains the technical implementation decisions observable in the codebase, detailing the architectural choices, tradeoffs, and design patterns.

---

## 1. Application Service Layer Abstraction

### Observable Implementation
All UI pages across `src/app/(dashboard)` and `src/app/(admin)` import and invoke methods from `src/services/*` rather than calling `LocalStore` or `localStorage` directly. Every service mutation returns an `OperationResult<T>`.

### Design Rationale
> Inferred from implementation

1. **Decoupling UI from Storage Technology:**
   By placing all authorization checks, input validation (Zod), and domain invariants inside `src/services/*`, the UI components treat the service layer as an abstract contract. When the project transitioned to a remote Node.js + Express REST API backed by PostgreSQL, the service internals and client network calls transitioned seamlessly via `src/lib/api-client.ts` with zero UI component breaking changes.
2. **Defensive Invariant Protection:**
   Placing business logic (such as checking duplicate student codes or class capacity) in the service layer prevents accidental state corruption caused by UI component bugs or direct console tampering.

---

## 2. In-Memory Cached `LocalStore` with Master Data Versioning

### Observable Implementation
In `src/lib/store.ts`, a global `memoryCache` holds parsed entity arrays. `ensureInitialized()` checks `localStorage.getItem('cm_data_version')`. If the stored version differs from `CURRENT_DATA_VERSION = '2026_thcs_ntt_4x5_20desks_v8'`, it flushes legacy storage keys and re-seeds from `src/lib/mock-data.ts`.

### Design Rationale
> Inferred from implementation

1. **Performance & Instant Rendering:**
   Reading parsed JSON directly from `memoryCache` avoids repeated expensive `JSON.parse()` cycles during rapid re-renders or page transitions.
2. **Deterministic Multi-Class Dataset:**
   Because the system models an entire secondary school (16 classes, 480 students, 24 teachers, 448 timetable slots), schema updates (e.g., transitioning from 25 to 20 desks) require clean, seamless migrations. Automatic version key invalidation ensures developers and testers always have consistent test data without having to manually clear browser storage.

---

## 3. Dynamic Context-Aware Role Resolution (`ClassContext`)

### Observable Implementation
In `src/contexts/class-context.tsx`, the system does not rely solely on `user.role === 'TEACHER'`. Instead, it evaluates `AuthService.getTeacherClassInfo(user, currentClassId)`, determining whether the user is `HOMEROOM_TEACHER` or `SUBJECT_TEACHER` for the currently selected class.

### Design Rationale
> Inferred from implementation

In Vietnamese secondary schools (THCS), teacher duties are contextual:
- A teacher may serve as GVCN for class 6A1 (responsible for student records, seating charts, and overall discipline).
- The same teacher may teach Mathematics as GVBM for classes 6A2, 7A1, and 7A2.
The contextual resolution engine automatically adjusts the UI and service permissions when switching classes via `ClassSwitcher`, eliminating the need for separate user accounts for distinct roles.

---

## 4. Uniform Seating Shuffle via Fisher-Yates Algorithm

### Observable Implementation
In `src/lib/store.ts` and `src/lib/utils.ts`, `randomizeSeating` extracts all active students in the class, applies the Fisher-Yates in-place shuffle (`shuffleArray`), and distributes the students into the 40 seats of the 20 desks.

### Design Rationale
> Inferred from implementation

Using the Fisher-Yates shuffle guarantees unbiased, mathematically uniform permutation ($O(n)$ complexity), preventing clustering patterns that commonly occur with naive `.sort(() => Math.random() - 0.5)` implementations.

---

## 5. Pure Tailwind CSS v4 & Semantic OKLCH Design Tokens

### Observable Implementation
In `src/app/globals.css`, the project defines custom CSS properties using the OKLCH color space:
```css
--bg: oklch(0.98 0.003 240);
--surface: oklch(1 0 0);
--border: oklch(0.89 0.006 240);
--accent: oklch(0.48 0.120 225);
--success: oklch(0.50 0.145 148);
--warning: oklch(0.62 0.140 70);
--danger: oklch(0.52 0.180 25);
```

### Design Rationale
> Inferred from implementation

1. **Perceptual Uniformity:**
   OKLCH delivers consistent perceived brightness and chroma across light themes, preventing harsh neon or oversaturated colors.
2. **Pedagogical Atmosphere:**
   Avoids generic AI-generated dark gradients or high-contrast cards in favor of a clean, calm, paper-like educational aesthetic (*"Light, clean, modern, practical, calm, trustworthy"*).
3. **Tailwind v4 Integration:**
   Uses `@theme inline` mapping to make custom semantic color classes (`bg-surface`, `text-text-primary`, `border-border`) available natively throughout components without bulky config files.

---

## 6. Official Landscape A4 Print Optimization

### Observable Implementation
In `globals.css` and individual pages (`/seating`, `/timetable`), print styles are applied using `@media print`:
- Paper rule: `@page { size: landscape; margin: 8mm; }`.
- Shell hiding: `.app-sidebar`, `.mobile-nav`, and `.btn-action` are assigned `display: none !important`.
- School headers and official BGH/GVCN signature blocks are revealed exclusively during print.

### Design Rationale
> Inferred from implementation

Vietnamese secondary school administrators and teachers require physical hard copies of classroom seating charts to paste on teachers' desks and weekly timetables to post on bulletin boards. Designing dedicated print stylesheets ensures clean, official printed documents without browser UI clutter.
