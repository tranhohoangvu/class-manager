# SCHOOL OPS — TOÀN BỘ KIỂM TOÁN UI/UX & KẾ HOẠCH TINH CHỈNH SẢN PHẨM

**Ngày kiểm toán:** 22/09/2026  
**Phiên bản:** Local Prototype (Production-ready Architecture)  
**Tôn chỉ thiết kế:** *Light, clean, modern, practical, calm, trustworthy, education-oriented.*  
*(Loại bỏ hoàn toàn cảm giác AI-generated dashboard, gradient thừa mứa, shadow nặng, thẻ nổi lơ lửng, hoặc icon trang trí không mục đích).*

---

## 1. TỔNG QUAN HIỆN TRẠNG & CÁC VẤN ĐỀ CỐT LÕI (AUDIT FINDINGS)

Qua việc kiểm tra toàn diện 11 routes chính cùng hệ thống design tokens và shared components, các vấn đề được phân loại theo mức độ nghiêm trọng như sau:

| Vấn đề | Phạm vi | Mức độ | Khuyến nghị khắc phục |
| :--- | :--- | :---: | :--- |
| **Mobile Layout vỡ hoàn toàn** | Toàn bộ Dashboard & Admin | **Critical** | `.app-sidebar` đang cố định `width: 220px`, không có hamburger menu hoặc drawer cho màn hình nhỏ (`< 768px`). Màn hình mobile bị ép chỉ còn ~170px bề ngang. Cần bổ sung Mobile Header + Sidebar Drawer overlay. |
| **Lỗi CSS Token Geist Font tiếng Việt** | `globals.css` / `layout.tsx` | **High** | `globals.css` khai báo `--font-sans: 'Geist' ...` trong khi `layout.tsx` cung cấp biến `var(--font-geist-sans)`. Trình duyệt fall back về font hệ thống thay vì dùng font Geist đã tối ưu subset tiếng Việt. Sửa thành `var(--font-geist-sans)`. |
| **Class `.metric-card` & semantic sub-tokens bị thiếu** | `globals.css`, `dashboard/page.tsx` | **High** | 4 thẻ KPI trên trang Dashboard dùng class `metric-card`, `bg-success-subtle`, `bg-danger-subtle` nhưng không có định nghĩa trong CSS! Dẫn đến 4 thẻ này bị mất hoàn toàn khung, nền, viền và padding. Cần chuẩn hóa `.metric-card` và `@theme inline`. |
| **Thiếu nhất quán trong Form Controls & Table Rows** | `students`, `classes`, `teachers` | **Medium** | Nhiều trang dùng xen kẽ thẻ `<input>`, `<select>` raw với style tùy hứng, thiếu icon mũi tên chuẩn, thiếu focus-ring đồng nhất. Cần đồng bộ hóa qua component `Input`, `Select` hoặc `input-base`. |
| **Biểu tượng & Màu sắc phân tán (Ad-hoc Tailwind Colors)** | Toàn hệ thống | **Medium** | Xuất hiện rải rác `emerald-50`, `indigo-50`, `amber-500/15`, `rose-50` không theo semantic design token. Cần quy ước bảng màu trạng thái và vai trò (GVCN: Emerald, GVBM: Amber/Indigo, Admin: Indigo). |
| **Thiếu trợ năng (Accessibility) & Phản hồi trạng thái** | `seating`, `attendance`, `history` | **Medium** | Điểm danh và sơ đồ lớp cần ký hiệu kép (Màu sắc + Icon + Ký tự `✓/✕/⏱/📋`) để người khiếm thị màu hoặc giáo viên thao tác nhanh không bị nhầm lẫn. |
| **Dấu vết thiết kế dạng AI-generated** | `dashboard`, `announcements` | **Low** | Gradient dải màu vàng loang lổ (`bg-gradient-to-r`), biểu tượng Sparkle trang trí không rõ nghĩa ở trang đăng nhập. Cần chuyển sang thiết kế phẳng, gọn, tinh tế. |

---

## 2. CHI TIẾT ĐÁNH GIÁ TỪNG TRANG (PAGE-BY-PAGE AUDIT)

