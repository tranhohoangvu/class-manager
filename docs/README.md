# SchoolOps — Technical Documentation Specification

> **System:** SchoolOps (Nguyen Tat Thanh Secondary School — Academic Year 2026–2027)  
> **Architecture:** Next.js 16 App Router · Node.js + Express + TypeScript API · Native PostgreSQL · Per-Class RBAC · Render Ready  
> **Source of Truth:** Active implementation in codebase (`frontend/src/`, `backend/`, `frontend/tests/`)

---

## 📚 Documentation Map & Index

This documentation suite reverse-engineers the actual implementation found in the codebase. All specifications, data schemas, business rules, and workflows reflect the active source code.

```text
docs/
├── README.md                                # Master documentation entry point (this file)
│
├── architecture/
│   ├── system-architecture.md               # High-level architecture, multi-tier layers, runtime model
│   ├── module-architecture.md               # Module boundaries, package structure, state management
│   └── deployment-architecture.md           # Next.js 16 build targets, Turbopack, SSR middleware
│
├── requirements/
│   ├── functional-overview.md               # Functional decomposition tree, feature modules, data flow
│   ├── use-cases.md                         # Detailed system actor use cases and error paths
│   └── business-rules.md                    # Auditable catalog of business rules (BR-001 to BR-019)
│
├── data/
│   ├── database-design.md                   # Relational PostgreSQL Database Schema (Render Hosted)
│   └── er-diagram.md                        # Complete Mermaid Entity-Relationship Diagram (12 tables)
│
├── api/
│   └── api-reference.md                     # Application Service Layer method signatures & contracts
│
├── security/
│   ├── authentication.md                    # Mock session lifecycle, storage keys, 1-click test personas
│   └── authorization.md                     # Dynamic per-class RBAC matrix, AuthGuard, RLS policies
│
├── workflows/
│   ├── login.md                             # User login, session initialization, role routing
│   ├── attendance.md                        # Smart period attendance, quick filters, BGH copy action
│   ├── seating.md                           # 4x5 classroom grid, Click-to-Swap, Fisher-Yates, live overlay
│   ├── timetable.md                         # 2-shift timetable schedule, conflict prevention engine
│   ├── student-management.md                # Student CRUD, bulk Excel import, parent contact cards
│   └── admin-operations.md                  # School-wide attendance KPIs, 4-sheet master Excel export
│
├── diagrams/
│   ├── system-context.md                    # C4-style System context and external touchpoints
│   ├── use-case-diagrams.md                 # System & subsystem UML Use Case diagrams (UC-01 - UC-06)
│   ├── class-diagrams.md                    # Domain model & Service-Layer UML Class diagrams
│   ├── sequence-diagrams.md                 # 6 authoritative Mermaid sequence diagrams
│   ├── activity-diagrams.md                 # Activity flowcharts for core decision engines
│   └── state-diagrams.md                    # Entity lifecycles (Student, Attendance, Seat, Class, User)
│
├── design/
│   ├── DESIGN.md                            # Visual design system, component states, and layout spec
│   ├── SKILL.md                             # Design conformance checklist & developer skill cheatsheet
│   ├── technical-design.md                  # Technical decisions, OKLCH tokens, offline-first rationale
│   └── implementation-notes.md              # Migration architecture, technical notes, and Render deployment
│
└── traceability/
    └── feature-to-code.md                   # Full traceability matrix from UI to Service to DB and Tests
```

---

## 🏛️ Quick Links by Topic

### 1. Architecture
* [System Architecture](architecture/system-architecture.md): High-level system structure, multi-tier layout, synchronous client method invocations, and operation result contracts.
* [Module Architecture](architecture/module-architecture.md): Breakdown of `frontend/src/app`, `frontend/src/components`, `frontend/src/services`, `frontend/src/contexts`, and `frontend/src/lib`.
* [Deployment Architecture](architecture/deployment-architecture.md): Next.js 16 build pipeline, route inventory, Turbopack, and edge middleware.

