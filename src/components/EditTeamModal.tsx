'use client';

import React, { useState, useEffect } from 'react';
import { Team, User } from '@/types';
import { X, Check, Trash2, Plus, Shield, Palette, Users, Crown, AlertTriangle, Lock } from 'lucide-react';

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTeamId?: string | null;
  teams: Team[];
  users: User[];
  onRefreshData: () => void;
  isAdmin?: boolean;
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

export default function EditTeamModal({
  isOpen,
  onClose,
  initialTeamId,
  teams,
  users,
  onRefreshData,
  isAdmin = false,
}: EditTeamModalProps) {
  // Tab đang chọn: id của team cần sửa, hoặc 'CREATE_NEW'
  const [activeTab, setActiveTab] = useState<string>(initialTeamId || teams[0]?.id || 'CREATE_NEW');

  // Form edit team
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('#ff5722');
  const [captainId, setCaptainId] = useState<string>('');

  // Form tạo team mới
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#ff5722');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Khi modal mở hoặc initialTeamId thay đổi
  useEffect(() => {
    if (initialTeamId && teams.some((t) => t.id === initialTeamId)) {
      setActiveTab(initialTeamId);
    } else if (teams.length > 0) {
      setActiveTab(teams[0].id);
    } else if (isAdmin) {
      setActiveTab('CREATE_NEW');
    }
  }, [initialTeamId, isOpen, teams, isAdmin]);

  // Cập nhật giá trị form khi activeTab thay đổi
  useEffect(() => {
    setMessage(null);
    if (activeTab === 'CREATE_NEW') {
      setNewTeamName('');
      setNewTeamColor('#ff5722');
    } else {
      const currentTeam = teams.find((t) => t.id === activeTab);
      if (currentTeam) {
        setTeamName(currentTeam.name);
        setTeamColor(currentTeam.color || '#ff5722');
        setCaptainId(currentTeam.captainId || '');
      }
    }
  }, [activeTab, teams]);

  if (!isOpen) return null;

  const currentTeam = teams.find((t) => t.id === activeTab);
  const teamMembers = currentTeam ? users.filter((u) => u.teamId === currentTeam.id) : [];

  // Lưu chỉnh sửa thông tin đội
  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setMessage({ type: 'error', text: '🔒 Quyền hạn bị từ chối: Chỉ Quản trị viên (Admin) mới có quyền sửa tên đội đua!' });
      return;
    }
    if (!currentTeam) return;
    if (!teamName.trim()) {
      setMessage({ type: 'error', text: 'Tên đội đua không được để trống!' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const updatedTeam: Team = {
        ...currentTeam,
        name: teamName.trim(),
        color: teamColor,
        captainId: captainId || undefined,
      };

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_team',
          team: updatedTeam,
          isAdmin,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: `✅ Đã cập nhật thành công tên đội: "${updatedTeam.name}"!` });
        // Cập nhật captain cho user nếu có chọn
        if (captainId) {
          const captainUser = users.find((u) => u.id === captainId);
          if (captainUser && !captainUser.isCaptain) {
            await fetch('/api/admin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'update_user',
                user: { ...captainUser, isCaptain: true },
              }),
            });
          }
        }
        onRefreshData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra khi cập nhật đội' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi kết nối máy chủ' });
    } finally {
      setIsSaving(false);
    }
  };

  // Tạo đội mới
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setMessage({ type: 'error', text: '🔒 Quyền hạn bị từ chối: Chỉ Quản trị viên (Admin) mới có quyền tạo đội đua mới!' });
      return;
    }
    if (!newTeamName.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên cho đội mới!' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_team',
          name: newTeamName.trim(),
          color: newTeamColor,
          isAdmin,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: `🎉 Đã tạo thành công đội "${data.team.name}"!` });
        setNewTeamName('');
        onRefreshData();
        setActiveTab(data.team.id);
      } else {
        setMessage({ type: 'error', text: data.error || 'Không thể tạo đội đua' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi kết nối' });
    } finally {
      setIsSaving(false);
    }
  };

  // Xóa đội
  const handleDeleteTeam = async () => {
    if (!isAdmin) {
      alert('🔒 Quyền hạn bị từ chối: Chỉ Quản trị viên (Admin) mới có quyền xóa đội đua!');
      return;
    }
    if (!currentTeam) return;
    if (teams.length <= 1) {
      alert('Giải đấu phải có ít nhất 1 đội đua, không thể xóa tất cả các đội!');
      return;
    }

    const fallbackTeam = teams.find((t) => t.id !== currentTeam.id);
    const count = teamMembers.length;
    const confirmMsg =
      count > 0
        ? `Bạn có chắc muốn xóa đội "${currentTeam.name}"?\nToàn bộ ${count} VĐV trong đội này sẽ được chuyển sang đội "${fallbackTeam?.name}".`
        : `Bạn có chắc muốn xóa đội "${currentTeam.name}"?`;

    if (!confirm(confirmMsg)) return;

    setIsDeleting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_team',
          teamId: currentTeam.id,
          isAdmin,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: `Đã xóa đội "${currentTeam.name}" thành công!` });
        onRefreshData();
        if (fallbackTeam) {
          setActiveTab(fallbackTeam.id);
        }
      } else {
        setMessage({ type: 'error', text: data.message || data.error || 'Lỗi khi xóa đội' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi kết nối' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/20">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                Quản Lý & Chỉnh Sửa Đội Đua
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hiệu chỉnh tên đội, màu sắc đại diện hoặc tạo đội mới
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh chọn Team (Tabs) */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {teams.map((t) => {
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: t.color || '#ff5722' }}
                />
                <span className="whitespace-nowrap">{t.name}</span>
              </button>
            );
          })}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('CREATE_NEW')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'CREATE_NEW'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Đội</span>
            </button>
          )}
        </div>

        {/* Cảnh báo chế độ chỉ đọc nếu không phải Admin */}
        {!isAdmin && (
          <div className="mx-5 mt-4 px-3.5 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Chế độ chỉ xem:</strong> Chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa tên đội và lưu thay đổi.</span>
          </div>
        )}

        {/* Thông báo kết quả */}
        {message && (
          <div
            className={`mx-5 mt-4 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            <span>{message.text}</span>
          </div>
        )}

        {/* Thân Modal */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'CREATE_NEW' ? (
            /* ================= FORM TẠO ĐỘI MỚI ================= */
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên Đội Đua Mới: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Team 4 - Bứt Phá Giới Hạn"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  disabled={!isAdmin || isSaving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/60 disabled:cursor-not-allowed"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Chọn Màu Nhận Diện:
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => setNewTeamColor(c.hex)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform flex items-center justify-center ${
                          newTeamColor === c.hex
                            ? 'scale-115 border-slate-900 dark:border-white shadow-md'
                            : 'border-transparent hover:scale-105'
                        } ${!isAdmin ? 'cursor-not-allowed opacity-60' : ''}`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {newTeamColor === c.hex && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                    <div className="flex items-center space-x-1 pl-1">
                      <input
                        type="color"
                        disabled={!isAdmin}
                        value={newTeamColor}
                        onChange={(e) => setNewTeamColor(e.target.value)}
                        className={`w-7 h-7 rounded-lg bg-transparent border-0 ${!isAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        title="Tự chọn mã màu tùy ý"
                      />
                      <span className="text-xs font-mono text-slate-500">{newTeamColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={!isAdmin || isSaving}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5 ${
                    isAdmin
                      ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25 active:scale-95'
                      : 'bg-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isAdmin ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{isSaving ? 'Đang tạo...' : isAdmin ? 'Tạo Đội Ngay' : 'Chỉ Admin mới được tạo'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* ================= FORM CHỈNH SỬA ĐỘI HIỆN TẠI ================= */
            <form onSubmit={handleSaveTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên Đội Đua: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={teamName}
                  disabled={!isAdmin || isSaving}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Nhập tên mới cho đội..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/60 disabled:cursor-not-allowed"
                  autoFocus
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Tên này sẽ hiển thị trên Bảng xếp hạng tập thể, cá nhân và các báo cáo.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Màu Sắc Nhận Diện:
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => setTeamColor(c.hex)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform flex items-center justify-center ${
                          teamColor === c.hex
                            ? 'scale-115 border-slate-900 dark:border-white shadow-md'
                            : 'border-transparent hover:scale-105'
                        } ${!isAdmin ? 'cursor-not-allowed opacity-60' : ''}`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {teamColor === c.hex && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                    <div className="flex items-center space-x-1 pl-1">
                      <input
                        type="color"
                        disabled={!isAdmin}
                        value={teamColor}
                        onChange={(e) => setTeamColor(e.target.value)}
                        className={`w-7 h-7 rounded-lg bg-transparent border-0 ${!isAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        title="Tự chọn mã màu tùy ý"
                      />
                      <span className="text-xs font-mono text-slate-500">{teamColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Đội Trưởng (Captain):
                </label>
                <select
                  value={captainId}
                  disabled={!isAdmin || isSaving}
                  onChange={(e) => setCaptainId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/60 disabled:cursor-not-allowed"
                >
                  <option value="">-- Chưa chỉ định đội trưởng --</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.isCaptain ? '★ (Đội trưởng hiện tại)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Đội hiện có {teamMembers.length} thành viên tham gia.
                </p>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                {isAdmin && teams.length > 1 ? (
                  <button
                    type="button"
                    onClick={handleDeleteTeam}
                    disabled={isDeleting}
                    className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? 'Đang xóa...' : 'Xóa đội'}</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={!isAdmin || isSaving}
                    className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5 ${
                      isAdmin
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25 active:scale-95'
                        : 'bg-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {isAdmin ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isSaving ? 'Đang lưu...' : isAdmin ? 'Lưu Thay Đổi' : 'Chỉ Admin mới được lưu'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
