import { NextRequest, NextResponse } from 'next/server';
import { loadDataAsync, saveActivityAsync, saveUserAsync } from '@/lib/storage';
import { Activity, ActivityType } from '@/types';
import { validateActivity } from '@/lib/rules-engine';
import { refreshStravaTokenIfNeeded } from '@/lib/strava';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    const data = await loadDataAsync();
    const usersToSync = userId ? data.users.filter((u) => u.id === userId) : data.users;

    let syncedCount = 0;

    for (const user of usersToSync) {
      if (user.stravaAccessToken || user.stravaRefreshToken) {
        try {
          // 1. Kiểm tra và tự động làm mới token nếu sắp hết hạn
          const tokenRefresh = await refreshStravaTokenIfNeeded(user);
          if (tokenRefresh && tokenRefresh.accessToken) {
            if (tokenRefresh.accessToken !== user.stravaAccessToken) {
              user.stravaAccessToken = tokenRefresh.accessToken;
              user.stravaRefreshToken = tokenRefresh.refreshToken;
              user.stravaTokenExpiresAt = tokenRefresh.expiresAt;
              await saveUserAsync(user);
            }
          }

          if (!user.stravaAccessToken) continue;

          // 2. Chỉ đồng bộ các hoạt động diễn ra từ 00:00 ngày 12/10/2026 (GMT+7)
          const challengeStartEpoch = Math.floor(new Date('2026-10-12T00:00:00+07:00').getTime() / 1000);
          const stravaUrl = `https://www.strava.com/api/v3/athlete/activities?after=${challengeStartEpoch}&per_page=100`;

          // Gọi Strava API lấy các activity
          let res = await fetch(stravaUrl, {
            headers: {
              Authorization: `Bearer ${user.stravaAccessToken}`,
            },
          });

          // Nếu trả về 401 (token hết hạn đột xuất), thử refresh lại lần nữa
          if (res.status === 401 && user.stravaRefreshToken) {
            user.stravaTokenExpiresAt = 0; // Buộc refresh
            const retryToken = await refreshStravaTokenIfNeeded(user);
            if (retryToken && retryToken.accessToken) {
              user.stravaAccessToken = retryToken.accessToken;
              user.stravaRefreshToken = retryToken.refreshToken;
              user.stravaTokenExpiresAt = retryToken.expiresAt;
              await saveUserAsync(user);

              res = await fetch(stravaUrl, {
                headers: {
                  Authorization: `Bearer ${user.stravaAccessToken}`,
                },
              });
            }
          }

          if (res.ok) {
            const activities = await res.json();
            for (const item of activities) {
              // Bỏ qua các bài chạy trước 00h ngày 12/10/2026
              const actTime = new Date(item.start_date).getTime();
              const challengeStartTime = new Date('2026-10-12T00:00:00+07:00').getTime();
              if (actTime < challengeStartTime) {
                continue;
              }

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

              // Kiểm duyệt thể lệ giải CNHP
              const validation = validateActivity(act);
              act.isValid = validation.isValid;
              act.invalidReasons = validation.invalidReasons;

              await saveActivityAsync(act);
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
