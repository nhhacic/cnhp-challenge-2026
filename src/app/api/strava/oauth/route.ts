import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData } from '@/lib/storage';

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
    // Chế độ demo login khi chạy local
    return NextResponse.redirect(
      new URL('/?strava_status=demo_connected&msg=' + encodeURIComponent('Đã kết nối tài khoản Strava thử nghiệm'), req.url)
    );
  }

  try {
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
      throw new Error(tokenData.message || 'Không thể lấy token Strava');
    }

    const { access_token, refresh_token, athlete } = tokenData;

    // Lưu thông tin athlete vào storage
    const data = loadData();
    let user = data.users.find((u) => u.stravaId === String(athlete.id));

    if (user) {
      user.stravaAccessToken = access_token;
      user.name = `${athlete.firstname || ''} ${athlete.lastname || ''}`.trim() || user.name;
      user.avatar = athlete.profile || user.avatar;
    } else {
      // Đăng ký mới nếu chưa có
      user = {
        id: `user-${athlete.id}`,
        name: `${athlete.firstname || ''} ${athlete.lastname || ''}`.trim() || 'Runner Strava',
        gender: athlete.sex === 'F' ? 'FEMALE' : 'MALE',
        avatar: athlete.profile || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        stravaId: String(athlete.id),
        stravaAccessToken: access_token,
        teamId: 'team-1', // mặc định team 1, admin có thể chuyển team
        isCaptain: false,
        isPaidFee: false,
        status: 'ACTIVE',
      };
      data.users.push(user);
    }

    saveData(data);

    return NextResponse.redirect(
      new URL(`/?strava_status=success&user_id=${user.id}&athlete_name=${encodeURIComponent(user.name)}`, req.url)
    );
  } catch (err: any) {
    console.error('Lỗi Strava OAuth callback:', err);
    return NextResponse.redirect(
      new URL('/?strava_error=' + encodeURIComponent(err.message || 'Lỗi kết nối Strava'), req.url)
    );
  }
}
