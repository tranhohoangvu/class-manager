# SCHOOL OPS — DESIGN SYSTEM SPECIFICATION (DESIGN.md)

**Codename:** Syllabus Academic Edition  
**Version:** 2.0 (Canonical Production Standard)  
**Visual Direction:** Cream-paper Editorial Stationery meets Geometric SaaS Admin  
**Aesthetic Core:** Warm off-white paper canvas, deep violet ink typography, buttery yellow physical interactive accents with hard-offset shadows, deep teal structural anchors, and calibrated scholastic semantic inks.  
**Audience:** Ban Giám hiệu, Giáo viên Chủ nhiệm & Giáo viên Bộ môn (Trường THCS Nguyễn Tất Thành).

---

## 1. DESIGN PRINCIPLES

1. **The Stationery Metaphor (Văn phòng phẩm & Sổ học vụ cao cấp):**
   - The application looks and feels like premium academic stationery: fine cream paper (`#fffcf7`), deep ink printing (`#0d0129`), crisp 1px structural hairline borders, and tactile sticky-note accents (`#fae59b`).
   - No generic neon AI gradients, no purplish dark glows, no blurry drop-shadows.

2. **Hard-Offset Button & Action Tactility:**
   - Primary in-page actions feature a crisp Butter Yellow fill with a signature **hard-offset shadow** (`1px 1px 3px 0px #000000` or `2px 2px 0px #000000`). Clicking feels like pressing a physical physical stamp or sticker into paper.

3. **High Operational Information Density (SaaS Data Restraint):**
   - Unlike a marketing landing page, SchoolOps is an operational cockpit. Table rows are compact and scannable (`py-2.5` to `py-3`), fonts range from 11px to 15px for data grids, and cards avoid unnecessary nesting ("card-inside-card" is banned). Whitespace and 1px hairline borders define hierarchy.

4. **Academic Semantic Clarity:**
   - Four non-negotiable status inks calibrated to harmonize with cream paper:
     - **Present / Valid / Healthy:** Forest Sage (`#2d6a4f`) on soft mint wash (`#edf7f0`).
     - **Late / Incomplete / Caution:** Amber Ochre (`#b7791f`) on warm corn wash (`#fef9e7`).
     - **Absent / Direct Conflict / Danger:** Crimson Ink (`#9e2a2b`) on soft blush wash (`#fdf2f2`).
     - **Excused / Neutral / Inactive:** Slate Muted (`#4a4e69`) on pale paper wash (`#f3f4f6`).

5. **7-State Discipline (TypeUI Core Contract):**
   - Every interactive element (Buttons, Form Inputs, Selects, Table Rows, Matrix Cells, Navigation Links) must explicitly declare behavior for all 7 states: `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, and `error`.

6. **Flawless Printability (@media print):**
   - Timetable matrices and attendance reports must print cleanly on physical A4 paper (landscape & portrait) with pure white backgrounds, ink borders, and no browser chrome.

---

## 2. COLOR SYSTEM & TOKENS

### 2.1 Core Palette

| Token Name | CSS Variable | Hex / OKLCH | Role & Usage |
| :--- | :--- | :--- | :--- |
| **Cream Canvas** | `--color-cream-paper` / `--bg` | `#fffcf7` | Page background; warm stationery base, eliminates eye strain. |
| **Pure White** | `--color-pure-white` / `--surface` | `#ffffff` | Working surfaces, table card containers, active modal surfaces. |
| **Muted Paper Surface** | `--color-surface-muted` | `#f7f4ed` | Table header rows, inactive tabs, subtle card headers. |
| **Ink Violet (Structural)** | `--color-ink-violet` / `--border` | `#0d0129` (Hairline 1px) | 1px clean hairline dividers, table column separators, input frames. |
| **Border Subtle** | `--color-border-subtle` | `rgba(13, 1, 41, 0.12)` | Subtle inner dividers, non-intrusive grid lines in timetable. |
| **Primary Ink (Text)** | `--color-text-primary` | `#0d0129` | Deep violet-black, high contrast (16:1 against cream canvas). |
| **Secondary Ink (Text)** | `--color-text-secondary` | `#4a4458` | Supporting labels, column descriptions, form subtitles. |
| **Muted Ink (Text)** | `--color-text-muted` | `#787285` | Timestamps, placeholders, inactive hints, table metadata. |
| **Butter Yellow (CTA)** | `--color-butter-yellow` / `--accent` | `#fae59b` | Signature interactive CTA button fill, active filters, selected pills. |
| **Butter Yellow Hover** | `--color-butter-yellow-hover` | `#f3dc82` | Hover state for butter yellow actions. |
| **Deep Teal (Anchor)** | `--color-deep-teal` | `#19615c` | Top nav / Admin sidebar accents, solemn header badges, authority marks. |
| **Shadow Black** | `--color-shadow-black` | `#000000` | Hard-offset shadow for yellow buttons and line-art fills. |

