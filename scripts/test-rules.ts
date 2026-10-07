import { Activity, Team, User, Week } from '../src/types';
import {
  validateActivity,
  calculateUserWeeklyStat,
  calculateTeamWeeklyStats,
  rankTeamsForWeek,
  rankOverallUsers,
  formatPace,
} from '../src/lib/rules-engine';

console.log('========================================================');
console.log('🧪 BẮT ĐẦU KIỂM THỬ AUTOMATED UNIT TESTS: CNHP RULES ENGINE');
console.log('========================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (detail) console.error(`   👉 Chi tiết lỗi: ${detail}`);
    failCount++;
  }
}

// ----------------------------------------------------
// TEST NHÓM 1: KIỂM TRA TÍNH HỢP LỆ BÀI CHẠY (ACTIVITIES)
// ----------------------------------------------------
console.log('--- NHÓM 1: Kiểm duyệt bài chạy đơn lẻ ---');

const baseActivity: Activity = {
  id: 'act-1',
  userId: 'u1',
  title: 'Morning Run',
  type: 'Run',
  distanceKm: 5.0,
  movingTimeSec: 1650, // 5:30/km -> 330s
  elapsedTimeSec: 1700,
  averagePaceSeconds: 330,
  elevationGain: 20,
  startDate: '2026-10-12T06:00:00Z',
  lagKmDeducted: 0,
  effectiveKm: 5.0,
  isTrailOrHike: false,
  isValid: true,
  invalidReasons: [],
};

// 1.1 Bài chạy bình thường 5km pace 5:30 -> Hợp lệ
const res1 = validateActivity(baseActivity);
assert(res1.isValid, 'Bài chạy 5km pace 5:30/km là hợp lệ');

// 1.2 Bài chạy < 1.0 km -> Không hợp lệ
const shortAct: Activity = { ...baseActivity, distanceKm: 0.95 };
const res2 = validateActivity(shortAct);
assert(!res2.isValid && res2.invalidReasons.some((r) => r.includes('dưới 1.0 km')), 'Bài chạy 0.95 km bị loại do dưới 1.0 km');

// 1.3 Bài chạy Road với pace 3:15/km (< 3:30) -> Quá nhanh
const fastAct: Activity = { ...baseActivity, averagePaceSeconds: 195 }; // 3:15 = 195s
const res3 = validateActivity(fastAct);
assert(!res3.isValid && res3.invalidReasons.some((r) => r.includes('quá nhanh')), 'Bài chạy Road pace 3:15/km bị loại do quá nhanh');

// 1.4 Bài chạy Road với pace 11:00/km (> 10:30) -> Quá chậm
const slowAct: Activity = { ...baseActivity, averagePaceSeconds: 660 }; // 11:00 = 660s
const res4 = validateActivity(slowAct);
assert(!res4.isValid && res4.invalidReasons.some((r) => r.includes('quá chậm')), 'Bài chạy Road pace 11:00/km bị loại do quá chậm');

// 1.5 Trail run, Trekking, Hiking -> Bất kỳ pace nào cũng hợp lệ (Đã confirm BTC)
const trailSlowAct: Activity = {
  ...baseActivity,
  type: 'TrailRun',
  isTrailOrHike: true,
  averagePaceSeconds: 960, // 16:00/km (đi bộ dốc leo núi)
};
const res5 = validateActivity(trailSlowAct);
assert(res5.isValid, 'Trail run với pace 16:00/km vẫn hợp lệ 100% (không giới hạn pace)');

const hikeAct: Activity = {
  ...baseActivity,
  type: 'Hike',
  isTrailOrHike: true,
  averagePaceSeconds: 1200, // 20:00/km
};
const res6 = validateActivity(hikeAct);
assert(res6.isValid, 'Trekking / Hiking leo núi pace 20:00/km vẫn hợp lệ');

// 1.6 Trừ km lag
const lagAct: Activity = {
  ...baseActivity,
  distanceKm: 1.5,
  lagKmDeducted: 0.7, // Còn 0.8km -> dưới 1km
};
const res7 = validateActivity(lagAct);
assert(!res7.isValid, 'Bài chạy 1.5km bị lag trừ 0.7km còn 0.8km sẽ bị loại');

