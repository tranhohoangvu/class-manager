# Class Manager — REST API Backend

Dịch vụ backend REST API độc lập cho hệ thống Class Manager, xây dựng trên nền tảng **Node.js**, **Express**, **TypeScript** và cơ sở dữ liệu quan hệ **PostgreSQL**.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

* **Runtime:** Node.js (>= 20)
* **Framework:** Express 4.21
* **Ngôn ngữ:** TypeScript 5.8
* **Database:** PostgreSQL 16 (Render PostgreSQL hoặc Local DB)
* **Client DB:** `pg` (node-postgres connection pool)
* **Bảo mật & Xác thực:** `bcryptjs` (băm mật khẩu), `jsonwebtoken` (JWT token & HttpOnly cookies)
* **Validation:** Zod 3.24 (Kiểm tra dữ liệu đầu vào request params, query, body)
* **Dev Tooling:** `tsx` (TypeScript execute & hot reload watch)

---

## 📁 Cấu Trúc Thư Mục (Directory Structure)

```text
backend/
├── src/
│   ├── config/               # Cấu hình kết nối DB Pool và biến môi trường
│   │   ├── database.ts       # Kết nối pg Pool & hàm thực thi SQL
│   │   └── env.ts            # Đọc và xác thực biến môi trường (dotenv)
│   │
│   ├── controllers/          # Nhận HTTP request, gọi service, trả JSON response
│   │   ├── announcement.controller.ts
│   │   ├── attendance.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── class.controller.ts
│   │   ├── note.controller.ts
│   │   ├── report.controller.ts
│   │   ├── seating.controller.ts
│   │   ├── student.controller.ts
│   │   ├── teacher.controller.ts
│   │   └── timetable.controller.ts
│   │
│   ├── middleware/           # Tầng chặn lọc & bảo vệ request
│   │   ├── auth.middleware.ts     # Xác thực JWT token từ cookie hoặc Bearer header
│   │   ├── error.middleware.ts    # Bắt và chuẩn hóa lỗi (AppError)
│   │   ├── rbac.middleware.ts     # Kiểm tra quyền: requireRole, requireClassAccess
│   │   └── validate.middleware.ts # Validate schema Zod cho body/params/query
│   │
│   ├── repositories/         # Tầng truy xuất dữ liệu SQL tham số hóa (pg Pool)
│   │   ├── announcement.repo.ts
│   │   ├── attendance.repo.ts
│   │   ├── class.repo.ts
│   │   ├── note.repo.ts
│   │   ├── report.repo.ts
│   │   ├── seating.repo.ts
│   │   ├── student.repo.ts
│   │   ├── subject.repo.ts
│   │   ├── teacher.repo.ts
│   │   ├── timetable.repo.ts
│   │   └── user.repo.ts
│   │
│   ├── routes/               # Khai báo endpoints và gắn middleware
│   │   ├── index.ts          # Root API router (prefix /api và /health)
│   │   ├── auth.routes.ts
│   │   ├── class.routes.ts
│   │   ├── student.routes.ts
│   │   ├── seating.routes.ts
│   │   ├── attendance.routes.ts
│   │   ├── timetable.routes.ts
│   │   ├── announcement.routes.ts
│   │   ├── note.routes.ts
│   │   ├── teacher.routes.ts
│   │   ├── report.routes.ts
│   │   └── health.routes.ts
│   │
│   ├── services/             # Logic nghiệp vụ, kiểm tra ràng buộc & xử lý transaction
│   │   ├── announcement.service.ts
│   │   ├── attendance.service.ts
│   │   ├── auth.service.ts
│   │   ├── class.service.ts
│   │   ├── note.service.ts
│   │   ├── report.service.ts
│   │   ├── seating.service.ts
│   │   ├── student.service.ts
│   │   ├── teacher.service.ts
│   │   └── timetable.service.ts
│   │
│   ├── types/                # TypeScript types & Express Request mở rộng
│   ├── utils/                # Bcrypt hash, JWT sign/verify, AppError class
│   ├── validators/           # Định nghĩa Zod schemas cho tất cả endpoints
│   ├── app.ts                # Thiết lập Express app, CORS, CookieParser
│   └── server.ts             # Khởi động HTTP server & graceful shutdown
│
├── migrations/               # 6 file SQL migration đánh số thứ tự
│   ├── 001_initial_schema.sql  # 12 bảng chuẩn hóa CSDL THCS
│   ├── 002_constraints.sql     # Ràng buộc toàn vẹn khóa ngoại & sĩ số
│   ├── 003_indexes.sql         # Đánh chỉ mục tăng tốc độ truy vấn
│   ├── 004_functions.sql       # PostgreSQL stored functions
│   ├── 005_triggers.sql        # Triggers tự động cập nhật audit timestamp
│   └── 006_seed.sql            # Dữ liệu mẫu ban đầu (16 lớp, 24 GV, 480 HS)
│
├── scripts/                  # Kịch bản chạy cơ sở dữ liệu
│   └── migrate.ts            # Tự động thực thi tuần tự các file migrations
│
├── .env.example              # Mẫu cấu hình môi trường backend
├── .gitignore
├── tsconfig.json
└── package.json
```

