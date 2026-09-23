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

## 📑 Table of Contents

1. [Overview & School Scale](#-overview)
2. [Key Features](#-key-features)
   - [Dynamic Per-Class RBAC Matrix](#1-dynamic-per-class-rbac-matrix)
   - [Interactive Seating Chart (4×5 Grid / 20 Desks)](#2-interactive-seating-chart-45-classroom-grid--20-desks--40-seats)
   - [Subject-Aware Attendance Engine](#3-subject-aware-attendance-engine--quick-actions)
   - [Interactive Timetable & Conflict Prevention](#4-interactive-timetable--conflict-prevention-engine-timetable)
   - [Student Operations & Bulk Excel Import](#5-student-operations--bulk-excel-import)
   - [Premium Visual Design System](#6-premium-visual-design-system)
3. [Architecture & Data Layer](#️-architecture--data-access-layer)
4. [Technology Stack](#️-technology-stack)
5. [Quick Start & Running Locally](#-quick-start)
6. [Demo Personas (1-Click Login)](#-demo-personas-1-click-login)
7. [Comprehensive Documentation](#-documentation)
8. [License](#-license)

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
- **Dual Visual Perspectives**: Switch seamlessly between *Nhìn từ cuối lớp* (View from back) and *Nhìn từ bục giảng* (View from teacher's podium), with automatic `localStorage` preference persistence.
- **Live Attendance Overlay**: Instant visual badges directly on seats (`✓ Có mặt`, `✕ Vắng`, `⏰ Muộn`, `📋 Phép`) helping teachers immediately identify missing students during lectures.
- **Gender Balance Highlighting**: Filter and highlight male / female students to easily balance seating arrangements between rows.
- **Fisher-Yates Randomization**: Instant, mathematically uniform seating shuffle with 1-to-1 seat invariance.
- **Official A4 Print Layout**: Dedicated landscape print stylesheet (`@media print`) rendering the seating chart with school title header and official BGH / GVCN signature blocks.

### 3. Subject-Aware Attendance Engine & Quick Actions
- **Strict Pedagogical RBAC**: Both GVCN and GVBM only take attendance for periods/subjects they are actively assigned to teach. GVCN has read-only access to view all subject records for comprehensive student monitoring.
- **Real-Time Context Detection**: Automatically synchronizes with current clock time and period schedule to pre-select ongoing subject and teacher.
- **Quick Status Tabs**: Filter students instantly by `Tất cả`, `Chưa có mặt` (Unaccounted / Absent or Late), `Có mặt`, `Vắng`, `Muộn`, and `Có phép`.
- **1-Click School Admin Report**: Copy formatted morning absence summary to clipboard for immediate reporting to School Leadership via Zalo or SMS.
- **Advanced Time Range Filtering (`/history`)**: Filter attendance history by `Tuần này`, `Tháng này`, `Tất cả`, or `Tùy chọn khoảng ngày`. Real-time recalculation of student attendance rates and period KPIs.

### 4. Interactive Timetable & Conflict Prevention Engine (`/timetable`)
- **Phân chia ca học theo khối chuẩn THCS 2 buổi**:
  - **Khối 6 & Khối 9 → Ca Sáng**: Tiết 1–5 (Thứ 2–6), Tiết 1–3 (Thứ 7). Thứ 7 Tiết 3 cố định **Sinh hoạt lớp** do chính **GVCN** phụ trách.
  - **Khối 7 & Khối 8 → Ca Chiều**: Tiết 6–10 (Thứ 2–6), Tiết 6–8 (Thứ 7). Thứ 7 Tiết 8 cố định **Sinh hoạt lớp** do chính **GVCN** phụ trách.
  - Tuyệt đối không có Tiết 4/5 Thứ 7 sáng và Tiết 9/10 Thứ 7 chiều. Chuẩn 28 tiết/lớp/tuần × 16 lớp = 448 tiết toàn trường.
- **Collapsible UI (Ẩn/Hiện tiết ca đối diện linh hoạt)**:
  - Khối sáng hỗ trợ ẩn/hiện các hàng tiết chiều và ngược lại thông qua nút bấm và banner ca học. Các hàng không bị xóa bỏ hẳn mà giữ nguyên tính toàn vẹn của lưới học phần.
- **Phân quyền Thời khóa biểu (Quản trị tập trung - Giáo viên không thể tự sửa)**:
  - **Giáo viên (`TEACHER`)**: Hoàn toàn **không thể tự chỉnh sửa bất kỳ thứ gì liên quan tới thời khóa biểu** (không sửa môn, không đổi GV, không xếp mẫu, không sao chép hoặc xóa tiết). Giáo viên chỉ có quyền xem thời khóa biểu của các lớp mình được phân công giảng dạy (bao gồm vai trò GVCN và GVBM).
  - **Quản trị viên (`ADMIN`)**: Có toàn quyền cấu hình, xếp mẫu, chỉnh sửa và quản lý toàn bộ 16 lớp trong trường.
- **Strict School-Wide Conflict Prevention**:
  - **Teacher Conflict Check**: Ngăn chặn tuyệt đối xung đột giáo viên dạy 2 lớp cùng ngày cùng tiết trên phạm vi toàn trường.
  - **Class Conflict Check**: Mỗi ô tiết học của lớp chỉ có tối đa 1 môn học.
  - **Atomic Transaction & Rollback**: Sao chép TKB và Xếp mẫu chuẩn tự động ánh xạ lại GVCN và rollback an toàn nếu phát hiện xung đột chéo.
- **Smart Real-Time Period Calculator**: Nhận diện tiết học, giải lao và sinh hoạt đầu giờ theo thời gian thực (`getCurrentPeriodInfo`).
- **Official A4 Landscape Print View**: Hỗ trợ in bảng thời khóa biểu chuẩn khổ A4 ngang có chữ ký Ban Giám hiệu và GVCN.

### 5. Student Operations & Bulk Excel Import
- **Bulk Excel Import (`/students`)**: Upload student rosters via `.xlsx`, `.xls`, or `.csv` with auto-column mapping.
- **Pre-Import Data Validation**: Automatic duplicate check (within file and against existing students) and strict class capacity enforcement (max 40 students).
- **Official Template Generator**: 1-click download of standardized sample template (`mau_danh_sach_hoc_sinh.xlsx`).
- **Parent Contact Center (`/students/[id]`)**: Instant 1-touch actions for direct phone calling (`tel:`), SMS messaging (`sms:`), and Zalo chat (`https://zalo.me/`).
- **1-Click Pre-formatted Notification Templates**: Ready-to-send school templates for Unexcused Absences, Tardiness Alerts, Periodic Attendance Reports, and Parent Conference Requests.

### 6. Premium Visual Design System
The visual language is engineered specifically for modern Vietnamese educational institutions:
- **True 16px Standard Typography & Hierarchy**: Confident editorial typography with Vietnamese diacritics support.
- **Warm Paper Multi-Surface Architecture**: OKLCH semantic palette (`--bg`, `--surface`, `--surface-muted`, and scholastic indigo `--accent`).
- **Tactile Inputs & Physical Scale**: 46–50px touch targets, 58–62px table rows, and micro-press physics.
- **Mobile-First Responsive Shell**: Off-canvas drawer navigation overlay and sticky mobile top bar (`MobileNav`) for phone and tablet viewports.

---

## 🏗️ Architecture & Data Access Layer

The codebase features a clean, multi-tiered architecture with strict isolation between presentation and storage:

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
│   - Enforces Domain Invariants (Max 2 grades, Max 40 students, 1:1)    │
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

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (Turbopack, App Router)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (Strict type safety, 0 compiler errors)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/) with semantic OKLCH design tokens
- **Testing**: [Vitest](https://vitest.dev/) automated unit & integration test suite (91 tests passing, 8/8 test files)
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
| **System Administrator** | Admin Hệ thống | `admin@classmanager.local` | `admin` | Full school governance & timetable control |
| **Dual Role (GVCN + GVBM)** | Thầy Nguyễn Văn An | `an.nguyen@classmanager.local` | `teacher1` | **GVCN in 6A1** & **GVBM (Toán) in 6A2, 7A1, 7A2** |
| **Subject Teacher Only** | Thầy Hoàng Văn Cường | `cuong.hoang@classmanager.local` | `teacher23` | Pure GVBM (Công nghệ), read-only rosters |
| **Homeroom Teacher Only** | Cô Nguyễn Thị Hương | `huong.nguyen@classmanager.local` | `teacher16` | Pure GVCN of class 6A4 |
| **Unassigned Staff** | Thầy Đỗ Văn Tân | `unassigned@classmanager.local` | `unassigned` | Tests unassigned onboarding empty state |
| **Disabled Staff** | Thầy Vũ Đình Trọng | `disabled@classmanager.local` | `disabled` | Tests account access rejection |

---

## 📚 Documentation

The complete, reverse-engineered technical specification and design system for Class Manager is available in the [`/docs`](docs/README.md) directory:

- **[Master Technical Documentation Index](docs/README.md)**
- [System Architecture](docs/architecture/system-architecture.md) & [Module Architecture](docs/architecture/module-architecture.md)
- [Functional Overview](docs/requirements/functional-overview.md) & [Business Rules Catalog](docs/requirements/business-rules.md)
- [Database Design](docs/data/database-design.md) & [ER Diagram](docs/data/er-diagram.md)
- [Application Service Layer (API) Reference](docs/api/api-reference.md)
- [Authentication & RBAC Security Model](docs/security/authorization.md)
- [Workflows & Walkthroughs](docs/workflows/)
- [Mermaid Diagrams (Use Cases, Class, Sequence, Activity, State, C4 Context)](docs/diagrams/class-diagrams.md)
- [Feature-to-Code Traceability Matrix](docs/traceability/feature-to-code.md)
- [Historical UI/UX & Codebase Audits](docs/ui-ux-audit.md)

---

## 📄 License

This project is licensed under the MIT License.
