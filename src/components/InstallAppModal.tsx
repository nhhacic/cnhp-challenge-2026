'use client';

import React, { useState, useEffect } from 'react';
import { X, Smartphone, Apple, Check, Share, PlusSquare, MoreVertical, Download, Sparkles, AlertTriangle, ExternalLink } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const [platform, setPlatform] = useState<'IOS' | 'ANDROID'>('IOS');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      // Nhận diện iOS / Android
      if (/iphone|ipad|ipod/.test(ua)) {
        setPlatform('IOS');
      } else if (/android/.test(ua)) {
        setPlatform('ANDROID');
      }

      // Nhận diện trình duyệt nhúng Zalo, Facebook, Messenger
      const inApp = /zalo|fban|fbav|messenger|instagram|line|micromessenger/.test(ua);
      setIsInAppBrowser(inApp);

      // Kiểm tra xem đã mở dưới dạng standalone app chưa
      if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
        setIsInstalled(true);
      }

      // Bắt sự kiện PWA install prompt của Android Chrome
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      });

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) {
      alert('Ứng dụng CNHP 2026 đã được cài đặt trên thiết bị của bạn!');
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Khi prompt chưa sẵn sàng hoặc trình duyệt cần thao tác thủ công
      if (platform === 'ANDROID') {
        alert(
          '👉 Để cài đặt trên Android:\n1. Bấm vào biểu tượng 3 chấm (⋮) ở góc trên bên phải Chrome.\n2. Chọn dòng "Cài đặt ứng dụng" (hoặc "Thêm vào Màn hình chính").\n3. Bấm "Cài đặt" là hoàn tất!'
        );
      } else {
        alert(
          '👉 Để cài đặt trên iPhone:\n1. Bấm nút Chia sẻ (hình vuông mũi tên lên ⎋) ở cạnh dưới Safari.\n2. Chọn "Thêm vào Màn hình chính".\n3. Bấm "Thêm" là xong!'
        );
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-scaleUp max-h-[92vh] flex flex-col">
        {/* Header Modal */}
        <div className="relative p-5 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white/10 backdrop-blur-md p-1 border border-white/30 flex items-center justify-center shadow-lg flex-shrink-0">
              <img src="/icon-192.png" alt="CNHP 2026 Icon" className="w-11 h-11 rounded-xl object-cover" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wide uppercase mb-1">
                <Sparkles className="w-3 h-3 text-yellow-300" /> Cài Đặt App Trực Tiếp
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold leading-tight">
                Cài App CNHP 2026 Lên Điện Thoại
              </h3>
              <p className="text-xs text-orange-100 mt-0.5">
                Xem bảng xếp hạng & bài chạy với 1 chạm từ màn hình chính
              </p>
            </div>
          </div>
        </div>

        {/* Nội dung chính cuộn được */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* CẢNH BÁO NẾU ĐANG MỞ TRONG ZALO HOẶC FACEBOOK */}
          {isInAppBrowser && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-1.5 animate-pulse">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Bạn đang mở liên kết từ Zalo hoặc Facebook!</span>
              </div>
              <p className="text-xs leading-relaxed">
                Trình duyệt nhúng của Zalo/Facebook <b>không cho phép cài đặt ứng dụng</b>. Hãy bấm vào biểu tượng <b>3 chấm (⋮) hoặc chia sẻ ở góc trên màn hình Zalo/Facebook</b> &rarr; chọn <b>&quot;Mở bằng trình duyệt ngoài&quot; (Chrome hoặc Safari)</b> để cài đặt được app nhé!
              </p>
            </div>
          )}

          {/* Nút bấm hành động nhanh */}
          <div className="space-y-2">
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/30 transition-all active:scale-95"
            >
              <Download className="w-5 h-5 animate-bounce" />
              <span>{isInstalled ? '✓ ĐÃ CÀI ĐẶT TRÊN MÁY' : 'BẤM VÀO ĐÂY ĐỂ CÀI ĐẶT APP'}</span>
            </button>
            <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
              {deferredPrompt
                ? '⚡ Thiết bị của bạn đã sẵn sàng cài đặt 1-chạm!'
                : '💡 Nếu bấm nút trên chưa hiện hộp thoại, vui lòng làm theo 3 bước nhanh dưới đây:'}
            </p>
          </div>

          {/* Tab chọn hệ điều hành */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              onClick={() => setPlatform('ANDROID')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                platform === 'ANDROID'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Android (Samsung, Xiaomi...)</span>
            </button>

            <button
              onClick={() => setPlatform('IOS')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                platform === 'IOS'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Apple className="w-4 h-4 text-slate-800 dark:text-white" />
              <span>iPhone / iPad (iOS)</span>
            </button>
          </div>

          {/* Hướng dẫn chi tiết cho Android */}
          {platform === 'ANDROID' && (
            <div className="space-y-3 text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs">
                🤖 <b>Dành cho Android:</b> Cần mở bằng trình duyệt <b>Google Chrome</b> (hoặc Samsung Internet) để tạo WebAPK chính thức vào máy.
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Bấm vào Menu 3 chấm <MoreVertical className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Ở góc trên cùng bên phải trình duyệt Chrome (hoặc ở thanh dưới của một số dòng máy), chạm vào biểu tượng <b>3 chấm dọc (⋮)</b>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Chọn dòng &quot;Cài đặt ứng dụng&quot; <Download className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Trong menu mở ra, chạm vào dòng <b>&quot;Cài đặt ứng dụng&quot; (Install app)</b> hoặc <b>&quot;Thêm vào màn hình chính&quot;</b>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Xác nhận &quot;Cài đặt&quot; (Install)
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Điện thoại sẽ hiện thông báo xác nhận, bấm <b>Cài đặt</b>. Ứng dụng CNHP 2026 sẽ được tải và xuất hiện ngay trong danh sách ứng dụng của điện thoại!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hướng dẫn chi tiết cho iOS */}
          {platform === 'IOS' && (
            <div className="space-y-3 text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-200 text-xs">
                🍎 <b>Dành cho iPhone/iPad:</b> Bắt buộc mở trang bằng trình duyệt <b>Safari</b> của Apple.
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Bấm nút Chia sẻ <Share className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Nhấn vào biểu tượng hình vuông có mũi tên hướng lên ở thanh dưới cùng của Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Chọn &quot;Thêm vào MH chính&quot; <PlusSquare className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Cuộn xuống danh sách tùy chọn và nhấn vào dòng <b>&quot;Thêm vào Màn hình chính&quot; (Add to Home Screen)</b>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Bấm nút &quot;Thêm&quot; (Add)
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Bấm <b>Thêm</b> ở góc trên bên phải. Icon app CNHP sẽ xuất hiện ngay trên màn hình iPhone, bấm mở là dùng toàn màn hình!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-slate-400">Tự động cập nhật online • Miễn phí 100%</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition"
          >
            Đóng Hướng Dẫn
          </button>
        </div>
      </div>
    </div>
  );
}
