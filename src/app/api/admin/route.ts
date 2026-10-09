import { NextRequest, NextResponse } from 'next/server';
import { loadDataAsync, saveDataAsync, saveTeam, saveUserAsync, getInitialDefaultData, syncLocalToFirebase } from '@/lib/storage';
import { isFirebaseConfigured } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'check_firebase') {
      return NextResponse.json({
        configured: isFirebaseConfigured(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || null,
      });
    }

    if (action === 'sync_firebase') {
      const res = await syncLocalToFirebase();
      return NextResponse.json(res);
    }

    if (action === 'reset_seed') {
      const initial = getInitialDefaultData();
      await saveDataAsync(initial);
      return NextResponse.json({ success: true, message: 'Đã khôi phục dữ liệu ban đầu thành công' });
    }

    if (action === 'update_team') {
      const { team } = body;
      if (!team || !team.id) {
        return NextResponse.json({ error: 'Dữ liệu team không hợp lệ' }, { status: 400 });
      }
      const updated = saveTeam(team);
      const allData = await loadDataAsync();
      await saveDataAsync(allData);
      return NextResponse.json({ success: true, team: updated });
    }

    if (action === 'update_user') {
      const { user } = body;
      if (!user || !user.id) {
        return NextResponse.json({ error: 'Dữ liệu user không hợp lệ' }, { status: 400 });
      }
      const updated = await saveUserAsync(user);
      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error) {
    console.error('Lỗi API admin:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
