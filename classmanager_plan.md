# Class Manager — Implementation Plan

## Overview

**Class Manager** is a focused, practical classroom management web application for a single teacher managing one classroom. It is **not** a SaaS dashboard, LMS, or school platform — it is a calm, human, daily-use teacher tool.

**Design Read:** Productivity web app for teachers, calm/practical/editorial language, light mode, leaning toward Next.js App Router + Supabase + Tailwind v4.

**Dials (Taste Skill):**
- `DESIGN_VARIANCE: 3` — restrained, consistent, practical
- `MOTION_INTENSITY: 2` — hover states, subtle transitions only
- `VISUAL_DENSITY: 5` — compact but readable, data tables, no card-soup

---

## User Review Required

> [!IMPORTANT]
> **Supabase project**: You need a Supabase project with URL and anon key ready. Please provide these, or I'll use `.env.local` placeholders and you can fill them in after setup.

> [!IMPORTANT]
> **Authentication**: The spec requires Supabase Auth with RLS. This means the teacher must log in. Should I seed a demo teacher account (`giaovien@demo.edu.vn` / `Demo123456!`) as part of setup?

> [!WARNING]
> **Build time**: This is a 16-step implementation. I'll execute it fully in sequence. The initial scaffold takes ~3 minutes; each module will follow. Total estimated build: 45-90 minutes of agent work.

---

## Open Questions

> [!IMPORTANT]
> **Font choice**: The spec calls for Vietnamese character support. I plan to use **Geist** (primary) + **IBM Plex Mono** (metadata/code). Both have excellent Vietnamese glyphs via Google Fonts self-hosted. Acceptable?

> [!IMPORTANT]
> **Accent color**: I plan to use a restrained **indigo-teal** (`oklch(0.52 0.11 220)` approx) — calm, educational, not AI-purple. Not blue, not green. Acceptable?

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14 App Router** | RSC, file-based routing, server actions |
| Database | **Supabase (PostgreSQL)** | Auth, RLS, real-time if needed later |
| Styling | **Tailwind CSS v4** | Design token system, utility-first |
| Icons | **@phosphor-icons/react** | Consistent, single family |
| Drag & Drop | **@dnd-kit/core** | Lightweight, accessible, no game-show |
| Forms | **react-hook-form + Zod** | Validation, type-safe |
| Dates | **date-fns** | Lightweight, no moment.js |
| Toasts | **sonner** | Minimal, accessible |
| Tables | **TanStack Table** | Sortable, filterable student list |

---

## Project Structure

