# Sequence Diagrams

This document collects the authoritative sequence diagrams for the primary business flows of the application.

---

## 1. Authentication & Session Bootstrap

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Page as /login Page
    participant AuthCtx as AuthContext
    participant AuthSvc as AuthService
    participant Store as LocalStore
    participant Router as Next.js Router

    User->>Page: Select Demo Persona (or enter credentials)
    Page->>AuthCtx: login(email, password)
    AuthCtx->>AuthSvc: login(email, password)
    AuthSvc->>Store: getUsers()
    Store-->>AuthSvc: UserRow[]

    AuthSvc->>AuthSvc: Check email, password, and status !== 'disabled'
    AuthSvc->>AuthSvc: Build AuthSession & write to localStorage('cm_auth_session')
    AuthSvc-->>AuthCtx: { success: true, user }
    AuthCtx->>AuthCtx: setUser(user)

    alt user.role === 'ADMIN'
        AuthCtx->>Router: router.push('/admin/dashboard')
    else user.role === 'TEACHER'
        AuthCtx->>Router: router.push('/dashboard')
    end
```

---

## 2. Attendance Recording with Pedagogical RBAC

```mermaid
sequenceDiagram
    autonumber
    actor Teacher
    participant UI as Attendance Page (/attendance)
    participant TimetableSvc as TimetableService
    participant AttSvc as AttendanceService
    participant Guard as AuthGuard
    participant Store as LocalStore

    Teacher->>UI: Open /attendance
    UI->>TimetableSvc: getCurrentSession(currentClassId, now)
    TimetableSvc-->>UI: { entry, subject, teacher }
    Note over UI: UI pre-selects active period's subject

    Teacher->>UI: Select statuses & click "Lưu điểm danh"
    UI->>AttSvc: saveAttendanceBatch(dateStr, entries, classId, subjectId, user)
    AttSvc->>Guard: canManageAttendance(user, classId, subjectId)

    alt Teacher Not Assigned to this Subject
        Guard-->>AttSvc: false
        AttSvc-->>UI: { success: false, error: "Bạn không được phân công giảng dạy..." }
        UI->>Teacher: Display error toast
    else Authorized
        Guard-->>AttSvc: true
        AttSvc->>AttSvc: Validate date format & student IDs
        AttSvc->>Store: saveAttendanceBatch(dateStr, entries, classId, subjectId, teacherId)
        Store-->>AttSvc: void
        AttSvc-->>UI: { success: true }
        UI->>Teacher: Display success toast ("Đã lưu điểm danh thành công")
    end
```

---

## 3. Seating Chart Click-to-Swap & Fisher-Yates Shuffle

```mermaid
sequenceDiagram
    autonumber
    actor GVCN as Homeroom Teacher
    participant UI as Seating Page (/seating)
    participant SeatingSvc as SeatingService
    participant Guard as AuthGuard
    participant Store as LocalStore

    alt Click-to-Swap
        GVCN->>UI: Click Seat A (Desk 1, Left)
        UI->>UI: Set activeSeatId = seatA
        GVCN->>UI: Click Seat B (Desk 4, Right)
        UI->>SeatingSvc: swapSeats(seatAId, seatBId, classId, user)
        SeatingSvc->>Guard: canManageSeating(user, classId)
        Guard-->>SeatingSvc: true
        SeatingSvc->>Store: swapSeats(seatAId, seatBId, classId)
        Store-->>SeatingSvc: DeskWithSeats[]
        SeatingSvc-->>UI: { success: true, data: updatedDesks }
        UI->>GVCN: Refresh layout, clear selection ring
    else Randomize Seating
        GVCN->>UI: Click [⚡ Xáo trộn ngẫu nhiên]
        UI->>SeatingSvc: randomizeSeating(classId, user)
        SeatingSvc->>Guard: canManageSeating(user, classId)
        Guard-->>SeatingSvc: true
        SeatingSvc->>Store: randomizeSeating(classId)
        Note over Store: Runs Fisher-Yates uniform shuffle on active students
        Store-->>SeatingSvc: DeskWithSeats[]
        SeatingSvc-->>UI: { success: true, data: updatedDesks }
        UI->>GVCN: Refresh layout
    end
