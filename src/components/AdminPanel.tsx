'use client';

import React, { useState } from 'react';
import { User, Team, Activity, ActivityType } from '@/types';
import { Settings, Shield, Plus, RotateCcw, UserPlus, Save, Check } from 'lucide-react';

interface AdminPanelProps {
  teams: Team[];
  users: User[];
  onRefreshData: () => void;
}

export default function AdminPanel({ teams, users, onRefreshData }: AdminPanelProps) {
  // Form thêm bài chạy thủ công
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [actTitle, setActTitle] = useState('Chạy sáng bổ sung');
  const [actDistance, setActDistance] = useState('5.0');
  const [actTimeMinutes, setActTimeMinutes] = useState('30');
  const [actType, setActType] = useState<ActivityType>('Run');
  const [actDate, setActDate] = useState('2026-10-15T06:30');
  const [isSubmittingAct, setIsSubmittingAct] = useState(false);

  // Form sửa thông tin Team
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const handleAddManualActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setIsSubmittingAct(true);

    try {
      const distance = parseFloat(actDistance) || 0;
      const minutes = parseFloat(actTimeMinutes) || 0;
      const movingSec = Math.round(minutes * 60);
      const paceSec = distance > 0 ? Math.round(movingSec / distance) : 0;

      const res = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          title: actTitle,
          type: actType,
          distanceKm: distance,
          movingTimeSec: movingSec,
          averagePaceSeconds: paceSec,
          startDate: new Date(actDate).toISOString(),
          isTrailOrHike: actType === 'TrailRun' || actType === 'Hike' || actType === 'Walk',
        }),
      });

      if (res.ok) {
        alert('Đã thêm bài chạy thành công!');
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
      alert('Không thể thêm bài chạy');
    } finally {
      setIsSubmittingAct(false);
    }
  };

  const handleToggleFee = async (user: User) => {
    try {
      const updated = { ...user, isPaidFee: !user.isPaidFee };
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user',
          user: updated,
        }),
      });
      if (res.ok) onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeUserTeam = async (user: User, newTeamId: string) => {
    try {
      const updated = { ...user, teamId: newTeamId };
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user',
          user: updated,
        }),
      });
      if (res.ok) onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTeam = async (team: Team) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_team',
          team,
        }),
      });
      if (res.ok) {
        alert('Đã cập nhật thông tin đội!');
        setEditingTeam(null);
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetSeed = async () => {
    if (!confirm('Bạn có chắc muốn khôi phục dữ liệu ban đầu của 3 Team và 51 bài chạy mẫu?')) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_seed' }),
      });
      if (res.ok) {
        alert('Đã khôi phục dữ liệu mẫu thành công!');
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-3xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-amber-500" />
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Khu Vực Quản Trị & Trọng Tài (Admin)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quản lý đội đua, gán đội trưởng, duyệt phí 200k và thêm bài chạy thủ công
            </p>
          </div>
        </div>

        <button
          onClick={handleResetSeed}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Dữ Liệu Mẫu</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Form thêm bài chạy thủ công */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-500" />
            Thêm Bài Chạy Thủ Công (Cho VĐV)
          </h3>

          <form onSubmit={handleAddManualActivity} className="space-y-3.5 text-xs sm:text-sm">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                Chọn Vận Động Viên
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({teams.find((t) => t.id === u.teamId)?.name.split('-')[0] || ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                Tiêu Đề Bài Chạy
              </label>
              <input
                type="text"
                value={actTitle}
                onChange={(e) => setActTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Cự Ly (km)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={actDistance}
                  onChange={(e) => setActDistance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Thời Gian (Phút)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={actTimeMinutes}
                  onChange={(e) => setActTimeMinutes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Loại Hoạt Động
                </label>
                <select
                  value={actType}
                  onChange={(e) => setActType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Run">Chạy Road (Pace 3:30 - 10:30)</option>
                  <option value="TrailRun">Trail Run (Miễn kiểm tra pace)</option>
                  <option value="Hike">Trekking / Hiking (Miễn pace)</option>
                  <option value="Walk">Đi bộ dốc / Walk (Miễn pace)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Ngày Giờ Chạy
                </label>
                <input
                  type="datetime-local"
                  value={actDate}
                  onChange={(e) => setActDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingAct}
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-md shadow-orange-500/20"
            >
              {isSubmittingAct ? 'Đang lưu bài...' : 'Lưu Bài Chạy Vào Hệ Thống'}
            </button>
          </form>
        </div>

        {/* 2. Quản lý thông tin Đội đua (Team Names & Captains) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-orange-500" />
            Cấu Hình Các Đội Đua ({teams.length} Team)
          </h3>

          <div className="space-y-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {team.name}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500">
                    {users.filter((u) => u.teamId === team.id).length} thành viên
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-500">Đội trưởng:</span>
                  <select
                    value={team.captainId || ''}
                    onChange={(e) => {
                      const updatedTeam = { ...team, captainId: e.target.value };
                      handleSaveTeam(updatedTeam);
                    }}
                    className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Chưa chọn --</option>
                    {users
                      .filter((u) => u.teamId === team.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Quản lý phí tham dự của VĐV */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Duyệt Phí Tham Dự (200.000đ / người)
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {user.name}
                  </span>

                  <button
                    onClick={() => handleToggleFee(user)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      user.isPaidFee
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                    }`}
                  >
                    {user.isPaidFee ? '✓ Đã Nộp' : 'Chưa Nộp'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
