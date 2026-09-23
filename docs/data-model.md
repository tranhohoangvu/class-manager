# CLASS MANAGER — HỆ THỐNG DATA MODEL & DATA CONTRACTS
**Phiên bản:** 2.0 (Chuẩn hóa cho THCS Scale & Sẵn sàng cho Supabase Migration)  
**Tác giả:** Antigravity Team  
**Mục tiêu:** Định nghĩa chuẩn mực cấu trúc dữ liệu cho tất cả các thực thể (Entities), quan hệ (Relationships), ràng buộc tính toàn vẹn (Integrity Constraints) và phân quyền (Role Access/RLS), đảm bảo việc lưu trữ hiện tại trong `LocalStore` hoàn toàn tương thích và dễ dàng migrate lên PostgreSQL/Supabase.

---

## 1. TỔNG QUAN SƠ ĐỒ THỰC THỂ (ERD)

```text
┌──────────────┐         1:N         ┌─────────────────────┐
│  AcademicYear│────────────────────▶│       Class         │
└──────────────┘                     └──────────┬──────────┘
                                                │
          ┌─────────────────────────────────────┼──────────────────────────────────┐
          │ 1:N                                 │ 1:N                              │ 1:N
          ▼                                     ▼                                  ▼
   ┌─────────────┐                      ┌───────────────┐                  ┌───────────────┐
   │   Student   │                      │ClassMembership│                  │     Desk      │
   └──────┬──────┘                      └───────┬───────┘                  └───────┬───────┘
          │                                     │                                  │ 1:2
          ├──────────────┐                      │ N:1                              ▼
          │ 1:N          │ 1:N                  ▼                           ┌──────────────┐
          ▼              ▼               ┌─────────────┐                    │     Seat     │
    ┌──────────┐   ┌───────────┐         │    User     │                    └──────┬───────┘
    │Attendance│   │StudentNote│         │  (Teacher)  │                           │ 1:1 (nullable)
    └──────────┘   └───────────┘         └──────┬──────┘◀──────────────────────────┘
                                                │ 1:N
                                                ▼
                                        ┌───────────────┐        N:1        ┌─────────────┐
                                        │SubjAssignment │──────────────────▶│   Subject   │
                                        └───────────────┘                   └─────────────┘
```

---

## 2. CHI TIẾT CÁC THỰC THỂ (ENTITY CONTRACTS)

### 2.1. User / Teacher
Mô tả tài khoản người dùng trong hệ thống trường học (Admin hoặc Giáo viên).
- **ID:** `string` (UUID trong PostgreSQL, e.g. `u-admin-01`, `u-gv-01`)
- **Required fields:**
  - `name`: `string` (Họ tên đầy đủ, 2..100 ký tự)
  - `email`: `string` (Địa chỉ email hợp lệ, duy nhất toàn hệ thống)
  - `role`: `'ADMIN' | 'TEACHER'`
  - `status`: `'active' | 'disabled'`
  - `created_at`: ISO 8601 string
  - `updated_at`: ISO 8601 string
- **Optional fields:**
  - `phone`: `string | null`
  - `avatar_url`: `string | null`
  - `password`: `string` (Mock hashed password)
  - `subject_id`: `string | null` (Môn học chuyên môn chính của giáo viên)
  - `assigned_class_ids`: `string[]` (Cache ID các lớp phụ trách)
- **Unique Constraints:** `UNIQUE(email)`
- **Valid States:** `active` (đang giảng dạy), `disabled` (tạm khóa tài khoản).
- **Role Access:**
  - `ADMIN`: Xem tất cả, tạo mới, chỉnh sửa, khóa/mở khóa, đặt lại mật khẩu.
  - `TEACHER`: Xem thông tin cá nhân của mình.
- **Supabase Mapping:** Bảng `auth.users` kết hợp bảng `public.profiles`.

---

