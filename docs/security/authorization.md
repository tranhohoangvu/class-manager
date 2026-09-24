# Authorization & Role-Based Access Control (RBAC)

## 1. Multi-Tier Security Model

Authorization in Class Manager is enforced at multiple layers:

```text
┌───────────────────────────────────────────────────────────┐
│                    Layer 1: UI Guards                     │
│   - Client Layout Guards (frontend/src/app/(admin)/layout.tsx)     │
│   - Conditional Component Rendering (isHomeroom ? ... )   │
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTP Requests
                              ▼
┌───────────────────────────────────────────────────────────┐
│           Layer 2: Express RBAC Middleware (Authoritative)│
│   - backend/src/middleware/rbac.middleware.ts             │
│   - requireRole('ADMIN' | 'TEACHER')                      │
│   - requireClassAccess (Homeroom or Assigned Subject)     │
│   - requireHomeroomOrAdmin (Capacity, Seating, Roster)    │
└─────────────────────────────┬─────────────────────────────┘
                              │ Validated Domain Context
                              ▼
┌───────────────────────────────────────────────────────────┐
│           Layer 3: Domain Service Assertion Layer         │
│   - backend/src/services/*                                │
│   - Enforces Pedagogical Invariants (Max 2 grades/teacher)│
│   - Strict teacher double-booking checks in Timetable     │
└───────────────────────────────────────────────────────────┘
```

---

## 2. Dynamic Per-Class Authorization Matrix

Unlike traditional systems where permissions are static user attributes, permissions here adapt dynamically depending on which class the teacher has selected:

| Operational Feature | Homeroom Teacher (GVCN) | Subject Teacher (GVBM) | Administrator (Admin) |
| :--- | :---: | :---: | :---: |
| **Student Roster Management** | Read-Only View | Read-Only View | Full CRUD (Admin Only) |
| **Bulk Student Excel Import** | Denied | Denied | Allowed (Admin Only) |
| **Seating Arrangement** | Swap, Randomize, Gender Alt | View-Only | Full Management (All 16 Classes) |
| **Record Attendance** | Assigned Subject Only | Assigned Subject Only | Full Management (All Classes & Subjects) |
| **View Attendance** | Full View (All Subjects in class) | Assigned Subject Only | Full View & Executive Rollup |
| **Reset Attendance to Present** | Denied | Denied | Full Management (Admin Tool) |
| **Timetable Management** | Read-Only View | Read-Only View | Full Edit & Conflict Audit |
| **Class Settings** | Full Configuration | Denied | Full Configuration |
| **Announcements** | Class-Scope Create & Pin | Read-Only View | Full Management (School-wide & Class) |
| **Student Notes** | Create & Delete | Denied | View Only |
| **Teacher Allocation** | View Team | View Team | Full Management |

---

## 3. Server-Side Enforcement (Express Middleware)

### 3.1. Identity Derivation
The backend **never trusts a client-supplied `teacher_id` or `user_id`**.
The authenticated teacher's identity is strictly extracted from `req.user.id` through verified JWT session tokens:

```typescript
// Example: Adding a student or recording attendance
const teacherId = req.user.id;
```

### 3.2. RBAC Middlewares (`backend/src/middleware/rbac.middleware.ts`)

* **`requireRole('ADMIN')`**:
  Rejects any non-administrator request with `403 Forbidden`. Used for teacher allocations, global timetable edits, and system configuration.
* **`requireClassAccess`**:
  Verifies that the teacher is either:
  1. The homeroom teacher (`classes.teacher_id = req.user.id`).
  2. Or has a membership (`class_memberships`).
  3. Or has a subject assignment (`subject_assignments`).
  Denied requests yield `403 Forbidden: "Bạn không được phân công giảng dạy hoặc quản lý lớp này."`.
* **`requireAdmin` for Student Roster Management**:
  Restricts student creation, modification, class transfer, and deletion strictly to Administrators (`role === 'ADMIN'`). Teachers (including Homeroom GVCN and Subject GVBM) have read-only access to student profiles.
* **`requireHomeroomOrAdmin`**:
  Restricts seating management, announcements, and class settings strictly to the assigned homeroom teacher or administrator.

---

## 4. UI Authorization vs. Authoritative Backend

A common flaw in web applications is hiding buttons on the frontend without server-side validation on write operations. The architecture prevents this:

1. **UI Layer Hiding:**
   ```tsx
   {isAdmin && (
     <Button onClick={handleDeleteStudent}>Xóa học sinh</Button>
   )}
   ```
2. **Authoritative Backend Assertion:**
   ```typescript
   // Inside backend/src/services/student.service.ts
   if (currentUser.role !== 'ADMIN') {
     throw new ForbiddenError('Chỉ Quản trị viên (Admin) mới có quyền xoá học sinh.');
   }
   ```
   Even if a user bypasses the UI or invokes the REST endpoint directly via curl or DevTools console, the backend halts execution, rolls back any transaction, and responds with `403 Forbidden`.
