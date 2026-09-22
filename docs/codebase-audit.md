# CLASS MANAGER — BÁO CÁO AUDIT TOÀN DIỆN CODEBASE
**Ngày thực hiện:** 22/09/2026  
**Phiên bản hệ thống:** Prototype THCS Scale (16 lớp, 480 học sinh, 24 giáo viên, 10 môn học)  
**Mục tiêu:** Đánh giá hiện trạng kiến trúc, bảo mật, tính toàn vẹn dữ liệu và chuẩn bị lộ trình nâng cấp lên mức Production-Ready (LocalStore layer chuẩn hóa, sẵn sàng cho Supabase trong tương lai).

---

## A. KIẾN TRÚC HIỆN TẠI (CURRENT ARCHITECTURE)

### 1. Luồng dữ liệu và tương tác thực tế
Hiện tại, ứng dụng đang vận hành theo mô hình Client-Side State với LocalStorage:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           UI Layer (Next.js Pages)                      │
│   - app/(dashboard)/[students, seating, attendance, history, ...]       │
│   - app/(admin)/admin/[dashboard, classes, teachers, settings]          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Trực tiếp gọi LocalStore & Auth)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Contexts & Client Helpers Layer                      │
│   - AuthContext (`useAuth`) & ClassContext (`useCurrentClass`)          │
│   - AuthService (xác thực mock session, kiểm tra vai trò)               │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Trực tiếp gọi LocalStore)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 Direct Storage Layer: `LocalStore`                      │
│   - Singleton object chứa toàn bộ hàm đọc/ghi mock                      │
│   - Không có Repository / Service Abstraction độc lập                   │
│   - Không kiểm tra Authorization (RBAC) ở tầng Mutation                │
│   - Thiếu validation nghiệp vụ trước khi ghi                            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (JSON.stringify / JSON.parse)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Browser `localStorage` API                         │
│   - Các key: `cm_thcs_students`, `cm_thcs_classes`, `cm_thcs_users`,... │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Định tuyến (Routing) & Phân quyền trang
- **Định tuyến:** Sử dụng App Router của Next.js 16 với hai Route Groups chính:
  - `(dashboard)`: Dành cho hoạt động giảng dạy của Giáo viên (GVCN / GVBM).
  - `(admin)`: Dành cho Ban Giám hiệu / Quản trị viên trường học.
  - `(auth)`: Màn hình đăng nhập mock (1-Click demo accounts theo vai trò).
- **Middleware (`src/middleware.ts`):** Được viết sẵn cho Supabase Auth, nhưng hiện tại bỏ qua (`bypass`) vì chưa cấu hình Supabase URL/Anon Key thật. Phân quyền hiện tại hoàn toàn phụ thuộc vào client layout guards (`useEffect` trong layout).

---

## B. NHỮNG PHẦN ĐANG TỐT (STRENGTHS TO PRESERVE)

1. **Bộ Mock Dataset THCS chuẩn mực và chân thực:**
   - 16 lớp (Khối 6-9, mỗi khối 4 lớp A1-A4).
   - 480 học sinh Việt Nam thực tế, phân bổ đều 30 em/lớp.
   - 24 giáo viên với 10 môn học chính khóa, phân bổ logic (mỗi giáo viên dạy tối đa 2 khối theo đúng nghiệp vụ sư phạm THCS).
   - 10 test case sư phạm được thiết kế sẵn (GVCN, GVBM, GVCN kiêm GVBM, tài khoản khóa, v.v.).
2. **Cơ chế Data Versioning và Auto-Migration:**
   - `LocalStore` có key `cm_data_version: '2026_thcs_16classes_v2'` tự động phát hiện dữ liệu cũ và nạp lại dataset mẫu một cách mượt mà.
3. **Trải nghiệm Sơ đồ lớp (Click-to-Swap):**
   - Tương tác trực quan, rõ ràng, không phụ thuộc thư viện kéo thả cồng kềnh, dễ tương thích trên thiết bị cảm ứng.