### 2.2 Scholastic Semantic Inks (Điểm danh & Thời khóa biểu)

| Status | Foreground Ink | Soft Wash Background | Border Color | Operational Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Success / Valid** | `#2d6a4f` (Sage) | `#edf7f0` | `rgba(45, 106, 79, 0.25)` | Có mặt, TKB hợp lệ 0 xung đột, Đang học |
| **Warning / Caution** | `#b7791f` (Ochre) | `#fef9e7` | `rgba(183, 121, 31, 0.28)` | Đi muộn, Chưa đủ số tiết quy định |
| **Danger / Conflict** | `#9e2a2b` (Crimson) | `#fdf2f2` | `rgba(158, 42, 43, 0.30)` | Vắng mặt, Xung đột trùng tiết giáo viên/lớp |
| **Neutral / Excused** | `#4a4e69` (Slate) | `#f3f4f6` | `rgba(74, 78, 105, 0.20)` | Nghỉ có phép, Tiết trống, Không hoạt động |

---

## 3. TYPOGRAPHY & TYPE SCALE

* **Primary Typeface:** `Geist Sans` / `Roobert` (Fallback: `Inter`, system geometric sans).
* **Monospace & Tabular:** `Geist Mono` / `Supply` / `JetBrains Mono` (Dành riêng cho Mã tiết, Mã HS, Giờ học, Phần trăm, Số liệu bảng).
* **Display Discipline:** Tiêu đề luôn thẳng (`font-style: normal`). Tuyệt đối cấm in nghiêng (italic) ở headings.

### Scaled Hierarchy for SaaS Admin

| Role | Font Size | Line Height | Weight | Tailwind Utility | Usage in SchoolOps |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Title** | `26px (1.625rem)` | `1.2` | `700` | `page-title` | Tiêu đề chính trang điều hành Admin |
| **Section Header** | `18px (1.125rem)` | `1.3` | `700` | `section-heading` | Tiêu đề khối (Bảng TKB, Danh sách HS) |
| **Card / Item Title** | `15px (0.9375rem)` | `1.4` | `600` | `font-semibold` | Tên lớp (8A1), Tên giáo viên, Modal title |
| **Body Standard** | `14px (0.875rem)` | `1.5` | `400` | `text-sm` | Nội dung form, mô tả thông báo, standard cell |
| **Table Headings** | `12px (0.75rem)` | `1.3` | `700` | `text-xs uppercase tracking-wider` | Tiêu đề cột dữ liệu (TIẾT, THỨ, MÔN, PHÒNG) |
| **Meta / Badge / Time** | `11px - 12px` | `1.2` | `500 / 600` | `text-xs` | Giờ học (07:15 - 08:00), Chip vai trò GV |
| **Numeric Tabular** | `13px - 14px` | `1.2` | `600` | `font-mono tabular-nums` | Sĩ số (30/30), Tỷ lệ chuyên cần (98.5%) |

---

## 4. SPACING, GEOMETRY & ELEVATION

