# KỊCH BẢN QUAY VIDEO HOÀN CHỈNH

---

## Scene 1 — Giới thiệu tổng quan & Đăng nhập 1-Click

* **Time:** 00:00 – 00:45
* **Screen:** `http://localhost:3000/login`
* **Preparation:**
  * Khởi động server frontend (`npm run dev`).
  * Mở trình duyệt ở chế độ toàn màn hình (F11 hoặc zoom 100%), thanh URL sạch.
  * Đang ở trang `/login`. Nếu đang đăng nhập, hãy bấm Đăng xuất trước.

* **Actions:**
  1. Giữ chuột ở khu vực form đăng nhập, trỏ vào tiêu đề **SchoolOps — THCS Nguyễn Tất Thành**.
  2. Bấm vào nút mở rộng **"Chọn tài khoản thử nghiệm nhanh (Demo Personas)"**.
  3. Rê chuột lướt qua các vai trò: *Admin Hệ thống*, *GVCN & GVBM (Thầy Nguyễn Văn An)*, *Chỉ GVBM*, *GV chưa có lớp*, *Tài khoản bị khóa*.
  4. Bấm chọn thẻ **"Thầy Nguyễn Văn An"** (GVCN 6A1 + GVBM Toán).
  5. Form tự động điền email `an.nguyen@schoolops.local` và mật khẩu.
  6. Bấm nút **"Đăng nhập"**.

* **Expected result:**
  * Thông báo Toast màu xanh: *"Đăng nhập thành công!"*.
  * Hệ thống tự động chuyển hướng vào `/dashboard`.

* **Voice-over:**
  > "Xin chào thầy cô và các bạn. Hôm nay tôi xin giới thiệu SchoolOps — hệ thống quản lý lớp học và chuyên cần toàn diện, được thiết kế chuyên biệt cho mô hình các trường Trung học cơ sở tại Việt Nam theo chương trình giáo dục phổ thông mới.
  > 
  > Hệ thống hỗ trợ phân quyền chặt chẽ theo từng lớp học giữa Ban giám hiệu, Giáo viên chủ nhiệm và Giáo viên bộ môn. Để thuận tiện cho việc trải nghiệm, hệ thống tích hợp sẵn các tài khoản demo chuẩn sư phạm. Đầu tiên, chúng ta sẽ đăng nhập với vai trò của Thầy Nguyễn Văn An — Giáo viên chủ nhiệm lớp 6A1 kiêm Giáo viên bộ môn Toán."

* **Highlight:** Danh sách Demo Personas tích hợp ngay trên màn hình đăng nhập, thao tác 1-click tiện lợi.
* **Transition:** Chuyển sang màn hình Dashboard của Giáo viên.

---

## Scene 2 — Tổng quan lớp học (Teacher Dashboard)

* **Time:** 00:45 – 01:30
* **Screen:** `http://localhost:3000/dashboard`
* **Preparation:** Đã đăng nhập tài khoản Thầy Nguyễn Văn An, lớp đang chọn là **Lớp 6A1**.

* **Actions:**
  1. Trỏ chuột vào thanh Header: hiển thị tên trường *THCS Nguyễn Tất Thành*, năm học *2026 - 2027*, vai trò *GVCN*.
  2. Rê chuột qua 4 thẻ thống kê đầu trang:
     * **Sĩ số:** 30 học sinh
     * **Có mặt:** hiển thị số lượng học sinh hiện diện hôm nay
     * **Vắng:** số học sinh vắng có phép / không phép
     * **Ghế trống:** tình trạng lấp đầy chỗ ngồi trong lớp
  3. Cuộn nhẹ xuống widget **"Tiết học hiện tại"** và **"Lịch học hôm nay"**:
     * Trỏ vào thông tin tiết học theo thời gian thực (Buổi sáng, môn học, giáo viên phụ trách).
  4. Rê chuột qua phần **"Thông báo lớp học"** và danh sách học sinh cần chú ý.

* **Expected result:**
  * Các chỉ số hiển thị trực quan, có màu sắc rõ ràng (xanh lá cho có mặt, đỏ cho vắng, vàng cho muộn).
  * Lịch học hôm nay hiển thị đúng 5 tiết buổi sáng của khối 6.