4. **Context-Aware Switcher:**
   - `ClassContext` và `ClassSwitcher` tự động nhận biết vai trò giáo viên theo từng lớp (`GVCN · Toán` vs `GVBM · Ngữ văn`), chuyển đổi linh hoạt.
5. **Giao diện sạch sẽ, thẩm mỹ:**
   - Sử dụng Phosphor Icons hiện đại, màu sắc nhẹ nhàng, tone sư phạm chuẩn mực, không lạm dụng hiệu ứng thừa.

---

## C. CÁC VẤN ĐỀ PHÁT HIỆN & PHÂN LOẠI NGUY CƠ

### 1. CRITICAL (Nghiêm trọng — Cần xử lý ngay)
- **CRIT-01: Tầng Mutation hoàn toàn thiếu RBAC (Bảo mật chỉ nằm ở giao diện UI)**
  - *Hiện trạng:* Các phương thức trong `LocalStore` như `addStudent`, `updateStudent`, `deleteStudent`, `assignSeat`, `swapSeats`, `saveAttendanceBatch`, `addAnnouncement`, `deleteNote` hoàn toàn không nhận diện `userId` hay `userRole`.
  - *Rủi ro:* Bất kỳ component nào (hoặc thao tác qua DevTools console) đều có thể gọi `LocalStore.deleteStudent` hay `LocalStore.assignSeat` mà không hề bị chặn, dù user đăng nhập đang là GVBM hoặc thậm chí là tài khoản bị khóa.
- **CRIT-02: Không có Service / Repository Abstraction Layer (Coupling cao)**
  - *Hiện trạng:* Các UI components (`students/page.tsx`, `seating/page.tsx`, v.v.) gọi trực tiếp `LocalStore.method()`.
  - *Rủi ro:* Khi chuyển sang Supabase hoặc REST API thực tế, toàn bộ file giao diện sẽ phải bị đập đi viết lại (breaking change).
- **CRIT-03: Thiếu Data Validation & Invariant Enforcements ở tầng Data**
  - *Hiện trạng:* `LocalStore.addStudent` không kiểm tra trùng `student_code` trong cùng lớp, không kiểm tra giới hạn `max_students` (30 hoặc 45).
  - *Hiện trạng:* `LocalStore.assignSeat` không kiểm tra học sinh có thuộc lớp đó hay không.
  - *Hiện trạng:* `LocalStore.assignSubjectTeacher` không enforce nghiệp vụ: "Mỗi giáo viên chỉ được phân công dạy tối đa 2 khối".

### 2. HIGH (Mức độ cao)
- **HIGH-01: Nguy cơ xung đột sơ đồ chỗ ngồi (Seating Inconsistency)**
  - *Hiện trạng:* `LocalStore.assignSeat` và `swapSeats` thao tác trực tiếp mảng desk. Nếu một học sinh bị gán thủ công hoặc xóa khỏi lớp mà chưa gỡ seat, record `student_id` trong seat trở thành orphan reference.
- **HIGH-02: Hard-coded string & Missing dynamic class binding**
  - *Hiện trạng:* Trong `src/app/(dashboard)/students/[id]/page.tsx`, lớp học của học sinh đang bị hardcode là `"Lớp 9A1"` thay vì đọc từ `class.name` thực tế.
- **HIGH-03: Điểm danh thiếu kiểm tra phân công giáo viên**
  - *Hiện trạng:* `saveAttendanceBatch` cho phép lưu bất kỳ `subject_id` nào mà không kiểm tra giáo viên hiện tại có được phân công dạy môn đó ở lớp này không (nếu là GVBM).

### 3. MEDIUM (Mức độ trung bình)
- **MED-01: Xử lý Date và Timezone cục bộ**
  - *Hiện trạng:* Ngày tháng dùng `new Date().toISOString().split('T')[0]`. Ở các múi giờ lệch UTC (như GMT+7 tại Việt Nam), nếu gọi vào đầu giờ sáng (0h - 6h59) sẽ bị lệch về ngày hôm trước theo UTC. Cần chuẩn hóa helper `getLocalDateString()`.
