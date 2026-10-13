'use client';

import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  DollarSign,
  Award,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Info,
  Clock,
  Compass,
  Zap,
} from 'lucide-react';
import { formatCurrency } from '@/lib/rules-engine';

export default function ChallengeRules() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    time: true,
    target: true,
    rewards: true,
    penalties: true,
    activity: true,
    submission: true,
    other: true,
  });

  const [copied, setCopied] = useState(false);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    setExpandedSections({
      time: true,
      target: true,
      rewards: true,
      penalties: true,
      activity: true,
      submission: true,
      other: true,
    });
  };

  const collapseAll = () => {
    setExpandedSections({
      time: false,
      target: false,
      rewards: false,
      penalties: false,
      activity: false,
      submission: false,
      other: false,
    });
  };

  const handleCopySummary = () => {
    const text = `🏆 THỂ LỆ CHALLENGE "THU ĐÔNG 2026" - CNHP RUNNING CLUB
⏱️ Thời gian: 00h 12/10/2026 - 24h 06/12/2026 (Thứ 2 - Chủ Nhật hàng tuần)
👥 Phí tham dự: 200.000đ/người
🎯 Chỉ tiêu tuần: Tối thiểu 15km/tuần và 3 buổi chạy/tuần
🛡️ Trần tích lũy Team: Tối đa 40km/tuần/người (Cá nhân tính bình thường)
🏃 Bài chạy hợp lệ: ≥ 1.0 km, Pace Road 3:30 - 10:30 (Trail không giới hạn pace)
📱 Đồng bộ: Nhóm Strava "CNHP Challenge Running Club", tự trừ km lag
🎁 Giải thưởng tuần: Nhất 150k, Nhì 100k, Ba 50k (Tie-breaker: Pace CHẬM HƠN thắng)
🏆 Thưởng chung cuộc Team: Nhất 300k, Nhì 200k, Ba 100k
🏅 Thưởng chung cuộc Cá nhân: Nhất 200k, Nhì 150k, Ba 100k
⚠️ Mức phạt:
  • Thiếu 1km: 20.000đ (0.01km tính 1km, chạy bù tuần sau)
  • Tuần cuối thiếu 1km: 40.000đ (phạt gấp đôi)
  • Thiếu 1 buổi: 50.000đ
💳 Kênh nộp phạt: Thủ quỹ TRINH LONG - Techcombank: 19030671988989 (trước 12h Thứ 3)
📌 Rút giải: Lệ phí 500.000đ (ngoại trừ bất khả kháng)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Hero Banner Thể Lệ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900 border border-orange-500/30 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-wider border border-orange-500/30">
              <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
              CNHP RUNNING CLUB
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white">
              Thể Lệ Challenge “Thu Đông 2026”
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Quy chế thi đấu, tiêu chuẩn bài chạy, hệ thống tính thưởng/phạt và cơ chế chuyển nợ km áp dụng từ ngày <strong>12/10/2026</strong> đến <strong>06/12/2026</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-orange-400" />}
              <span>{copied ? 'Đã Sao Chép Thể Lệ!' : 'Sao Chép Tóm Tắt'}</span>
            </button>
          </div>
        </div>

        {/* 4 Cards Tóm Tắt Nhanh */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-[11px] text-slate-400 uppercase font-bold block mb-0.5">Chỉ Tiêu Tuần</span>
            <div className="text-lg font-black text-orange-400">15 km • 3 buổi</div>
            <span className="text-[10px] text-slate-300">Tối thiểu mỗi tuần</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-[11px] text-slate-400 uppercase font-bold block mb-0.5">Trần Đội (Cap)</span>
            <div className="text-lg font-black text-amber-400">Max 40 km/tuần</div>
            <span className="text-[10px] text-slate-300">Công bằng cho tập thể</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-[11px] text-slate-400 uppercase font-bold block mb-0.5">Mức Phạt Thể Lệ</span>
            <div className="text-lg font-black text-rose-400">20k/km • 50k/buổi</div>
            <span className="text-[10px] text-slate-300">Tuần cuối phạt 40k/km</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-[11px] text-slate-400 uppercase font-bold block mb-0.5">Phí Tham Dự</span>
            <div className="text-lg font-black text-emerald-400">200.000đ / người</div>
            <span className="text-[10px] text-slate-300">Góp toàn bộ vào Quỹ Giải</span>
          </div>
        </div>
      </div>

      {/* Điều khiển đóng/mở */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span className="font-semibold flex items-center gap-1.5">
          <Info className="w-4 h-4 text-orange-500" />
          Nhấp vào từng mục để xem nội dung chi tiết
        </span>
        <div className="flex items-center space-x-3">
          <button onClick={expandAll} className="hover:text-orange-500 font-bold transition-colors">
            Mở tất cả
          </button>
          <span>•</span>
          <button onClick={collapseAll} className="hover:text-orange-500 font-bold transition-colors">
            Thu gọn
          </button>
        </div>
      </div>

      {/* 2. Danh Sách Các Mục Thể Lệ Chi Tiết */}
      <div className="space-y-4">
        {/* MỤC I & II: Thời Gian & Đối Tượng */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          <button
            onClick={() => toggleSection('time')}
            className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  I & II. Thời Gian, Đối Tượng & Phí Tham Dự
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Thời gian thi đấu 8 tuần và lệ phí tham gia giải
                </p>
              </div>
            </div>
            {expandedSections.time ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {expandedSections.time && (
            <div className="px-5 pb-6 sm:px-6 pt-1 border-t border-slate-100 dark:border-slate-800 text-sm space-y-3.5 text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Thời gian diễn ra Challenge
                  </div>
                  <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-600 dark:text-slate-400">
                    <li><strong>Bắt đầu:</strong> 00h00 ngày <strong>12/10/2026</strong></li>
                    <li><strong>Kết thúc:</strong> 24h00 ngày <strong>06/12/2026</strong></li>
                    <li><strong>Quy ước tuần:</strong> Bắt đầu từ Thứ 2 và kết thúc vào Chủ Nhật.</li>
                    <li><strong>Quy ước ngày:</strong> Bắt đầu vào 00h và kết thúc vào 24h cùng ngày.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    Đối tượng & Phí tham dự
                  </div>
                  <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-600 dark:text-slate-400">
                    <li><strong>Đối tượng:</strong> Những người yêu thích chạy bộ đủ điều kiện sức khỏe tham gia challenge.</li>
                    <li><strong>Phí tham dự:</strong> <strong className="text-emerald-600 dark:text-emerald-400">200.000 đồng/người</strong>.</li>
                    <li>Toàn bộ phí tham dự được dùng để gây quỹ giải thưởng tuần, giải chung cuộc và liên hoan Gala tổng kết.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MỤC III: Nội Dung Thi Đấu & Cơ Chế Cap 40km */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          <button
            onClick={() => toggleSection('target')}
            className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  III. Nội Dung Thi Đấu, Chỉ Tiêu & Cơ Chế Áp Trần (Cap 40km)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chỉ tiêu 15km/3 buổi và quy định chống cày cuốc dồn điểm
                </p>
              </div>
            </div>
            {expandedSections.target ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {expandedSections.target && (
            <div className="px-5 pb-6 sm:px-6 pt-1 border-t border-slate-100 dark:border-slate-800 text-sm space-y-4 text-slate-700 dark:text-slate-300">
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/60">
                  <div className="font-bold text-orange-900 dark:text-orange-200 text-sm mb-1.5 flex items-center gap-2">
                    🎯 Chỉ tiêu bắt buộc hàng tuần:
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                    <li>Mỗi tuần mỗi thành viên phải chạy <strong>tối thiểu 3 ngày chạy</strong> trong tuần.</li>
                    <li>Tổng khoảng cách đạt ít nhất là: <strong>tối thiểu 15 km/tuần</strong>.</li>
                    <li>Theo số lượng đăng ký mà Ban tổ chức sẽ chia số thành viên thành <strong>2 – 3 team</strong> tranh tài.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
                  <div className="font-bold text-amber-900 dark:text-amber-200 text-sm mb-1.5 flex items-center gap-2">
                    🛡️ Cơ chế Áp Trần (Cap 40km/tuần) cho bảng xếp hạng Tập Thể:
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    Không hạn chế chạy tối đa, tuy nhiên trong <strong>hạng mục xếp hạng tập thể</strong>, để đảm bảo không có thành viên nào “cày cuốc” hết phần các thành viên khác gây chênh lệch trong challenge thì <strong>chỉ ghi nhận tối đa 40km/tuần</strong> đối với các thành viên có số km chạy lớn hơn hoặc bằng 40km/tuần.
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-2">
                    * Lưu ý: Bảng xếp hạng cá nhân vẫn ghi nhận toàn bộ số km thực tế bình thường.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="font-bold text-slate-900 dark:text-white text-sm mb-1.5">
                    👥 Tổ chức và Trưởng nhóm:
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Các team tự bầu trưởng nhóm (Captain) của team để làm kênh liên lạc chính với Ban tổ chức (BTC). Trong trường hợp nhóm có khoản nộp phạt thì <strong>trưởng nhóm là người đại diện cho cả nhóm nộp khoản phạt đó</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MỤC IV: Tiêu Chuẩn Bài Chạy & Nộp Bài Strava */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          <button
            onClick={() => toggleSection('activity')}
            className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  IV. Tiêu Chuẩn Bài Chạy Hợp Lệ & Quy Định Nộp Bài
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cự ly tối thiểu, khoảng pace, chạy Trail và trừ lag GPS
                </p>
              </div>
            </div>
            {expandedSections.activity ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {expandedSections.activity && (
            <div className="px-5 pb-6 sm:px-6 pt-1 border-t border-slate-100 dark:border-slate-800 text-sm space-y-3.5 text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                    📏 Cự ly tối thiểu mỗi bài chạy
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Mỗi bài chạy phải đạt số km <strong>tối thiểu là 1.0 km</strong>. Bài chạy dưới 1.0 km sẽ không được tính.
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                    ⏱️ Khoảng Pace hợp lệ (Road)
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Pace trung bình nằm trong khoảng <strong>3:30 - 10:30 phút/km</strong>. Nhanh hơn 3:30 hoặc chậm hơn 10:30 sẽ bị từ chối.
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 text-xs mb-1">
                    ⛰️ Workout Chạy Trail (Đồi Núi)
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Đối với workout chạy trail (tính theo địa hình đồi núi có gain) thì <strong>không tính pace trung bình</strong> (mọi pace đều hợp lệ).
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-rose-600 dark:text-rose-400 text-xs mb-1">
                    🚫 Thiết bị hỗ trợ di chuyển
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Tuyệt đối không sử dụng thiết bị hỗ trợ di chuyển (gắn động cơ, ván trượt, giày trượt, xe đạp...).
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 space-y-2">
                <div className="font-bold text-blue-900 dark:text-blue-200 text-xs sm:text-sm">
                  📱 Quy định nộp bài & Xử lý lag GPS:
                </div>
                <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-700 dark:text-slate-300">
                  <li>Tất cả thành viên tham gia đều phải có phần mềm/đồng hồ theo dõi chạy có GPS.</li>
                  <li><strong>Chỉ chấp nhận bài chạy từ Strava</strong>, trong câu lạc bộ: <strong>&ldquo;CNHP Challenge Running Club&rdquo;</strong>.</li>
                  <li>Bài chạy phải thể hiện rõ: số km, bản đồ đường chạy (track GPS), ngày chạy, thời gian chạy.</li>
                  <li><strong>Trường hợp bị lag km:</strong> Phải nêu rõ số km bị lag và tự giác trừ đi các km đó. Nếu không tự giác báo cáo mà bị phát hiện thì <strong>bài chạy đó không được tính toàn bộ</strong>.</li>
                  <li>Thành viên tự đảm bảo và chịu trách nhiệm cá nhân về sức khỏe, dừng chạy và báo ngay cho BTC khi có dấu hiệu bất thường.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* MỤC V: Quy Chế Thưởng */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          <button
            onClick={() => toggleSection('rewards')}
            className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  V. Quy Chế Khen Thưởng & Cơ Chế Tie-Breaker
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Thưởng tuần, thưởng chung cuộc tập thể và cá nhân nam/nữ
                </p>
              </div>
            </div>
            {expandedSections.rewards ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {expandedSections.rewards && (
            <div className="px-5 pb-6 sm:px-6 pt-1 border-t border-slate-100 dark:border-slate-800 text-sm space-y-4 text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Thưởng mỗi tuần */}
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-2">
                  <div className="font-bold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
                    🏆 Thưởng Đồng Đội Mỗi Tuần:
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center p-2 rounded-xl bg-white dark:bg-slate-800">
                      <span>🥇 Đội có km TB/thành viên cao nhất:</span>
                      <strong className="text-amber-600 dark:text-amber-400 text-sm">150.000 vnđ</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-xl bg-white dark:bg-slate-800">
                      <span>🥈 Đội có km TB/thành viên cao nhì:</span>
                      <strong className="text-slate-600 dark:text-slate-300 text-sm">100.000 vnđ</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-xl bg-white dark:bg-slate-800">
                      <span>🥉 Đội có km TB/thành viên cao thứ 3:</span>
                      <strong className="text-amber-700 dark:text-amber-500 text-sm">50.000 vnđ</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    * Tính trên bình quân km/đầu người của team để đảm bảo công bằng khi quân số các đội không bằng nhau.
                  </p>
                </div>

                {/* Thưởng Chung cuộc */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-2">
                    🌟 Thưởng Chung Cuộc Toàn Challenge:
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Tập Thể (Team):</span>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800">
                          <span className="text-[10px] text-slate-400 block">Nhất</span>
                          <strong className="text-emerald-600 dark:text-emerald-400">300.000đ</strong>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800">
                          <span className="text-[10px] text-slate-400 block">Nhì</span>
                          <strong className="text-slate-700 dark:text-slate-300">200.000đ</strong>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800">
                          <span className="text-[10px] text-slate-400 block">Ba</span>
                          <strong className="text-amber-700 dark:text-amber-400">100.000đ</strong>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Cá Nhân Nam / Nữ chạy nhiều nhất:</span>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800">
                          <span className="text-[10px] text-slate-400 block">Nhất</span>
                          <strong className="text-emerald-600 dark:text-emerald-400">200.000đ</strong>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800">
                          <span className="text-[10px] text-slate-400 block">Nhì</span>
                          <strong className="text-slate-700 dark:text-slate-300">150.000đ</strong>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800">
                          <span className="text-[10px] text-slate-400 block">Ba</span>
                          <strong className="text-amber-700 dark:text-amber-400">100.000đ</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Luật Tie-breaker đặc biệt */}
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60">
                <div className="font-bold text-purple-900 dark:text-purple-200 text-xs sm:text-sm mb-1 flex items-center gap-2">
                  🐢 Luật Tie-Breaker (Xử lý khi bằng quãng đường):
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Trong trường hợp các team hoặc cá nhân có <strong>quãng đường chạy bằng nhau</strong>, pace trung bình sẽ là yếu tố tiếp theo để tính giải: <strong>Ai có Pace trung bình CHẬM HƠN sẽ thắng!</strong> Nếu pace trung bình vẫn bằng nhau, BTC sẽ thêm yếu tố quyết định khác sau.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* MỤC VI: Quy Chế Phạt & Chạy Bù */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          <button
            onClick={() => toggleSection('penalties')}
            className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  VI. Quy Chế Phạt, Làm Tròn & Cơ Chế Chạy Bù (Deficit Rollover)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Phạt 20k/km, 50k/buổi, làm tròn 0.01km và quy định tuần cuối phạt gấp đôi 40k/km
                </p>
              </div>
            </div>
            {expandedSections.penalties ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {expandedSections.penalties && (
            <div className="px-5 pb-6 sm:px-6 pt-1 border-t border-slate-100 dark:border-slate-800 text-sm space-y-4 text-slate-700 dark:text-slate-300">
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 space-y-2">
                  <div className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                    ⚠️ Mức phạt và quy tắc chuyển nợ:
                  </div>
                  <ul className="text-xs sm:text-sm space-y-2 list-disc list-inside text-slate-700 dark:text-slate-300">
                    <li>
                      <strong>Phạt thiếu km:</strong> Đối với mỗi 1km thiếu của cá nhân phạt <strong className="text-rose-600 dark:text-rose-400">20.000 vnđ</strong>.
                    </li>
                    <li>
                      <strong>Cơ chế chạy bù:</strong> Số km thiếu của tuần này <strong>phải được bù vào tuần sau</strong>. Cá nhân và team thiếu mà không chạy bù sẽ được tính là km thiếu của tuần sau đó.
                    </li>
                    <li>
                      <strong>Quy tắc làm tròn:</strong> Số km thiếu sẽ được làm tròn lên: <strong>0,01 km thiếu được tính là thiếu 1 km</strong> (Ví dụ: thiếu 0.05 km tính là thiếu 1 km, phạt 20.000đ).
                    </li>
                    <li>
                      <strong>Tuần cuối (Tuần 8):</strong> Do không phải chạy bù nữa nên số tiền phạt sẽ <strong>tính gấp đôi: 40.000 vnđ / km thiếu</strong>.
                    </li>
                    <li>
                      <strong>Phạt thiếu buổi:</strong> Thành viên nào không đủ 3 buổi chạy trong tuần, mỗi buổi thiếu tính phạt <strong className="text-rose-600 dark:text-rose-400">50.000 vnđ</strong>.
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
                      🏦 Thông tin nộp tiền phạt cho Thủ Quỹ:
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Trưởng nhóm hoặc thành viên chuyển khoản về Thủ quỹ trước <strong>12h Thứ 3 hàng tuần</strong>.
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-xs font-mono font-bold text-orange-600 dark:text-orange-400 shrink-0">
                    Techcombank: 19030671988989 (TRINH LONG)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MỤC VII: Quy Định Khác & Lệ Phí Rút Giải */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          <button
            onClick={() => toggleSection('other')}
            className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-black">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  VII. Quy Định Rút Khỏi Challenge & Quyền Quyết Định
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lệ phí rút giải 500k và giải quyết tranh chấp khiếu nại
                </p>
              </div>
            </div>
            {expandedSections.other ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {expandedSections.other && (
            <div className="px-5 pb-6 sm:px-6 pt-1 border-t border-slate-100 dark:border-slate-800 text-sm space-y-3.5 text-slate-700 dark:text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <ul className="text-xs sm:text-sm space-y-2 list-disc list-inside text-slate-700 dark:text-slate-300">
                  <li>
                    <strong>Lệ phí rút giải:</strong> Trường hợp thành viên muốn rút khỏi challenge vì bất cứ lý do gì (trừ trường hợp bất khả kháng như chấn thương, ốm nằm viện) thì phải nộp cho BTC <strong className="text-rose-600 dark:text-rose-400">500.000 vnđ</strong> lệ phí rút khỏi challenge.
                  </li>
                  <li>
                    Trong quá trình thực hiện nếu có điều chưa hợp lý, Ban tổ chức sẽ điều chỉnh thay đổi quy chế cho phù hợp.
                  </li>
                  <li>
                    <strong>Quyền quyết định cuối cùng:</strong> Trong mọi trường hợp xung đột, khiếu nại BTC sẽ căn cứ vào tình hình thực tế để điều chỉnh, giải quyết phù hợp và <strong>quyết định của Ban tổ chức là quyết định cuối cùng</strong>.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
