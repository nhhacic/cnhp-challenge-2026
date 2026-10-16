'use client';

import React, { useRef, useState } from 'react';
import { FinancialOverview, User, Team, Week, UserWeeklyStat, TeamWeeklyStat } from '@/types';
import { formatCurrency, formatKm } from '@/lib/rules-engine';
import { toPng } from 'html-to-image';
import { 
  DollarSign, 
  Award, 
  AlertTriangle, 
  Download, 
  Share2, 
  Flame, 
  CheckCircle2, 
  ShieldAlert, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  X,
  CreditCard,
  Search,
  Users,
  Sparkles,
  RefreshCw,
  Lock,
} from 'lucide-react';
import DebtReminderHub from '@/components/DebtReminderHub';

interface FinanceAndDeficitProps {
  financialOverview: FinancialOverview;
  users: User[];
  teams: Team[];
  weeks: Week[];
  selectedWeek: Week | null;
  userWeeklyStatsMap: Record<string, UserWeeklyStat[]>;
  rankedTeamsByWeek: Record<number, TeamWeeklyStat[]>;
  isAdmin?: boolean;
  onRefreshData?: () => void;
  connectedUser?: any;
  onConnectStrava?: () => void;
}

export default function FinanceAndDeficit({
  financialOverview,
  users,
  teams,
  weeks,
  selectedWeek,
  userWeeklyStatsMap,
  rankedTeamsByWeek,
  isAdmin = false,
  onRefreshData,
  connectedUser,
  onConnectStrava,
}: FinanceAndDeficitProps) {
  const TREASURER_STRAVA_ID = '138319814';
  const TREASURER_USER_ID = 'user-138319814';

  const [showTreasurerAuthModal, setShowTreasurerAuthModal] = useState(false);
  const [treasurerPinInput, setTreasurerPinInput] = useState('');
  const [treasurerPinError, setTreasurerPinError] = useState('');
  const [isPinAuthenticated, setIsPinAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cnhp_treasurer_pin_auth') === 'true';
    }
    return false;
  });

  // Kiểm tra quyền Thủ quỹ Long Trịnh (Strava ID: 138319814)
  const isConnectedAsTreasurer =
    connectedUser?.stravaId === TREASURER_STRAVA_ID ||
    connectedUser?.id === TREASURER_USER_ID ||
    users.find((u) => u.id === connectedUser?.id)?.stravaId === TREASURER_STRAVA_ID;

  const isTreasurer = isConnectedAsTreasurer || isPinAuthenticated;
  const exportCardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPaymentUser, setSelectedPaymentUser] = useState<User | null>(null);
  const [selectedPaymentAmount, setSelectedPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'PENALTY' | 'ENTRY_FEE'>('PENALTY');
  const [useVietQr, setUseVietQr] = useState<boolean>(true);
  const [feeFilter, setFeeFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');
  const [feeSearchText, setFeeSearchText] = useState<string>('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [feeStatusMsg, setFeeStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isQrZoomOpen, setIsQrZoomOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<'stk' | 'syntax' | null>(null);
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

  // Thống kê Phí Tham Dự 200.000đ (Chỉ áp dụng cho VĐV tham gia Challenge Thu Đông)
  const challengeUsers = users.filter((u) => {
    const t = teamMap.get(u.teamId);
    return !t?.isClubOnly && u.teamId !== 'team-4';
  });
  const paidUsers = challengeUsers.filter((u) => u.isPaidFee);
  const unpaidUsers = challengeUsers.filter((u) => !u.isPaidFee);
  const totalCollectedFee = paidUsers.length * 200000;
  const paymentRatePercent = challengeUsers.length > 0 ? Math.round((paidUsers.length / challengeUsers.length) * 100) : 0;

  const filteredFeeUsers = challengeUsers.filter((u) => {
    if (feeFilter === 'UNPAID' && u.isPaidFee) return false;
    if (feeFilter === 'PAID' && !u.isPaidFee) return false;
    if (feeSearchText.trim()) {
      return u.name.toLowerCase().includes(feeSearchText.toLowerCase().trim());
    }
    return true;
  });

  // Xử lý xác thực mã PIN của Thủ quỹ
  const handleVerifyTreasurerPin = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = treasurerPinInput.trim();
    if (pin === '138319814' || pin === 'cnhp2026' || pin === '190306') {
      setIsPinAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cnhp_treasurer_pin_auth', 'true');
      }
      setShowTreasurerAuthModal(false);
      setTreasurerPinInput('');
      setTreasurerPinError('');
      setFeeStatusMsg({
        type: 'success',
        text: 'Đã xác thực thành công quyền Thủ quỹ Long Trịnh (Strava ID: 138319814)!',
      });
      setTimeout(() => setFeeStatusMsg(null), 3500);
    } else {
      setTreasurerPinError('Mã PIN không đúng. Vui lòng thử lại!');
    }
  };

  const handleLogoutTreasurerPin = () => {
    setIsPinAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cnhp_treasurer_pin_auth');
    }
    setFeeStatusMsg({
      type: 'success',
      text: 'Đã thoát phiên làm việc của Thủ quỹ.',
    });
    setTimeout(() => setFeeStatusMsg(null), 3000);
  };

  // Xử lý bật/tắt trạng thái nộp phí tham dự 200k (Chỉ Thủ quỹ Long Trịnh được phép)
  const handleTogglePaidFee = async (user: User, targetPaidStatus: boolean) => {
    if (!isTreasurer) {
      setShowTreasurerAuthModal(true);
      return;
    }

    setUpdatingUserId(user.id);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_paid_fee',
          userId: user.id,
          isPaidFee: targetPaidStatus,
          callerStravaId: connectedUser?.stravaId,
          callerUserId: connectedUser?.id,
          treasurerPin: isPinAuthenticated ? '138319814' : undefined,
        }),
      });
      const resJson = await res.json();
      if (res.ok) {
        setFeeStatusMsg({
          type: 'success',
          text: `Đã cập nhật: ${user.name} ${targetPaidStatus ? 'đã nộp phí 200.000đ 🎉' : 'đã chuyển về trạng thái chưa nộp phí'}!`,
        });
        onRefreshData?.();
      } else {
        setFeeStatusMsg({
          type: 'error',
          text: resJson.error || 'Không thể cập nhật trạng thái nộp phí',
        });
      }
    } catch (err) {
      console.error(err);
      setFeeStatusMsg({ type: 'error', text: 'Lỗi kết nối khi cập nhật trạng thái phí' });
    } finally {
      setUpdatingUserId(null);
      setTimeout(() => setFeeStatusMsg(null), 4000);
    }
  };

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

  const handleCopyText = (text: string, field: 'stk' | 'syntax') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSelectRunnerForPayment = (user: User, amount: number) => {
    setSelectedPaymentUser(user);
    setSelectedPaymentAmount(amount);
    setPaymentType('PENALTY');
  };

  const handleSelectRunnerForEntryFee = (user: User) => {
    setSelectedPaymentUser(user);
    setSelectedPaymentAmount(200000);
    setPaymentType('ENTRY_FEE');
  };

  const handleOpenPaymentQrFromHub = (user: User, amount: number, type: 'PENALTY' | 'ENTRY_FEE' | 'TOTAL') => {
    setSelectedPaymentUser(user);
    setSelectedPaymentAmount(amount);
    setPaymentType(type === 'ENTRY_FEE' ? 'ENTRY_FEE' : 'PENALTY');
    setIsQrZoomOpen(true);
  };

  const paymentSyntax = selectedPaymentUser
    ? paymentType === 'ENTRY_FEE'
      ? `CNHP PHI ${selectedPaymentUser.name.replace(/\s+/g, ' ')}`
      : selectedPaymentAmount > 200000 && !selectedPaymentUser.isPaidFee
      ? `CNHP ${selectedPaymentUser.name.replace(/\s+/g, ' ')} PHI VA PHAT T${currentWeekNumber}`
      : `CNHP ${selectedPaymentUser.name.replace(/\s+/g, ' ')} Tuan ${currentWeekNumber}`
    : paymentType === 'ENTRY_FEE'
    ? `CNHP PHI [Ten VDV]`
    : `CNHP [Ten VDV] Tuan ${currentWeekNumber}`;

  const vietQrUrl = `https://img.vietqr.io/image/970407-19030671988989-compact2.png?amount=${selectedPaymentAmount > 0 ? selectedPaymentAmount : 200000}&addInfo=${encodeURIComponent(paymentSyntax)}&accountName=TRINH%20LONG`;

  return (
    <div className="space-y-8">
      {/* 1. Tổng Quan Quỹ Giải (Financial Summary Cards) */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Báo Cáo Tài Chính & Quỹ Giải Thưởng CNHP
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Minh bạch thu phí tham dự (200k/người), tiền phạt thể lệ (20.000đ/km & 50.000đ/buổi), tiền thưởng tuần và quỹ giải
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Phí tham dự */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Phí Tham Dự (200k/người)
            </span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              +{formatCurrency(financialOverview.totalFeeCollected)}
            </span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold block mt-1">
              {paidUsers.length}/{users.length} VĐV đã nộp ({paymentRatePercent}%)
            </span>
          </div>

          {/* Card 2: Quỹ phạt đã thu */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Quỹ Phạt Đã Thu
            </span>
            <span className="text-2xl font-black text-rose-500">
              +{formatCurrency(financialOverview.totalPenalties)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Thiếu km: 20k/km (tuần cuối 40k) • Buổi: 50k</span>
          </div>

          {/* Card 3: Thưởng tuần */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Đã Chi Thưởng Tuần
            </span>
            <span className="text-2xl font-black text-amber-500">
              -{formatCurrency(financialOverview.totalWeeklyRewards)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Nhất 150k • Nhì 100k • Ba 50k</span>
          </div>

          {/* Card 4: Số dư quỹ giải */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-300 dark:border-emerald-800">
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold block mb-1">
              Số Dư Quỹ Giải Hiện Có 🎉
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(financialOverview.remainingFund)}
            </span>
            <span className="text-[11px] text-emerald-700/80 block mt-1">Dành cho thưởng chung cuộc & gala</span>
          </div>
        </div>
      </div>

      {/* 2. TRUNG TÂM NHẮC NỢ NỘP QUỸ & NỘP PHẠT */}
      <DebtReminderHub
        users={users}
        teams={teams}
        weeks={weeks}
        selectedWeek={selectedWeek}
        userWeeklyStatsMap={userWeeklyStatsMap}
        isTreasurer={isTreasurer}
        onTogglePaidFee={handleTogglePaidFee}
        onOpenPaymentQr={handleOpenPaymentQrFromHub}
        updatingUserId={updatingUserId}
        onOpenTreasurerAuth={() => setShowTreasurerAuthModal(true)}
      />

      {/* 3. THEO DÕI & NỘP PHÍ THAM DỰ 200.000Đ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Theo Dõi & Thu Phí Tham Dự Challenge</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    {paidUsers.length}/{users.length} Đã Nộp ({paymentRatePercent}%)
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Mức phí: <strong>200.000đ/người</strong> • Hoàn trả 100% làm quỹ thưởng chung cuộc & liên hoan Gala CNHP
                </p>
                {isTreasurer ? (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Thủ quỹ Long Trịnh (Strava ID: 138319814) • Đang có quyền xác nhận thu phí</span>
                    </span>
                    {isPinAuthenticated && !isConnectedAsTreasurer && (
                      <button
                        onClick={handleLogoutTreasurerPin}
                        className="text-[11px] text-slate-400 hover:text-rose-500 underline ml-1 cursor-pointer"
                        title="Thoát phiên làm việc Thủ quỹ"
                      >
                        Thoát quyền
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                      <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span>Quyền xác nhận: Chỉ dành riêng cho <strong>Thủ quỹ Long Trịnh (Strava ID: 138319814)</strong></span>
                    </span>
                    <button
                      onClick={() => setShowTreasurerAuthModal(true)}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                    >
                      Xác thực
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (users.length > 0) {
                const target = unpaidUsers[0] || users[0];
                handleSelectRunnerForEntryFee(target);
              }
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Mở Mã QR Nộp Phí 200k</span>
          </button>
        </div>

        {/* Thanh Tiến Độ Thu Phí Toàn Giải */}
        <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Đã thu được:</span>
              <strong className="text-blue-600 dark:text-blue-400 text-sm">
                {formatCurrency(totalCollectedFee)}
              </strong>
              <span className="text-slate-400">/ {formatCurrency(users.length * 200000)}</span>
            </span>
            <span className="font-bold text-slate-600 dark:text-slate-400">
              Chưa nộp: <span className="text-rose-500 font-extrabold">{unpaidUsers.length} VĐV</span> ({formatCurrency(unpaidUsers.length * 200000)})
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${paymentRatePercent}%` }}
            />
          </div>
        </div>

        {/* Thông báo cập nhật realtime */}
        {feeStatusMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all animate-fadeIn ${
              feeStatusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{feeStatusMsg.text}</span>
            </span>
            <button onClick={() => setFeeStatusMsg(null)} className="p-1 hover:opacity-70">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Thanh Bộ Lọc & Tìm Kiếm */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              onClick={() => setFeeFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                feeFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tất cả ({users.length})
            </button>
            <button
              onClick={() => setFeeFilter('UNPAID')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                feeFilter === 'UNPAID'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Chưa nộp ({unpaidUsers.length})</span>
            </button>
            <button
              onClick={() => setFeeFilter('PAID')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                feeFilter === 'PAID'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Đã nộp ({paidUsers.length})</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={feeSearchText}
              onChange={(e) => setFeeSearchText(e.target.value)}
              placeholder="Tìm tên vận động viên..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-56"
            />
          </div>
        </div>

        {/* Danh Sách VĐV (Mobile Card View) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredFeeUsers.map((u) => {
            const team = teamMap.get(u.teamId);
            const isSelected = selectedPaymentUser?.id === u.id && paymentType === 'ENTRY_FEE';
            const isUpdating = updatingUserId === u.id;

            return (
              <div
                key={u.id}
                className={`p-3.5 space-y-2.5 rounded-2xl transition-all ${
                  isSelected ? 'bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1">
                        <span>{u.name}</span>
                        {u.isCaptain && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                            Captain
                          </span>
                        )}
                      </div>
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: team?.color }}
                      >
                        {team?.name || 'Chưa chia đội'}
                      </span>
                    </div>
                  </div>

                  <div>
                    {u.isPaidFee ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã nộp 200k
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                        ⏳ Chưa nộp
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {!u.isPaidFee && (
                    <button
                      onClick={() => handleSelectRunnerForEntryFee(u)}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800 active:scale-95 transition-all"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Quét QR 200k</span>
                    </button>
                  )}

                  {isTreasurer ? (
                    <button
                      onClick={() => handleTogglePaidFee(u, !u.isPaidFee)}
                      disabled={isUpdating}
                      className={`flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all ${
                        u.isPaidFee
                          ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                      }`}
                    >
                      {isUpdating ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : u.isPaidFee ? (
                        <span>Hủy xác nhận</span>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Xác nhận đã thu 200k</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowTreasurerAuthModal(true)}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-200/70 transition-all cursor-pointer"
                      title="Chỉ Thủ quỹ Long Trịnh (Strava ID: 138319814) có quyền bấm xác nhận"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span>{u.isPaidFee ? 'Đã thu 200k' : 'Chỉ Thủ quỹ xác nhận'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Danh Sách VĐV (Desktop Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Vận Động Viên</th>
                <th className="py-3 px-4">Đội Đua</th>
                <th className="py-3 px-4 text-center">Mức Phí</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-center">Mã QR Nộp Phí</th>
                <th className="py-3 px-4 text-center">Hành Động Cập Nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredFeeUsers.map((u) => {
                const team = teamMap.get(u.teamId);
                const isSelected = selectedPaymentUser?.id === u.id && paymentType === 'ENTRY_FEE';
                const isUpdating = updatingUserId === u.id;

                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-blue-50/60 dark:bg-blue-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.isCaptain && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                Captain
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {u.gender === 'MALE' ? 'Nam' : 'Nữ'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-lg inline-flex items-center gap-1"
                        style={{
                          backgroundColor: `${team?.color || '#94a3b8'}15`,
                          color: team?.color || '#94a3b8',
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: team?.color || '#94a3b8' }} />
                        <span>{team?.name || 'Chưa chia'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200 text-xs">
                      200.000 đ
                    </td>

                    <td className="py-3 px-4 text-center">
                      {u.isPaidFee ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã Nộp Phí
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          ⏳ Chưa Nộp
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleSelectRunnerForEntryFee(u)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold active:scale-95 transition-all"
                        title="Điền cú pháp và tạo mã QR 200k cho thành viên này"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Mã QR 200k</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {isTreasurer ? (
                        <button
                          onClick={() => handleTogglePaidFee(u, !u.isPaidFee)}
                          disabled={isUpdating}
                          className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all ${
                            u.isPaidFee
                              ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                          }`}
                          title={u.isPaidFee ? 'Đánh dấu lại thành viên này chưa nộp phí' : 'Xác nhận thành viên này đã nộp phí 200.000đ'}
                        >
                          {isUpdating ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : u.isPaidFee ? (
                            <span>Hủy xác nhận</span>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Xác nhận đã thu</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowTreasurerAuthModal(true)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/70 hover:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                          title="Chỉ Thủ quỹ Long Trịnh (Strava ID: 138319814) có quyền bấm xác nhận"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>{u.isPaidFee ? 'Đã xác nhận' : 'Chỉ Thủ quỹ xác nhận'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Danh Sách Nộp Phạt Tuần & Kênh Chuyển Khoản Thủ Quỹ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái (7 cols): Danh sách thành viên nộp phạt trong tuần */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  Danh Sách Nộp Phạt Tuần {currentWeekNumber}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedWeek ? `${selectedWeek.startDate} đến ${selectedWeek.endDate}` : ''} • Thiếu 1km: 20.000đ (tuần cuối 40.000đ) • Thiếu 1 buổi: 50.000đ
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                {currentWeekPenalties.length} thành viên
              </span>
            </div>

            {currentWeekPenalties.length === 0 ? (
              <div className="text-center py-10 px-4 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/40">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <div className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                  Tuyệt vời! 100% thành viên hoàn thành chỉ tiêu Tuần {currentWeekNumber}
                </div>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                  Không có thành viên nào bị nợ km hoặc thiếu buổi chạy trong tuần này.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile View: Penalty Cards */}
                <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {currentWeekPenalties.map(({ user, team, stat }) => {
                    const isSelected = selectedPaymentUser?.id === user.id;
                    return (
                      <div
                        key={user.id}
                        className={`p-3.5 space-y-2.5 rounded-2xl transition-colors ${
                          isSelected
                            ? 'bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                {user.name}
                              </div>
                              <span
                                className="text-[10px] font-semibold"
                                style={{ color: team?.color }}
                              >
                                {team?.name}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Tiền phạt</span>
                            <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                              {formatCurrency(stat?.totalPenaltyAmount || 0)}
                            </span>
                          </div>
                        </div>

                        {/* Chi tiết lỗi */}
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-xs space-y-1">
                          {stat && stat.missingDays > 0 && (
                            <div className="text-amber-700 dark:text-amber-400 font-medium flex items-center justify-between">
                              <span>• Thiếu {stat.missingDays} buổi:</span>
                              <span className="font-bold">{formatCurrency(stat.penaltyDaysAmount)}</span>
                            </div>
                          )}
                          {stat && stat.deficitKm > 0 && (
                            <div className="text-rose-700 dark:text-rose-400 font-medium flex items-center justify-between">
                              <span>• Thiếu {stat.deficitKm}km:</span>
                              <span className="font-bold">{formatCurrency(stat.penaltyKmAmount)}</span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleSelectRunnerForPayment(user, stat?.totalPenaltyAmount || 0)}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Chọn Nộp Phạt (Điền cú pháp & QR)</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Vận Động Viên</th>
                      <th className="py-2.5 px-3">Lỗi Vi Phạm</th>
                      <th className="py-2.5 px-3 text-right">Tiền Phạt</th>
                      <th className="py-2.5 px-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentWeekPenalties.map(({ user, team, stat }) => {
                      const isSelected = selectedPaymentUser?.id === user.id;
                      return (
                        <tr
                          key={user.id}
                          className={`transition-colors ${
                            isSelected
                              ? 'bg-orange-50 dark:bg-orange-950/40 font-medium'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                              />
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                  {user.name}
                                </div>
                                <span
                                  className="text-[10px] font-semibold"
                                  style={{ color: team?.color }}
                                >
                                  {team?.name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="space-y-0.5 text-xs">
                              {stat && stat.missingDays > 0 && (
                                <div className="text-amber-700 dark:text-amber-400 font-medium">
                                  • Thiếu {stat.missingDays} buổi ({formatCurrency(stat.penaltyDaysAmount)})
                                </div>
                              )}
                              {stat && stat.deficitKm > 0 && (
                                <div className="text-rose-700 dark:text-rose-400 font-medium">
                                  • Thiếu {stat.deficitKm}km ({formatCurrency(stat.penaltyKmAmount)})
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                              {formatCurrency(stat?.totalPenaltyAmount || 0)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleSelectRunnerForPayment(user, stat?.totalPenaltyAmount || 0)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Nộp Phạt</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>* Bấm &quot;Nộp Phạt&quot; để tự động điền cú pháp cho thành viên</span>
            <span className="font-semibold text-rose-500">Hạn nộp: Trước 12h Thứ 3</span>
          </div>
        </div>

        {/* Cột Phải (5 cols): Tài khoản ngân hàng thủ quỹ & Mã QR */}
        <div className="lg:col-span-5 bg-gradient-to-b from-white to-amber-50/30 dark:from-slate-900 dark:to-amber-950/20 rounded-3xl shadow-sm border-2 border-amber-300/80 dark:border-amber-700/60 p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/30">
                  🏦
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Tài Khoản Thủ Quỹ
                  </h3>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                    {paymentType === 'ENTRY_FEE' ? 'Quét mã nộp phí tham dự 200.000đ' : 'Quét mã nộp tiền phạt CNHP'}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase">
                Techcombank
              </span>
            </div>

            {/* Chọn loại khoản nộp: Phí 200k vs Tiền Phạt */}
            <div className="flex items-center gap-1.5 p-1 bg-amber-100/70 dark:bg-amber-950/60 rounded-xl mb-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  setPaymentType('ENTRY_FEE');
                  setSelectedPaymentAmount(200000);
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-center transition-all ${
                  paymentType === 'ENTRY_FEE'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                💳 Phí Tham Dự 200k
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentType('PENALTY');
                  if (selectedPaymentAmount === 200000) {
                    setSelectedPaymentAmount(0);
                  }
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-center transition-all ${
                  paymentType === 'PENALTY'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                ⚠️ Tiền Phạt Tuần
              </button>
            </div>

            {/* Chuyển đổi mã VietQR tự động điền tiền vs QR gốc */}
            <div className="flex items-center justify-center gap-1.5 mb-1.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setUseVietQr(true)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  useVietQr
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                ⚡ VietQR (Điền sẵn tiền)
              </button>
              <button
                type="button"
                onClick={() => setUseVietQr(false)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  !useVietQr
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                🏦 Ảnh QR Gốc
              </button>
            </div>

            {/* Ảnh Mã QR Thủ Quỹ */}
            <div className="flex flex-col items-center justify-center my-2">
              <div 
                onClick={() => setIsQrZoomOpen(true)}
                className="relative group cursor-pointer p-2 bg-white rounded-2xl shadow-md border border-amber-200/80 hover:shadow-xl transition-all"
                title="Bấm để xem ảnh phóng to"
              >
                <img
                  src={useVietQr ? vietQrUrl : "/thu_quy_qr.jpg"}
                  alt="Mã QR Chuyển Tiền Thủ Quỹ Trịnh Long"
                  className="w-44 sm:w-48 h-auto object-contain rounded-xl transition-transform group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white text-xs font-bold gap-1">
                  <ExternalLink className="w-4 h-4" />
                  <span>Bấm để phóng to</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 font-medium">
                💡 {useVietQr ? 'Quét mã VietQR trên app ngân hàng sẽ tự điền STK, số tiền & cú pháp' : 'Chạm vào ảnh QR để xem kích thước lớn'}
              </span>
            </div>

            {/* Thông tin tài khoản chi tiết */}
            <div className="space-y-2 mt-3 bg-white/90 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Chủ tài khoản:</span>
                <span className="font-black text-slate-900 dark:text-white uppercase tracking-wide">
                  TRINH LONG
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-orange-600 dark:text-orange-400 text-sm tracking-wide">
                    1903 0671 9889 89
                  </span>
                  <button
                    onClick={() => handleCopyText('19030671988989', 'stk')}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-500"
                    title="Sao chép số tài khoản"
                  >
                    {copiedField === 'stk' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ngân hàng:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Techcombank (TCB)
                </span>
              </div>

              {selectedPaymentAmount > 0 && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Số tiền cần nộp:</span>
                  <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                    {formatCurrency(selectedPaymentAmount)}
                  </span>
                </div>
              )}

              {/* Cú pháp chuyển khoản gợi ý */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Nội dung CK gợi ý:</span>
                  <button
                    onClick={() => handleCopyText(paymentSyntax, 'syntax')}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {copiedField === 'syntax' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 break-all select-all">
                  {paymentSyntax}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sổ Nợ Chạy Bù (Deficit Ledger) */}
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
          <>
            {/* Mobile View: Deficit Cards */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {deficitLedger.map((row) => (
                <div key={row.user.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={row.user.avatar}
                        alt={row.user.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {row.user.name}
                        </div>
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: row.team?.color }}
                        >
                          {row.team?.name}
                        </span>
                      </div>
                    </div>

                    <div>
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
                    </div>
                  </div>

                  {/* 3-grid stats */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-500 block">Nợ trước</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {row.prevOwedKm > 0 ? formatKm(row.prevOwedKm) : '0 km'}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-500 block">Chỉ tiêu T{currentWeekNumber}</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {formatKm(row.currentTargetKm)}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-500 block">Đã chạy T{currentWeekNumber}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatKm(row.currentActualKm)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 text-[11px]">Tổng tiền phạt lũy kế:</span>
                    <span className="font-black text-rose-500 text-sm">
                      {formatCurrency(row.totalPenalties)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Deficit Table */}
            <div className="hidden sm:block overflow-x-auto">
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
          </>
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
            <div className="mt-4 pt-3 border-t border-white/10 text-center text-[10px] text-slate-300 space-y-0.5">
              <div className="font-bold text-amber-300">
                💳 STK Thủ Quỹ (Techcombank): 1903 0671 9889 89 - TRINH LONG
              </div>
              <div className="text-slate-400">
                *Nộp phạt trước 12h Thứ 3 hàng tuần • Chạy vui - Khỏe - Gắn kết!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. MODAL PHÓNG TO MÃ QR THỦ QUỸ */}
      {isQrZoomOpen && (
        <div 
          onClick={() => setIsQrZoomOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 relative border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <button
              onClick={() => setIsQrZoomOpen(false)}
              className="absolute top-3.5 right-3.5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pr-6">
              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Mã QR Thủ Quỹ TRINH LONG
              </h4>
              <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mt-0.5">
                Techcombank: 1903 0671 9889 89
              </p>
            </div>

            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-inner flex justify-center">
              <img
                src={useVietQr ? vietQrUrl : "/thu_quy_qr.jpg"}
                alt="QR Code Thủ Quỹ TRINH LONG"
                className="w-full max-h-[460px] object-contain rounded-xl"
              />
            </div>

            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handleCopyText('19030671988989', 'stk')}
                  className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  {copiedField === 'stk' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'stk' ? 'Đã chép STK' : 'Sao chép STK'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {paymentType === 'ENTRY_FEE'
                  ? 'Mở app ngân hàng quét mã để thanh toán phí tham dự 200.000đ'
                  : 'Mở app ngân hàng quét mã để thanh toán tiền nộp phạt'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Thực Quyền Thủ Quỹ Long Trịnh */}
      {showTreasurerAuthModal && (
        <div
          onClick={() => setShowTreasurerAuthModal(false)}
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                    Quyền Hạn Thủ Quỹ
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Xác nhận thu phí tham dự 200.000đ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTreasurerAuthModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              Theo quy định giải đấu, nút <strong>“Xác nhận đã thu”</strong> chỉ dành riêng cho <strong>Thủ quỹ Long Trịnh</strong> (Strava ID: <code className="font-mono font-bold bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">138319814</code>) để đảm bảo tính chuẩn xác và minh bạch tài chính.
            </div>

            <div className="space-y-3 pt-1">
              {onConnectStrava && (
                <button
                  onClick={() => {
                    setShowTreasurerAuthModal(false);
                    onConnectStrava();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#fc5200] hover:bg-[#e04900] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.01 13.828h4.172" />
                  </svg>
                  <span>Đăng Nhập Strava Thủ Quỹ</span>
                </button>
              )}

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-semibold uppercase">Hoặc nhập mã xác thực</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <form onSubmit={handleVerifyTreasurerPin} className="space-y-2">
                <input
                  type="password"
                  value={treasurerPinInput}
                  onChange={(e) => {
                    setTreasurerPinInput(e.target.value);
                    setTreasurerPinError('');
                  }}
                  placeholder="Nhập mã PIN xác thực Thủ quỹ..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono tracking-widest text-center"
                />
                {treasurerPinError && (
                  <p className="text-[11px] text-rose-500 font-semibold text-center">{treasurerPinError}</p>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                >
                  Mở Khóa Quyền Xác Nhận Thu Phí
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
