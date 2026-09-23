# State & Lifecycle Diagrams

This document illustrates the lifecycle states and valid transitions for the core entities in the system.

---

## 1. Student Enrollment Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Active: Single Create or Excel Import (Status: active)

    Active --> Inactive: Student transfers school or pauses enrollment
    Inactive --> Active: Student returns / resumes studies

    Active --> [*]: Permanently removed via deleteStudent (Clears seat)
    Inactive --> [*]: Permanently removed via deleteStudent
```

* **States:**
  - `active`: Enrolled student attending classes. Counts toward the class capacity ceiling (`max_students <= 40`).
  - `inactive`: Student record preserved for historical tracking, but does not occupy classroom seats.
* **Invariants:** Only `active` students can be seated in the 20-desk classroom layout or marked in daily attendance.

---

## 2. Daily Attendance Session States

```mermaid
stateDiagram-v2
    [*] --> Present: Default state (or bulk mark "Tất cả có mặt")

    Present --> Absent: Student unexcused absence
    Present --> Late: Student arrives tardy
    Present --> Excused: Parent provides authorized excuse

    Absent --> Present: Correction
    Absent --> Excused: Excuse note submitted later
    Late --> Present: Correction
    Excused --> Absent: Excuse invalidated

    Present --> [*]: Attendance submitted
    Absent --> [*]: Attendance submitted
    Late --> [*]: Attendance submitted
    Excused --> [*]: Attendance submitted
```

* **Values:**
  - `present`: Có mặt (Emerald badge `✓`)
  - `absent`: Vắng không phép (Rose badge `✕`)
  - `late`: Đi muộn (Amber badge `⏱`)
  - `excused`: Vắng có phép (Slate badge `📋`)

---

## 3. Classroom Seat Allocation Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Empty: Classroom initialized (20 Desks × 2 Seats = 40 Empty Seats)

    Empty --> Occupied: Seat assigned to active student (assignSeat or Fisher-Yates)
    Occupied --> Empty: Student removed, seat vacated, or Clear All clicked
    Occupied --> Occupied: Click-to-Swap (atomically swaps occupants between Seat A and Seat B)

    Empty --> [*]: Class archived
    Occupied --> [*]: Class archived
```

---

## 4. User Account Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Active: Created by Administrator or seeded (status: active)

    Active --> Disabled: Account locked / Staff leaves school (status: disabled)
    Disabled --> Active: Re-activated by Administrator

    Active --> InSession: Logs in via /login (Generates AuthSession)
    InSession --> Active: Logs out or session cleared
    Disabled --> Blocked: Attempts login -> Immediate rejection ("Tài khoản bị vô hiệu hóa")
```

---

## 5. Class Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Active: Created by Administrator (status: active, 20 Desks generated)

    Active --> Archived: Academic year ends / Class archived (status: archived)
    Archived --> Active: Re-opened if needed

    Active --> [*]: Removed from system
    Archived --> [*]: Removed from system
```
