'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Week, Team, User, UserWeeklyStat, TeamWeeklyStat, Activity } from '@/types';
import { formatCurrency, formatKm, formatPace, RULES } from '@/lib/rules-engine';
import { toPng } from 'html-to-image';
import {
  Trophy,
  Award,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Filter,
  Search,
  Users,
  Flame,
  Zap,
  Sparkles,
  Eye,
  Shield,
  Heart,
  Clock,
  ArrowRight,
  TrendingUp,
  Share2,
} from 'lucide-react';

interface WeeklySummaryProps {
  weeks: Week[];
  selectedWeekNumber: number | null;
  onSelectWeek: (weekNum: number | null) => void;
  teams: Team[];
  users: User[];
  userWeeklyStatsMap: Record<string, UserWeeklyStat[]>;
  rankedTeamsByWeek: Record<number, TeamWeeklyStat[]>;
  activities: Activity[];
  onSelectUser: (user: User) => void;
  isAdmin?: boolean;
}

export default function WeeklySummary({
  weeks,
  selectedWeekNumber,
  onSelectWeek,
  teams,
  users,
  userWeeklyStatsMap,
  rankedTeamsByWeek,
  activities,
  onSelectUser,
  isAdmin = false,
}: WeeklySummaryProps) {
  // Mặc định tuần hiển thị: nếu selectedWeekNumber có giá trị thì dùng, ngược lại chọn Tuần 1
  const effectiveWeekNumber = selectedWeekNumber || 1;
  const currentWeek = weeks.find((w) => w.weekNumber === effectiveWeekNumber) || weeks[0];

  // Trạng thái bộ lọc
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'DEFICIT' | 'EXCUSED'>('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedZalo, setCopiedZalo] = useState<boolean>(false);

  const exportSummaryRef = useRef<HTMLDivElement>(null);
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  // Kiểm tra thời gian kết thúc của tuần theo GMT+7
  const now = new Date();
  const weekStart = currentWeek ? new Date(`${currentWeek.startDate}T00:00:00+07:00`) : new Date();
  const weekEnd = currentWeek ? new Date(`${currentWeek.endDate}T23:59:59+07:00`) : new Date();
  const isWeekPast = now > weekEnd;
  const isWeekCurrent = now >= weekStart && now <= weekEnd;
  const isWeekFuture = now < weekStart;

  // Xếp hạng các đội trong tuần
  const weeklyTeamStats = rankedTeamsByWeek[effectiveWeekNumber] || [];
  const challengeTeams = weeklyTeamStats.filter((t) => !t.isClubOnly && t.teamId !== 'team-4');
  const clubOnlyTeamStat = weeklyTeamStats.find((t) => Boolean(t.isClubOnly || t.teamId === 'team-4'));
  const clubTeam = teams.find((t) => Boolean(t.isClubOnly || t.id === 'team-4'));

  // Danh sách số liệu chi tiết của từng VĐV trong tuần
  const memberRows = useMemo(() => {
    return users.map((user) => {
      const statsList = userWeeklyStatsMap[user.id] || [];
      const stat = statsList.find((s) => s.weekNumber === effectiveWeekNumber);
      const team = teamMap.get(user.teamId);
      const isClubOnly = Boolean(team?.isClubOnly || user.teamId === 'team-4');

      return {
        user,
        team,
        stat: stat || {
          userId: user.id,
          weekNumber: effectiveWeekNumber,
          validActivitiesCount: 0,
          uniqueRunDays: [],
          totalDaysRun: 0,
          actualKm: 0,
          cappedKm: 0,
          baseTargetKm: 15.0,
          previousDeficitKm: 0,
          totalTargetKm: 15.0,
          deficitKm: 15.0,
          roundedDeficitKm: 15,
          missingDays: 3,
          penaltyKmAmount: 0,
          penaltyDaysAmount: 0,
          totalPenaltyAmount: 0,
          totalMovingTimeSec: 0,
          averagePaceSeconds: 0,
          isCompleted: false,
          rolledOverToNextWeek: 0,
          isExcused: false,
          isClubOnly,
        },
        isClubOnly,
      };
    });
  }, [users, userWeeklyStatsMap, effectiveWeekNumber, teamMap]);

  // Các chỉ số KPI tổng hợp toàn CLB trong tuần
  const totalActualKm = memberRows.reduce((sum, r) => sum + r.stat.actualKm, 0);
  const totalCappedKm = memberRows.reduce((sum, r) => sum + r.stat.cappedKm, 0);
  const totalValidRuns = memberRows.reduce((sum, r) => sum + r.stat.validActivitiesCount, 0);
  const totalPenaltyAmount = memberRows.reduce((sum, r) => sum + r.stat.totalPenaltyAmount, 0);
  const completedCount = memberRows.filter((r) => r.stat.isCompleted).length;
  const excusedCount = memberRows.filter((r) => r.stat.isExcused).length;
  const totalRewardAmount = challengeTeams.reduce((sum, t) => sum + t.rewardAmount, 0);

  // Tìm danh hiệu cá nhân xuất sắc nhất tuần
  // King of Week (Top 1 Nam có km cao nhất tuần)
  const maleRunners = memberRows
    .filter((r) => r.user.gender === 'MALE' && r.stat.actualKm > 0)
    .sort((a, b) => b.stat.actualKm - a.stat.actualKm);
  const kingOfWeek = maleRunners[0] || null;

  // Queen of Week (Top 1 Nữ có km cao nhất tuần)
  const femaleRunners = memberRows
    .filter((r) => r.user.gender === 'FEMALE' && r.stat.actualKm > 0)
    .sort((a, b) => b.stat.actualKm - a.stat.actualKm);
  const queenOfWeek = femaleRunners[0] || null;

  // Speed Master (VĐV có Pace nhanh nhất tuần, điều kiện cự ly >= 15km)
  const qualifiedForPace = memberRows
    .filter((r) => r.stat.actualKm >= 15.0 && r.stat.averagePaceSeconds > 0)
    .sort((a, b) => a.stat.averagePaceSeconds - b.stat.averagePaceSeconds);
  const speedMaster = qualifiedForPace[0] || null;

  // Iron Runner (VĐV cần mẫn nhất - nhiều ngày chạy nhất tuần)
  const activeRunners = [...memberRows]
    .filter((r) => r.stat.totalDaysRun > 0)
    .sort((a, b) => {
      if (b.stat.totalDaysRun !== a.stat.totalDaysRun) {
        return b.stat.totalDaysRun - a.stat.totalDaysRun;
      }
      return b.stat.actualKm - a.stat.actualKm;
    });
  const ironRunner = activeRunners[0] || null;

  // Lọc danh sách thành viên theo bộ lọc
  const filteredMembers = memberRows.filter(({ user, team, stat, isClubOnly }) => {
    if (teamFilter !== 'ALL' && user.teamId !== teamFilter) return false;
    if (genderFilter !== 'ALL' && user.gender !== genderFilter) return false;
    if (statusFilter === 'COMPLETED' && !stat.isCompleted) return false;
    if (statusFilter === 'DEFICIT' && (stat.isCompleted || stat.isExcused)) return false;
    if (statusFilter === 'EXCUSED' && !stat.isExcused) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = user.name.toLowerCase().includes(q);
      const matchTeam = team?.name.toLowerCase().includes(q);
      if (!matchName && !matchTeam) return false;
    }
    return true;
  });

  // Sắp xếp: Km nhiều hơn xếp trước; nếu bằng thì Pace chậm hơn thắng (thể lệ)
  filteredMembers.sort((a, b) => {
    if (b.stat.actualKm !== a.stat.actualKm) {
      return b.stat.actualKm - a.stat.actualKm;
    }
    return b.stat.averagePaceSeconds - a.stat.averagePaceSeconds;
  });

  // Hàm tạo nội dung báo cáo Zalo
  const handleCopyZaloReport = () => {
    if (!currentWeek) return;

    let text = `📢 BẢNG TỔNG HỢP KẾT QUẢ ${currentWeek.name.toUpperCase()} (CNHP THU ĐÔNG 2026)\n`;
    text += `⏱️ Thời gian: ${currentWeek.startDate} đến ${currentWeek.endDate}\n`;
    text += `🏃 Tổng quãng đường CLB: ${formatKm(totalActualKm)} (${totalValidRuns} bài chạy hợp lệ)\n`;
    text += `🎯 Tỷ lệ hoàn thành: ${completedCount}/${users.length} VĐV (${Math.round((completedCount / users.length) * 100)}%)\n\n`;

    text += `🏆 XẾP HẠNG ĐỘI TUẦN:\n`;
    challengeTeams.forEach((t) => {
      const medal = t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : '🥉';
      const reward = t.rewardAmount > 0 ? ` (+${formatCurrency(t.rewardAmount)})` : '';
      text += `${medal} Hạng ${t.rank}: ${t.teamName}\n   👉 Cự ly TB: ${formatKm(t.averageCappedKmPerMember)}/VĐV | Pace TB: ${formatPace(t.averagePaceSeconds)}${reward}\n`;
    });

    if (clubOnlyTeamStat) {
      text += `🌟 Đội Phong Trào CLB: ${clubOnlyTeamStat.teamName} (${formatKm(clubOnlyTeamStat.totalActualKm)})\n`;
    }

    text += `\n👑 VINH DANH CÁ NHÂN XUẤT SẮC:\n`;
    if (kingOfWeek) {
      text += `👑 King of Week (Nam): ${kingOfWeek.user.name} (${formatKm(kingOfWeek.stat.actualKm)} - Pace ${formatPace(kingOfWeek.stat.averagePaceSeconds)})\n`;
    }
    if (queenOfWeek) {
      text += `👑 Queen of Week (Nữ): ${queenOfWeek.user.name} (${formatKm(queenOfWeek.stat.actualKm)} - Pace ${formatPace(queenOfWeek.stat.averagePaceSeconds)})\n`;
    }
    if (speedMaster) {
      text += `⚡ Chân Chạy Tốc Độ: ${speedMaster.user.name} (Pace ${formatPace(speedMaster.stat.averagePaceSeconds)} - ${formatKm(speedMaster.stat.actualKm)})\n`;
    }

    // Danh sách thiếu chỉ tiêu & phạt
    const deficitMembers = memberRows.filter((r) => !r.stat.isCompleted && !r.stat.isExcused);
    if (deficitMembers.length > 0) {
      text += `\n⚠️ DANH SÁCH CHƯA ĐẠT CHỈ TIÊU & TIỀN PHẠT TUẦN:\n`;
      deficitMembers.forEach((r) => {
        const missDaysText = r.stat.missingDays > 0 ? `thiếu ${r.stat.missingDays}b` : '';
        const missKmText = r.stat.roundedDeficitKm > 0 ? `thiếu ${r.stat.roundedDeficitKm}km` : '';
        const missDetails = [missDaysText, missKmText].filter(Boolean).join(', ');
        text += `• ${r.user.name} (${r.team?.name?.split('-')[0]?.trim() || ''}): Phạt ${formatCurrency(r.stat.totalPenaltyAmount)} (${missDetails})\n`;
      });
      text += `\n💳 Kênh nộp phạt: Thủ quỹ TRINH LONG\nTechcombank: 19030671988989 (Cú pháp: CNHP PHAT [Tên] T${effectiveWeekNumber})\n`;
    } else {
      text += `\n🎉 Chúc mừng 100% VĐV đều hoàn thành xuất sắc chỉ tiêu tuần! (0đ phạt)\n`;
    }

    navigator.clipboard.writeText(text);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 2500);
  };

  // Hàm xuất ảnh PNG Bảng Tổng Hợp Tuần
  const handleExportPng = async () => {
    if (!exportSummaryRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(exportSummaryRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0f172a',
      });
      const link = document.createElement('a');
      link.download = `CNHP_Tong_Hop_Tuan_${effectiveWeekNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Lỗi khi xuất ảnh bảng tổng hợp:', err);
      alert('Không thể xuất ảnh. Vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. THANH CHỌN TUẦN TỔNG HỢP (Week Selector Bar) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-orange-500" />
              <span>Bảng Tổng Hợp Kết Quả Theo Tuần</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Theo dõi chi tiết kết quả thi đấu, thứ hạng đội, danh hiệu cá nhân và danh sách phạt của từng tuần
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyZaloReport}
              className="flex items-center space-x-1.5 px-3 py-2 sm:px-3.5 sm:py-2 text-xs font-bold rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition active:scale-95"
              title="Sao chép tóm tắt định dạng chuẩn Zalo"
            >
              {copiedZalo ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedZalo ? 'Đã chép!' : 'Chép Zalo'}</span>
            </button>

            <button
              onClick={handleExportPng}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3 py-2 sm:px-3.5 sm:py-2 text-xs font-bold rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition active:scale-95 disabled:opacity-50"
              title="Xuất thẻ ảnh Infographic tổng kết tuần để chia sẻ"
            >
              <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Đang xuất ảnh...' : 'Tải Ảnh PNG'}</span>
            </button>
          </div>
        </div>

        {/* Danh sách các tuần */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pt-2 border-t border-slate-100 dark:border-slate-800">
          {weeks.map((week) => {
            const isSelected = effectiveWeekNumber === week.weekNumber;
            const wStart = new Date(`${week.startDate}T00:00:00+07:00`);
            const wEnd = new Date(`${week.endDate}T23:59:59+07:00`);
            const isDone = now > wEnd;
            const isCurrent = now >= wStart && now <= wEnd;

            return (
              <button
                key={week.weekNumber}
                onClick={() => onSelectWeek(week.weekNumber)}
                className={`flex-shrink-0 flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/25'
                    : isCurrent
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                    : isDone
                    ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span>{week.isFinalWeek ? '🔥 ' + week.name : week.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : isCurrent
                      ? 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                      : isDone
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? 'Đã xong' : isCurrent ? 'Đang chạy' : 'Sắp tới'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. HERO CARD THÔNG TIN TUẦN & CHỈ SỐ KPI */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 text-white p-5 sm:p-7 shadow-xl border border-orange-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2 border border-orange-500/30">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>{currentWeek.name} • {currentWeek.startDate} đến {currentWeek.endDate}</span>
              {currentWeek.isFinalWeek && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">Chung kết</span>}
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              Tổng Hợp Kết Quả {currentWeek.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Chỉ tiêu tuần: Tối thiểu 15.0 km & 3 buổi chạy hợp lệ • Trần tích lũy đội: 40 km/người • Phạt 20k/km & 50k/buổi
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Trạng Thái Tuần</span>
              <span className={`text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 mt-0.5 ${
                isWeekPast ? 'text-emerald-400' : isWeekCurrent ? 'text-amber-400' : 'text-slate-400'
              }`}>
                {isWeekPast ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã Kết Thúc</span>
                  </>
                ) : isWeekCurrent ? (
                  <>
                    <Zap className="w-4 h-4 animate-pulse" />
                    <span>Đang Diễn Ra</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Sắp Diễn Ra</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 6 Khối KPI nổi bật của tuần */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-5">
          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
              <span>Tổng Km CLB</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-white">{formatKm(totalActualKm)}</div>
            <div className="text-[11px] text-orange-300/80 mt-0.5">Cap: {formatKm(totalCappedKm)}</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Số Bài Chạy</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-400">{totalValidRuns}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Bài chạy hợp lệ</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đạt Chỉ Tiêu</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-400">
              {completedCount} / {users.length}
            </div>
            <div className="text-[11px] text-emerald-300/80 mt-0.5">
              {Math.round((completedCount / (users.length || 1)) * 100)}% thành viên
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>Thưởng Tuần</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-yellow-400">
              {formatCurrency(totalRewardAmount)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">150k • 100k • 50k</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Phạt Tuần Này</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-rose-400">
              {formatCurrency(totalPenaltyAmount)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {totalPenaltyAmount > 0 ? 'Phạt km & buổi' : 'Không có nợ phạt'}
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
              <Heart className="w-3.5 h-3.5 text-purple-400" />
              <span>Nghỉ Phép</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-purple-300">
              {excusedCount} VĐV
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Lý do bất khả kháng</div>
          </div>
        </div>
      </div>

      {/* 3. VINH DANH CÁ NHÂN XUẤT SẮC TRONG TUẦN (Weekly MVPs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* King of Week */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 rounded-3xl p-4 sm:p-5 border border-amber-300/60 dark:border-amber-800/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-extrabold uppercase">
              👑 King of the Week
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Top 1 Nam</span>
          </div>

          {kingOfWeek ? (
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => onSelectUser(kingOfWeek.user)}
            >
              <img
                src={kingOfWeek.user.avatar}
                alt={kingOfWeek.user.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400 shadow-md group-hover:scale-105 transition"
              />
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate group-hover:text-amber-600 transition">
                  {kingOfWeek.user.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {kingOfWeek.team?.name?.split('-')[0]?.trim()}
                </div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {formatKm(kingOfWeek.stat.actualKm)} • Pace {formatPace(kingOfWeek.stat.averagePaceSeconds)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-2">Chưa ghi nhận bài chạy nam tuần này</div>
          )}
        </div>

        {/* Queen of Week */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-900 rounded-3xl p-4 sm:p-5 border border-rose-300/60 dark:border-rose-800/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-extrabold uppercase">
              👑 Queen of the Week
            </span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Top 1 Nữ</span>
          </div>

          {queenOfWeek ? (
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => onSelectUser(queenOfWeek.user)}
            >
              <img
                src={queenOfWeek.user.avatar}
                alt={queenOfWeek.user.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-rose-400 shadow-md group-hover:scale-105 transition"
              />
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate group-hover:text-rose-600 transition">
                  {queenOfWeek.user.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {queenOfWeek.team?.name?.split('-')[0]?.trim()}
                </div>
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {formatKm(queenOfWeek.stat.actualKm)} • Pace {formatPace(queenOfWeek.stat.averagePaceSeconds)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-2">Chưa ghi nhận bài chạy nữ tuần này</div>
          )}
        </div>

        {/* Speed Master */}
        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900 rounded-3xl p-4 sm:p-5 border border-blue-300/60 dark:border-blue-800/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-xs font-extrabold uppercase">
              ⚡ Chân Chạy Tốc Độ
            </span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Pace Tốt Nhất</span>
          </div>

          {speedMaster ? (
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => onSelectUser(speedMaster.user)}
            >
              <img
                src={speedMaster.user.avatar}
                alt={speedMaster.user.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-400 shadow-md group-hover:scale-105 transition"
              />
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition">
                  {speedMaster.user.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {speedMaster.team?.name?.split('-')[0]?.trim()}
                </div>
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  Pace {formatPace(speedMaster.stat.averagePaceSeconds)} • {formatKm(speedMaster.stat.actualKm)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-2">Cần hoàn thành ≥ 15km để xét giải pace</div>
          )}
        </div>

        {/* Iron Runner */}
        <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900 rounded-3xl p-4 sm:p-5 border border-purple-300/60 dark:border-purple-800/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 text-xs font-extrabold uppercase">
              🐝 Chăm Chỉ Nhất
            </span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Nhiều Buổi Nhất</span>
          </div>

          {ironRunner ? (
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => onSelectUser(ironRunner.user)}
            >
              <img
                src={ironRunner.user.avatar}
                alt={ironRunner.user.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-400 shadow-md group-hover:scale-105 transition"
              />
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate group-hover:text-purple-600 transition">
                  {ironRunner.user.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {ironRunner.team?.name?.split('-')[0]?.trim()}
                </div>
                <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  {ironRunner.stat.totalDaysRun} ngày chạy • {formatKm(ironRunner.stat.actualKm)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-2">Chưa ghi nhận buổi chạy nào</div>
          )}
        </div>
      </div>

      {/* 4. BẢNG XẾP HẠNG TẬP THỂ TUẦN (Team Standings) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                Bảng Xếp Hạng Tập Thể {currentWeek.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Xếp hạng theo Km bình quân/người (Cap 40km) • Tie-break: Pace CHẬM HƠN xếp trên
              </p>
            </div>
          </div>
        </div>

        {/* Bảng các đội Challenge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {challengeTeams.map((teamStat) => {
            const isFirst = teamStat.rank === 1;
            const isSecond = teamStat.rank === 2;
            const isThird = teamStat.rank === 3;
            const medalEmoji = isFirst ? '🥇' : isSecond ? '🥈' : '🥉';
            const medalColor = isFirst
              ? 'border-amber-400 bg-amber-500/10'
              : isSecond
              ? 'border-slate-300 bg-slate-500/10'
              : 'border-amber-700 bg-amber-700/10';

            return (
              <div
                key={teamStat.teamId}
                className={`relative rounded-3xl p-5 border-2 transition-all ${
                  isFirst
                    ? 'border-amber-400 dark:border-amber-500/70 bg-gradient-to-b from-amber-500/10 to-transparent shadow-lg shadow-amber-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-9 h-9 rounded-2xl bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow">
                      {medalEmoji} {teamStat.rank}
                    </span>
                    <div>
                      <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1">
                        {teamStat.teamName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {teamStat.memberCount} thành viên
                      </p>
                    </div>
                  </div>

                  {teamStat.rewardAmount > 0 && (
                    <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-extrabold text-xs border border-amber-200 dark:border-amber-800 whitespace-nowrap">
                      +{formatCurrency(teamStat.rewardAmount)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                      Km TB / VĐV
                    </span>
                    <span className="text-sm sm:text-base font-black text-orange-600 dark:text-orange-400 block mt-0.5">
                      {formatKm(teamStat.averageCappedKmPerMember)}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                      Pace TB Đội
                    </span>
                    <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200 block mt-0.5">
                      {formatPace(teamStat.averagePaceSeconds)}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                      Tổng Km Thực
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mt-0.5">
                      {formatKm(teamStat.totalActualKm)}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                      Điểm Cap 40
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mt-0.5">
                      {formatKm(teamStat.totalCappedKm)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Khối Team 4 CLB Phong Trào */}
        {clubOnlyTeamStat && (
          <div className="mt-4 p-4 rounded-3xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="w-9 h-9 rounded-2xl bg-purple-600 text-white font-black flex items-center justify-center text-sm shadow">
                🏃
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm sm:text-base text-purple-950 dark:text-purple-200">
                    {clubOnlyTeamStat.teamName}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                    Phong Trào CLB
                  </span>
                </div>
                <p className="text-xs text-purple-700/80 dark:text-purple-300/80 mt-0.5">
                  Chỉ tiêu: 15km & 3 buổi/tuần • Thiếu phạt 20k/km & 50k/buổi • Không nợ gối đầu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Quân số:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {clubOnlyTeamStat.memberCount} VĐV
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Tổng Km:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {formatKm(clubOnlyTeamStat.totalActualKm)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Pace TB:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatPace(clubOnlyTeamStat.averagePaceSeconds)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. BẢNG CHI TIẾT TỪNG THÀNH VIÊN TRONG TUẦN (All Runners Detail Table) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              <span>Bảng Chi Tiết Toàn Bộ Vận Động Viên ({filteredMembers.length}/{users.length})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chi tiết số buổi, quãng đường thực tế, điểm tích lũy, trạng thái đạt chuẩn và tiền phạt từng người
            </p>
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên VĐV..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-2xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>
        </div>

        {/* Thanh Bộ Lọc (Filter Toolbar) */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Lọc Đội */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto scrollbar-none">
            <button
              onClick={() => setTeamFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                teamFilter === 'ALL'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Tất cả đội
            </button>
            {teams.map((t) => (
              <button
                key={t.id}
                onClick={() => setTeamFilter(t.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                  teamFilter === t.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t.name.split('-')[0]?.trim() || t.name}
              </button>
            ))}
          </div>

          {/* Lọc Trạng Thái */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <Check className="w-3 h-3" />
              <span>Đạt chuẩn</span>
            </button>
            <button
              onClick={() => setStatusFilter('DEFICIT')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                statusFilter === 'DEFICIT'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Chưa đạt</span>
            </button>
            <button
              onClick={() => setStatusFilter('EXCUSED')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                statusFilter === 'EXCUSED'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
              }`}
            >
              <span>🌴 Nghỉ phép</span>
            </button>
          </div>

          {/* Lọc Giới Tính */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl ml-auto">
            <button
              onClick={() => setGenderFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition ${
                genderFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setGenderFilter('MALE')}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition ${
                genderFilter === 'MALE'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              Nam
            </button>
            <button
              onClick={() => setGenderFilter('FEMALE')}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition ${
                genderFilter === 'FEMALE'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              Nữ
            </button>
          </div>
        </div>

        {/* Bảng Dữ Liệu Desktop */}
        <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-3 w-12 text-center">STT</th>
                <th className="py-3 px-4">Vận Động Viên</th>
                <th className="py-3 px-3">Đội</th>
                <th className="py-3 px-3 text-center">Buổi Chạy</th>
                <th className="py-3 px-3 text-right">Km Thực Tế</th>
                <th className="py-3 px-3 text-right">Điểm Đội (Cap)</th>
                <th className="py-3 px-3 text-center">Pace TB</th>
                <th className="py-3 px-3 text-right">Chỉ Tiêu</th>
                <th className="py-3 px-3 text-center">Đánh Giá</th>
                <th className="py-3 px-3 text-right">Phạt Km</th>
                <th className="py-3 px-3 text-right">Phạt Buổi</th>
                <th className="py-3 px-3 text-right">Tổng Phạt</th>
                <th className="py-3 px-3 text-right">Nợ Tuần Sau</th>
                <th className="py-3 px-3 text-center">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredMembers.map(({ user, team, stat, isClubOnly }, index) => {
                const isPassed = stat.isCompleted;
                const isExcused = stat.isExcused;
                const penalty = stat.totalPenaltyAmount;

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer ${
                      penalty > 0 ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                    }`}
                    onClick={() => onSelectUser(user)}
                  >
                    <td className="py-3 px-3 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>

                    {/* VĐV */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                            <span>{user.name}</span>
                            {user.isCaptain && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 font-bold">
                                C
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {user.gender === 'MALE' ? 'Nam' : 'Nữ'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Đội */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                        style={{
                          backgroundColor: `${team?.color || '#ff5722'}15`,
                          color: team?.color || '#ff5722',
                        }}
                      >
                        {team?.name.split('-')[0]?.trim() || 'CLB'}
                      </span>
                    </td>

                    {/* Số Buổi Chạy */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-lg text-xs ${
                          stat.totalDaysRun >= 3
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {stat.totalDaysRun} / 3 buổi
                      </span>
                    </td>

                    {/* Km Thực Tế */}
                    <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {formatKm(stat.actualKm)}
                    </td>

                    {/* Điểm Đội (Cap 40km) */}
                    <td className="py-3 px-3 text-right font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatKm(stat.cappedKm)}
                    </td>

                    {/* Pace TB */}
                    <td className="py-3 px-3 text-center font-medium whitespace-nowrap">
                      {formatPace(stat.averagePaceSeconds)}
                    </td>

                    {/* Chỉ Tiêu */}
                    <td className="py-3 px-3 text-right font-bold whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {stat.totalTargetKm.toFixed(1)} km
                      {stat.previousDeficitKm > 0 && (
                        <span className="block text-[10px] text-rose-500">
                          (Nợ {stat.previousDeficitKm.toFixed(1)}k)
                        </span>
                      )}
                    </td>

                    {/* Đánh Giá Kết Quả */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isExcused ? (
                        <span className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[11px]">
                          🌴 Nghỉ phép
                        </span>
                      ) : isPassed ? (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Đạt chuẩn</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Chưa đạt</span>
                        </span>
                      )}
                    </td>

                    {/* Phạt Km */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-medium">
                      {stat.penaltyKmAmount > 0 ? (
                        <span className="text-rose-600 font-bold">
                          -{formatCurrency(stat.penaltyKmAmount)}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Thiếu {stat.roundedDeficitKm}km
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">0đ</span>
                      )}
                    </td>

                    {/* Phạt Buổi */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-medium">
                      {stat.penaltyDaysAmount > 0 ? (
                        <span className="text-rose-600 font-bold">
                          -{formatCurrency(stat.penaltyDaysAmount)}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Thiếu {stat.missingDays} buổi
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">0đ</span>
                      )}
                    </td>

                    {/* Tổng Phạt */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-black">
                      {stat.totalPenaltyAmount > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400">
                          -{formatCurrency(stat.totalPenaltyAmount)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">0đ</span>
                      )}
                    </td>

                    {/* Nợ Chuyển Tuần Sau */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-slate-600 dark:text-slate-400">
                      {stat.rolledOverToNextWeek > 0 ? (
                        <span className="text-rose-500">
                          +{stat.rolledOverToNextWeek.toFixed(2)} km
                        </span>
                      ) : (
                        <span>0 km</span>
                      )}
                    </td>

                    {/* Chi Tiết */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUser(user);
                        }}
                        className="p-1.5 text-slate-400 hover:text-orange-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Xem chi tiết các bài chạy"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Danh Sách Card Mobile */}
        <div className="lg:hidden space-y-3">
          {filteredMembers.map(({ user, team, stat, isClubOnly }, index) => {
            const isPassed = stat.isCompleted;
            const isExcused = stat.isExcused;
            const penalty = stat.totalPenaltyAmount;

            return (
              <div
                key={user.id}
                onClick={() => onSelectUser(user)}
                className={`p-4 rounded-2xl border transition active:scale-[0.99] cursor-pointer ${
                  penalty > 0
                    ? 'bg-rose-50/20 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{user.name}</span>
                        {user.isCaptain && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 font-bold">
                            C
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span
                          className="font-bold"
                          style={{ color: team?.color || '#ff5722' }}
                        >
                          {team?.name.split('-')[0]?.trim()}
                        </span>
                        <span>•</span>
                        <span>{user.gender === 'MALE' ? 'Nam' : 'Nữ'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trạng thái badge */}
                  <div>
                    {isExcused ? (
                      <span className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs">
                        🌴 Nghỉ phép
                      </span>
                    ) : isPassed ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Đạt chuẩn</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Chưa đạt</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Các chỉ số chi tiết */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Km Thực Tế</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {formatKm(stat.actualKm)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Buổi Chạy</span>
                    <span
                      className={`font-black ${
                        stat.totalDaysRun >= 3 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {stat.totalDaysRun}/3 buổi
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Pace TB</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatPace(stat.averagePaceSeconds)}
                    </span>
                  </div>
                </div>

                {/* Tiền phạt & Nợ nếu có */}
                {penalty > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-rose-100 dark:border-rose-900/40 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Phạt tuần này:
                    </span>
                    <span className="font-black text-rose-600 dark:text-rose-400">
                      -{formatCurrency(penalty)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. INFOGRAPHIC SUMMARY CARD (CONTAINER ẨN CHUYÊN DÙNG CHO XUẤT ẢNH PNG) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div
          ref={exportSummaryRef}
          style={{ width: '800px', backgroundColor: '#0f172a' }}
          className="p-8 text-white font-sans space-y-6"
        >
          {/* Header Infographic */}
          <div className="flex items-center justify-between border-b border-slate-700 pb-5">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center font-black text-xl text-white shadow-lg">
                🔥
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                  CNHP RUNNING CLUB • THU ĐÔNG 2026
                </h2>
                <p className="text-xs text-orange-400 font-bold">
                  BẢNG TỔNG HỢP KẾT QUẢ {currentWeek.name.toUpperCase()} ({currentWeek.startDate} - {currentWeek.endDate})
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Thống kê toàn CLB</span>
              <span className="text-sm font-black text-emerald-400">{completedCount}/{users.length} VĐV Đạt Chuẩn</span>
            </div>
          </div>

          {/* KPI 4 ô */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <span className="text-[11px] text-slate-400 block font-medium">Tổng Cự Ly</span>
              <span className="text-base font-black text-orange-400">{formatKm(totalActualKm)}</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <span className="text-[11px] text-slate-400 block font-medium">Tổng Bài Chạy</span>
              <span className="text-base font-black text-white">{totalValidRuns}</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <span className="text-[11px] text-slate-400 block font-medium">Thưởng Tuần</span>
              <span className="text-base font-black text-yellow-400">{formatCurrency(totalRewardAmount)}</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <span className="text-[11px] text-slate-400 block font-medium">Tổng Phạt Tuần</span>
              <span className="text-base font-black text-rose-400">{formatCurrency(totalPenaltyAmount)}</span>
            </div>
          </div>

          {/* Bảng Xếp Hạng Đội */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Xếp Hạng Đội {currentWeek.name}</span>
            </h4>
            <div className="space-y-2">
              {challengeTeams.map((t) => (
                <div
                  key={t.teamId}
                  className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60 text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-black w-6 text-center text-amber-400">
                      {t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : '🥉'} {t.rank}
                    </span>
                    <span className="font-bold text-white">{t.teamName}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-400">Pace: {formatPace(t.averagePaceSeconds)}</span>
                    <span className="font-black text-orange-400">{formatKm(t.averageCappedKmPerMember)}/VĐV</span>
                    {t.rewardAmount > 0 && (
                      <span className="text-amber-400 font-bold">+{formatCurrency(t.rewardAmount)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vinh Danh Top Cá Nhân */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700 text-xs">
              <span className="text-amber-400 font-bold block mb-1">👑 King of Week (Top 1 Nam):</span>
              <div className="font-black text-white">{kingOfWeek?.user.name || '---'}</div>
              <div className="text-slate-400 text-[11px]">
                {kingOfWeek ? `${formatKm(kingOfWeek.stat.actualKm)} • Pace ${formatPace(kingOfWeek.stat.averagePaceSeconds)}` : ''}
              </div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700 text-xs">
              <span className="text-rose-400 font-bold block mb-1">👑 Queen of Week (Top 1 Nữ):</span>
              <div className="font-black text-white">{queenOfWeek?.user.name || '---'}</div>
              <div className="text-slate-400 text-[11px]">
                {queenOfWeek ? `${formatKm(queenOfWeek.stat.actualKm)} • Pace ${formatPace(queenOfWeek.stat.averagePaceSeconds)}` : ''}
              </div>
            </div>
          </div>

          {/* Footer Card */}
          <div className="border-t border-slate-700 pt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>CLB CNHP • Challenge Thu Đông 2026</span>
            <span>Thủ quỹ Long Trịnh: 19030671988989 (Techcombank)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
