import { NextRequest, NextResponse } from 'next/server';
import {
  loadDataAsync,
  saveDataAsync,
  saveTeam,
  saveTeamAsync,
  deleteTeamAsync,
  saveUserAsync,
  deleteUserAsync,
  getInitialDefaultData,
  syncLocalToUpstash,
} from '@/lib/storage';
import { isUpstashConfigured } from '@/lib/upstash';
import { User, Team } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    configured: isUpstashConfigured(),
    provider: 'Upstash Redis (Vercel KV)',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'check_cloud' || action === 'check_upstash') {
      return NextResponse.json({
        configured: isUpstashConfigured(),
        provider: 'Upstash Redis (Vercel KV)',
      });
    }

    if (action === 'sync_cloud' || action === 'sync_upstash') {
      const res = await syncLocalToUpstash();
      return NextResponse.json(res);
    }

    if (action === 'check_firebase') {
      return NextResponse.json({
        configured: false,
        projectId: null,
      });
    }

    if (action === 'sync_firebase') {
      return NextResponse.json({ success: true, message: 'Đã tắt tính năng đồng bộ Firebase.' });
    }

    if (action === 'reset_seed') {
      const initial = getInitialDefaultData();
      await saveDataAsync(initial);
      return NextResponse.json({ success: true, message: 'Đã khôi phục dữ liệu ban đầu thành công' });
    }

    if (action === 'create_team') {
      const { name, color } = body;
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Tên đội đua không được để trống' }, { status: 400 });
      }
      const newTeam: Team = {
        id: `team-${Date.now()}`,
        name: name.trim(),
        color: color || '#f97316',
      };
      const saved = await saveTeamAsync(newTeam);
      return NextResponse.json({ success: true, team: saved });
    }

    if (action === 'update_team') {
      const { team } = body;
      if (!team || !team.id || !team.name) {
        return NextResponse.json({ error: 'Dữ liệu đội đua không hợp lệ' }, { status: 400 });
      }
      const updated = await saveTeamAsync(team);
      return NextResponse.json({ success: true, team: updated });
    }

    if (action === 'delete_team') {
      const { teamId } = body;
      if (!teamId) {
        return NextResponse.json({ error: 'Thiếu mã đội đua (teamId)' }, { status: 400 });
      }
      const result = await deleteTeamAsync(teamId);
      return NextResponse.json(result);
    }

    if (action === 'update_user') {
      const { user } = body;
      if (!user || !user.id) {
        return NextResponse.json({ error: 'Dữ liệu user không hợp lệ' }, { status: 400 });
      }
      const updated = await saveUserAsync(user);
      return NextResponse.json({ success: true, user: updated });
    }

    if (action === 'toggle_paid_fee') {
      const { userId, isPaidFee, callerStravaId, callerUserId, treasurerPin } = body;
      if (!userId) {
        return NextResponse.json({ error: 'Thiếu mã thành viên (userId)' }, { status: 400 });
      }

      // Xác thực quyền: Chỉ Thủ quỹ Long Trịnh (Strava ID: 138319814) mới có quyền xác nhận thu phí
      const TREASURER_STRAVA_ID = '138319814';
      const TREASURER_USER_ID = 'user-138319814';
      const VALID_PINS = ['138319814', 'cnhp2026', '190306'];

      const isAuthorized =
        callerStravaId === TREASURER_STRAVA_ID ||
        callerUserId === TREASURER_USER_ID ||
        (treasurerPin && VALID_PINS.includes(String(treasurerPin).trim()));

      if (!isAuthorized) {
        return NextResponse.json(
          { error: 'Chỉ Thủ quỹ Long Trịnh (Strava ID: 138319814) mới có quyền xác nhận thu phí tham dự!' },
          { status: 403 }
        );
      }

      const data = await loadDataAsync();
      const user = data.users.find((u) => u.id === userId);
      if (!user) {
        return NextResponse.json({ error: 'Không tìm thấy thành viên' }, { status: 404 });
      }
      user.isPaidFee = typeof isPaidFee === 'boolean' ? isPaidFee : !user.isPaidFee;
      await saveUserAsync(user);
      return NextResponse.json({ success: true, user });
    }

    if (action === 'create_user') {
      const { name, gender, teamId, isPaidFee } = body;
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Tên thành viên không được để trống' }, { status: 400 });
      }
      const newUser: User = {
        id: `user-manual-${Date.now()}`,
        name: name.trim(),
        gender: gender === 'FEMALE' ? 'FEMALE' : 'MALE',
        avatar: `https://images.unsplash.com/photo-${gender === 'FEMALE' ? '1494790108377-be9c29b29330' : '1535713875002-d1d0cf377fde'}?w=150`,
        teamId: teamId || 'team-1',
        isCaptain: false,
        isPaidFee: Boolean(isPaidFee),
        status: 'ACTIVE',
      };
      await saveUserAsync(newUser);
      return NextResponse.json({ success: true, user: newUser });
    }

    if (action === 'delete_user') {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ error: 'Thiếu mã thành viên (userId)' }, { status: 400 });
      }
      const success = await deleteUserAsync(userId);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error) {
    console.error('Lỗi API admin:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
