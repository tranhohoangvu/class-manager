# SCHOOL OPS — UI AGENT SKILL (SKILL.md)

**Companion to:** `DESIGN.md` (Syllabus Academic Edition v2.0)  
**Purpose:** Implementation guide for AI agents generating or modifying SchoolOps UI code.  
**Stack:** Next.js 16 (App Router) · Tailwind CSS v4 · TypeScript · Phosphor Icons  
**Last Audit:** 2026-09-25

---

## OVERVIEW

This skill teaches an AI agent how to write correct, on-brand UI code for SchoolOps.
It covers: which tokens to use, which components already exist, what conformance gaps
remain, and what patterns are banned. Always read this alongside `DESIGN.md`.

---

## 1. DESIGN SYSTEM CONFORMANCE AUDIT (vs. DESIGN.md v2.0)

### ✅ FULLY CONFORMANT

| Area | Status | Evidence |
|---|---|---|
| Color token system | ✅ Exact | `globals.css :root` matches all DESIGN.md hex values |
| Cream Paper canvas (`#fffcf7`) | ✅ | `--bg: #fffcf7` on `body` |
| Ink Violet typography (`#0d0129`) | ✅ | `--text-primary: #0d0129` |
| Butter Yellow CTA (`#fae59b`) | ✅ | `--accent: #fae59b` |
| Deep Teal anchor (`#19615c`) | ✅ | `--teal: #19615c` |
| Hard-offset button shadow | ✅ | `shadow-[1px_1px_3px_0px_#000000]` on `Button variant="primary"` |
| Active button press translate | ✅ | `active:translate-x-[1px] active:translate-y-[1px] active:shadow-none` |
| Scholastic semantic inks (4 statuses) | ✅ | `--success`, `--warning`, `--danger`, `--neutral` all exact |
| Attendance badges (4 states) | ✅ | `.badge-present/absent/late/excused` in globals.css |
| Sidebar active link style | ✅ | `bg-accent border border-border-strong shadow-[1px_1px_0px_#000]` |
| Geist Sans + Geist Mono fonts | ✅ | `--font-sans`, `--font-mono` via Next.js font vars |
| Sharp geometry (0–4px radius) | ✅ | `rounded-sm` (2px) predominant; `rounded-none` on tables |
| Print media query (A4 landscape) | ✅ | `@media print` hides sidebar/nav, forces white bg |
| Sidebar border-right `1px solid #0d0129` | ✅ | `.app-sidebar` uses `border-right: 1px solid var(--border)` |
| Data table header styling | ✅ | `.data-table th` — muted surface, 13px, tracking, border-b |
| Row hover `rgba(250,229,155,0.15)` | ✅ | `hover:bg-[rgba(250,229,155,0.15)]` in `.data-table` |
| Focus-visible: Ink Violet outline | ✅ | Global `:focus-visible` rule in globals.css |

### ⚠️ PARTIAL / MINOR GAPS

| Area | Gap | Status |
|---|---|---|
| **Data table font size** | DESIGN.md specifies `11px` for `th`. `globals.css` uses `13px`. | ✅ **Intentional** — 13px is more legible at SaaS data density. Accepted deviation. |
| **Page title scale** | DESIGN.md: `26px`. `.page-title` uses `28px`. | ✅ **Intentional** — 28px reads better in the shell. Accepted deviation. |

> All other ⚠️ gaps from the initial audit have been resolved. See commit history.

### ❌ NOT YET IMPLEMENTED

| Area | DESIGN.md Requirement | Action |
|---|---|---|
| **Admin Triage Alert Banner** | Red double-border conflict alert with Butter Yellow fix button (DESIGN.md §6.3). Conflicts are shown inline on cells, but no dedicated top-level banner. | Build `<TimetableConflictAlert>` if admin dashboard needs a summary alert. Low priority. |

---

## 2. TOKEN QUICK REFERENCE

Use CSS variables via Tailwind's `bg-*`, `text-*`, `border-*` utilities:

```
Backgrounds:
  bg-bg               → #fffcf7 (Cream Paper Canvas)
  bg-surface          → #ffffff (Working surface)
  bg-surface-muted    → #f7f4ed (Table headers, inactive tabs)
  bg-accent           → #fae59b (Butter Yellow CTA fill)
  bg-teal-subtle      → #e6f4f2 (Teal wash for GVBM indicators)

Text:
  text-text-primary   → #0d0129 (Deep ink violet)
  text-text-secondary → #4a4458
  text-text-muted     → #787285

Borders:
  border-border-strong → #0d0129 (1px structural ink)
  border-border        → rgba(13,1,41,0.16) (Subtle dividers)

Status:
  text-success / bg-success-bg → #2d6a4f / #edf7f0
  text-warning / bg-warning-bg → #b7791f / #fef9e7
  text-danger  / bg-danger-bg  → #9e2a2b / #fdf2f2
  text-neutral / bg-neutral-bg → #4a4e69 / #f3f4f6
```