### 2.2. Subject (Môn học)
Danh mục môn học chính khóa cấp THCS (10 môn).
- **ID:** `string` (e.g. `sub-mat`, `sub-lit`)
- **Required fields:**
  - `code`: `string` (Mã môn viết tắt: `MAT`, `LIT`, `ENG`, `PHY`, `CHE`, `BIO`, `HIS`, `GEO`, `INF`, `TEC`)
  - `name`: `string` (Tên môn học tiếng Việt: Toán, Ngữ văn, Tiếng Anh,...)
- **Unique Constraints:** `UNIQUE(code)`
- **Lifecycle:** Cố định theo chương trình GDPT của Bộ Giáo dục & Đào tạo.

---

### 2.3. Class (Lớp học)
- **ID:** `string` (e.g. `c-6a1`, `c-9a4`)
- **Required fields:**
  - `name`: `string` (Tên lớp: `6A1`, `9A2`,...)
  - `grade`: `number` (`6`, `7`, `8`, `9`)
  - `school_year`: `string` (Ví dụ: `2025 - 2026`)
  - `max_students`: `number` (Mặc định `30`, tối đa `45`)
  - `desk_count`: `number` (Mặc định `25` bàn = 50 chỗ)
  - `status`: `'active' | 'archived'`
  - `created_at`, `updated_at`: ISO 8601 string
- **Optional fields:**
  - `teacher_id`: `string | null` (ID của Giáo viên Chủ nhiệm - GVCN)
  - `room_name`: `string | null` (Phòng học số, e.g. `P.201`)
- **Unique Constraints:** `UNIQUE(name, school_year)`
- **Role Access:**
  - `ADMIN`: Quản lý toàn diện (tạo mới, đổi GVCN, lưu trữ lớp).
  - `HOMEROOM_TEACHER`: Quản trị nội bộ lớp (học sinh, chỗ ngồi, điểm danh, thông báo).
  - `SUBJECT_TEACHER`: Xem thông tin lớp, xem danh sách học sinh, điểm danh môn mình dạy.
- **Supabase Mapping:** Bảng `public.classes`.

---

### 2.4. ClassMembership & SubjectAssignment (Phân công giảng dạy)
Hai thực thể cốt lõi xác lập quyền hạn của giáo viên theo ngữ cảnh từng lớp.

#### A. `ClassMembership`
- **ID:** `string`
- **Fields:**
  - `teacher_id`: `string` (FK `users.id`)
  - `class_id`: `string` (FK `classes.id`)
  - `role`: `'HOMEROOM_TEACHER' | 'SUBJECT_TEACHER'`
  - `created_at`: ISO 8601 string
- **Unique Constraints:** `UNIQUE(teacher_id, class_id)` (Một giáo viên chỉ có 1 bản ghi thành viên chính cho mỗi lớp; nếu làm GVCN thì role ưu tiên là `HOMEROOM_TEACHER`).

#### B. `SubjectAssignment`
- **ID:** `string`
- **Fields:**
  - `teacher_id`: `string` (FK `users.id`)
  - `class_id`: `string` (FK `classes.id`)
  - `subject_id`: `string` (FK `subjects.id`)
  - `created_at`: ISO 8601 string
- **Unique Constraints:** `UNIQUE(class_id, subject_id)` (Mỗi môn ở mỗi lớp chỉ do 1 giáo viên phụ trách tại một thời điểm).
- **Business Rule (Ràng buộc nghiệp vụ THCS):**
  - Một giáo viên chỉ được phân công giảng dạy trong **tối đa 2 khối** (Ví dụ: khối {6, 7} hoặc {8, 9}). Không được phân công dạy dàn trải 3 hoặc 4 khối.

---

### 2.5. Student (Học sinh)
- **ID:** `string` (e.g. `stu-c-6a1-01`)
- **Required fields:**
  - `class_id`: `string` (FK `classes.id`)
  - `student_code`: `string` (Mã định danh học sinh trong lớp, e.g. `HS01`..`HS30`)
  - `full_name`: `string` (Họ và tên đầy đủ)
  - `status`: `'active' | 'inactive'`
  - `created_at`, `updated_at`: ISO 8601 string