### 2.1. Trang Đăng nhập (`/login`)
- **Visual:** Bố cục 2 khối (Form đăng nhập + Tài khoản thử nghiệm 1-click).
- **Vấn đề:** 
  - Thẻ tài khoản thử nghiệm có icon `Sparkle` mang hơi hướng AI-generated.
  - Viền và shadow chưa đồng nhất với hệ thống `radius-xl`.
- **Cải thiện:** Làm gọn gàng card demo, phân nhóm rõ ràng "Quản trị viên" / "Giáo viên chủ nhiệm" / "Giáo viên bộ môn", dùng badge chuẩn.

### 2.2. Trang Tổng quan Lớp học (`/dashboard`)
- **Visual:** Header ngữ cảnh lớp học, 4 thẻ thống kê (Sĩ số, Chuyên cần, Chỗ ngồi, Thông báo), cột trái (Chuyên cần trong ngày, Xem nhanh 10 bàn), cột phải (Thông báo nổi bật, Thao tác nhanh).
- **Vấn đề:**
  - Class `metric-card` bị thiếu trong CSS khiến 4 thẻ thống kê mất định dạng nền/viền.
  - Banner GVBM dùng gradient lòe loẹt `from-amber-500/10 via-amber-500/5 to-transparent`.
- **Cải thiện:** Bổ sung CSS `.metric-card` với nền `var(--surface)`, border `var(--border)`, padding 20px, radius 12px; tinh giản banner vai trò GVBM sang dạng alert sạch sẽ, thực tế.

### 2.3. Danh sách Học sinh (`/students`)
- **Visual:** Bộ lọc tìm kiếm, giới tính, trạng thái, bảng danh sách có cột vị trí chỗ ngồi, nút Xuất Excel & In A4.
- **Vấn đề:**
  - Bộ lọc tìm kiếm và 2 dropdown giới tính/trạng thái dùng thẻ HTML thô, chưa có chevron icon đẹp mắt.
  - Trên mobile màn hình nhỏ, bảng table bị tràn ngang mà chưa có chỉ báo cuộn mượt.
- **Cải thiện:** Chuẩn hóa ô search với icon kính lúp canh chuẩn, select dùng icon mũi tên đồng bộ; thêm trạng thái hover nhẹ cho từng dòng.

### 2.4. Chi tiết Học sinh (`/students/[id]`)
- **Visual:** Breadcrumb quay lại, avatar chữ cái, 3 thẻ thông tin (Cá nhân, Chỗ ngồi & Bạn cùng bàn, Thống kê chuyên cần), sổ ghi chú giáo viên và lịch sử điểm danh.
- **Vấn đề:**
  - Các ô thống kê chuyên cần dùng class `bg-success-subtle/50` không tồn tại trong token.
  - Form thêm ghi chú giáo viên có nút bấm chưa chuẩn hóa kích thước.
- **Cải thiện:** Sử dụng token semantic nền mềm `var(--success-bg)`, `var(--danger-bg)`, `var(--warning-bg)`; tinh chỉnh textarea ghi chú và thời gian hiển thị.

### 2.5. Sơ đồ Chỗ ngồi (`/seating`)
- **Visual:** Bục giảng mô phỏng bảng đen, lưới 25 bàn (5 hàng × 5 dãy, mỗi bàn 2 ghế trái/phải), danh sách học sinh chưa xếp chỗ phía dưới.
- **Vấn đề:**
  - Bảng đen màu đen đậm `bg-zinc-800` hơi gắt so với phong cách light/calm của ứng dụng.
  - Thao tác chọn ghế để đổi chỗ (Click seat A → Click seat B) cần thanh trạng thái chỉ dẫn nổi bật hơn và viền ghế đang chọn phải rõ ràng, có animation nhẹ.
  - Nút gỡ học sinh khỏi ghế (dấu X đỏ) chỉ hiện khi hover chuột, trên thiết bị cảm ứng (tablet/mobile) không có thao tác hover nên khó bấm.
- **Cải thiện:** Cho phép bấm vào ghế mở menu hành động nhanh hoặc hiển thị nút thao tác rõ ràng trên touch screen; bảng đen điều chỉnh sang tone slate-neutral chuyên nghiệp.

