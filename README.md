# 🏃‍♂️ CNHP Challenge Thu Đông 2026 - Nền Tảng Quản Lý Giải Chạy & Đi Bộ

Hệ thống webapp theo dõi, xếp hạng, tính thưởng/phạt và phân tích hoạt động giải chạy bộ / đi bộ nội bộ **CNHP Challenge Thu Đông 2026**.

---

## 📌 Tính Năng Nổi Bật

- **Bảng Xếp Hạng Đội Nhóm & Cá Nhân**:
  - Tự động xếp hạng theo tuần và toàn giải.
  - Áp dụng chuẩn thể lệ: Áp trần tối đa 40 km/tuần đối với bảng tập thể để đảm bảo công bằng.
  - Quy tắc phân định hòa (Tie-breaker): Khi quãng đường bằng nhau, ưu tiên xếp hạng cho đội/cá nhân có pace trung bình chậm hơn (tinh thần kiên trì).
- **Rules Engine Kiểm Duyệt Hoạt Động**:
  - Hợp lệ theo cự ly tối thiểu (>= 1.0 km).
  - Giới hạn pace theo môn thể thao: Road run (3:30 - 10:00 min/km), Trail run & Hiking không giới hạn pace.
  - Tự động tính toán số buổi chạy, số km thiếu, phạt thiếu buổi (20.000đ/buổi), phạt thiếu km (20.000đ/km, tuần cuối nhân đôi 40.000đ/km), chuyển nợ km sang tuần kế tiếp.
- **Tích Hợp Strava**:
  - OAuth kết nối tài khoản Strava cá nhân.
  - Đồng bộ hoạt động chạy/đi bộ tự động qua API.
- **Thẻ Chia Sẻ Thành Tích Đẹp Mắt**:
  - Chụp ảnh chia sẻ thành tích cá nhân / đội nhóm (sử dụng `html-to-image`).
- **Giao Diện Hiện Đại & Tối Ưu Mobile**:
  - Xây dựng trên Next.js 15 App Router, Tailwind CSS, Dark/Light mode thân thiện.

---

## 🛠️ Công Nghệ Sử Dụng

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
- **Ngôn ngữ**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Hiệu ứng & Tiện ích**: `canvas-confetti`, `html-to-image`, `@mapbox/polyline`
- **Runner**: `tsx` (chạy script TypeScript trực tiếp)

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Yêu Cầu Môi Trường
- Node.js >= 18.x (khuyên dùng Node 20+)
- npm hoặc yarn / pnpm

### 2. Cài Đặt Dependencies
```bash
npm install
```

### 3. Cấu Hình Biến Môi Trường (Tùy chọn)
Nếu sử dụng tính năng đồng bộ tự động với Strava, sao chép file `.env.example` thành `.env.local`:
```bash
cp .env.example .env.local
```
Điền các thông số Strava Client ID và Secret lấy từ [Strava API Settings](https://www.strava.com/settings/api).

### 4. Khởi Chạy Môi Trường Phát Triển
```bash
npm run dev
```
Truy cập ứng dụng tại: [http://localhost:3026](http://localhost:3026)

### 5. Build Kiểm Tra Production
```bash
npm run build
npm run start
```

---

## 🧪 Kiểm Thử & Dữ Liệu Mẫu

### Chạy Bộ Kiểm Thử Rules Engine (26/26 Unit Tests Passed)
Quy tắc tính toán thưởng/phạt và phân định thể lệ được viết tự động hóa đầy đủ:
```bash
npm run test:rules
```

### Tạo Dữ Liệu Mẫu (Seed Data)
```bash
npm run seed
```

---

## 📁 Cấu Trúc Thư Mục

```
├── data/
│   └── challenge_data.json      # File lưu trữ dữ liệu hoạt động, đội thi, thành viên
├── scripts/
│   ├── seed.ts                  # Script khởi tạo dữ liệu mẫu
│   └── test-rules.ts            # Unit test 26 ca kiểm thử rules engine
├── src/
│   ├── app/
│   │   ├── api/                 # API Routes (activity, admin, data, strava oauth & sync)
│   │   ├── layout.tsx           # Root layout Next.js
│   │   └── page.tsx             # Trang chủ Dashboard Challenge
│   ├── components/              # Các UI Components (Header, Leaderboard, ActivityModal, v.v.)
│   ├── lib/                     # Rules Engine, Helper xử lý dữ liệu, Strava client
│   └── types/                   # Định nghĩa TypeScript Types
├── Thể lệ Challenge CNHP Thu Đông 2026.docx # Văn bản thể lệ chính thức
├── package.json
└── tailwind.config.ts
```

---

## 👥 Bàn Giao & Liên Hệ

Dự án được chuẩn bị sẵn sàng để bàn giao cho **Tùng** tiếp tục phát triển, vận hành và bổ sung các tính năng nâng cao cho giải chạy CNHP Thu Đông 2026.
