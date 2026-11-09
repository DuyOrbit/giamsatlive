// ====================================================================
// preload.js - Cầu nối giao tiếp an toàn giữa Giao diện (HTML) và Main
// Dự án: Giám Sát Livestream Bán Hàng Đa Kênh
// ====================================================================

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Lấy danh sách các phòng live hiện tại
  layDanhSachPhong: () => ipcRenderer.invoke('lay-danh-sach-phong'),

  // Đồng bộ tọa độ pixel chính xác từ HTML xuống cho WebContentsView
  dongBoToaDoViews: (danhSachToaDo) => ipcRenderer.send('dong-bo-toa-do-views', danhSachToaDo),

  // Thêm một phòng live mới từ đường link dán vào
  themPhongMoi: (phongData) => ipcRenderer.send('them-phong-moi', phongData),

  // Xóa một phòng live khỏi màn hình
  xoaPhong: (roomId) => ipcRenderer.send('xoa-phong', roomId),

  // Đóng toàn bộ các phòng live cùng lúc
  dongTatCaPhong: () => ipcRenderer.send('dong-tat-ca-phong'),

  // Đổi link URL của một phòng live đang mở
  doiLinkPhong: (roomId, urlMoi) => ipcRenderer.send('doi-link-phong', { roomId, urlMoi }),

  // Bật/tắt tiếng cho một phòng cụ thể (các phòng khác sẽ tự động tắt tiếng)
  chuyenDoiTieng: (roomId) => ipcRenderer.send('chuyen-doi-tieng', roomId),

  // Phóng to một phòng hoặc thu nhỏ về chế độ lưới (Grid)
  chuyenDoiPhongTo: (roomId) => ipcRenderer.send('chuyen-doi-phong-to', roomId),

  // Tải lại luồng live của 1 phòng (khi bị đứt kết nối hoặc lag)
  taiLaiPhong: (roomId) => ipcRenderer.send('tai-lai-phong', roomId),

  // Mở file cấu hình rooms.json bằng phần mềm soạn thảo mặc định của Windows
  moFileConfig: () => ipcRenderer.send('mo-file-config'),

  // Đọc lại file rooms.json và cập nhật lại lưới hiển thị
  napLaiConfig: () => ipcRenderer.send('nap-lai-config'),

  // Báo cho Main thay đổi chiều cao thanh Footer
  thayDoiChieuCaoFooter: (chieuCao) => ipcRenderer.send('thay-doi-chieu-cao-footer', chieuCao),

  // Xuất danh sách log cảnh báo ra file CSV
  xuatFileCSV: (duLieuCSV) => ipcRenderer.send('xuat-file-csv', duLieuCSV),

  // Chuyển đổi chế độ tiết kiệm năng lượng cho Laptop (Eco Mode)
  chuyenDoiEcoMode: () => ipcRenderer.invoke('chuyen-doi-eco-mode'),

  // Lắng nghe cập nhật danh sách phòng
  onCapNhatDanhSachPhong: (callback) => {
    ipcRenderer.on('cap-nhat-danh-sach-phong', (event, data) => callback(data));
  },

  // Lắng nghe khi có cảnh báo/lỗi mới được phát hiện
  onCanhBaoMoi: (callback) => {
    ipcRenderer.on('canh-bao-moi', (event, data) => callback(data));
  },

  // Lắng nghe cập nhật chỉ số đo thời gian thực (đèn LED trạng thái)
  onCapNhatChiSoRealtime: (callback) => {
    ipcRenderer.on('cap-nhat-chi-so-realtime', (event, data) => callback(data));
  },

  // Lắng nghe thông báo log
  onThongBaoLog: (callback) => {
    ipcRenderer.on('thong-bao-log', (event, msg) => callback(msg));
  }
});
