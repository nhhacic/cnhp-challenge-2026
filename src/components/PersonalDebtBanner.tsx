'use client';

import React, { useState } from 'react';
import { User, UserWeeklyStat, Team } from '@/types';
import { formatCurrency } from '@/lib/rules-engine';
import { BellRing, CheckCircle2, QrCode, X, ArrowRight, Sparkles, ShieldAlert, CreditCard } from 'lucide-react';

interface PersonalDebtBannerProps {
  user: User;
  team?: Team;
  currentWeekNumber: number;
  userWeeklyStats: UserWeeklyStat[];
  onOpenPaymentQr: (user: User, amount: number, type: 'PENALTY' | 'ENTRY_FEE' | 'TOTAL') => void;
  onNavigateToFinance: () => void;
}

export default function PersonalDebtBanner({
  user,
  team,
  currentWeekNumber,
  userWeeklyStats,
  onOpenPaymentQr,
  onNavigateToFinance,
}: PersonalDebtBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const isClubOnly = Boolean(team?.isClubOnly || user.teamId === 'team-4');
  const isUnpaidFee = !isClubOnly && !user.isPaidFee;
  const currentWeekStat = userWeeklyStats.find((s) => s.weekNumber === currentWeekNumber);
  const currentWeekPenalty = currentWeekStat?.totalPenaltyAmount || 0;
  const totalCumulativePenalty = userWeeklyStats.reduce((sum, s) => sum + s.totalPenaltyAmount, 0);

  const feeAmount = isUnpaidFee ? 200000 : 0;
  const totalDebtThisWeek = feeAmount + currentWeekPenalty;
  const hasDebt = totalDebtThisWeek > 0 || totalCumulativePenalty > 0;

  if (!hasDebt) {
    // Trường hợp đã hoàn thành nghĩa vụ đầy đủ
    return (
      <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
              <span>Chào {user.name}!</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isClubOnly
                  ? 'Bạn đã hoàn thành chỉ tiêu chạy tuần (≥15km & ≥3 buổi) và không có khoản phạt nào 🎉'
                  : 'Bạn đã hoàn tất 100% nộp quỹ tham dự & không có khoản phạt nào 🎉'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isClubOnly
                ? 'Tuyệt vời! Hãy tiếp tục duy trì thói quen chạy bộ đều đặn nhé!'
                : 'Cảm ơn bạn đã luôn nghiêm túc tuân thủ thể lệ CNHP Challenge! Chúc bạn chạy vui và đạt thành tích cao!'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition shrink-0"
          title="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Trường hợp đang có nợ quỹ hoặc nợ phạt
  const penaltyDetailsParts: string[] = [];
  if (currentWeekStat && currentWeekStat.missingDays > 0) {
    penaltyDetailsParts.push(`thiếu ${currentWeekStat.missingDays} buổi`);
  }
  if (currentWeekStat && currentWeekStat.deficitKm > 0) {
    penaltyDetailsParts.push(`thiếu ${currentWeekStat.deficitKm}km`);
  }
  const penaltyReason = penaltyDetailsParts.length > 0 ? ` (${penaltyDetailsParts.join(', ')})` : '';

  return (
    <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 dark:from-rose-950/40 dark:via-orange-950/30 dark:to-amber-950/30 border-2 border-rose-300 dark:border-rose-800 shadow-lg shadow-rose-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn relative overflow-hidden">
      {/* Decorative accent */}
      <div className="absolute -right-8 -top-8 w-28 h-28 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-start gap-3.5 relative z-10">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-orange-500 text-white flex items-center justify-center font-bold shadow-md shadow-rose-500/30 shrink-0">
          <BellRing className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              Chào {user.name} ({team?.name || 'VĐV'})!
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shadow-sm">
              Nhắc nợ từ Thủ quỹ
            </span>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
            Bạn có khoản đóng góp cần hoàn thành trước <strong>12h00 Thứ Ba</strong>:
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
            {isUnpaidFee && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                <CreditCard className="w-3 h-3 text-blue-600" />
                <span>Phí tham dự: 200.000đ</span>
              </span>
            )}
            {currentWeekPenalty > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                <ShieldAlert className="w-3 h-3 text-rose-600" />
                <span>Phạt Tuần {currentWeekNumber}: {formatCurrency(currentWeekPenalty)}{penaltyReason}</span>
              </span>
            )}
            <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
              👉 Tổng cần nộp: {formatCurrency(totalDebtThisWeek)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 relative z-10 shrink-0">
        <button
          onClick={() => onOpenPaymentQr(user, totalDebtThisWeek, isUnpaidFee && currentWeekPenalty === 0 ? 'ENTRY_FEE' : 'TOTAL')}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white text-xs font-black shadow-md shadow-rose-500/20 active:scale-95 transition-all"
        >
          <QrCode className="w-4 h-4" />
          <span>Quét QR Nộp Ngay</span>
        </button>

        <button
          onClick={onNavigateToFinance}
          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition"
          title="Xem chi tiết sổ nợ và báo cáo tài chính"
        >
          <span>Xem Quỹ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          title="Tạm ẩn thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
