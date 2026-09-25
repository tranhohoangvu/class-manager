<div align="center">

# 🏫 SchoolOps
### School Operations Management System for Nguyen Tat Thanh Secondary School
**Academic Year: 2026 - 2027**

[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js%2016%20(App%20Router)-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS v4](https://img.shields.io/badge/Styling-TailwindCSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-105%2F105%20Passed-brightgreen?style=for-the-badge&logo=vitest)](https://vitest.dev/)

</div>

---

## 📖 Overview

**SchoolOps** is an enterprise-grade school operations and management platform engineered specifically for Vietnamese secondary schools (Trường THCS), with its reference operational model based on **Nguyen Tat Thanh Secondary School** (Academic Year: 2026 - 2027).

The repository is structured as a clean, standardized **Monorepo**:
* **[Frontend (`/frontend`)](frontend/README.md):** Next.js 16 (App Router), React 19, TailwindCSS v4, Vitest.
* **[Backend (`/backend`)](backend/README.md):** Standalone REST API service built with Node.js, Express, TypeScript, and PostgreSQL.
* **[Documentation (`/docs`)](docs/README.md):** Comprehensive technical specifications, architectural diagrams, ER schemas, and workflows.

### 🏫 Standard Secondary School Dataset Scale (2026 - 2027)
- **Institution**: Nguyen Tat Thanh Secondary School
- **4 Grades**: Grade 6, Grade 7, Grade 8, Grade 9
- **16 Classes**: 6A1–6A4, 7A1–7A4, 8A1–8A4, 9A1–9A4
- **480 Students**: 30 students per class with realistic demographic and parent contact profiles
- **24 Teachers**: Role separation between Homeroom (GVCN) and Subject Teachers (GVBM)
- **10 Core Subjects**: Mathematics, Literature, English, Physics, Chemistry, Biology, History, Geography, Informatics, Technology
- **20 Desks / 40 Seats per Class**: Standard 4 columns × 5 rows classroom geometry supporting dual visual perspectives

---

## 📁 Monorepo Directory Structure

```text
school-ops/
├── frontend/                 # Next.js 16 Web Application (App Router)
│   ├── src/                  # Application source code (UI, components, contexts, services, lib)
│   ├── tests/                # Automated Vitest test suite (8 files, 105 unit tests)
│   ├── next.config.ts        # Next.js config & API proxy rewrites (/api/* -> :4000)
│   ├── tsconfig.json         # TypeScript compiler config (@/* path alias)
│   ├── package.json          # Frontend dependencies (package: "school-ops-frontend")
│   └── README.md             # 📖 Detailed Frontend Documentation
│
├── backend/                  # Dedicated REST API Service (Express + TypeScript + PostgreSQL)
│   ├── src/                  # Controllers, services, repositories, routes, middleware
│   ├── migrations/           # 7 sequenced PostgreSQL SQL migration files (001 -> 007)
│   ├── scripts/              # Migration runner script (migrate.ts)
│   ├── package.json          # Backend dependencies (package: "school-ops-backend")
│   └── README.md             # 📖 Detailed Backend Documentation
│
├── docs/                     # Master Technical Documentation Suite
│   ├── architecture/         # System, module, and deployment architecture specifications
│   ├── requirements/         # Functional tree, use cases, and auditable business rules
│   ├── data/                 # PostgreSQL schema design and ER diagrams
│   ├── api/                  # Application service layer method signatures and contracts
│   ├── security/             # JWT authentication mechanisms and dynamic RBAC matrices
│   ├── workflows/            # Operational workflow documentation
│   ├── diagrams/             # C4 context, sequence, class, activity, and state diagrams
│   ├── design/               # Architectural decisions, design tokens, and technical notes
│   ├── traceability/         # Full Feature-to-Code traceability matrix
│   └── README.md             # 📖 Technical Documentation Master Index
│
├── package.json              # Monorepo Root Workspace Configuration (npm workspaces)
├── .gitignore                # Global workspace ignore rules
└── README.md                 # 📖 Master Repository Overview (this file)
```

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                 Frontend: Next.js 16 (Port 3000)            │
│  - App Router (19 static and dynamic routes)                │
│  - Centralized API Client (frontend/src/lib/api-client.ts)  │
│  - Client Layouts & Dynamic RBAC Route Guards               │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST API (/api/*, /health)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          Backend: Node.js + Express + TS (Port 4000)        │
│  (backend/src/)                                             │
│  ├── routes/         (auth, classes, students, seating...)  │
│  ├── controllers/    (request mapping & response format)    │
│  ├── services/       (business logic & transactions)        │
│  ├── middleware/     (auth, RBAC, Zod validation, error)    │
│  ├── repositories/   (PostgreSQL queries via 'pg' pool)     │
│  └── config/         (env, CORS, database, JWT settings)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Parameterized SQL queries
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                     │
│  - 12 Relational Tables with constraints, triggers, indexes │
│  - Migrations: backend/migrations/ (001 -> 007)             │
│  - Deployment Targets: Native PostgreSQL / Render Postgres  │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 1. Dynamic Per-Class RBAC Matrix
Permissions adapt automatically based on the teacher's active assignment in each specific class:

| Feature | Homeroom Teacher (GVCN) | Subject Teacher (GVBM) | Administrator |
| :--- | :---: | :---: | :---: |
| **Student Management** | Full CRUD & Excel Import | Read-Only Profile View | Full School-Wide Governance |
| **Seating Arrangement** | Swap, Randomize, Assign, Clear | Read-Only Layout | Read-Only Layout |
| **Attendance Recording** | Mark Assigned Subject; View All Records | Mark & View Assigned Subject Only | Full School-Wide Attendance Access |
| **Timetable Management** | View Assigned Classes | View Assigned Classes | Full 16-Class Mutation, Audit & Rules |
| **Student Notes** | Create & Delete Notes | Access Denied | Read-Only View |
| **Class Announcements** | Create, Pin, Delete | Read-Only View | Full System Management |
| **Class Settings** | Rename, Room Name, Max Capacity | Access Denied | Manage All Classes |
| **Teacher Allocations** | View Class Teaching Team | View Class Teaching Team | Assign GVCN & 10 GVBM |

### 2. Intelligent Seating Grid (4×5 / 20 Desks / 40 Seats)
- **Standard Geometry**: 20 double desks arranged in a 4-column × 5-row classroom floor plan.
- **Dual Visual Perspectives**: Toggle seamlessly between *View from Back* (Nhìn từ cuối lớp) and *View from Podium* (Nhìn từ bục giảng).
- **Live Attendance Overlay**: Visual badges directly on desks (`✓ Present`, `✕ Absent`, `⏰ Late`, `📋 Excused`).
- **Fisher-Yates Randomization**: Uniform permutation algorithm preserving seat invariants.
- **Standard A4 Print Engine**: Dedicated landscape print stylesheet for classroom door posting (`@media print`).

### 3. Subject-Aware Period Attendance
- **Real-Time Context Synchronization**: Automatically detects active period, subject, and assigned teacher based on real-time clock.
- **1-Click Executive Summary**: Formats morning and afternoon absence reports ready for instant copying to school administrators via Zalo/SMS.

### 4. 2-Shift Secondary School Timetable
- **Strict Morning / Afternoon Session Shifts**:
  - Grade 6 & 9 ➔ Morning Shift: Periods 1–5 (Mon–Fri), Periods 1–3 (Sat).
  - Grade 7 & 8 ➔ Afternoon Shift: Periods 6–10 (Mon–Fri), Periods 6–8 (Sat).
- **School-Wide Conflict Prevention**: Automatically rejects timetable assignments that place a teacher in two locations simultaneously.

---

## 🚀 Quick Start & Running Locally

### 1. Prerequisites
* Node.js >= 20
* PostgreSQL 16 (Local instance or Cloud database such as Render PostgreSQL)

### 2. Install Workspace Dependencies (from root `school-ops/`)
```bash
npm install
```
This single command installs and links all dependencies across both `frontend` and `backend` packages via npm workspaces.

### 3. Configure & Run Backend
```bash
cd backend
cp .env.example .env
# Edit .env and supply your DATABASE_URL

# Run migrations to build tables and load seed dataset
npm run migrate

# Start backend dev server (Port 4000)
npm run dev
```

### 4. Start Frontend
From the root workspace `school-ops/`:
```bash
# Start frontend dev server (Port 3000)
npm run dev:frontend

# Alternatively, directly within the frontend directory:
# cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Automated Tests
```bash
# Run Vitest test suite across workspace:
npm test
```

---

## 👥 Demo Personas (1-Click Login)

The `/login` view provides quick-access preconfigured test accounts:

| Persona | Name | Email | Password | Test Scenario |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | Admin Hệ thống | `admin@classmanager.local` | `admin` | Full school-wide governance & timetable scheduling |
| **Dual Role (GVCN + GVBM)** | Thầy Nguyễn Văn An | `an.nguyen@classmanager.local` | `teacher1` | **GVCN of Class 6A1** & **GVBM (Math) in 6A2, 7A1, 7A2** |
| **Subject Teacher Only** | Thầy Hoàng Văn Cường | `cuong.hoang@classmanager.local` | `teacher23` | Pure GVBM (Technology), marks only assigned subject |
| **Homeroom Teacher Only** | Cô Nguyễn Thị Hương | `huong.nguyen@classmanager.local` | `teacher16` | Pure GVCN of Class 6A4 |
| **Unassigned Staff** | Thầy Đỗ Văn Tân | `unassigned@classmanager.local` | `unassigned` | Verifies empty state when staff has no active classes |
| **Disabled Account** | Thầy Vũ Đình Trọng | `disabled@classmanager.local` | `disabled` | Verifies security rejection on deactivated accounts |

---

## 📚 Technical Documentation

Comprehensive documentation is organized inside [`/docs`](docs/README.md):

* **[Master Technical Documentation Index](docs/README.md)**
* **[Frontend README](frontend/README.md)** & **[Backend README](backend/README.md)**
* [System Architecture](docs/architecture/system-architecture.md) & [Module Architecture](docs/architecture/module-architecture.md)
* [Database Design Specification](docs/data/database-design.md) & [Entity-Relationship Diagram](docs/data/er-diagram.md)
* [Application Service API Contracts](docs/api/api-reference.md)
* [Authentication Architecture](docs/security/authentication.md) & [Authorization / RBAC Matrix](docs/security/authorization.md)
* [Business Rules Catalog](docs/requirements/business-rules.md)
* [Feature-to-Code Traceability Matrix](docs/traceability/feature-to-code.md)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