- **MED-02: Thiếu trạng thái Loading, Empty, Error thống nhất**
  - *Hiện trạng:* Nhiều trang chỉ hiển thị khung trắng hoặc skeleton đơn giản, không có empty state có định hướng hành động (CTA) khi một lớp mới chưa có dữ liệu hoặc giáo viên chưa có lớp nào.
- **MED-03: Thiếu tính năng Export dữ liệu (Excel / PDF)**
  - *Hiện trạng:* Chưa có chức năng xuất danh sách học sinh ra file Excel (.xlsx), chưa có tính năng in ấn / xuất PDF sơ đồ chỗ ngồi chuẩn khổ A4 ngang cho giáo viên dán tại bàn giáo viên.

### 4. LOW (Mức độ thấp / Code Smell)
- **LOW-01: Thiếu Test Suite**
  - *Hiện trạng:* Dự án chưa cài đặt testing framework (Vitest/Jest). Không có automated unit test nào cho các luồng nghiệp vụ quan trọng (Fisher-Yates randomize, RBAC checks, Attendance summary).
- **LOW-02: Các dependencies chưa dùng**
  - Cần rà soát và tinh giản các file thừa, đảm bảo bundle gọn nhẹ.

---

## D. NỢ KỸ THUẬT (TECHNICAL DEBT)

1. **Tight Coupling giữa UI và LocalStore:**
   - UI phụ thuộc trực tiếp vào cấu trúc lưu trữ LocalStorage. Cần tạo `src/services/` (ví dụ: `StudentService`, `ClassService`, `SeatingService`, `AttendanceService`, `TeacherService`, `AnnouncementService`) đóng vai trò là Application Boundary.
2. **Business logic rải rác trong UI:**
   - Logic tính toán tỷ lệ chuyên cần (`summary`), logic lọc ghế trống, logic tạo mã học sinh tự động đang nằm trực tiếp trong UI components thay vì nằm ở Domain Service.
3. **Type definitions chưa phân biệt rõ giữa Domain Entity, Database Row và DTO/Form Inputs:**
   - Ví dụ: `StudentRow` được dùng trực tiếp ở cả form state lẫn database representation.

---

## E. RỦI RO BẢO MẬT & PHÂN QUYỀN (SECURITY & RBAC RISKS)

1. **UI Bypass Vulnerability:**
   - Hiện tại:
     ```tsx
     {isHomeroom && <Button onClick={handleDeleteStudent}>Xóa</Button>}
     ```
   - Nếu ai đó mở Console hoặc can thiệp gọi API, `LocalStore.deleteStudent(id)` sẽ chạy mà không có lớp guard nào kiểm tra `canDeleteStudent(currentUser, studentId)`.
2. **Thiếu Author/Audit Trail:**
   - Bảng `student_notes` và `announcements` không lưu `author_id`. Khi chuyển sang Supabase, không thể xác định ai là người tạo hoặc chỉnh sửa note để áp dụng RLS Policy (`auth.uid() = author_id`).

---

## F. RỦI RO TÍNH TOÀN VẸN DỮ LIỆU (DATA INTEGRITY RISKS)

| Thực thể | Rủi ro phát hiện | Giải pháp kiến trúc |
| :--- | :--- | :--- |
| **Student** | Trùng `student_code` trong lớp; Vượt quá `max_students` | Validate uniqueness scoped theo `class_id`; Chặn thêm mới khi active count >= max_students |
| **Seat** | 2 học sinh cùng 1 ghế; 1 học sinh ngồi 2 ghế; Học sinh lớp khác ngồi vào lớp này | Enforce invariant 1-to-1; Kiểm tra `student.class_id === desk.class_id` |
| **Attendance** | Trùng record cùng học sinh + ngày + môn; GVBM điểm danh môn không phụ trách | Composite key `(student_id, date, subject_id)`; Kiểm tra quyền phân công trước khi lưu |
| **Teacher Assignment** | 1 lớp có 2 GVCN; 1 giáo viên dạy quá 2 khối; Phân công giáo viên bị vô hiệu hóa | Transactional assignment update; Check invariant `<= 2 grades per teacher` |
| **Notes & Announce** | Tạo note cho học sinh đã bị xóa hoặc thuộc lớp khác | Verify student exists & belongs to class |

