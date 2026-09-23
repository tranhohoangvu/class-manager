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
        BackendAPI["Node.js + Express REST API<br/>(Render Web Service)"]
        PostgresDB["PostgreSQL Database<br/>(Render PostgreSQL)"]
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
    AuthModule -->|"JWT & Session Auth"| BackendAPI
    ClassModule -->|"REST API /api/*"| BackendAPI
    AdminModule -->|"REST API /api/*"| BackendAPI
    BackendAPI <-->|"pg connection pool"| PostgresDB
```

---

## 2. External Integration Touchpoints

| Touchpoint | Type | Description | File / Location |
| :--- | :--- | :--- | :--- |
| **Browser Storage** | Read/Write | Persists state across browser reloads using keys `cm_thcs_*`. | `frontend/src/lib/store.ts` |
| **Excel Parser (`xlsx`)** | Ingest | Parses binary `.xlsx`/`.csv` files for bulk student roster imports. | `frontend/src/app/(dashboard)/students/page.tsx` |
| **Excel Generator (`xlsx`)** | Egest | Generates multi-sheet Excel files for school reporting and attendance matrices. | `frontend/src/lib/export.ts` |
| **Print Engine (`@media print`)** | Egest | Renders borderless, landscape A4 pages for classroom seating charts and weekly timetables. | `frontend/src/app/globals.css` |
| **Parent Telephony / Zalo** | Egest URI | Launches `tel:`, `sms:`, and `https://zalo.me/` protocol handlers for 1-touch parent communication. | `frontend/src/app/(dashboard)/students/[id]/page.tsx` |
| **Express REST API Client** | Network | Centralized REST client calling backend endpoints via Next.js proxy or direct base URL. | `frontend/src/lib/api-client.ts`, `backend/src/*` |
| **Render PostgreSQL** | Database | Relational database hosting 12 normalized tables with triggers, indexes, and constraints. | `backend/src/config/database.ts` |