* **Voice-over:**
  > "Khi đăng nhập vào hệ thống, Giáo viên chủ nhiệm sẽ được đưa đến bảng điều khiển trung tâm của lớp mình. Tại đây, thầy cô có thể nắm bắt ngay sĩ số lớp 30 học sinh, tỷ lệ chuyên cần trong ngày, số ghế trống hiện tại và thông báo nội bộ.
  > 
  > Đặc biệt, hệ thống tích hợp widget nhận diện tiết học thời gian thực, cho biết hiện tại lớp đang học tiết mấy, môn gì và do thầy cô nào giảng dạy. Phía dưới là thời khóa biểu chi tiết của ngày hôm nay cùng danh sách học sinh vắng học để giáo viên kịp thời nắm bắt."

* **Highlight:** Giao diện trực quan, nắm bắt toàn bộ tình hình lớp học chỉ trong 5 giây đầu ngày.
* **Transition:** Bấm vào mục "Học sinh" trên thanh menu bên trái.

---

## Scene 3 — Quản lý Học sinh & Thẻ Liên lạc Phụ huynh

* **Time:** 01:30 – 02:30
* **Screen:** `http://localhost:3000/students`
* **Preparation:** Đang ở danh sách học sinh Lớp 6A1.

* **Actions:**
  1. Tại thanh công cụ, gõ chữ `"Nguyễn"` vào ô tìm kiếm để thấy danh sách lọc theo thời gian thực. Xóa ô tìm kiếm.
  2. Bấm vào bộ lọc **Giới tính** $\rightarrow$ chọn **"Nữ"**, sau đó chọn lại **"Tất cả"**.
  3. Trỏ vào cột **Ghế ngồi**: Cho thấy mỗi học sinh đều được gắn với một vị trí bàn ghế cụ thể trong lớp (ví dụ: Bàn 1 - Ghế T).
  4. Bấm vào biểu tượng con mắt (Xem chi tiết) của học sinh đầu tiên (em **Nguyễn Văn An** hoặc bất kỳ em nào) để mở trang `/students/[id]`.
  5. Tại trang chi tiết học sinh:
     * Xem thông tin cá nhân và vị trí ghế ngồi.
     * Cuộn đến phần **"Thông tin phụ huynh"**, bấm vào nút **"Soạn tin nhắn phụ huynh"**.
     * Modal mở ra: Chọn mẫu tin nhắn *"Thông báo vắng học"* hoặc *"Nhắc nhở học tập"*. Nội dung mẫu tự động điền tên học sinh, lớp, ngày tháng chuẩn mực.
     * Bấm **"Sao chép tin nhắn"** $\rightarrow$ Toast hiển thị đã copy. Đóng modal.
  6. Cuộn xuống phần **"Ghi chú sư phạm"**: Nhập nội dung: `"Học sinh tích cực phát biểu xây dựng bài môn Toán"` $\rightarrow$ Bấm **"Thêm ghi chú"**.
  7. Bấm nút **"Quay lại danh sách"** ở góc trên bên trái.

* **Expected result:**
  * Bảng dữ liệu tìm kiếm và lọc tức thì không cần tải lại trang.
  * Modal soạn tin nhắn phụ huynh hiển thị nội dung chuyên nghiệp, sẵn sàng gửi Zalo/SMS.
  * Ghi chú sư phạm được thêm vào dòng thời gian với ngày giờ và người tạo.

* **Voice-over:**
  > "Tiếp theo là phân hệ Quản lý học sinh. Danh sách 30 học sinh của lớp được quản lý chặt chẽ với mã số học sinh, ngày sinh, số điện thoại phụ huynh và vị trí chỗ ngồi thực tế. Thầy cô có thể tìm kiếm nhanh, lọc theo giới tính hoặc xuất ra file Excel chỉ với một cú click.
  > 
  > Khi bấm vào chi tiết một học sinh, giáo viên có thể xem hồ sơ toàn diện: lịch sử chuyên cần cá nhân, vị trí bàn học và nhật ký ghi chú sư phạm.
  > 
  > Một điểm cộng lớn là tính năng Soạn tin nhắn phụ huynh thông minh: hệ thống đã chuẩn bị sẵn các mẫu tin nhắn chuẩn mực như thông báo vắng học, khen thưởng hay nhắc nhở nề nếp. Thầy cô chỉ cần bấm sao chép và gửi ngay qua Zalo hoặc tin nhắn cho phụ huynh học sinh."

