'use client';

import React, { useRef, useState } from 'react';
import { FinancialOverview, User, Team, Week, UserWeeklyStat, TeamWeeklyStat } from '@/types';
import { formatCurrency, formatKm } from '@/lib/rules-engine';
import { toPng } from 'html-to-image';
import { DollarSign, Award, AlertTriangle, Download, Share2, Flame, CheckCircle2, ShieldAlert } from 'lucide-react';

interface FinanceAndDeficitProps {
  financialOverview: FinancialOverview;
  users: User[];
  teams: Team[];
  weeks: Week[];
  selectedWeek: Week | null;
  userWeeklyStatsMap: Record<string, UserWeeklyStat[]>;
  rankedTeamsByWeek: Record<number, TeamWeeklyStat[]>;
}

export default function FinanceAndDeficit({
  financialOverview,
  users,
  teams,
  weeks,
  selectedWeek,
  userWeeklyStatsMap,
  rankedTeamsByWeek,
}: FinanceAndDeficitProps) {
  const exportCardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  // Danh sách những người đang nợ km chạy bù
  const deficitLedger = users.map((user) => {
    const stats = userWeeklyStatsMap[user.id] || [];
    const team = teamMap.get(user.teamId);

    // Tính tổng nợ và nợ tuần hiện tại
    const currentWeekNum = selectedWeek?.weekNumber || 1;
    const currentStat = stats.find((s) => s.weekNumber === currentWeekNum);
    const prevStat = stats.find((s) => s.weekNumber === currentWeekNum - 1);

    const prevOwedKm = prevStat?.rolledOverToNextWeek || 0;
    const currentActualKm = currentStat?.actualKm || 0;
    const currentTargetKm = currentStat?.totalTargetKm || 15;
    const isCleared = currentStat?.deficitKm === 0;

    return {
      user,
      team,
      prevOwedKm,
      currentActualKm,
      currentTargetKm,
      remainingDeficit: currentStat?.deficitKm || 0,
      isCleared,
      totalPenalties: stats.reduce((sum, s) => sum + s.totalPenaltyAmount, 0),
    };
  }).filter((item) => item.prevOwedKm > 0 || item.remainingDeficit > 0 || item.totalPenalties > 0);

  // Danh sách nộp phạt của tuần hiện tại
  const currentWeekNumber = selectedWeek?.weekNumber || 1;
  const currentWeekTeams = rankedTeamsByWeek[currentWeekNumber] || [];
  const currentWeekPenalties = users.map((user) => {
    const stats = userWeeklyStatsMap[user.id] || [];
    const stat = stats.find((s) => s.weekNumber === currentWeekNumber);
    const team = teamMap.get(user.teamId);
    return {
      user,
      team,
      stat,
    };
  }).filter((item) => item.stat && item.stat.totalPenaltyAmount > 0);

  // Xử lý xuất ảnh PNG cho Zalo
  const handleExportZaloCard = async () => {
    if (!exportCardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(exportCardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `CNHP_ThuDong2026_Tuan${currentWeekNumber}_TongKet.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Lỗi khi xuất ảnh Zalo card:', err);
      alert('Không thể tạo file ảnh. Vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Tổng Quan Quỹ Giải (Financial Summary Cards) */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Báo Cáo Tài Chính & Quỹ Giải CNHP
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Minh bạch thu phí tham dự, tiền phạt và tiền thưởng cho runner
            </p>
          </div>

          {/* Nút xuất thẻ Zalo */}
          <button
            onClick={handleExportZaloCard}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>{isExporting ? 'Đang tạo ảnh...' : `Xuất Ảnh Poster Tuần ${currentWeekNumber} cho Zalo`}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Phí Tham Dự (200k/người)
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {formatCurrency(financialOverview.totalFeeCollected)}
            </span>
            <span className="text-[11px] text-emerald-600 block mt-1">
              {users.filter((u) => u.isPaidFee).length}/{users.length} người đã đóng
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Tổng Tiền Phạt Đã Thu
            </span>
            <span className="text-lg font-black text-rose-500">
              +{formatCurrency(financialOverview.totalPenalties)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Từ thiếu km & thiếu buổi</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Thưởng Tuần (300k/tuần)
            </span>
            <span className="text-lg font-black text-amber-500">
              -{formatCurrency(financialOverview.totalWeeklyRewards)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Nhất 150k • Nhì 100k • Ba 50k</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Thưởng Chung Cuộc
            </span>
            <span className="text-lg font-black text-indigo-500">
              -{formatCurrency(financialOverview.totalFinalRewards)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Đồng đội & Cá nhân</span>
          </div>

          <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-300 dark:border-emerald-800">
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold block mb-1">
              Số Dư Quỹ Liên Hoan 🎉
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(financialOverview.remainingFund)}
            </span>
            <span className="text-[11px] text-emerald-700/80 block mt-1">Dành cho gala tổng kết</span>
          </div>
        </div>
      </div>

      {/* 2. Sổ Nợ Chạy Bù (Deficit Ledger) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Sổ Nợ Chạy Bù (Deficit & Rollover Ledger)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Theo thể lệ: Km thiếu ở tuần trước bắt buộc phải bù vào chỉ tiêu của tuần kế tiếp.
          </p>
        </div>

        {deficitLedger.length === 0 ? (
          <div className="text-center py-8 text-emerald-600 dark:text-emerald-400 text-sm font-semibold bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/40">
            ✨ Tuyệt vời! Hiện tại không có thành viên nào bị nợ km chạy bù!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Vận Động Viên</th>
                  <th className="py-3 px-4">Đội</th>
                  <th className="py-3 px-4 text-right">Nợ Tuần Trước</th>
                  <th className="py-3 px-4 text-right">Chỉ Tiêu Tuần {currentWeekNumber}</th>
                  <th className="py-3 px-4 text-right">Đã Chạy Tuần {currentWeekNumber}</th>
                  <th className="py-3 px-4 text-center">Tình Trạng Nợ</th>
                  <th className="py-3 px-4 text-right">Tổng Tiền Phạt Lũy Kế</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {deficitLedger.map((row) => (
                  <tr key={row.user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <img src={row.user.avatar} className="w-8 h-8 rounded-full object-cover" />
                      {row.user.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold" style={{ color: row.team?.color }}>
                        {row.team?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-amber-600 dark:text-amber-400">
                      {row.prevOwedKm > 0 ? formatKm(row.prevOwedKm) : '0 km'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-orange-600 dark:text-orange-400">
                      {formatKm(row.currentTargetKm)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">
                      {formatKm(row.currentActualKm)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {row.isCleared ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã Sạch Nợ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400">
                          Còn thiếu {formatKm(row.remainingDeficit)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-rose-500">
                      {formatCurrency(row.totalPenalties)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. KHUNG POSTER XUẤT ẢNH CHO ZALO (Hidden container used for rendering export image) */}
      <div className="bg-slate-100 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-blue-500" />
            Bản xem trước Poster Tổng Kết Tuần {currentWeekNumber} gửi Zalo
          </span>
          <button
            onClick={handleExportZaloCard}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Tải ảnh chất lượng cao (.PNG)
          </button>
        </div>

        {/* Khung Poster */}
        <div className="overflow-x-auto flex justify-center py-2">
          <div
            ref={exportCardRef}
            className="w-[480px] bg-gradient-to-b from-slate-900 via-slate-950 to-orange-950 text-white rounded-3xl p-6 shadow-2xl border-4 border-orange-500/40 relative font-sans"
          >
            {/* Header Poster */}
            <div className="text-center border-b border-orange-500/30 pb-4 mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-black uppercase mb-1">
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                CNHP RUNNING CLUB
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white uppercase">
                BẢNG VÀNG TUẦN {currentWeekNumber}
              </h2>
              <p className="text-xs text-slate-300">
                Challenge Thu Đông 2026 • {selectedWeek?.startDate} - {selectedWeek?.endDate}
              </p>
            </div>

            {/* Top 3 Đội Vinh Danh */}
            <div className="mb-5">
              <div className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2.5 text-center">
                🏆 VINH DANH THƯỞNG ĐỒNG ĐỘI
              </div>
              <div className="space-y-2">
                {currentWeekTeams.slice(0, 3).map((team) => (
                  <div
                    key={team.teamId}
                    className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                        {team.rank}
                      </span>
                      <div>
                        <div className="font-bold text-sm text-white">{team.teamName}</div>
                        <div className="text-[11px] text-slate-300">
                          Bình quân: <strong>{team.averageCappedKmPerMember.toFixed(2)} km/người</strong>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500 text-white shadow-sm">
                        +{formatCurrency(team.rewardAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Danh Sách Nộp Phạt Tuần */}
            <div className="border-t border-white/10 pt-4">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2 text-center flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                DANH SÁCH NỘP PHẠT TUẦN {currentWeekNumber}
              </div>

              {currentWeekPenalties.length === 0 ? (
                <div className="text-center py-3 text-emerald-400 text-xs font-semibold bg-white/5 rounded-xl">
                  🎉 Tuần này 100% thành viên hoàn thành xuất sắc chỉ tiêu!
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {currentWeekPenalties.map(({ user, team, stat }) => (
                    <div
                      key={user.id}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{user.name}</span>{' '}
                        <span className="text-[10px] text-slate-400">({team?.name.split('-')[0]})</span>
                        <div className="text-[10px] text-slate-300">
                          {stat?.missingDays ? `Thiếu ${stat.missingDays} buổi ` : ''}
                          {stat?.deficitKm ? `• Thiếu ${stat.deficitKm}km` : ''}
                        </div>
                      </div>
                      <span className="font-black text-rose-400 text-sm">
                        {formatCurrency(stat?.totalPenaltyAmount || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Poster */}
            <div className="mt-4 pt-3 border-t border-white/10 text-center text-[10px] text-slate-400">
              *Tiền phạt chuyển về Trưởng nhóm trước 12h Thứ 3 hàng tuần • Chạy vui - Khỏe - Gắn kết!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
