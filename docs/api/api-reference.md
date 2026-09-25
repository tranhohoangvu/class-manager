# REST API Reference (Express Backend)

## 1. Overview & Base URL

The **SchoolOps REST API** is an Express + TypeScript service deployed on Render Web Service and proxied locally through Next.js at `/api/*`.

* **Local Base URL**: `http://localhost:4000/api`
* **Production Base URL**: `https://<render-service-url>/api`
* **Health Check**: `GET /health`
* **Response Format**: Standard JSON `{ data: ... }` for success and `{ error: { code, message } }` for errors.
* **Authentication**: Credentials via HTTP-only cookie `token` or header `Authorization: Bearer <token>`.

---

## 2. API Endpoints Catalog

### 2.1. Authentication (`/api/auth`)

#### `POST /api/auth/login`
* **Description**: Authenticate with email and password. Sets HTTP-only session cookie.
* **Auth**: None (Public)
* **Request Body**:
  ```json
  {
    "email": "an.nguyen@schoolops.local",
    "password": "teacher1"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "data": {
      "user": {
        "id": "u-tea-01",
        "name": "Thầy Nguyễn Văn An",
        "email": "an.nguyen@schoolops.local",
        "phone": "0912345601",
        "role": "TEACHER",
        "status": "active"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
* **Errors**: `400 Bad Request` (validation error), `401 Unauthorized` (invalid credentials or disabled account).

#### `POST /api/auth/logout`
* **Description**: Clears the session cookie.
* **Auth**: None
* **Success Response (200 OK)**:
  ```json
  {
    "data": {
      "message": "Đăng xuất thành công."
    }
  }
  ```

#### `GET /api/auth/me`
* **Description**: Returns the active authenticated user profile.
* **Auth**: Required (`Bearer` or cookie)
* **Success Response (200 OK)**:
  ```json
  {
    "data": {
      "user": { ... }
    }
  }
  ```

---

### 2.2. Classes (`/api/classes`)

#### `GET /api/classes`
* **Description**: Retrieves classes accessible to the current user (all classes for ADMIN, assigned classes for TEACHER).
* **Auth**: Required

#### `GET /api/classes/:id`
* **Description**: Retrieves a single class by ID.
* **Auth**: Required (Class access or ADMIN)

#### `POST /api/classes`
* **Description**: Creates a new class, auto-generating 20 desks and 40 seats.
* **Auth**: Required (`ADMIN` only)
* **Request Body**:
  ```json
  {
    "name": "Lớp 6A5",
    "grade": 6,
    "room_name": "Phòng 105 — Nhà A",
    "school_year": "2026 - 2027",
    "teacher_id": "u-tea-01",
    "max_students": 40
  }
  ```

#### `PATCH /api/classes/:id`
* **Description**: Updates class settings (name, room name, capacity).
* **Auth**: Required (`HOMEROOM_TEACHER` or `ADMIN`)

#### `POST /api/classes/:id/archive`
* **Description**: Archives a class.
* **Auth**: Required (`ADMIN` only)

---

### 2.3. Students (`/api/classes/:classId/students` & `/api/students`)

#### `GET /api/classes/:classId/students`
* **Description**: Lists all students enrolled in a class.
* **Auth**: Required (Class access)

#### `POST /api/classes/:classId/students`
* **Description**: Enrolls a student in a class.
* **Auth**: Required (`HOMEROOM_TEACHER` or `ADMIN`)
* **Request Body**:
  ```json
  {
    "student_code": "HS041",
    "full_name": "Nguyễn Hoàng Nam",
    "gender": "male",
    "date_of_birth": "2015-05-12",
    "phone": "0987654321",
    "email": "nam.nh@student.local"
  }
  ```

#### `POST /api/classes/:classId/students/import`
* **Description**: Bulk imports students with capacity checks.
* **Auth**: Required (`HOMEROOM_TEACHER` or `ADMIN`)

#### `PATCH /api/students/:id`
* **Description**: Updates student information.
* **Auth**: Required (`HOMEROOM_TEACHER` or `ADMIN`)

#### `DELETE /api/students/:id`
* **Description**: Removes student from class and clears occupied seat.
* **Auth**: Required (`HOMEROOM_TEACHER` or `ADMIN`)

---

### 2.4. Seating (`/api/classes/:classId/seating`)

#### `GET /api/classes/:classId/seating`
* **Description**: Retrieves the standardized 20-desk classroom layout with seated student details.
* **Auth**: Required (Class access)

#### `POST /api/classes/:classId/seating/assign`
* **Description**: Assigns or unassigns a student to a seat.
* **Auth**: Required (`HOMEROOM_TEACHER` or `ADMIN`)
* **Request Body**: `{ "seat_id": "...", "student_id": "..." }`

#### `POST /api/classes/:classId/seating/swap`
* **Description**: Atomically swaps two seats.
* **Auth**: Required (`HOMEROOM_TEACHER` or `ADMIN`)
* **Request Body**: `{ "seat_id_1": "...", "seat_id_2": "..." }`

#### `POST /api/classes/:classId/seating/randomize`
* **Description**: Performs a uniform Fisher-Yates shuffle of active students into seats.
* **Auth**: Required (`HOMEROOM_TEACHER` or `ADMIN`)

#### `POST /api/classes/:classId/seating/clear`
* **Description**: Clears all seat assignments.
* **Auth**: Required (`HOMEROOM_TEACHER` or `ADMIN`)

---

### 2.5. Attendance (`/api/classes/:classId/attendance`)

#### `GET /api/classes/:classId/attendance?date=YYYY-MM-DD&subject_id=...`
* **Description**: Retrieves daily attendance status per student for the specified subject.
* **Auth**: Required (GVCN has full view; GVBM can view assigned subject only; ADMIN has full view).

#### `POST /api/classes/:classId/attendance`
* **Description**: Atomically saves a batch of attendance marks.
* **Auth**: Required (Teacher assigned to subject, or ADMIN).
* **Request Body**:
  ```json
  {
    "date": "2026-09-23",
    "subject_id": "sub-mat",
    "entries": [
      { "student_id": "stu-1", "status": "present", "note": "" },
      { "student_id": "stu-2", "status": "late", "note": "Đi muộn 10 phút" }
    ]
  }
  ```

#### `GET /api/classes/:classId/attendance/history?start_date=...&end_date=...`
* **Description**: Retrieves attendance records over a date range.
* **Auth**: Required (Class access)

---

### 2.6. Timetable (`/api/classes/:classId/timetable` & `/api/classes/timetable`)

#### `GET /api/classes/:classId/timetable`
* **Description**: Retrieves the weekly schedule for the specified class.
* **Auth**: Required (Class access or `ADMIN`)

#### `GET /api/classes/timetable/all?classId=...&teacherId=...&subjectId=...&room=...&dayOfWeek=...`
* **Description**: Retrieves all enriched timetable entries across the entire school with flexible multi-criteria filtering (by class, teacher, subject, room, day).
* **Auth**: Required (`ADMIN` only)

#### `GET /api/classes/timetable/audit?classId=...`
* **Description**: Runs comprehensive automated audit scanning for:
  1. Class conflicts (`classConflicts`).
  2. Teacher conflicts (`teacherConflicts`).
  3. Room conflicts (`roomConflicts`).
  4. Consecutive period rule violations (`ruleViolations`): > 2 consecutive periods or exceeding `subject.max_consecutive_periods`.
* **Auth**: Required (`ADMIN` only)

#### `POST /api/classes/:classId/timetable/entries`
* **Description**: Sets or creates a single period entry with full validation (class conflict, teacher conflict, room conflict, and consecutive period rules).
* **Auth**: Required (`ADMIN` only)
* **Request Body**:
  ```json
  {
    "day_of_week": 2,
    "period": 1,
    "subject_id": "sub-mat",
    "teacher_id": "u-tea-01",
    "room": "Phòng 101 — Nhà A"
  }
  ```

#### `PUT /api/classes/timetable/entries/:id`
* **Description**: Updates an existing timetable entry (subject, teacher, room, day, period) with full conflict and consecutive period validation, safely excluding the entry itself from false-positive conflict detection.
* **Auth**: Required (`ADMIN` only)

#### `DELETE /api/classes/timetable/entries/:id`
* **Description**: Deletes a period entry.
* **Auth**: Required (`ADMIN` only)

#### `POST /api/classes/:classId/timetable/copy`
* **Description**: Copies timetable from source class with atomic validation against teacher conflicts, room conflicts, and SHL homeroom teacher remapping.
* **Auth**: Required (`ADMIN` only)

#### `POST /api/classes/:classId/timetable/clear`
* **Description**: Clears all periods for the class.
* **Auth**: Required (`ADMIN` only)

---

### 2.7. Announcements & Student Notes

* `GET /api/classes/:classId/announcements`
* `POST /api/classes/:classId/announcements` (`HOMEROOM_TEACHER` or `ADMIN`)
* `PATCH /api/classes/:classId/announcements/:id/pin` (`HOMEROOM_TEACHER` or `ADMIN`)
* `DELETE /api/classes/:classId/announcements/:id` (`HOMEROOM_TEACHER` or `ADMIN`)
* `GET /api/notes/student/:studentId` (`HOMEROOM_TEACHER` or `ADMIN`)
* `POST /api/notes/student/:studentId` (`HOMEROOM_TEACHER` or `ADMIN`)
* `DELETE /api/notes/:id/student/:studentId` (`HOMEROOM_TEACHER` or `ADMIN`)

---

### 2.8. Teachers & Reports (`ADMIN` only)

* `GET /api/teachers`
* `POST /api/teachers`
* `PATCH /api/teachers/:id`
* `POST /api/teachers/:id/toggle-status`
* `POST /api/teachers/assign-homeroom`
* `POST /api/teachers/assign-subject` (Enforces max 2 grades per teacher)
* `DELETE /api/teachers/subject-assignments/:id`
* `GET /api/reports/school-summary`
* `GET /api/reports/grade-attendance`

---

### 2.9. Health Endpoint

#### `GET /health`
* **Description**: Cloud service liveness check verifying PostgreSQL connectivity.
* **Auth**: Public
* **Response**: `HTTP 200 OK`
  ```json
  {
    "status": "ok",
    "database": "connected",
    "timestamp": "2026-09-23T10:45:00.000Z"
  }
  ```
