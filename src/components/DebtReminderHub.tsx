'use client';

import React, { useState, useMemo } from 'react';
import { User, Team, Week, UserWeeklyStat } from '@/types';
import { formatCurrency, formatKm } from '@/lib/rules-engine';
import { 
  BellRing, 
  Copy, 
  Check, 
  QrCode, 
  MessageSquare, 
  Share2, 
  AlertTriangle, 
  CreditCard, 
  ShieldAlert, 
  CheckCircle2, 
  Filter, 
  Search, 
  ExternalLink,
  ChevronDown,
  Sparkles,
  Lock,
  RefreshCw,
  X
} from 'lucide-react';

interface DebtReminderHubProps {
  users: User[];
  teams: Team[];
  weeks: Week[];
  selectedWeek: Week | null;
  userWeeklyStatsMap: Record<string, UserWeeklyStat[]>;
  isTreasurer?: boolean;
  onTogglePaidFee?: (user: User, targetPaidStatus: boolean) => Promise<void> | void;
  onOpenPaymentQr?: (user: User, amount: number, type: 'PENALTY' | 'ENTRY_FEE' | 'TOTAL') => void;
  updatingUserId?: string | null;
  onOpenTreasurerAuth?: () => void;
}

export interface UserDebtItem {
  user: User;
  team: Team | undefined;
  isUnpaidFee: boolean;
  feeAmount: number;
  currentWeekPenalty: number;
  missingDays: number;
  penaltyDaysAmount: number;
  deficitKm: number;
  penaltyKmAmount: number;
  cumulativePenalty: number;
  totalDebtThisWeek: number;
  penaltyDetailsText: string;
}

