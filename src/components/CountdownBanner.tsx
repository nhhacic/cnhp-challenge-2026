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
}

export default function CountdownBanner({
  currentWeek,
  totalKmAll,
  totalUsersCount,
  financialOverview,
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
                : 'Diễn ra từ 11/10/2026 đến 06/12/2026 (8 Tuần)'}
            </span>
          </div>
        </div>

        {/* Main Title & Key Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
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
            <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 border border-white/10 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                Pace Road: 3:30 - 10:30
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-emerald-300 border border-white/10 flex items-center gap-1">
                ⛰️ Trail & Hike: Không giới hạn pace
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-amber-300 border border-white/10 flex items-center gap-1">
                🔄 Km thiếu được nợ chạy bù tuần sau
              </span>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-white/5 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/10">
            <div className="text-center p-2 rounded-xl bg-white/5">
              <div className="text-[11px] font-medium text-slate-400 mb-0.5">Vận Động Viên</div>
              <div className="text-base sm:text-xl font-bold text-white flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                {totalUsersCount}
              </div>
            </div>

            <div className="text-center p-2 rounded-xl bg-white/5">
              <div className="text-[11px] font-medium text-slate-400 mb-0.5">Tổng Quãng Đường</div>
              <div className="text-base sm:text-xl font-bold text-orange-400 flex items-center justify-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                {Math.round(totalKmAll)} km
              </div>
            </div>

            <div className="text-center p-2 rounded-xl bg-white/5">
              <div className="text-[11px] font-medium text-slate-400 mb-0.5">Số Dư Quỹ Giải</div>
              <div className="text-base sm:text-xl font-bold text-emerald-400 flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                {formatCurrency(financialOverview.remainingFund).replace(' đ', '')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
