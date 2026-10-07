'use client';

import React, { useState } from 'react';
import { TeamWeeklyStat, OverallTeamStat, User, UserWeeklyStat } from '@/types';
import { formatKm, formatPace, formatCurrency } from '@/lib/rules-engine';
import { Trophy, ChevronDown, ChevronUp, Users, Zap, Shield, AlertTriangle } from 'lucide-react';

interface TeamLeaderboardProps {
  isOverall: boolean;
  weeklyRankedTeams: TeamWeeklyStat[];
  overallTeams: OverallTeamStat[];
  users: User[];
  userWeeklyStatsMap?: Record<string, UserWeeklyStat[]>;
  currentWeekNumber?: number;
}

export default function TeamLeaderboard({
  isOverall,
  weeklyRankedTeams,
  overallTeams,
  users,
  userWeeklyStatsMap,
  currentWeekNumber,
}: TeamLeaderboardProps) {
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const toggleExpand = (teamId: string) => {
    setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-900 font-black flex items-center justify-center shadow-md shadow-amber-400/40 text-sm">
          🥇 1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-400 text-slate-900 font-black flex items-center justify-center shadow-md shadow-slate-400/30 text-sm">
          🥈 2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-8 h-8 rounded-full bg-amber-700 text-white font-black flex items-center justify-center shadow-md shadow-amber-700/30 text-sm">
          🥉 3
        </span>
      );
    }
    return (
      <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold flex items-center justify-center text-sm">
        {rank}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(isOverall ? overallTeams : weeklyRankedTeams).slice(0, 3).map((team, idx) => {
          const rank = idx + 1;
          const isFirst = rank === 1;
          const reward = isOverall
            ? (team as OverallTeamStat).finalRewardAmount
            : (team as TeamWeeklyStat).rewardAmount;

          return (
            <div
              key={team.teamId}
              className={`relative rounded-3xl p-5 border transition-all ${
                isFirst
                  ? 'bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-amber-400 dark:border-amber-500/60 shadow-lg shadow-amber-500/10'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getRankBadge(rank)}
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {isFirst ? 'Đang Dẫn Đầu' : `Hạng ${rank}`}
                  </span>
                </div>
                {reward > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    +{formatCurrency(reward)}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.teamColor }} />
                {team.teamName}
              </h3>

              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400">Bình quân km/người:</span>
                  <span className="font-extrabold text-orange-600 dark:text-orange-400 text-base">
                    {team.averageCappedKmPerMember.toFixed(2)} km
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400">Tổng km tính điểm (Max 40):</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatKm(team.totalCappedKm)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400">Tổng km thực tế:</span>
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    {formatKm(team.totalActualKm)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Pace TB (Tie-breaker):
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {formatPace(team.averagePaceSeconds)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Detailed Standings Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-500" />
              Bảng Xếp Hạng Tập Thể Chi Tiết
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Xếp theo Bình quân km/người • Áp trần tối đa 40km/người/tuần • Quãng đường bằng nhau: Pace chậm hơn thắng!
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
            {isOverall ? 'Tính tổng cả giải' : `Tuần ${currentWeekNumber}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center w-16">Thứ Hạng</th>
                <th className="py-3.5 px-4">Tên Đội</th>
                <th className="py-3.5 px-4 text-center">Quân Số</th>
                <th className="py-3.5 px-4 text-right">Tổng Thực Tế</th>
                <th className="py-3.5 px-4 text-right">Tổng Điểm (Cap 40)</th>
                <th className="py-3.5 px-4 text-right text-orange-600 dark:text-orange-400 font-extrabold">
                  Bình Quân / Người
                </th>
                <th className="py-3.5 px-4 text-right">Pace TB</th>
                <th className="py-3.5 px-4 text-right">Tiền Thưởng</th>
                <th className="py-3.5 px-4 text-center">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(isOverall ? overallTeams : weeklyRankedTeams).map((team) => {
                const isExpanded = expandedTeamId === team.teamId;
                const reward = isOverall
                  ? (team as OverallTeamStat).finalRewardAmount
                  : (team as TeamWeeklyStat).rewardAmount;

                // Lấy danh sách thành viên của team
                const teamMembers = users.filter((u) => u.teamId === team.teamId);

                return (
                  <React.Fragment key={team.teamId}>
                    <tr
                      onClick={() => toggleExpand(team.teamId)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''
                      }`}
                    >
                      <td className="py-4 px-4 text-center font-bold">{getRankBadge(team.rank)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: team.teamColor }}
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {team.teamName}
                            </span>
                            <span className="text-xs text-slate-500">
                              Trưởng nhóm: {users.find((u) => u.isCaptain && u.teamId === team.teamId)?.name || 'Chưa chỉ định'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <Users className="w-3 h-3" />
                          {team.memberCount} VĐV
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-slate-600 dark:text-slate-400">
                        {formatKm(team.totalActualKm)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-slate-800 dark:text-slate-200">
                        {formatKm(team.totalCappedKm)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-black text-base text-orange-600 dark:text-orange-400">
                          {team.averageCappedKmPerMember.toFixed(2)} km
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                        {formatPace(team.averagePaceSeconds)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {reward > 0 ? (
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(reward)}
                          </span>
                        ) : (
                          <span className="text-slate-400">0 đ</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-all">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Drill-down: Danh sách thành viên đóng góp km */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="py-4 px-4 sm:px-6 bg-slate-50/80 dark:bg-slate-800/40">
                          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                              <span>Chi Tiết Đóng Góp Thành Viên ({team.teamName})</span>
                              <span className="text-orange-600 font-semibold lowercase">
                                *thành viên chạy &gt; 40km được tính tối đa 40km cho team
                              </span>
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {teamMembers.map((member) => {
                                let memberActualKm = 0;
                                let memberCappedKm = 0;
                                let daysRun = 0;
                                let isMet = false;

                                if (!isOverall && currentWeekNumber && userWeeklyStatsMap) {
                                  const stats = userWeeklyStatsMap[member.id] || [];
                                  const stat = stats.find((s) => s.weekNumber === currentWeekNumber);
                                  if (stat) {
                                    memberActualKm = stat.actualKm;
                                    memberCappedKm = stat.cappedKm;
                                    daysRun = stat.totalDaysRun;
                                    isMet = stat.isCompleted;
                                  }
                                } else if (userWeeklyStatsMap) {
                                  const stats = userWeeklyStatsMap[member.id] || [];
                                  memberActualKm = stats.reduce((sum, s) => sum + s.actualKm, 0);
                                  memberCappedKm = stats.reduce((sum, s) => sum + s.cappedKm, 0);
                                  daysRun = stats.reduce((sum, s) => sum + s.totalDaysRun, 0);
                                }

                                const isOverCapped = memberActualKm > 40;

                                return (
                                  <div
                                    key={member.id}
                                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                                  >
                                    <div className="flex items-center space-x-2.5">
                                      <img
                                        src={member.avatar}
                                        alt={member.name}
                                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                      />
                                      <div>
                                        <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1">
                                          {member.name}
                                          {member.isCaptain && (
                                            <span className="text-[10px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                              Captain
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                          {member.gender === 'MALE' ? 'Nam' : 'Nữ'} • {daysRun} buổi chạy
                                        </div>
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                                        {formatKm(memberActualKm)}
                                      </div>
                                      {isOverCapped ? (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                                          Tính điểm: 40km
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-400">Đóng góp 100%</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
