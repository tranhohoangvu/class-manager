# Class Manager — Middle School (THCS) Management System

<p align="center">
  <strong>A modern, role-aware school management platform engineered for middle schools (THCS).</strong><br>
  Built with Next.js 16 (App Router), TypeScript, TailwindCSS, and a high-performance local data engine with per-class RBAC.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/Architecture-Per--Class%20RBAC-emerald?style=flat-square" alt="RBAC">
  <img src="https://img.shields.io/badge/License-MIT-purple?style=flat-square" alt="License">
</p>

---

## 📖 Overview

**Class Manager** is designed to model the exact operational structure of a Vietnamese Middle School (**Trường THCS**). Unlike generic classroom tools, Class Manager implements **Class-Level Role-Based Access Control (Per-Class RBAC)**: a teacher's permissions dynamically change depending on whether they are the **Homeroom Teacher (GVCN)** or a **Subject Teacher (GVBM)** for the active class.

The platform comes pre-loaded with a deterministic, realistic middle school dataset:
- **4 Grades**: Khối 6, Khối 7, Khối 8, Khối 9
- **16 Classes**: 6A1–6A4, 7A1–7A4, 8A1–8A4, 9A1–9A4
- **480 Students**: Exactly 30 students per class with Vietnamese naming conventions and realistic demographic data
- **10 Core Subjects**: Mathematics, Literature, English, Physics, Chemistry, Biology, History, Geography, Informatics, Technology
- **24 Teachers + 1 System Administrator**: Realistic assignment matrix where each teacher covers at most 2 grades, with exactly 1 GVCN and 10 GVBM per class
- **400 Desks / 800 Seats**: 25 desks per class arranged in a 5×5 grid with 2 seats per desk

---

## ✨ Key Features

### 1. Dynamic Per-Class RBAC Matrix
Permissions adapt in real-time as teachers switch between classes:

| Feature | Homeroom Teacher (GVCN) | Subject Teacher (GVBM) | Administrator |
| :--- | :---: | :---: | :---: |
| **Student Profiles** | Full (Create, Read, Update, Delete) | Read-Only (Directory View) | Full System Access |
| **Student Notes** | Create & Delete Behavioral Notes | Hidden | Read-Only |
| **Seating Arrangement** | Swap Seats, Randomize, Reassign | View-Only (Desk Layout Recognition) | View-Only |
| **Daily Attendance** | Mark Homeroom & All Subjects | Mark Assigned Subject Only | View All Records |
| **Class Announcements** | Create, Pin, Delete | Read-Only | Manage All |
| **Class Settings** | Full Configuration | Access Denied | Full Configuration |
| **Teacher Assignments** | View Team | View Team | Assign GVCN & 10 GVBM |

### 2. Interactive Seating Chart (5×5 Classroom Grid)
- **Visual Desk Layout**: 25 desks (5 columns × 5 rows) with left/right seating positions facing the blackboard.
- **Fisher-Yates Randomization**: Instant, balanced seating shuffle for homeroom teachers.
- **2-Click Seat Swapping**: Select any two seats to smoothly exchange student locations.
- **Capacity Management**: 30 seated students + 20 empty seats per room, with an unseated staging dock.

### 3. Subject-Aware Attendance Engine
- **Session Attendance**: Subject teachers take attendance specifically for their subject period (e.g., Toán, Tiếng Anh).
- **Homeroom General Attendance**: GVCN can take daily morning attendance or review subject-specific records.
- **Real-Time Analytics**: Visual breakdown of attendance rates, late arrivals, excused absences, and unexcused absences.
- **Historical Records**: Pre-seeded with 2,880 historical attendance logs across all classes.

