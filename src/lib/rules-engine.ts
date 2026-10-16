import {
  Activity,
  Gender,
  Team,
  TeamWeeklyStat,
  User,
  UserWeeklyStat,
  Week,
  OverallUserStat,
  OverallTeamStat,
} from '@/types';

// Các hằng số thể lệ
export const RULES = {
  MIN_DISTANCE_PER_ACTIVITY_KM: 1.0,
  MIN_PACE_SECONDS: 210, // 3:30/km
  MAX_PACE_SECONDS: 630, // 10:30/km
  WEEKLY_MIN_DAYS: 3,
  WEEKLY_MIN_KM: 15.0,
  WEEKLY_TEAM_CAP_KM: 40.0,
  PENALTY_PER_MISSING_DAY: 50000, // Thiếu 1 buổi phạt 50.000đ
  PENALTY_PER_MISSING_KM: 20000, // Thiếu 1 km phạt 20.000đ (0.01km tính là 1km)
  PENALTY_PER_MISSING_KM_FINAL_WEEK: 40000, // Tuần cuối không bù, phạt gấp đôi 40.000đ/km
  ENTRY_FEE: 200000, // Phí tham dự 200.000đ/người
  WITHDRAWAL_FEE: 500000, // Lệ phí rút khỏi challenge 500.000đ
  WEEKLY_TEAM_REWARDS: [150000, 100000, 50000],
  FINAL_TEAM_REWARDS: [300000, 200000, 100000],
  FINAL_INDIVIDUAL_REWARDS: [200000, 150000, 100000],
};

/**
 * Định dạng số giây pace thành chuỗi 'm:ss' hoặc 'mm:ss'
 */
