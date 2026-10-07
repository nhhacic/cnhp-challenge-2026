'use client';

import React, { useState } from 'react';
import { User, UserWeeklyStat, OverallUserStat, Team, Week } from '@/types';
import { formatKm, formatPace, formatCurrency } from '@/lib/rules-engine';
import { Trophy, CheckCircle, AlertCircle, Eye, Zap, Flame, UserCheck } from 'lucide-react';

interface IndividualLeaderboardProps {
  isOverall: boolean;
  currentWeek: Week | null;
  overallMaleRankings: OverallUserStat[];
  overallFemaleRankings: OverallUserStat[];
  users: User[];
  teams: Team[];
  userWeeklyStatsMap: Record<string, UserWeeklyStat[]>;
  onSelectUser: (user: User) => void;
}

export default function IndividualLeaderboard({
  isOverall,
  currentWeek,
  overallMaleRankings,
  overallFemaleRankings,
  users,
  teams,
  userWeeklyStatsMap,
  onSelectUser,
}: IndividualLeaderboardProps) {
  const [filterGender, setFilterGender] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  // Lấy dữ liệu cho từng VĐV theo tuần hiện tại hoặc toàn giải
  const rows = users.map((user) => {
    const weeklyStats = userWeeklyStatsMap[user.id] || [];
    const team = teamMap.get(user.teamId);

    if (isOverall) {
      // Dữ liệu toàn giải
      const maleRank = overallMaleRankings.find((m) => m.userId === user.id)?.maleRank;
      const femaleRank = overallFemaleRankings.find((f) => f.userId === user.id)?.femaleRank;
      const overallStat =
        user.gender === 'MALE'
          ? overallMaleRankings.find((m) => m.userId === user.id)
          : overallFemaleRankings.find((f) => f.userId === user.id);

      return {
        user,
        team,
        totalKm: overallStat?.totalActualKm || 0,
        averagePaceSeconds: overallStat?.averagePaceSeconds || 0,
        daysRun: overallStat?.totalDaysRun || 0,
        totalPenalty: overallStat?.totalPenaltyOwed || 0,
        totalReward: overallStat?.totalRewardEarned || 0,
        rank: user.gender === 'MALE' ? maleRank : femaleRank,
        isCompleted: true,
        weeklyStat: null,
      };
    } else {
      // Dữ liệu tuần cụ thể
      const currentStat = weeklyStats.find((s) => s.weekNumber === currentWeek?.weekNumber);
      return {
        user,
        team,
        totalKm: currentStat?.actualKm || 0,
        averagePaceSeconds: currentStat?.averagePaceSeconds || 0,
        daysRun: currentStat?.totalDaysRun || 0,
        totalPenalty: currentStat?.totalPenaltyAmount || 0,
        totalReward: 0,
        rank: 0,
        isCompleted: currentStat?.isCompleted ?? false,
        weeklyStat: currentStat || null,
      };
    }
  });

  // Lọc theo giới tính
  const filteredRows = rows.filter((r) => {
    if (filterGender === 'MALE') return r.user.gender === 'MALE';
    if (filterGender === 'FEMALE') return r.user.gender === 'FEMALE';
    return true;
  });

  // Sắp xếp: Quãng đường nhiều hơn xếp trước, hòa nhau thì Pace CHẬM HƠN xếp trước
  filteredRows.sort((a, b) => {
    if (b.totalKm !== a.totalKm) {
      return b.totalKm - a.totalKm;
    }
    // Tie-breaker: Pace chậm hơn thắng
    return b.averagePaceSeconds - a.averagePaceSeconds;
  });

  return (
    <div className="space-y-6">
      {/* Gender Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
          <button
            onClick={() => setFilterGender('ALL')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              filterGender === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tất Cả ({users.length})
          </button>
          <button
            onClick={() => setFilterGender('MALE')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              filterGender === 'MALE'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🏃‍♂️ Bảng Nam ({users.filter((u) => u.gender === 'MALE').length})
          </button>
          <button
            onClick={() => setFilterGender('FEMALE')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              filterGender === 'FEMALE'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🏃‍♀️ Bảng Nữ ({users.filter((u) => u.gender === 'FEMALE').length})
          </button>
        </div>

        {isOverall && (
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-3 py-1.5 rounded-xl">
            🏆 Giải thưởng chung cuộc Nam & Nữ: Nhất 200k • Nhì 150k • Ba 100k
          </div>
        )}
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center w-14">Hạng</th>
                <th className="py-3.5 px-4">Vận Động Viên</th>
                <th className="py-3.5 px-4">Đội Thi Đấu</th>
                <th className="py-3.5 px-4 text-right">Tổng Cự Ly</th>
                <th className="py-3.5 px-4 text-right">Pace TB</th>
                {!isOverall && <th className="py-3.5 px-4 text-center">Buổi Chạy (≥3)</th>}
                {!isOverall && <th className="py-3.5 px-4 text-center">Trạng Thái Tuần</th>}
                <th className="py-3.5 px-4 text-right">
                  {isOverall ? 'Thưởng / Phạt' : 'Tiền Phạt Tuần'}
                </th>
                <th className="py-3.5 px-4 text-center">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.map((row, idx) => {
                const rank = idx + 1;
                const { user, team, totalKm, averagePaceSeconds, daysRun, totalPenalty, totalReward, weeklyStat } = row;

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center font-bold">
                      {rank === 1 ? (
                        <span className="inline-flex w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black items-center justify-center text-xs shadow-sm">
                          1
                        </span>
                      ) : rank === 2 ? (
                        <span className="inline-flex w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black items-center justify-center text-xs">
                          2
                        </span>
                      ) : rank === 3 ? (
                        <span className="inline-flex w-7 h-7 rounded-full bg-amber-700 text-white font-black items-center justify-center text-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-500 font-semibold">{rank}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div
                        className="flex items-center space-x-3 cursor-pointer group"
                        onClick={() => onSelectUser(user)}
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 group-hover:border-orange-500 transition-colors"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors flex items-center gap-1.5">
                            {user.name}
                            {user.isCaptain && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 font-bold">
                                Captain
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {user.gender === 'MALE' ? '🏃‍♂️ Nam' : '🏃‍♀️ Nữ'} • Phí:{' '}
                            {user.isPaidFee ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Đã đóng</span>
                            ) : (
                              <span className="text-rose-500 font-semibold">Chưa đóng</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {team ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{
                            backgroundColor: `${team.color}15`,
                            color: team.color,
                          }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }} />
                          {team.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Chưa chia</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black text-slate-900 dark:text-white text-base">
                        {formatKm(totalKm)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-400">
                      {formatPace(averagePaceSeconds)}
                    </td>

                    {/* Tiến độ số buổi (chỉ hiện khi xem tuần) */}
                    {!isOverall && (
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          {[1, 2, 3].map((step) => {
                            const isRun = daysRun >= step;
                            return (
                              <span
                                key={step}
                                className={`w-3 h-3 rounded-full transition-all ${
                                  isRun
                                    ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950'
                                    : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                              />
                            );
                          })}
                          <span className="ml-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                            {daysRun}/3
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Trạng thái tuần */}
                    {!isOverall && (
                      <td className="py-3.5 px-4 text-center">
                        {weeklyStat?.isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Đạt chỉ tiêu
                          </span>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-[11px]">
                            {weeklyStat && weeklyStat.missingDays > 0 && (
                              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                Thiếu {weeklyStat.missingDays} buổi
                              </span>
                            )}
                            {weeklyStat && weeklyStat.deficitKm > 0 && (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                Thiếu {weeklyStat.deficitKm}km (nợ)
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Thưởng / Phạt */}
                    <td className="py-3.5 px-4 text-right">
                      {isOverall ? (
                        totalReward > 0 ? (
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(totalReward)}
                          </span>
                        ) : totalPenalty > 0 ? (
                          <span className="font-semibold text-rose-500">
                            -{formatCurrency(totalPenalty)}
                          </span>
                        ) : (
                          <span className="text-slate-400">0 đ</span>
                        )
                      ) : totalPenalty > 0 ? (
                        <span className="font-bold text-rose-500">
                          -{formatCurrency(totalPenalty)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">0 đ</span>
                      )}
                    </td>

                    {/* Action button */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onSelectUser(user)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-orange-500 transition-colors"
                        title="Xem chi tiết các bài chạy của VĐV"
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
      </div>
    </div>
  );
}
