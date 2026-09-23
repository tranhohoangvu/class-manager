<div align="center">

# 🏫 Class Manager (THCS Scale)
### Hệ Thống Quản Lý Lớp Học & Chuyên Cần Trường THCS Nguyễn Tất Thành
**Niên khóa: 2026 - 2027**

[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js%2016%20(App%20Router)-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS v4](https://img.shields.io/badge/Styling-TailwindCSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-91%2F91%20Passed-brightgreen?style=for-the-badge&logo=vitest)](https://vitest.dev/)

</div>

---

## 📖 Giới Thiệu (Overview)

**Class Manager** là hệ thống quản lý học sinh, sơ đồ lớp học, chuyên cần và thời khóa biểu thông minh được thiết kế theo đúng quy chuẩn trường THCS Việt Nam, lấy mô hình thực tế từ **Trường THCS Nguyễn Tất Thành** (Năm học: 2026 - 2027).

Dự án được tổ chức theo kiến trúc **Monorepo chuẩn mực**:
* **[Frontend (`/frontend`)](frontend/README.md):** Ứng dụng Next.js 16 (App Router), React 19, TailwindCSS v4, Vitest.
* **[Backend (`/backend`)](backend/README.md):** REST API độc lập viết bằng Node.js, Express, TypeScript, PostgreSQL.
* **[Documentation (`/docs`)](docs/README.md):** 30 file đặc tả kỹ thuật, kiến trúc, sơ đồ thực thể và workflows.

### 🏫 Quy mô dữ liệu chuẩn THCS (Năm học 2026 - 2027)
- **Đơn vị**: Trường THCS Nguyễn Tất Thành
- **4 Khối học**: Khối 6, Khối 7, Khối 8, Khối 9
- **16 Lớp học**: 6A1–6A4, 7A1–7A4, 8A1–8A4, 9A1–9A4
- **480 Học sinh**: 30 học sinh/lớp với đầy đủ thông tin nhân khẩu và phụ huynh liên lạc
- **24 Giáo viên**: Phân công rõ ràng vai trò GVCN và GVBM
- **10 Môn học cốt lõi**: Toán, Ngữ văn, Tiếng Anh, Vật lí, Hóa học, Sinh học, Lịch sử, Địa lí, Tin học, Công nghệ
- **20 Bàn / 40 Chỗ ngồi mỗi lớp**: Bố cục chuẩn 4 dãy × 5 hàng, hỗ trợ 2 góc nhìn không gian

---

## 📁 Cấu Trúc Monorepo (Monorepo Directory Structure)

```text
class-manager/
├── frontend/                 # Ứng dụng Web Next.js 16 (App Router)
│   ├── src/                  # Mã nguồn UI, components, contexts, services, lib
│   ├── tests/                # Bộ kiểm thử Vitest (8 files, 91 tests)
│   ├── next.config.ts        # Next.js config & API proxy rewrites (/api/* -> :4000)
│   ├── tsconfig.json         # TypeScript config (@/* alias)
│   ├── package.json          # Dependencies frontend (name: "class-manager-frontend")
│   └── README.md             # 📖 Tài liệu chi tiết cho Frontend
│
├── backend/                  # REST API Service Express + TypeScript + PostgreSQL
│   ├── src/                  # Controllers, services, repositories, routes, middleware
│   ├── migrations/           # 6 files migration SQL (001 -> 006)
│   ├── scripts/              # Migration runner script (migrate.ts)
│   ├── package.json          # Dependencies backend (name: "class-manager-backend")
│   └── README.md             # 📖 Tài liệu chi tiết cho Backend
│
├── docs/                     # Hệ thống tài liệu kỹ thuật hoàn chỉnh
│   ├── architecture/         # Kiến trúc hệ thống, module, deployment
│   ├── requirements/         # Phân rã chức năng, use cases, business rules
│   ├── data/                 # Thiết kế CSDL PostgreSQL, ER diagrams
│   ├── api/                  # Đặc tả API contracts & method signatures
│   ├── security/             # Cơ chế xác thực JWT & phân quyền RBAC
│   ├── workflows/            # Tài liệu luồng nghiệp vụ chi tiết
│   ├── diagrams/             # Sơ đồ C4, sequence, class, activity, state diagrams
│   ├── design/               # Ghi chú kỹ thuật & quyết định thiết kế
│   ├── traceability/         # Ma trận truy vết tính năng sang code
│   └── README.md             # 📖 Chỉ mục tài liệu kỹ thuật
│
├── package.json              # Monorepo Root Workspace (npm workspaces)
├── .gitignore                # Quản lý ignore cho toàn bộ repository
└── README.md                 # 📖 Tổng quan dự án (file này)
```

---

## 🏛️ Kiến Trúc Hệ Thống (Architecture)

```text
┌─────────────────────────────────────────────────────────────┐
│                 Frontend: Next.js 16 (Port 3000)            │
│  - App Router (18 routes tĩnh & động)                       │
│  - Centralized API Client (frontend/src/lib/api-client.ts)  │
│  - Client Layouts & Route Guards (RBAC)                     │
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
│  - 12 Relational Tables với constraints, triggers, indexes │
│  - Migrations: backend/migrations/ (001 -> 006)             │
│  - Hỗ trợ triển khai: Native PostgreSQL / Render Postgres   │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Tính Năng Nổi Bật (Key Features)

### 1. Phân Quyền Động Theo Lớp (Per-Class RBAC Matrix)
Quyền hạn tự động thích ứng theo vai trò thực tế của giáo viên đối với từng lớp:

| Chức Năng | Giáo Viên Chủ Nhiệm (GVCN) | Giáo Viên Bộ Môn (GVBM) | Quản Trị Viên (Admin) |
| :--- | :---: | :---: | :---: |
| **Quản lý học sinh** | Toàn quyền (Thêm, Sửa, Import Excel) | Chỉ xem hồ sơ học sinh | Toàn quyền toàn trường |
| **Sơ đồ chỗ ngồi** | Đổi chỗ, Xáo trộn ngẫu nhiên, Xếp chỗ | Chỉ xem sơ đồ | Chỉ xem sơ đồ |
| **Điểm danh** | Điểm danh môn mình dạy; xem toàn bộ lớp | Chỉ điểm danh môn mình dạy | Toàn quyền điểm danh & xem tất cả |
| **Thời khóa biểu** | Chỉ xem lịch các lớp được phân công | Chỉ xem lịch các lớp được phân công | Cấu hình & sửa TKB cả 16 lớp |
| **Ghi chú học sinh** | Tạo & Xóa ghi chú | Không có quyền | Xem ghi chú |
| **Thông báo lớp** | Tạo, Ghim, Xóa thông báo | Chỉ xem | Quản lý toàn trường |
| **Cài đặt lớp** | Đổi tên, phòng học, sĩ số tối đa | Không có quyền | Đổi thông tin mọi lớp |
| **Phân công GV** | Xem danh sách giáo viên của lớp | Xem danh sách | Phân công GVCN & 10 GVBM |

### 2. Sơ Đồ Lớp Học Thông Minh (4×5 / 20 Bàn / 40 Chỗ)
- **Quy chuẩn hình học THCS**: 20 bàn đôi xếp thành 4 dãy × 5 hàng.
- **2 Góc nhìn linh hoạt**: Chuyển đổi giữa *Nhìn từ cuối lớp* và *Nhìn từ bục giảng*.
- **Live Attendance Overlay**: Huy hiệu trạng thái điểm danh trực tiếp trên bàn (`✓ Có mặt`, `✕ Vắng`, `⏰ Muộn`, `📋 Phép`).
- **Xáo trộn ngẫu nhiên (Fisher-Yates)**: Hoán vị ngẫu nhiên đảm bảo tính công bằng và bảo toàn chỗ ngồi.
- **Chế độ In A4**: Định dạng trang in ngang tiêu chuẩn phục vụ dán cửa lớp học.

### 3. Điểm Danh Tự Động Theo Tiết
- **Nhận diện tiết học theo thời gian thực**: Đồng bộ theo đồng hồ thực và lịch TKB để chọn sẵn môn và giáo viên đang đứng lớp.
- **Báo cáo nhanh 1-Click**: Nút sao chép nội dung vắng mặt sáng/chiều định dạng chuẩn để gửi Ban Giám hiệu qua Zalo/Tin nhắn.

### 4. Thời Khóa Biểu 2 Ca Chuẩn THCS
- **Phân ca sáng / chiều**:
  - Khối 6 & 9 ➔ Ca Sáng: Tiết 1–5 (Thứ 2–6), Tiết 1–3 (Thứ 7).
  - Khối 7 & 8 ➔ Ca Chiều: Tiết 6–10 (Thứ 2–6), Tiết 6–8 (Thứ 7).
- **Chống trùng lịch toàn trường**: Tự động chặn khi phân công một giáo viên dạy 2 lớp cùng một tiết.

---

## 🚀 Khởi Chạy Dự Án (Quick Start)

### 1. Yêu cầu môi trường
* Node.js >= 20
* PostgreSQL 16 (Cục bộ hoặc dịch vụ Cloud như Render)

### 2. Cài đặt toàn bộ Workspace (từ thư mục gốc `class-manager/`)
```bash
npm install
```
Lệnh trên sẽ cài đặt và liên kết toàn bộ dependencies của cả `frontend` và `backend`.

### 3. Cấu hình & Chạy Backend
```bash
cd backend
cp .env.example .env
# Chỉnh sửa file .env và điền chuỗi kết nối DATABASE_URL của bạn

# Chạy migration tạo bảng và nạp dữ liệu mẫu
npm run migrate

# Khởi chạy backend (Port 4000)
npm run dev
```

### 4. Chạy Frontend
Từ thư mục gốc `class-manager/`:
```bash
# Khởi chạy frontend (Port 3000)
npm run dev:frontend

# Hoặc khởi chạy từ thư mục frontend:
# cd frontend && npm run dev
```

Truy cập giao diện tại: **`http://localhost:3000`**

### 5. Chạy Kiểm Thử (Unit Tests)
```bash
# Chạy Vitest test suite từ root workspace:
npm test
```

---

## 👥 Tài Khoản Trải Nghiệm (1-Click Login Personas)

Trang `/login` tích hợp sẵn các tài khoản demo giúp kiểm thử nhanh:

| Vai Trò Trải Nghiệm | Họ Tên | Email | Mật Khẩu | Ngữ Cảnh Thử Nghiệm |
| :--- | :--- | :--- | :--- | :--- |
| **Quản trị viên** | Admin Hệ thống | `admin@classmanager.local` | `admin` | Quản trị toàn trường, xếp TKB 16 lớp |
| **Vai trò kép (GVCN + GVBM)** | Thầy Nguyễn Văn An | `an.nguyen@classmanager.local` | `teacher1` | **GVCN lớp 6A1** & **GVBM Toán lớp 6A2, 7A1, 7A2** |
| **Giáo viên bộ môn thuần** | Thầy Hoàng Văn Cường | `cuong.hoang@classmanager.local` | `teacher23` | GVBM Công nghệ, chỉ điểm danh môn mình dạy |
| **Giáo viên chủ nhiệm thuần** | Cô Nguyễn Thị Hương | `huong.nguyen@classmanager.local` | `teacher16` | GVCN lớp 6A4 |
| **Giáo viên chưa phân công** | Thầy Đỗ Văn Tân | `unassigned@classmanager.local` | `unassigned` | Kiểm tra trạng thái rỗng khi chưa nhận lớp |
| **Tài khoản bị khóa** | Thầy Vũ Đình Trọng | `disabled@classmanager.local` | `disabled` | Kiểm tra cơ chế chặn đăng nhập |

---

## 📚 Tài Liệu Kỹ Thuật Chi Tiết

Toàn bộ tài liệu kiến trúc kỹ thuật chi tiết được lưu trữ tại thư mục [`/docs`](docs/README.md):

* **[Chỉ mục tài liệu kỹ thuật (Master Index)](docs/README.md)**
* **[Frontend README](frontend/README.md)** & **[Backend README](backend/README.md)**
* [Kiến trúc hệ thống (System Architecture)](docs/architecture/system-architecture.md) & [Kiến trúc module (Module Architecture)](docs/architecture/module-architecture.md)
* [Thiết kế CSDL (Database Design)](docs/data/database-design.md) & [Sơ đồ thực thể ERD](docs/data/er-diagram.md)
* [Đặc tả API Contracts (API Reference)](docs/api/api-reference.md)
* [Kiến trúc xác thực (Authentication)](docs/security/authentication.md) & [Ma trận phân quyền (Authorization/RBAC)](docs/security/authorization.md)
* [Quy tắc nghiệp vụ THCS (Business Rules Catalog)](docs/requirements/business-rules.md)
* [Ma trận truy vết tính năng (Feature-to-Code Traceability)](docs/traceability/feature-to-code.md)

---

## 📄 License

Dự án được phân phối dưới giấy phép [MIT License](LICENSE).
