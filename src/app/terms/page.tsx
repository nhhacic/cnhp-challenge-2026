import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | CNHP Running Club Challenge',
  description: 'Terms of Service for CNHP Running Club Webapp and Challenge 2026',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation back */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-orange-600 dark:text-orange-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại ứng dụng (Back to Home)</span>
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>Điều Khoản Sử Dụng • Terms of Service</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            CNHP Running Club Challenge 2026
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Last Updated / Cập nhật lần cuối: 29/10/2026 • Effective Date: 12/10/2026
          </p>
        </div>

        {/* English Overview for Reviewers */}
        <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-orange-500" />
            <span>Overview &amp; Purpose</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Welcome to the <strong>CNHP Running Club Challenge 2026</strong> web application. This application is an internal, non-commercial sports tracking platform created for runners belonging to the CNHP Running Club. By authenticating via Strava and participating in the challenge, you agree to these Terms of Service.
          </p>
        </div>

        {/* Detailed Terms */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              1. Thỏa thuận tham gia (Acceptance of Terms)
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
              Ứng dụng được vận hành phi thương mại nhằm khích lệ tinh thần rèn luyện thể thao của các cán bộ nhân viên và thành viên CLB Chạy Bộ CNHP. Khi kết nối tài khoản Strava, bạn đồng ý cho phép ứng dụng đọc dữ liệu bài chạy phục vụ việc tổng hợp kết quả giải đua.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              2. Quy định thể lệ &amp; Tinh thần Fair Play (Challenge Rules &amp; Fair Play)
            </h2>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>Mỗi bài chạy hợp lệ phải đạt tối thiểu 1.0 km.</li>
              <li>Pace hợp lệ với Road Run nằm trong khoảng 3:30/km đến 10:00/km (chạy Trail/Hiking leo núi không áp giới hạn pace).</li>
              <li>Nghiêm cấm mọi hành vi gian lận (sử dụng phương tiện cơ giới, chia sẻ thiết bị gian lận GPS). Ban Quản Trị có quyền loại bài chạy không hợp lệ hoặc trừ quãng đường lag theo quy định.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              3. Quyền sở hữu trí tuệ &amp; Strava (Intellectual Property &amp; Strava Compliance)
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
              Tên và logo Strava là thương hiệu đã đăng ký của Strava, Inc. Ứng dụng CNHP Challenge tuân thủ đầy đủ Hướng dẫn Thương hiệu (Brand Guidelines) và Thỏa thuận Nhà phát triển (Developer Agreement) của Strava. Ứng dụng không mô phỏng các tính năng độc quyền có trả phí của Strava.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>4. Miễn trừ trách nhiệm sức khỏe (Health &amp; Safety Disclaimer)</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
              Chạy bộ là hoạt động thể chất đòi hỏi thể lực. Vận động viên tự chịu trách nhiệm về sức khỏe và an toàn của bản thân khi tham gia chạy ngoài trời hoặc trên máy tập. Ban Quản Trị CLB không chịu trách nhiệm đối với các chấn thương hoặc rủi ro sức khỏe phát sinh trong quá trình luyện tập.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              5. Hủy kết nối &amp; Chấm dứt (Termination &amp; Revocation)
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
              Bạn có thể ngưng tham gia và hủy quyền truy cập của ứng dụng bất cứ lúc nào thông qua trang quản lý ứng dụng của Strava (Strava Settings &gt; My Applications &gt; Revoke Access).
            </p>
          </section>
        </div>

        {/* Footer brand notice */}
        <div className="text-center text-xs text-slate-400">
          <p>© 2026 CNHP Running Club. Powered by Strava API.</p>
        </div>
      </div>
    </div>
  );
}