- **Optional fields:**
  - `gender`: `'male' | 'female' | null`
  - `date_of_birth`: `string | null` (YYYY-MM-DD)
  - `phone`: `string | null` (Số điện thoại liên hệ phụ huynh)
  - `email`: `string | null`
  - `avatar_url`: `string | null`
- **Unique Constraints:**
  - `UNIQUE(class_id, student_code)`: Không được trùng mã học sinh trong cùng 1 lớp.
- **Ràng buộc số lượng:**
  - Số lượng học sinh `status = 'active'` trong lớp không được vượt quá `class.max_students`.

---

### 2.6. Desk & Seat (Cơ sở vật chất & Sơ đồ chỗ ngồi)

#### A. `Desk` (Bàn học)
- **ID:** `string`
- **Fields:**
  - `class_id`: `string` (FK `classes.id`)
  - `desk_number`: `number` (1..25)
  - `row_num`: `number` (1..5)
  - `col_num`: `number` (1..5)
- **Unique Constraints:** `UNIQUE(class_id, desk_number)`

#### B. `Seat` (Ghế ngồi)
- **ID:** `string`
- **Fields:**
  - `desk_id`: `string` (FK `desks.id`)
  - `side`: `'left' | 'right'`
  - `student_id`: `string | null` (FK `students.id`, nullable)
- **Unique Constraints:**
  - `UNIQUE(desk_id, side)`: Mỗi bàn chỉ có 1 vị trí trái và 1 vị trí phải.
  - `UNIQUE(student_id)`: Một học sinh chỉ được ngồi tại tối đa 1 vị trí trong sơ đồ lớp.
- **Data Invariant:**
  - Nếu `seat.student_id` khác null, thì học sinh đó **bắt buộc phải thuộc về lớp sở hữu bàn học đó** (`student.class_id === desk.class_id`).

---

### 2.7. Attendance (Điểm danh chuyên cần)
- **ID:** `string` (e.g. `att-stu01-submat-2026-09-22`)
- **Required fields:**
  - `student_id`: `string` (FK `students.id`)
  - `class_id`: `string` (FK `classes.id`)
  - `date`: `string` (Định dạng `YYYY-MM-DD`, chuẩn local date GMT+7)
  - `status`: `'present' | 'absent' | 'late' | 'excused'`
  - `created_at`, `updated_at`: ISO 8601 string
- **Optional fields:**
  - `subject_id`: `string | null` (Null nếu điểm danh tổng quát theo buổi của GVCN, hoặc có giá trị nếu là giờ dạy của GVBM)
  - `teacher_id`: `string | null` (ID giáo viên thực hiện điểm danh)
  - `note`: `string | null` (Lý do vắng/muộn)
- **Unique Constraints:**
  - `UNIQUE(student_id, date, COALESCE(subject_id, 'GENERAL'))`: Mỗi học sinh trong một ngày chỉ có 1 bản ghi điểm danh cho mỗi môn (hoặc buổi học).
- **Valid Values:**
  - `present`: Có mặt.
  - `absent`: Vắng không phép.
  - `late`: Đi muộn.
  - `excused`: Vắng có phép.

- **Role Access:**
  - `ADMIN`: Toàn quyền xem và ghi nhận điểm danh cho tất cả các lớp và môn học.
  - `GVCN`: Chỉ được điểm danh những môn/tiết mà chính mình trực tiếp phụ trách giảng dạy. Được quyền XEM toàn bộ dữ liệu điểm danh của lớp mình chủ nhiệm (chế độ Chỉ xem - Read-only). Không được sửa/xóa/điểm danh thay giáo viên khác.
  - `GVBM`: Chỉ được điểm danh và xem dữ liệu điểm danh của môn/tiết mà chính mình được phân công phụ trách. Bị chặn xem và sửa các môn khác.

---

### 2.8. Announcement (Thông báo lớp học)
- **ID:** `string`
- **Required fields:**
  - `class_id`: `string` (FK `classes.id`)
  - `title`: `string` (Tiêu đề thông báo, 1..200 ký tự)
  - `is_pinned`: `boolean` (Ghim lên đầu trang)
  - `created_at`, `updated_at`: ISO 8601 string
