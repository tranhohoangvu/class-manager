# Activity Diagrams

This document contains flowcharts detailing the core decision processes and validation logic across the system.

---

## 1. Student Enrollment & Import Activity Flow

```mermaid
flowchart TD
    Start([Start: Add / Import Student]) --> CheckAuth{AuthGuard:<br/>User is GVCN in Class<br/>or Admin?}
    CheckAuth -->|No| RejectAuth[Reject: Return Unauthorized Error]
    CheckAuth -->|Yes| ParseInput[Validate Fields: Full Name & Student Code]

    ParseInput --> ValidFormat{Fields Valid &<br/>Non-Empty?}
    ValidFormat -->|No| RejectFormat[Reject: Validation Error]
    ValidFormat -->|Yes| CheckDupFile{Duplicate Code<br/>within Input?}

    CheckDupFile -->|Yes| RejectDupFile[Reject: Duplicate Code in Input]
    CheckDupFile -->|No| CheckDupClass{Code Already Exists<br/>in Active Class?}

    CheckDupClass -->|Yes| RejectDupClass[Reject: Student Code Already Taken in Class]
    CheckDupClass -->|No| CheckCapacity{Active Count + New Count<br/>> Class max_students?}

    CheckCapacity -->|Yes| RejectCapacity[Reject: Class Capacity Exceeded max 40]
    CheckCapacity -->|No| SaveStudents[Persist to LocalStore]
    SaveStudents --> ReturnSuccess([End: Return OperationResult Success])

    RejectAuth --> ReturnFail([End: Return OperationResult Failure])
    RejectFormat --> ReturnFail
    RejectDupFile --> ReturnFail
    RejectDupClass --> ReturnFail
    RejectCapacity --> ReturnFail
```

---

## 2. Timetable Slot Validation & Conflict Prevention

```mermaid
flowchart TD
    Start([Start: Save Timetable Slot]) --> CheckAdmin{AuthGuard:<br/>User is Admin?}
    CheckAdmin -->|No| ErrAdmin[Reject: Only Admin Can Manage Timetable]
    CheckAdmin -->|Yes| CheckDayPeriod{Day in 2..7 &<br/>Period in 1..10?}

    CheckDayPeriod -->|No| ErrSlot[Reject: Invalid Day or Period]
    CheckDayPeriod -->|Yes| CheckShift{Period Valid for<br/>Grade Shift?}

    CheckShift -->|No: Morning Class in PM or PM Class in AM| ErrShift[Reject: Grade Shift Mismatch]
    CheckShift -->|Yes| CheckSat{Is Saturday &<br/>Period > 3 Morning / > 8 Afternoon?}

    CheckSat -->|Yes| ErrSat[Reject: Saturday Has Only 3 Periods]
    CheckSat -->|No| CheckHomeroom{Is Saturday Final Period<br/>& Subject === SHL?}

    CheckHomeroom -->|No: Missing SHL on Sat| ErrSHL[Reject: Saturday Final Period Must Be Sinh Hoạt Lớp]
    CheckHomeroom -->|Yes| CheckClassConflict{Class Conflict:<br/>Another Subject in This Slot?}

    CheckClassConflict -->|Yes| ErrClassConflict[Reject: Slot Already Occupied in Class]
    CheckClassConflict -->|No| CheckTeacherConflict{Teacher Conflict:<br/>Teacher Teaches Another Class in School at Same Time?}

    CheckTeacherConflict -->|Yes| ErrTeacherConflict[Reject: Teacher Conflict Across School]
    CheckTeacherConflict -->|No| CommitSlot[Save Slot to LocalStore]
    CommitSlot --> Success([End: Timetable Updated Successfully])

    ErrAdmin --> Fail([End: Return OperationResult Failure])
    ErrSlot --> Fail
    ErrShift --> Fail
    ErrSat --> Fail
    ErrSHL --> Fail
    ErrClassConflict --> Fail
    ErrTeacherConflict --> Fail
```

---

## 3. Teacher Allocation & 2-Grade Limit Check

```mermaid
flowchart TD
    Start([Start: Assign Teacher to Class]) --> CheckAdmin{User is Admin?}
    CheckAdmin -->|No| ErrAuth[Reject: Admin Rights Required]
    CheckAdmin -->|Yes| CheckStatus{Teacher Status<br/>=== 'active'?}

    CheckStatus -->|No: disabled| ErrDisabled[Reject: Teacher Account is Disabled]
    CheckStatus -->|Yes| GetGrades[Fetch Current Grades Taught by Teacher]

    GetGrades --> GradeAlready{Teacher Already Teaches<br/>Target Class Grade?}
    GradeAlready -->|Yes: Same Grade| AllowAssign[Proceed: Grade Count Does Not Increase]
    GradeAlready -->|No: New Grade| CheckGradeCount{Current Grades Count<br/>>= 2?}

    CheckGradeCount -->|Yes: Would become 3 grades| ErrGradeLimit[Reject: Exceeds Max 2 Grades per Teacher Rule]
    CheckGradeCount -->|No: Becomes 1 or 2 grades| AllowAssign

    AllowAssign --> CommitAssign[Save Subject / Homeroom Assignment]
    CommitAssign --> EndSuccess([End: Assignment Successful])

    ErrAuth --> EndFail([End: Assignment Rejected])
    ErrDisabled --> EndFail
    ErrGradeLimit --> EndFail
```
