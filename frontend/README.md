# Class Manager — Frontend Application

Giao diện web ứng dụng quản lý trường THCS, xây dựng trên nền tảng **Next.js 16 (App Router)** và **React 19**.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

* **Framework:** Next.js 16.3.5 (App Router, Turbopack)
* **Core:** React 19.2.8, TypeScript 5
* **Styling:** TailwindCSS v4 (@tailwindcss/postcss), Lucide / Phosphor Icons (`@phosphor-icons/react`)
* **State Management:** React Context (`AuthContext`, `ClassContext`) + Domain Service Layer
* **Validation & Forms:** Zod 3.25
* **Testing:** Vitest 5.0 (8 test suites, 91 unit tests)
* **Data & Export:** SheetJS (`xlsx`) cho nhập/xuất bảng tính Excel
* **UI Feedback:** Sonner (Toast notifications)

---

## 📁 Cấu Trúc Thư Mục (Directory Structure)

```text
frontend/
├── src/
│   ├── app/                      # Next.js App Router (Pages, Layouts, Route Groups)
│   │   ├── (admin)/admin/        # Quản trị hệ thống (Lớp học, Giáo viên, Báo cáo toàn trường)
│   │   ├── (auth)/login/         # Trang đăng nhập & 1-click test personas
│   │   ├── (dashboard)/          # Nghiệp vụ giáo viên (Sơ đồ lớp, Điểm danh, TKB, Học sinh)
│   │   │   ├── announcements/    # Thông báo lớp
│   │   │   ├── attendance/       # Điểm danh theo tiết thông minh
│   │   │   ├── dashboard/        # Bảng điều khiển lớp học
│   │   │   ├── history/          # Lịch sử chuyên cần theo khoảng ngày
│   │   │   ├── seating/          # Sơ đồ lớp 20 bàn / 40 học sinh (Click-to-Swap, Fisher-Yates)
│   │   │   ├── settings/         # Cài đặt sĩ số & thông tin lớp
│   │   │   ├── students/         # Quản lý học sinh & import Excel
│   │   │   │   └── [id]/         # Hồ sơ học sinh & liên lạc phụ huynh
│   │   │   └── timetable/        # Lưới thời khóa biểu 2 ca (Sáng / Chiều)
│   │   ├── access-denied/        # Màn hình chặn truy cập 403 Forbidden
│   │   ├── globals.css           # OKLCH CSS variables & in ấn A4 (@media print)
│   │   ├── layout.tsx            # Root HTML & Auth Provider wrapper
│   │   └── page.tsx              # Điều hướng root theo role
│   │
│   ├── components/
│   │   ├── shell/                # Chrome giao diện (Sidebar, AdminSidebar, MobileNav, ClassSwitcher)
│   │   └── ui/                   # Atoms UI (Button, Input, Modal, Badge, StateViews)
│   │
│   ├── contexts/
│   │   ├── auth-context.tsx      # Quản lý phiên đăng nhập và thông tin giáo viên
│   │   └── class-context.tsx     # Quản lý lớp đang chọn và phân giải vai trò ngữ cảnh (GVCN/GVBM)
│   │
│   ├── lib/
│   │   ├── api-client.ts         # REST API Client kết nối Express Backend
│   │   ├── auth.ts               # Xác thực và quản lý tài khoản giáo viên
│   │   ├── constants.ts          # Hằng số chuẩn THCS (Ca học, môn học, bảng màu)
│   │   ├── export.ts             # Xuất báo cáo và mẫu import Excel
│   │   ├── mock-data.ts          # Bộ dữ liệu mẫu trường THCS (16 lớp, 480 học sinh)
│   │   ├── store.ts              # LocalStore (Client-side persistence singleton)
│   │   ├── utils.ts              # Helpers định dạng ngày tháng tiếng Việt, classnames
│   │   └── validations/          # Zod schema cho học sinh, giáo viên, lớp học
│   │
│   ├── services/                 # Tầng nghiệp vụ trừu tượng hóa
│   │   ├── admin-report.service.ts
│   │   ├── announcement.service.ts
│   │   ├── attendance.service.ts
│   │   ├── auth-guard.ts         # Ma trận phân quyền RBAC
│   │   ├── class.service.ts
│   │   ├── note.service.ts
│   │   ├── seating.service.ts
│   │   ├── student.service.ts
│   │   ├── teacher.service.ts
│   │   └── timetable.service.ts
│   │
│   ├── types/                    # TypeScript interfaces & domain models
│   └── middleware.ts             # Next.js route protection & redirect middleware
│
├── tests/                        # Vitest automated test suite (91 tests)
├── next.config.ts                # Cấu hình Next.js & Proxy rewrites sang Backend (:4000)
├── postcss.config.mjs            # Cấu hình Tailwind PostCSS
├── tsconfig.json                 # TypeScript config với alias @/*
├── vitest.config.mjs             # Cấu hình Vitest runner
├── .env.example                  # Mẫu biến môi trường
└── package.json                  # Dependencies & scripts frontend
```

---

## 🚀 Khởi Chạy Ứng Dụng (Running Locally)

### 1. Cài đặt dependencies (từ thư mục `frontend/`):
```bash
npm install
```

### 2. Cấu hình biến môi trường:
Tạo file `.env.local` từ mẫu `.env.example`:
```bash
cp .env.example .env.local
```
Nội dung `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Chạy dev server:
```bash
npm run dev
```
Giao diện sẽ chạy tại: **`http://localhost:3000`**

### 4. Chạy kiểm thử tự động (Unit Tests):
```bash
npm test
```
Chạy toàn bộ 8 file test kiểm tra RBAC, thuật toán xếp chỗ, thời khóa biểu, điểm danh và import dữ liệu.

### 5. Build cho Production:
```bash
npm run build
npm run start
```

---

## 🔗 Cơ Chế Proxy Sang Backend

Trong file `next.config.ts`, Frontend đã thiết lập sẵn các rewrite rules:
* Các request gọi tới `/api/:path*` sẽ tự động chuyển tiếp tới Express Backend (mặc định: `http://localhost:4000/api/:path*`).
* Endpoint `/health` được chuyển tiếp tới `http://localhost:4000/health`.

Nhờ cơ chế này, frontend không bị lỗi CORS khi giao tiếp với backend trong quá trình phát triển cục bộ.