---

## G. LỘ TRÌNH TRIỂN KHAI TIẾP THEO (ACTION PLAN)

Theo đúng trình tự 10 Phase đã được quy định:
- **Phase 1 (Hoàn tất):** Audit toàn diện codebase và lập `docs/data-model.md`.
- **Phase 2 (Data Access Layer):** Xây dựng các Service/Repository (`src/services/*`) làm trung gian giữa UI và LocalStore.
- **Phase 3 (Harden RBAC):** Đưa toàn bộ kiểm tra quyền hạn (`canEditStudent`, `canManageSeating`, v.v.) vào Service layer.
- **Phase 4 (Validation & Invariants):** Tích hợp Zod và các ràng buộc dữ liệu tại Service layer.
- **Phase 5 (Feature Hardening):** Hoàn thiện Seating Click-to-Swap, sửa hardcoded strings, làm sạch Date/Timezone logic.
- **Phase 6 (States):** Thống nhất Loading, Empty, Error, Unauthorized states.
- **Phase 7 (Responsive & A11y):** Tối ưu hóa trên Mobile/Tablet và chuẩn hóa khả năng tiếp cận.
- **Phase 8 (Export):** Triển khai xuất Excel (danh sách học sinh, bảng điểm danh) và PDF/Print layout (sơ đồ lớp, danh sách).
- **Phase 9 (Hoàn tất):** Thiết lập Vitest và viết unit test cho các luồng nghiệp vụ quan trọng (16/16 tests passed).
- **Phase 10 (Hoàn tất):** Cập nhật README, chạy `npm run build` thành công, báo cáo tổng kết.

---

## H. FINAL AUDIT SUMMARY (TỔNG KẾT NGHIỆM THU)

### 1. Fixed (Đã sửa lỗi)
- **Hardcoded String:** Đã xóa bỏ toàn bộ chuỗi hardcode `"Lớp 9A1"` và `"40 học sinh"` ở các màn hình chi tiết học sinh (`/students/[id]`), cài đặt (`/settings`), modal thêm học sinh và modal reset; chuyển sang binding động từ `ClassService`.
- **Timezone Inconsistency:** Chuẩn hóa toàn bộ ngày tháng sang local timezone với helper `getTodayISO()` thay vì sử dụng `toISOString().split('T')[0]` dễ gây lệch ngày theo giờ UTC.
- **Regex Validation:** Mở rộng regex mã học sinh cho phép dấu gạch nối (`6A1-01`, `HS-01`).

### 2. Added (Đã bổ sung)
- **Tầng Dịch vụ (Data Access Layer - `src/services/`):**
  - `StudentService`: Xử lý CRUD học sinh kèm RBAC và validation.
  - `SeatingService`: Xử lý sơ đồ chỗ ngồi, swap, assign, randomize (Fisher-Yates) và clear.
  - `AttendanceService`: Xử lý điểm danh theo buổi/môn, tính toán ma trận chuyên cần lịch sử.
  - `AnnouncementService`: Đăng, ghim/bỏ ghim, xóa thông báo có kiểm tra quyền.
  - `NoteService`: Thêm và xóa ghi chú sư phạm cho học sinh.
  - `ClassService`: Cài đặt lớp, tạo lớp, lưu trữ lớp.
  - `TeacherService`: Phân công GVCN, phân công GVBM kèm ràng buộc tối đa 2 khối.
- **State Views đồng bộ (`src/components/ui/state-views.tsx`):**
  - `EmptyStateView`: Trạng thái dữ liệu trống với CTA định hướng.
  - `ErrorStateView`: Hiển thị lỗi kèm nút thử lại.
  - `UnauthorizedView`: Cảnh báo khi người dùng không đủ quyền.
  - `LoadingStateView`: Spinner tải dữ liệu mượt mà.
