import { NextRequest, NextResponse } from 'next/server';
import { loadDataAsync, saveDataAsync } from '@/lib/storage';
import { Activity, ActivityType, User } from '@/types';
import { validateActivity } from '@/lib/rules-engine';
import { exchangeStravaAuthCode, getStravaClients } from '@/lib/strava';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state'); // Chứa clientId hoặc 'client_1', 'client_2'
  const scope = searchParams.get('scope');

  if (error) {
    let friendlyError = error;
    if (error === 'access_denied') {
      friendlyError = 'Bạn đã từ chối cấp quyền kết nối Strava.';
    }
    return NextResponse.redirect(new URL('/?strava_error=' + encodeURIComponent(friendlyError), req.url));
  }

  // Bắt buộc phải có quyền xem bài tập (activity:read hoặc activity:read_all)
  if (scope && !scope.includes('activity:read')) {
    return NextResponse.redirect(
      new URL(
        '/?strava_error=' +
          encodeURIComponent(
            '⚠️ Bạn chưa cấp quyền đọc bài chạy! Khi ủy quyền trên Strava, vui lòng bắt buộc TÍCH CHỌN ô: "Xem dữ liệu về các hoạt động của bạn" (View data about your activities) để hệ thống tự động đồng bộ kết quả.'
          ),
        req.url
      )
    );
  }

  const configuredClients = getStravaClients();

  // Nếu chưa có code
  if (!code) {
    return NextResponse.redirect(
      new URL('/?strava_status=demo_connected&msg=' + encodeURIComponent('Đã kết nối tài khoản Strava thử nghiệm'), req.url)
    );
  }

  if (configuredClients.length === 0) {
    return NextResponse.redirect(
      new URL('/?strava_error=' + encodeURIComponent('Chưa cấu hình Strava Client ID trên máy chủ'), req.url)
    );
  }

  try {
    // 1. Đổi code lấy Token & Thông tin Athlete (hỗ trợ Multi-Client thông minh)
    const preferredClientId = state ? state.trim() : undefined;
    const { tokenData, clientIdUsed } = await exchangeStravaAuthCode(code, preferredClientId);

    const { access_token, refresh_token, expires_at, athlete } = tokenData;

    // 2. Tải dữ liệu giải chạy hiện tại
    const data = await loadDataAsync();
    let user = data.users.find((u) => u.stravaId === String(athlete.id));

    if (user) {
      user.stravaAccessToken = access_token;
      user.stravaRefreshToken = refresh_token;
      user.stravaTokenExpiresAt = expires_at;
      user.stravaClientId = clientIdUsed;
      user.stravaScopeMissing = false;
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
        stravaClientId: clientIdUsed,
        stravaScopeMissing: false,
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
