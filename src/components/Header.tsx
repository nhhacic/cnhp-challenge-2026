'use client';

import React, { useState } from 'react';
import { Week, User } from '@/types';
import { Trophy, RefreshCw, Moon, Sun, ShieldCheck, Flame, Compass, LogOut, CheckCircle2, Smartphone, X } from 'lucide-react';
import InstallAppModal from '@/components/InstallAppModal';

interface HeaderProps {
  weeks: Week[];
  selectedWeekNumber: number | null; // null = Toàn giải
  onSelectWeek: (weekNum: number | null) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  onSyncStrava: () => void;
  isSyncing: boolean;
  connectedUser: any;
  onLogout?: () => void;
  users?: User[];
}

export default function Header({
  weeks,
  selectedWeekNumber,
  onSelectWeek,
  isDarkMode,
  onToggleDarkMode,
  isAdmin,
  onToggleAdmin,
  onSyncStrava,
  isSyncing,
  connectedUser,
  onLogout,
  users = [],
}: HeaderProps) {
  const [showStravaModal, setShowStravaModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const client1Id = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || '285643';
  const client2Id = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID_2 || '286693';

  // Tính số lượng VĐV đã ủy quyền theo từng Cổng
  const stravaUsers = users.filter((u) => u.stravaAccessToken);
  const gateway2Count = stravaUsers.filter((u) => u.stravaClientId === client2Id).length;
  // Các user còn lại (hoặc không gắn client) mặc định thuộc Cổng 1
  const gateway1Count = stravaUsers.filter((u) => u.stravaClientId !== client2Id).length;

  const handleRedirectOAuth = (clientId: string) => {
    const redirectUri = window.location.origin + '/api/strava/oauth';
    const scope = 'read,activity:read_all';
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&approval_prompt=auto&scope=${scope}&state=${clientId}`;
  };

  const handleConnectStrava = () => {
    // Mở modal lựa chọn cổng thông minh
    setShowStravaModal(true);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Giải đấu */}
          <div className="flex items-center space-x-2.5 cursor-pointer flex-shrink-0" onClick={() => onSelectWeek(null)}>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30 text-white font-black text-lg sm:text-xl flex-shrink-0">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm sm:text-lg lg:text-xl text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                  <span className="sm:hidden">CNHP 2026</span>
                  <span className="hidden sm:inline">CNHP THU ĐÔNG 2026</span>
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                  Challenge
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:block">
                CNHP Running Club • 11/10/2026 - 06/12/2026
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Đăng nhập hoặc hiển thị user Strava */}
            {connectedUser ? (
              <div className="flex items-center space-x-1.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 p-1 sm:px-2.5 sm:py-1 rounded-xl">
                {connectedUser.avatar ? (
                  <img
                    src={connectedUser.avatar}
                    alt={connectedUser.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-orange-300 object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                    {connectedUser.name?.[0] || 'V'}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 leading-tight">
                    <span>{connectedUser.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Đăng xuất"
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleConnectStrava}
                className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-white bg-[#fc5200] hover:bg-[#e04900] active:scale-95 rounded-xl shadow-md transition-all whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.01 13.828h4.172" />
                </svg>
                <span className="hidden sm:inline">Strava</span>
              </button>
            )}

            {/* Nút Đồng bộ */}
            <button
              onClick={onSyncStrava}
              disabled={isSyncing}
              title="Đồng bộ bài chạy mới từ Strava"
              className="p-2 sm:px-2.5 sm:py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-orange-500' : ''}`} />
            </button>

            {/* Nút Chế độ Admin */}
            <button
              onClick={onToggleAdmin}
              title={isAdmin ? 'Tắt chế độ Quản trị' : 'Bật chế độ Quản trị & Trọng tài'}
              className={`flex items-center justify-center p-2 rounded-xl transition-all ${
                isAdmin
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="ml-1 text-xs font-bold hidden md:inline">
                {isAdmin ? 'Admin' : 'Trọng tài'}
              </span>
            </button>

            {/* Nút Cài đặt App Mobile */}
            <button
              onClick={() => setShowInstallModal(true)}
              title="Cài đặt App CNHP lên điện thoại"
              className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-xl transition-all active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-bold">App</span>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={onToggleDarkMode}
              title="Chuyển chế độ Sáng / Tối"
              className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Thanh chọn tuần (Week Selector Scroll Bar) */}
        <div className="py-2.5 overflow-x-auto scrollbar-none flex items-center space-x-1.5 sm:space-x-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={() => onSelectWeek(null)}
            className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg whitespace-nowrap transition-all ${
              selectedWeekNumber === null
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/30'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            🏆 Toàn Giải (Chung Cuộc)
          </button>

          {weeks.map((week) => {
            const isSelected = selectedWeekNumber === week.weekNumber;
            return (
              <button
                key={week.weekNumber}
                onClick={() => onSelectWeek(week.weekNumber)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {week.isFinalWeek ? '🔥 ' + week.name : week.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal Chọn Cổng Kết Nối Strava (Multi-Client OAuth) */}
      {showStravaModal && (
        <div 
          onClick={() => setShowStravaModal(false)}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3.5 my-auto max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#fc5200] flex items-center justify-center text-white shadow-md shadow-orange-500/30 flex-shrink-0">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.01 13.828h4.172" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    Kết Nối Strava
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Chọn cổng để tham gia & tự động tính điểm
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStravaModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="space-y-3 overflow-y-auto flex-1 pr-0.5">
              {/* Explanation note */}
              <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 text-[11px] text-orange-900 dark:text-orange-200 leading-relaxed flex items-start gap-2">
                <span className="text-sm flex-shrink-0">⚡</span>
                <div>
                  <strong>Hệ thống 2 Cổng Strava:</strong> Tiếp nhận tối đa 20 VĐV (10 VĐV/cổng). Thành viên mới vui lòng chọn <strong>Cổng 2</strong> để không bị chạm trần!
                </div>
              </div>

              {/* Cổng 2 (Mở Rộng - Anh Phi Long - Khuyên dùng) */}
              <div className="p-3.5 rounded-2xl border-2 border-emerald-500/80 dark:border-emerald-500/60 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 relative shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white shadow-sm">
                    ⭐ Khuyên Dùng Cho VĐV Mới
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {gateway2Count}/10 VĐV (Còn {Math.max(0, 10 - gateway2Count)} chỗ)
                  </span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  Cổng 2 (Mở Rộng - Anh Phi Long)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 my-2">
                  Cổng mở rộng mới kích hoạt, còn nhiều chỗ trống. Vận động viên mới nên chọn cổng này.
                </p>
                <button
                  onClick={() => handleRedirectOAuth(client2Id)}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>🚀 Kết Nối Ngay Qua Cổng 2 (Khuyên Dùng)</span>
                </button>
              </div>

              {/* Cổng 1 (Chính - Đặng Tùng) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Cổng 1 (Đặng Tùng)
                  </span>
                  <span className={`text-xs font-bold ${gateway1Count >= 10 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {gateway1Count >= 10 ? '10/10 VĐV (Đã Đầy)' : `${gateway1Count}/10 VĐV (Sắp đầy)`}
                  </span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  Cổng 1 (Chính - Đặng Tùng)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 my-2">
                  Dành cho các thành viên ban đầu đã từng liên kết thành công với cổng của anh Tùng.
                </p>
                <button
                  onClick={() => handleRedirectOAuth(client1Id)}
                  disabled={gateway1Count >= 10}
                  className={`w-full py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    gateway1Count >= 10
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-[#fc5200] hover:bg-[#e04900] text-white active:scale-[0.98]'
                  }`}
                >
                  <span>{gateway1Count >= 10 ? '⚠️ Cổng 1 Đã Đầy (Hãy Chọn Cổng 2 Ở Trên)' : 'Kết Nối Qua Cổng 1'}</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-1 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
              Ứng dụng chỉ đọc dữ liệu bài chạy công khai để tự động chấm điểm giải.
            </div>
          </div>
        </div>
      )}

      {/* Modal Hướng Dẫn Cài Đặt App Cho iPhone & Android */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </header>
  );
}
