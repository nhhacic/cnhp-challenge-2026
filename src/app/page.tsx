'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import CountdownBanner from '@/components/CountdownBanner';
import TeamLeaderboard from '@/components/TeamLeaderboard';
import IndividualLeaderboard from '@/components/IndividualLeaderboard';
import FinanceAndDeficit from '@/components/FinanceAndDeficit';
import AdminPanel from '@/components/AdminPanel';
import RunnerDetailModal from '@/components/RunnerDetailModal';
import ChallengeRules from '@/components/ChallengeRules';
import InstallAppModal from '@/components/InstallAppModal';
import StravaOAuthModal from '@/components/StravaOAuthModal';
import LeaveRequestModal from '@/components/LeaveRequestModal';
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
  LeaveRequest,
} from '@/types';
import { Trophy, Users, DollarSign, Shield, Flame, BookOpen, Activity as ActivityIcon } from 'lucide-react';

export default function HomePage() {
  const [data, setData] = useState<{
    weeks: Week[];
    teams: Team[];
    users: User[];
    activities: Activity[];
    leaveRequests?: LeaveRequest[];
    userWeeklyStats: Record<string, UserWeeklyStat[]>;
    rankedTeamsByWeek: Record<number, TeamWeeklyStat[]>;
    overallUsers: { maleRankings: OverallUserStat[]; femaleRankings: OverallUserStat[] };
    overallTeams: OverallTeamStat[];
    financialOverview: FinancialOverview;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number | null>(1); // Mặc định Tuần 1
  const [activeTab, setActiveTab] = useState<'TEAM' | 'INDIVIDUAL' | 'FINANCE' | 'RULES' | 'ADMIN'>('TEAM');
  const [selectedUserForModal, setSelectedUserForModal] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectedUser, setConnectedUser] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showStravaModal, setShowStravaModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveDefaultUserId, setLeaveDefaultUserId] = useState<string | undefined>(undefined);
  const [leaveDefaultWeekNumber, setLeaveDefaultWeekNumber] = useState<number | undefined>(undefined);

  // Khởi tạo chế độ tối và kiểm tra phiên đăng nhập Strava
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark =
        localStorage.getItem('theme') === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
      if (isDark) document.documentElement.classList.add('dark');

      // 0. Phục hồi quyền Admin nếu đã bật trước đó
      const savedAdmin = localStorage.getItem('cnhp_is_admin');
      if (savedAdmin === 'true') {
        setIsAdmin(true);
      }

      // 1. Phục hồi user đã đăng nhập
      const savedUser = localStorage.getItem('cnhp_auth_user');
      if (savedUser) {
        try {
          setConnectedUser(JSON.parse(savedUser));
        } catch (e) {}
      }

      // 2. Kiểm tra callback sau khi đăng nhập Strava thành công
      const params = new URLSearchParams(window.location.search);
      const stravaStatus = params.get('strava_status');
      const userId = params.get('user_id');
      const athleteName = params.get('athlete_name');
      const avatar = params.get('avatar');
      const syncedCount = params.get('synced_count');
      const stravaError = params.get('strava_error');

      if (stravaError) {
        let decoded = decodeURIComponent(stravaError);
        if (
          decoded.toLowerCase().includes('maximum number of athletes') ||
          decoded.toLowerCase().includes('exceeded') ||
          decoded.toLowerCase().includes('limit')
        ) {
          decoded = 'Cổng Strava này đã đầy giới hạn 10 VĐV. Bạn hãy bấm vào biểu tượng Strava trên thanh công cụ và chọn "Cổng 2 (Mở rộng - Anh Phi Long)" để kết nối thành công nhé!';
        }
        alert('Thông báo Strava: ' + decoded);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (stravaStatus === 'success' && userId) {
        const userObj = {
          id: userId,
          name: athleteName ? decodeURIComponent(athleteName) : 'VĐV Strava',
          avatar: avatar ? decodeURIComponent(avatar) : '',
        };
        setConnectedUser(userObj);
        localStorage.setItem('cnhp_auth_user', JSON.stringify(userObj));

        // Bắn pháo hoa chào mừng
        import('canvas-confetti').then((confetti) => {
          confetti.default({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        });

        alert(
          `🎉 Đăng nhập Strava thành công!\nChào mừng ${userObj.name} tham gia CNHP Challenge 2026.\nĐã tự động đọc và đồng bộ ${syncedCount || 0} bài chạy mới nhất vào bảng xếp hạng!`
        );
        window.history.replaceState({}, document.title, window.location.pathname);
        fetchData();
      }
    }
  }, []);

  const handleLogout = () => {
    setConnectedUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cnhp_auth_user');
    }
  };

  const handleToggleAdmin = () => {
    const next = !isAdmin;
    setIsAdmin(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cnhp_is_admin', String(next));
    }
  };

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

  // Tải dữ liệu từ API (silent: không unmount DOM khi refresh nền)
  const fetchData = async (silent = false) => {
    try {
      if (!data && !silent) setLoading(true);
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      if (!silent) setLoading(false);
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

  // Xóa thành viên từ modal hoặc admin
  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_user',
          userId,
        }),
      });
      if (res.ok) {
        setSelectedUserForModal(null);
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
  const CHALLENGE_START_TIME = new Date('2026-10-12T00:00:00+07:00').getTime();
  const totalKmAll = activities
    .filter((a) => a.isValid && new Date(a.startDate).getTime() >= CHALLENGE_START_TIME)
    .reduce((sum, a) => sum + a.effectiveKm, 0);

  // Xác định thành viên tham gia thử thách đang đăng nhập
  const currentParticipant = users.find((u) => {
    if (!connectedUser) return false;
    if (connectedUser.id && u.id === connectedUser.id) return true;
    if (connectedUser.id && u.stravaId === String(connectedUser.id)) return true;
    if (connectedUser.id && u.id === `user-${connectedUser.id}`) return true;
    if (connectedUser.name && u.name.toLowerCase().trim() === connectedUser.name.toLowerCase().trim()) return true;
    return false;
  }) || null;

  const isChallengeMember = Boolean(currentParticipant || isAdmin);

  const handleOpenLeaveModal = (targetUserId?: string, targetWeekNumber?: number) => {
    if (!isChallengeMember) {
      if (!connectedUser) {
        alert(
          '🔒 Quyền truy cập bị giới hạn:\nChỉ thành viên chính thức tham gia thử thách CNHP Thu Đông 2026 mới có quyền gửi đơn xin tạm nghỉ.\n\nVui lòng bấm vào nút "Strava" để đăng nhập xác thực tài khoản VĐV của bạn!'
        );
        setShowStravaModal(true);
      } else {
        alert(
          `🔒 Quyền truy cập bị giới hạn:\nTài khoản Strava "${connectedUser.name}" không nằm trong danh sách thành viên tham gia thử thách CNHP Thu Đông 2026.\n\nChỉ các VĐV chính thức mới có quyền gửi đơn xin nghỉ tuần. Vui lòng liên hệ Ban Tổ Chức nếu bạn có trong danh sách thi đấu!`
        );
      }
      return;
    }

    const effectiveUserId = !isAdmin && currentParticipant ? currentParticipant.id : (targetUserId || currentParticipant?.id || users[0]?.id);
    setLeaveDefaultUserId(effectiveUserId);
    setLeaveDefaultWeekNumber(targetWeekNumber || selectedWeekNumber || 1);
    setShowLeaveModal(true);
  };

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
        onToggleAdmin={handleToggleAdmin}
        onSyncStrava={handleSyncStrava}
        isSyncing={isSyncing}
        connectedUser={connectedUser}
        onLogout={handleLogout}
        users={users}
        onConnectStrava={() => setShowStravaModal(true)}
        onOpenLeaveModal={() => handleOpenLeaveModal()}
        isChallengeMember={isChallengeMember}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Banner đếm ngược & Chỉ tiêu */}
        <CountdownBanner
          currentWeek={currentWeek}
          totalKmAll={totalKmAll}
          totalUsersCount={users.length}
          financialOverview={financialOverview}
          onViewRules={() => setActiveTab('RULES')}
          onInstallApp={() => setShowInstallModal(true)}
          onOpenLeaveModal={() => handleOpenLeaveModal()}
        />

        {/* Thanh chuyển đổi phân hệ (Main Navigation Tabs) */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('TEAM')}
            className={`flex items-center space-x-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'TEAM'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4 flex-shrink-0" />
            <span className="sm:hidden">Tập Thể</span>
            <span className="hidden sm:inline">Xếp Hạng Tập Thể (Team)</span>
          </button>

          <button
            onClick={() => setActiveTab('INDIVIDUAL')}
            className={`flex items-center space-x-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'INDIVIDUAL'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className="sm:hidden">Cá Nhân</span>
            <span className="hidden sm:inline">Xếp Hạng Cá Nhân (Nam / Nữ)</span>
          </button>

          <button
            onClick={() => setActiveTab('FINANCE')}
            className={`flex items-center space-x-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'FINANCE'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4 flex-shrink-0" />
            <span className="sm:hidden">Quỹ & Phạt</span>
            <span className="hidden sm:inline">Sổ Nợ Chạy Bù & Quỹ Giải</span>
          </button>

          <button
            onClick={() => setActiveTab('RULES')}
            className={`flex items-center space-x-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'RULES'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            <span className="sm:hidden">Thể Lệ</span>
            <span className="hidden sm:inline">Thể Lệ Giải Đấu</span>
          </button>

          <button
            onClick={() => {
              if (!isAdmin) {
                setIsAdmin(true);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('cnhp_is_admin', 'true');
                }
              }
              setActiveTab('ADMIN');
            }}
            className={`flex items-center space-x-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'ADMIN'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span className="sm:hidden">Trọng Tài</span>
            <span className="hidden sm:inline">Quản Trị / Trọng Tài</span>
          </button>
        </div>

        {/* Nội dung Tab đang chọn */}
        {activeTab === 'TEAM' && (
          <TeamLeaderboard
            isOverall={isOverall}
            weeklyRankedTeams={weeklyRankedTeams}
            overallTeams={overallTeams}
            users={users}
            teams={teams}
            userWeeklyStatsMap={userWeeklyStats}
            currentWeekNumber={selectedWeekNumber || 1}
            onRefreshData={() => fetchData(true)}
            isAdmin={isAdmin}
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
            isAdmin={isAdmin}
            connectedUser={connectedUser}
            onConnectStrava={() => setShowStravaModal(true)}
            onRefreshData={() => fetchData(true)}
          />
        )}

        {activeTab === 'RULES' && (
          <ChallengeRules />
        )}

        {activeTab === 'ADMIN' && (
          <AdminPanel
            teams={teams}
            users={users}
            leaveRequests={data.leaveRequests || []}
            onRefreshData={() => fetchData(true)}
          />
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
          onDeleteUser={handleDeleteUser}
          onRequestLeave={(u, weekNum) => handleOpenLeaveModal(u.id, weekNum)}
          currentParticipantUser={currentParticipant}
        />
      )}

      {/* Modal Xin Nghỉ Tuần (Bất khả kháng) */}
      <LeaveRequestModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        users={users}
        weeks={weeks}
        leaveRequests={data.leaveRequests || []}
        defaultUserId={leaveDefaultUserId}
        defaultWeekNumber={leaveDefaultWeekNumber}
        currentUser={currentParticipant}
        isAdmin={isAdmin}
        onRefreshData={() => fetchData(true)}
      />

      {/* Modal Hướng Dẫn Cài Đặt App */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      {/* Modal Chọn Cổng Đăng Nhập Strava */}
      <StravaOAuthModal
        isOpen={showStravaModal}
        onClose={() => setShowStravaModal(false)}
        users={users}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>
          Challenge CNHP Thu Đông 2026 • 12/10/2026 đến 06/12/2026 • Câu lạc bộ CNHP Running Club
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Tự động hóa 100% thể lệ: Cap 40km đồng đội • Pace chậm hơn thắng khi hòa km • Nợ chạy bù tuần kế tiếp
        </p>
      </footer>
    </div>
  );
}
