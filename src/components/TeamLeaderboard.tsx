'use client';

import React, { useState } from 'react';
import { Team, TeamWeeklyStat, OverallTeamStat, User, UserWeeklyStat } from '@/types';
import { formatKm, formatPace, formatCurrency } from '@/lib/rules-engine';
import { Trophy, ChevronDown, ChevronUp, Users, Zap, Edit2, Shield, AlertTriangle, Lock, CheckCircle, Sparkles, Heart } from 'lucide-react';
import EditTeamModal from '@/components/EditTeamModal';

interface TeamLeaderboardProps {
  isOverall: boolean;
  weeklyRankedTeams: TeamWeeklyStat[];
  overallTeams: OverallTeamStat[];
  users: User[];
  teams?: Team[];
  userWeeklyStatsMap?: Record<string, UserWeeklyStat[]>;
  currentWeekNumber?: number;
  onRefreshData?: () => void;
  isAdmin?: boolean;
  onSelectUser?: (user: User) => void;
}

export default function TeamLeaderboard({
  isOverall,
  weeklyRankedTeams,
  overallTeams,
  users,
  teams = [],
  userWeeklyStatsMap,
  currentWeekNumber,
  onRefreshData,
  isAdmin = false,
  onSelectUser,
}: TeamLeaderboardProps) {
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeamIdToEdit, setSelectedTeamIdToEdit] = useState<string | null>(null);

  // Phân tách các đội tham gia Challenge Thu Đông và đội phong trào CLB (Team 4)
  const challengeTeams = (isOverall ? overallTeams : weeklyRankedTeams).filter(
    (t) => !t.isClubOnly && t.teamId !== 'team-4'
  );

  // Danh sách các đội phong trào CLB (ngoài Challenge)
  const clubOnlyTeamsList = teams.filter((t) => Boolean(t.isClubOnly || t.id === 'team-4'));

  const toggleExpand = (teamId: string) => {
    setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
  };

  const handleOpenEdit = (teamId?: string) => {
    if (!isAdmin) {
      alert(
        '🔒 Quyền hạn bị giới hạn:\nChỉ Quản trị viên (Admin) mới có quyền chỉnh sửa tên và màu sắc các đội đua!\n\nNếu bạn thuộc Ban Tổ Chức, vui lòng kích hoạt chế độ "Admin" trên thanh điều hướng góc trên.'
      );
      return;
    }
    setSelectedTeamIdToEdit(teamId || teams[0]?.id || null);
    setIsModalOpen(true);
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
      {/* Banner / Nút truy cập nhanh Đổi tên & Quản lý các Đội */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 rounded-3xl border border-orange-200/70 dark:border-orange-900/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30 flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>Đổi Tên & Quản Lý Các Đội Đua</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-bold">
                {teams.length || (isOverall ? overallTeams.length : weeklyRankedTeams.length)} Đội
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chỉnh sửa tên các đội (Team 1, Team 2, Team 3), mã màu nhận diện hoặc chỉ định Đội trưởng
            </p>
          </div>
        </div>

        {isAdmin ? (
          <button
            onClick={() => handleOpenEdit()}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/25 transition-all whitespace-nowrap"
          >
            <Edit2 className="w-4 h-4" />
            <span>✏️ Sửa Tên Các Đội Đua (Admin)</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-700">
            <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Chỉ Admin mới được sửa tên đội</span>
          </div>
        )}
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {challengeTeams.slice(0, 3).map((team, idx) => {
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

              {/* Tên Đội & Nút Sửa Tên Trực Tiếp */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: team.teamColor }} />
                  <span>{team.teamName}</span>
                </h3>
                {isAdmin && (
                  <button
                    onClick={() => handleOpenEdit(team.teamId)}
                    className="px-2.5 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/80 text-xs font-bold flex items-center gap-1 transition shadow-sm active:scale-95"
                    title="Đổi tên hoặc màu sắc đội này"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Sửa tên</span>
                  </button>
                )}
              </div>

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

        {/* Mobile View: Team Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {challengeTeams.map((team) => {
            const isExpanded = expandedTeamId === team.teamId;
            const reward = isOverall
              ? (team as OverallTeamStat).finalRewardAmount
              : (team as TeamWeeklyStat).rewardAmount;
            const teamMembers = users.filter((u) => u.teamId === team.teamId);

            return (
              <div key={team.teamId} className="p-4 space-y-3">
                {/* Header: Rank + Team Name + Edit button */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {getRankBadge(team.rank)}
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-base">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: team.teamColor }}
                        />
                        <span>{team.teamName}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Trưởng nhóm: {users.find((u) => u.isCaptain && u.teamId === team.teamId)?.name || 'Chưa có'}</span>
                        <span>•</span>
                        <span className="font-semibold">{team.memberCount} VĐV</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {reward > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        +{formatCurrency(reward)}
                      </span>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenEdit(team.teamId)}
                        className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/80 text-xs font-bold transition active:scale-95"
                        title="Sửa tên đội"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Metric: Bình Quân / Người */}
                <div className="bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/50 rounded-2xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold block">
                      Bình quân km / người (Cap 40)
                    </span>
                    <span className="text-xl font-black text-orange-600 dark:text-orange-400">
                      {team.averageCappedKmPerMember.toFixed(2)} km
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">Pace TB (Tie-breaker)</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-end gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      {formatPace(team.averagePaceSeconds)}
                    </span>
                  </div>
                </div>

                {/* Sub-metrics: Tổng thực tế & Tổng tính điểm */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 block text-[11px]">Tổng km thực tế</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {formatKm(team.totalActualKm)}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 block text-[11px]">Tổng điểm (Cap 40)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {formatKm(team.totalCappedKm)}
                    </span>
                  </div>
                </div>

                {/* Member Drill-down button */}
                <button
                  onClick={() => toggleExpand(team.teamId)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <span>{isExpanded ? 'Ẩn bớt thành viên' : `Xem đóng góp ${teamMembers.length} thành viên`}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Expanded Member list on mobile */}
                {isExpanded && (
                  <div className="space-y-2 pt-1">
                    {teamMembers.map((member) => {
                      let memberActualKm = 0;
                      let daysRun = 0;
                      let isExcused = false;

                      if (!isOverall && currentWeekNumber && userWeeklyStatsMap) {
                        const stats = userWeeklyStatsMap[member.id] || [];
                        const stat = stats.find((s) => s.weekNumber === currentWeekNumber);
                        if (stat) {
                          memberActualKm = stat.actualKm;
                          daysRun = stat.totalDaysRun;
                          isExcused = Boolean(stat.isExcused);
                        }
                      } else if (userWeeklyStatsMap) {
                        const stats = userWeeklyStatsMap[member.id] || [];
                        memberActualKm = stats.reduce((sum, s) => sum + s.actualKm, 0);
                        daysRun = stats.reduce((sum, s) => sum + s.totalDaysRun, 0);
                      }

                      const isOverCapped = memberActualKm > 40;

                      return (
                        <div
                          key={member.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                                {member.name}
                                {member.isCaptain && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                    Captain
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <span>{member.gender === 'MALE' ? 'Nam' : 'Nữ'}</span>
                                <span>•</span>
                                {isExcused ? (
                                  <span className="text-amber-600 dark:text-amber-400 font-bold">🌴 Nghỉ bất khả kháng</span>
                                ) : (
                                  <span>{daysRun} buổi</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-black text-xs text-slate-900 dark:text-white">
                              {formatKm(memberActualKm)}
                            </div>
                            {isOverCapped ? (
                              <span className="text-[9px] font-bold px-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                                Cap 40km
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400">100%</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop View: Full Standings Table */}
        <div className="hidden md:block overflow-x-auto">
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
              {challengeTeams.map((team) => {
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
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {team.teamName}
                              </span>
                              {isAdmin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEdit(team.teamId);
                                  }}
                                  className="px-2 py-0.5 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/80 text-[11px] font-bold flex items-center gap-1 transition"
                                  title="Đổi tên đội đua"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Sửa tên</span>
                                </button>
                              )}
                            </div>
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
                                  let isExcused = false;

                                  if (!isOverall && currentWeekNumber && userWeeklyStatsMap) {
                                    const stats = userWeeklyStatsMap[member.id] || [];
                                    const stat = stats.find((s) => s.weekNumber === currentWeekNumber);
                                    if (stat) {
                                      memberActualKm = stat.actualKm;
                                      memberCappedKm = stat.cappedKm;
                                      daysRun = stat.totalDaysRun;
                                      isExcused = Boolean(stat.isExcused);
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
                                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                            <span>{member.gender === 'MALE' ? 'Nam' : 'Nữ'}</span>
                                            <span>•</span>
                                            {isExcused ? (
                                              <span className="text-amber-600 dark:text-amber-400 font-bold">🌴 Nghỉ bất khả kháng</span>
                                            ) : (
                                              <span>{daysRun} buổi chạy</span>
                                            )}
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

      {/* Khối Hiển Thị Dành Riêng Cho Đội Phong Trào CLB (Team 4 - Ngoài Challenge) */}
      {clubOnlyTeamsList.map((clubTeam) => {
        const teamMembers = users.filter((u) => u.teamId === clubTeam.id);

        // Tính toán thống kê thành viên đạt chỉ tiêu 15km và 3 buổi
        const memberStatsList = teamMembers.map((member) => {
          let actualKm = 0;
          let daysRun = 0;
          let paceSec = 0;
          let isExcused = false;
          let isCompleted = false;

          if (!isOverall && currentWeekNumber && userWeeklyStatsMap) {
            const stats = userWeeklyStatsMap[member.id] || [];
            const stat = stats.find((s) => s.weekNumber === currentWeekNumber);
            if (stat) {
              actualKm = stat.actualKm;
              daysRun = stat.totalDaysRun;
              paceSec = stat.averagePaceSeconds;
              isExcused = Boolean(stat.isExcused);
              isCompleted = Boolean(stat.isCompleted);
            }
          } else if (userWeeklyStatsMap) {
            const stats = userWeeklyStatsMap[member.id] || [];
            actualKm = stats.reduce((sum, s) => sum + s.actualKm, 0);
            daysRun = stats.reduce((sum, s) => sum + s.totalDaysRun, 0);
            const totalMovingTime = stats.reduce((sum, s) => sum + s.totalMovingTimeSec, 0);
            paceSec = actualKm > 0 ? totalMovingTime / actualKm : 0;
            isCompleted = actualKm >= 15 * (stats.length || 1);
          }

          const targetKm = 15.0;
          const targetDays = 3;
          const isTargetMet = isCompleted || (actualKm >= targetKm && daysRun >= targetDays);
          const missingKm = Math.max(0, Math.round((targetKm - actualKm) * 100) / 100);
          const missingDays = Math.max(0, targetDays - daysRun);
          const progressKmPercent = Math.min(100, Math.round((actualKm / targetKm) * 100));

          return {
            member,
            actualKm,
            daysRun,
            paceSec,
            isExcused,
            isTargetMet,
            missingKm,
            missingDays,
            progressKmPercent,
          };
        });

        // Sắp xếp thành viên: người chạy nhiều km hơn xếp trước
        memberStatsList.sort((a, b) => b.actualKm - a.actualKm);

        const totalClubActualKm = memberStatsList.reduce((sum, m) => sum + m.actualKm, 0);
        const completedMembersCount = memberStatsList.filter((m) => m.isTargetMet).length;
        const completionRate = teamMembers.length > 0 ? Math.round((completedMembersCount / teamMembers.length) * 100) : 0;

        return (
          <div
            key={clubTeam.id}
            className="rounded-3xl bg-gradient-to-br from-purple-900/10 via-indigo-900/5 to-transparent dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-slate-900 border-2 border-purple-300/80 dark:border-purple-800/80 shadow-md p-5 sm:p-6 space-y-6"
          >
            {/* Header: Team name + badges + Edit button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-200/70 dark:border-purple-800/60">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full shadow-sm flex-shrink-0"
                    style={{ backgroundColor: clubTeam.color || '#8b5cf6' }}
                  />
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    {clubTeam.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    💜 Phong Trào CLB
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Ngoài Challenge
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                  Đội dành riêng cho các thành viên Câu Lạc Bộ chạy bộ duy trì thói quen sức khỏe: <strong className="text-purple-700 dark:text-purple-300">Tối thiểu 15.0 km & 3 buổi / tuần</strong>. Hoàn toàn không áp dụng thể lệ phạt tiền, không quỹ tham gia giải 200.000đ, không nợ gối đầu và không giới hạn trần 40km.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isAdmin ? (
                  <button
                    onClick={() => handleOpenEdit(clubTeam.id)}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Sửa Tên / Màu Đội (Admin)</span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Stats Overview 3 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-purple-200/70 dark:border-purple-900/50 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Quân Số Đội</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {teamMembers.length} <span className="text-sm font-semibold text-slate-500">thành viên</span>
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-purple-200/70 dark:border-purple-900/50 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Đạt Chỉ Tiêu Tuần (≥15km & ≥3b)</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {completedMembersCount} / {teamMembers.length}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      ({completionRate}%)
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-purple-200/70 dark:border-purple-900/50 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Tổng Cự Ly Toàn Đội</span>
                  <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    {formatKm(totalClubActualKm)}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  🏃
                </div>
              </div>
            </div>

            {/* Danh Sách Thành Viên & Tiến Độ Chạy */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Tiến Độ Từng Thành Viên</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                    Mục tiêu: 15km & 3 buổi
                  </span>
                </h4>
              </div>

              {teamMembers.length === 0 ? (
                <div className="text-center py-10 px-4 bg-white/70 dark:bg-slate-900/60 rounded-2xl border border-dashed border-purple-300 dark:border-purple-800 space-y-2">
                  <div className="text-3xl">🏃‍♂️</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    Hiện chưa có thành viên nào trong {clubTeam.name}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Quản trị viên (Admin) có thể chuyển các thành viên CLB không tham gia Challenge Thu Đông vào đội này trong màn hình <strong>Quản Trị / Trọng Tài</strong> → <strong>Phân chia Đội</strong>.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {memberStatsList.map(({ member, actualKm, daysRun, paceSec, isExcused, isTargetMet, missingKm, missingDays, progressKmPercent }) => {
                    return (
                      <div
                        key={member.id}
                        onClick={() => onSelectUser && onSelectUser(member)}
                        className={`p-4 rounded-2xl bg-white dark:bg-slate-900/90 border transition-all ${
                          onSelectUser ? 'cursor-pointer hover:shadow-md hover:border-purple-400 dark:hover:border-purple-600 active:scale-[0.99]' : ''
                        } ${
                          isTargetMet
                            ? 'border-emerald-300 dark:border-emerald-800/80 shadow-sm'
                            : 'border-purple-200/70 dark:border-purple-900/40'
                        }`}
                      >
                        {/* Top: Avatar, Name, Status Badge */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-purple-300 dark:border-purple-700 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-slate-900 dark:text-white truncate flex items-center gap-1">
                                <span>{member.name}</span>
                                {member.isCaptain && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold shrink-0">
                                    C
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {member.gender === 'MALE' ? '🏃‍♂️ Nam' : '🏃‍♀️ Nữ'}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isTargetMet ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                ✓ Đạt chỉ tiêu
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                                🏃 Đang chạy
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle: Progress Bar for 15km */}
                        <div className="space-y-1 mb-2.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">Tiến độ cự ly:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              <strong className={isTargetMet ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'}>
                                {formatKm(actualKm)}
                              </strong>
                              {' '}/ 15.0 km
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isTargetMet
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                  : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                              }`}
                              style={{ width: `${progressKmPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Bottom: Days Run & Pace & Need reminder */}
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 text-[11px]">Buổi chạy:</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3].map((b) => (
                                <span
                                  key={b}
                                  className={`w-2 h-2 rounded-full ${
                                    daysRun >= b ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                                  }`}
                                />
                              ))}
                              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] ml-0.5">
                                {daysRun}/3
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            {isTargetMet ? (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                Xuất sắc 🎉
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                Còn thiếu {missingKm > 0 ? `${missingKm}km` : ''}{missingKm > 0 && missingDays > 0 ? ', ' : ''}{missingDays > 0 ? `${missingDays} buổi` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Modal Chỉnh Sửa Tên Đội Đua */}
      <EditTeamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTeamId={selectedTeamIdToEdit}
        teams={teams}
        users={users}
        onRefreshData={() => {
          if (onRefreshData) onRefreshData();
        }}
        isAdmin={isAdmin}
      />
    </div>
  );
}