---

## 🚀 Khởi Chạy Ứng Dụng (Running Locally)

### 1. Cài đặt dependencies (từ thư mục `backend/`):
```bash
npm install
```

### 2. Cấu hình biến môi trường:
Tạo file `.env` từ mẫu `.env.example`:
```bash
cp .env.example .env
```
Nội dung cấu hình trong `.env`:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/class_manager
JWT_SECRET=super_secret_jwt_key_change_in_production_32chars
SESSION_SECRET=super_secret_session_key_change_in_production
CORS_ORIGIN=http://localhost:3000
```

### 3. Chạy Database Migrations:
Tạo cấu trúc bảng, ràng buộc và nạp dữ liệu seed vào PostgreSQL:
```bash
npm run migrate
```

### 4. Khởi chạy Backend ở chế độ Development:
```bash
npm run dev
```
Server sẽ chạy tại: **`http://localhost:4000`**  
Kiểm tra sức khỏe endpoint: **`http://localhost:4000/health`**

### 5. Biên dịch & Chạy Production:
```bash
npm run build
npm run start
```

---

## 📡 Danh Mục Endpoints Chính (REST API Matrix)

| Endpoint | Method | Quyền hạn | Mô tả |
| :--- | :---: | :--- | :--- |
| `/health` | GET | Public | Health check server status |
| `/api/auth/login` | POST | Public | Đăng nhập tài khoản, cấp JWT cookie |
| `/api/auth/logout` | POST | Authenticated | Xóa cookie, kết thúc phiên làm việc |
| `/api/auth/me` | GET | Authenticated | Lấy thông tin user hiện tại |
| `/api/classes` | GET | Authenticated | Danh sách lớp học kèm thông tin GVCN |
| `/api/classes/:classId/students` | GET, POST | GVCN / Admin | Quản lý học sinh trong lớp |
| `/api/classes/:classId/students/import` | POST | GVCN / Admin | Import danh sách học sinh từ file Excel |
| `/api/classes/:classId/seating` | GET, POST | GVCN / Admin | Lấy và cập nhật sơ đồ chỗ ngồi |
| `/api/classes/:classId/attendance` | GET, POST | GVBM / GVCN / Admin | Điểm danh theo tiết / điểm danh buổi |
| `/api/classes/:classId/timetable` | GET, POST | Authenticated (POST: Admin) | Lấy và cập nhật lịch thời khóa biểu |
| `/api/teachers` | GET, POST | Admin | Quản lý giáo viên và phân công giảng dạy |
| `/api/reports/school-summary` | GET | Admin | Thống kê chuyên cần và báo cáo toàn trường |