* **Highlight:** Trải nghiệm liên lạc phụ huynh và ghi chú học sinh cá nhân hóa.
* **Transition:** Bấm vào mục "Chỗ ngồi" trên menu bên trái.

---

## Scene 4 — Sơ đồ lớp tương tác (Click-to-Swap & Attendance Overlay)

* **Time:** 02:30 – 03:30
* **Screen:** `http://localhost:3000/seating`
* **Preparation:** Đang ở trang sơ đồ lớp 6A1.

* **Actions:**
  1. Trình bày tổng thể phòng học: Chỉ rõ bục giảng, bảng đen, bàn giáo viên và 4 dãy bàn học đôi (20 bàn = 40 chỗ ngồi).
  2. Bấm vào nút chuyển góc nhìn: **"Nhìn từ bục giảng"** (nút có icon con mắt/mũi tên). Sơ đồ lập tức đảo chiều giúp giáo viên đứng trên bục giảng nhìn xuống đúng vị trí học sinh. Bấm chuyển lại góc nhìn **"Nhìn từ cuối lớp"**.
  3. Thực hiện thao tác **Hoán đổi chỗ ngồi (Click-to-Swap)**:
     * Click vào học sinh ở Bàn 1 Ghế Trái $\rightarrow$ Ghế được viền vàng nổi bật (pulsing highlight).
     * Click vào học sinh ở Bàn 2 Ghế Phải $\rightarrow$ Hai học sinh lập tức đổi vị trí cho nhau, kèm thông báo toast: *"Đã hoán đổi chỗ ngồi thành công!"*.
  4. Bật công tắc **"Lớp phủ chuyên cần" (Attendance Overlay)**:
     * Trên từng ghế ngồi của học sinh lập tức xuất hiện chấm trạng thái chuyên cần hôm nay: Xanh lá (Có mặt), Đỏ (Vắng), Cam (Đi muộn).
     * Trỏ chuột vào một ghế màu đỏ để thấy tên học sinh vắng.
  5. Bấm vào nút **"In sơ đồ"**: Hộp thoại in hiện lên hoặc hiển thị bản xem trước in chuẩn khổ A4 ngang, có sẵn thông tin trường, lớp, tên GVCN và dòng chữ ký. Bấm Cancel hộp thoại in.

* **Expected result:**
  * Thao tác swap ghế mượt mà, không giật lag.
  * Góc nhìn đảo chiều tức thì.
  * Lớp phủ chuyên cần biến sơ đồ thành bản đồ nhiệt điểm danh trực quan.

* **Voice-over:**
  > "Một trong những tính năng nổi bật và tiện dụng nhất của SchoolOps là Sơ đồ chỗ ngồi tương tác. Giao diện mô phỏng chân thực phòng học với bục giảng, bảng viết và 4 dãy bàn đôi.
  > 
  > Thầy cô có thể linh hoạt chuyển đổi giữa hai góc nhìn: 'Nhìn từ cuối lớp' hoặc 'Nhìn từ bục giảng' xuống lớp — vị trí này được lưu tự động trên trình duyệt. Để đổi chỗ hai học sinh, thầy cô chỉ cần click vào ghế thứ nhất, click tiếp vào ghế thứ hai là xong — thao tác Click-to-Swap cực kỳ tự nhiên, mượt mà trên cả máy tính lẫn máy tính bảng.
  > 
  > Đặc biệt, khi bật chế độ 'Lớp phủ chuyên cần', sơ đồ chỗ ngồi sẽ hiển thị trực tiếp học sinh nào đang có mặt, em nào vắng học hay đi muộn bằng mã màu sắc. Giáo viên chỉ cần liếc nhìn là biết chính xác bàn nào đang trống ghế mà không cần dò tên từng em trong sổ. Sơ đồ cũng sẵn sàng để in ra khổ giấy A4 dán tại bàn giáo viên."

* **Highlight:** Click-to-Swap trực quan, đảo góc nhìn sư phạm và lớp phủ chuyên cần trên ghế ngồi.
* **Transition:** Bấm vào mục "Điểm danh" trên menu bên trái.

---

## Scene 5 — Điểm danh thông minh & Báo cáo Ban Giám hiệu

* **Time:** 03:30 – 04:30
* **Screen:** `http://localhost:3000/attendance`
* **Preparation:** Đang ở trang Điểm danh của lớp 6A1.

