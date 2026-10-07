import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveActivity } from '@/lib/storage';
import { Activity, ActivityType } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    const data = loadData();
    const usersToSync = userId ? data.users.filter((u) => u.id === userId) : data.users;

    let syncedCount = 0;

    for (const user of usersToSync) {
      if (user.stravaAccessToken) {
        try {
          // Gọi Strava API lấy các activity trong thời gian giải
          const res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=30', {
            headers: {
              Authorization: `Bearer ${user.stravaAccessToken}`,
            },
          });

          if (res.ok) {
            const activities = await res.json();
            for (const item of activities) {
              const typeStr = item.type || item.sport_type;
              let actType: ActivityType = 'Run';
              let isTrailOrHike = false;

              if (typeStr === 'TrailRun') {
                actType = 'TrailRun';
                isTrailOrHike = true;
              } else if (typeStr === 'Hike') {
                actType = 'Hike';
                isTrailOrHike = true;
              } else if (typeStr === 'Walk') {
                actType = 'Walk';
                isTrailOrHike = true;
              }

              const distanceKm = Math.round((item.distance / 1000) * 100) / 100;
              const movingTimeSec = item.moving_time || 0;
              const averagePaceSeconds = distanceKm > 0 ? Math.round(movingTimeSec / distanceKm) : 0;

              const act: Activity = {
                id: `strava-${item.id}`,
                userId: user.id,
                stravaActivityId: String(item.id),
                title: item.name || 'Hoạt động Strava',
                type: actType,
                distanceKm,
                movingTimeSec,
                elapsedTimeSec: item.elapsed_time || movingTimeSec,
                averagePaceSeconds,
                elevationGain: item.total_elevation_gain || 0,
                startDate: item.start_date || new Date().toISOString(),
                summaryPolyline: item.map?.summary_polyline || '',
                lagKmDeducted: 0,
                effectiveKm: distanceKm,
                isTrailOrHike,
                isValid: true,
                invalidReasons: [],
              };

              saveActivity(act);
              syncedCount++;
            }
          }
        } catch (e) {
          console.error(`Lỗi khi sync Strava cho user ${user.name}:`, e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: syncedCount > 0
        ? `Đã đồng bộ thành công ${syncedCount} bài chạy từ Strava!`
        : `Dữ liệu đã được cập nhật mới nhất! (Đã quét ${usersToSync.length} vận động viên)`,
      syncedCount,
    });
  } catch (error) {
    console.error('Lỗi khi đồng bộ Strava:', error);
    return NextResponse.json({ error: 'Không thể đồng bộ Strava' }, { status: 500 });
  }
}
