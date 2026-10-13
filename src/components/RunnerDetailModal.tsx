'use client';

import React, { useState } from 'react';
import { User, Activity, Team, Week, UserWeeklyStat } from '@/types';
import { formatKm, formatPace, formatCurrency } from '@/lib/rules-engine';
import { 
  X, 
  Calendar, 
  MapPin, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  Edit3, 
  Mountain, 
  Flag,
  QrCode,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';

interface RunnerDetailModalProps {
  user: User | null;
  onClose: () => void;
  teams: Team[];
  weeks: Week[];
  selectedWeek: Week | null;
  activities: Activity[];
  userWeeklyStats: UserWeeklyStat[];
  isAdmin: boolean;
  onUpdateActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
  onDeleteUser?: (userId: string) => void;
  onRequestLeave?: (user: User, weekNumber?: number) => void;
  currentParticipantUser?: User | null;
}

export default function RunnerDetailModal({
  user,
  onClose,
  teams,
  weeks,
  selectedWeek,
  activities,
  userWeeklyStats,
  isAdmin,
  onUpdateActivity,
  onDeleteActivity,
  onDeleteUser,
  onRequestLeave,
  currentParticipantUser,
}: RunnerDetailModalProps) {
  const [editingActId, setEditingActId] = useState<string | null>(null);
  const [lagKmInput, setLagKmInput] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<'stk' | 'syntax' | null>(null);

  if (!user) return null;

  const team = teams.find((t) => t.id === user.teamId);
  const userActivities = activities.filter((a) => a.userId === user.id);

  // Lọc hoạt động theo tuần đang chọn (nếu có)
  const currentWeekStats = selectedWeek
    ? userWeeklyStats.find((s) => s.weekNumber === selectedWeek.weekNumber)
    : null;

  const filteredActivities = selectedWeek
    ? userActivities.filter((a) => {
        const date = a.startDate.split('T')[0];
        return date >= selectedWeek.startDate && date <= selectedWeek.endDate;
      })
    : userActivities;

  const handleStartEditLag = (act: Activity) => {
    setEditingActId(act.id);
    setLagKmInput(String(act.lagKmDeducted || ''));
  };

  const handleSaveLag = (act: Activity) => {
    const lag = parseFloat(lagKmInput) || 0;
    const updated = {
      ...act,
      lagKmDeducted: lag,
    };
    onUpdateActivity(updated);
    setEditingActId(null);
  };

  const handleToggleTrail = (act: Activity) => {
    const updated = {
      ...act,
      isTrailOrHike: !act.isTrailOrHike,
      type: (!act.isTrailOrHike ? 'TrailRun' : 'Run') as any,
    };
    onUpdateActivity(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center space-x-3.5">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h3>
                {user.isCaptain && (
                  <span className="px-2 py-0.5 text-xs font-black rounded-md bg-amber-400 text-slate-950">
                    Đội Trưởng
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {user.gender === 'MALE' ? '🏃‍♂️ Nam' : '🏃‍♀️ Nữ'}
                </span>
                •
                <span className="font-medium" style={{ color: team?.color }}>
                  {team?.name}
                </span>
                •
                {currentWeekStats?.isExcused ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    🌴 Nghỉ bất khả kháng (Miễn phạt)
                  </span>
                ) : currentWeekStats && currentWeekStats.totalPenaltyAmount > 0 ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    Phạt tuần: {formatCurrency(currentWeekStats.totalPenaltyAmount)}
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Đạt chỉ tiêu
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onRequestLeave && (isAdmin || (currentParticipantUser && currentParticipantUser.id === user.id)) && (
              <button
                onClick={() => onRequestLeave(user, selectedWeek?.weekNumber)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 transition-all active:scale-95"
                title="Gửi đơn xin tạm nghỉ chạy tuần này vì lý do bất khả kháng"
              >
                <span>🌴</span>
                <span>Xin nghỉ tuần</span>
              </button>
            )}

            {isAdmin && onDeleteUser && (
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Bạn có chắc chắn muốn xóa thành viên "${user.name}" khỏi giải đấu?\nTất cả bài chạy liên quan của vận động viên này cũng sẽ bị gỡ bỏ.`
                    )
                  ) {
                    onDeleteUser(user.id);
                  }
                }}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 text-xs font-bold border border-rose-200 dark:border-rose-800 transition-all active:scale-95"
                title="Xóa thành viên khỏi giải đấu"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa VĐV</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Tuần hiện tại & Chỉ tiêu */}
          {selectedWeek && currentWeekStats && (
            <>
              <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-800 dark:text-orange-400 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Tiến Độ {selectedWeek.name}
                  </span>
                  {currentWeekStats.isExcused ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm">
                      🌴 Miễn Chỉ Tiêu (Bất Khả Kháng)
                    </span>
                  ) : currentWeekStats.isCompleted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Đã Hoàn Thành
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Chưa Đạt Chỉ Tiêu
                    </span>
                  )}
                </div>

                {currentWeekStats.isExcused && (
                  <div className="mb-3 p-2.5 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs border border-amber-200 dark:border-amber-800">
                    <span className="font-bold">🌴 Đã được duyệt nghỉ bất khả kháng:</span>{' '}
                    <span>{currentWeekStats.leaveReason || 'Miễn hoàn toàn chỉ tiêu chạy tuần này, không tính tiền phạt và không nợ km gối đầu.'}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-orange-100 dark:border-orange-900/40">
                    <div className="text-[11px] text-slate-500">Đã Chạy</div>
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      {formatKm(currentWeekStats.actualKm)}
                    </div>
                  </div>

                  <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-orange-100 dark:border-orange-900/40">
                    <div className="text-[11px] text-slate-500">Chỉ Tiêu Tuần</div>
                    <div className="text-base font-black text-orange-600 dark:text-orange-400">
                      {formatKm(currentWeekStats.totalTargetKm)}
                      {currentWeekStats.previousDeficitKm > 0 && (
                        <span className="text-[10px] text-amber-600 block">
                          (Gốc 15km + Nợ {currentWeekStats.previousDeficitKm}km)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-orange-100 dark:border-orange-900/40">
                    <div className="text-[11px] text-slate-500">Số Ngày Chạy</div>
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      {currentWeekStats.totalDaysRun}/3 ngày
                    </div>
                  </div>

                  <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-orange-100 dark:border-orange-900/40">
                    <div className="text-[11px] text-slate-500">Tiền Phạt Tuần</div>
                    <div className="text-base font-black text-rose-500">
                      {formatCurrency(currentWeekStats.totalPenaltyAmount)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner Nộp Phạt nếu có phát sinh tiền phạt trong tuần */}
              {currentWeekStats.totalPenaltyAmount > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/40 border-2 border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md shadow-rose-500/20">
                      💳
                    </div>
                    <div>
                      <div className="text-xs font-bold text-rose-950 dark:text-rose-200">
                        Khoản Phạt Cần Nộp {selectedWeek.name}: <span className="text-sm font-black text-rose-600 dark:text-rose-400">{formatCurrency(currentWeekStats.totalPenaltyAmount)}</span>
                      </div>
                      <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80">
                        {currentWeekStats.missingDays > 0 ? `Thiếu ${currentWeekStats.missingDays} buổi (${formatCurrency(currentWeekStats.penaltyDaysAmount)}) ` : ''}
                        {currentWeekStats.deficitKm > 0 ? `• Thiếu ${currentWeekStats.deficitKm}km (${formatCurrency(currentWeekStats.penaltyKmAmount)})` : ''}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Quét QR Nộp Phạt</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Danh sách các bài chạy */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
              <span>Lịch Sử Bài Chạy ({filteredActivities.length} bài)</span>
              <span className="text-xs text-slate-500">
                {selectedWeek ? `Trong ${selectedWeek.name}` : 'Toàn bộ giải'}
              </span>
            </h4>

            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                Chưa có bài chạy nào được ghi nhận trong khoảng thời gian này.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredActivities.map((act) => {
                  const isEditingThis = editingActId === act.id;

                  return (
                    <div
                      key={act.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        act.isValid
                          ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60'
                          : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {act.title}
                            </span>

                            {/* Badge loại bài tập */}
                            {act.isTrailOrHike ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5">
                                <Mountain className="w-3 h-3" />
                                Trail/Hike (Miễn Pace)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                Road Run
                              </span>
                            )}

                            {/* Trạng thái hợp lệ */}
                            {act.isValid ? (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                <CheckCircle className="w-3 h-3" />
                                Hợp lệ
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                {act.invalidReasons.join(', ')}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span>📅 {act.startDate.split('T')[0]} {act.startDate.split('T')[1]?.slice(0, 5)}</span>
                            <span>⏱️ Pace: <strong>{formatPace(act.averagePaceSeconds)}</strong></span>
                            <span>⛰️ Độ cao: {act.elevationGain}m</span>
                            {act.lagKmDeducted > 0 && (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                (Đã trừ {act.lagKmDeducted}km lag)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-base font-black text-slate-900 dark:text-white">
                            {formatKm(act.effectiveKm)}
                          </div>
                          {act.lagKmDeducted > 0 && (
                            <div className="text-[11px] text-slate-400 line-through">
                              Gốc: {formatKm(act.distanceKm)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Công cụ Trọng tài trên bài chạy */}
                      {isAdmin && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                          {isEditingThis ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-500">Số km lag cần trừ:</span>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={lagKmInput}
                                onChange={(e) => setLagKmInput(e.target.value)}
                                className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                placeholder="0.0"
                              />
                              <button
                                onClick={() => handleSaveLag(act)}
                                className="px-2.5 py-1 rounded-lg bg-orange-500 text-white font-bold text-xs"
                              >
                                Lưu
                              </button>
                              <button
                                onClick={() => setEditingActId(null)}
                                className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 text-xs"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleStartEditLag(act)}
                                className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                {act.lagKmDeducted > 0 ? 'Sửa km lag' : 'Trừ km lag'}
                              </button>
                              <button
                                onClick={() => handleToggleTrail(act)}
                                className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                              >
                                <Mountain className="w-3.5 h-3.5" />
                                {act.isTrailOrHike ? 'Đổi sang Road' : 'Gán Trail/Hike'}
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => onDeleteActivity(act.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 transition-colors"
                            title="Xóa bài chạy này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal QR Nộp Phạt Thủ Quỹ */}
      {showPaymentModal && currentWeekStats && (
        <div 
          onClick={() => setShowPaymentModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 relative border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-3.5 right-3.5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pr-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 text-xs font-bold mb-1">
                <QrCode className="w-3.5 h-3.5" />
                NỘP TIỀN PHẠT TUẦN {selectedWeek?.weekNumber}
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase">
                {user.name}
              </h4>
              <p className="text-sm font-black text-rose-600 dark:text-rose-400">
                {formatCurrency(currentWeekStats.totalPenaltyAmount)}
              </p>
            </div>

            {/* Ảnh QR */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-inner flex justify-center">
              <img
                src="/thu_quy_qr.jpg"
                alt="Mã QR nộp phạt Thủ Quỹ Trịnh Long"
                className="w-full max-h-[380px] object-contain rounded-xl"
              />
            </div>

            {/* Chi tiết tài khoản */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-black text-slate-900 dark:text-white uppercase">TRINH LONG</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-orange-600 dark:text-orange-400 text-sm">
                    1903 0671 9889 89
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('19030671988989');
                      setCopiedField('stk');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-500"
                    title="Sao chép STK"
                  >
                    {copiedField === 'stk' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Techcombank</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-500">Cú pháp CK:</span>
                  <button
                    onClick={() => {
                      const syntax = `CNHP ${user.name.replace(/\s+/g, ' ')} Tuan ${selectedWeek?.weekNumber || 1}`;
                      navigator.clipboard.writeText(syntax);
                      setCopiedField('syntax');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {copiedField === 'syntax' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'syntax' ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 select-all">
                  CNHP {user.name} Tuan {selectedWeek?.weekNumber || 1}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-center text-slate-400">
              * Vui lòng nộp phạt trước 12h Thứ 3 hàng tuần về cho Thủ quỹ!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