* **Actions:**
  1. Trỏ vào banner nhận diện: Hệ thống tự động chọn ngày hiện tại và ca học hiện tại.
  2. Rê chuột qua thanh thống kê tổng hợp: Sĩ số (30), Có mặt, Vắng có phép (E), Vắng không phép (A), Đi muộn (L).
  3. Bấm vào nút hành động nhanh: **"Điểm danh nhanh: Tất cả có mặt"** $\rightarrow$ Toàn bộ học sinh được tick xanh trạng thái Có mặt.
  4. Chọn ngẫu nhiên 1 học sinh (ví dụ học sinh thứ 3):
     * Bấm vào nút **Vắng có phép (E - màu vàng)**.
     * Nhập lý do vào ô ghi chú: `"Phụ huynh xin nghỉ ốm"`.
  5. Chọn tiếp 1 học sinh khác: Bấm nút **Đi muộn (L - màu cam)**, ghi chú: `"Muộn 10 phút"`.
  6. Bấm nút **"Lưu thay đổi"** ở góc phải $\rightarrow$ Toast xanh thông báo lưu thành công.
  7. Bấm nút **"Sao chép báo cáo BGH"**:
     * Toast hiện: *"Đã sao chép báo cáo điểm danh vào clipboard!"*.
     * Mở nhanh một ứng dụng Notepad hoặc dán vào ô tìm kiếm để người xem nhìn thấy nội dung text vừa copy: `BÁO CÁO ĐIỂM DANH - LỚP 6A1 - NGÀY 25/09/2026: Sĩ số: 30 | Có mặt: 28 | Vắng: 1 (Phép) | Muộn: 1...`
  8. Bấm sang tab menu **"Lịch sử"** (`/history`):
     * Lướt qua ma trận chuyên cần dạng bảng lưới (Học sinh × Các ngày trong tháng).
     * Trỏ vào cột tỷ lệ chuyên cần (%) và danh sách cảnh báo học sinh vắng trên 3 buổi.
     * Bấm nút **"Xuất Excel"** $\rightarrow$ File `.xlsx` được tải xuống ngay lập tức.

* **Expected result:**
  * Điểm danh 4 trạng thái linh hoạt, chuẩn nghiệp vụ trường học.
  * Báo cáo BGH sao chép 1-click chuẩn định dạng tin nhắn.
  * Ma trận lịch sử tổng hợp tự động, xuất file Excel tiếng Việt đầy đủ dấu.

* **Voice-over:**
  > "Tiếp theo là nghiệp vụ quan trọng mỗi ngày: Điểm danh chuyên cần. Hệ thống thông minh tự động nhận diện ca học và cho phép giáo viên 'Điểm danh nhanh cả lớp có mặt' chỉ với một nút bấm. Với những em vắng hoặc đi muộn, thầy cô chỉ việc chuyển trạng thái tương ứng và nhập lý do vắng phép.
  > 
  > Sau khi lưu điểm danh, giáo viên chỉ cần bấm 'Sao chép báo cáo BGH' — toàn bộ số liệu sẽ được định dạng sẵn thành tin nhắn ngắn gọn, đầy đủ tên học sinh vắng và lý do để thầy cô dán ngay vào nhóm Zalo báo cáo cho Ban Giám hiệu trường.
  > 
  > Ngoài ra, trang Lịch sử chuyên cần cung cấp ma trận điểm danh toàn diện theo từng ngày trong tháng, tự động tính tỷ lệ chuyên cần và làm nổi bật các trường hợp học sinh có nguy cơ vắng nhiều, kèm chức năng xuất báo cáo Excel hoàn chỉnh."

* **Highlight:** Tốc độ điểm danh, nút copy báo cáo BGH gửi Zalo tiện ích và ma trận lịch sử chuyên cần.
* **Transition:** Hướng chuột lên góc trên thanh Sidebar/Header tại mục Class Switcher.

---

## Scene 6 — Phân quyền theo ngữ cảnh (Context-Aware RBAC Switcher)

* **Time:** 04:30 – 05:30
* **Screen:** Thanh Class Switcher ở Sidebar $\rightarrow$ chuyển sang Lớp 6A2
* **Preparation:** Vẫn đang trong phiên đăng nhập của Thầy Nguyễn Văn An.

