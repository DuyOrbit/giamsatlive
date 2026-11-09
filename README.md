# Ứng Dụng Giám Sát Chất Lượng Livestream Đa Kênh (TikTok & Shopee)
> **Báo cáo thực tập CNTT** | **Bản Nâng Cấp: Bố Cục 2x6 (12 Ô) + Tập Trung AI Host Center Chuẩn Xác**

---

## 1. Giải thích về độ chuẩn xác của AI và những thay đổi theo yêu cầu

### A. "Những lỗi AI check có đang bị sai không?"
- **Phân tích thực tế:**
  Trong livestream bán hàng, host thường xuyên cúi người xuống bàn lấy hộp kem dưỡng, nghiêng người thử son lên tay, hoặc tạm thời lùi ra sau lấy đồ trong 2–3 giây.
  Nếu AI quét 1 khoảnh khắc tức thời (single frame) và báo lỗi ngay thì rất dễ bị **báo động giả (False Positive)**!
- **Giải pháp lọc mượt thời gian (Temporal Smoothing):**
  1. Tôi đã thiết lập thuật toán lọc mượt: Host phải ngồi lệch tâm **liên tục 3 lần quét (~10 giây)** thì hệ thống mới xác định là lỗi thực sự và phát cảnh báo!
  2. Hiển thị **độ lệch % thực tế** ngay trên nút đèn LED của từng ô (ví dụ: `CENTER: 4% (CHUẨN)` màu xanh, hoặc `LỆCH T: 22%` màu vàng). Bạn có thể nhìn thấy con số đo đạc thực tế của AI nhảy theo từng giây rất minh bạch!

### B. "Lỗi không có mặt host thì không cần đâu, tôi chỉ quan tâm nhiều đến host lệch center thôi":
- **Đã loại bỏ hoàn toàn cảnh báo "Phòng live bỏ trống (Không có host)"!**
- Khi host tạm thời đi lấy đồ hoặc máy quay chỉ quay cận cảnh sản phẩm, hệ thống chuyển sang trạng thái chờ `CENTER: CHỜ` và tuyệt đối **không phát chuông cảnh báo rác**.
- Hệ thống chỉ tập trung vào một việc quan trọng nhất: **Khi có mặt host, đo xem host có ngồi giữa khung hình không (ngưỡng lệch > 18%)**.

### C. Bổ sung Bố Cục 2x6 (2 hàng x 6 cột = 12 ô):
- Mặc định khởi động ở chế độ **`📐 Bố Cục: 2x6 (12 Ô)`**.
- Nút bấm trên thanh điều hướng cho phép bạn chuyển đổi vòng tròn mượt mà giữa 3 chế độ:
  1. **`2x6 (12 Ô)`**: Màn hình giám sát chuyên nghiệp cấp trung tâm điều hành (12 phòng live đồng thời).
  2. **`1x4 (4 Ô Dọc)`**: 1 hàng ngang 4 ô cao ráo, hoàn hảo cho livestream dọc.
  3. **`2x2 (4 Ô)`**: Lưới 4 ô vuông vắn truyền thống.
- Đã bổ sung sẵn danh sách 12 brand lớn vào `rooms.json` (CeraVe, La Roche-Posay, Maybelline, L'Oréal, Garnier, Coolmate, FPT Shop, CellphoneS, Unilever, Thế Giới Di Động, PNJ, Routine).

---

## 2. Cách chạy ứng dụng

1. Tắt app cũ đi.
2. Chạy lệnh:
   ```powershell
   npm start
   ```

3. **Quan sát:**
   - Màn hình hiển thị ngay **lưới 2x6 (12 phòng live)** cực kỳ hoành tráng!
   - Bấm nút **`📐 Bố Cục`** để đổi sang `1x4` hoặc `2x2`.
   - Quan sát đèn `CENTER`: hiển thị rõ con số `%` lệch tâm của host theo thời gian thực từ AI BlazeFace!

---

## 📦 Hướng Dẫn Đóng Gói & Mang Sang Máy Khác Sử Dụng (Portable)

Ứng dụng đã được tích hợp sẵn công cụ đóng gói thành bản **Portable (chạy ngay không cần cài đặt)**.

### 1. Lệnh đóng gói
Mở Terminal tại thư mục dự án và chạy:
```powershell
npm run package
```
Sau khoảng 10-15 giây, thư mục đóng gói sẽ xuất hiện tại:
👉 `dist/GiamSatLive-win32-x64/`

### 2. Cách mang sang máy khác (Laptop / Máy công ty)
1. **Nén thư mục:** Nhấp chuột phải vào thư mục `GiamSatLive-win32-x64` > chọn **Send to > Compressed (zipped) folder** (hoặc dùng WinRAR/7-Zip).
2. **Chuyển máy:** Copy file `.zip` vào USB hoặc tải lên Google Drive / gửi qua Zalo sang máy khác.
3. **Chạy ứng dụng:**
   - Trên máy khác, giải nén file `.zip`.
   - Nhấp đúp chuột vào file **`GiamSatLive.exe`** để mở ứng dụng chạy ngay!
   - **Lưu ý quan trọng:** Máy đích **KHÔNG CẦN cài đặt Node.js**, không cần chạy lệnh terminal nào cả.
4. **Chỉnh sửa danh sách phòng live:**
   - File cấu hình `rooms.json` nằm ngay cạnh file `GiamSatLive.exe`.
   - Bạn có thể nhấp chuột phải vào `rooms.json` > **Open with Notepad** để thêm/sửa link live của bất kỳ nhãn hàng nào mà không cần chạm vào code!