### 2.6. Điểm danh (`/attendance`)
- **Visual:** Bộ chọn môn học (GVBM / GVCN), ngày điểm danh, nút "Tất cả có mặt", bảng danh sách 30 học sinh với 4 nút trạng thái (Có mặt / Vắng / Muộn / Phép) và ô ghi chú.
- **Vấn đề:**
  - 4 nút trạng thái chỉ dùng chữ "Có mặt", "Vắng", "Muộn", "Phép" mà thiếu biểu tượng thị giác; khi ấn chọn màu nền thay đổi nhưng chưa đủ tương phản cao.
  - Nút lưu điểm danh ở đầu trang và cuối trang cần trạng thái feedback loading / saving rõ ràng.
- **Cải thiện:** Bổ sung icon + màu sắc trực quan cho 4 nút trạng thái:
  - Có mặt: Xanh lá (`✓ Có mặt`)
  - Vắng: Đỏ (`✕ Vắng`)
  - Muộn: Cam hổ phách (`⏱ Muộn`)
  - Phép: Xám trung tính (`📋 Phép`)

### 2.7. Lịch sử Điểm danh (`/history`)
- **Visual:** Ma trận chuyên cần: Cột học sinh cố định (sticky), các cột ngày điểm danh, các cột tổng kết (Có mặt, Vắng, Tỷ lệ).
- **Vấn đề:**
  - Header cột ngày và cột sticky bên trái cần đổ bóng phân cách nhẹ khi cuộn ngang trên tablet/desktop nhỏ.
  - Bảng chú giải (Legend) giải thích ý nghĩa các ký hiệu `✓`, `V`, `M`, `P` chưa được bố trí nổi bật.
- **Cải thiện:** Bổ sung thanh chú giải ký hiệu rõ ràng; viền phân cách sticky column bóng mượt.

### 2.8. Bảng Thông báo (`/announcements`)
- **Visual:** Danh sách tin thông báo có nhãn "Ghim ưu tiên", modal tạo tin mới.
- **Vấn đề:**
  - Các thẻ thông báo thiếu sự phân cấp rõ giữa thông báo ghim và thông báo thường.
  - Checkbox ghim trong modal tạo tin chưa ăn khớp với design system.
- **Cải thiện:** Tin ghim có viền màu accent tinh tế và icon ghim nổi bật; checkbox và nút bấm đồng bộ.

### 2.9. Cài đặt Lớp học (`/settings`)
- **Visual:** Form thông số lớp (tên lớp, phòng, niên khóa, sĩ số, số bàn), trạng thái dữ liệu (Local Persistence), nút Đặt lại dữ liệu mẫu.
- **Vấn đề:**
  - Ô nhập số bàn hiển thị cho phép nhập nhưng lớp học THCS chuẩn hóa 25 bàn (50 chỗ). Cần có giải thích rõ ràng.
- **Cải thiện:** Bố cục lại theo thẻ rõ ràng: Cài đặt thông tin lớp → Trạng thái dữ liệu → Khu vực nguy hiểm (Danger Zone).

### 2.10. Admin Dashboard & Quản lý Lớp / Giáo viên (`/admin/*`)
- **Visual:** Thống kê quy mô trường (24 giáo viên, 16 lớp, 480 học sinh), modal phân công 10 môn học theo chuẩn GDPT, hồ sơ giáo viên.
- **Vấn đề:**
  - Sidebar Admin cũng bị lỗi không có menu mobile tương tự giáo viên.
  - Bảng danh sách lớp và giáo viên có mật độ thông tin cao nhưng chưa có empty state hướng dẫn người dùng khi tìm kiếm không ra kết quả.
- **Cải thiện:** Đồng bộ hệ thống Header Mobile, hoàn thiện Empty State và Badge trạng thái hoạt động/đã khóa.

---

## 3. THIẾT KẾ HỆ THỐNG GIAO DIỆN (DESIGN SYSTEM ENHANCEMENT)

### 3.1. Typography
- **Font chính:** `var(--font-geist-sans)`, hỗ trợ hoàn hảo tiếng Việt có dấu Unicode.
- **Font đơn khoảng:** `var(--font-geist-mono)` dùng cho Mã HS, Mã môn, Ngày tháng.
- **Phân cấp kiểu chữ (Type Scale):**
  - **Page Title:** `text-2xl (24px) | font-bold | tracking-tight | leading-tight`
  - **Section Heading:** `text-lg (18px) | font-semibold | tracking-tight`
  - **Card Title / Block Heading:** `text-sm (14px) | font-semibold`
  - **Body text:** `text-sm (14px) | font-normal | text-text-secondary`
  - **Caption / Meta / Footnote:** `text-xs (12px) | font-normal | text-text-muted`
  - **Badge / Tag:** `text-[11px] | font-medium`

