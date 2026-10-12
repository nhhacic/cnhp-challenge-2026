'use client';

import React from 'react';
import { User } from '@/types';
import { X } from 'lucide-react';

interface StravaOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users?: User[];
}

export default function StravaOAuthModal({
  isOpen,
  onClose,
  users = [],
}: StravaOAuthModalProps) {
  if (!isOpen) return null;

  const client1Id = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || '285643';
  const client2Id = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID_2 || '286693';

  // Tính số lượng VĐV đã ủy quyền theo từng Cổng
  const stravaUsers = users.filter((u) => u.stravaAccessToken);
  const gateway2Count = stravaUsers.filter((u) => u.stravaClientId === client2Id).length;
  const gateway1Count = stravaUsers.filter((u) => u.stravaClientId !== client2Id).length;

  const handleRedirectOAuth = (clientId: string) => {
    const redirectUri = window.location.origin + '/api/strava/oauth';
    const scope = 'read,activity:read_all';
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&approval_prompt=auto&scope=${scope}&state=${clientId}`;
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto"
      style={{ zIndex: 9999 }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150 relative"
        style={{ zIndex: 10000 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
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
                Chọn cổng đăng nhập vào giải đấu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Danh sách 2 Cổng Đăng Nhập */}
        <div className="space-y-3">
          {/* Cổng 2 (Anh Phi Long - Khuyên dùng) */}
          <button
            onClick={() => handleRedirectOAuth(client2Id)}
            className="w-full p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 border-2 border-emerald-500/80 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col gap-1 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-extrabold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-1.5">
                🚀 Cổng 2 (Anh Phi Long)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white shadow-sm">
                Khuyên Dùng
              </span>
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              Còn trống {Math.max(0, 10 - gateway2Count)}/10 chỗ • Dành cho thành viên mới
            </div>
          </button>

          {/* Cổng 1 (Đặng Tùng) */}
          <button
            onClick={() => handleRedirectOAuth(client1Id)}
            disabled={gateway1Count >= 10}
            className={`w-full p-4 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
              gateway1Count >= 10
                ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 active:scale-[0.98] cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Cổng 1 (Đặng Tùng)
              </span>
              <span className={`text-xs font-semibold ${gateway1Count >= 10 ? 'text-rose-500' : 'text-amber-600 dark:text-amber-400'}`}>
                {gateway1Count >= 10 ? 'Đã đủ 10/10' : `${gateway1Count}/10 VĐV`}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {gateway1Count >= 10 ? 'Đã đủ số lượng VĐV' : 'Dành cho thành viên ban đầu'}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