export function formatPace(secondsPerKm: number): string {
  if (!secondsPerKm || isNaN(secondsPerKm) || !isFinite(secondsPerKm) || secondsPerKm <= 0) {
    return '--:--';
  }
  const minutes = Math.floor(secondsPerKm / 60);
  const remainingSeconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}/km`;
}

/**
 * Định dạng tiền tệ VNĐ
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

/**
 * Định dạng km làm tròn 2 chữ số thập phân
 */
export function formatKm(km: number): string {
  return (Math.round(km * 100) / 100).toFixed(2) + ' km';
}

/**
 * Lấy ngày theo định dạng YYYY-MM-DD tính theo múi giờ GMT+7 (Việt Nam)
 */
export function getDateStringInVietnam(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  // Offset GMT+7 là +420 phút
  const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return vnDate.toISOString().split('T')[0];
}

/**
 * Kiểm tra tính hợp lệ của một bài chạy theo thể lệ
 */
export function validateActivity(activity: Activity): { isValid: boolean; invalidReasons: string[] } {
  const invalidReasons: string[] = [];
  const effectiveDistance = Math.max(0, activity.distanceKm - (activity.lagKmDeducted || 0));

  // Kiểm tra thời gian bắt đầu giải: 00h00 ngày 12/10/2026 (GMT+7)
  const challengeStartTime = new Date('2026-10-12T00:00:00+07:00').getTime();
  if (activity.startDate && new Date(activity.startDate).getTime() < challengeStartTime) {
    invalidReasons.push('Bài chạy diễn ra trước thời gian khai mạc giải (00h00 ngày 12/10/2026)');
  }

  // Kiểm tra cự ly tối thiểu >= 1.0 km
  if (effectiveDistance < RULES.MIN_DISTANCE_PER_ACTIVITY_KM) {
    invalidReasons.push(`Cự ly sau khi trừ lag (${effectiveDistance.toFixed(2)} km) dưới 1.0 km`);
  }

  // Phân loại hoạt động: Trail run, Trekking, Hiking -> không tính pace
  const isTrailOrHike =
    activity.isTrailOrHike ||
    activity.type === 'TrailRun' ||
    activity.type === 'Hike' ||
    activity.type === 'Walk';

  if (!isTrailOrHike) {
    // Chạy thông thường: kiểm tra pace 3:30 - 10:30
    if (activity.averagePaceSeconds < RULES.MIN_PACE_SECONDS) {
      invalidReasons.push(`Pace quá nhanh (${formatPace(activity.averagePaceSeconds)} < 3:30/km)`);
    } else if (activity.averagePaceSeconds > RULES.MAX_PACE_SECONDS) {
      invalidReasons.push(`Pace quá chậm (${formatPace(activity.averagePaceSeconds)} > 10:30/km)`);
    }
  }

  // Admin có thể override nếu cần
  if (activity.adminOverrideValid === true) {
    return { isValid: true, invalidReasons: [] };
  }

  return {
    isValid: invalidReasons.length === 0,
    invalidReasons,
  };
}

/**
 * Tính toán số liệu tuần của một vận động viên
 */
export function calculateUserWeeklyStat(
  userId: string,
  week: Week,
  userActivities: Activity[],
  previousDeficitKm: number = 0,
  isEvaluated: boolean = true,
  isExcused: boolean = false,
  leaveReason?: string,
  isClubOnly: boolean = false
): UserWeeklyStat {
  // Lọc các bài chạy hợp lệ và diễn ra trong tuần
  const weekStart = week.startDate; // YYYY-MM-DD
  const weekEnd = week.endDate;     // YYYY-MM-DD

  const validActivitiesInWeek = userActivities.filter((act) => {
    const actDate = getDateStringInVietnam(act.startDate);
    return act.isValid && actDate >= weekStart && actDate <= weekEnd;
  });

  // Tập hợp các ngày chạy duy nhất
  const uniqueRunDaysSet = new Set<string>();
  let actualKm = 0;
  let totalMovingTimeSec = 0;

  for (const act of validActivitiesInWeek) {
    const actDate = getDateStringInVietnam(act.startDate);
    uniqueRunDaysSet.add(actDate);
    const effKm = Math.max(0, act.distanceKm - (act.lagKmDeducted || 0));
    actualKm += effKm;
    totalMovingTimeSec += act.movingTimeSec;
  }

  actualKm = Math.round(actualKm * 100) / 100;
  const uniqueRunDays = Array.from(uniqueRunDaysSet).sort();
  const totalDaysRun = uniqueRunDays.length;

  // Áp dụng trần 40km cho tập thể
  const cappedKm = Math.min(RULES.WEEKLY_TEAM_CAP_KM, actualKm);

  // Nếu thành viên được Ban Tổ Chức duyệt nghỉ vì lý do bất khả kháng:
  // Miễn hoàn toàn chỉ tiêu tuần, không phạt tiền, không phạt thiếu buổi, không chuyển nợ sang tuần sau.
  if (isExcused) {
    return {
      userId,
      weekNumber: week.weekNumber,
      validActivitiesCount: validActivitiesInWeek.length,
      uniqueRunDays,
      totalDaysRun,
      actualKm,
      cappedKm,
      baseTargetKm: 0,
      previousDeficitKm: 0,
      totalTargetKm: 0,
      deficitKm: 0,
      roundedDeficitKm: 0,
      missingDays: 0,
      penaltyKmAmount: 0,
      penaltyDaysAmount: 0,
      totalPenaltyAmount: 0,
      totalMovingTimeSec,
      averagePaceSeconds: actualKm > 0 ? Math.round(totalMovingTimeSec / actualKm) : 0,
      isCompleted: true,
      rolledOverToNextWeek: 0,
      isExcused: true,
      leaveReason,
      isClubOnly,
    };
  }

  // NẾU LÀ THÀNH VIÊN CLB (NGOÀI CHALLENGE - TEAM 4):
  // Thể lệ Team 4:
  // - Chỉ có luật tối thiểu 1 tuần chạy 3 buổi và tổng 15km
  // - VẪN PHẠT TIỀN NHƯ CHALLENGE nếu thiếu số tối thiểu này (20k/km thiếu, 50k/buổi thiếu)
  // - KHÔNG nợ km gối đầu sang tuần sau (mỗi tuần độc lập tối thiểu 15km)
  // - KHÔNG áp trần điểm Cap 40km (ghi nhận đúng km thực tế)
  if (isClubOnly) {
    const baseTargetKm = RULES.WEEKLY_MIN_KM; // 15km
    let deficitKm = 0;
    let roundedDeficitKm = 0;
    let missingDays = 0;
    let penaltyKmAmount = 0;
    let penaltyDaysAmount = 0;
    let totalPenaltyAmount = 0;
    let isCompleted = false;

    if (isEvaluated) {
      const rawDeficit = Math.max(0, baseTargetKm - actualKm);
      deficitKm = Math.round(rawDeficit * 100) / 100;

      // 0.01 km thiếu tính là 1 km thiếu -> làm tròn lên (Math.ceil)
      roundedDeficitKm = deficitKm > 0 ? Math.ceil(deficitKm) : 0;

      // Phạt thiếu km (tuần thường 20.000đ/km, tuần cuối 40.000đ/km)
      const kmPenaltyRate = week.isFinalWeek
        ? RULES.PENALTY_PER_MISSING_KM_FINAL_WEEK
        : RULES.PENALTY_PER_MISSING_KM;
      penaltyKmAmount = roundedDeficitKm * kmPenaltyRate;

      // Phạt thiếu buổi (< 3 buổi: 50.000đ/buổi)
      missingDays = Math.max(0, RULES.WEEKLY_MIN_DAYS - totalDaysRun);
      penaltyDaysAmount = missingDays * RULES.PENALTY_PER_MISSING_DAY;
      totalPenaltyAmount = penaltyKmAmount + penaltyDaysAmount;

      isCompleted = deficitKm <= 0 && missingDays === 0;
    }

    const averagePaceSeconds = actualKm > 0 ? Math.round(totalMovingTimeSec / actualKm) : 0;

    return {
      userId,
      weekNumber: week.weekNumber,
      validActivitiesCount: validActivitiesInWeek.length,
      uniqueRunDays,
      totalDaysRun,
      actualKm,
      cappedKm: actualKm, // Không áp trần điểm vì không đua giải
      baseTargetKm,
      previousDeficitKm: 0,
      totalTargetKm: baseTargetKm,
      deficitKm,
      roundedDeficitKm,
      missingDays,
      penaltyKmAmount,
      penaltyDaysAmount,
      totalPenaltyAmount,
      totalMovingTimeSec,
      averagePaceSeconds,
      isCompleted,
      rolledOverToNextWeek: 0,
      isExcused: false,
      isClubOnly: true,
    };
  }

  // Chỉ tiêu tuần đối với VĐV tham gia Challenge Thu Đông
  const baseTargetKm = RULES.WEEKLY_MIN_KM;
  const totalTargetKm = Math.round((baseTargetKm + previousDeficitKm) * 100) / 100;

  let deficitKm = 0;
  let roundedDeficitKm = 0;
  let missingDays = 0;
  let penaltyKmAmount = 0;
  let penaltyDaysAmount = 0;
  let totalPenaltyAmount = 0;
  let isCompleted = false;
  let rolledOverToNextWeek = previousDeficitKm;

  if (isEvaluated) {
    const rawDeficit = Math.max(0, totalTargetKm - actualKm);
    deficitKm = Math.round(rawDeficit * 100) / 100;

    // Thể lệ: 0.01 km thiếu tính là 1 km thiếu -> làm tròn lên (Math.ceil)
    roundedDeficitKm = deficitKm > 0 ? Math.ceil(deficitKm) : 0;

    // Phạt thiếu km (tuần thường 20.000đ/km, tuần cuối phạt gấp đôi 40.000đ/km)
    const kmPenaltyRate = week.isFinalWeek
      ? RULES.PENALTY_PER_MISSING_KM_FINAL_WEEK
      : RULES.PENALTY_PER_MISSING_KM;
    penaltyKmAmount = roundedDeficitKm * kmPenaltyRate;

    // Phạt thiếu buổi (< 3 buổi)
    missingDays = Math.max(0, RULES.WEEKLY_MIN_DAYS - totalDaysRun);
    penaltyDaysAmount = missingDays * RULES.PENALTY_PER_MISSING_DAY;
    totalPenaltyAmount = penaltyKmAmount + penaltyDaysAmount;

    // Kiểm tra hoàn thành mục tiêu
    isCompleted = deficitKm <= 0 && missingDays === 0;

    // Cơ chế chuyển nợ sang tuần sau: nếu không phải tuần cuối thì chuyển nợ deficitKm
    rolledOverToNextWeek = week.isFinalWeek ? 0 : deficitKm;
  }

  // Pace trung bình của người này trong tuần
  const averagePaceSeconds = actualKm > 0 ? totalMovingTimeSec / actualKm : 0;

  return {
    userId,
    weekNumber: week.weekNumber,
    validActivitiesCount: validActivitiesInWeek.length,
    uniqueRunDays,
    totalDaysRun,
    actualKm,
    cappedKm,
    baseTargetKm,
    previousDeficitKm,
    totalTargetKm,
    deficitKm,
    roundedDeficitKm,
    missingDays,
    penaltyKmAmount,
    penaltyDaysAmount,
    totalPenaltyAmount,
    totalMovingTimeSec,
    averagePaceSeconds,
    isCompleted,
    rolledOverToNextWeek,
    isExcused: false,
    isClubOnly: false,
  };
}

/**
 * Tính toán bảng xếp hạng tuần của các Đội (Teams)
 * Quy tắc:
 * 1. Đội có bình quân km/thành viên cao nhất xếp trên.
 * 2. Tie-breaker: Nếu bằng nhau, đội có Pace trung bình CHẬM HƠN sẽ thắng!
 */
export function calculateTeamWeeklyStats(
  team: Team,
  week: Week,
  membersWeeklyStats: UserWeeklyStat[]
): TeamWeeklyStat {
  const memberCount = membersWeeklyStats.length;
  let totalActualKm = 0;
  let totalCappedKm = 0;
  let totalMovingTimeSec = 0;

  for (const m of membersWeeklyStats) {
    totalActualKm += m.actualKm;
    totalCappedKm += m.cappedKm;
    totalMovingTimeSec += m.totalMovingTimeSec;
  }

  totalActualKm = Math.round(totalActualKm * 100) / 100;
  totalCappedKm = Math.round(totalCappedKm * 100) / 100;

  // Nếu có thành viên được duyệt nghỉ và không chạy, không tính vào số chia của Team để bảo vệ quyền lợi đồng đội
  const activeMembers = membersWeeklyStats.filter((m) => !m.isExcused || m.actualKm > 0);
  const effectiveMemberCount = activeMembers.length > 0 ? activeMembers.length : memberCount;

  const averageCappedKmPerMember =
    effectiveMemberCount > 0 ? Math.round((totalCappedKm / effectiveMemberCount) * 100) / 100 : 0;

  const averagePaceSeconds =
    totalActualKm > 0 ? totalMovingTimeSec / totalActualKm : 0;

  const isClubOnly = Boolean(team.isClubOnly || team.id === 'team-4');

  return {
    teamId: team.id,
    teamName: team.name,
    teamColor: team.color,
    weekNumber: week.weekNumber,
    memberCount,
    totalActualKm,
    totalCappedKm,
    averageCappedKmPerMember,
    totalMovingTimeSec,
    averagePaceSeconds,
    rank: 0,
    rewardAmount: 0,
    members: membersWeeklyStats,
    isClubOnly,
  };
}

/**
 * Xếp hạng và phân giải các Đội trong tuần
 * Chỉ xếp hạng và trao thưởng cho các đội Challenge Thu Đông.
 * Đội phong trào CLB (Team 4) chỉ theo dõi độc lập, không tham gia tranh giải.
 */
export function rankTeamsForWeek(teamsStats: TeamWeeklyStat[]): TeamWeeklyStat[] {
  const challengeTeams = teamsStats.filter((t) => !t.isClubOnly && t.teamId !== 'team-4');
  const clubOnlyTeams = teamsStats.filter((t) => Boolean(t.isClubOnly || t.teamId === 'team-4'));

  const sortedChallenge = [...challengeTeams].sort((a, b) => {
    // 1. Bình quân km cao hơn xếp trên
    if (b.averageCappedKmPerMember !== a.averageCappedKmPerMember) {
      return b.averageCappedKmPerMember - a.averageCappedKmPerMember;
    }
    // 2. Tie-breaker: Pace trung bình CHẬM HƠN thắng (số giây lớn hơn thắng)
    return b.averagePaceSeconds - a.averagePaceSeconds;
  });

  const rankedChallenge = sortedChallenge.map((stat, index) => {
    const rank = index + 1;
    let rewardAmount = 0;
    if (rank <= RULES.WEEKLY_TEAM_REWARDS.length) {
      rewardAmount = RULES.WEEKLY_TEAM_REWARDS[rank - 1];
    }
    return {
      ...stat,
      rank,
      rewardAmount,
      isClubOnly: false,
    };
  });

  const unrankedClub = clubOnlyTeams.map((stat) => ({
    ...stat,
    rank: 0,
    rewardAmount: 0,
    isClubOnly: true,
  }));

  return [...rankedChallenge, ...unrankedClub];
}

/**
 * Xếp hạng tổng thể cá nhân (Nam/Nữ)
 * Tie-breaker: Quãng đường bằng nhau -> Pace chậm hơn thắng
 */
export function rankOverallUsers(
  users: User[],
  teams: Team[],
  userWeeklyStatsMap: Map<string, UserWeeklyStat[]>
): { maleRankings: OverallUserStat[]; femaleRankings: OverallUserStat[] } {
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const overallStats: OverallUserStat[] = users.map((user) => {
    const weeklyStats = userWeeklyStatsMap.get(user.id) || [];
    let totalActualKm = 0;
    let totalMovingTimeSec = 0;
    let totalValidRuns = 0;
    let totalDaysRun = 0;
    let totalPenaltyOwed = 0;
    let weeksCompleted = 0;

    for (const ws of weeklyStats) {
      totalActualKm += ws.actualKm;
      totalMovingTimeSec += ws.totalMovingTimeSec;
      totalValidRuns += ws.validActivitiesCount;
      totalDaysRun += ws.totalDaysRun;
      totalPenaltyOwed += ws.totalPenaltyAmount;
      if (ws.isCompleted) weeksCompleted++;
    }

    totalActualKm = Math.round(totalActualKm * 100) / 100;
    const averagePaceSeconds = totalActualKm > 0 ? totalMovingTimeSec / totalActualKm : 0;
    const team = teamMap.get(user.teamId);
    const isClubOnly = Boolean(team?.isClubOnly || user.teamId === 'team-4');

    return {
      userId: user.id,
      userName: user.name,
      gender: user.gender,
      avatar: user.avatar,
      teamId: user.teamId,
      teamName: team?.name || 'Chưa chia team',
      totalActualKm,
      totalValidRuns,
      totalDaysRun,
      totalMovingTimeSec,
      averagePaceSeconds,
      totalPenaltyOwed,
      totalRewardEarned: 0,
      weeksCompleted,
      isClubOnly,
    };
  });

  const sortFn = (a: OverallUserStat, b: OverallUserStat) => {
    if (b.totalActualKm !== a.totalActualKm) {
      return b.totalActualKm - a.totalActualKm;
    }
    // Tie-breaker: Pace chậm hơn thắng!
    return b.averagePaceSeconds - a.averagePaceSeconds;
  };

  const maleRankings = overallStats
    .filter((u) => u.gender === 'MALE')
    .sort(sortFn)
    .map((u, index) => {
      const rank = index + 1;
      let reward = 0;
      // Chỉ thành viên Challenge mới nhận giải thưởng cá nhân chung cuộc
      if (!u.isClubOnly && rank <= RULES.FINAL_INDIVIDUAL_REWARDS.length) {
        reward = RULES.FINAL_INDIVIDUAL_REWARDS[rank - 1];
      }
      return {
        ...u,
        maleRank: rank,
        totalRewardEarned: reward,
      };
    });

  const femaleRankings = overallStats
    .filter((u) => u.gender === 'FEMALE')
    .sort(sortFn)
    .map((u, index) => {
      const rank = index + 1;
      let reward = 0;
      // Chỉ thành viên Challenge mới nhận giải thưởng cá nhân chung cuộc
      if (!u.isClubOnly && rank <= RULES.FINAL_INDIVIDUAL_REWARDS.length) {
        reward = RULES.FINAL_INDIVIDUAL_REWARDS[rank - 1];
      }
      return {
        ...u,
        femaleRank: rank,
        totalRewardEarned: reward,
      };
    });

  return { maleRankings, femaleRankings };
}

/**
 * Xếp hạng Đội chung cuộc (Final Team Rankings)
 * Chỉ xếp hạng và trao thưởng cho các đội Challenge Thu Đông.
 */
export function rankOverallTeams(
  teams: Team[],
  teamWeeklyStatsList: TeamWeeklyStat[]
): OverallTeamStat[] {
  const result: OverallTeamStat[] = teams.map((team) => {
    const isClub = Boolean(team.isClubOnly || team.id === 'team-4');
    const weeklyStats = teamWeeklyStatsList.filter((s) => s.teamId === team.id);
    let totalActualKm = 0;
    let totalCappedKm = 0;
    let totalMovingTimeSec = 0;
    let weeklyRewardAmount = 0;
    const memberCount = weeklyStats[0]?.memberCount || 0;

    for (const ws of weeklyStats) {
      totalActualKm += ws.totalActualKm;
      totalCappedKm += ws.totalCappedKm;
      totalMovingTimeSec += ws.totalMovingTimeSec;
      weeklyRewardAmount += ws.rewardAmount;
    }

    totalActualKm = Math.round(totalActualKm * 100) / 100;
    totalCappedKm = Math.round(totalCappedKm * 100) / 100;
    const averageCappedKmPerMember =
      memberCount > 0 ? Math.round((totalCappedKm / memberCount) * 100) / 100 : 0;
    const averagePaceSeconds =
      totalActualKm > 0 ? totalMovingTimeSec / totalActualKm : 0;

    return {
      teamId: team.id,
      teamName: team.name,
      teamColor: team.color,
      memberCount,
      totalActualKm,
      totalCappedKm,
      averageCappedKmPerMember,
      averagePaceSeconds,
      rank: 0,
      finalRewardAmount: 0,
      weeklyRewardAmount,
      totalRewardAmount: 0,
      isClubOnly: isClub,
    };
  });

  const challengeTeams = result.filter((t) => !t.isClubOnly);
  const clubOnlyTeams = result.filter((t) => t.isClubOnly);

  challengeTeams.sort((a, b) => {
    if (b.averageCappedKmPerMember !== a.averageCappedKmPerMember) {
      return b.averageCappedKmPerMember - a.averageCappedKmPerMember;
    }
    // Tie-breaker: Pace chậm hơn thắng
    return b.averagePaceSeconds - a.averagePaceSeconds;
  });

  const rankedChallenge = challengeTeams.map((stat, index) => {
    const rank = index + 1;
    let finalRewardAmount = 0;
    if (rank <= RULES.FINAL_TEAM_REWARDS.length) {
      finalRewardAmount = RULES.FINAL_TEAM_REWARDS[rank - 1];
    }
    return {
      ...stat,
      rank,
      finalRewardAmount,
      totalRewardAmount: stat.weeklyRewardAmount + finalRewardAmount,
    };
  });

  const unrankedClub = clubOnlyTeams.map((stat) => ({
    ...stat,
    rank: 0,
    finalRewardAmount: 0,
    weeklyRewardAmount: 0,
    totalRewardAmount: 0,
  }));

  return [...rankedChallenge, ...unrankedClub];
}
