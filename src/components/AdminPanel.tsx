'use client';

import React, { useState, useEffect } from 'react';
import { User, Team, Activity, ActivityType } from '@/types';
import {
  Settings,
  Shield,
  Plus,
  RotateCcw,
  UserPlus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Crown,
  UserCheck,
  Edit2,
  Palette,
  Check,
  X,
  Users,
} from 'lucide-react';
import EditTeamModal from '@/components/EditTeamModal';

interface AdminPanelProps {
  teams: Team[];
  users: User[];
  onRefreshData: () => void;
}

const PRESET_COLORS = [
  { name: 'Cam Rực Lửa', hex: '#ff5722' },
  { name: 'Xanh Lá Bền Bỉ', hex: '#10b981' },
  { name: 'Xanh Thần Tốc', hex: '#3b82f6' },
  { name: 'Tím Quý Phái', hex: '#8b5cf6' },
  { name: 'Đỏ Nhiệt Huyết', hex: '#ef4444' },
  { name: 'Vàng Hổ Phách', hex: '#f59e0b' },
  { name: 'Hồng Năng Lượng', hex: '#ec4899' },
  { name: 'Xanh Lục Bảo', hex: '#06b6d4' },
  { name: 'Xám Thép', hex: '#64748b' },
];

export default function AdminPanel({ teams, users, onRefreshData }: AdminPanelProps) {
  // Bộ lọc & tìm kiếm thành viên
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [feeFilter, setFeeFilter] = useState('ALL');

  // Form thêm thành viên mới
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserGender, setNewUserGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [newUserTeamId, setNewUserTeamId] = useState(teams[0]?.id || 'team-1');
  const [newUserPaidFee, setNewUserPaidFee] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Quản lý Đội Đua (Teams)
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [teamIdForModal, setTeamIdForModal] = useState<string | null>(null);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#ff5722');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // Chỉnh sửa Đội Đua (inline fallback)
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [editingTeamColor, setEditingTeamColor] = useState('#ff5722');
  const [isSavingEditTeam, setIsSavingEditTeam] = useState(false);

  // Form thêm bài chạy thủ công
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [actTitle, setActTitle] = useState('Chạy sáng bổ sung');
  const [actDistance, setActDistance] = useState('5.0');
  const [actTimeMinutes, setActTimeMinutes] = useState('30');
  const [actType, setActType] = useState<ActivityType>('Run');
  const [actDate, setActDate] = useState('2026-10-15T06:30');
  const [isSubmittingAct, setIsSubmittingAct] = useState(false);

  // =================== QUẢN LÝ THÀNH VIÊN ===================

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) {
      alert('Vui lòng nhập họ và tên thành viên');
      return;
    }
    setIsCreatingUser(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_user',
          name: newUserName.trim(),
          gender: newUserGender,
          teamId: newUserTeamId || teams[0]?.id || 'team-1',
          isPaidFee: newUserPaidFee,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Đã thêm thành viên "${data.user.name}" thành công!`);
        setNewUserName('');
        setShowAddUserModal(false);
        onRefreshData();
      } else {
        alert(data.error || 'Không thể tạo thành viên');
      }
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || String(err)));
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa thành viên "${user.name}" khỏi giải đấu?\nTất cả bài chạy liên quan của vận động viên này cũng sẽ bị gỡ bỏ.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_user',
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Đã xóa thành viên "${user.name}" thành công!`);
        onRefreshData();
      } else {
        alert(data.error || 'Không tìm thấy hoặc không thể xóa thành viên');
      }
    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi xóa thành viên: ' + (err.message || String(err)));
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
      const updated = { ...user, teamId: newTeamId, isCaptain: false };
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

  const handleToggleCaptain = async (user: User) => {
    try {
      const newStatus = !user.isCaptain;
      const updated = { ...user, isCaptain: newStatus };
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user',
          user: updated,
        }),
      });

      const team = teams.find((t) => t.id === user.teamId);
      if (team) {
        const updatedTeam = { ...team, captainId: newStatus ? user.id : undefined };
        await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_team',
            team: updatedTeam,
          }),
        });
      }

      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // =================== QUẢN LÝ ĐỘI ĐUA (TEAMS) ===================

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      alert('Vui lòng nhập tên đội đua mới');
      return;
    }
    setIsCreatingTeam(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_team',
          name: newTeamName.trim(),
          color: newTeamColor,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Đã tạo thành công đội đua "${data.team.name}"!`);
        setNewTeamName('');
        setShowAddTeamModal(false);
        onRefreshData();
      } else {
        alert(data.error || 'Không thể tạo đội đua');
      }
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || String(err)));
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleStartEditTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setEditingTeamName(team.name);
    setEditingTeamColor(team.color || '#ff5722');
  };

  const handleSaveEditTeam = async (team: Team) => {
    if (!editingTeamName.trim()) {
      alert('Tên đội không được để trống');
      return;
    }
    setIsSavingEditTeam(true);
    try {
      const updated: Team = {
        ...team,
        name: editingTeamName.trim(),
        color: editingTeamColor,
      };
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_team',
          team: updated,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Đã cập nhật thông tin đội thành công!');
        setEditingTeamId(null);
        onRefreshData();
      } else {
        alert(data.error || 'Không thể cập nhật đội');
      }
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || String(err)));
    } finally {
      setIsSavingEditTeam(false);
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    if (teams.length <= 1) {
      alert('Giải đấu phải có ít nhất 1 đội đua, không thể xóa tất cả các đội!');
      return;
    }
    const memberCount = users.filter((u) => u.teamId === team.id).length;
    const fallbackTeam = teams.find((t) => t.id !== team.id);
    const confirmMsg = memberCount > 0
      ? `Bạn có chắc muốn xóa đội "${team.name}"?\nHiện tại đội có ${memberCount} vận động viên. Tất cả ${memberCount} vận động viên này sẽ được tự động chuyển sang "${fallbackTeam?.name || 'đội khác'}".`
      : `Bạn có chắc muốn xóa đội "${team.name}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_team',
          teamId: team.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Đã xóa đội "${team.name}" thành công!`);
        onRefreshData();
      } else {
        alert(data.message || data.error || 'Không thể xóa đội');
      }
    } catch (err: any) {
      alert('Lỗi khi xóa đội: ' + (err.message || String(err)));
    }
  };

  const handleUpdateTeamCaptain = async (team: Team, captainId: string) => {
    try {
      const updatedTeam = { ...team, captainId: captainId || undefined };
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_team',
          team: updatedTeam,
        }),
      });
      if (res.ok) {
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // =================== BÀI CHẠY THỦ CÔNG ===================

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

  // Lọc danh sách thành viên
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = teamFilter === 'ALL' || u.teamId === teamFilter;
    const matchesFee = feeFilter === 'ALL' || (feeFilter === 'PAID' ? u.isPaidFee : !u.isPaidFee);
    return matchesSearch && matchesTeam && matchesFee;
  });

  return (
    <div className="space-y-6">
      {/* Banner Tiêu đề & Reset */}
      <div className="bg-amber-500/10 border border-amber-500/30 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              Bảng Điều Khiển Quản Trị Viên & Trọng Tài
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quản lý các đội đua, thành viên, duyệt phí tham gia và can thiệp bài chạy theo thể lệ
            </p>
          </div>
        </div>

        <button
          onClick={handleResetSeed}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Dữ Liệu Ban Đầu</span>
        </button>
      </div>

      {/* ================= KHU VỰC 1: QUẢN LÝ CÁC ĐỘI ĐUA (TEAMS) ================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              <span>Quản Lý Các Đội Đua ({teams.length} Đội)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Thêm đội đua mới, đổi tên đội, đổi màu sắc nhận diện hoặc xóa bớt đội
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTeamIdForModal(teams[0]?.id || null);
                setIsEditTeamModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all active:scale-95"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>✏️ Quản Lý & Đổi Tên Đội</span>
            </button>
            <button
              onClick={() => {
                setTeamIdForModal('CREATE_NEW');
                setIsEditTeamModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm Đội</span>
            </button>
          </div>
        </div>

        {/* Modal / Form thêm đội mới */}
        {showAddTeamModal && (
          <form
            onSubmit={handleCreateTeam}
            className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 space-y-3 animate-fadeIn text-xs sm:text-sm"
          >
            <div className="font-bold text-orange-800 dark:text-orange-300">
              Nhập Thông Tin Đội Đua Mới:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Tên Đội Đua
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Team 4 - Bứt Phá Giới Hạn"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Màu Sắc Nhận Diện
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={newTeamColor}
                    onChange={(e) => setNewTeamColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                  />
                  <div className="flex flex-wrap gap-1">
                    {PRESET_COLORS.slice(0, 5).map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setNewTeamColor(c.hex)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          newTeamColor === c.hex ? 'scale-110 border-slate-900 dark:border-white' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddTeamModal(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isCreatingTeam}
                className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-500/20"
              >
                {isCreatingTeam ? 'Đang tạo...' : 'Lưu Đội Đua Mới'}
              </button>
            </div>
          </form>
        )}

        {/* Danh sách các đội đua */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {teams.map((team) => {
            const teamMembers = users.filter((u) => u.teamId === team.id);
            const isEditing = editingTeamId === team.id;

            return (
              <div
                key={team.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 relative group"
              >
                {isEditing ? (
                  // Chế độ chỉnh sửa tên và màu
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Sửa Tên Đội:
                      </label>
                      <input
                        type="text"
                        value={editingTeamName}
                        onChange={(e) => setEditingTeamName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Chọn Màu Nhận Diện:
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setEditingTeamColor(c.hex)}
                            className={`w-5 h-5 rounded-full border-2 transition-transform ${
                              editingTeamColor === c.hex ? 'scale-125 border-slate-900 dark:border-white shadow-sm' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                        <input
                          type="color"
                          value={editingTeamColor}
                          onChange={(e) => setEditingTeamColor(e.target.value)}
                          className="w-6 h-6 rounded-lg cursor-pointer bg-transparent border-0"
                          title="Tùy chọn mã màu"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-1.5 pt-1">
                      <button
                        onClick={() => setEditingTeamId(null)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => handleSaveEditTeam(team)}
                        disabled={isSavingEditTeam}
                        className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                      >
                        <Check className="w-3 h-3" />
                        <span>Lưu</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // Chế độ xem & thao tác bình thường
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: team.color || '#ff5722' }}
                        />
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                          {team.name}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            setTeamIdForModal(team.id);
                            setIsEditTeamModalOpen(true);
                          }}
                          title="Chỉnh sửa tên và màu sắc đội"
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 text-xs font-bold transition shadow-sm active:scale-95"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Sửa tên</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team)}
                          title="Xóa đội đua này"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span className="font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px]">
                        👥 {teamMembers.length} Vận Động Viên
                      </span>

                      <div className="flex items-center space-x-1.5">
                        <span className="text-[11px] font-medium text-slate-400">Đội trưởng:</span>
                        <select
                          value={team.captainId || ''}
                          onChange={(e) => handleUpdateTeamCaptain(team, e.target.value)}
                          className="px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-800 dark:text-slate-200 max-w-[130px] truncate"
                        >
                          <option value="">-- Chưa chọn --</option>
                          {teamMembers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Chỉnh Sửa & Quản Lý Đội */}
        <EditTeamModal
          isOpen={isEditTeamModalOpen}
          onClose={() => setIsEditTeamModalOpen(false)}
          initialTeamId={teamIdForModal}
          teams={teams}
          users={users}
          onRefreshData={onRefreshData}
        />
      </div>

      {/* ================= KHU VỰC 2: QUẢN LÝ THÀNH VIÊN ================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-orange-500" />
              <span>Quản Lý Thành Viên Tham Gia Giải ({users.length} VĐV)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Thay đổi đội thi đấu, phong Đội Trưởng, duyệt nộp phí 200.000đ hoặc xóa thành viên
            </p>
          </div>

          <button
            onClick={() => setShowAddUserModal(!showAddUserModal)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddUserModal ? 'Đóng Form Thêm' : '+ Thêm Thành Viên Mới'}</span>
          </button>
        </div>

        {/* Modal / Form thêm thành viên mới */}
        {showAddUserModal && (
          <form
            onSubmit={handleCreateUser}
            className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 space-y-3 animate-fadeIn text-xs sm:text-sm"
          >
            <div className="font-bold text-orange-800 dark:text-orange-300">
              Nhập Thông Tin Thành Viên Mới:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Họ và Tên
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hoàng Tuấn Anh"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Giới Tính
                </label>
                <select
                  value={newUserGender}
                  onChange={(e) => setNewUserGender(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="MALE">🏃‍♂️ Nam</option>
                  <option value="FEMALE">🏃‍♀️ Nữ</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Đội Thi Đấu
                </label>
                <select
                  value={newUserTeamId}
                  onChange={(e) => setNewUserTeamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Phí Tham Dự (200k)
                </label>
                <select
                  value={newUserPaidFee ? 'PAID' : 'UNPAID'}
                  onChange={(e) => setNewUserPaidFee(e.target.value === 'PAID')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="UNPAID">Chưa nộp</option>
                  <option value="PAID">✓ Đã nộp 200.000đ</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isCreatingUser}
                className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-500/20"
              >
                {isCreatingUser ? 'Đang thêm...' : 'Lưu Thành Viên'}
              </button>
            </div>
          </form>
        )}

        {/* Thanh tìm kiếm & bộ lọc */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên thành viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="ALL">Tất cả các đội ({users.length})</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({users.filter((u) => u.teamId === t.id).length})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={feeFilter}
              onChange={(e) => setFeeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="ALL">Tất cả trạng thái nộp tiền</option>
              <option value="PAID">Đã nộp ({users.filter((u) => u.isPaidFee).length})</option>
              <option value="UNPAID">Chưa nộp ({users.filter((u) => !u.isPaidFee).length})</option>
            </select>
          </div>
        </div>

        {/* Bảng danh sách thành viên */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Không tìm thấy thành viên nào khớp với bộ lọc.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const userTeam = teams.find((t) => t.id === user.teamId);
                return (
                  <div
                    key={user.id}
                    className="p-3 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Thông tin VĐV */}
                    <div className="flex items-center space-x-3 min-w-[200px]">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white">
                          <span>{user.name}</span>
                          {user.isCaptain && (
                            <span title="Đội Trưởng" className="text-amber-500">
                              <Crown className="w-3.5 h-3.5 fill-current" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span>{user.gender === 'MALE' ? '🏃‍♂️ Nam' : '🏃‍♀️ Nữ'}</span>
                          {user.stravaId && (
                            <span className="text-orange-600 dark:text-orange-400 font-medium">
                              Strava ID: {user.stravaId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Thao tác chọn Đội, Đội trưởng, Phí và Xóa */}
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end text-xs">
                      {/* Dropdown Đổi Đội */}
                      <select
                        value={user.teamId}
                        onChange={(e) => handleChangeUserTeam(user, e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200"
                        title="Chuyển đội cho thành viên"
                      >
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>

                      {/* Nút Đội Trưởng */}
                      <button
                        onClick={() => handleToggleCaptain(user)}
                        title={user.isCaptain ? 'Bỏ vai trò Đội Trưởng' : 'Gán làm Đội Trưởng'}
                        className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl font-bold transition-all ${
                          user.isCaptain
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-600'
                        }`}
                      >
                        <Crown className="w-3 h-3" />
                        <span className="hidden md:inline">{user.isCaptain ? 'Đội Trưởng' : 'Gán C'}</span>
                      </button>

                      {/* Nút Phí 200k */}
                      <button
                        onClick={() => handleToggleFee(user)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                          user.isPaidFee
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                        }`}
                        title="Bấm để chuyển trạng thái nộp tiền"
                      >
                        {user.isPaidFee ? '✓ Đã Nộp' : 'Chưa Nộp'}
                      </button>

                      {/* Nút Xóa thành viên */}
                      <button
                        onClick={() => handleDeleteUser(user)}
                        title="Xóa thành viên khỏi giải đấu"
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-800 transition-all active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Xóa</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ================= KHU VỰC 3: THÊM BÀI CHẠY THỦ CÔNG ================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl">
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
                  {u.name} ({teams.find((t) => t.id === u.teamId)?.name || ''})
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
    </div>
  );
}