```
d:\CODE\2026\class-manager\
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          ← Shell with sidebar
│   │   │   ├── dashboard/
│   │   │   ├── students/
│   │   │   │   ├── page.tsx        ← Student list
│   │   │   │   └── [id]/page.tsx   ← Student detail
│   │   │   ├── seating/
│   │   │   ├── attendance/
│   │   │   ├── history/
│   │   │   ├── announcements/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   └── ...                 ← Route handlers if needed
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                     ← Primitive components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── table.tsx
│   │   ├── shell/
│   │   │   ├── sidebar.tsx
│   │   │   └── header.tsx
│   │   ├── dashboard/
│   │   ├── students/
│   │   ├── seating/
│   │   ├── attendance/
│   │   └── announcements/
│   ├── services/
│   │   ├── students.ts
│   │   ├── seating.ts              ← randomize() lives here
│   │   ├── attendance.ts
│   │   └── announcements.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── validations/
│   │   │   ├── student.ts
│   │   │   ├── attendance.ts
│   │   │   └── announcement.ts
│   │   ├── constants.ts            ← MAX_STUDENTS=50, DESK_COUNT=25, etc.
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   └── hooks/
│       ├── use-students.ts
│       ├── use-seating.ts
│       └── use-attendance.ts
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── public/
├── .env.local
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Proposed Changes

### STEP 1 — Project Scaffold

#### [NEW] `d:\CODE\2026\class-manager\` (entire Next.js app)

Initialize with:
```bash
npx -y create-next-app@latest class-manager --typescript --tailwind --app --no-src-dir --import-alias "@/*" --use-npm
```

Then restructure to use `src/` directory and install dependencies.

---

### STEP 2 — Design System

#### [NEW] [`globals.css`](file:///d:/CODE/2026/class-manager/src/app/globals.css)

CSS custom property tokens:

```css
:root {
  --bg: oklch(0.98 0.005 240);           /* very light cool-neutral page */
  --surface: oklch(1 0 0);               /* white cards/surfaces */
  --surface-muted: oklch(0.965 0.005 240); /* subtle secondary surface */
  --border: oklch(0.88 0.008 240);       /* subtle border */
  --border-strong: oklch(0.80 0.01 240);

  --text-primary: oklch(0.18 0.01 240);  /* deep neutral, not pure black */
  --text-secondary: oklch(0.40 0.01 240);
  --text-muted: oklch(0.58 0.01 240);

  --accent: oklch(0.52 0.11 220);        /* restrained teal-indigo */
  --accent-hover: oklch(0.46 0.11 220);
  --accent-subtle: oklch(0.95 0.03 220); /* very light tint for hover bg */

  --success: oklch(0.52 0.14 148);       /* green — Present */
  --warning: oklch(0.65 0.14 70);        /* amber — Late */
  --danger: oklch(0.52 0.18 25);         /* red — Absent */
  --neutral: oklch(0.65 0.01 240);       /* Excused */

  --radius-sm: 6px;
  --radius: 8px;
  --radius-lg: 10px;
  --radius-xl: 12px;

  --shadow-sm: 0 1px 2px 0 oklch(0.18 0.01 240 / 0.06);
  --shadow: 0 1px 3px 0 oklch(0.18 0.01 240 / 0.08), 0 1px 2px -1px oklch(0.18 0.01 240 / 0.06);
}
```

Font: **Geist** (Vietnamese-compatible modern sans) via `next/font/google`.

Typography scale:
- Page title: 26px / 700
- Section heading: 18px / 600
- Body: 14px / 400
- Secondary: 13px / 400
- Metadata: 12px / 400

---

### STEP 3 — Database Schema

#### [NEW] [`supabase/migrations/001_initial_schema.sql`](file:///d:/CODE/2026/class-manager/supabase/migrations/001_initial_schema.sql)

Tables: `classes`, `students`, `desks`, `seats`, `attendance`, `announcements`, `student_notes`

Key constraints:
- `UNIQUE(student_id)` on seats → one student, one seat
- `UNIQUE(desk_id, side)` on seats → one student per side
- `CHECK(side IN ('left', 'right'))` on seats
- `UNIQUE(student_id, date)` on attendance
- `CHECK(status IN ('present', 'absent', 'late', 'excused'))` on attendance
- `CHECK(status IN ('active', 'inactive'))` on students
- Trigger or CHECK for max 50 active students per class

#### [NEW] [`supabase/seed.sql`](file:///d:/CODE/2026/class-manager/supabase/seed.sql)

Seed data:
- 1 class: `9A1`, Room `A101`, Year `2026-2027`
- 25 desks (5 rows × 5 columns)
- 40 Vietnamese student names
- 40 seats assigned
- 10 empty seats
- ~30 days of attendance history

---

### STEP 4 — Authentication

#### [NEW] [`src/app/(auth)/login/page.tsx`](file:///d:/CODE/2026/class-manager/src/app/(auth)/login/page.tsx)

Clean login form — email + password. No social login for MVP.

#### [NEW] [`src/middleware.ts`](file:///d:/CODE/2026/class-manager/src/middleware.ts)

Protect all `/(dashboard)/*` routes. Redirect unauthenticated users to `/login`.

Supabase RLS policies on all tables: user can only access rows where `class.teacher_id = auth.uid()`.

---

### STEP 5 — Application Shell

#### [NEW] [`src/components/shell/sidebar.tsx`](file:///d:/CODE/2026/class-manager/src/components/shell/sidebar.tsx)

Compact left sidebar:
```
CLASS MANAGER
─────────────
Dashboard
Học sinh       (Students)
Chỗ ngồi       (Seating)
Điểm danh      (Attendance)
Lịch sử        (History)
Thông báo      (Announcements)
─────────────
Cài đặt        (Settings)
```

Width: 220px desktop. Icon + label. Collapses to icon-only on tablet.

---

### STEP 6 — Dashboard

#### [NEW] [`src/app/(dashboard)/dashboard/page.tsx`](file:///d:/CODE/2026/class-manager/src/app/(dashboard)/dashboard/page.tsx)

Structure (NOT cards everywhere):
```
9A1 · Phòng A101 · 2026–2027
──────────────────────────────
Hôm nay: 22/09/2026

Học sinh   Điểm danh hôm nay      
40/50      43 Có mặt · 2 Vắng · 1 Muộn
           [Điểm danh] [Quản lý chỗ ngồi]
──────────────────────────────
Thông báo gần đây
  📌 Kiểm tra Toán  22/09
     Kiểm tra Toán chương 2 vào thứ 6
──────────────────────────────
Tổng quan lớp học
  Sĩ số: 40   Vắng hôm nay: 2   Chỗ trống: 10
```

No fake KPI cards. Typography-driven hierarchy.

---

### STEP 7 — Students Module

#### [NEW] [`src/app/(dashboard)/students/page.tsx`](file:///d:/CODE/2026/class-manager/src/app/(dashboard)/students/page.tsx)

Clean table (TanStack Table):
```
STT  Họ và tên       Mã HS   Giới tính  Chỗ ngồi   Trạng thái
1    Nguyễn Văn An   HS001   Nam        Bàn 07·T   Đang học
2    Trần Minh Anh   HS002   Nữ         Bàn 03·P   Đang học
```

Features: search, gender filter, status filter, sort by name/code, add, edit, inactivate.

#### [NEW] [`src/app/(dashboard)/students/[id]/page.tsx`](file:///d:/CODE/2026/class-manager/src/app/(dashboard)/students/[id]/page.tsx)

Student detail: identity, seat, attendance summary (30-day), recent notes.
Uses typography and spacing, NOT a grid of colorful cards.

---

### STEP 8 — Seating Module

#### [NEW] [`src/app/(dashboard)/seating/page.tsx`](file:///d:/CODE/2026/class-manager/src/app/(dashboard)/seating/page.tsx)

**The signature feature.** Classroom layout:

```
        BẢNG (BOARD)
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Bàn 01  │  │  Bàn 02  │  │  Bàn 03  │  │  Bàn 04  │  │  Bàn 05  │
│ [Trái][P]│  │ [T] [P]  │  │ [T] [P]  │  │ [T] [P]  │  │ [T] [P]  │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
... (5 rows × 5 desks)
```

Desk = subtle bordered rectangle, not a card with shadow.
Seat = small student nameplate or empty slot.

Interactions (dnd-kit):
- **Assign**: click empty seat → pick student
- **Move**: drag student to empty seat
- **Swap**: drag student to occupied seat → swap dialog
- **Remove**: right-click or button → remove from seat
- **Randomize**: button → `seatingService.randomize()` → confirm animation

---

### STEP 9 — Attendance Module

#### [NEW] [`src/app/(dashboard)/attendance/page.tsx`](file:///d:/CODE/2026/class-manager/src/app/(dashboard)/attendance/page.tsx)

Fast attendance workflow:
```
Điểm danh — Thứ Ba, 22/09/2026
[Đánh dấu tất cả có mặt]

01  Nguyễn Văn An    [Có mặt] [Vắng] [Muộn] [Phép]
02  Trần Minh Anh    [Có mặt] [Vắng] [Muộn] [Phép]
...

Có mặt: 43  Vắng: 2  Muộn: 1  Phép: 0
[Lưu điểm danh]
```

- Default: all present
- Click to toggle status
- "Mark all present" button
- Save with server action + validation
- Prevent duplicate for same date

---

### STEP 10 — Attendance History

#### [NEW] [`src/app/(dashboard)/history/page.tsx`](file:///d:/CODE/2026/class-manager/src/app/(dashboard)/history/page.tsx)

Grid view: students × dates

```
         01/09  02/09  03/09  04/09  05/09
Nguyễn A   P      P      P      L      P
Trần B     P      A      P      P      P
```

Color coding: P=green, A=red, L=amber, E=neutral.
Filter by: day / week / month.
Summary stats per student (in sidebar or row).

---

### STEP 11 — Announcements

#### [NEW] [`src/app/(dashboard)/announcements/page.tsx`](file:///d:/CODE/2026/class-manager/src/app/(dashboard)/announcements/page.tsx)

Clean notice board style. NOT social feed.

```
[+ Thêm thông báo]

📌 Kiểm tra Toán chương 2          22/09/2026  [Sửa] [Xóa]
   Kiểm tra vào thứ 6 tuần này.

   Họp phụ huynh                   20/09/2026  [Sửa] [Xóa] [Ghim]
   Cuộc họp phụ huynh vào 18:00...
```

CRUD + pin/unpin. No rich text editor for MVP — just textarea.

---

### STEP 12 — Student Notes

Notes appear within the Student Detail page. Simple list per student.

```
Ghi chú                            [+ Thêm ghi chú]
──────────────────────────────
"Tham gia tích cực trong buổi học nhóm."    22/09/2026  [Sửa] [Xóa]
"Cần chú ý hơn trong giờ Toán."             18/09/2026  [Sửa] [Xóa]
```

---

### STEP 13 — Settings

#### [NEW] [`src/app/(dashboard)/settings/page.tsx`](file:///d:/CODE/2026/class-manager/src/app/(dashboard)/settings/page.tsx)

```
Thông tin lớp học
  Tên lớp:         9A1
  Phòng học:       A101
  Năm học:         2026–2027
  Sĩ số tối đa:    50
  Số bàn:          25
  Chỗ ngồi/bàn:   2 (cố định)

[Lưu thay đổi]
```

---

## Database Schema Detail

```sql
-- classes
CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  room_name text,
  school_year text,
  max_students integer NOT NULL DEFAULT 50,
  desk_count integer NOT NULL DEFAULT 25,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- students
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  student_code text NOT NULL,
  full_name text NOT NULL,
  gender text CHECK (gender IN ('male', 'female')),
  date_of_birth date,
  phone text,
  email text,
  avatar_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(class_id, student_code)
);

-- desks
CREATE TABLE desks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  desk_number integer NOT NULL,
  row integer NOT NULL,
  col integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_id, desk_number)
);

-- seats
CREATE TABLE seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  desk_id uuid REFERENCES desks(id) ON DELETE CASCADE,
  side text NOT NULL CHECK (side IN ('left', 'right')),
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  UNIQUE(desk_id, side),
  UNIQUE(student_id)  -- one student, one seat
);

-- attendance
CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

-- announcements
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- student_notes
CREATE TABLE student_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## Verification Plan

### Automated (after build)
- `npm run build` — no TypeScript errors
- `npm run lint` — no ESLint errors

### Business Rule Tests (manual)
- [ ] Cannot add >50 active students to one class
- [ ] Cannot assign same student to two seats (DB UNIQUE enforced)
- [ ] Cannot record two attendance entries for same student+date
- [ ] Inactive student removed from seating correctly
- [ ] Randomize distributes all active students across available seats
- [ ] Login → dashboard → all modules accessible
- [ ] Data persists after logout/login

### Visual Audit
- [ ] Does NOT look like AI-generated SaaS dashboard
- [ ] No card-soup
- [ ] Typography hierarchy is clear
- [ ] Seating page feels like a classroom
- [ ] Attendance is fast to use (≤ 10 seconds to mark 40 students)
- [ ] Light mode, consistent color system
- [ ] Responsive: desktop, tablet, mobile

---

## Implementation Order

1. `npx create-next-app` → project scaffold
2. Install dependencies
3. Design system (`globals.css`, tokens, base components)
4. Supabase client setup + types
5. Database migrations + seed
6. Auth (login page + middleware)
7. App shell (sidebar + layout)
8. Dashboard
9. Students (list + detail)
10. Seating (classroom map + DnD)
11. Attendance (daily)
12. Attendance History
13. Announcements
14. Student Notes (in student detail)
15. Settings
16. Final audit: responsive, loading/empty/error states, Vietnamese content
