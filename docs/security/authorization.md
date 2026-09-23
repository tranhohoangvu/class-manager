# Authorization & Role-Based Access Control (RBAC)

## 1. Multi-Tier Security Model

Authorization in Class Manager is enforced at multiple layers:

```text
┌───────────────────────────────────────────────────────────┐
│                    Layer 1: UI Guards                     │
│   - Client Layout Guards (src/app/(admin)/layout.tsx)     │
│   - Conditional Component Rendering (isHomeroom ? ... )   │
└─────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────┐
│              Layer 2: Domain AuthGuard (Authoritative)    │
│   - src/services/auth-guard.ts                            │
│   - Checks User Status, Global Role, & Per-Class Role     │
│   - Blocks unauthorized mutations before touching data    │
└─────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────┐
│             Layer 3: Target Database RLS Policies         │
│   - supabase/migrations/001_initial_schema.sql            │
│   - Row Level Security (RLS) enabled on all 12 tables     │
└───────────────────────────────────────────────────────────┘
```

---

## 2. Dynamic Per-Class Authorization Matrix

Unlike traditional systems where permissions are static user attributes, permissions here adapt dynamically depending on which class the teacher has selected:

| Operational Feature | Homeroom Teacher (GVCN) | Subject Teacher (GVBM) | Administrator (Admin) |
| :--- | :---: | :---: | :---: |
| **Student Roster** | Full CRUD | Read-Only Profile View | Full System Access |
| **Bulk Excel Import** | Allowed | Denied | Allowed |
| **Seating Arrangement** | Swap, Randomize, Assign, Clear | View-Only | View-Only |
| **Record Attendance** | Assigned Subject Only | Assigned Subject Only | All Classes & Subjects |
| **View Attendance** | Full View (All Subjects in class) | Assigned Subject Only | All Classes & Subjects |
| **Timetable Management**| Read-Only View | Read-Only View | Full Edit & Management |
| **Class Settings** | Full Configuration | Denied | Full Configuration |
| **Announcements** | Create, Pin, Delete | Read-Only View | Full Management |
| **Student Notes** | Create & Delete | Denied | View Only |
| **Teacher Allocation** | View Team | View Team | Full Management |

---

## 3. The `AuthGuard` Specification (`src/services/auth-guard.ts`)

`AuthGuard` is a stateless, pure verification module called at the beginning of every service mutation:

### 3.1. Core Guards

```typescript
// Admin verification
isAdmin(user: UserRow | null): boolean;

// Homeroom verification for specific class
isHomeroomTeacher(user: UserRow | null, classId: string | null | undefined): boolean;

// General class affiliation (either GVCN or GVBM)
hasAccessToClass(user: UserRow | null, classId: string | null | undefined): boolean;

// Timetable permissions
canViewTimetable(user: UserRow | null, classId: string | null | undefined): boolean;
canManageTimetable(user: UserRow | null, classId?: string | null): boolean; // ADMIN ONLY

// Student mutations
canEditStudent(user: UserRow | null, classId: string): boolean;

// Seating mutations
canManageSeating(user: UserRow | null, classId: string): boolean;

// Attendance permissions
canManageAttendance(user: UserRow | null, classId: string, subjectId?: string): boolean;
canViewAttendance(user: UserRow | null, classId: string, subjectId?: string): boolean;
canAttendPeriod(user: UserRow | null, classId: string, day: number, period: number): boolean;

// Class & faculty administration
canEditClassSettings(user: UserRow | null, classId: string): boolean;
canManageTeacherAssignment(user: UserRow | null): boolean; // ADMIN ONLY
```

---

## 4. UI Authorization vs. Service Authorization

A common flaw in web applications is hiding buttons without verifying authorization on write operations. The codebase prevents this:

1. **UI Layer Hiding:**
   ```tsx
   {isHomeroom && (
     <Button onClick={handleDeleteStudent}>Xóa học sinh</Button>
   )}
   ```
2. **Service Layer Assertion:**
   ```typescript
   if (!AuthGuard.canEditStudent(currentUser, student.class_id)) {
     return failure('Bạn không có quyền xoá học sinh này. Chỉ GVCN hoặc Quản trị viên mới có quyền xoá học sinh.');
   }
   ```
   Even if a user bypasses the UI or invokes methods via the browser console, the Service Layer halts execution and returns a typed failure response.

---

## 5. PostgreSQL Row-Level Security (RLS) Mapping

The target Supabase migration (`001_initial_schema.sql`) implements identical rules at the database engine level using helper security functions:

```sql
-- Helper: Checks if auth.uid() has active ADMIN role
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN' AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Checks if auth.uid() has access to a class
CREATE OR REPLACE FUNCTION has_class_access(p_class_id uuid) RETURNS boolean AS $$
BEGIN
  IF is_admin() THEN RETURN true; END IF;
  RETURN EXISTS (
    SELECT 1 FROM classes WHERE id = p_class_id AND teacher_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM class_memberships WHERE class_id = p_class_id AND teacher_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

RLS Policies enforce:
- `students`: Read allowed if `has_class_access(class_id)`. Write allowed only if `is_admin()` or `classes.teacher_id = auth.uid()`.
- `timetable_entries`: Read allowed if `has_class_access(class_id)`. Write restricted to `is_admin()`.
- `attendance`: Write allowed if user has class access for that student.