- **Optional fields:**
  - `content`: `string | null` (Nội dung chi tiết)
  - `author_id`: `string | null` (FK `users.id`, người đăng)
- **Role Access:**
  - GVCN: Tạo, sửa, xóa, ghim/bỏ ghim.
  - GVBM / Học sinh: Chỉ xem.

---

### 2.9. StudentNote (Ghi chú / Nhận xét học sinh)
- **ID:** `string`
- **Required fields:**
  - `student_id`: `string` (FK `students.id`)
  - `content`: `string` (Nội dung nhận xét sư phạm, 1..1000 ký tự)
  - `created_at`, `updated_at`: ISO 8601 string
- **Optional fields:**
  - `class_id`: `string` (FK `classes.id`)
  - `author_id`: `string | null` (FK `users.id`, giáo viên ghi chú)
- **Role Access:**
  - GVCN: Xem, tạo và xóa ghi chú cho học sinh lớp mình.
  - GVBM: Không có quyền xóa ghi chú của học sinh trừ khi được cấu hình mở rộng.

---

### 2.10. TimetableEntry (Thời khóa biểu lớp học)
Mô tả một tiết học cụ thể trong tuần của lớp học (Khung chuẩn 6 ngày x 5 tiết = 30 tiết/tuần).
- **ID:** `string` (e.g. `tt-c-6a1-d2-p1`)
- **Required fields:**
  - `class_id`: `string` (FK `classes.id`)
  - `day_of_week`: `number` (2..7: Thứ Hai đến Thứ Bảy)
  - `period`: `number` (1..5: Tiết 1 đến Tiết 5 buổi sáng)
  - `subject_id`: `string` (FK `subjects.id`)
  - `created_at`, `updated_at`: ISO 8601 string
- **Optional fields:**
  - `teacher_id`: `string | null` (FK `users.id`, giáo viên trực tiếp giảng dạy)
- **Ràng buộc toàn vẹn & Ngăn xung đột (Conflict Invariants):**
  - `UNIQUE(class_id, day_of_week, period)`: Mỗi lớp học tại cùng một ngày và cùng một tiết chỉ có tối đa 1 entry.
  - `UNIQUE(teacher_id, day_of_week, period)` WHERE `teacher_id IS NOT NULL`: Một giáo viên không được phép dạy 2 lớp khác nhau tại cùng một ngày và cùng một tiết trên toàn trường.
- **Role Access:**
  - `ADMIN` & `GVCN`: Xem, thêm, sửa, xóa, áp dụng mẫu chuẩn 30 tiết, sao chép TKB giữa các lớp (có kiểm tra xung đột tự động).
  - `GVBM`: Chỉ xem (Read-only view).

---

## 3. MIGRATION ROADMAP TỚI SUPABASE / POSTGRESQL

Khi chuyển đổi từ `LocalStore` sang Supabase thật trong tương lai, schema sẽ được thực thi theo các bước:

1. Tạo extension UUID: `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`
2. Tạo các bảng cơ sở: `subjects`, `classes`, `class_memberships`, `subject_assignments`.
3. Tạo bảng thời khóa biểu: `timetable_entries` với 2 constraint ràng buộc ngăn xung đột:
   - `CONSTRAINT uq_class_slot UNIQUE (class_id, day_of_week, period)`
   - `CONSTRAINT uq_teacher_slot UNIQUE (teacher_id, day_of_week, period)`
4. Cập nhật bảng `students` với unique constraint `UNIQUE(class_id, student_code)`.
5. Cập nhật bảng `attendance` với composite unique key: `(student_id, date, subject_id)`.
6. Tạo Trigger kiểm tra:
   - `trg_check_max_students`: Chặn thêm học sinh khi lớp đã đủ sĩ số.
   - `trg_check_teacher_grades_limit`: Chặn phân công giáo viên dạy quá 2 khối.
7. Thiết lập RLS Policies tương ứng với các checks trong `src/services/auth-guard.ts`.
