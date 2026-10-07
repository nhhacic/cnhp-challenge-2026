import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData, saveTeam, saveUser, getInitialDefaultData } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'reset_seed') {
      const initial = getInitialDefaultData();
      saveData(initial);
      return NextResponse.json({ success: true, message: 'Đã khôi phục dữ liệu ban đầu thành công' });
    }

    if (action === 'update_team') {
      const { team } = body;
      if (!team || !team.id) {
        return NextResponse.json({ error: 'Dữ liệu team không hợp lệ' }, { status: 400 });
      }
      const updated = saveTeam(team);
      return NextResponse.json({ success: true, team: updated });
    }

    if (action === 'update_user') {
      const { user } = body;
      if (!user || !user.id) {
        return NextResponse.json({ error: 'Dữ liệu user không hợp lệ' }, { status: 400 });
      }
      const updated = saveUser(user);
      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error) {
    console.error('Lỗi API admin:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