* **Actions:**
  1. Bấm vào bộ chọn lớp **Class Switcher** trên thanh điều hướng bên trái.
  2. Bảng chọn mở ra: Thấy rõ danh sách gồm **Lớp 6A1 (GV Chủ nhiệm · Toán)** và các lớp bộ môn: **Lớp 6A2 (GV Bộ môn · Toán)**, **7A1**, **7A2**.
  3. Bấm chọn **"Lớp 6A2"**.
  4. Quan sát sự thay đổi trên giao diện:
     * Header chuyển sang: *"Chế độ GVBM (Toán)"* với banner màu ngọc (Teal).
     * Trên menu bên trái, các mục *Học sinh*, *Chỗ ngồi*, *Thời khóa biểu*, *Thông báo* tự động xuất hiện thêm huy hiệu **"Xem"** (Chỉ đọc).
     * Mục *Điểm danh* đổi tên thành: **"Điểm danh (Toán)"**.
  5. Bấm vào trang **"Học sinh"** (`/students`): Nút "Thêm học sinh", "Xóa", "Sửa" hoàn toàn bị ẩn, giáo viên chỉ được tra cứu thông tin.
  6. Bấm vào trang **"Chỗ ngồi"** (`/seating`): Thông báo chế độ xem chỉ đọc xuất hiện, không thể swap ghế học sinh của lớp thầy cô không chủ nhiệm.
  7. Bấm vào trang **"Điểm danh"** (`/attendance`): Chỉ được phép chọn môn Toán để điểm danh theo tiết phân công.

* **Expected result:**
  * Quyền hạn thay đổi động ngay lập tức theo lớp được chọn mà không cần đăng nhập lại.
  * Phân biệt rành mạch giữa quyền hạn GVCN (toàn quyền lớp mình) và GVBM (chỉ xem nề nếp và chỉ điểm danh môn mình dạy).

* **Voice-over:**
  > "Một trong những điểm mạnh cốt lõi về mặt kỹ thuật của SchoolOps là cơ chế Phân quyền theo ngữ cảnh lớp học — Context-Aware RBAC.
  > 
  > Thầy Nguyễn Văn An là GVCN của lớp 6A1 nhưng đồng thời là giáo viên dạy môn Toán ở lớp 6A2. Khi thầy An chuyển sang lớp 6A2 qua bộ chọn lớp, toàn bộ giao diện lập tức thích ứng: thanh điều hướng xuất hiện các huy hiệu 'Xem' chỉ đọc, các nút thêm sửa xóa học sinh hay hoán đổi sơ đồ chỗ ngồi bị ẩn đi để bảo vệ dữ liệu của GVCN lớp bạn.
  > 
  > Thầy An chỉ có quyền điểm danh duy nhất môn Toán mà mình được phân công giảng dạy. Tính năng này giải quyết triệt để bài toán chồng chéo quyền hạn trong trường phổ thông."

* **Highlight:** Cơ chế Context-Aware RBAC thông minh, giao diện tự thích ứng theo từng lớp học.
* **Transition:** Bấm nút "Đăng xuất" ở góc dưới sidebar $\rightarrow$ quay lại màn hình Login.

---

## Scene 7 — Không gian Quản trị Toàn trường (Admin Executive Portal)

* **Time:** 05:30 – 06:45
* **Screen:** `http://localhost:3000/login` $\rightarrow$ `http://localhost:3000/admin/dashboard`
* **Preparation:** Ở trang Login, mở danh sách tài khoản demo.

* **Actions:**
  1. Bấm mở danh sách Demo Accounts $\rightarrow$ Click chọn **"Admin Hệ thống"** (`admin@schoolops.local` / `admin`).
  2. Bấm **"Đăng nhập"** $\rightarrow$ Hệ thống chuyển vào `/admin/dashboard`.
  3. Trình bày tổng thể màn hình Admin Dashboard:
     * Logo màu xanh lá đậm: **Admin Portal — Trường THCS Nguyễn Tất Thành**.
     * 4 thẻ KPI vĩ mô: **16 Lớp học**, **480 Học sinh**, **24 Giáo viên**, **Tỷ lệ chuyên cần toàn trường**.
  4. Trỏ vào biểu đồ tỷ lệ chuyên cần theo 4 khối lớp: Khối 6, Khối 7, Khối 8, Khối 9.
  5. Cuộn xuống phần bảng tổng hợp bên dưới:
     * Chuyển tab giữa **"Danh sách Lớp học (16 lớp)"** và **"Danh sách Giáo viên (24 GV)"**.
     * Lọc nhanh theo Khối 6, Khối 9 để thấy phân ca sáng / chiều.
  6. Rê chuột vào widget **"Kiểm định Thời khóa biểu toàn trường"**: Hiển thị trạng thái kiểm định tính hợp lệ của toàn bộ 160 tiết học trong tuần.