---

## 3. COMPONENT INVENTORY & USAGE

### Existing Components

| Component | File | Variants / Props |
|---|---|---|
| `<Button>` | `components/ui/button.tsx` | `primary`, `secondary`, `ghost`, `outline`, `danger` · sizes: `sm`, `md`, `lg` · `loading` prop |
| `<AttendanceBadge>` | `components/ui/badge.tsx` | status: `present`, `absent`, `late`, `excused` · size: `sm`, `md` · `showIcon` |
| `<AttendanceDot>` | `components/ui/badge.tsx` | Compact grid dot — 24×24px rounded-sm |
| `<StudentStatusBadge>` | `components/ui/badge.tsx` | status: `active`, `inactive` |
| `<RoleBadge>` | `components/ui/badge.tsx` | role: `HOMEROOM`, `SUBJECT`, `ADMIN`, `DISABLED` |
| `<Badge>` | `components/ui/badge.tsx` | Generic — variant: `default`, `accent`, `muted` |
| `<Input>` | `components/ui/input.tsx` | Use with `.input-base` class pattern |
| `<Modal>` | `components/ui/modal.tsx` | Standard dialog with hard-offset shadow |
| `<Sidebar>` | `components/shell/sidebar.tsx` | Teacher sidebar — `isOpen`, `onClose` |
| `<AdminSidebar>` | `components/shell/admin-sidebar.tsx` | Admin portal sidebar |
| `<ClassSwitcher>` | `components/shell/class-switcher.tsx` | Class dropdown in sidebar header |

### CSS Utility Classes (globals.css)

| Class | Usage |
|---|---|
| `.page-title` | Main page H1 — 28px, 700, tight tracking |
| `.section-heading` | Section H2 — 20px, 600 |
| `.label-text` | Form labels — 14px, 500, secondary color |
| `.meta-text` | Timestamps, metadata — 12px, muted |
| `.data-table` | Table container — apply to `<table>` element |
| `.input-base` | Form input styling — 42px height |
| `.metric-card` | Stats/KPI cards — white, subtle border, hover |
| `.app-layout` | Flex container for sidebar + main layout |
| `.app-sidebar` | Sticky sidebar — 260px, auto-scrolling |
| `.app-main` | Main content area — flex-1 |
| `.page-content` | Content wrapper — max-width 1100px, centered |
| `.badge-present/absent/late/excused` | Attendance badge color classes |

---

## 4. PATTERNS & RULES FOR AI AGENTS

### 4.1 Always Follow

```tsx
// ✅ CORRECT: Primary CTA button
<Button variant="primary" size="md">
  Lưu thay đổi
</Button>

// ✅ CORRECT: Attendance badge
<AttendanceBadge status="present" size="sm" />

// ✅ CORRECT: Data table shell
<div className="bg-surface border border-border-strong overflow-hidden rounded-sm">
  <table className="data-table">
    <thead>
      <tr>
        <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider
                       text-text-secondary bg-surface-muted border-b border-border-strong">
          HỌC SINH
        </th>
      </tr>
    </thead>
    <tbody>...</tbody>
  </table>
</div>

// ✅ CORRECT: Status badge — semantic ink
<span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold
                 rounded-sm bg-success-bg text-success border border-success/30">
  Có mặt
</span>
```

### 4.2 Icon Library

**Only Phosphor Icons** — package: `@phosphor-icons/react`

```tsx
import { Student, CalendarDots, ClipboardText, ShieldCheck } from '@phosphor-icons/react';
// Props: size={16}, weight="bold" | "regular" | "duotone"
```

**Never use:** Heroicons, Lucide, FontAwesome, or emoji as icons.

### 4.3 Banned Patterns

```
❌ No neon gradients or glowing box-shadows
❌ No rounded-lg or rounded-xl on cards/tables (use rounded-sm or rounded-none)
❌ No bg-blue-*, bg-purple-*, or generic Tailwind color utilities
❌ No Inter font (Geist Sans only)
❌ No card-inside-card nesting
❌ No h-screen — use min-h-dvh or h-dvh
❌ No inline style={{ }} for design tokens — use CSS variables
❌ No placeholder text like "John Doe", "Học sinh A", "Lớp X"
❌ No generic circular spinner except inside <Button loading>
❌ No semantic HTML violations (no <div> for interactive elements without role)
```

### 4.4 Conditional State Patterns