```

---

## 4. Timetable Slot Creation & School-Wide Conflict Engine

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant UI as Timetable Page (/timetable)
    participant TimetableSvc as TimetableService
    participant Guard as AuthGuard
    participant Store as LocalStore

    Admin->>UI: Click Period Slot (Thứ Tư, Tiết 3)
    Admin->>UI: Select Subject (Hóa học) & Teacher (Cô Lê Thị C)
    Admin->>UI: Click "Lưu tiết học"

    UI->>TimetableSvc: saveEntry(classId, day, period, subjectId, teacherId, user)
    TimetableSvc->>Guard: canManageTimetable(user, classId)
    Guard-->>TimetableSvc: true (Only ADMIN allowed)

    TimetableSvc->>TimetableSvc: checkClassConflict(classId, day, period)
    TimetableSvc->>TimetableSvc: checkTeacherConflict(teacherId, day, period)

    alt Teacher Conflict: Teacher teaches another class at this period
        TimetableSvc-->>UI: { success: false, error: "Giáo viên X đã được xếp dạy lớp Y..." }
        UI->>Admin: Show conflict warning banner in modal
    else No Conflicts
        TimetableSvc->>Store: saveTimetableEntry(entry)
        Store-->>TimetableSvc: TimetableEntryRow
        TimetableSvc-->>UI: { success: true, data: entry }
        UI->>Admin: Close modal, refresh grid
    end
```

---

## 5. Bulk Student Excel Import

```mermaid
sequenceDiagram
    autonumber
    actor GVCN as Homeroom Teacher
    participant UI as Students Page (/students)
    participant StudentSvc as StudentService
    participant Guard as AuthGuard
    participant Store as LocalStore

    GVCN->>UI: Upload roster spreadsheet (.xlsx)
    UI->>UI: Parse binary file with SheetJS
    UI->>UI: Open Preview Modal (Checks codes, format)

    GVCN->>UI: Click "Xác nhận nhập"
    UI->>StudentSvc: importStudents(classId, studentsData, user)
    StudentSvc->>Guard: canEditStudent(user, classId)
    Guard-->>StudentSvc: true

    StudentSvc->>StudentSvc: Verify unique codes in file & existing roster
    StudentSvc->>StudentSvc: Check capacity (activeCount + count <= max_students)

    alt Capacity Exceeded (> 40)
        StudentSvc-->>UI: { success: false, error: "Lớp hiện có X/40 học sinh..." }
        UI->>GVCN: Display capacity error
    else Verification Successful
        StudentSvc->>Store: addStudentsBatch(normalizedData, classId)
        Store-->>StudentSvc: StudentRow[]
        StudentSvc-->>UI: { success: true, data: { count, imported } }
        UI->>GVCN: Close modal, refresh roster table
    end
```

---

## 6. Admin School-Wide 4-Sheet Report Export

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant UI as Admin Dashboard (/admin/dashboard)
    participant ReportSvc as AdminReportService
    participant ExportLib as Export Engine (lib/export.ts)
    participant Store as LocalStore

    Admin->>UI: Click "Xuất báo cáo trường (.xlsx)"
    UI->>ReportSvc: generateSchoolReportWorkbookData()
    ReportSvc->>Store: Aggregate classes, faculty, monthly attendance, master timetables
    ReportSvc-->>UI: SchoolReportWorkbookData
    UI->>ExportLib: exportSchoolComprehensiveReport(workbookData)
    Note over ExportLib: Constructs 4 sheets: 16 Lớp học, Đội ngũ GV, Chuyên cần, TKB
    ExportLib->>Admin: Browser triggers download: Bao_cao_tong_hop_THCS_...xlsx
    UI->>Admin: Show success toast
```