* **Expected result:**
  * Bảng điều khiển quản trị trường học quy mô lớn, dữ liệu tải tức thì.
  * Phản ánh chính xác toàn bộ 16 lớp THCS và 480 học sinh.

* **Voice-over:**
  > "Bây giờ, chúng ta sẽ chuyển sang góc nhìn của Ban Giám hiệu nhà trường bằng cách đăng nhập vào tài khoản Admin Hệ thống.
  > 
  > Tại Admin Dashboard, Ban Giám hiệu có một bức tranh toàn cảnh về hoạt động vận hành của toàn trường: tổng số 16 lớp từ khối 6 đến khối 9, 480 học sinh và 24 cán bộ giáo viên.
  > 
  > Các chỉ số chuyên cần được tổng hợp theo thời gian thực cho từng khối lớp, giúp nhà trường phát hiện ngay những lớp có tỷ lệ vắng bất thường. Bên dưới là bảng quản lý chi tiết 16 lớp học và phân công chuyên môn của 24 thầy cô giáo."

* **Highlight:** Bảng điều khiển quản trị vĩ mô dành riêng cho Ban Giám hiệu trường THCS.
* **Transition:** Bấm vào mục "Quản lý Giáo viên" trên thanh menu Admin bên trái.

---

## Scene 8 — Quản lý Giáo viên & Ràng buộc sư phạm (2-Grade Limit)

* **Time:** 06:45 – 07:30
* **Screen:** `http://localhost:3000/admin/teachers`
* **Preparation:** Đang ở trang Quản lý giáo viên của Admin.

* **Actions:**
  1. Rê chuột qua danh sách 24 giáo viên: Hiển thị đầy đủ Họ tên, Bộ môn chính, Lớp chủ nhiệm, Các lớp giảng dạy bộ môn và Trạng thái.
  2. Bấm nút **"Xem chi tiết"** (icon con mắt) của một giáo viên (ví dụ Cô Trần Thị Bích - Môn Ngữ văn).
  3. Modal chi tiết mở ra: Hiển thị danh sách các lớp đang dạy kèm huy hiệu Khối học (Khối 6, Khối 7).
  4. Trỏ chuột vào nhãn ghi chú nghiệp vụ sư phạm: **"Quy định THCS: Giáo viên được phân công tối đa 2 khối học"**.
  5. Giới thiệu thao tác quản trị tài khoản:
     * Nút **"Khóa tài khoản"** / **"Mở khóa"** (Toggle User Status).
     * Nút **"Đặt lại mật khẩu"** (Reset Password về mặc định).
  6. Đóng modal.

* **Expected result:**
  * Danh sách giáo viên chuẩn hóa, phân bổ đầy đủ 10 môn học.
  * Ràng buộc logic sư phạm hiển thị minh bạch.

* **Voice-over:**
  > "Tại phân hệ Quản lý Giáo viên, nhà trường quản trị danh sách 24 thầy cô trong hội đồng sư phạm. Hệ thống áp dụng nghiêm ngặt quy định chuyên môn THCS: mỗi giáo viên bộ môn chỉ được phân công giảng dạy tại tối đa 2 khối học để đảm bảo chất lượng chuyên môn sư phạm.
  > 
  > Quản trị viên có thể theo dõi chi tiết từng lớp dạy, phân công chủ nhiệm, cấp lại mật khẩu hoặc khóa tài khoản khi có giáo viên chuyển công tác."

* **Highlight:** Ràng buộc nghiệp vụ sư phạm THCS (tối đa 2 khối/giáo viên) được cài đặt trực tiếp trong hệ thống.
* **Transition:** Bấm vào mục "Quản lý Thời khóa biểu" trên menu Admin.

---

## Scene 9 — Quản lý Thời khóa biểu & Công cụ Audit phát hiện xung đột

* **Time:** 07:30 – 08:30
* **Screen:** `http://localhost:3000/admin/timetable`
* **Preparation:** Đang ở trang Thời khóa biểu Admin.

