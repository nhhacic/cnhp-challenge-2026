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

// 1.7 Bài chạy diễn ra trước 00h00 ngày 12/10/2026 -> Không hợp lệ
const earlyAct: Activity = {
  ...baseActivity,
  startDate: '2026-10-11T23:59:00+07:00', // 23h59 ngày 11/10 (trước 00h ngày 12/10)
};
const res8 = validateActivity(earlyAct);
assert(
  !res8.isValid && res8.invalidReasons.some((r) => r.includes('trước thời gian khai mạc')),
  'Bài chạy diễn ra trước 00h00 ngày 12/10/2026 bị loại'
);

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
assert(statMissingDay.penaltyDaysAmount === 50000, 'Phạt 50.000đ do thiếu 1 buổi chạy');
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
// Thiếu: 15 - 12 = 3km. Làm tròn: 3km. Phạt: 3 * 40.000 = 120.000đ
assert(statFinal.roundedDeficitKm === 3, 'Thiếu 3km ở tuần cuối');
assert(statFinal.penaltyKmAmount === 120000, 'Tuần cuối thiếu 3km phạt gấp đôi 3 * 40.000đ -> 120.000đ');
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

// ----------------------------------------------------
// TEST NHÓM 4: MIỄN CHỈ TIÊU VÌ LÝ DO BẤT KHẢ KHÁNG (FORCE MAJEURE)
// ----------------------------------------------------
console.log('\n--- NHÓM 4: Miễn chỉ tiêu vì lý do bất khả kháng (Force Majeure) ---');

// 4.1 Thành viên được duyệt nghỉ bất khả kháng: 0km, 0 buổi -> miễn phạt 100%, không nợ gối đầu
const statExcused = calculateUserWeeklyStat('u-injured', testWeek, [], 0, true, true, 'Chấn thương đầu gối');
assert(statExcused.isExcused === true, 'Xác nhận trạng thái được miễn nghỉ bất khả kháng');
assert(statExcused.isCompleted === true, 'Hoàn thành trạng thái tuần (không bị đánh trượt)');
assert(statExcused.totalPenaltyAmount === 0, 'Miễn toàn bộ tiền phạt (phạt = 0đ)');
assert(statExcused.rolledOverToNextWeek === 0, 'Không phát sinh nợ km gối đầu sang tuần tiếp theo');

// 4.2 Bảo vệ điểm đội đua: 1 thành viên chạy 30km + 1 thành viên nghỉ bất khả kháng (0km)
// Điểm bình quân của đội không bị chia đôi (phải giữ 30km thay vì tụt xuống 15km)
const activeRunner: UserWeeklyStat = {
  ...stat1,
  userId: 'runner-active',
  actualKm: 30,
  cappedKm: 30,
};
const excusedRunner: UserWeeklyStat = {
  ...statExcused,
  userId: 'runner-injured',
  actualKm: 0,
  cappedKm: 0,
};
const teamWithExcused = calculateTeamWeeklyStats(teamA, testWeek, [activeRunner, excusedRunner]);
assert(teamWithExcused.averageCappedKmPerMember === 30, 'Điểm bình quân Team tính trên quân số thực tế (30km, không tụt xuống 15km)');

// ----------------------------------------------------
// TEST NHÓM 5: THÀNH VIÊN CLB PHONG TRÀO (TEAM 4 - NGOÀI CHALLENGE)
// ----------------------------------------------------
console.log('\n--- NHÓM 5: Đội phong trào CLB (Team 4 - Ngoài Challenge) ---');

const team4: Team = {
  id: 'team-4',
  name: 'Team 4 - Thành Viên CLB (Ngoài Challenge)',
  color: '#8b5cf6',
  isClubOnly: true,
};

// 5.1 Chạy đủ 15km và 3 buổi -> Hoàn thành tuần, không phạt
const actT4_1: Activity = { ...baseActivity, id: 't4-1', startDate: '2026-10-12T06:00:00Z', distanceKm: 5.0 };
const actT4_2: Activity = { ...baseActivity, id: 't4-2', startDate: '2026-10-14T06:00:00Z', distanceKm: 5.0 };
const actT4_3: Activity = { ...baseActivity, id: 't4-3', startDate: '2026-10-16T06:00:00Z', distanceKm: 6.0 };

