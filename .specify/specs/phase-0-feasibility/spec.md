# Đặc Tả Kỹ Thuật (Spec) - Giai Đoạn 0: Kiểm Tra Khả Thi (Feasibility Check)

## 1. Mục Tiêu
Dựng một ứng dụng Electron tối thiểu với 2 khung xem (TikTok Live và Shopee Live) để kiểm chứng khả năng tiếp cận và phân tích dữ liệu trực tiếp trong môi trường Electron trên Windows.

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. **Khả năng tải trang**: Cả hai trang TikTok và Shopee hiển thị nội dung phòng live bình thường.
2. **Khả năng phát video**: Video live có tự động phát không, có cần tương tác nhấn chuột không.
3. **Quyền truy cập DOM thẻ `<video>`**: Script chạy trong context trang có lấy được phần tử `<video>` không.
4. **Khả năng trích xuất âm thanh**: Có thể kết nối Web Audio API (`AudioContext`, `createMediaElementSource`) khi tắt tiếng loa (`muted`) không.
5. **Khả năng chụp khung hình**: Dùng `webContents.capturePage()` hoặc canvas để lấy ảnh thu nhỏ (thumbnail 320px) mà không bị lỗi bảo mật (Tainted Canvas).
6. **Bảng kết quả**: Xuất bảng báo cáo tính năng làm được / không làm được trên từng nền tảng kèm giải pháp khắc phục.

## 3. Ràng Buộc Kỹ Thuật
- Chạy trên hệ điều hành Windows.
- Sử dụng Node.js v24 + Electron.
- Không bóc tách luồng, không vượt qua cơ chế bảo mật của nền tảng.

