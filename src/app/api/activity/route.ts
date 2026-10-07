import { NextRequest, NextResponse } from 'next/server';
import { saveActivity, deleteActivity } from '@/lib/storage';
import { Activity } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const activity: Activity = {
      id: body.id || `act-${Date.now()}`,
      userId: body.userId,
      stravaActivityId: body.stravaActivityId || '',
      title: body.title || 'Chạy bộ',
      type: body.type || 'Run',
      distanceKm: parseFloat(body.distanceKm) || 0,
      movingTimeSec: parseInt(body.movingTimeSec) || 0,
      elapsedTimeSec: parseInt(body.elapsedTimeSec) || parseInt(body.movingTimeSec) || 0,
      averagePaceSeconds: parseFloat(body.averagePaceSeconds) || 0,
      elevationGain: parseFloat(body.elevationGain) || 0,
      startDate: body.startDate || new Date().toISOString(),
      summaryPolyline: body.summaryPolyline || '',
      lagKmDeducted: parseFloat(body.lagKmDeducted) || 0,
      effectiveKm: Math.max(0, (parseFloat(body.distanceKm) || 0) - (parseFloat(body.lagKmDeducted) || 0)),
      isTrailOrHike: Boolean(body.isTrailOrHike || body.type === 'TrailRun' || body.type === 'Hike' || body.type === 'Walk'),
      adminOverrideValid: body.adminOverrideValid,
      adminNote: body.adminNote,
      isValid: true,
      invalidReasons: [],
    };

    // Tự động tính pace nếu chưa có
    if (!activity.averagePaceSeconds && activity.distanceKm > 0 && activity.movingTimeSec > 0) {
      activity.averagePaceSeconds = Math.round(activity.movingTimeSec / activity.distanceKm);
    }

    const saved = saveActivity(activity);
    return NextResponse.json({ success: true, activity: saved });
  } catch (error) {
    console.error('Lỗi khi lưu bài chạy:', error);
    return NextResponse.json({ error: 'Không thể lưu bài chạy' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Thiếu id bài chạy' }, { status: 400 });
    }
    const success = deleteActivity(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Lỗi khi xóa bài chạy:', error);
    return NextResponse.json({ error: 'Không thể xóa bài chạy' }, { status: 500 });
  }
}
