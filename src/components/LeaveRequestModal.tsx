'use client';

import React, { useState } from 'react';
import { User, Week, LeaveRequest } from '@/types';
import { X, Calendar, AlertCircle, CheckCircle2, Clock, Trash2, Send, ShieldAlert, Sparkles, User as UserIcon } from 'lucide-react';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  weeks: Week[];
  leaveRequests?: LeaveRequest[];
  defaultUserId?: string;
  defaultWeekNumber?: number;
  currentUser?: User | null;
  isAdmin?: boolean;
  onRefreshData: () => void;
}

export default function LeaveRequestModal({
  isOpen,
  onClose,
  users,
  weeks,
  leaveRequests = [],
  defaultUserId,
  defaultWeekNumber,
  currentUser,
  isAdmin = false,
  onRefreshData,
}: LeaveRequestModalProps) {
  const isChallengeMember = Boolean(currentUser || isAdmin);

  const [selectedUserId, setSelectedUserId] = useState<string>(
    (!isAdmin && currentUser) ? currentUser.id : (defaultUserId || (users.length > 0 ? users[0].id : ''))
  );
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(
    defaultWeekNumber || (weeks.length > 0 ? weeks[0].weekNumber : 1)
  );
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'NEW_REQUEST' | 'LIST'>('NEW_REQUEST');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    if (!isAdmin && currentUser) {
      setSelectedUserId(currentUser.id);
    } else if (defaultUserId) {
      setSelectedUserId(defaultUserId);
    }
  }, [currentUser, defaultUserId, isAdmin, isOpen]);

  if (!isOpen) return null;

  const targetUserId = (!isAdmin && currentUser) ? currentUser.id : selectedUserId;
  const selectedUser = users.find((u) => u.id === targetUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveUserId = (!isAdmin && currentUser) ? currentUser.id : selectedUserId;
    if (!effectiveUserId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn thành viên xin tạm nghỉ' });
      return;
    }
    if (!reason.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập rõ lý do bất khả kháng (chấn thương, ốm đau, công tác...)' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_leave_request',
          userId: effectiveUserId,
          weekNumber: Number(selectedWeekNumber),
          reason: reason.trim(),
          status: 'PENDING',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: `Đã gửi đơn xin nghỉ Tuần ${selectedWeekNumber} thành công! Đơn đang chờ Admin / Trọng tài duyệt.`,
        });
        setReason('');
        onRefreshData();
        setTimeout(() => {
          setActiveTab('LIST');
        }, 800);
      } else {
        setMessage({ type: 'error', text: data.error || 'Gửi đơn thất bại, vui lòng thử lại' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Lỗi kết nối máy chủ: ' + (err.message || String(err)) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn xin nghỉ này không?')) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_leave_request',
          requestId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onRefreshData();
      } else {
        alert(data.error || 'Không thể hủy đơn');
      }
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || String(err)));
    }
  };

  // Sắp xếp đơn mới nhất lên đầu
  const sortedRequests = [...leaveRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
              <span className="text-xl">🌴</span>
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Xin Tạm Nghỉ Chạy Tuần</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700">
                  Bất Khả Kháng
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dành cho VĐV bị chấn thương, ốm đau, công tác đặc biệt • Admin app xác nhận
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Tạo đơn mới & Danh sách đơn */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('NEW_REQUEST')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'NEW_REQUEST'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>✍️ Gửi Đơn Xin Nghỉ</span>
          </button>

          <button
            onClick={() => setActiveTab('LIST')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'LIST'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>📋 Danh Sách Đơn Đã Gửi ({leaveRequests.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {message && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {activeTab === 'NEW_REQUEST' && (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Box Quy chế quyền lợi */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-1.5 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Quyền Lợi Khi Được Duyệt Nghỉ Bất Khả Kháng:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <li>
                    <b>Miễn phạt tuần 100%:</b> Không phạt thiếu cự ly, không phạt thiếu 3 buổi chạy.
                  </li>
                  <li>
                    <b>Không bị nợ gối đầu:</b> Không phát sinh km nợ chuyển sang tuần sau.
                  </li>
                  <li>
                    <b>Bảo vệ điểm đội đua:</b> Điểm bình quân của đội sẽ tự động tính trên số thành viên thi đấu thực tế, không kéo tụt điểm đồng đội!
                  </li>
                </ul>
              </div>

              {/* Chọn VĐV */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span>Vận Động Viên Xin Tạm Nghỉ:</span>
                </label>
                {!isAdmin && currentUser ? (
                  <div className="flex items-center space-x-3 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-sm flex-shrink-0"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{currentUser.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                          ✓ Thành viên thử thách
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {currentUser.gender === 'MALE' ? '🏃‍♂️ Nam' : '🏃‍♀️ Nữ'}
                        {currentUser.stravaId && <span> • Strava ID: {currentUser.stravaId}</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      required
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.gender === 'MALE' ? 'Nam' : 'Nữ'})
                        </option>
                      ))}
                    </select>
                    {selectedUser && (
                      <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                        <img
                          src={selectedUser.avatar}
                          alt={selectedUser.name}
                          className="w-6 h-6 rounded-full object-cover border border-slate-300"
                        />
                        <span>
                          VĐV: <b>{selectedUser.name}</b>
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Chọn Tuần Xin Nghỉ */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Chọn Tuần Xin Nghỉ:</span>
                </label>
                <select
                  value={selectedWeekNumber}
                  onChange={(e) => setSelectedWeekNumber(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                >
                  {weeks.map((w) => (
                    <option key={w.weekNumber} value={w.weekNumber}>
                      {w.name} ({w.startDate} đến {w.endDate})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lý Do Bất Khả Kháng */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                  <span>Lý Do Bất Khả Kháng:</span>
                  <span className="text-[11px] font-normal text-slate-400">Ghi rõ lý do chi tiết</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Bị chấn thương lật cổ chân phải theo chỉ định bác sĩ cần nghỉ 1 tuần; Sốt xuất huyết phải nằm viện điều trị; Công tác đột xuất tại vùng không thể chạy..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              {/* Nút gửi đơn */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/25 transition-all active:scale-95 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Đơn Xin Nghỉ Tuần'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'LIST' && (
            <div className="space-y-3">
              {sortedRequests.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 space-y-2">
                  <div className="text-3xl">🌴</div>
                  <div>Chưa có đơn xin tạm nghỉ nào trong giải đấu.</div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedRequests.map((req) => {
                    const isPending = req.status === 'PENDING';
                    const isApproved = req.status === 'APPROVED';
                    const isRejected = req.status === 'REJECTED';

                    return (
                      <div
                        key={req.id}
                        className="py-3 px-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {req.userName}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                              Tuần {req.weekNumber}
                            </span>

                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Đã Duyệt (Miễn Phạt)
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Đang Chờ Duyệt
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                Từ Chối
                              </span>
                            )}
                          </div>

                          <div className="text-slate-600 dark:text-slate-300 italic">
                            &quot;{req.reason}&quot;
                          </div>

                          <div className="text-[11px] text-slate-400">
                            Gửi ngày: {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                            {req.reviewedBy && (
                              <span> • Người duyệt: {req.reviewedBy}</span>
                            )}
                          </div>
                        </div>

                        {/* Nút hủy nếu đang pending */}
                        {isPending && (
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            className="text-rose-600 hover:text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hủy đơn</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