const statT4Success = calculateUserWeeklyStat(
  'u-club-1',
  testWeek,
  [actT4_1, actT4_2, actT4_3],
  0,
  true,
  false,
  undefined,
  true // isClubOnly
);

assert(statT4Success.isCompleted === true, 'Team 4: Chạy 16km và 3 buổi -> Đạt chỉ tiêu tuần');
assert(statT4Success.totalPenaltyAmount === 0, 'Team 4: Tiền phạt = 0đ');
assert(statT4Success.rolledOverToNextWeek === 0, 'Team 4: Không nợ km sang tuần sau');
assert(statT4Success.baseTargetKm === 15.0, 'Team 4: Chỉ tiêu tuần là 15.0 km');

// 5.2 Chạy thiếu km và thiếu buổi (chỉ chạy 1 buổi 5km) -> Chưa đạt chỉ tiêu NHƯNG PHẠT = 0, NỢ = 0
const statT4Fail = calculateUserWeeklyStat(
  'u-club-2',
  testWeek,
  [actT4_1],
  0,
  true,
  false,
  undefined,
  true // isClubOnly
);

assert(statT4Fail.isCompleted === false, 'Team 4: Chạy 5km/1 buổi -> Chưa đạt chỉ tiêu tuần');
assert(statT4Fail.totalPenaltyAmount === 0, 'Team 4: Thiếu km và thiếu buổi nhưng TIỀN PHẠT = 0đ (không áp phạt)');
assert(statT4Fail.rolledOverToNextWeek === 0, 'Team 4: KHÔNG nợ gối đầu sang tuần sau (tuần sau vẫn bắt đầu từ 15km)');

// 5.3 Chạy vượt 40km (ví dụ 48km) -> Không áp trần Cap 40km
const actT4_Long1: Activity = { ...baseActivity, id: 't4-l1', startDate: '2026-10-12T06:00:00Z', distanceKm: 24.0 };
const actT4_Long2: Activity = { ...baseActivity, id: 't4-l2', startDate: '2026-10-14T06:00:00Z', distanceKm: 24.0 };
const statT4Long = calculateUserWeeklyStat(
  'u-club-ultra',
  testWeek,
  [actT4_Long1, actT4_Long2],
  0,
  true,
  false,
  undefined,
  true // isClubOnly
);
assert(statT4Long.actualKm === 48.0, 'Team 4: Ghi nhận đúng 48.0 km thực tế');
assert(statT4Long.cappedKm === 48.0, 'Team 4: cappedKm ghi nhận đúng 48.0km (không bị giới hạn trần 40km)');

// 5.4 Đội phong trào CLB xếp hạng độc lập (rank 0, thưởng 0đ, không làm xáo trộn thưởng Team 1, 2, 3)
const teamStat4 = calculateTeamWeeklyStats(team4, testWeek, [statT4Success]);
const rankedWithClub = rankTeamsForWeek([teamStatA, teamStatB, teamStat4]);

assert(rankedWithClub.length === 3, 'Bảng xếp hạng tuần có 3 đội');
assert(rankedWithClub[0].teamId === 'team-b' && rankedWithClub[0].rank === 1, 'Team B vẫn xếp Hạng 1 Challenge');
assert(rankedWithClub[1].teamId === 'team-a' && rankedWithClub[1].rank === 2, 'Team A vẫn xếp Hạng 2 Challenge');
const clubInRanked = rankedWithClub.find((t) => t.teamId === 'team-4');
assert(clubInRanked?.rank === 0, 'Team 4 CLB ngoài Challenge không tính hạng đua (rank = 0)');
assert(clubInRanked?.rewardAmount === 0, 'Team 4 CLB không nhận tiền thưởng giải Challenge (thưởng = 0đ)');

console.log('\n========================================================');
console.log(`📊 TỔNG KẾT: ${passCount} PASSED, ${failCount} FAILED`);
console.log('========================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 TẤT CẢ UNIT TESTS ĐÃ VƯỢT QUA 100% CHÍNH XÁC THEO THỂ LỆ!');
}
