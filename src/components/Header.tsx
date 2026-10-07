'use client';

import React, { useState } from 'react';
import { Week } from '@/types';
import { Trophy, RefreshCw, Moon, Sun, ShieldCheck, Flame, Compass } from 'lucide-react';

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
}: HeaderProps) {
  const [showStravaModal, setShowStravaModal] = useState(false);

  const handleConnectStrava = () => {
    // Nếu có Strava Client ID thì chuyển hướng OAuth, nếu không thì thông báo kết nối demo
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    if (clientId) {
      const redirectUri = window.location.origin + '/api/strava/oauth';
      const scope = 'read,activity:read_all';
      window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&approval_prompt=auto&scope=${scope}`;
    } else {
      setShowStravaModal(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Giải đấu */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectWeek(null)}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30 text-white font-black text-xl">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base sm:text-xl text-slate-900 dark:text-white tracking-tight">
                  CNHP THU ĐÔNG 2026
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                  Challenge
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                CNHP Challenge Running Club • 11/10/2026 - 06/12/2026
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Nút Kết nối Strava */}
            <button
              onClick={handleConnectStrava}
              className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-[#fc5200] hover:bg-[#e04900] active:scale-95 rounded-xl shadow-md shadow-orange-600/20 transition-all"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.01 13.828h4.172" />
              </svg>
              <span className="hidden sm:inline">
                {connectedUser ? connectedUser.name : 'Kết nối Strava'}
              </span>
              <span className="sm:hidden">Strava</span>
            </button>

            {/* Nút Đồng bộ bài chạy */}
            <button
              onClick={onSyncStrava}
              disabled={isSyncing}
              title="Đồng bộ hoạt động mới từ Strava"
              className="flex items-center justify-center p-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-orange-500' : ''}`} />
              <span className="ml-1.5 hidden md:inline">{isSyncing ? 'Đang sync...' : 'Đồng bộ'}</span>
            </button>

            {/* Nút Chế độ Admin */}
            <button
              onClick={onToggleAdmin}
              title="Bật/Tắt chế độ Quản trị & Trọng tài"
              className={`flex items-center justify-center p-2 rounded-xl transition-all ${
                isAdmin
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="ml-1 text-xs font-semibold hidden lg:inline">
                {isAdmin ? 'Trọng tài: BẬT' : 'Trọng tài'}
              </span>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={onToggleDarkMode}
              title="Chuyển chế độ Sáng / Tối"
              className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
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

      {/* Modal hướng dẫn Strava OAuth khi chạy môi trường demo */}
      {showStravaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#fc5200] flex items-center justify-center text-white">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.01 13.828h4.172" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kết Nối Strava OAuth 2.0</h3>
                <p className="text-xs text-slate-500">Quyền đọc hoạt động: read,activity:read_all</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                Hệ thống hỗ trợ 100% chuẩn xác Strava OAuth 2.0. Để kích hoạt kết nối Strava thực tế khi triển khai online:
              </p>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs space-y-1">
                <p>STRAVA_CLIENT_ID=&lt;your_client_id&gt;</p>
                <p>STRAVA_CLIENT_SECRET=&lt;your_secret&gt;</p>
              </div>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                ✨ Trên máy local hiện tại: Hệ thống đã nạp sẵn 15 tài khoản mẫu và 51 bài chạy thực tế (Road, Trail, Trekking) để bạn kiểm thử toàn bộ thể lệ ngay!
              </p>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowStravaModal(false)}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-all"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
