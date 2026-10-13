import { NextResponse } from 'next/server';
import { loadDataAsync } from '@/lib/storage';
import {
  calculateUserWeeklyStat,
  calculateTeamWeeklyStats,
  rankTeamsForWeek,
  rankOverallUsers,
  rankOverallTeams,
  RULES,
} from '@/lib/rules-engine';
import { TeamWeeklyStat, UserWeeklyStat, FinancialOverview } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const data = await loadDataAsync();
    const { weeks, teams, users, activities } = data;
    const leaveRequests = data.leaveRequests || [];

    // Danh sách các đơn xin nghỉ đã được Admin duyệt
    const approvedLeavesMap = new Map<string, any>();
    for (const req of leaveRequests) {
      if (req.status === 'APPROVED') {
        approvedLeavesMap.set(`${req.userId}_${req.weekNumber}`, req);
      }
    }

    // Xác định các tuần đã chốt kết quả (đã kết thúc hoặc được Admin khóa chốt)
    // Phạt nợ và tiền phạt chỉ chính thức phát sinh đối với các tuần đã kết thúc/khóa
    const evaluatedWeeksSet = new Set<number>();
    for (const week of weeks) {
      if (week.isLocked) {
        evaluatedWeeksSet.add(week.weekNumber);
      }
    }

    // 1. Tính UserWeeklyStat cho từng User qua 8 tuần (có xử lý nợ gối đầu qua các tuần)
    const userWeeklyStatsMap = new Map<string, UserWeeklyStat[]>();
    const allUserWeeklyStats: UserWeeklyStat[] = [];

    for (const user of users) {
      const userStats: UserWeeklyStat[] = [];
      const userActs = activities.filter((a) => a.userId === user.id);
      let previousDeficit = 0;

      for (const week of weeks) {
        const isEvaluated = evaluatedWeeksSet.has(week.weekNumber);
        const leave = approvedLeavesMap.get(`${user.id}_${week.weekNumber}`);
        const isExcused = Boolean(leave);
        const leaveReason = leave?.reason;
        const stat = calculateUserWeeklyStat(user.id, week, userActs, previousDeficit, isEvaluated, isExcused, leaveReason);
        userStats.push(stat);
        if (isEvaluated) {
          allUserWeeklyStats.push(stat);
        }
        // Nợ chuyển tiếp sang tuần tiếp theo
        previousDeficit = stat.rolledOverToNextWeek;
      }
      userWeeklyStatsMap.set(user.id, userStats);
    }

    // 2. Tính TeamWeeklyStat cho từng Tuần và xếp hạng
    const rankedTeamsByWeek: Record<number, TeamWeeklyStat[]> = {};
    const allTeamWeeklyStats: TeamWeeklyStat[] = [];

    for (const week of weeks) {
      const teamStatsForThisWeek: TeamWeeklyStat[] = [];

      for (const team of teams) {
        const teamUsers = users.filter((u) => u.teamId === team.id);
        const membersStats = teamUsers.map((u) => {
          const stats = userWeeklyStatsMap.get(u.id) || [];
          return stats.find((s) => s.weekNumber === week.weekNumber)!;
        }).filter(Boolean);

        const teamStat = calculateTeamWeeklyStats(team, week, membersStats);
        teamStatsForThisWeek.push(teamStat);
      }

      const ranked = rankTeamsForWeek(teamStatsForThisWeek);
      rankedTeamsByWeek[week.weekNumber] = ranked;
      if (evaluatedWeeksSet.has(week.weekNumber)) {
        allTeamWeeklyStats.push(...ranked);
      }
    }

    // 3. Tính Xếp hạng cá nhân Nam & Nữ chung cuộc
    const { maleRankings, femaleRankings } = rankOverallUsers(users, teams, userWeeklyStatsMap);

    // 4. Tính Xếp hạng Đội chung cuộc
    const overallTeams = rankOverallTeams(teams, allTeamWeeklyStats);

    // 5. Báo cáo Tài chính & Quỹ Giải theo đúng thể lệ (Phí tham dự 200.000đ/người + Quỹ phạt)
    const entryFeePerPerson = data.challenge?.entryFee ?? RULES.ENTRY_FEE;
    const totalFeeCollected = users.filter((u) => u.isPaidFee).length * entryFeePerPerson;
    const totalPenalties = allUserWeeklyStats.reduce((sum, s) => sum + s.totalPenaltyAmount, 0);
    const totalWeeklyRewards = allTeamWeeklyStats.reduce((sum, s) => sum + s.rewardAmount, 0);
    const totalFinalRewards =
      overallTeams.reduce((sum, t) => sum + t.finalRewardAmount, 0) +
      maleRankings.reduce((sum, m) => sum + m.totalRewardEarned, 0) +
      femaleRankings.reduce((sum, f) => sum + f.totalRewardEarned, 0);

    // Quỹ giải = Phí tham dự đã thu + Tổng tiền phạt - Tiền thưởng tuần đã trao
    const remainingFund = Math.max(0, totalFeeCollected + totalPenalties - totalWeeklyRewards);

    const financialOverview: FinancialOverview = {
      totalFeeCollected,
      totalPenalties,
      totalWeeklyRewards,
      totalFinalRewards,
      remainingFund,
    };

    return NextResponse.json(
      {
        challenge: data.challenge,
        weeks,
        teams,
        users,
        activities,
        leaveRequests,
        userWeeklyStats: Object.fromEntries(userWeeklyStatsMap),
        rankedTeamsByWeek,
        overallUsers: {
          maleRankings,
          femaleRankings,
        },
        overallTeams,
        financialOverview,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu /api/data:', error);
    return NextResponse.json({ error: 'Không thể tải dữ liệu' }, { status: 500 });
  }
}
