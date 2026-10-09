import fs from 'fs';
import path from 'path';
import { Activity, Team, User, Week } from '@/types';
import { validateActivity } from './rules-engine';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';

export interface ChallengeData {
  challenge: {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    entryFee: number;
  };
  weeks: Week[];
  teams: Team[];
  users: User[];
  activities: Activity[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'challenge_data.json');
const FIRESTORE_COLLECTION = 'cnhp_challenge';
const FIRESTORE_DOC_ID = 'challenge_data_2026';

export function getInitialDefaultData(): ChallengeData {
  const weeks: Week[] = [
    { weekNumber: 1, name: 'Tuần 1', startDate: '2026-10-11', endDate: '2026-10-18', isFinalWeek: false, isLocked: true },
    { weekNumber: 2, name: 'Tuần 2', startDate: '2026-10-19', endDate: '2026-10-25', isFinalWeek: false, isLocked: false },
    { weekNumber: 3, name: 'Tuần 3', startDate: '2026-10-26', endDate: '2026-11-01', isFinalWeek: false, isLocked: false },
    { weekNumber: 4, name: 'Tuần 4', startDate: '2026-11-02', endDate: '2026-11-08', isFinalWeek: false, isLocked: false },
    { weekNumber: 5, name: 'Tuần 5', startDate: '2026-11-09', endDate: '2026-11-15', isFinalWeek: false, isLocked: false },
    { weekNumber: 6, name: 'Tuần 6', startDate: '2026-11-16', endDate: '2026-11-22', isFinalWeek: false, isLocked: false },
    { weekNumber: 7, name: 'Tuần 7', startDate: '2026-11-23', endDate: '2026-11-29', isFinalWeek: false, isLocked: false },
    { weekNumber: 8, name: 'Tuần 8 (Chung kết)', startDate: '2026-11-30', endDate: '2026-12-06', isFinalWeek: true, isLocked: false },
  ];

  const teams: Team[] = [
    { id: 'team-1', name: 'Team 1 - Chiến Binh Rực Lửa', color: '#ff5722', captainId: 'user-1' },
    { id: 'team-2', name: 'Team 2 - Rùa Vàng Bền Bỉ', color: '#10b981', captainId: 'user-6' },
    { id: 'team-3', name: 'Team 3 - Thần Tốc Bắc Hà', color: '#3b82f6', captainId: 'user-11' },
  ];

  const users: User[] = [
    // Team 1
    { id: 'user-1', name: 'Nguyễn Hoàng Hà', gender: 'MALE', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', teamId: 'team-1', isCaptain: true, isPaidFee: true, status: 'ACTIVE', stravaId: 'strava_101' },
    { id: 'user-2', name: 'Trần Văn Mạnh', gender: 'MALE', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', teamId: 'team-1', isCaptain: false, isPaidFee: true, status: 'ACTIVE', stravaId: 'strava_102' },
    { id: 'user-3', name: 'Lê Thị Thu', gender: 'FEMALE', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', teamId: 'team-1', isCaptain: false, isPaidFee: true, status: 'ACTIVE', stravaId: 'strava_103' },
    { id: 'user-4', name: 'Phạm Đức Thắng', gender: 'MALE', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', teamId: 'team-1', isCaptain: false, isPaidFee: true, status: 'ACTIVE', stravaId: 'strava_104' },
    { id: 'user-5', name: 'Hoàng Lan Anh', gender: 'FEMALE', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', teamId: 'team-1', isCaptain: false, isPaidFee: true, status: 'ACTIVE', stravaId: 'strava_105' },

    // Team 2
    { id: 'user-6', name: 'Đặng Thanh Tùng', gender: 'MALE', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', teamId: 'team-2', isCaptain: true, isPaidFee: true, status: 'ACTIVE', stravaId: 'strava_201' },
    { id: 'user-7', name: 'Vũ Quốc Huy', gender: 'MALE', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', teamId: 'team-2', isCaptain: false, isPaidFee: true, status: 'ACTIVE', stravaId: 'strava_202' },
    { id: 'user-8', name: 'Nguyễn Mai Chi', gender: 'FEMALE', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', teamId: 'team-2', isCaptain: false, isPaidFee: true, status: 'ACTIVE', stravaId: 'strava_203' },
    { id: 'user-9', name: 'Bùi Tuấn Anh', gender: 'MALE', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', teamId: 'team-2', isCaptain: false, isPaidFee: true, status: 'ACTIVE', stravaId: 'strava_204' },
    { id: 'user-10', name: 'Đỗ Hồng Nhung', gender: 'FEMALE', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', teamId: 'team-2', isCaptain: false, isPaidFee: true, status: 'ACTIVE', stravaId: 'strava_205' },

    // Team 3
    { id: 'user-11', name: 'Phan Minh Trí', gender: 'MALE', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', teamId: 'team-3', isCaptain: true, isPaidFee: true, status: 'ACTIVE', stravaId: 'strava_301' },
    { id: 'user-12', name: 'Trịnh Bảo Ngọc', gender: 'FEMALE', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', teamId: 'team-3', isCaptain: false, isPaidFee: true, status: 'ACTIVE', stravaId: 'strava_302' },
    { id: 'user-13', name: 'Lý Quốc Bảo', gender: 'MALE', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150', teamId: 'team-3', isCaptain: false, isPaidFee: true, status: 'ACTIVE', stravaId: 'strava_303' },
    { id: 'user-14', name: 'Dương Thị Tuyết', gender: 'FEMALE', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', teamId: 'team-3', isCaptain: false, isPaidFee: true, status: 'ACTIVE', stravaId: 'strava_304' },
    { id: 'user-15', name: 'Cao Văn Hùng', gender: 'MALE', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', teamId: 'team-3', isCaptain: false, isPaidFee: true, status: 'ACTIVE', stravaId: 'strava_305' },
  ];

  return {
    challenge: {
      name: 'Challenge CNHP Thu Đông 2026',
      description: 'Giải chạy nội bộ CNHP Running Club mùa Thu Đông 2026 (11/10/2026 - 06/12/2026)',
      startDate: '2026-10-11',
      endDate: '2026-12-06',
      entryFee: 200000,
    },
    weeks,
    teams,
    users,
    activities: [],
  };
}

export function loadData(): ChallengeData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initial = getInitialDefaultData();
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Lỗi khi đọc challenge_data.json, sử dụng dữ liệu mặc định:', error);
    return getInitialDefaultData();
  }
}

export function saveData(data: ChallengeData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Lỗi khi ghi challenge_data.json:', error);
  }
}

// =================== ASYNC / FIREBASE INTEGRATION ===================

export async function loadDataAsync(): Promise<ChallengeData> {
  if (isFirebaseConfigured()) {
    try {
      const db = getFirebaseDb();
      if (db) {
        const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as ChallengeData;
          saveData(data); // đồng bộ vào cache local
          return data;
        } else {
          // Chưa có document trên Firestore -> Đẩy dữ liệu hiện tại lên Firestore
          const localData = loadData();
          await setDoc(docRef, localData);
          return localData;
        }
      }
    } catch (e) {
      console.error('Lỗi đọc dữ liệu từ Cloud Firestore, dùng dữ liệu local fallback:', e);
    }
  }
  return loadData();
}

export async function saveDataAsync(data: ChallengeData): Promise<void> {
  saveData(data);
  if (isFirebaseConfigured()) {
    try {
      const db = getFirebaseDb();
      if (db) {
        // Làm sạch dữ liệu để tránh undefined gây lỗi trên Firestore
        const cleanData = JSON.parse(JSON.stringify(data));
        const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
        await setDoc(docRef, cleanData);
      }
    } catch (e) {
      console.error('Lỗi lưu dữ liệu lên Cloud Firestore:', e);
    }
  }
}

export async function saveActivityAsync(activity: Activity): Promise<Activity> {
  const data = await loadDataAsync();
  const validation = validateActivity(activity);
  const updatedActivity: Activity = {
    ...activity,
    effectiveKm: Math.max(0, activity.distanceKm - (activity.lagKmDeducted || 0)),
    isValid: validation.isValid,
    invalidReasons: validation.invalidReasons,
  };

  const index = data.activities.findIndex((a) => a.id === updatedActivity.id);
  if (index >= 0) {
    data.activities[index] = updatedActivity;
  } else {
    data.activities.push(updatedActivity);
  }
  await saveDataAsync(data);
  return updatedActivity;
}

export async function deleteActivityAsync(id: string): Promise<boolean> {
  const data = await loadDataAsync();
  const initialLen = data.activities.length;
  data.activities = data.activities.filter((a) => a.id !== id);
  if (data.activities.length !== initialLen) {
    await saveDataAsync(data);
    return true;
  }
  return false;
}

export async function saveUserAsync(user: User): Promise<User> {
  const data = await loadDataAsync();
  const index = data.users.findIndex((u) => u.id === user.id);
  if (index >= 0) {
    data.users[index] = { ...data.users[index], ...user };
  } else {
    data.users.push(user);
  }
  await saveDataAsync(data);
  return user;
}

export async function deleteUserAsync(userId: string): Promise<boolean> {
  const data = await loadDataAsync();
  const initLen = data.users.length;
  data.users = data.users.filter((u) => u.id !== userId);
  data.activities = data.activities.filter((a) => a.userId !== userId);
  // Cập nhật nếu user là captain
  data.teams.forEach((t) => {
    if (t.captainId === userId) {
      delete t.captainId;
    }
  });
  if (data.users.length !== initLen) {
    await saveDataAsync(data);
    return true;
  }
  return false;
}

export async function saveTeamAsync(team: Team): Promise<Team> {
  const data = await loadDataAsync();
  const index = data.teams.findIndex((t) => t.id === team.id);
  if (index >= 0) {
    data.teams[index] = { ...data.teams[index], ...team };
  } else {
    data.teams.push(team);
  }
  await saveDataAsync(data);
  return team;
}

export async function deleteTeamAsync(teamId: string): Promise<{ success: boolean; message: string }> {
  const data = await loadDataAsync();
  if (data.teams.length <= 1) {
    return { success: false, message: 'Giải đấu phải duy trì ít nhất 1 đội đua, không thể xóa tất cả các đội.' };
  }
  const targetIndex = data.teams.findIndex((t) => t.id === teamId);
  if (targetIndex === -1) {
    return { success: false, message: 'Không tìm thấy đội cần xóa.' };
  }

  const fallbackTeam = data.teams.find((t) => t.id !== teamId);
  if (fallbackTeam) {
    // Chuyển các thành viên của đội này sang đội còn lại
    data.users.forEach((u) => {
      if (u.teamId === teamId) {
        u.teamId = fallbackTeam.id;
        u.isCaptain = false;
      }
    });
  }

  data.teams.splice(targetIndex, 1);
  await saveDataAsync(data);
  return { success: true, message: 'Đã xóa đội thành công!' };
}

export async function syncLocalToFirebase(): Promise<{ success: boolean; message: string }> {
  if (!isFirebaseConfigured()) {
    return {
      success: false,
      message: 'Firebase chưa được cấu hình. Vui lòng thêm các biến môi trường Firebase vào file .env.local',
    };
  }
  try {
    const db = getFirebaseDb();
    if (!db) {
      return { success: false, message: 'Không thể kết nối đến Firebase Firestore' };
    }
    const localData = loadData();
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    await setDoc(docRef, localData);
    return {
      success: true,
      message: `Đã đồng bộ thành công ${localData.users.length} thành viên, ${localData.teams.length} đội và ${localData.activities.length} bài chạy lên Firebase Firestore!`,
    };
  } catch (err: any) {
    return { success: false, message: 'Lỗi đồng bộ Firebase: ' + (err.message || String(err)) };
  }
}

// Đồng bộ các hàm cũ (đồng bộ)
export function getWeeks(): Week[] {
  return loadData().weeks;
}

export function getTeams(): Team[] {
  return loadData().teams;
}

export function getUsers(): User[] {
  return loadData().users;
}

export function getActivities(): Activity[] {
  return loadData().activities;
}

export function saveActivity(activity: Activity): Activity {
  const data = loadData();
  const validation = validateActivity(activity);
  const updatedActivity: Activity = {
    ...activity,
    effectiveKm: Math.max(0, activity.distanceKm - (activity.lagKmDeducted || 0)),
    isValid: validation.isValid,
    invalidReasons: validation.invalidReasons,
  };

  const index = data.activities.findIndex((a) => a.id === updatedActivity.id);
  if (index >= 0) {
    data.activities[index] = updatedActivity;
  } else {
    data.activities.push(updatedActivity);
  }
  saveData(data);
  return updatedActivity;
}

export function deleteActivity(id: string): boolean {
  const data = loadData();
  const initialLen = data.activities.length;
  data.activities = data.activities.filter((a) => a.id !== id);
  if (data.activities.length !== initialLen) {
    saveData(data);
    return true;
  }
  return false;
}

export function saveUser(user: User): User {
  const data = loadData();
  const index = data.users.findIndex((u) => u.id === user.id);
  if (index >= 0) {
    data.users[index] = user;
  } else {
    data.users.push(user);
  }
  saveData(data);
  return user;
}

export function saveTeam(team: Team): Team {
  const data = loadData();
  const index = data.teams.findIndex((t) => t.id === team.id);
  if (index >= 0) {
    data.teams[index] = team;
  } else {
    data.teams.push(team);
  }
  saveData(data);
  return team;
}