### 4.1 Spacing Scale
* **Micro-scale (Components & Tables):** `4px`, `8px`, `12px`, `16px`.
* **Macro-scale (Containers & Layout):** `20px`, `24px`, `32px`, `40px`.

### 4.2 Geometry & Border Radius
Syllabus tôn vinh tính chuẩn mực hình học (Sharp Editorial):
* **Default Geometry:** Sắc sảo, chuẩn mực 0px đến 2px micro-radius.
  - Buttons (Primary Yellow & Nav): `rounded-none` (`radius: 0px`) hoặc subtle `rounded-sm (2px)`.
  - Input fields, Selects, Search bars: `rounded-none` hoặc `rounded-sm (2px)`.
  - Cards, Data Tables, Modals: `rounded-none` với viền 1px Ink Violet (`#0d0129`).
  - Status Dots & Avatars: `rounded-full` (hoặc square chip mang tính biểu tượng).

### 4.3 Elevation & Shadows
* **Primary Signature Shadow:**
  - `box-shadow: 1px 1px 3px 0px #000000;` (hoặc `2px 2px 0px 0px #0d0129;`) trên nền nút Butter Yellow `#fae59b`.
* **Elevated Modals / Dropdowns:**
  - `box-shadow: 4px 4px 0px 0px rgba(13, 1, 41, 0.15), 0 8px 24px -4px rgba(13, 1, 41, 0.12);`
* **Flat Surfaces:** Không dùng bóng mờ tỏa rộng. Sự phân tầng được giải quyết bằng màu nền Cream Paper (`#fffcf7`) bên dưới và Pure White (`#ffffff`) bên trên.

---

## 5. COMPONENT SPECIFICATIONS (7-STATE MATRIX)

Mọi interactive component phải tuân thủ nghiêm ngặt 7 trạng thái của TypeUI:

### A. Primary Action Button (`<Button variant="primary">`)
* **Visual Style:** Butter Yellow sticker button with hard offset shadow.
* **States:**
  1. `default`: `bg-[#fae59b] text-[#0d0129] border border-[#0d0129] shadow-[1px_1px_3px_0px_#000000] font-bold text-xs uppercase tracking-wide px-3.5 h-9 inline-flex items-center justify-center`.
  2. `hover`: `bg-[#f3dc82] shadow-[2px_2px_4px_0px_#000000] translate-x-[-0.5px] translate-y-[-0.5px]`.
  3. `focus-visible`: `outline-2 outline-offset-2 outline-[#0d0129] ring-2 ring-[#fae59b]`.
  4. `active`: `translate-x-[1px] translate-y-[1px] shadow-none bg-[#ebd374]`.
  5. `disabled`: `opacity-50 cursor-not-allowed shadow-none bg-[#e8e4d8] text-[#787285] border-[#b0abbc]`.
  6. `loading`: `cursor-wait opacity-80 pointer-events-none` kèm spinner xoay 14px `#0d0129`.
  7. `error`: `bg-[#fdf2f2] text-[#9e2a2b] border-[#9e2a2b] shadow-none`.

### B. Secondary Button (`<Button variant="secondary">`)
* **Visual Style:** White paper card button with 1px ink outline.
* **States:**
  - `default`: `bg-white text-[#0d0129] border border-[#0d0129] hover:bg-[#f7f4ed] active:translate-y-[0.5px]`.

### C. Anchor / Nav Action (`<Button variant="anchor">`)
* **Visual Style:** Deep Teal solid block (`#19615c`) with white/cream text.

### D. Form Input & Search Toolbar
* **Height:** `38px` (compact toolbar), `40px` (standard form).
* **Surface:** `#ffffff` trên nền `#fffcf7`, viền `1px solid rgba(13, 1, 41, 0.25)`.
* **Focus State:** `border-[#0d0129] ring-2 ring-[#fae59b] outline-none`.
* **Error State:** `border-[#9e2a2b] ring-2 ring-[#fdf2f2] text-[#9e2a2b]`.