### 2. Requirements & Business Rules
* [Functional Overview](requirements/functional-overview.md): Comprehensive functional decomposition tree of Teacher and Admin portals.
* [Use Cases](requirements/use-cases.md): Use-case flows for Administrator, Homeroom Teacher (GVCN), and Subject Teacher (GVBM).
* [Business Rules Catalog](requirements/business-rules.md): Numbered catalog of rules (BR-001 through BR-019) covering classroom capacity (40 seats), teacher 2-grade limit, timetable conflict invariants, and attendance permissions.

### 3. Data Model & Relational Schema
* [Database Design](data/database-design.md): Deep-dive into active `LocalStore` keys vs. target PostgreSQL tables (`profiles`, `subjects`, `classes`, `timetable_entries`, `students`, `desks`, `seats`, `attendance`, etc.).
* [ER Diagram](data/er-diagram.md): Mermaid Entity-Relationship diagram showing all 12 entities, cardinalities, primary keys, and foreign keys.

### 4. Application Service API
* [API Reference](api/api-reference.md): Specification of the TypeScript domain services (`StudentService`, `SeatingService`, `AttendanceService`, `TimetableService`, `ClassService`, `TeacherService`, `AdminReportService`, `AuthGuard`). Clarifies that HTTP REST endpoints are not present.

### 5. Security & RBAC
* [Authentication](security/authentication.md): JWT token & HTTP-only cookie authentication, session lifecycle, and 6 test personas.
* [Authorization & RBAC](security/authorization.md): Dynamic per-class authorization matrix, `AuthGuard` assertions, and PostgreSQL Row-Level Security (RLS) policies.

### 6. Core Workflows & Walkthroughs
* [Workflow: User Login](workflows/login.md)
* [Workflow: Attendance Management](workflows/attendance.md)
* [Workflow: Seating Chart Arrangements](workflows/seating.md)
* [Workflow: Timetable Schedule & Conflict Prevention](workflows/timetable.md)
* [Workflow: Student Roster & Excel Import](workflows/student-management.md)
* [Workflow: Administration Governance & Reporting](workflows/admin-operations.md)

### 7. Diagrams
* [System Context](diagrams/system-context.md): System boundaries and external touchpoints.
* [Use Case Diagrams](diagrams/use-case-diagrams.md): System & subsystem UML Use Case diagrams (UC-01 through UC-06).
* [Class Diagrams](diagrams/class-diagrams.md): Domain Model & Service-Layer UML Class diagrams.
* [Sequence Diagrams](diagrams/sequence-diagrams.md): 6 detailed sequence diagrams.
* [Activity Diagrams](diagrams/activity-diagrams.md): Decision flowcharts for timetable conflicts, student capacity, and teacher grade limits.
* [State Diagrams](diagrams/state-diagrams.md): Lifecycles for students, attendance statuses, seats, and classes.

### 8. Technical Decisions & Traceability
* [Visual Design System Spec](design/DESIGN.md): Visual design tokens, 7-state button/form contracts, and layout specifications.
* [Design Skill & Conformance Guide](design/SKILL.md): Token quick reference, component inventory, and audit conformance checklist.
* [Technical Design & Rationale](design/technical-design.md): Inferred design decisions, Fisher-Yates shuffle, OKLCH tokens, and A4 print styling.
* [Implementation Notes & Roadmap](design/implementation-notes.md): Migration architecture, technical notes, and Render deployment specifications.
* [Feature-to-Code Traceability](traceability/feature-to-code.md): End-to-end matrix mapping requirements to UI pages, services, store keys, and Vitest test suites.

---

## 🔍 Verification & Health
* **Test Suite:** 8 test files, 91 automated tests passing (`npm test`).
* **TypeScript:** Strict type checking with 0 compiler errors (`npx tsc --noEmit`).
* **Production Build:** Next.js 16 production build compiles with Turbopack (`npm run build`).
