# Class Manager — Middle School (THCS) Management System

<p align="center">
  <strong>A modern, production-ready school management platform engineered for middle schools (THCS).</strong><br>
  Built with Next.js 16 (App Router), Node.js, Express, TypeScript, PostgreSQL, and Render Deployment.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?style=flat-square&logo=express" alt="Express Backend">
  <img src="https://img.shields.io/badge/Database-PostgreSQL-blue?style=flat-square&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Deployment-Render-46E3B7?style=flat-square&logo=render" alt="Render">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Testing-Vitest-yellow?style=flat-square&logo=vitest" alt="Vitest">
</p>

---

## 📑 Table of Contents

1. [Overview & School Scale](#-overview)
2. [Target Architecture](#️-architecture)
3. [Key Features](#-key-features)
   - [Dynamic Per-Class RBAC Matrix](#1-dynamic-per-class-rbac-matrix)
   - [Interactive Seating Chart (4×5 Grid / 20 Desks)](#2-interactive-seating-chart-45-classroom-grid--20-desks--40-seats)
   - [Subject-Aware Attendance Engine](#3-subject-aware-attendance-engine--quick-actions)
   - [Interactive Timetable & Conflict Prevention](#4-interactive-timetable--conflict-prevention-engine-timetable)
   - [Student Operations & Bulk Excel Import](#5-student-operations--bulk-excel-import)
4. [Technology Stack](#️-technology-stack)
5. [Quick Start & Running Locally](#-quick-start)
6. [Render Deployment Guide](#-render-deployment-guide)
7. [Demo Personas (1-Click Login)](#-demo-personas-1-click-login)
8. [Comprehensive Documentation](#-documentation)
9. [License](#-license)

---

## 📖 Overview

**Class Manager** models the operational and pedagogical structure of **Trường THCS Nguyễn Tất Thành** (Năm học: 2026 - 2027). The system is powered by a self-managed full-stack architecture with a Next.js 16 frontend and a dedicated Node.js + Express + TypeScript backend connected to a native PostgreSQL database deployed on Render.

### 🏫 School Scale & Deterministic Dataset (Năm học 2026 - 2027)
- **Đơn vị**: Trường THCS Nguyễn Tất Thành
- **4 Grades**: Khối 6, Khối 7, Khối 8, Khối 9
- **16 Classes**: 6A1–6A4, 7A1–7A4, 8A1–8A4, 9A1–9A4
- **480 Students**: 30 students per class with realistic demographic and contact data
- **10 Core Subjects**: Mathematics, Literature, English, Physics, Chemistry, Biology, History, Geography, Informatics, Technology
- **20 Desks / 40 Seats per Class**: 20 double desks arranged in a standardized 4×5 classroom layout (4 vertical columns × 5 rows)

---

## 🏛️ Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 16 Frontend                     │
│  - App Router (18 routes)                                   │
│  - Centralized API Client (frontend/src/lib/api-client.ts)           │
│  - Client Layout & Route Guards                             │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Node.js + Express + TypeScript                │
│  (backend/src/)                                             │
│  ├── routes/         (auth, classes, students, seating...)  │
│  ├── controllers/    (request mapping & response format)    │
│  ├── services/       (business logic & transaction coord)   │
│  ├── middleware/     (auth, RBAC, Zod validation, error)    │
│  ├── repositories/   (PostgreSQL queries via 'pg' pool)     │
│  └── config/         (env, CORS, database, JWT settings)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Parameterized SQL queries
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                     │
│  - 12 Relational Tables with constraints, triggers, indexes │
│  - Migrations: backend/migrations/ (001 -> 006)             │
│  - Deployment: Render PostgreSQL                            │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 1. Dynamic Per-Class RBAC Matrix
Permissions adapt dynamically based on the teacher's active class role:

| Feature | Homeroom Teacher (GVCN) | Subject Teacher (GVBM) | Administrator |
| :--- | :---: | :---: | :---: |
| **Student Management** | Full CRUD | Read-Only Profile View | Full System Access |
| **Seating Arrangement** | Swap, Randomize, Assign, Clear | View-Only Layout | View-Only |
| **Attendance (Điểm danh)** | Mark Assigned Subject; View All Class Records (Read-Only) | Mark & View Assigned Subject Only | Full System Access (Mark & View All) |
| **Timetable (Thời khóa biểu)** | Read-Only View (Assigned Classes) | Read-Only View (Assigned Classes) | Full Configuration & Edits (All 16 Classes) |
| **Student Notes** | Create & Delete Notes | Denied | View Only |
| **Announcements** | Create, Pin, Delete | Read-Only | Manage All |
| **Class Settings** | Full Configuration | Denied | Full Configuration |
| **Teacher Allocation** | View Team | View Team | Assign GVCN & 10 GVBM |

### 2. Interactive Seating Chart (4×5 Classroom Grid / 20 Desks / 40 Seats)
- **Standardized Classroom Geometry**: 20 double desks arranged in 4 columns × 5 rows (40 seats max).
- **Dual Visual Perspectives**: Switch seamlessly between *Nhìn từ cuối lớp* (View from back) and *Nhìn từ bục giảng* (View from teacher's podium).
- **Live Attendance Overlay**: Instant visual badges directly on seats (`✓ Có mặt`, `✕ Vắng`, `⏰ Muộn`, `📋 Phép`).
- **Fisher-Yates Randomization**: Uniform seating shuffle with strict 1-to-1 seat invariance.
- **Official A4 Print Layout**: Dedicated landscape print stylesheet (`@media print`).

### 3. Subject-Aware Attendance Engine & Quick Actions
- **Strict Pedagogical RBAC**: Both GVCN and GVBM only take attendance for periods/subjects they are actively assigned to teach.
- **Real-Time Context Detection**: Synchronizes with current clock time and period schedule to pre-select ongoing subject and teacher.
- **1-Click School Admin Report**: Copy formatted morning absence summary to clipboard for immediate reporting.

### 4. Interactive Timetable & Conflict Prevention Engine
- **Phân chia ca học theo khối chuẩn THCS 2 buổi**:
  - Khối 6 & 9 → Ca Sáng: Tiết 1–5 (Thứ 2–6), Tiết 1–3 (Thứ 7).
  - Khối 7 & 8 → Ca Chiều: Tiết 6–10 (Thứ 2–6), Tiết 6–8 (Thứ 7).
- **Strict School-Wide Conflict Prevention**: Ngăn chặn giáo viên dạy trùng tiết trên phạm vi toàn trường.

---

## 🛠️ Technology Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack), [TypeScript 5](https://www.typescriptlang.org/), [TailwindCSS v4](https://tailwindcss.com/), [@phosphor-icons/react](https://phosphoricons.com/), [Sonner](https://sonner.emilkowal.ski/), [xlsx](https://www.npmjs.com/package/xlsx)
- **Backend**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/), [TypeScript 5](https://www.typescriptlang.org/), [Zod](https://zod.dev/), [bcryptjs](https://www.npmjs.com/package/bcryptjs), [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken), [pg](https://node-postgres.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (12 relational tables with constraints, triggers, indexes, and parameterized queries)
- **Testing**: [Vitest](https://vitest.dev/) automated test suite (91 passing unit tests)
- **Cloud Deployment**: [Render](https://render.com/) Web Service (Express API) + Render PostgreSQL

---

## 🚀 Quick Start & Running Locally

### 1. Prerequisites
- Node.js >= 20
- PostgreSQL database (local or cloud)

### 2. Backend Setup & Database Migration

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and set your DATABASE_URL

# Run database migrations and seed data
npm run migrate

# Start backend in development mode (port 4000)
npm run dev
```

The Express API will be running on `http://localhost:4000`. Health check endpoint: `http://localhost:4000/health`.

### 3. Frontend Setup

```bash
# From workspace root
npm run dev:frontend

# Or directly inside frontend folder
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Next.js automatically rewrites `/api/*` and `/health` requests to the Express backend.

### 4. Running Automated Tests

```bash
# Run Vitest test suite across frontend workspace
npm test
```

---

## ☁️ Render Deployment Guide

### Backend: Render Web Service
1. **Repository**: Point Render to your repository.
2. **Root Directory**: `backend`
3. **Environment**: `Node`
4. **Build Command**: `npm install && npm run build`
5. **Start Command**: `npm run start`
6. **Health Check Path**: `/health`
7. **Environment Variables**:
   - `DATABASE_URL`: Connection string from your Render PostgreSQL instance.
   - `PORT`: Automatically set by Render.
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: A secure random 32-character string.
   - `CORS_ORIGIN`: Your deployed frontend origin (e.g., `https://classmanager.onrender.com` or Vercel URL).

### Database: Render PostgreSQL
1. Create a **PostgreSQL** instance on Render.
2. Note the **Internal Database URL** (for backend in same Render region) or **External Database URL**.
3. Run the initial migration once from your CLI or Render Shell:
   ```bash
   DATABASE_URL="your-render-db-url" npm run migrate
   ```

---

## 👥 Demo Personas (1-Click Login)

The `/login` page provides quick-access profiles:

| Role Scenario | Account | Email | Password | Context |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | Admin Hệ thống | `admin@classmanager.local` | `admin` | Full school governance & timetable control |
| **Dual Role (GVCN + GVBM)** | Thầy Nguyễn Văn An | `an.nguyen@classmanager.local` | `teacher1` | **GVCN in 6A1** & **GVBM (Toán) in 6A2, 7A1, 7A2** |
| **Subject Teacher Only** | Thầy Hoàng Văn Cường | `cuong.hoang@classmanager.local` | `teacher23` | Pure GVBM (Công nghệ), read-only rosters |
| **Homeroom Teacher Only** | Cô Nguyễn Thị Hương | `huong.nguyen@classmanager.local` | `teacher16` | Pure GVCN of class 6A4 |
| **Unassigned Staff** | Thầy Đỗ Văn Tân | `unassigned@classmanager.local` | `unassigned` | Tests unassigned onboarding empty state |
| **Disabled Staff** | Thầy Vũ Đình Trọng | `disabled@classmanager.local` | `disabled` | Tests account access rejection |

---

## 📚 Documentation

The complete technical specification is available in [`/docs`](docs/README.md):

- **[Master Technical Documentation Index](docs/README.md)**
- [System Architecture](docs/architecture/system-architecture.md) & [Deployment Architecture](docs/architecture/deployment-architecture.md)
- [Module Architecture](docs/architecture/module-architecture.md)
- [Database Design](docs/data/database-design.md) & [ER Diagram](docs/data/er-diagram.md)
- [REST API Reference](docs/api/api-reference.md)
- [Authentication Architecture](docs/security/authentication.md) & [Authorization / RBAC](docs/security/authorization.md)
- [Functional Overview](docs/requirements/functional-overview.md) & [Business Rules Catalog](docs/requirements/business-rules.md)
- [Workflows & Walkthroughs](docs/workflows/)

---

## 📄 License

This project is licensed under the MIT License.