// ----------------------------------------------------
// TEST NHÓM 2: TÍNH TOÁN TUẦN VẬN ĐỘNG VIÊN & PHẠT / CHẠY BÙ
// ----------------------------------------------------
console.log('\n--- NHÓM 2: Tính toán tuần cá nhân & Thưởng/Phạt/Chạy bù ---');

const testWeek: Week = {
  weekNumber: 1,
  name: 'Tuần 1',
  startDate: '2026-10-12',
  endDate: '2026-10-18',
  isFinalWeek: false,
  isLocked: false,
};

// 2.1 Thành viên hoàn thành xuất sắc: 3 buổi, tổng 21km
const userActivities1: Activity[] = [
  { ...baseActivity, id: 'a1', startDate: '2026-10-12T06:00:00Z', distanceKm: 7.0 },
  { ...baseActivity, id: 'a2', startDate: '2026-10-14T06:00:00Z', distanceKm: 7.0 },
  { ...baseActivity, id: 'a3', startDate: '2026-10-16T06:00:00Z', distanceKm: 7.0 },
];
const stat1 = calculateUserWeeklyStat('u1', testWeek, userActivities1, 0);
assert(stat1.isCompleted && stat1.totalPenaltyAmount === 0, 'Chạy 3 buổi 21km hoàn thành chỉ tiêu, phạt 0đ');
assert(stat1.totalDaysRun === 3, 'Ghi nhận chính xác 3 ngày chạy');

// 2.2 Thành viên cày cuốc 55km -> actualKm = 55, cappedKm = 40 (luật trần)
const userActivitiesHeavy: Activity[] = [
  { ...baseActivity, id: 'a1', startDate: '2026-10-12T06:00:00Z', distanceKm: 20.0 },
  { ...baseActivity, id: 'a2', startDate: '2026-10-14T06:00:00Z', distanceKm: 20.0 },
  { ...baseActivity, id: 'a3', startDate: '2026-10-16T06:00:00Z', distanceKm: 15.0 },
];
const statHeavy = calculateUserWeeklyStat('u-heavy', testWeek, userActivitiesHeavy, 0);
assert(statHeavy.actualKm === 55, 'Bảng cá nhân ghi nhận đủ 55 km');
assert(statHeavy.cappedKm === 40, 'Bảng tập thể áp trần tối đa 40 km (Cap 40km rule)');

// 2.3 Thiếu buổi: chạy 2 buổi tổng 16km (đạt km nhưng thiếu 1 buổi)
const userActivitiesMissingDay: Activity[] = [
  { ...baseActivity, id: 'a1', startDate: '2026-10-12T06:00:00Z', distanceKm: 8.0 },
  { ...baseActivity, id: 'a2', startDate: '2026-10-14T06:00:00Z', distanceKm: 8.0 },
];
const statMissingDay = calculateUserWeeklyStat('u-miss-day', testWeek, userActivitiesMissingDay, 0);
assert(statMissingDay.missingDays === 1, 'Xác định thiếu đúng 1 buổi chạy');
assert(statMissingDay.penaltyDaysAmount === 20000, 'Phạt 20.000đ do thiếu 1 buổi chạy');
assert(statMissingDay.deficitKm === 0, 'Không bị phạt thiếu km vì đã chạy 16km >= 15km');

// 2.4 Thiếu km & Quy tắc làm tròn 0.01km tính 1km: chạy 3 buổi tổng 14.95km (thiếu 0.05km)
const userActivitiesDeficit: Activity[] = [
  { ...baseActivity, id: 'a1', startDate: '2026-10-12T06:00:00Z', distanceKm: 5.0 },
  { ...baseActivity, id: 'a2', startDate: '2026-10-14T06:00:00Z', distanceKm: 5.0 },
  { ...baseActivity, id: 'a3', startDate: '2026-10-16T06:00:00Z', distanceKm: 4.95 },
];
const statDeficit = calculateUserWeeklyStat('u-deficit', testWeek, userActivitiesDeficit, 0);
assert(statDeficit.deficitKm === 0.05, 'Tính chính xác số km thiếu là 0.05 km');
assert(statDeficit.roundedDeficitKm === 1, 'Làm tròn thiếu 0.05km thành 1km (thể lệ quy định 0.01km tính 1km)');
assert(statDeficit.penaltyKmAmount === 20000, 'Phạt 20.000đ tiền thiếu km');
assert(statDeficit.rolledOverToNextWeek === 0.05, 'Nợ 0.05km được chuyển sang tuần kế tiếp');

