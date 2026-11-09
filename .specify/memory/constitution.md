# Dự án: Giám Sát Chất Lượng Livestream (TikTok & Shopee)
## Bản Hiến Chương Dự Án (Constitution)

### Nguyên Tắc Cốt Lõi

1. **Code Đơn Giản & Thân Thiện Với Người Học (Student-First Code)**
   - Viết code JavaScript/Node.js sạch, dễ hiểu, tránh các kỹ thuật metaprogramming phức tạp.
   - 100% hàm và biến nghiệp vụ phải có tên tường minh, chú thích (comment) chi tiết bằng tiếng Việt.
   - Không chuyển sang giai đoạn sau khi người dùng chưa xác nhận giai đoạn trước chạy ổn định.

2. **Tuân Thủ Tuyệt Đối Ràng Buộc Nền Tảng (No Bypassing / White-Box Only)**
   - Ứng dụng chỉ đóng vai trò người xem thông thường (WebContentsView / BrowserView trong Electron).
   - Tuyệt đối KHÔNG tải, bóc tách luồng, can thiệp DRM hay vượt cơ chế bảo vệ của TikTok/Shopee.
   - Nếu gặp hạn chế kỹ thuật (CORS, Tainted Canvas, Autoplay, DRM), báo cáo trung thực và đề xuất giải pháp thay thế hợp lệ.

3. **Tiết Kiệm Tài Nguyên (Resource Efficiency)**
   - Ứng dụng chạy trên máy tính cấu hình trung bình.
   - Xử lý hình ảnh ở độ phân giải thấp (khoảng 320px).
   - Tối ưu hóa chu kỳ quét (Round-robin) thay vì phân tích đồng thời liên tục tất cả các luồng.

4. **Báo Cáo Nghiệm Thu Từng Giai Đoạn**
   - Mỗi giai đoạn phải có hướng dẫn cách cài, cách chạy, cách kiểm tra thực tế và danh sách giới hạn đã biết.

**Môi Trường Thực Thi**: Windows, Node.js v24+, Electron.