### 3.2. Color Tokens (Bảng màu ngữ nghĩa)
```css
--bg:            oklch(0.98 0.003 240);  /* Nền trang nhẹ nhàng, thư thái */
--surface:       oklch(1 0 0);           /* Thẻ bề mặt trắng sáng */
--surface-muted: oklch(0.965 0.005 240); /* Nền thứ cấp */
--border:        oklch(0.89 0.006 240);  /* Đường kẻ tinh tế */
--border-strong: oklch(0.78 0.010 240);  /* Đường kẻ nhấn */

--text-primary:   oklch(0.18 0.010 240); /* Văn bản chính đậm nét */
--text-secondary: oklch(0.38 0.010 240); /* Văn bản bổ trợ */
--text-muted:     oklch(0.56 0.008 240); /* Placeholder, nhãn phụ */

--accent:        oklch(0.48 0.120 225);  /* Màu chủ đạo: Xanh ngọc biển giáo dục */
--accent-hover:  oklch(0.42 0.120 225);
--accent-subtle: oklch(0.955 0.030 225);

--success:       oklch(0.50 0.145 148);  /* Có mặt / Thành công / Đang học */
--success-bg:    oklch(0.96 0.040 148);
--warning:       oklch(0.62 0.140 70);   /* Đi muộn / Cảnh báo */
--warning-bg:    oklch(0.97 0.040 70);
--danger:        oklch(0.52 0.180 25);   /* Vắng mặt / Xóa / Khóa */
--danger-bg:     oklch(0.97 0.040 25);
--neutral-status: oklch(0.52 0.015 240); /* Có phép / Lưu trữ */
--neutral-bg:    oklch(0.95 0.005 240);
```

### 3.3. Bo góc & Đổ bóng (Border Radius & Elevation)
- **Radius chuẩn:**
  - Buttons, Inputs, Selects, Badges: `rounded-lg` (8px)
  - Cards, Tables, Metric Blocks: `rounded-xl` (12px)
  - Modals, Dialogs, Floating Sheets: `rounded-2xl` (16px)
- **Shadow:**
  - Flat UI tối giản, tận dụng đường viền `border` sạch sẽ.
  - Shadow chỉ dùng mức `shadow-xs` / `shadow-sm` cho card nổi và `shadow-lg` cho popover/dropdown/modal.

---

## 4. KẾ HOẠCH TRIỂN KHAI THEO CÁC PHASE

1. **Phase 1: Typography & Design Tokens (`globals.css`, `layout.tsx`)**  
   Khắc phục biến font Geist tiếng Việt, định nghĩa `.metric-card`, chuẩn hóa scale chữ và các class màu nền ngữ nghĩa.
2. **Phase 2: Shared Shell & Responsive Navigation (`sidebar.tsx`, `admin-sidebar.tsx`, `class-switcher.tsx`, layouts)**  
   Xây dựng Mobile Header có nút bấm mở Sidebar dạng drawer/overlay cho mobile & tablet, đảm bảo 100% không bị vỡ giao diện trên thiết bị di động.
3. **Phase 3: Shared Components Polish (`button.tsx`, `input.tsx`, `badge.tsx`, `modal.tsx`)**  
   Bổ sung hover/focus states, icon select, tương phản màu badge và dialog hủy/xác nhận.
4. **Phase 4: Dashboard & Student Pages Polish**  
   Hoàn thiện thẻ KPI, bảng học sinh, chi tiết học sinh với hệ thống phân cấp thị giác rõ rệt.
5. **Phase 5: Seating & Attendance Polish**  
   Tối ưu sơ đồ 25 bàn trực quan, thao tác click-to-swap mượt mà, bộ nút điểm danh 4 màu có biểu tượng rõ ràng, ma trận lịch sử có chú giải.
6. **Phase 6: Announcements, Settings & Admin Pages Polish**  
   Chuẩn hóa bảng thông báo, cài đặt thông số và quản lý giáo viên/lớp học.
7. **Phase 7: Quality Gate & Visual Verification**  
   Chạy `npx tsc --noEmit`, `npm test`, `npm run build` và kiểm tra trực quan trên trình duyệt.

