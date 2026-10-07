'use client';

import React, { useState } from 'react';
import { User, Activity, Team, Week, UserWeeklyStat } from '@/types';
import { formatKm, formatPace, formatCurrency } from '@/lib/rules-engine';
import { X, Calendar, MapPin, Zap, AlertTriangle, CheckCircle, Trash2, Edit3, Mountain, Flag } from 'lucide-react';

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
}: RunnerDetailModalProps) {
  const [editingActId, setEditingActId] = useState<string | null>(null);
  const [lagKmInput, setLagKmInput] = useState<string>('');

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
                <span>
                  Phí giải:{' '}
                  {user.isPaidFee ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Đã nộp 200k</span>
                  ) : (
                    <span className="text-rose-500 font-bold">Chưa nộp</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Tuần hiện tại & Chỉ tiêu */}
          {selectedWeek && currentWeekStats && (
            <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-800 dark:text-orange-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Tiến Độ {selectedWeek.name}
                </span>
                {currentWeekStats.isCompleted ? (
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
    </div>
  );
}
