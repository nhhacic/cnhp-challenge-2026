import { NextResponse } from 'next/server';
import { loadData } from '@/lib/storage';
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

export async function GET() {
  try {
    const data = loadData();
    const { weeks, teams, users, activities } = data;

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
        const stat = calculateUserWeeklyStat(user.id, week, userActs, previousDeficit, isEvaluated);
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

    // 5. Báo cáo Tài chính
    const totalFeeCollected = users.filter((u) => u.isPaidFee).length * RULES.ENTRY_FEE;
    const totalPenalties = allUserWeeklyStats.reduce((sum, s) => sum + s.totalPenaltyAmount, 0);
    const totalWeeklyRewards = allTeamWeeklyStats.reduce((sum, s) => sum + s.rewardAmount, 0);
    const totalFinalRewards =
      overallTeams.reduce((sum, t) => sum + t.finalRewardAmount, 0) +
      maleRankings.reduce((sum, m) => sum + m.totalRewardEarned, 0) +
      femaleRankings.reduce((sum, f) => sum + f.totalRewardEarned, 0);

    const remainingFund = totalFeeCollected + totalPenalties - totalWeeklyRewards;

    const financialOverview: FinancialOverview = {
      totalFeeCollected,
      totalPenalties,
      totalWeeklyRewards,
      totalFinalRewards,
      remainingFund,
    };

    return NextResponse.json({
      challenge: data.challenge,
      weeks,
      teams,
      users,
      activities,
      userWeeklyStats: Object.fromEntries(userWeeklyStatsMap),
      rankedTeamsByWeek,
      overallUsers: {
        maleRankings,
        femaleRankings,
      },
      overallTeams,
      financialOverview,
    });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu /api/data:', error);
    return NextResponse.json({ error: 'Không thể tải dữ liệu' }, { status: 500 });
  }
}