// 2.5 Nợ tuần trước chuyển sang tuần sau: nợ 2.0km -> chỉ tiêu tuần 2 là 17.0km
const statWeek2 = calculateUserWeeklyStat('u-deficit', { ...testWeek, weekNumber: 2 }, userActivities1, 2.0);
assert(statWeek2.totalTargetKm === 17.0, 'Tuần 2 phải chạy 15km gốc + 2km nợ = 17km');
assert(statWeek2.isCompleted, 'Chạy 21km >= 17km nên hoàn thành xuất sắc');

// 2.6 Tuần cuối (Tuần 8): Phạt gấp đôi 40.000đ/km, không còn chạy bù
const finalWeek: Week = {
  weekNumber: 8,
  name: 'Tuần 8 (Chung kết)',
  startDate: '2026-11-30',
  endDate: '2026-12-06',
  isFinalWeek: true,
  isLocked: false,
};
const statFinal = calculateUserWeeklyStat('u-final', finalWeek, [
  { ...baseActivity, id: 'a1', startDate: '2026-12-01T06:00:00Z', distanceKm: 12.0 }
], 0);
// Thiếu: 15 - 12 = 3km. Làm tròn: 3km. Phạt tuần cuối: 3 * 40.000 = 120.000đ
assert(statFinal.roundedDeficitKm === 3, 'Thiếu 3km ở tuần cuối');
assert(statFinal.penaltyKmAmount === 120000, 'Tuần cuối phạt gấp đôi 40.000đ/km -> 120.000đ');
assert(statFinal.rolledOverToNextWeek === 0, 'Tuần cuối không chuyển nợ sang tuần sau (kết thúc giải)');

// ----------------------------------------------------
// TEST NHÓM 3: XẾP HẠNG TEAM & TIE-BREAKER (PACE CHẬM HƠN THẮNG)
// ----------------------------------------------------
console.log('\n--- NHÓM 3: Xếp hạng Team & Tie-breaker thể lệ ---');

const teamA: Team = { id: 'team-a', name: 'Team Chiến Binh', color: '#ff5722' };
const teamB: Team = { id: 'team-b', name: 'Team Rùa Vàng', color: '#4caf50' };

// Giả lập 2 team có cùng bình quân 30 km/người
// Team A chạy nhanh: Pace 5:00/km (300s)
const memberA: UserWeeklyStat = {
  ...stat1,
  userId: 'm-a',
  actualKm: 30,
  cappedKm: 30,
  totalMovingTimeSec: 30 * 300, // Pace 5:00
};
const teamStatA = calculateTeamWeeklyStats(teamA, testWeek, [memberA]);

// Team B chạy chậm: Pace 7:00/km (420s)
const memberB: UserWeeklyStat = {
  ...stat1,
  userId: 'm-b',
  actualKm: 30,
  cappedKm: 30,
  totalMovingTimeSec: 30 * 420, // Pace 7:00
};
const teamStatB = calculateTeamWeeklyStats(teamB, testWeek, [memberB]);

const rankedTeams = rankTeamsForWeek([teamStatA, teamStatB]);

assert(
  rankedTeams[0].teamId === 'team-b',
  'Tie-breaker: Khi quãng đường bằng nhau, Team có Pace trung bình CHẬM HƠN (Team Rùa Vàng) xếp HẠNG 1'
);
assert(rankedTeams[0].rewardAmount === 150000, 'Đội đứng nhất tuần nhận thưởng 150.000đ');
assert(rankedTeams[1].rewardAmount === 100000, 'Đội đứng nhì tuần nhận thưởng 100.000đ');

console.log('\n========================================================');
console.log(`📊 TỔNG KẾT: ${passCount} PASSED, ${failCount} FAILED`);
console.log('========================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 TẤT CẢ UNIT TESTS ĐÃ VƯỢT QUA 100% CHÍNH XÁC THEO THỂ LỆ!');
}
