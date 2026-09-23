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

**Class Manager** models the exact operational and pedagogical structure of **Trường THCS Nguyễn Tất Thành** (Năm học: 2026 - 2027). The system features an enterprise-grade **Application Service Layer** that completely abstracts UI components from storage, enforces **Domain-Level Role-Based Access Control (RBAC)** across all mutations, and protects critical data invariants.

### 🏫 School Scale & Deterministic Dataset (Năm học 2026 - 2027)
- **Đơn vị**: Trường THCS Nguyễn Tất Thành
- **4 Grades**: Khối 6, Khối 7, Khối 8, Khối 9
- **16 Classes**: 6A1–6A4, 7A1–7A4, 8A1–8A4, 9A1–9A4
- **480 Students**: Exactly 30 students per class with realistic demographic and contact data
- **10 Core Subjects**: Mathematics, Literature, English, Physics, Chemistry, Biology, History, Geography, Informatics, Technology
- **20 Desks / 40 Seats per Class**: 20 double desks arranged in a standardized 4×5 classroom layout (4 vertical columns × 5 rows)

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

### 2. Interactive Seating Chart (4×5 Classroom Grid / 20 Desks / 40 Seats)
- **Standardized Classroom Geometry**: 20 double desks arranged in 4 columns × 5 rows (40 seats max).
- **Dual Visual Perspectives**: Switch seamlessly between *Nhìn từ cuối lớp* (View from back) and *Nhìn từ bục giảng* (View from teacher's podium), with automatic `localStorage` preference persistence.
- **Live Attendance Overlay**: Instant visual badges directly on seats (`✓ Có mặt`, `✕ Vắng`, `⏰ Muộn`, `📋 Phép`) helping teachers immediately identify missing students during lectures.
- **Gender Balance Highlighting**: Filter and highlight male / female students to easily balance seating arrangements between rows.
- **Fisher-Yates Randomization**: Instant, mathematically uniform seating shuffle with 1-to-1 seat invariance.
- **Official A4 Print Layout**: Dedicated landscape print stylesheet (`@media print`) rendering the seating chart with school title header and official BGH / GVCN signature blocks.

### 3. Subject-Aware Attendance Engine & Quick Actions
- **Session & Homeroom Attendance**: GVBM marks attendance for their assigned subject period; GVCN takes daily morning attendance.
- **Quick Status Tabs**: Filter students instantly by `Tất cả`, `Chưa có mặt` (Unaccounted / Absent or Late), `Có mặt`, `Vắng`, `Muộn`, and `Có phép`.
- **1-Click School Admin Report**: Copy formatted morning absence summary to clipboard for immediate reporting to School Leadership via Zalo or SMS.
- **Advanced Time Range Filtering (`/history`)**: Filter attendance history by `Tuần này`, `Tháng này`, `Tất cả`, or `Tùy chọn khoảng ngày`. Real-time recalculation of student attendance rates and period KPIs.

### 4. Student Operations & Bulk Excel Import
- **Bulk Excel Import (`/students`)**: Upload student rosters via `.xlsx`, `.xls`, or `.csv` with auto-column mapping.
- **Pre-Import Data Validation**: Automatic duplicate check (within file and against existing students) and strict class capacity enforcement (max 40 students).
- **Official Template Generator**: 1-click download of standardized sample template (`mau_danh_sach_hoc_sinh.xlsx`).
- **Parent Contact Center (`/students/[id]`)**: Instant 1-touch actions for direct phone calling (`tel:`), SMS messaging (`sms:`), and Zalo chat (`https://zalo.me/`).
- **1-Click Pre-formatted Notification Templates**: Ready-to-send school templates for Unexcused Absences, Tardiness Alerts, Periodic Attendance Reports, and Parent Conference Requests.

### 5. Premium Visual Design System
The visual language is engineered specifically for modern Vietnamese educational institutions:
- **True 16px Standard Typography & Hierarchy**: Confident editorial typography with Vietnamese diacritics support.
- **Warm Paper Multi-Surface Architecture**: OKLCH semantic palette (`--bg`, `--surface`, `--surface-muted`, and scholastic indigo `--accent`).
- **Tactile Inputs & Physical Scale**: 46–50px touch targets, 58–62px table rows, and micro-press physics.
- **Mobile-First Responsive Shell**: Off-canvas drawer navigation overlay and sticky mobile top bar (`MobileNav`) for phone and tablet viewports.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (Turbopack, App Router)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (Strict type safety, 0 compiler errors)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/) with semantic design tokens
- **Testing**: [Vitest](https://vitest.dev/) automated unit & integration test suite (27 tests passing)
- **Excel Processing**: [xlsx](https://www.npmjs.com/package/xlsx) (Import & Export engine)
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

- [UI/UX Audit & Completion Report](docs/ui-ux-audit.md)
- [Codebase Audit & Resolution Report](docs/codebase-audit.md)
- [Target Data Model & Supabase Contracts](docs/data-model.md)

---

## 📄 License

This project is licensed under the MIT License.
