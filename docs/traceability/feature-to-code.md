# Feature-to-Code Traceability Matrix

This matrix maps every functional capability to its exact implementation files across the presentation, service, validation, persistence, and test layers.

| Feature Area | UI Route / Component | Context / Shell | Service Layer | Validation / Guard | Storage Key / DB Table | Vitest Test File |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication & Session** | `src/app/(auth)/login/page.tsx` | `src/contexts/auth-context.tsx` | `src/lib/auth.ts` (`AuthService`) | Status & Password check | `cm_auth_session` / `profiles` | `tests/rbac.test.ts` |
| **Contextual Class Switcher** | `src/components/shell/class-switcher.tsx` | `src/contexts/class-context.tsx` | `AuthService.getTeacherClassInfo` | Role check (`HOMEROOM` vs `SUBJECT`) | `cm_active_class_id` / `classes` | `tests/rbac.test.ts` |
| **Classroom Dashboard** | `src/app/(dashboard)/dashboard/page.tsx` | `src/components/shell/sidebar.tsx` | `TimetableService`, `LocalStore` | `AuthGuard.hasAccessToClass` | `cm_thcs_classes`, `cm_thcs_attendance` | `tests/timetable.test.ts` |
| **Single Student CRUD** | `src/app/(dashboard)/students/page.tsx` | `ClassContext` | `StudentService` | `studentSchema`, `AuthGuard.canEditStudent` | `cm_thcs_students` / `students` | `tests/rbac.test.ts`, `tests/student-import.test.ts` |
| **Bulk Student Excel Import** | `src/app/(dashboard)/students/page.tsx` | Preview Modal (`modal.tsx`) | `StudentService.importStudents` | Code uniqueness & `max_students <= 40` | `cm_thcs_students` / `students` | `tests/student-import.test.ts` |
| **Parent Contact Center** | `src/app/(dashboard)/students/[id]/page.tsx` | Contact Card & Notice Modal | `StudentService`, `NoteService` | `AuthGuard.canEditStudent` | `cm_thcs_students`, `cm_thcs_notes` | `tests/student-import.test.ts` |
| **Interactive Seating (Swap)** | `src/app/(dashboard)/seating/page.tsx` | Classroom Grid (4×5) | `SeatingService.swapSeats` | `AuthGuard.canManageSeating` | `cm_thcs_desks_map` / `seats` | `tests/seating.test.ts` |
| **Fisher-Yates Seating Shuffle**| `src/app/(dashboard)/seating/page.tsx` | Randomize Button | `SeatingService.randomizeSeating`| `AuthGuard.canManageSeating` | `cm_thcs_desks_map` / `seats` | `tests/seating.test.ts` |
| **Live Attendance on Seating** | `src/app/(dashboard)/seating/page.tsx` | Badge overlay on desks | `AttendanceService` | None (Overlay query) | `cm_thcs_attendance` / `attendance` | `tests/attendance.test.ts` |
| **A4 Seating Print View** | `src/app/(dashboard)/seating/page.tsx` | Print Layout (`@media print`) | Browser print engine | None | None | Manual print verification |
| **Smart Contextual Attendance** | `src/app/(dashboard)/attendance/page.tsx`| Period detect banner | `TimetableService.getCurrentSession` | Clock check vs timetable | `cm_thcs_timetable` / `timetable_entries` | `tests/attendance.test.ts` |
| **Attendance Batch Recording** | `src/app/(dashboard)/attendance/page.tsx`| 4-State Buttons | `AttendanceService.saveAttendanceBatch` | `AuthGuard.canManageAttendance` | `cm_thcs_attendance` / `attendance` | `tests/attendance.test.ts` |
| **Attendance Date Range History**| `src/app/(dashboard)/history/page.tsx` | Range Selector & Matrix | `AttendanceService.getAttendanceHistory` | `AuthGuard.canViewAttendance` | `cm_thcs_attendance` / `attendance` | `tests/attendance.test.ts` |
| **Timetable 2-Shift Grid** | `src/app/(dashboard)/timetable/page.tsx`| Shift Matrix / Day Tabs | `TimetableService.getTimetableForClass` | `AuthGuard.canViewTimetable` | `cm_thcs_timetable` / `timetable_entries` | `tests/timetable.test.ts` |
| **Timetable Slot Mutation** | `src/app/(dashboard)/timetable/page.tsx`| Slot Edit Dialog | `TimetableService.saveEntry` | `AuthGuard.canManageTimetable` (Admin) | `cm_thcs_timetable` / `timetable_entries` | `tests/timetable.test.ts` |
| **Cross-School Teacher Conflict**| `src/services/timetable.service.ts` | Conflict Warning Banner | `TimetableService.checkTeacherConflict` | Unique `(teacher, day, period)` | `cm_thcs_timetable` / `timetable_entries` | `tests/timetable.test.ts` |
| **Class-to-Class Timetable Copy**| `src/app/(dashboard)/timetable/page.tsx`| Copy Modal | `TimetableService.copyTimetable` | Rollback on teacher conflict | `cm_thcs_timetable` / `timetable_entries` | `tests/timetable.test.ts` |
| **Class Settings & Capacity** | `src/app/(dashboard)/settings/page.tsx` | Capacity Widget | `ClassService.updateClassSettings` | `classSettingsSchema`, `max <= 40` | `cm_thcs_classes` / `classes` | `tests/class-settings.test.ts` |
| **Teacher 2-Grade Limit Check**| `src/app/(admin)/admin/teachers/page.tsx`| Assignment Modal | `TeacherService.assignSubjectTeacher` | `TeacherService.checkGradeLimit` (Max 2) | `cm_thcs_subject_assignments` | `tests/teacher-validation.test.ts` |
| **Admin Executive Attendance** | `src/app/(admin)/admin/dashboard/page.tsx` | Overview KPI Cards & Alerts | `AdminReportService` | Admin Layout Guard | `cm_thcs_attendance`, `cm_thcs_students` | `tests/admin-report.test.ts` |
| **4-Sheet School Master Export**| `src/app/(admin)/admin/dashboard/page.tsx` | Export Button | `AdminReportService`, `exportSchoolComprehensiveReport` | Admin Layout Guard | Master aggregate | `tests/admin-report.test.ts` |
