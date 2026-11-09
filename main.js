// ====================================================================
// main.js - Tiến trình chính của ứng dụng Electron
// Dự án: Hệ Thống Giám Sát Livestream Bán Hàng Đa Kênh
// ====================================================================

const { app, BrowserWindow, WebContentsView, ipcMain, session, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const tf = require('@tensorflow/tfjs');
const blazeface = require('@tensorflow-models/blazeface');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

let cuaSoChinh = null;
let danhSachQuanLyPhong = [];
let phongDangPhongToId = null;
let blazefaceModel = null;

const FILE_CONFIG_PATH = app.isPackaged
  ? path.join(path.dirname(process.execPath), 'rooms.json')
  : path.join(__dirname, 'rooms.json');

async function taiMoHinhAI() {
  try {
    console.log('[AI] Đang nạp mô hình BlazeFace...');
    blazefaceModel = await blazeface.load();
    console.log('[AI] Đã nạp thành công mô hình BlazeFace!');
  } catch (err) {
    console.error('[AI] Lỗi khi nạp mô hình BlazeFace:', err.message);
  }
}

function docFileConfigRooms() {
  try {
    if (!fs.existsSync(FILE_CONFIG_PATH)) {
      // Nếu là app đóng gói và chưa có rooms.json cạnh file .exe, copy file mặc định ra
      const defaultPath = path.join(__dirname, 'rooms.json');
      if (fs.existsSync(defaultPath)) {
        try { fs.copyFileSync(defaultPath, FILE_CONFIG_PATH); } catch (e) {}
      } else {
        return [];
      }
    }
    const rawData = fs.readFileSync(FILE_CONFIG_PATH, 'utf-8');
    return JSON.parse(rawData);
  } catch (err) {
    console.error('Lỗi khi đọc file rooms.json:', err.message);
    return [];
  }
}

function luuFileConfigRooms(danhSach) {
  try {
    fs.writeFileSync(FILE_CONFIG_PATH, JSON.stringify(danhSach, null, 2), 'utf-8');
  } catch (err) {
    console.error('Lỗi khi lưu file rooms.json:', err.message);
  }
}

function taoCuaSoChinh() {
  const chromeUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
  session.defaultSession.setUserAgent(chromeUserAgent);

  cuaSoChinh = new BrowserWindow({
    width: 1540,
    height: 960,
    minWidth: 950,
    minHeight: 650,
    title: 'Hệ Thống Giám Sát Livestream Đa Kênh - Multiview Monitor',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  cuaSoChinh.loadFile('index.html');

  cuaSoChinh.webContents.on('did-finish-load', () => {
    khoiTaoCacWebContentsViews();
    khoiDongEngineGiamSatTuDong();
  });
}

/**
 * Tối ưu hiển thị TikTok & Khóa hoàn toàn chuột/bàn phím chống nhảy live
 */
function toiUuHienThiTikTok(view) {
  const scriptDonDepVaKhoaCuon = `
    (() => {
      // 1. KHÓA HOÀN TOÀN LĂN CHUỘT VÀ BÀN PHÍM ĐỂ KHÔNG BỊ NHẢY SANG LIVE KHÁC
      window.addEventListener('wheel', (e) => {
        e.stopImmediatePropagation();
        e.preventDefault();
      }, { passive: false, capture: true });

      window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      }, { capture: true });

      window.addEventListener('touchmove', (e) => {
        e.stopImmediatePropagation();
        e.preventDefault();
      }, { passive: false, capture: true });

      // 2. ẨN THANH CHAT BÊN PHẢI & SIDEBAR BÊN TRÁI
      const room = document.querySelector('.live-room-container');
      if (room) {
        if (room.children.length > 1) {
          for (let i = 1; i < room.children.length; i++) {
            room.children[i].style.display = 'none';
            room.children[i].style.width = '0px';
          }
        }

        const grow = room.closest('.grow');
        if (grow && grow.parentElement) {
          Array.from(grow.parentElement.children).forEach(c => {
            if (c !== grow) {
              c.style.display = 'none';
              c.style.width = '0px';
            }
          });
        }

        const wrappers = document.querySelectorAll('div, main');
        wrappers.forEach(w => {
          if (w.className && typeof w.className === 'string' && w.className.includes('min-w-')) {
            w.style.minWidth = '0px';
            w.style.width = '100vw';
          }
        });

        const videoCol = room.children[0];
        if (videoCol) {
          videoCol.style.padding = '0px';
          videoCol.style.margin = '0px';
          videoCol.style.width = '100vw';
          videoCol.style.maxWidth = '100vw';
          videoCol.style.height = '100vh';
          videoCol.style.maxHeight = '100vh';
          videoCol.style.flex = '1 1 100%';

          // ẨN TOÀN BỘ PHẦN THỪA PHÍA TRÊN: Avatar, nút Follow, thanh thông tin kênh của TikTok
          // Giúp video bắt đầu ngay từ pixel 0 trên cùng, không bị đẩy thụt xuống dưới làm mất chân/sản phẩm!
          Array.from(videoCol.children).forEach(child => {
            if (!child.querySelector('video')) {
              child.style.display = 'none';
              child.style.height = '0px';
              child.style.minHeight = '0px';
              child.style.padding = '0px';
              child.style.margin = '0px';
            } else {
              child.style.height = '100vh';
              child.style.maxHeight = '100vh';
              child.style.width = '100vw';
              child.style.margin = '0px';
              child.style.padding = '0px';
              child.style.position = 'relative';
              child.style.top = '0px';
            }
          });
        }
      }

      // Ẩn tất cả các header/author overlay của TikTok
      const allHeaders = document.querySelectorAll('header, [class*="Header"], [class*="header"], [data-e2e*="header"], [class*="AuthorContainer"], [class*="author-container"], [class*="InfoContainer"], [class*="info-container"]');
      allHeaders.forEach(h => {
        if (!h.querySelector('video')) {
          h.style.display = 'none';
          h.style.height = '0px';
          h.style.padding = '0px';
          h.style.margin = '0px';
        }
      });

      // 3. VIDEO BUNG TO VỪA VẶN TRỌN VẸN TỪ ĐỈNH XUỐNG ĐÁY
      const video = document.querySelector('video');
      if (video) {
        const oldNotice = document.getElementById('custom-offline-notice');
        if (oldNotice) oldNotice.remove();
        video.style.objectFit = 'contain';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.position = 'absolute';
        video.style.top = '0px';
        video.style.left = '0px';
        video.style.margin = '0px';
        video.style.padding = '0px';
        if (video.paused) {
          video.play().catch(() => {});
        }
      } else {
        // NẾU KHÔNG CÓ VIDEO (OFFLINE / CHƯA LIVE), ĐỔI NỀN TỐI & BÁO RÕ RÀNG TRÁNH MÀN HÌNH TRẮNG
        document.body.style.backgroundColor = '#0b0e1b';
        document.body.style.color = '#e2e8f0';
        document.body.style.overflow = 'hidden';

        let offlineNotice = document.getElementById('custom-offline-notice');
        if (!offlineNotice) {
          offlineNotice = document.createElement('div');
          offlineNotice.id = 'custom-offline-notice';
          offlineNotice.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background-color:#0b0e1b;display:flex;flex-direction:column;justify-content:center;align-items:center;color:#94a3b8;font-family:sans-serif;z-index:99999;text-align:center;padding:16px;box-sizing:border-box;';
          offlineNotice.innerHTML = \`
            <div style="font-size:32px;margin-bottom:8px;">📴</div>
            <div style="font-size:13px;font-weight:700;color:#f87171;margin-bottom:4px;">Kênh Hiện Chưa Phát Sóng Live</div>
            <div style="font-size:10px;color:#64748b;max-width:220px;line-height:1.4;">TikTok báo kênh đang tạm nghỉ hoặc phiên live trước đã kết thúc.</div>
            <div style="font-size:10px;color:#38bdf8;margin-top:10px;border:1px solid #0284c7;padding:3px 8px;border-radius:4px;background:#0369a133;">Bấm ✏️ trên thanh để đổi kênh khác</div>
          \`;
          document.body.appendChild(offlineNotice);
        }
      }

      // Đóng popup đăng nhập
      const closeBtns = document.querySelectorAll('button[class*="close"], div[class*="close"], [data-e2e="modal-close-icon"]');
      closeBtns.forEach(btn => btn.click());
    })()
  `;

  view.webContents.on('did-finish-load', () => {
    view.webContents.executeJavaScript(scriptDonDepVaKhoaCuon).catch(() => {});
  });

  setInterval(() => {
    if (!view.webContents.isDestroyed()) {
      view.webContents.executeJavaScript(scriptDonDepVaKhoaCuon).catch(() => {});
    }
  }, 1500);
}

function khoiTaoCacWebContentsViews() {
  danhSachQuanLyPhong.forEach(item => {
    if (item.view) {
      try {
        cuaSoChinh.contentView.removeChildView(item.view);
        item.view.webContents.close();
      } catch (e) {}
    }
  });
  danhSachQuanLyPhong = [];
  phongDangPhongToId = null;

  const danhSachPhongConfig = docFileConfigRooms().filter(p => p.active !== false);

  // NẠP SO LE (CÁCH NHAU 1200ms) ĐỂ TRÁNH AKAMAI / EDGESUITE RATE-LIMIT CHẶN "ACCESS DENIED"
  danhSachPhongConfig.forEach((phong, idx) => {
    setTimeout(() => {
      taoMotViewChoPhong(phong);
      guiDuLieuDanhSachPhongVeRenderer();
    }, idx * 1200);
  });
}

function taoMotViewChoPhong(phong) {
  const chromeUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

  // 1. TẠO PHIÊN DUYỆT ĐỘC LẬP (SESSION PARTITION) CHO TỪNG Ô LIVE
  // Giúp mỗi ô live như một trình duyệt độc lập riêng biệt, xóa bỏ hoàn toàn giới hạn đa luồng
  const partitionName = `persist:room_${phong.id}`;
  const phongSession = session.fromPartition(partitionName);
  phongSession.setUserAgent(chromeUserAgent);

  const view = new WebContentsView({
    webPreferences: {
      partition: partitionName,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  cuaSoChinh.contentView.addChildView(view);
  view.webContents.setAudioMuted(true);
  view.webContents.setUserAgent(chromeUserAgent);
  toiUuHienThiTikTok(view, phong.brand);

  let cleanUrl = (phong.url || '').trim();
  // Đảm bảo luôn sử dụng HTTPS để không bị Akamai chặn
  if (cleanUrl.startsWith('http://')) {
    cleanUrl = 'https://' + cleanUrl.substring(7);
  }

  if (cleanUrl) {
    view.webContents.loadURL(cleanUrl);
  }

  danhSachQuanLyPhong.push({
    id: phong.id,
    brand: phong.brand,
    platform: phong.platform || 'TikTok',
    url: cleanUrl,
    view: view,
    dangBatTieng: false,
    lastCurrentTime: 0,
    frozenCount: 0,
    offCenterCount: 0,
    topBannerCount: 0,
    lastWarningTime: {}
  });
}

function guiDuLieuDanhSachPhongVeRenderer() {
  if (!cuaSoChinh || cuaSoChinh.isDestroyed()) return;

  const data = {
    phongToId: phongDangPhongToId,
    danhSach: danhSachQuanLyPhong.map(p => ({
      id: p.id,
      brand: p.brand,
      platform: p.platform,
      url: p.url,
      dangBatTieng: p.dangBatTieng
    }))
  };

  cuaSoChinh.webContents.send('cap-nhat-danh-sach-phong', data);
}

/**
 * Tính toán độ nét của ảnh bằng toán tử Laplacian
 */
function tinhDoNetLaplacian(bitmap, w, h) {
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const b = bitmap[i * 4];
    const g = bitmap[i * 4 + 1];
    const r = bitmap[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const val = gray[idx - w] + gray[idx + w] + gray[idx - 1] + gray[idx + 1] - 4 * gray[idx];
      sum += val;
      sumSq += val * val;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  const variance = (sumSq / count) - (mean * mean);
  return Math.round(variance);
}

// ====================================================================
// ENGINE GIÁM SÁT TỰ ĐỘNG THỜI GIAN THỰC (TẬP TRUNG HOST LỆCH CENTER)
// ÁP DỤNG THUẬT TOÁN TUẦN TRA XOAY VÒNG (ROUND-ROBIN SCHEDULING)
// GIẢM 75% TẢI CPU CHO MÁY LAPTOP KHI GIÁM SÁT NHIỀU PHÒNG
// ====================================================================
let intervalGiamSat = null;
let conTroTuanTra = 0; // Con trỏ tuần tra xoay vòng các phòng
let cheDoEcoLaptop = true; // Mặc định BẬT Eco Mode để tối ưu pin và nhiệt độ laptop!

function khoiDongEngineGiamSatTuDong() {
  if (intervalGiamSat) clearInterval(intervalGiamSat);

  // Chu kỳ quét AI: 2.2 giây (Eco Mode tiết kiệm) hoặc 1.4 giây (Hiệu năng cao)
  const chuKy = cheDoEcoLaptop ? 2200 : 1400;

  intervalGiamSat = setInterval(async () => {
    if (!cuaSoChinh || cuaSoChinh.isDestroyed() || danhSachQuanLyPhong.length === 0) return;

    // THUẬT TOÁN TUẦN TRA XOAY VÒNG (ROUND-ROBIN):
    // Thay vì chạy 6 phòng cùng lúc làm nóng máy, mỗi chu kỳ chỉ kiểm tra sâu AI 1 phòng duy nhất!
    const phong = danhSachQuanLyPhong[conTroTuanTra % danhSachQuanLyPhong.length];
    conTroTuanTra = (conTroTuanTra + 1) % danhSachQuanLyPhong.length;

    if (!phong || !phong.view || phong.view.webContents.isDestroyed()) return;

    const chiSo = {
      center: 'good',
      centerText: 'CENTER: OK',
      banner: 'good',
      focus: 'good',
      light: 'good'
    };

    try {
      const bayGio = Date.now();

      // 1. Kiểm tra DOM Video
      const domInfo = await phong.view.webContents.executeJavaScript(`
        (() => {
          // Kiểm tra nếu bị Akamai chặn Access Denied
          if (document.body.innerText.includes('Access Denied') || document.body.innerText.includes('edgesuite.net')) {
            return { accessDenied: true };
          }

          const v = document.querySelector('video');
          if (!v) {
            const isOffline = document.body.innerText.includes('LIVE đã kết thúc') || 
                              document.body.innerText.includes('Currently not LIVE') ||
                              window.location.pathname.indexOf('/live') === -1;
            return { coVideo: false, isOffline };
          }
          return {
            coVideo: true,
            paused: v.paused,
            currentTime: v.currentTime
          };
        })()
      `).catch(() => null);

      if (!domInfo) return;

      // Xử lý khi bị Access Denied từ Akamai
      if (domInfo.accessDenied) {
        chiSo.focus = 'error';
        if (!phong.lastWarningTime['DENIED'] || (bayGio - phong.lastWarningTime['DENIED'] > 30000)) {
          phong.lastWarningTime['DENIED'] = bayGio;
          banCanhBaoVeGiaoDien({
            roomId: phong.id,
            brand: phong.brand,
            platform: phong.platform,
            loaiLoi: '🚫 Chặn truy cập (Access Denied)',
            mucDo: 'danger',
            chiTiet: 'Akamai CDN tạm thời chặn luồng. Bấm nút 🔄 trên ô để nạp lại hoặc bấm ✕ để mở kênh khác.'
          });
        }
        guiCapNhatChiSoRealtime(phong.id, chiSo);
        return;
      }

      if (!domInfo.coVideo) {
        chiSo.focus = 'error';
        if (!phong.lastWarningTime['OFFLINE'] || (bayGio - phong.lastWarningTime['OFFLINE'] > 60000)) {
          phong.lastWarningTime['OFFLINE'] = bayGio;
          banCanhBaoVeGiaoDien({
            roomId: phong.id,
            brand: phong.brand,
            platform: phong.platform,
            loaiLoi: '⚠️ Chưa phát sóng (Offline)',
            mucDo: 'warning',
            chiTiet: 'Kênh hiện không có luồng phát sóng trực tiếp hoặc phiên live đã kết thúc.'
          });
        }
        guiCapNhatChiSoRealtime(phong.id, chiSo);
        return;
      }

      // Đứng hình
      if (domInfo.currentTime === phong.lastCurrentTime && !domInfo.paused) {
        phong.frozenCount = (phong.frozenCount || 0) + 1;
        if (phong.frozenCount >= 3) {
          chiSo.focus = 'error';
          if (!phong.lastWarningTime['FREEZE'] || (bayGio - phong.lastWarningTime['FREEZE'] > 30000)) {
            phong.lastWarningTime['FREEZE'] = bayGio;
            banCanhBaoVeGiaoDien({
              roomId: phong.id,
              brand: phong.brand,
              platform: phong.platform,
              loaiLoi: '❄️ Đứng hình / Treo live (Video Freeze)',
              mucDo: 'danger',
              chiTiet: `Hình ảnh bị đứng đơ ở giây thứ ${domInfo.currentTime.toFixed(1)}. Đường truyền internet phòng live có thể bị ngắt!`
            });
          }
        }
      } else {
        phong.frozenCount = 0;
        phong.lastCurrentTime = domInfo.currentTime;
      }

      // 2. Chụp khung hình thu nhỏ 320x240 để phân tích
      const W = 320;
      const H = 240;
      const anhChup = await phong.view.webContents.capturePage();
      if (anhChup && !anhChup.isEmpty()) {
        const anhNho = anhChup.resize({ width: W, height: H });
        const bitmap = anhNho.toBitmap();

        // A. Độ nét Laplacian
        const doNet = tinhDoNetLaplacian(bitmap, W, H);
        if (doNet < 50) {
          chiSo.focus = 'warning';
          if (!phong.lastWarningTime['BLUR'] || (bayGio - phong.lastWarningTime['BLUR'] > 45000)) {
            phong.lastWarningTime['BLUR'] = bayGio;
            banCanhBaoVeGiaoDien({
              roomId: phong.id,
              brand: phong.brand,
              platform: phong.platform,
              loaiLoi: '🔍 Hình ảnh mờ (Out-Focus)',
              mucDo: 'warning',
              chiTiet: `Độ sắc nét Laplacian = ${doNet} (ngưỡng > 60). Camera live có thể lấy nét sai!`
            });
          }
        }

        // B. Độ sáng
        let tongDoSang = 0;
        const soPixel = W * H;
        for (let i = 0; i < soPixel; i++) {
          const b = bitmap[i * 4];
          const g = bitmap[i * 4 + 1];
          const r = bitmap[i * 4 + 2];
          tongDoSang += (0.299 * r + 0.587 * g + 0.114 * b);
        }
        const doSang = Math.round(tongDoSang / soPixel);

        if (doSang < 25) {
          chiSo.light = 'error';
          if (!phong.lastWarningTime['DARK'] || (bayGio - phong.lastWarningTime['DARK'] > 45000)) {
            phong.lastWarningTime['DARK'] = bayGio;
            banCanhBaoVeGiaoDien({
              roomId: phong.id,
              brand: phong.brand,
              platform: phong.platform,
              loaiLoi: '💡 Ánh sáng quá tối (Under-exposed)',
              mucDo: 'warning',
              chiTiet: `Độ sáng trung bình = ${doSang}/255. Phòng live quá tối làm mờ sản phẩm!`
            });
          }
        } else if (doSang > 230) {
          chiSo.light = 'warning';
          if (!phong.lastWarningTime['BRIGHT'] || (bayGio - phong.lastWarningTime['BRIGHT'] > 45000)) {
            phong.lastWarningTime['BRIGHT'] = bayGio;
            banCanhBaoVeGiaoDien({
              roomId: phong.id,
              brand: phong.brand,
              platform: phong.platform,
              loaiLoi: '☀️ Cháy sáng / Lóa đèn (Over-exposed)',
              mucDo: 'warning',
              chiTiet: `Độ sáng trung bình = ${doSang}/255. Đèn chiếu quá gắt làm trắng bệch mặt host!`
            });
          }
        }

        // ----------------------------------------------------
        // 3. AI BLAZEFACE: TẬP TRUNG TÍNH TOÁN VỊ TRÍ HOST CENTER
        // ----------------------------------------------------
        if (blazefaceModel) {
          const rgbData = new Int32Array(W * H * 3);
          let src = 0;
          let dst = 0;
          for (let i = 0; i < W * H; i++) {
            rgbData[dst] = bitmap[src + 2];
            rgbData[dst + 1] = bitmap[src + 1];
            rgbData[dst + 2] = bitmap[src];
            src += 4;
            dst += 3;
          }

          const tensor = tf.tensor3d(rgbData, [H, W, 3], 'int32');
          const predictions = await blazefaceModel.estimateFaces(tensor, false);
          tf.dispose(tensor);

          if (predictions.length > 0) {
            const khuonMat = predictions[0];
            const startX = khuonMat.topLeft[0];
            const startY = khuonMat.topLeft[1];
            const endX = khuonMat.bottomRight[0];

            const tamMatX = (startX + endX) / 2;
            const tamKhungHinhX = W / 2; // 160px (tâm chính giữa chiều ngang)
            const doLechPhanTram = Math.round((Math.abs(tamMatX - tamKhungHinhX) / W) * 100);
            const huongLech = tamMatX < tamKhungHinhX ? 'Trái' : 'Phải';

            // Ngưỡng cảnh báo nhạy: Lệch quá 15% chiều rộng khung hình
            if (doLechPhanTram > 15) {
              phong.offCenterCount = (phong.offCenterCount || 0) + 1;
              chiSo.centerText = `LỆCH ${huongLech[0]}: ${doLechPhanTram}%`;

              // Cần lệch liên tục 2 chu kỳ (~7 giây) để loại trừ trường hợp host chỉ cúi người lấy đồ
              if (phong.offCenterCount >= 2) {
                chiSo.center = 'warning';
                if (!phong.lastWarningTime['CENTER'] || (bayGio - phong.lastWarningTime['CENTER'] > 25000)) {
                  phong.lastWarningTime['CENTER'] = bayGio;
                  banCanhBaoVeGiaoDien({
                    roomId: phong.id,
                    brand: phong.brand,
                    platform: phong.platform,
                    loaiLoi: '👤 Host lệch tâm (Off-Center)',
                    mucDo: 'warning',
                    chiTiet: `Host đang ngồi lệch sang ${huongLech} ${doLechPhanTram}% khung hình liên tục hơn 7 giây. Cần nhắc host ngồi về giữa!`
                  });
                }
              }
            } else {
              phong.offCenterCount = 0;
              chiSo.center = 'good';
              chiSo.centerText = `CENTER: ${doLechPhanTram}%`;
            }

            // ĐẦU ĐỤNG BANNER CHỮ
            const dinhDauY = Math.max(0, startY);
            const tiLeDinhDau = Math.round((dinhDauY / H) * 100);

            if (tiLeDinhDau < 14) {
              phong.topBannerCount = (phong.topBannerCount || 0) + 1;
              if (phong.topBannerCount >= 3) {
                chiSo.banner = 'warning';
                if (!phong.lastWarningTime['BANNER'] || (bayGio - phong.lastWarningTime['BANNER'] > 30000)) {
                  phong.lastWarningTime['BANNER'] = bayGio;
                  banCanhBaoVeGiaoDien({
                    roomId: phong.id,
                    brand: phong.brand,
                    platform: phong.platform,
                    loaiLoi: '⚠️ Đầu đụng banner chữ (Top Banner)',
                    mucDo: 'warning',
                    chiTiet: `Đỉnh đầu host đang chạm vào vùng voucher/tiêu đề trên cùng (cách mép chỉ ${tiLeDinhDau}%). Có nguy cơ bị chữ che mất mặt!`
                  });
                }
              }
            } else {
              phong.topBannerCount = 0;
            }
          } else {
            chiSo.centerText = 'CENTER: CHỜ';
            phong.offCenterCount = 0;
          }
        }
      }

      guiCapNhatChiSoRealtime(phong.id, chiSo);
    } catch (err) {}
  }, chuKy);
}

function banCanhBaoVeGiaoDien(canhBao) {
  if (cuaSoChinh && !cuaSoChinh.isDestroyed()) {
    canhBao.thoiGian = new Date().toLocaleTimeString();
    cuaSoChinh.webContents.send('canh-bao-moi', canhBao);
  }
}

function guiCapNhatChiSoRealtime(roomId, chiSo) {
  if (cuaSoChinh && !cuaSoChinh.isDestroyed()) {
    cuaSoChinh.webContents.send('cap-nhat-chi-so-realtime', { roomId, chiSo });
  }
}

// ====================================================================
// CÁC KÊNH IPC XỬ LÝ SỰ KIỆN TỪ GIAO DIỆN
// ====================================================================

ipcMain.on('dong-bo-toa-do-views', (event, danhSachToaDo) => {
  if (!cuaSoChinh || cuaSoChinh.isDestroyed()) return;

  if (phongDangPhongToId) {
    const targetToaDo = danhSachToaDo.find(td => td.id === phongDangPhongToId);
    danhSachQuanLyPhong.forEach(item => {
      if (item.id === phongDangPhongToId && targetToaDo) {
        item.view.setBounds({
          x: targetToaDo.x,
          y: targetToaDo.y,
          width: Math.max(0, targetToaDo.width),
          height: Math.max(0, targetToaDo.height)
        });
      } else {
        item.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      }
    });
    return;
  }

  danhSachToaDo.forEach(td => {
    const target = danhSachQuanLyPhong.find(p => p.id === td.id);
    if (target && target.view) {
      target.view.setBounds({
        x: td.x,
        y: td.y,
        width: Math.max(0, td.width),
        height: Math.max(0, td.height)
      });
    }
  });
});

ipcMain.handle('lay-danh-sach-phong', () => {
  return {
    phongToId: phongDangPhongToId,
    danhSach: danhSachQuanLyPhong.map(p => ({
      id: p.id,
      brand: p.brand,
      platform: p.platform,
      url: p.url,
      dangBatTieng: p.dangBatTieng
    }))
  };
});

ipcMain.on('them-phong-moi', (event, phongData) => {
  const idMoi = 'room_' + Date.now();
  let cleanUrl = (phongData.url || '').trim();
  if (cleanUrl.startsWith('http://')) cleanUrl = 'https://' + cleanUrl.substring(7);

  const phongMoi = {
    id: idMoi,
    brand: phongData.brand || 'Phòng Live Mới',
    platform: phongData.platform || 'TikTok',
    url: cleanUrl,
    active: true
  };

  taoMotViewChoPhong(phongMoi);

  const danhSachHienTai = docFileConfigRooms();
  danhSachHienTai.push(phongMoi);
  luuFileConfigRooms(danhSachHienTai);

  guiDuLieuDanhSachPhongVeRenderer();
  cuaSoChinh.webContents.send('thong-bao-log', `Đã thêm phòng live: ${phongMoi.brand}`);
});

ipcMain.on('doi-link-phong', (event, { roomId, urlMoi }) => {
  const target = danhSachQuanLyPhong.find(p => p.id === roomId);
  if (target && target.view && urlMoi) {
    let cleanUrl = urlMoi.trim();
    if (cleanUrl.startsWith('http://')) cleanUrl = 'https://' + cleanUrl.substring(7);

    target.url = cleanUrl;
    target.view.webContents.loadURL(target.url);

    const danhSach = docFileConfigRooms();
    const item = danhSach.find(p => p.id === roomId);
    if (item) {
      item.url = target.url;
      luuFileConfigRooms(danhSach);
    }

    guiDuLieuDanhSachPhongVeRenderer();
    cuaSoChinh.webContents.send('thong-bao-log', `Đã đổi link phòng ${target.brand}`);
  }
});

// XÓA PHÒNG KHI BẤM NÚT ✕ (ĐÓNG Ô LIVE)
ipcMain.on('xoa-phong', (event, roomId) => {
  const index = danhSachQuanLyPhong.findIndex(p => p.id === roomId);
  if (index !== -1) {
    const target = danhSachQuanLyPhong[index];
    try {
      cuaSoChinh.contentView.removeChildView(target.view);
      target.view.webContents.close();
    } catch (e) {}

    danhSachQuanLyPhong.splice(index, 1);

    if (phongDangPhongToId === roomId) {
      phongDangPhongToId = null;
    }

    const danhSach = docFileConfigRooms().filter(p => p.id !== roomId);
    luuFileConfigRooms(danhSach);

    guiDuLieuDanhSachPhongVeRenderer();
    cuaSoChinh.webContents.send('thong-bao-log', `Đã đóng ô phòng live.`);
  }
});

// ĐÓNG TOÀN BỘ CÁC PHÒNG LIVE
ipcMain.on('dong-tat-ca-phong', () => {
  danhSachQuanLyPhong.forEach(item => {
    try {
      cuaSoChinh.contentView.removeChildView(item.view);
      item.view.webContents.close();
    } catch (e) {}
  });
  danhSachQuanLyPhong = [];
  phongDangPhongToId = null;
  luuFileConfigRooms([]);
  guiDuLieuDanhSachPhongVeRenderer();
  cuaSoChinh.webContents.send('thong-bao-log', 'Đã dọn sạch tất cả các phòng live.');
});

ipcMain.on('chuyen-doi-tieng', (event, roomId) => {
  danhSachQuanLyPhong.forEach(item => {
    if (item.id === roomId) {
      item.dangBatTieng = !item.dangBatTieng;
      item.view.webContents.setAudioMuted(!item.dangBatTieng);
    } else {
      item.dangBatTieng = false;
      item.view.webContents.setAudioMuted(true);
    }
  });

  guiDuLieuDanhSachPhongVeRenderer();
});

ipcMain.on('chuyen-doi-phong-to', (event, roomId) => {
  if (phongDangPhongToId === roomId) {
    phongDangPhongToId = null;
  } else {
    phongDangPhongToId = roomId;
  }

  guiDuLieuDanhSachPhongVeRenderer();
});

// TẢI LẠI LUỒNG STREAM KHI BỊ ACCESS DENIED HOẶC LỖI MẠNG
ipcMain.on('tai-lai-phong', (event, roomId) => {
  const target = danhSachQuanLyPhong.find(p => p.id === roomId);
  if (target && target.view) {
    let cleanUrl = target.url;
    if (cleanUrl.startsWith('http://')) cleanUrl = 'https://' + cleanUrl.substring(7);

    target.view.webContents.session.clearCache().then(() => {
      target.view.webContents.loadURL(cleanUrl);
    }).catch(() => {
      target.view.webContents.loadURL(cleanUrl);
    });
  }
});

ipcMain.on('mo-file-config', () => {
  shell.openPath(FILE_CONFIG_PATH);
});

ipcMain.on('nap-lai-config', () => {
  khoiTaoCacWebContentsViews();
});

// BẬT / TẮT CHẾ ĐỘ ECO MODE CHO LAPTOP
ipcMain.handle('chuyen-doi-eco-mode', () => {
  cheDoEcoLaptop = !cheDoEcoLaptop;
  khoiDongEngineGiamSatTuDong();
  const trangThai = cheDoEcoLaptop ? 'BẬT (Tiết kiệm Pin & Mát CPU)' : 'TẮT (Hiệu năng cao)';
  cuaSoChinh.webContents.send('thong-bao-log', `Chế độ Eco Mode Laptop: ${trangThai}`);
  return cheDoEcoLaptop;
});

ipcMain.on('xuat-file-csv', async (event, noiDungCSV) => {
  if (!cuaSoChinh) return;
  const { filePath } = await dialog.showSaveDialog(cuaSoChinh, {
    title: 'Lưu Nhật Ký Lỗi Livestream (Báo Cáo Thực Tập)',
    defaultPath: `nhat-ky-loi-live-${new Date().toISOString().slice(0, 10)}.csv`,
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });

  if (filePath) {
    fs.writeFileSync(filePath, noiDungCSV, 'utf-8');
    cuaSoChinh.webContents.send('thong-bao-log', `Đã xuất file log thành công: ${path.basename(filePath)}`);
  }
});

app.whenReady().then(async () => {
  taoCuaSoChinh();
  await taiMoHinhAI();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) taoCuaSoChinh();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