---

## 5. KẾT QUẢ TRIỂN KHAI & ĐÁNH GIÁ NGHIỆM THU (COMPLETION & VERIFICATION REPORT)

Tất cả các giai đoạn đã được triển khai hoàn chỉnh và nghiệm thu đạt 100%:

### 5.1. Bảng kết quả khắc phục sự cố UI/UX

| Hạng mục kiểm toán | Hiện trạng ban đầu | Kết quả sau tinh chỉnh | Trạng thái |
| :--- | :--- | :--- | :---: |
| **Mobile Navigation & Viewport** | `.app-sidebar` cố định 220px khiến mobile bị ép co lại ~170px, vỡ toàn bộ trang | Đã tạo `MobileNav` component tích hợp sticky header + hamburger toggle + Drawer off-canvas với backdrop blur và nút đóng nhanh. Áp dụng cho cả Giáo viên và Quản trị viên. | **RESOLVED** |
| **Typography & Font Tiếng Việt** | Lỗi tên font `'Geist'` trong CSS không khớp biến Next.js Google font | Đã map `--font-sans: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` hiển thị mượt mà font Geist chuẩn hóa tiếng Việt có dấu. | **RESOLVED** |
| **Thẻ KPI `.metric-card`** | Class `.metric-card` bị thiếu khiến 4 card KPI trang dashboard mất nền, viền và padding | Bổ sung class `.metric-card` vào `globals.css` với nền `var(--surface)`, viền `var(--border)`, radius 12px, shadow nhẹ và spacing chuẩn mực. | **RESOLVED** |
| **Tokens & Semantic Colors** | Dùng màu ad-hoc loang lổ (`bg-gradient-to-r`, `indigo-50`, `amber-500/15`) | Chuyển đổi toàn bộ sang các token `@theme inline` (`surface-subtle`, `success-subtle`, `warning-subtle`, `danger-subtle`). 100% loại bỏ gradient thừa và hiệu ứng AI slop. | **RESOLVED** |
| **Trang Điểm danh (`/attendance`)** | 4 nút chỉ có text, thiếu biểu tượng thị giác | Nâng cấp bộ nút 4 trạng thái có biểu tượng kép + màu sắc tương phản cao: `✓ Có mặt` (Emerald), `✕ Vắng` (Rose), `⏱ Muộn` (Amber), `📋 Phép` (Slate). | **RESOLVED** |
| **Trang Sơ đồ lớp (`/seating`)** | Bảng đen màu đen kịt, thao tác đổi chỗ thiếu thanh chỉ dẫn | Bảng đen điều chỉnh tone slate phấn trắng chân thực; bổ sung thanh thông báo "Đang chọn bàn/ghế... Nhấp vào ghế khác để hoán đổi" kèm nút bấm "Hủy chọn". | **RESOLVED** |
| **Trang Lịch sử (`/history`)** | Thiếu chú giải các ký hiệu chuyên cần | Bổ sung thanh Status Legend ở đầu bảng giúp giáo viên và phụ huynh dễ dàng tra cứu ký hiệu `✓`, `V`, `M`, `P`. | **RESOLVED** |
| **Cài đặt Lớp học (`/settings`)** | Cho phép sửa số bàn trong khi quy chuẩn trường THCS cố định 25 bàn | Đã khóa (disable) ô `desk_count` và giải thích rõ quy chuẩn cố định 25 bàn (50 chỗ ngồi) theo mô hình THCS. | **RESOLVED** |
| **Shared Components Polish** | Nút bấm thiếu hiệu ứng đàn hồi, Modal bị tràn màn hình mobile | `Button` bổ sung `active:scale-[0.98]`; `Modal` bổ sung `max-h-[90dvh]` và `overflow-y-auto` chống tràn màn hình. | **RESOLVED** |

### 5.2. Kết quả Quality Gate

- **TypeScript (`npx tsc --noEmit`):** **0 errors** (Đạt chuẩn type-safety tuyệt đối).
- **Unit & Logic Tests (`npm test`):** **16/16 tests passed** (4/4 test suites: RBAC, Attendance, Teacher validation, Seating logic).
- **Production Build (`npm run build`):** **Compiled successfully** với Turbopack (Tất cả 17 routes app router đều được biên dịch thành công).

