# Class Manager — Middle School (THCS) Management System

<p align="center">
  <strong>A modern, production-ready school management platform engineered for middle schools (THCS).</strong><br>
  Built with Next.js 16 (App Router), TypeScript, TailwindCSS, Service-Layer Architecture, and Per-Class RBAC.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/Testing-Vitest-yellow?style=flat-square&logo=vitest" alt="Vitest">
  <img src="https://img.shields.io/badge/Architecture-Service%20Layer-emerald?style=flat-square" alt="Service Layer">
  <img src="https://img.shields.io/badge/Data%20Contracts-Supabase%20Ready-3ecf8e?style=flat-square&logo=supabase" alt="Supabase Ready">
</p>

---

## 📖 Overview

**Class Manager** models the exact operational and pedagogical structure of a Vietnamese Middle School (**Trường THCS**). The system features an enterprise-grade **Application Service Layer** that completely abstracts UI components from storage, enforces **Domain-Level Role-Based Access Control (RBAC)** across all mutations, and protects critical data invariants.

### 🏫 School Scale & Deterministic Dataset
- **4 Grades**: Khối 6, Khối 7, Khối 8, Khối 9
- **16 Classes**: 6A1–6A4, 7A1–7A4, 8A1–8A4, 9A1–9A4
- **480 Students**: Exactly 30 students per class with realistic demographic and contact data
- **10 Core Subjects**: Mathematics, Literature, English, Physics, Chemistry, Biology, History, Geography, Informatics, Technology
- **24 Teachers + 1 Administrator**: Every teacher teaches at most 2 grades according to THCS regulations
- **400 Desks / 800 Seats**: 25 desks per class arranged in a 5×5 classroom grid

---

## 🏗️ Architecture & Data Access Layer

The codebase has been refactored from a simple prototype to a clean, multi-tiered architecture:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Presentation / UI Layer                         │
│   Next.js 16 Pages · UI Components · StateViews (Loading/Empty/Error)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Calls typed Service Methods)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Application Services & RBAC Guard                   │
│   StudentService · SeatingService · AttendanceService · ClassService   │
│   AnnouncementService · NoteService · TeacherService · AuthGuard       │
│   - Enforces Role Permissions (Admin vs. GVCN vs. GVBM)                │
│   - Enforces Domain Invariants (Max 2 grades, Max 30 students, 1:1)    │
│   - Zod Schema Validation on every input                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Returns OperationResult<T>)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Local Persistence Layer                         │
│   LocalStore with automatic versioning (cm_data_version)               │
│   Ready for seamless Supabase PostgreSQL migration (docs/data-model.md)│
└────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 1. Dynamic Per-Class RBAC Matrix
Permissions adapt dynamically based on the teacher's active class role:

| Feature | Homeroom Teacher (GVCN) | Subject Teacher (GVBM) | Administrator |
| :--- | :---: | :---: | :---: |
| **Student Management** | Full CRUD | Read-Only Profile View | Full System Access |
| **Seating Arrangement** | Swap, Randomize, Assign, Clear | View-Only Layout | View-Only |
| **Attendance** | Mark Homeroom & All Subjects | Mark Assigned Subject Only | View All Records |
| **Student Notes** | Create & Delete Notes | Denied | View Only |
| **Announcements** | Create, Pin, Delete | Read-Only | Manage All |
| **Class Settings** | Full Configuration | Denied | Full Configuration |
| **Teacher Allocation** | View Team | View Team | Assign GVCN & 10 GVBM |

### 2. Interactive Seating Chart (5×5 Classroom Grid)
- **Visual Classroom Layout**: 25 desks (5 columns × 5 rows) facing the blackboard.
- **Fisher-Yates Randomization**: Instant, mathematically uniform seating shuffle.
- **2-Click Seat Swapping**: Select any two seats to smoothly exchange student locations.
- **Strict 1-to-1 Invariant**: A student can only occupy 1 seat in their assigned class.

### 3. Subject-Aware Attendance Engine
- **Session Attendance**: GVBM marks attendance for their assigned subject period.
- **Homeroom General Attendance**: GVCN takes daily class attendance.
- **Timezone Safety**: Local date computation (`YYYY-MM-DD`) preventing UTC rollover issues.
- **Attendance History Matrix**: Comprehensive date-by-date student tracking table with real-time rate calculations.

### 4. Excel & PDF / Print Capabilities
- **Export Students to Excel**: Download `.xlsx` roster including STT, Student Code, Full Name, Gender, DOB, Class, Desk Position, Status with full Vietnamese Unicode support.
- **Export Attendance to Excel**: Download `.xlsx` monthly attendance matrix (Students × Dates) with summary totals.
- **A4 Print Layout**: Specialized `@media print` CSS for printing classroom seating diagrams and class rosters directly.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (Turbopack, App Router)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (Strict type safety)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/) with semantic design tokens
- **Testing**: [Vitest](https://vitest.dev/) automated unit test suite
- **Excel Export**: [xlsx](https://www.npmjs.com/package/xlsx)
- **Validation**: [Zod](https://zod.dev/)
- **Icons**: [@phosphor-icons/react](https://phosphoricons.com/)
- **Toast Notifications**: [Sonner](https://sonner.emilkowal.ski/)

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/tranhohoangvu/class-manager.git
cd class-manager

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Automated Testing

```bash
# Run Vitest test suite
npm test
```

### Production Build

```bash
# Verify TypeScript & compile production bundle
npm run build
```

---

## 👥 Demo Personas (1-Click Login)

The `/login` page provides quick-access profiles for all test cases:

| Role Scenario | Account | Email | Password | Context |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | Admin Hệ thống | `admin@classmanager.local` | `admin` | Full school governance |
| **Dual Role (GVCN + GVBM)** | Thầy Nguyễn Văn An | `an.nguyen@classmanager.local` | `teacher1` | **GVCN in 6A1** & **GVBM (Toán) in 6A2, 7A1, 7A2** |
| **Subject Teacher Only** | Thầy Hoàng Văn Cường | `cuong.hoang@classmanager.local` | `teacher23` | Pure GVBM (Công nghệ) |
| **Homeroom Teacher Only** | Cô Nguyễn Thị Hương | `huong.nguyen@classmanager.local` | `teacher16` | Pure GVCN of class 6A4 |
| **Unassigned Teacher** | Cô Đỗ Thu Hà | `teacher4@classmanager.local` | `teacher4` | Tests empty state views |
| **Disabled Staff** | Thầy Vũ Đình Trọng | `teacher5@classmanager.local` | `teacher5` | Tests access rejection |

---

## 📚 Documentation

- [Codebase Audit & Resolution Report](docs/codebase-audit.md)
- [Target Data Model & Supabase Contracts](docs/data-model.md)

---

## 📄 License

This project is licensed under the MIT License.
