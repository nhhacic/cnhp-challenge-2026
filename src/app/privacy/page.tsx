import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Trash2, Eye, Database, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | CNHP Running Club Challenge',
  description: 'Privacy Policy and Strava API Data Protection Policy for CNHP Running Club Webapp',
};

export default function PrivacyPolicyPage() {
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
            <Shield className="w-3.5 h-3.5" />
            <span>Chính Sách Bảo Mật • Privacy Policy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            CNHP Running Club Challenge 2026
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Last Updated / Cập nhật lần cuối: 29/10/2026 • Effective Date: 12/10/2026
          </p>
        </div>

        {/* English Summary for Strava API Reviewers */}
        <div className="bg-orange-50/70 dark:bg-orange-950/30 p-6 rounded-3xl border border-orange-200 dark:border-orange-800/60 space-y-4">
          <div className="flex items-center space-x-2 text-orange-800 dark:text-orange-300 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-orange-600" />
            <span>Summary for Strava Developer Review Team</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            The <strong>CNHP Running Club Challenge 2026</strong> web application is an internal, non-commercial community sports platform created exclusively for members of the CNHP Running Club (Hai Phong, Vietnam). The application uses the Strava API solely to sync members&apos; running activities to track participation, calculate distances, and display weekly club challenge standings.
          </p>
          <ul className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1.5 list-disc pl-5">
            <li><strong>No Data Sale:</strong> We do NOT sell, license, or monetize any Strava user data.</li>
            <li><strong>No Third-Party Sharing:</strong> We do NOT share Strava data with advertisers, data brokers, or third parties.</li>
            <li><strong>No AI/ML Training:</strong> We strictly comply with Strava&apos;s Developer Agreement. We do NOT use any Strava data to train artificial intelligence or machine learning models.</li>
            <li><strong>Data Deletion & Revocation:</strong> Athletes can revoke access anytime in Strava Settings (&gt; My Apps) or contact us for instant data purge.</li>
          </ul>
        </div>

        {/* Detailed Content in Vietnamese & English */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Eye className="w-4 h-4 text-orange-500" />
              <span>1. Dữ liệu thu thập từ Strava API (Data Collected via Strava API)</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
              Khi bạn kết nối tài khoản Strava với ứng dụng thông qua giao thức OAuth 2.0 an toàn của Strava, chúng tôi chỉ yêu cầu và thu thập các dữ liệu cần thiết phục vụ cho việc tính điểm thử thách:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li><strong>Thông tin hồ sơ vận động viên (Athlete Profile):</strong> Tên hiển thị, Strava Athlete ID, ảnh đại diện (avatar) và giới tính (để phân loại bảng xếp hạng Nam/Nữ).</li>
              <li><strong>Dữ liệu hoạt động chạy bộ (Running Activities):</strong> Tên bài chạy, quãng đường (distance), thời gian di chuyển (moving time), độ cao (elevation gain), ngày giờ chạy (start date) và vận tốc trung bình (average speed / pace).</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-orange-500" />
              <span>2. Mục đích sử dụng dữ liệu (How We Use Your Data)</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
              Dữ liệu từ Strava chỉ được sử dụng cho các mục đích nội bộ phi thương mại sau đây:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>Tự động ghi nhận và xác thực tính hợp lệ của bài chạy theo Thể lệ Thử thách CNHP Thu Đông 2026 (quãng đường tối thiểu 1.0km, giới hạn pace hợp lệ 3:30 - 10:00/km đối với Road run, không giới hạn với Trail/Hike).</li>
              <li>Tổng hợp số km hợp lệ, số buổi chạy trong tuần, áp dụng trần 40km đồng đội và tính toán bảng xếp hạng cá nhân và tập thể.</li>
              <li>Hiển thị tiến độ hoàn thành chỉ tiêu tuần cho từng vận động viên và đội đua trong CLB.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-orange-500" />
              <span>3. Cam kết bảo mật &amp; Không thương mại hóa (Privacy &amp; Non-Commercial Commitment)</span>
            </h2>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-1.5">
              <li><strong>KHÔNG bán dữ liệu:</strong> Chúng tôi tuyệt đối không bán, cho thuê, chuyển nhượng hoặc thương mại hóa bất kỳ dữ liệu cá nhân hay dữ liệu Strava nào dưới mọi hình thức.</li>
              <li><strong>KHÔNG chia sẻ bên thứ ba:</strong> Chúng tôi không chia sẻ dữ liệu với các mạng quảng cáo, đơn vị môi giới dữ liệu hoặc bất kỳ bên thứ ba nào.</li>
              <li><strong>KHÔNG huấn luyện mô hình AI:</strong> Tuân thủ nghiêm ngặt Điều khoản Nhà phát triển Strava 2024 (Strava Developer Agreement), chúng tôi cam kết KHÔNG sử dụng bất kỳ dữ liệu bài tập hoặc thông tin người dùng nào từ Strava để huấn luyện các mô hình trí tuệ nhân tạo (AI) hoặc học máy (Machine Learning).</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Trash2 className="w-4 h-4 text-orange-500" />
              <span>4. Quyền thu hồi &amp; Xóa dữ liệu (Data Deletion &amp; Access Revocation)</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
              Người dùng luôn có toàn quyền kiểm soát dữ liệu của mình:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li><strong>Hủy ủy quyền trên Strava:</strong> Bạn có thể thu hồi quyền truy cập của ứng dụng bất cứ lúc nào bằng cách truy cập vào trang <em>Strava Settings &gt; My Applications</em> và nhấn <strong>Revoke Access</strong>. Sau khi thu hồi, ứng dụng sẽ không thể truy cập thêm bất kỳ dữ liệu nào của bạn.</li>
              <li><strong>Yêu cầu xóa toàn bộ dữ liệu:</strong> Bạn có thể yêu cầu xóa hoàn toàn dữ liệu bài chạy, tài khoản và token khỏi hệ thống webapp bằng cách liên hệ với Ban Quản Trị CLB hoặc gửi email yêu cầu. Toàn bộ dữ liệu sẽ được xóa sạch trong vòng 24 giờ.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              5. Liên hệ Ban Quản Trị (Contact Information)
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
              Mọi thắc mắc về chính sách bảo mật hoặc yêu cầu hỗ trợ dữ liệu, xin vui lòng liên hệ:
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-xs space-y-1 text-slate-700 dark:text-slate-300">
              <p>• <strong>Đơn vị chủ quản:</strong> Ban Tổ Chức CLB Chạy Bộ CNHP (CNHP Running Club)</p>
              <p>• <strong>Địa điểm:</strong> Hải Phòng, Việt Nam</p>
              <p>• <strong>Website:</strong> <a href="https://cnhp-challenge-2026.vercel.app" className="text-orange-600 hover:underline">https://cnhp-challenge-2026.vercel.app</a></p>
              <p>• <strong>Email hỗ trợ:</strong> cnhp.running@gmail.com</p>
            </div>
          </section>
        </div>

        {/* Footer brand notice */}
        <div className="text-center text-xs text-slate-400">
          <p>© 2026 CNHP Running Club. Compatible with Strava • Powered by Strava API.</p>
        </div>
      </div>
    </div>
  );
}
