'use client';

import React from 'react';
import { Week, FinancialOverview } from '@/types';
import { formatCurrency, formatKm } from '@/lib/rules-engine';
import { Calendar, Users, Award, AlertCircle, TrendingUp, Info } from 'lucide-react';

interface CountdownBannerProps {
  currentWeek: Week | null;
  totalKmAll: number;
  totalUsersCount: number;
  financialOverview: FinancialOverview;
  onViewRules?: () => void;
  onInstallApp?: () => void;
  onOpenLeaveModal?: () => void;
}

export default function CountdownBanner({
  currentWeek,
  totalKmAll,
  totalUsersCount,
  financialOverview,
  onViewRules,
  onInstallApp,
  onOpenLeaveModal,
}: CountdownBannerProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl mb-6 sm:mb-8 relative overflow-hidden border border-orange-500/20">
      {/* Background Graphic Accent */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
      <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-5 hidden lg:block pointer-events-none text-9xl font-black">
        CNHP
      </div>

      <div className="relative z-10">
        {/* Top Tag & Dates */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
              {currentWeek ? currentWeek.name : 'CHUNG CUỘC TOÀN GIẢI'}
            </span>
            {currentWeek?.isFinalWeek && (
              <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                🚨 Tuần cuối (Phạt x2)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5 text-xs sm:text-sm text-slate-300 font-medium">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span>
              {currentWeek
                ? `Thời gian: ${currentWeek.startDate} đến 24h ${currentWeek.endDate}`
                : 'Diễn ra từ 12/10/2026 đến 06/12/2026 (8 Tuần)'}
            </span>
          </div>
        </div>

        {/* Main Title & Key Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-center">
          <div className="lg:col-span-2 space-y-2">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              {currentWeek ? `Bảng Xếp Hạng ${currentWeek.name}` : 'Bảng Xếp Hạng Vinh Danh Toàn Giải'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentWeek ? (
                <span>
                  Chỉ tiêu: <strong className="text-orange-400">≥ 15 km/tuần</strong> &{' '}
                  <strong className="text-orange-400">≥ 3 ngày chạy</strong> • Trần đồng đội:{' '}
                  <strong className="text-amber-300">Tối đa 40 km/người</strong> • Hòa km:{' '}
                  <strong className="text-emerald-300">Pace chậm hơn thắng!</strong>
                </span>
              ) : (
                <span>
                  Tổng kết 8 tuần thi đấu đỉnh cao • Vinh danh Top Team, Cá Nhân Nam & Nữ • Minh bạch quỹ giải CNHP
                </span>
              )}
            </p>

            {/* Quick reminder badges */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1 text-[10px] sm:text-[11px] font-semibold">
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/10 text-slate-200 border border-white/10 flex items-center gap-1">
                <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400 flex-shrink-0" />
                <span>Pace Road: 3:30 - 10:30</span>
              </span>
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/10 text-emerald-300 border border-white/10 flex items-center gap-1">
                <span>⛰️ Trail/Hike: Tự do pace</span>
              </span>
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/10 text-amber-300 border border-white/10 flex items-center gap-1">
                <span>🔄 Được nợ bù tuần sau</span>
              </span>
              {onViewRules && (
                <button
                  onClick={onViewRules}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 flex items-center gap-1 transition-all active:scale-95"
                >
                  📜 Thể Lệ
                </button>
              )}
              {onInstallApp && (
                <button
                  onClick={onInstallApp}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all active:scale-95 font-bold"
                >
                  📱 Cài App
                </button>
              )}
              {onOpenLeaveModal && (
                <button
                  onClick={onOpenLeaveModal}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-all active:scale-95 font-bold"
                  title="Xin tạm nghỉ chạy tuần vì lý do bất khả kháng"
                >
                  🌴 Xin Nghỉ Tuần
                </button>
              )}
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 bg-white/5 backdrop-blur-md p-2.5 sm:p-4 rounded-2xl border border-white/10">
            <div className="text-center p-1.5 sm:p-2 rounded-xl bg-white/5">
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 mb-0.5">
                <span className="sm:hidden">VĐV</span>
                <span className="hidden sm:inline">Vận Động Viên</span>
              </div>
              <div className="text-sm sm:text-xl font-black text-white flex items-center justify-center gap-1">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400 flex-shrink-0" />
                <span>{totalUsersCount}</span>
              </div>
            </div>

            <div className="text-center p-1.5 sm:p-2 rounded-xl bg-white/5">
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 mb-0.5">
                <span className="sm:hidden">Tổng Cự Ly</span>
                <span className="hidden sm:inline">Tổng Quãng Đường</span>
              </div>
              <div className="text-sm sm:text-xl font-black text-orange-400 flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400 flex-shrink-0" />
                <span>{Math.round(totalKmAll)} km</span>
              </div>
            </div>

            <div className="text-center p-1.5 sm:p-2 rounded-xl bg-white/5">
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 mb-0.5">
                <span className="sm:hidden">Quỹ Giải</span>
                <span className="hidden sm:inline">Số Dư Quỹ Giải</span>
              </div>
              <div className="text-sm sm:text-xl font-black text-emerald-400 flex items-center justify-center gap-1">
                <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 flex-shrink-0" />
                <span>{formatCurrency(financialOverview.remainingFund).replace(' đ', '')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
