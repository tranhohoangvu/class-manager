# Use Cases

## 1. System Actors

| Actor | Description | Identification in System |
| :--- | :--- | :--- |
| **Administrator (Admin)** | School leadership / Principal / Academic Officer. Has global access to all 16 classes, 24 teachers, school-wide timetable, and reports. | `UserRow.role === 'ADMIN'` |
| **Homeroom Teacher (GVCN)** | Class advisor responsible for student rosters, seating arrangements, class settings, and holistic discipline. | `ClassMembership.role === 'HOMEROOM_TEACHER'` |
| **Subject Teacher (GVBM)** | Specialized subject instructor (e.g., Mathematics, Literature). Restricted to viewing class rosters and recording attendance for their assigned subject. | `ClassMembership.role === 'SUBJECT_TEACHER'` |
| **Unassigned Staff** | Newly registered teacher with no class or subject assignments. | `UserRow.role === 'TEACHER'` with empty assignments |
| **Disabled User** | Inactive staff member whose access has been revoked. | `UserRow.status === 'disabled'` |

---

## 2. Core Use Cases

### UC-01: User Login & Role-Based Navigation
* **Primary Actor:** Any System Actor
* **Preconditions:** None
* **Main Success Scenario:**
  1. User navigates to `/login`.
  2. User enters credentials or clicks a 1-Click Demo persona button.
  3. `AuthService.login(email, password)` verifies credentials against `LocalStore.getUsers()`.
  4. System verifies that user status is `'active'`.
  5. System generates session token, saves `cm_auth_session` to `localStorage`.
  6. If `user.role === 'ADMIN'`, router redirects to `/admin/dashboard`.
  7. If `user.role === 'TEACHER'`, router redirects to `/dashboard`.
* **Extensions / Error Paths:**
  * **Account Disabled:** System rejects login with error *"Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên."*
  * **Invalid Credentials:** System displays error *"Email không tồn tại trong hệ thống"* or *"Mật khẩu không chính xác"*.
  * **Unassigned Teacher:** Router opens `/dashboard`, but `DashboardContent` renders the unassigned empty state banner requesting assignment from Admin.

---

### UC-02: Record Subject Attendance (Attendance-by-Exception)
* **Primary Actor:** Subject Teacher (GVBM) or Homeroom Teacher (GVCN)
* **Preconditions:** Teacher is authenticated and has selected a class where they teach.
* **Default State (Default-Present):** All students automatically default to `Có mặt` (Present) at the start of each day. No initialization clicks required.
* **Main Success Scenario:**
  1. Teacher navigates to `/attendance`.
  2. System detects the ongoing period via `TimetableService.getCurrentPeriodInfo()` and pre-selects the corresponding subject.
  3. All students appear as `Có mặt` by default. Teacher only updates exceptions (e.g., marks absent `✕ Vắng`, late `⏱ Muộn`, or excused `📋 Phép`).
  4. Teacher clicks **"Lưu điểm danh"**.
  5. `AttendanceService.saveAttendanceBatch` validates:
     - User is logged in and not disabled.
     - User is assigned to teach that subject in this class (`AuthGuard.canManageAttendance`).
     - Date format conforms to `YYYY-MM-DD`.
     - Student IDs belong to the active class.
  6. Records are committed to `LocalStore`.
  7. Toast displays *"Đã lưu điểm danh thành công"*.
* **Extensions / Error Paths:**
  * **Teacher Not Assigned to Subject:** `AuthGuard` rejects mutation with *"Bạn không được phân công giảng dạy môn học này tại lớp đã chọn."*
  * **Read-Only Homeroom Observation:** If GVCN views attendance for another teacher's subject, mutation controls are disabled.

---

### UC-02B: Admin Reset Attendance to 100% Present
* **Primary Actor:** Administrator (Admin) or Homeroom Teacher (for own class)
* **Preconditions:** User is logged in with Admin or GVCN privileges.
* **Main Success Scenario:**
  1. Admin navigates to `/admin/attendance` (Quản lý Chuyên cần) and clicks the red action button **"Đặt lại về Có mặt"**.
  2. Confirmation modal prompts for:
     - Target Date (default: today).
     - Target Scope (`Toàn bộ 16 lớp (480 học sinh)` or specific class).
  3. Admin confirms the reset action.
  4. `AttendanceService.resetAttendanceForDate` validates authority and date format.
  5. System removes all absence/late exceptions for that date and restores all students to `present`.
  6. UI re-renders with 100% attendance rate and a success notification appears.


---