### E. Data Table (`.data-table`)
* **Container:** `bg-white border border-[#0d0129] overflow-hidden`.
* **Header Row (`th`):** `bg-[#f7f4ed] text-[#0d0129] text-[11px] font-bold uppercase tracking-wider border-b border-[#0d0129] px-4 py-2.5`.
* **Body Rows (`td`):** `px-4 py-2.5 border-b border-[#0d0129]/15 text-sm text-[#0d0129]`.
* **Row Hover:** `hover:bg-[#fae59b]/15 transition-colors`.

### F. Timetable Matrix Cell (Ca Sáng / Ca Chiều)
* **Normal Scheduled:** `bg-white border border-[#0d0129]/20 hover:border-[#0d0129] hover:bg-[#fae59b]/20`.
* **Conflict State (Trùng tiết):** `bg-[#fdf2f2] border-2 border-[#9e2a2b] text-[#9e2a2b] font-bold animate-pulse`.
* **Empty Cell (Tiết trống):** `bg-[#fffcf7] border border-dashed border-[#0d0129]/20 hover:border-[#0d0129]/60`.

### G. Attendance Status Badges
* **Có mặt:** `bg-[#edf7f0] text-[#2d6a4f] border border-[#2d6a4f]/30 font-semibold px-2 py-0.5 text-xs`.
* **Đi muộn:** `bg-[#fef9e7] text-[#b7791f] border border-[#b7791f]/35 font-semibold px-2 py-0.5 text-xs`.
* **Vắng mặt:** `bg-[#fdf2f2] text-[#9e2a2b] border border-[#9e2a2b]/35 font-semibold px-2 py-0.5 text-xs`.
* **Có phép:** `bg-[#f3f4f6] text-[#4a4e69] border border-[#4a4e69]/30 font-semibold px-2 py-0.5 text-xs`.

---

## 6. SHELL & NAVIGATION

1. **Header & Context:**
   - Dòng tiêu đề tinh gọn: *Trung tâm Điều hành Nhà trường*.
   - Metadata cơ sở: *THCS Nguyễn Tất Thành · Năm học 2026-2027 · Học kỳ 1*.
   - Action nút vàng: *Quản lý TKB* và *Xuất báo cáo (.xlsx)*.
2. **Sidebar:**
   - Nền `#ffffff` với đường viền bên phải `1px solid #0d0129`.
   - Brand mark mang sắc thái `Deep Teal` (`#19615c`).
   - Active link: `bg-[#fae59b] text-[#0d0129] font-bold border border-[#0d0129] shadow-[1px_1px_0px_#000]`.
3. **Admin Triage Alert:**
   - Khi có xung đột: Dải thông báo viền đôi đỏ (`#9e2a2b`) với nút khắc phục tức thì dạng Butter Yellow.

---

## 7. ACCESSIBILITY & PRINT SPECIFICATIONS

* **WCAG 2.2 AA Contrast Compliance:**
  - Ink Violet (`#0d0129`) trên Cream Paper (`#fffcf7`): Tỷ lệ tương phản **16.8:1** (vượt xa chuẩn AAA).
  - Ink Violet (`#0d0129`) trên Butter Yellow (`#fae59b`): Tỷ lệ tương phản **12.4:1** (chuẩn AAA).
  - Deep Teal (`#19615c`) trên Pure White (`#ffffff`): Tỷ lệ tương phản **7.2:1** (chuẩn AAA).
* **Keyboard Navigation:**
  - Mọi interactive control đều có `:focus-visible` với vòng viền kép Ink Violet + Butter Yellow offset.
* **Print Layout (@media print):**
  - Khổ giấy: A4 Landscape cho Thời khóa biểu, Portrait cho Báo cáo Điểm danh.
  - Tự động ẩn: Sidebar, Top nav, Toolbar search, Action buttons.
  - Màu nền in ấn ép về `#ffffff` tuyệt đối, đường viền nét đen `0.5pt solid #000000` cho độ nét bản in tối đa.