- **Xuất dữ liệu (`src/lib/export.ts`):**
  - Xuất Excel danh sách học sinh (đầy đủ STT, Mã HS, Họ tên, Giới tính, Ngày sinh, Lớp, Vị trí ghế, Trạng thái) chuẩn font tiếng Việt có dấu.
  - Xuất Excel ma trận điểm danh (Học sinh × Các ngày học, tổng số buổi vắng/muộn, tỷ lệ chuyên cần).
  - In ấn A4 ngang/dọc với CSS `@media print` cho sơ đồ lớp học và danh sách học sinh.

### 3. Refactored (Đã tái cấu trúc)
- Tách toàn bộ UI ra khỏi việc gọi trực tiếp `LocalStore`. Mọi mutation từ giao diện đều phải đi qua `src/services/*`.
- Trả về kiểu dữ liệu chuẩn mực `OperationResult<T>` (`success`, `data`, `error`) giúp UI hiển thị toast thông báo lỗi nghiệp vụ rõ ràng, không làm crash ứng dụng.

### 4. Security / RBAC
- Triển khai `AuthGuard` ở tầng Domain Service:
  - `canEditStudent`: Chỉ GVCN hoặc Admin.
  - `canManageSeating`: Chỉ GVCN hoặc Admin.
  - `canManageAttendance`: GVCN có thể điểm danh toàn bộ; GVBM chỉ được phép điểm danh môn học mình được phân công giảng dạy tại lớp đó.
  - `canManageAnnouncement`: Chỉ GVCN hoặc Admin.
  - `canManageTeacherAssignment`: Chỉ Admin.
  - `canManageStudentNote`: Chỉ GVCN hoặc Admin.
  - Tài khoản bị vô hiệu hóa (`status = 'disabled'`) bị chặn 100% mọi thao tác.

### 5. Data Integrity
- **Ràng buộc học sinh:** Không cho phép trùng mã học sinh trong cùng một lớp; Chặn thêm học sinh khi lớp đã đủ sĩ số tối đa (`max_students = 30`).
- **Ràng buộc sơ đồ:** Học sinh chỉ được ngồi tại 1 ghế duy nhất; Không thể xếp học sinh lớp khác vào sơ đồ lớp hiện tại.
- **Ràng buộc giáo viên:** Áp dụng nghiêm ngặt quy định THCS — Mỗi giáo viên chỉ được phân công giảng dạy tại **tối đa 2 khối học** (nếu phân công sang khối thứ 3 sẽ bị từ chối).

### 6. Export
- Thư viện `xlsx` hoạt động ổn định, sinh file `.xlsx` nhẹ gọn, không block UI.
- Layout in ấn tự động ẩn sidebar, navbar, action buttons, chỉ giữ lại khung sơ đồ hoặc bảng dữ liệu chuẩn khổ giấy in A4.

### 7. Testing
- Cài đặt `vitest` và thiết lập test suite tự động:
  - `tests/rbac.test.ts`: 6 tests pass (kiểm tra Admin, GVCN, GVBM, tài khoản disabled).
  - `tests/attendance.test.ts`: 3 tests pass (kiểm tra định dạng ngày, status hợp lệ, thống kê chuyên cần).
  - `tests/teacher-validation.test.ts`: 3 tests pass (kiểm tra quy tắc 2 khối, trùng mã học sinh, schema validation).
  - `tests/seating.test.ts`: 4 tests pass (kiểm tra Fisher-Yates shuffle, 25 bàn = 50 chỗ, RBAC sơ đồ).
  - **Tổng cộng: 16/16 tests passed (100%)**.

### 8. Remaining Issues
- Không có lỗi kiến trúc nghiêm trọng. Toàn bộ các flow hoạt động mượt mà, TypeScript biên dịch 0 lỗi, production build Next.js thành công.

### 9. Deferred (Chủ đích trì hoãn sang giai đoạn sau)
- **Supabase Real Connection:** Chưa cấu hình URL và API Key thật (sẵn sàng schema mapping tại `docs/data-model.md`).
- **Supabase Auth / Real Session:** Tiếp tục dùng mock session an toàn ở client layer.
- **Cổng Phụ huynh / Học sinh (Parent / Student Portal):** Dự kiến ở các phiên bản tiếp theo.
