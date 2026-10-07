'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import CountdownBanner from '@/components/CountdownBanner';
import TeamLeaderboard from '@/components/TeamLeaderboard';
import IndividualLeaderboard from '@/components/IndividualLeaderboard';
import FinanceAndDeficit from '@/components/FinanceAndDeficit';
import AdminPanel from '@/components/AdminPanel';
import RunnerDetailModal from '@/components/RunnerDetailModal';
import {
  Activity,
  Team,
  User,
  Week,
  TeamWeeklyStat,
  UserWeeklyStat,
  OverallUserStat,
  OverallTeamStat,
  FinancialOverview,
} from '@/types';
import { Trophy, Users, DollarSign, Shield, Flame, Activity as ActivityIcon } from 'lucide-react';

export default function HomePage() {
  const [data, setData] = useState<{
    weeks: Week[];
    teams: Team[];
    users: User[];
    activities: Activity[];
    userWeeklyStats: Record<string, UserWeeklyStat[]>;
    rankedTeamsByWeek: Record<number, TeamWeeklyStat[]>;
    overallUsers: { maleRankings: OverallUserStat[]; femaleRankings: OverallUserStat[] };
    overallTeams: OverallTeamStat[];
    financialOverview: FinancialOverview;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number | null>(1); // Mặc định Tuần 1
  const [activeTab, setActiveTab] = useState<'TEAM' | 'INDIVIDUAL' | 'FINANCE' | 'ADMIN'>('TEAM');
  const [selectedUserForModal, setSelectedUserForModal] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectedUser, setConnectedUser] = useState<any>(null);

  // Khởi tạo chế độ tối từ hệ thống hoặc lưu trữ
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark =
        localStorage.getItem('theme') === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
      if (isDark) document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Tải dữ liệu từ API
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý đồng bộ Strava
  const handleSyncStrava = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/strava/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const resJson = await res.json();
      if (res.ok) {
        alert(resJson.message || 'Đã đồng bộ thành công!');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối đến máy chủ Strava');
    } finally {
      setIsSyncing(false);
    }
  };

  // Cập nhật bài chạy từ modal
  const handleUpdateActivity = async (activity: Activity) => {
    try {
      const res = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Xóa bài chạy từ modal
  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài chạy này?')) return;
    try {
      const res = await fetch(`/api/activity?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 mx-auto flex items-center justify-center animate-bounce shadow-lg shadow-orange-500/30 text-white">
            <Flame className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Đang tải dữ liệu Challenge CNHP Thu Đông 2026...
          </p>
        </div>
      </div>
    );
  }

  const { weeks, teams, users, activities, userWeeklyStats, rankedTeamsByWeek, overallUsers, overallTeams, financialOverview } = data;

  const isOverall = selectedWeekNumber === null;
  const currentWeek = !isOverall ? weeks.find((w) => w.weekNumber === selectedWeekNumber) || null : null;
  const weeklyRankedTeams = !isOverall && selectedWeekNumber ? rankedTeamsByWeek[selectedWeekNumber] || [] : [];
  const totalKmAll = activities.filter((a) => a.isValid).reduce((sum, a) => sum + a.effectiveKm, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Header Điều Hướng */}
      <Header
        weeks={weeks}
        selectedWeekNumber={selectedWeekNumber}
        onSelectWeek={(num) => setSelectedWeekNumber(num)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
        onSyncStrava={handleSyncStrava}
        isSyncing={isSyncing}
        connectedUser={connectedUser}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Banner đếm ngược & Chỉ tiêu */}
        <CountdownBanner
          currentWeek={currentWeek}
          totalKmAll={totalKmAll}
          totalUsersCount={users.length}
          financialOverview={financialOverview}
        />

        {/* Thanh chuyển đổi phân hệ (Main Navigation Tabs) */}
        <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('TEAM')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'TEAM'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Xếp Hạng Tập Thể (Team)</span>
          </button>

          <button
            onClick={() => setActiveTab('INDIVIDUAL')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'INDIVIDUAL'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Xếp Hạng Cá Nhân (Nam / Nữ)</span>
          </button>

          <button
            onClick={() => setActiveTab('FINANCE')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'FINANCE'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Sổ Nợ Chạy Bù & Quỹ Giải</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('ADMIN')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'ADMIN'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Quản Trị / Trọng Tài</span>
            </button>
          )}
        </div>

        {/* Nội dung Tab đang chọn */}
        {activeTab === 'TEAM' && (
          <TeamLeaderboard
            isOverall={isOverall}
            weeklyRankedTeams={weeklyRankedTeams}
            overallTeams={overallTeams}
            users={users}
            userWeeklyStatsMap={userWeeklyStats}
            currentWeekNumber={selectedWeekNumber || 1}
          />
        )}

        {activeTab === 'INDIVIDUAL' && (
          <IndividualLeaderboard
            isOverall={isOverall}
            currentWeek={currentWeek}
            overallMaleRankings={overallUsers.maleRankings}
            overallFemaleRankings={overallUsers.femaleRankings}
            users={users}
            teams={teams}
            userWeeklyStatsMap={userWeeklyStats}
            onSelectUser={(user) => setSelectedUserForModal(user)}
          />
        )}

        {activeTab === 'FINANCE' && (
          <FinanceAndDeficit
            financialOverview={financialOverview}
            users={users}
            teams={teams}
            weeks={weeks}
            selectedWeek={currentWeek}
            userWeeklyStatsMap={userWeeklyStats}
            rankedTeamsByWeek={rankedTeamsByWeek}
          />
        )}

        {activeTab === 'ADMIN' && (
          <AdminPanel teams={teams} users={users} onRefreshData={fetchData} />
        )}
      </main>

      {/* Modal Chi Tiết Runner */}
      {selectedUserForModal && (
        <RunnerDetailModal
          user={selectedUserForModal}
          onClose={() => setSelectedUserForModal(null)}
          teams={teams}
          weeks={weeks}
          selectedWeek={currentWeek}
          activities={activities}
          userWeeklyStats={userWeeklyStats[selectedUserForModal.id] || []}
          isAdmin={isAdmin}
          onUpdateActivity={handleUpdateActivity}
          onDeleteActivity={handleDeleteActivity}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>
          Challenge CNHP Thu Đông 2026 • 11/10/2026 đến 06/12/2026 • Câu lạc bộ CNHP Running Club
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Tự động hóa 100% thể lệ: Cap 40km đồng đội • Pace chậm hơn thắng khi hòa km • Nợ chạy bù tuần kế tiếp
        </p>
      </footer>
    </div>
  );
}
