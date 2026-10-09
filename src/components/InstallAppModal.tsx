'use client';

import React, { useState, useEffect } from 'react';
import { X, Smartphone, Apple, Check, Share, PlusSquare, MoreVertical, Download, Sparkles } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const [platform, setPlatform] = useState<'IOS' | 'ANDROID'>('IOS');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Tự động nhận diện thiết bị
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setPlatform('IOS');
      } else if (/android/.test(ua)) {
        setPlatform('ANDROID');
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

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header Modal */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md p-1 border border-white/30 flex items-center justify-center shadow-lg flex-shrink-0">
              <img src="/icon-192.png" alt="CNHP 2026 Icon" className="w-12 h-12 rounded-xl object-cover" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wide uppercase mb-1">
                <Sparkles className="w-3 h-3 text-yellow-300" /> Cài App Tiện Lợi
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold leading-tight">
                Cài App CNHP Lên Điện Thoại
              </h3>
              <p className="text-xs text-orange-100 mt-0.5">
                Xem bảng xếp hạng, bài chạy & quỹ phạt chỉ với 1 chạm từ màn hình chính
              </p>
            </div>
          </div>
        </div>

        {/* Tab chuyển đổi hệ điều hành */}
        <div className="p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              onClick={() => setPlatform('IOS')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                platform === 'IOS'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Apple className="w-4 h-4" />
              <span>iPhone / iPad (iOS)</span>
            </button>

            <button
              onClick={() => setPlatform('ANDROID')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                platform === 'ANDROID'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android (Samsung, Xiaomi...)</span>
            </button>
          </div>

          {/* Hướng dẫn chi tiết cho iOS */}
          {platform === 'IOS' && (
            <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-200 text-xs">
                💡 <b>Mẹo cho iPhone:</b> Hãy mở trang web bằng trình duyệt <b>Safari</b> để cài đặt chỉ trong 10 giây!
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Bấm nút Chia sẻ <Share className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Nhấn vào biểu tượng hình vuông có mũi tên hướng lên ở thanh công cụ dưới đáy màn hình Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
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
                  <div className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Bấm nút &quot;Thêm&quot; ở góc trên
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Bấm <b>Thêm (Add)</b> ở góc phải trên. Biểu tượng app CNHP sẽ xuất hiện ngay trên màn hình iPhone, bấm mở là dùng toàn màn hình như app tải từ App Store!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hướng dẫn chi tiết cho Android */}
          {platform === 'ANDROID' && (
            <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {deferredPrompt && !isInstalled && (
                <button
                  onClick={handleNativeInstall}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  <span>BẤM VÀO ĐÂY ĐỂ CÀI ĐẶT NGAY LẬP TỨC</span>
                </button>
              )}

              {isInstalled ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-center font-bold">
                  ✓ Ứng dụng đã được cài đặt thành công trên thiết bị của bạn!
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <div className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        Mở bằng Google Chrome & Bấm Menu <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Nhấn vào biểu tượng <b>3 chấm dọc (⋮)</b> ở góc trên cùng bên phải trình duyệt Chrome.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <div className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        Chọn &quot;Cài đặt ứng dụng&quot; <Download className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Nhấn chọn <b>&quot;Cài đặt ứng dụng&quot; (Install app)</b> hoặc <b>&quot;Thêm vào màn hình chính&quot;</b>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <div className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      3
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        Xác nhận &quot;Cài đặt&quot;
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Bấm <b>Cài đặt (Install)</b>. Ứng dụng CNHP 2026 sẽ được tải và xuất hiện trong danh sách ứng dụng trên điện thoại y hệt ứng dụng từ CH Play!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lợi ích của App */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="block font-bold text-slate-800 dark:text-slate-200">⚡ Mở Tức Thì</span>
              Toàn màn hình không vướng địa chỉ web
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="block font-bold text-slate-800 dark:text-slate-200">🔄 Tự Cập Nhật</span>
              Dữ liệu luôn mới nhất không cần tải lại
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="block font-bold text-slate-800 dark:text-slate-200">🆓 Miễn Phí 100%</span>
              Dành riêng cho VĐV CLB CNHP
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition"
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