### 4. Administrator Governance Portal
- **School-Wide Analytics**: High-level KPIs covering total students, class distribution across 4 grades, and teacher allocation rates.
- **Class Detail & 10-Subject Assignment**: Interactive matrix to inspect and reassign the Homeroom teacher and all 10 Subject teachers per class.
- **Teacher Roster Management**: Monitor teachers' specialized disciplines, assigned homerooms, subject classes, account locking, and credential resets.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict type safety, zero compile errors)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/) with custom CSS design tokens
- **Icons**: [@phosphor-icons/react](https://phosphoricons.com/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **State & Storage**: Client-side typed `LocalStore` engine with automatic schema versioning (`cm_data_version`)
- **Database Readiness**: Schema designed 1:1 with PostgreSQL / [Supabase](https://supabase.com/) (`supabase/migrations/` ready)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.18+ or Node.js 20+
- npm, pnpm, or yarn

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

---

## 👥 Demo Accounts (One-Click Testing)

The `/login` page provides quick-access profiles to demonstrate all role combinations:

| Role Scenario | Account | Credentials | Test Case |
| :--- | :--- | :--- | :--- |
| **System Administrator** | Admin Hệ thống | `admin@classmanager.local` / `admin` | Full school administration, 16 classes, 24 teachers, 10 subjects |
| **Dual Role (GVCN + GVBM)** | Thầy Nguyễn Văn An | `an.nguyen@classmanager.local` / `teacher1` | **GVCN in 6A1** (Full access) & **GVBM in 6A2, 7A1, 7A2** (Read-only + Subject Attendance) |
| **Subject Teacher Only** | Thầy Hoàng Văn Cường | `cuong.hoang@classmanager.local` / `teacher23` | Pure GVBM (Technology). Read-only roster, marks attendance for Technology |
| **Homeroom Teacher Only** | Cô Nguyễn Thị Hương | `huong.nguyen@classmanager.local` / `teacher16` | Pure GVCN of class 6A4. Full control over 6A4, no subject classes elsewhere |
| **Unassigned Teacher** | Thầy Đỗ Văn Tân | `unassigned@classmanager.local` / `unassigned` | Empty state test for newly onboarded teachers |
| **Disabled Account** | Thầy Vũ Đình Trọng | `disabled@classmanager.local` / `disabled` | Access control test for locked/suspended staff |

---

## 📁 Project Structure

```text
class-manager/
├── src/
│   ├── app/
│   │   ├── (admin)/               # Administrative management portal
│   │   │   └── admin/
│   │   │       ├── classes/       # 16-class directory & 10-subject assignment modal
│   │   │       ├── dashboard/     # School-wide KPIs & grade distribution
│   │   │       └── teachers/      # Teacher roster, discipline & detail views
│   │   ├── (auth)/
│   │   │   └── login/             # Authentication & 1-click test personas
│   │   ├── (dashboard)/           # Teacher workspace
│   │   │   ├── announcements/     # Class notice board (GVCN write, GVBM read)
│   │   │   ├── attendance/        # Subject-based & homeroom attendance
│   │   │   ├── dashboard/         # Role-adaptive class summary
│   │   │   ├── seating/           # 25-desk interactive seating chart
│   │   │   ├── settings/          # Class settings (GVCN only)
│   │   │   └── students/          # Student records & individual detail profiles
│   │   ├── globals.css            # Design tokens & modern reset
│   │   ├── layout.tsx             # Root layout & context providers
│   │   └── page.tsx               # Entry redirect logic
│   ├── components/
│   │   ├── shell/                 # Topbar, Sidebar, ClassSwitcher
│   │   └── ui/                    # Reusable Buttons, Inputs, Modals, Badges
│   ├── contexts/
│   │   ├── auth-context.tsx       # Session management & user state
│   │   └── class-context.tsx      # Active class, role detection & permissions
│   ├── lib/
│   │   ├── auth.ts                # Mock authentication & permission guards
│   │   ├── mock-data.ts           # Complete 16-class / 480-student / 10-subject dataset
│   │   ├── store.ts               # LocalStore engine with data versioning
│   │   └── utils.ts               # Date formatters & helpers
│   └── types/
│       └── index.ts               # Domain TypeScript interfaces
├── supabase/                      # PostgreSQL migrations for future cloud transition
├── package.json
└── tsconfig.json
```

---

## 🛣️ Roadmap

- [x] Middle school domain modeling (4 grades, 16 classes, 480 students, 10 subjects)
- [x] Per-Class RBAC permission architecture (GVCN vs. GVBM)
- [x] Dynamic Class Switcher with role badges
- [x] Subject-specific attendance logging
- [x] Interactive 25-desk seating chart with Fisher-Yates shuffle
- [x] Admin 10-subject assignment matrix & teacher profiling
- [ ] Supabase Auth & Realtime synchronization integration
- [ ] Student gradebook & transcript tracking
- [ ] PDF export for student rosters, seating diagrams & attendance summaries
- [ ] Dedicated Parent / Student inspection portal

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