```tsx
// Row hover — let .data-table CSS handle it; do NOT add individual hover classes to <tr>

// Active navigation link:
className={cn(
  'flex items-center h-9.5 px-3 rounded-sm text-xs font-bold border',
  isActive
    ? 'bg-accent text-text-primary border-border-strong shadow-[1px_1px_0px_#000]'
    : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted border-transparent hover:border-border'
)}

// Disabled button — just pass `disabled` prop; DO NOT add opacity-50 manually
<Button disabled>Không khả dụng</Button>
```

---

## 5. LAYOUT CONVENTIONS

### Shell Layout

```
app-layout (flex row)
├── app-sidebar (260px, sticky, border-right)
└── app-main (flex-1)
    └── page-content (max-width 1100px, centered)
        ├── <h1 className="page-title"> — ONE per page
        ├── section header
        └── content blocks
```

### Timetable Matrix

Cells must conform to DESIGN.md Section 5.F:

```tsx
// Normal scheduled cell
className="bg-white border border-border/20 hover:border-border-strong hover:bg-accent/20"

// Conflict cell
className="bg-danger-bg border-2 border-danger text-danger font-bold animate-pulse"

// Empty / blank cell
className="bg-bg border border-dashed border-border/20 hover:border-border/60"
```

### Spacing Rules

- Page padding: `var(--space-8)` (32px) desktop, `var(--space-5)`/`var(--space-4)` mobile
- Component internal: `var(--space-3)` (12px) to `var(--space-6)` (24px)
- Table cells: `px-4 py-2.5` standard, `py-3` for spacious rows

---

## 6. PRINT COMPLIANCE CHECKLIST

When building printable views (attendance reports, timetable):

- [ ] Add `.no-print` to any element that should disappear on print
- [ ] Wrap printable content in `.printable-card`
- [ ] Use `@page { size: landscape; margin: 8mm; }` for timetable (already in globals.css)
- [ ] Use `page-break-inside: avoid` on table rows and cards
- [ ] Ensure all status colors have sufficient contrast at `print:text-black`
- [ ] Never use `background-clip: text` or gradient text in printable zones

---

## 7. ADDING NEW PAGES

Checklist for any new page or feature:

1. **Route file:** Place in `frontend/src/app/(dashboard)/` or `(admin)/` group
2. **H1:** One `.page-title` per page, matching the sidebar nav label
3. **Layout:** Use `.page-content` wrapper inside `.app-main`
4. **Data table:** Use `.data-table` class — never roll your own table styles
5. **Actions:** Use `<Button variant="primary">` for CTAs, `variant="secondary"` for cancels
6. **Status display:** Use `<AttendanceBadge>` or `.badge-*` CSS classes — never ad-hoc colors
7. **Empty state:** Render `<EmptyState>` (from `state-views.tsx`) when list is empty
8. **Loading:** Show skeleton or `<Button loading>` spinner — never a bare spinner div
9. **Print:** Add `@media print` rules if page will be printed
10. **Mobile:** Verify layout collapses to single column below 768px

---

## 8. FILE MAP

```
frontend/src/
├── app/
│   ├── globals.css          ← Design token definitions + utility classes
│   ├── layout.tsx           ← Root layout (Geist fonts, body class)
│   ├── (auth)/login/        ← Login page
│   ├── (dashboard)/         ← Teacher-facing routes
│   └── (admin)/             ← Admin portal routes
├── components/
│   ├── ui/
│   │   ├── button.tsx       ← <Button> — primary, secondary, ghost, outline, danger
│   │   ├── badge.tsx        ← <AttendanceBadge>, <RoleBadge>, <Badge>, <AttendanceDot>
│   │   ├── input.tsx        ← <Input> field component
│   │   ├── modal.tsx        ← <Modal> dialog
│   │   └── state-views.tsx  ← <EmptyState>, <LoadingState>, <ErrorState>
│   └── shell/
│       ├── sidebar.tsx      ← Teacher sidebar (260px)
│       ├── admin-sidebar.tsx← Admin portal sidebar
│       ├── class-switcher.tsx← Class dropdown in sidebar header
│       └── mobile-nav.tsx   ← Mobile top bar + hamburger
├── lib/
│   ├── utils.ts             ← cn() utility (clsx + tailwind-merge)
│   ├── constants.ts         ← ATTENDANCE_STATUS_LABELS, CLASS_CONSTANTS
│   └── mock-data.ts         ← Offline-mode seeded data
└── types/
    └── index.ts             ← AttendanceStatus, StudentStatus, etc.
```

---

*SKILL.md is the implementation layer of DESIGN.md.  
When DESIGN.md changes, update Section 1 audit accordingly.*
