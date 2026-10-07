export type Gender = 'MALE' | 'FEMALE';

export type ActivityType = 'Run' | 'TrailRun' | 'Hike' | 'Walk';

export interface User {
  id: string;
  name: string;
  gender: Gender;
  avatar: string;
  stravaId?: string;
  stravaAccessToken?: string;
  teamId: string;
  isCaptain: boolean;
  isPaidFee: boolean;
  phone?: string;
  status: 'ACTIVE' | 'DROPPED';
}

export interface Team {
  id: string;
  name: string;
  color: string;
  captainId?: string;
}

export interface Activity {
  id: string;
  userId: string;
  stravaActivityId?: string;
  title: string;
  type: ActivityType;
  distanceKm: number;
  movingTimeSec: number;
  elapsedTimeSec: number;
  averagePaceSeconds: number; // seconds per km (ví dụ: 5:30 -> 330 giây)
  elevationGain: number; // mét
  startDate: string; // ISO date string: 2026-10-12T06:30:00Z
  summaryPolyline?: string;
  lagKmDeducted: number; // số km lag bị trừ
  effectiveKm: number; // distanceKm - lagKmDeducted
  isTrailOrHike: boolean;
  adminOverrideValid?: boolean;
  adminNote?: string;
  isValid: boolean;
  invalidReasons: string[];
}

export interface Week {
  weekNumber: number;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isFinalWeek: boolean;
  isLocked: boolean;
}

export interface UserWeeklyStat {
  userId: string;
  weekNumber: number;
  validActivitiesCount: number;
  uniqueRunDays: string[]; // danh sách ngày YYYY-MM-DD
  totalDaysRun: number;
  actualKm: number;
  cappedKm: number; // Tối đa 40km cho bảng xếp hạng tập thể
  baseTargetKm: number; // 15km
  previousDeficitKm: number; // Nợ từ tuần trước
  totalTargetKm: number; // baseTargetKm + previousDeficitKm
  deficitKm: number; // Còn thiếu bao nhiêu km
  roundedDeficitKm: number; // Làm tròn lên: 0.01km tính là 1km
  missingDays: number; // max(0, 3 - totalDaysRun)
  penaltyKmAmount: number; // 20k/km, tuần cuối 40k/km
  penaltyDaysAmount: number; // 20k/ngày thiếu
  totalPenaltyAmount: number;
  totalMovingTimeSec: number;
  averagePaceSeconds: number;
  isCompleted: boolean;
  rolledOverToNextWeek: number; // Km nợ chuyển sang tuần tiếp theo
}

export interface TeamWeeklyStat {
  teamId: string;
  teamName: string;
  teamColor: string;
  weekNumber: number;
  memberCount: number;
  totalActualKm: number;
  totalCappedKm: number;
  averageCappedKmPerMember: number;
  totalMovingTimeSec: number;
  averagePaceSeconds: number;
  rank: number;
  rewardAmount: number; // 150k, 100k, 50k
  members: UserWeeklyStat[];
}

export interface OverallUserStat {
  userId: string;
  userName: string;
  gender: Gender;
  avatar: string;
  teamId: string;
  teamName: string;
  totalActualKm: number;
  totalValidRuns: number;
  totalDaysRun: number;
  totalMovingTimeSec: number;
  averagePaceSeconds: number;
  totalPenaltyOwed: number;
  totalRewardEarned: number;
  weeksCompleted: number;
  maleRank?: number;
  femaleRank?: number;
}

export interface OverallTeamStat {
  teamId: string;
  teamName: string;
  teamColor: string;
  memberCount: number;
  totalActualKm: number;
  totalCappedKm: number;
  averageCappedKmPerMember: number;
  averagePaceSeconds: number;
  rank: number;
  finalRewardAmount: number; // 300k, 200k, 100k
  weeklyRewardAmount: number;
  totalRewardAmount: number;
}

export interface FinancialOverview {
  totalFeeCollected: number;
  totalPenalties: number;
  totalWeeklyRewards: number;
  totalFinalRewards: number;
  remainingFund: number;
}