* **Actions:**
  1. Trình bày lưới Thời khóa biểu: Chọn lớp xem từ 6A1 đến 9A4, phân chia rõ ràng **Ca sáng (Tiết 1 - 5 cho Khối 6, 9)** và **Ca chiều (Tiết 6 - 10 cho Khối 7, 8)**.
  2. Trỏ vào các tiết cố định theo quy định trường học:
     * Tiết 1 sáng Thứ Hai: **Chào cờ toàn trường**.
     * Tiết 5 sáng Thứ Bảy: **Sinh hoạt lớp**.
  3. Bấm vào nút nổi bật trên thanh công cụ: **"Kiểm tra xung đột toàn trường" (Audit Timetable)**.
  4. Hệ thống chạy thuật toán quét tự động toàn bộ 16 lớp học:
     * Bảng báo cáo Audit mở ra: Hiển thị kết quả kiểm định: *Không có xung đột trùng giáo viên* hoặc liệt kê chi tiết các vi phạm nếu có.
  5. Bấm vào nút **"Xuất Báo cáo Toàn trường" (4-Sheet Master Excel Export)** trên thanh công cụ:
     * File Excel `Bao_Cao_Tong_Hop_THCS_Nguyen_Tat_Thanh.xlsx` được tải về.
     * Mở file (hoặc giới thiệu cấu trúc 4 sheet): Sheet 1 - Tổng quan trường học, Sheet 2 - Danh sách 16 Lớp, Sheet 3 - Đội ngũ 24 Giáo viên, Sheet 4 - Ma trận Chuyên cần toàn trường.

* **Expected result:**
  * Thuật toán Audit quét toàn bộ ma trận thời khóa biểu cực nhanh.
  * Xuất file Master Excel 4 sheet hoàn chỉnh, chuẩn báo cáo nộp Phòng Giáo dục.

* **Voice-over:**
  > "Quản lý Thời khóa biểu là một trong những bài toán phức tạp nhất của trường học. SchoolOps giải quyết triệt để vấn đề này với engine tự động kiểm tra xung đột giáo viên.
  > 
  > Thời khóa biểu được thiết kế chuẩn theo 2 ca: Khối 6 và 9 học ca sáng, Khối 7 và 8 học ca chiều, khóa cố định tiết Chào cờ đầu tuần và Sinh hoạt cuối tuần.
  > 
  > Khi bấm 'Kiểm tra xung đột', hệ thống sẽ quét chéo toàn bộ 16 lớp để đảm bảo không có bất kỳ giáo viên nào bị xếp trùng 2 tiết tại cùng một thời điểm. Cuối cùng, Ban Giám hiệu có thể xuất Báo cáo tổng hợp trường học 4 sheet Excel chuẩn form báo cáo gửi Phòng Giáo dục & Đào tạo."

* **Highlight:** Timetable Audit Engine tự động phát hiện xung đột và tính năng xuất file Master Excel 4 sheet.
* **Transition:** Chuyển sang màn hình Dashboard hoặc giữ nguyên để kết thúc.

---

## Scene 10 — Tổng kết & Kết thúc video (Closing)

* **Time:** 08:30 – 09:00
* **Screen:** `http://localhost:3000/admin/dashboard`
* **Preparation:** Trở về trang Dashboard tổng quan của Admin.

* **Actions:**
  1. Rê chuột nhẹ trên giao diện Dashboard toàn trường.
  2. Bấm Đăng xuất đưa về màn hình chính hoặc giữ khung hình đẹp nhất của hệ thống.

* **Expected result:** Giao diện sắc nét, chỉn chu, kết thúc video chuyên nghiệp.

* **Voice-over:**
  > "Tổng kết lại, SchoolOps là một giải pháp quản lý trường học toàn diện, hiện đại và chuẩn mực sư phạm. Dự án được xây dựng với Next.js 16 App Router, TypeScript chặt chẽ, hệ thống phân quyền theo ngữ cảnh linh hoạt và 110 automated tests đảm bảo độ tin cậy tuyệt đối.
  > 
  > Cảm ơn thầy cô và các bạn đã theo dõi video demo. Mọi thông tin chi tiết và mã nguồn dự án được đính kèm ở phần mô tả bên dưới."

* **Highlight:** Đúc kết giá trị thực tế của sản phẩm và lời cảm ơn chuyên nghiệp.
* **Transition:** Fade out màn hình kết thúc.