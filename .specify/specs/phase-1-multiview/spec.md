# Đặc Tả Tính Năng Toàn Diện (Full Specification)
## Dự án: Hệ Thống Giám Sát Livestream Bán Hàng Đa Kênh

### 1. Danh Sách Tính Năng Được Phê Duyệt (Scope)

#### A. Quản Lý Phòng Live (Multiview & Cấu Hình)
- Đọc cấu hình từ `rooms.json` (danh sách brand, nền tảng TikTok/Shopee, URL live).
- Hiển thị dạng lưới tự động chia ô (Grid: 1x2, 2x2...).
- Mỗi ô có nhãn Brand + Nền tảng + Nút bật tiếng / phóng to (Zoom in/out).
- Mặc định tắt tiếng toàn bộ loa (Muted), chỉ bật tiếng khi click chọn 1 ô.

#### B. Giám Sát Âm Thanh (Audio Monitoring - Không Cần Phát Ra Loa)
- **Mất tiếng (Silence Detection):** Mức RMS < ngưỡng trong > 5 giây.
- **Rè tiếng / Vỡ tiếng (Clipping Detection):** Mức Peak đạt ngưỡng tối đa (0dB / 1.0) liên tục.
- **Nhạc nền quá to át tiếng host (BGM vs Vocal Imbalance):** Phân tích năng lượng dải tần giọng nói (Vocal 300Hz-3.4kHz) so với dải trầm (Bass < 200Hz).

#### C. Giám Sát Hình Ảnh (Computer Vision - Thu Nhỏ 320px Tiết Kiệm CPU)
- **Host ngồi lệch tâm (Center Alignment):** Tâm khuôn mặt lệch khỏi tâm màn hình > 15% chiều rộng liên tục > 5s.
- **Đầu đụng banner/chữ (Safe Zone / Top Banner Collision):** Đỉnh đầu lọt vào vùng an toàn 15% mép trên màn hình.
- **Phòng live bỏ trống (Empty Room Alert):** Không phát hiện khuôn mặt/người trong > 30 giây (tránh bị TikTok phạt live tĩnh).
- **Hình mờ out-focus:** Độ sắc nét (Laplacian variance) tụt thấp hơn ngưỡng tiêu chuẩn của phòng.
- **Độ sáng bất thường (Lighting Check):** Độ sáng trung bình (Luminance) < 40 (quá tối) hoặc > 220 (cháy sáng).
- **Đứng hình / Treo live (Freeze Frame Detection):** So sánh độ chênh lệch điểm ảnh (Frame Difference) giữa 2 frame liên tiếp, nếu giống nhau 100% trong > 5s.

#### D. Tối Ưu Hóa & Báo Cáo
- **Quét luân phiên (Round-Robin):** Quét N phòng/lượt trong T giây để máy trung bình không quá tải.
- **Ghi nhật ký (Alert Logs) & Xuất CSV:** Xuất log có mốc thời gian và đo CPU/RAM để phục vụ viết báo cáo thực tập.

---
**Phiên bản đặc tả:** 1.1 | **Trạng thái:** Đã chốt yêu cầu nghiệp vụ