export default function DebtReminderHub({
  users,
  teams,
  weeks,
  selectedWeek,
  userWeeklyStatsMap,
  isTreasurer = false,
  onTogglePaidFee,
  onOpenPaymentQr,
  updatingUserId,
  onOpenTreasurerAuth,
}: DebtReminderHubProps) {
  const currentWeekNumber = selectedWeek?.weekNumber || 1;
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  // Bộ lọc & Tìm kiếm
  const [filterType, setFilterType] = useState<'ALL' | 'FEE_ONLY' | 'PENALTY_ONLY' | 'BOTH'>('ALL');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Tính toán dữ liệu công nợ cho toàn bộ thành viên
  const allDebts: UserDebtItem[] = useMemo(() => {
    return users.map((user) => {
      const team = teamMap.get(user.teamId);
      const isUnpaidFee = !user.isPaidFee;
      const feeAmount = isUnpaidFee ? 200000 : 0;

      const stats = userWeeklyStatsMap[user.id] || [];
      const currentStat = stats.find((s) => s.weekNumber === currentWeekNumber);

      const currentWeekPenalty = currentStat?.totalPenaltyAmount || 0;
      const missingDays = currentStat?.missingDays || 0;
      const penaltyDaysAmount = currentStat?.penaltyDaysAmount || 0;
      const deficitKm = currentStat?.deficitKm || 0;
      const penaltyKmAmount = currentStat?.penaltyKmAmount || 0;
      const cumulativePenalty = stats.reduce((sum, s) => sum + s.totalPenaltyAmount, 0);

      const totalDebtThisWeek = feeAmount + currentWeekPenalty;

      const penaltyDetailsParts: string[] = [];
      if (missingDays > 0) penaltyDetailsParts.push(`Thiếu ${missingDays} buổi (${formatCurrency(penaltyDaysAmount)})`);
      if (deficitKm > 0) penaltyDetailsParts.push(`Thiếu ${deficitKm}km (${formatCurrency(penaltyKmAmount)})`);
      const penaltyDetailsText = penaltyDetailsParts.join(', ');

      return {
        user,
        team,
        isUnpaidFee,
        feeAmount,
        currentWeekPenalty,
        missingDays,
        penaltyDaysAmount,
        deficitKm,
        penaltyKmAmount,
        cumulativePenalty,
        totalDebtThisWeek,
        penaltyDetailsText,
      };
    });
  }, [users, teamMap, userWeeklyStatsMap, currentWeekNumber]);

  // Danh sách những người có nợ
  const debtors = useMemo(() => {
    return allDebts.filter((d) => d.totalDebtThisWeek > 0);
  }, [allDebts]);

  const unpaidFeeDebtors = useMemo(() => {
    return allDebts.filter((d) => d.isUnpaidFee);
  }, [allDebts]);

  const penaltyDebtors = useMemo(() => {
    return allDebts.filter((d) => d.currentWeekPenalty > 0);
  }, [allDebts]);

  const bothDebtors = useMemo(() => {
    return allDebts.filter((d) => d.isUnpaidFee && d.currentWeekPenalty > 0);
  }, [allDebts]);

  // Tổng hợp tiền
  const totalUnpaidFeeAmount = unpaidFeeDebtors.length * 200000;
  const totalCurrentWeekPenaltyAmount = penaltyDebtors.reduce((sum, d) => sum + d.currentWeekPenalty, 0);
  const grandTotalDebtAmount = totalUnpaidFeeAmount + totalCurrentWeekPenaltyAmount;

  // Lọc theo điều kiện người dùng chọn
  const filteredDebtors = useMemo(() => {
    return debtors.filter((item) => {
      // Lọc theo loại nợ
      if (filterType === 'FEE_ONLY' && (!item.isUnpaidFee || item.currentWeekPenalty > 0)) return false;
      if (filterType === 'PENALTY_ONLY' && (item.isUnpaidFee || item.currentWeekPenalty === 0)) return false;
      if (filterType === 'BOTH' && (!item.isUnpaidFee || item.currentWeekPenalty === 0)) return false;

      // Lọc theo đội
      if (selectedTeamId !== 'ALL' && item.user.teamId !== selectedTeamId) return false;

      // Tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return item.user.name.toLowerCase().includes(query) || (item.team?.name.toLowerCase().includes(query) ?? false);
      }

      return true;
    });
  }, [debtors, filterType, selectedTeamId, searchQuery]);

  // 1. Sao chép tin nhắn nhắc nợ cá nhân
  const handleCopyPersonalReminder = (item: UserDebtItem) => {
    const parts: string[] = [];
    if (item.isUnpaidFee) {
      parts.push(`• Phí tham dự giải: 200.000đ`);
    }
    if (item.currentWeekPenalty > 0) {
      parts.push(`• Tiền phạt Tuần ${currentWeekNumber}: ${formatCurrency(item.currentWeekPenalty)} (${item.penaltyDetailsText})`);
    }

    const syntax = item.isUnpaidFee && item.currentWeekPenalty > 0
      ? `CNHP ${item.user.name.replace(/\s+/g, ' ')} PHI VA PHAT T${currentWeekNumber}`
      : item.isUnpaidFee
      ? `CNHP PHI ${item.user.name.replace(/\s+/g, ' ')}`
      : `CNHP ${item.user.name.replace(/\s+/g, ' ')} Tuan ${currentWeekNumber}`;

    const text = `🏃‍♂️ [CNHP THU ĐÔNG 2026] - LỜI NHẮC ĐÓNG QUỸ & PHẠT
Thân gửi bạn ${item.user.name} (${item.team?.name || 'VĐV CNHP'}):

Hệ thống ghi nhận bạn còn khoản đóng góp cần hoàn thành cho giải chạy:
${parts.join('\n')}
👉 TỔNG CỘNG CẦN NỘP: ${formatCurrency(item.totalDebtThisWeek)}
⏰ Hạn nộp: Trước 12h00 Thứ Ba hàng tuần

🏦 THÔNG TIN CHUYỂN KHOẢN THỦ QUỸ:
• Ngân hàng: Techcombank (TCB)
• Số TK: 19030671988989
• Chủ TK: TRINH LONG
• Nội dung CK: ${syntax}

(💡 Bạn có thể vào web quét mã VietQR tự động điền số tiền và cú pháp!)
Cảm ơn bạn đã luôn đồng hành cùng anh em CNHP! Chúc bạn tuần mới nhiều năng lượng! 🔥`;

    navigator.clipboard.writeText(text);
    setCopiedType(`user-${item.user.id}`);
    showToast(`Đã sao chép tin nhắn nhắc nợ cho "${item.user.name}"!`);
    setTimeout(() => setCopiedType(null), 2500);
  };

  // 2. Sao chép bản tin phát thanh tổng hợp gửi Group Zalo
  const handleCopyBroadcastZalo = () => {
    // Danh sách chưa nộp phí
    const unpaidFeeLines = unpaidFeeDebtors.length > 0
      ? unpaidFeeDebtors.map((d, idx) => `  ${idx + 1}. @${d.user.name} (${d.team?.name.split('-')[0].trim() || 'Team'}): 200.000đ`).join('\n')
      : '  ✅ 100% VĐV đã hoàn thành nộp phí tham dự!';

    // Danh sách nộp phạt tuần
    const penaltyLines = penaltyDebtors.length > 0
      ? penaltyDebtors.map((d, idx) => `  ${idx + 1}. @${d.user.name} (${d.team?.name.split('-')[0].trim() || 'Team'}): ${formatCurrency(d.currentWeekPenalty)} (${d.penaltyDetailsText})`).join('\n')
      : '  🎉 Tuần này không có thành viên nào bị phạt!';

    const broadcastText = `📢 [CNHP CHALLENGE THU ĐÔNG 2026] - BẢN TIN NHẮC NỢ QUỸ & NỘP PHẠT TUẦN ${currentWeekNumber}
⏰ Hạn chót hoàn thành: Trước 12h00 Thứ Ba

Thủ quỹ Long Trịnh & Ban Tổ Chức xin gửi danh sách cập nhật công nợ giải chạy:

💳 1. DANH SÁCH CHƯA NỘP PHÍ THAM DỰ (200.000đ/người):
${unpaidFeeLines}
👉 Tổng cộng phí chưa thu: ${unpaidFeeDebtors.length} VĐV = ${formatCurrency(totalUnpaidFeeAmount)}

⚠️ 2. DANH SÁCH NỘP PHẠT TUẦN ${currentWeekNumber}:
${penaltyLines}
👉 Tổng tiền phạt tuần này: ${formatCurrency(totalCurrentWeekPenaltyAmount)}

💰 TỔNG CÔNG NỢ TOÀN GIẢI CẦN THU VỀ QUỸ: ${formatCurrency(grandTotalDebtAmount)}

---------------------------------------------
🏦 THÔNG TIN CHUYỂN KHOẢN THỦ QUỸ:
• Ngân hàng: Techcombank (TCB)
• Số tài khoản: 19030671988989
• Tên chủ tài khoản: TRINH LONG
• Cú pháp: CNHP [TÊN VĐV] [NỘI DUNG]
(Ví dụ: CNHP DANG TUNG PHI 200K hoặc CNHP NAM LE PHAT T${currentWeekNumber})

Anh em vui lòng hoàn thành sớm để Thủ quỹ giải ngân tiền thưởng tuần cho Top 3 Team nhé! Chúc cả nhà chạy vui - khỏe - an toàn! 🏃‍♂️💨`;

    navigator.clipboard.writeText(broadcastText);
    setCopiedType('broadcast');
    showToast('Đã sao chép toàn bộ danh sách nhắc nợ! Bạn có thể dán ngay vào Zalo.');
    setTimeout(() => setCopiedType(null), 3000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-7 space-y-6">
      {/* Toast thông báo sao chép */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 border border-slate-700 dark:border-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Module Nhắc Nợ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-orange-500 to-amber-500 text-white flex items-center justify-center font-black shadow-lg shadow-orange-500/30 flex-shrink-0">
            <BellRing className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Trung Tâm Nhắc Nợ Nộp Quỹ & Nộp Phạt
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                Tuần {currentWeekNumber}
              </span>
              {debtors.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                  {debtors.length} VĐV cần hoàn thành
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Tự động tổng hợp phí tham dự (200k) và tiền phạt tuần theo thể lệ • Xuất tin nhắn mẫu Zalo cá nhân & nhóm 1-chạm
            </p>
          </div>
        </div>

        {/* Nút hành động chính: Sao chép phát thanh Zalo */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyBroadcastZalo}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-rose-500/25 active:scale-95 transition-all"
            title="Sao chép toàn bộ danh sách nợ để gửi vào Group Zalo CNHP"
          >
            {copiedType === 'broadcast' ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Đã Chép Vào Zalo!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Sao Chép Bản Tin Nhắc Nợ Cho Zalo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Thẻ Thống Kê Tổng Quan Công Nợ (Debt Overview Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng số người cần nhắc */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">
            Tổng Thành Viên Cần Nhắc
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {debtors.length}
            </span>
            <span className="text-xs text-slate-400">/ {users.length} VĐV</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            {bothDebtors.length > 0 ? `${bothDebtors.length} người nợ cả hai khoản` : 'Theo dõi thời gian thực'}
          </span>
        </div>

        {/* Card 2: Phí tham dự chưa thu */}
        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
          <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold block mb-1">
            Phí Tham Dự Chưa Thu (200k)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
              {formatCurrency(totalUnpaidFeeAmount)}
            </span>
          </div>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block mt-1">
            {unpaidFeeDebtors.length} VĐV chưa nộp phí
          </span>
        </div>

        {/* Card 3: Tiền phạt tuần chưa thu */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
          <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold block mb-1">
            Tiền Phạt Tuần {currentWeekNumber}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              {formatCurrency(totalCurrentWeekPenaltyAmount)}
            </span>
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block mt-1">
            {penaltyDebtors.length} VĐV vi phạm chỉ tiêu tuần
          </span>
        </div>

        {/* Card 4: Tổng công nợ toàn giải */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-orange-500/10 to-amber-500/10 border-2 border-rose-300 dark:border-rose-800">
          <span className="text-[11px] text-rose-900 dark:text-rose-300 font-black uppercase tracking-wider block mb-1">
            Tổng Công Nợ Cần Thu 💰
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatCurrency(grandTotalDebtAmount)}
            </span>
          </div>
          <span className="text-[10px] text-rose-700/80 dark:text-rose-300/80 font-semibold block mt-1">
            Hạn chót: Trước 12h Thứ 3
          </span>
        </div>
      </div>

      {/* Thanh Bộ Lọc & Tìm Kiếm */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tất cả nợ ({debtors.length})
          </button>
          <button
            onClick={() => setFilterType('FEE_ONLY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === 'FEE_ONLY'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
            }`}
          >
            Chỉ nợ Quỹ ({allDebts.filter((d) => d.isUnpaidFee && d.currentWeekPenalty === 0).length})
          </button>
          <button
            onClick={() => setFilterType('PENALTY_ONLY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === 'PENALTY_ONLY'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-orange-600'
            }`}
          >
            Chỉ nợ Phạt ({allDebts.filter((d) => !d.isUnpaidFee && d.currentWeekPenalty > 0).length})
          </button>
          <button
            onClick={() => setFilterType('BOTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === 'BOTH'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
            }`}
          >
            Nợ cả hai ({bothDebtors.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Lọc theo đội */}
          <div className="relative">
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="py-1.5 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả đội đua</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm VĐV cần nhắc..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>
      </div>

      {/* Danh Sách Thành Viên Cần Nhắc Nợ */}
      {filteredDebtors.length === 0 ? (
        <div className="text-center py-10 px-4 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-3xl border border-emerald-200 dark:border-emerald-900/40 space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
            Tuyệt vời! Không có thành viên nào cần nhắc nợ theo bộ lọc này 🎉
          </h4>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-md mx-auto">
            Tất cả các thành viên đã hoàn thành nghĩa vụ đóng quỹ tham dự 200k và không phát sinh tiền phạt vi phạm thể lệ.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="lg:hidden space-y-3">
            {filteredDebtors.map((item) => {
              const isSelectedCopied = copiedType === `user-${item.user.id}`;
              const isUpdating = updatingUserId === item.user.id;

              return (
                <div
                  key={item.user.id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3 transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.user.avatar}
                        alt={item.user.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                          <span>{item.user.name}</span>
                          {item.user.isCaptain && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                              Captain
                            </span>
                          )}
                        </div>
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: item.team?.color }}
                        >
                          {item.team?.name || 'Chưa chia đội'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Tổng cần nộp</span>
                      <span className="text-base font-black text-rose-600 dark:text-rose-400">
                        {formatCurrency(item.totalDebtThisWeek)}
                      </span>
                    </div>
                  </div>

                  {/* Chi tiết từng khoản nợ */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                    {/* Khoản phí 200k */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                        <span>Phí tham dự:</span>
                      </span>
                      {item.isUnpaidFee ? (
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          Chưa nộp 200.000đ ⏳
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          Đã nộp ✓
                        </span>
                      )}
                    </div>

                    {/* Khoản phạt tuần */}
                    {item.currentWeekPenalty > 0 && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                          <span>Phạt Tuần {currentWeekNumber}:</span>
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-orange-600 dark:text-orange-400">
                            {formatCurrency(item.currentWeekPenalty)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            ({item.penaltyDetailsText})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Các nút hành động 1-chạm */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleCopyPersonalReminder(item)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                        isSelectedCopied
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                      }`}
                      title="Sao chép lời nhắc nợ gửi riêng cho VĐV này qua Zalo"
                    >
                      {isSelectedCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã Chép Lời Nhắc</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                          <span>Nhắc Zalo</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onOpenPaymentQr?.(item.user, item.totalDebtThisWeek, item.isUnpaidFee && item.currentWeekPenalty === 0 ? 'ENTRY_FEE' : 'TOTAL')}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
                      title="Mở mã QR nộp tiền với số tiền và cú pháp chính xác"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Mở QR Nộp</span>
                    </button>

                    {/* Nút xác nhận dành riêng cho Thủ quỹ */}
                    {isTreasurer && item.isUnpaidFee && onTogglePaidFee && (
                      <button
                        onClick={() => onTogglePaidFee(item.user, true)}
                        disabled={isUpdating}
                        className="inline-flex items-center justify-center p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
                        title="Thủ quỹ xác nhận đã thu phí 200k"
                      >
                        {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Vận Động Viên</th>
                  <th className="py-3 px-3">Đội Đua</th>
                  <th className="py-3 px-3 text-center">Phí Tham Dự (200k)</th>
                  <th className="py-3 px-3">Phạt Tuần {currentWeekNumber}</th>
                  <th className="py-3 px-3 text-right">Tổng Cần Nộp</th>
                  <th className="py-3 px-4 text-center">Hành Động Nhắc & Nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDebtors.map((item) => {
                  const isSelectedCopied = copiedType === `user-${item.user.id}`;
                  const isUpdating = updatingUserId === item.user.id;

                  return (
                    <tr
                      key={item.user.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* VĐV */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.user.avatar}
                            alt={item.user.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                              <span>{item.user.name}</span>
                              {item.user.isCaptain && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                  Captain
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {item.user.gender === 'MALE' ? 'Nam' : 'Nữ'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Team */}
                      <td className="py-3.5 px-3">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-xl inline-flex items-center gap-1"
                          style={{
                            backgroundColor: `${item.team?.color || '#94a3b8'}15`,
                            color: item.team?.color || '#94a3b8',
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: item.team?.color || '#94a3b8' }}
                          />
                          <span>{item.team?.name || 'Chưa chia'}</span>
                        </span>
                      </td>

                      {/* Phí 200k */}
                      <td className="py-3.5 px-3 text-center">
                        {item.isUnpaidFee ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            ⏳ Chưa Nộp 200k
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã Nộp
                          </span>
                        )}
                      </td>

                      {/* Phạt tuần */}
                      <td className="py-3.5 px-3">
                        {item.currentWeekPenalty > 0 ? (
                          <div className="space-y-0.5 text-xs">
                            <div className="font-extrabold text-orange-600 dark:text-orange-400">
                              {formatCurrency(item.currentWeekPenalty)}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {item.penaltyDetailsText}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic font-medium">
                            Không vi phạm
                          </span>
                        )}
                      </td>

                      {/* Tổng nợ */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-black text-rose-600 dark:text-rose-400 text-sm sm:text-base">
                          {formatCurrency(item.totalDebtThisWeek)}
                        </span>
                      </td>

                      {/* Hành động */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Nút sao chép lời nhắc */}
                          <button
                            onClick={() => handleCopyPersonalReminder(item)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                              isSelectedCopied
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                            }`}
                            title="Sao chép tin nhắn nhắc nợ cá nhân cho VĐV này để gửi qua Zalo"
                          >
                            {isSelectedCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-white" />
                                <span>Đã chép</span>
                              </>
                            ) : (
                              <>
                                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                                <span>Nhắc Zalo</span>
                              </>
                            )}
                          </button>

                          {/* Nút mở QR */}
                          <button
                            onClick={() => onOpenPaymentQr?.(item.user, item.totalDebtThisWeek, item.isUnpaidFee && item.currentWeekPenalty === 0 ? 'ENTRY_FEE' : 'TOTAL')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
                            title="Tạo mã QR VietQR điền sẵn số tiền nợ và cú pháp"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Mã QR</span>
                          </button>

                          {/* Quyền Thủ quỹ */}
                          {isTreasurer && item.isUnpaidFee && onTogglePaidFee && (
                            <button
                              onClick={() => onTogglePaidFee(item.user, true)}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
                              title="Thủ quỹ xác nhận đã thu phí 200.000đ"
                            >
                              {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              <span>Đã thu 200k</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Footer & Ghi Chú Quy Định Thanh Toán */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>🏦 <strong>Thủ quỹ Long Trịnh</strong> (Techcombank: <code>19030671988989</code>)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-rose-600 dark:text-rose-400 font-bold">
            ⏰ Hạn nộp phạt & phí: Trước 12h Thứ 3 hàng tuần
          </span>
        </div>
      </div>
    </div>
  );
}