### UC-03: Re-arrange Classroom Seating (Click-to-Swap)
* **Primary Actor:** Homeroom Teacher (GVCN) or Admin
* **Preconditions:** User has homeroom authority for the current class.
* **Main Success Scenario:**
  1. Teacher navigates to `/seating`.
  2. Teacher clicks on Seat A (desk number + side). The seat highlights with a blue ring and a helper banner appears: *"Đang chọn bàn X... Nhấp vào ghế khác để hoán đổi"*.
  3. Teacher clicks on Seat B.
  4. `SeatingService.swapSeats(seatAId, seatBId, classId, user)` verifies authority.
  5. The occupants of Seat A and Seat B are atomically swapped in `LocalStore`.
  6. UI updates with the new seating configuration.
* **Extensions / Error Paths:**
  * **Unauthorized Teacher (GVBM):** GVBM has a view-only mode; clicking seats does not initiate a swap.
  * **Same Seat Selected:** Action is canceled with *"Không thể hoán đổi cùng một vị trí"*.

---

### UC-04: Bulk Import Students via Excel
* **Primary Actor:** Homeroom Teacher (GVCN) or Admin
* **Preconditions:** User has homeroom authority.
* **Main Success Scenario:**
  1. Teacher navigates to `/students` and clicks **"Nhập từ Excel"**.
  2. Teacher uploads a `.xlsx` or `.csv` file.
  3. File is parsed via `xlsx` library into preview rows.
  4. Preview modal checks:
     - Header columns mapping.
     - Student code format and uniqueness within the file.
     - Student code uniqueness against existing students in the class.
     - Class capacity: `activeCount + importedCount <= class.max_students` (max 40).
  5. Teacher clicks **"Xác nhận nhập"**.
  6. `StudentService.importStudents` performs batch creation.
  7. Roster table refreshes, showing newly imported students.
* **Extensions / Error Paths:**
  * **Capacity Exceeded:** Modal prevents submission and warns *"Không thể nhập X học sinh. Lớp hiện có Y/40 học sinh (chỉ còn Z chỗ)."*
  * **Duplicate Student Code:** System displays the specific duplicate code and line number.

---

### UC-05: Configure Timetable & Enforce Conflict Invariants
* **Primary Actor:** Administrator (Admin)
* **Preconditions:** User is logged in as `ADMIN`.
* **Main Success Scenario:**
  1. Admin navigates to `/timetable` (or opens `/timetable` for a specific class).
  2. Admin clicks on an empty or existing period slot (e.g., Thứ Ba, Tiết 2).
  3. Modal opens allowing selection of Subject and Teacher.
  4. Admin selects Môn Toán and Thầy Nguyễn Văn An, then clicks **"Lưu tiết học"**.
  5. `TimetableService.saveEntry` runs validation:
     - Admin authority confirmed.
     - Day of week (2–7) and Period (1–10) validity.
     - Grade shift compatibility (Khối 6 & 9: Morning P1–P5; Khối 7 & 8: Afternoon P6–P10).
     - Saturday period constraints (P1–P3 Morning; P6–P8 Afternoon).
     - Homeroom slot constraint (Saturday P3 for Morning, P8 for Afternoon must be Sinh hoạt lớp).
     - **Class conflict check:** No other subject in the same class at that day/period.
     - **Teacher conflict check:** Teacher is not booked in another class anywhere in the school at that day/period.
  6. Entry is committed to `LocalStore`.
* **Extensions / Error Paths:**
  * **Teacher Conflict Detected:** System rejects save with *"Không thể xếp tiết học này. Giáo viên [Tên] đã được xếp dạy lớp [Lớp khác] (môn [Môn]) vào Thứ [X], Tiết [Y]."*
  * **Teacher (Non-Admin) Attempts Edit:** Edit modal is blocked; timetable renders in read-only mode with a badge *"Chế độ chỉ xem"*.

---

### UC-06: Export School Comprehensive Report (4 Sheets)
* **Primary Actor:** Administrator (Admin)
* **Preconditions:** Admin is on `/admin/dashboard`.
* **Main Success Scenario:**
  1. Admin clicks **"Xuất báo cáo trường (.xlsx)"** on the top action bar.
  2. `AdminReportService.generateSchoolReportWorkbookData()` gathers school data:
     - Sheet 1: 16 Classes Summary (Room, GVCN, Capacity, Status).
     - Sheet 2: 24 Teachers Directory (Assignments, Contact, Status).
     - Sheet 3: School-Wide Monthly Attendance Matrix.
     - Sheet 4: Complete Timetable Master Grid (all 16 classes).
  3. `exportSchoolComprehensiveReport` converts data into a binary workbook via `xlsx`.
  4. Browser triggers download of `Bao_cao_tong_hop_THCS_Nguyen_Tat_Thanh_2026_2027.xlsx`.
  5. Toast confirms successful export.
