# System Context & Actor Boundaries

## 1. System Context Diagram (C4-Style)

The diagram below documents the actors, system boundaries, and external integration touchpoints of the Class Manager platform.

```mermaid
graph TD
    subgraph Actors ["System Actors (Users)"]
        Admin["School Leadership / Administrator<br/>(Hiệu trưởng / Ban Giám hiệu)"]
        GVCN["Homeroom Teacher<br/>(Giáo viên Chủ nhiệm)"]
        GVBM["Subject Teacher<br/>(Giáo viên Bộ môn)"]
        Unassigned["Unassigned Faculty<br/>(Giáo viên chưa phân công)"]
    end

    subgraph SystemBoundary ["Class Manager Application (Next.js 16 SPA)"]
        AppShell["Application Shell & Navigation<br/>(Desktop & Responsive MobileNav)"]
        AuthModule["Authentication & Session Service<br/>(AuthService & AuthGuard)"]
        ClassModule["Classroom Operations Module<br/>(Roster, Seating, Attendance, Timetable)"]
        AdminModule["Governance & Master Control<br/>(Faculty, Capacity, School Timetable, Reports)"]
    end

    subgraph ExternalTouchpoints ["External Systems & File Handlers"]
        LocalStorage["Browser LocalStorage<br/>(Offline Persistence cm_thcs_*)"]
        ExcelFiles["Spreadsheet Files (.xlsx, .csv)<br/>(Bulk Roster Import & 4-Sheet School Export)"]
        PrintEngine["Browser Print Engine<br/>(CSS @media print Landscape A4)"]
        Messaging["External Parent Communication<br/>(Direct Tel, SMS, Zalo Chat Links)"]
        TargetSupabase["Target Supabase Cloud<br/>(PostgreSQL + RLS + auth.users)"]
    end

    Admin -->|"Manages faculty, classes, timetable, reports"| AppShell
    GVCN -->|"Manages class roster, seating, attendance"| AppShell
    GVBM -->|"Records attendance for assigned subjects"| AppShell
    Unassigned -->|"Views unassigned onboarding banner"| AppShell

    AppShell --> AuthModule
    AppShell --> ClassModule
    AppShell --> AdminModule

    ClassModule <--> LocalStorage
    AdminModule <--> LocalStorage
    ClassModule <--> ExcelFiles
    AdminModule --> ExcelFiles
    ClassModule --> PrintEngine
    ClassModule --> Messaging
    AuthModule -.->|"Future Session Sync"| TargetSupabase
```

---

## 2. External Integration Touchpoints

| Touchpoint | Type | Description | File / Location |
| :--- | :--- | :--- | :--- |
| **Browser Storage** | Read/Write | Persists state across browser reloads using keys `cm_thcs_*`. | `src/lib/store.ts` |
| **Excel Parser (`xlsx`)** | Ingest | Parses binary `.xlsx`/`.csv` files for bulk student roster imports. | `src/app/(dashboard)/students/page.tsx` |
| **Excel Generator (`xlsx`)** | Egest | Generates multi-sheet Excel files for school reporting and attendance matrices. | `src/lib/export.ts` |
| **Print Engine (`@media print`)** | Egest | Renders borderless, landscape A4 pages for classroom seating charts and weekly timetables. | `src/app/globals.css` |
| **Parent Telephony / Zalo** | Egest URI | Launches `tel:`, `sms:`, and `https://zalo.me/` protocol handlers for 1-touch parent communication. | `src/app/(dashboard)/students/[id]/page.tsx` |
| **Supabase SSR Client** | Network (Stub) | Pre-configured SSR client and cookie refresher ready for PostgreSQL migration. | `src/middleware.ts`, `src/lib/supabase/*` |
