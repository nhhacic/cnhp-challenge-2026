import { NextRequest, NextResponse } from 'next/server';
import { loadDataAsync, saveDataAsync } from '@/lib/storage';
import { Activity, ActivityType, User } from '@/types';
import { validateActivity } from '@/lib/rules-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/?strava_error=' + encodeURIComponent(error), req.url));
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  // Nếu chưa có clientId/clientSecret (chạy local demo)
  if (!clientId || !clientSecret || !code) {
    return NextResponse.redirect(
      new URL('/?strava_status=demo_connected&msg=' + encodeURIComponent('Đã kết nối tài khoản Strava thử nghiệm'), req.url)
    );
  }

  try {
    // 1. Đổi code lấy Token & Thông tin Athlete
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokenData.message || 'Không thể lấy token xác thực Strava');
    }

    const { access_token, refresh_token, expires_at, athlete } = tokenData;

    // 2. Tải dữ liệu giải chạy hiện tại
    const data = await loadDataAsync();
    let user = data.users.find((u) => u.stravaId === String(athlete.id));

    if (user) {
      user.stravaAccessToken = access_token;
      user.stravaRefreshToken = refresh_token;
      user.stravaTokenExpiresAt = expires_at;
      user.name = `${athlete.firstname || ''} ${athlete.lastname || ''}`.trim() || user.name;
      user.avatar = athlete.profile || user.avatar;
    } else {
      // Đăng ký thành viên mới
      // Phân chia đội luân phiên hoặc đội có ít thành viên nhất để cân bằng
      const teamCounts = data.teams.map((t) => ({
        id: t.id,
        count: data.users.filter((u) => u.teamId === t.id).length,
      }));
      teamCounts.sort((a, b) => a.count - b.count);
      const assignedTeamId = teamCounts[0]?.id || 'team-1';

      user = {
        id: `user-${athlete.id}`,
        name: `${athlete.firstname || ''} ${athlete.lastname || ''}`.trim() || 'Vận Động Viên Strava',
        gender: athlete.sex === 'F' ? 'FEMALE' : 'MALE',
        avatar: athlete.profile || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        stravaId: String(athlete.id),
        stravaAccessToken: access_token,
        stravaRefreshToken: refresh_token,
        stravaTokenExpiresAt: expires_at,
        teamId: assignedTeamId,
        isCaptain: false,
        isPaidFee: false,
        status: 'ACTIVE',
      };
      data.users.push(user);
    }

    // 3. TỰ ĐỘNG ĐỌC BÀI TẬP TỪ STRAVA CỦA VẬN ĐỘNG VIÊN
    let syncedCount = 0;
    try {
      const actRes = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=50', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (actRes.ok) {
        const stravaActivities = await actRes.json();
        for (const item of stravaActivities) {
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

          const validation = validateActivity(act);
          act.isValid = validation.isValid;
          act.invalidReasons = validation.invalidReasons;

          const existingIdx = data.activities.findIndex((a) => a.id === act.id);
          if (existingIdx >= 0) {
            data.activities[existingIdx] = act;
          } else {
            data.activities.push(act);
          }
          syncedCount++;
        }
      }
    } catch (actErr) {
      console.error('Lỗi khi tải bài tập tự động từ Strava lúc login:', actErr);
    }

    // 4. Lưu lại toàn bộ dữ liệu vào cơ sở dữ liệu (Firestore / Local)
    await saveDataAsync(data);

    // 5. Chuyển hướng người dùng về trang chủ kèm thông tin đăng nhập
    const redirectUrl = new URL(
      `/?strava_status=success&user_id=${user.id}&athlete_name=${encodeURIComponent(user.name)}&avatar=${encodeURIComponent(user.avatar)}&synced_count=${syncedCount}&team_id=${user.teamId}`,
      req.url
    );

    const response = NextResponse.redirect(redirectUrl);
    
    // Gán cookie phiên đăng nhập cho user
    response.cookies.set('cnhp_user_id', user.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 ngày
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    console.error('Lỗi Strava OAuth callback:', err);
    return NextResponse.redirect(
      new URL('/?strava_error=' + encodeURIComponent(err.message || 'Lỗi kết nối Strava'), req.url)
    );
  }
}
