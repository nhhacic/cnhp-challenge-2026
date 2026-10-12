import { User } from '@/types';

export interface StravaClientApp {
  id: string;
  secret: string;
  name: string;
  owner: string;
  isPrimary?: boolean;
}

/**
 * Danh sách các ứng dụng Strava API được cấu hình trong hệ thống (Multi-Client OAuth).
 * Giải quyết triệt để giới hạn tối đa 10 VĐV / ứng dụng trong chế độ Development của Strava.
 */
export function getStravaClients(): StravaClientApp[] {
  const clients: StravaClientApp[] = [];

  // Cổng 1 (Chính - Đặng Tùng)
  const c1Id = process.env.STRAVA_CLIENT_ID || process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || '285643';
  const c1Secret = process.env.STRAVA_CLIENT_SECRET || '2fa36ff5d8c39df5cde54c20576550f50f387ae5';
  if (c1Id && c1Secret) {
    clients.push({
      id: c1Id.trim(),
      secret: c1Secret.trim(),
      name: 'Cổng 1 (Chính - Đặng Tùng)',
      owner: 'Đặng Tùng',
      isPrimary: true,
    });
  }

  // Cổng 2 (Mở rộng - Anh Phi Long)
  const c2Id = process.env.STRAVA_CLIENT_ID_2 || process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID_2 || '286693';
  const c2Secret = process.env.STRAVA_CLIENT_SECRET_2 || '32d33f6a7cfca83d58f02bd4101ed9c1c82e0eac';
  if (c2Id && c2Secret) {
    clients.push({
      id: c2Id.trim(),
      secret: c2Secret.trim(),
      name: 'Cổng 2 (Mở rộng - Anh Phi Long)',
      owner: 'Nguyễn Phi Long',
      isPrimary: false,
    });
  }

  return clients;
}

/**
 * Tìm cấu hình ứng dụng Strava theo Client ID
 */
export function getStravaClientById(clientId?: string): StravaClientApp | undefined {
  const clients = getStravaClients();
  if (!clientId) return clients[0];
  return clients.find((c) => c.id === clientId) || clients[0];
}

/**
 * Tự động làm mới Access Token từ Refresh Token nếu token đã hoặc sắp hết hạn (chu kỳ 6 giờ)
 */
export async function refreshStravaTokenIfNeeded(user: User): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
} | null> {
  if (!user.stravaRefreshToken) {
    return null;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  // Nếu token vẫn còn hạn hơn 5 phút thì không cần refresh
  if (user.stravaTokenExpiresAt && user.stravaTokenExpiresAt > nowSec + 300 && user.stravaAccessToken) {
    return {
      accessToken: user.stravaAccessToken,
      refreshToken: user.stravaRefreshToken,
      expiresAt: user.stravaTokenExpiresAt,
    };
  }

  // Lấy Client cấu hình tương ứng với user
  const client = getStravaClientById(user.stravaClientId);
  if (!client) {
    console.error(`Không tìm thấy cấu hình Strava Client cho user ${user.name}`);
    return null;
  }

  try {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: client.id,
        client_secret: client.secret,
        grant_type: 'refresh_token',
        refresh_token: user.stravaRefreshToken,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.error(`Lỗi làm mới token Strava cho ${user.name} (Client ${client.id}):`, errJson);
      return null;
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    };
  } catch (err) {
    console.error(`Ngoại lệ khi làm mới token Strava cho ${user.name}:`, err);
    return null;
  }
}

/**
 * Đổi mã OAuth Code lấy Token, tự động thử qua các Client ID nếu cần
 */
export async function exchangeStravaAuthCode(code: string, preferredClientId?: string): Promise<{
  tokenData: any;
  clientIdUsed: string;
}> {
  const clients = getStravaClients();
  if (clients.length === 0) {
    throw new Error('Chưa cấu hình bất kỳ Strava Client ID nào');
  }

  // Sắp xếp client ưu tiên lên đầu
  const sortedClients = [...clients].sort((a, b) => {
    if (a.id === preferredClientId) return -1;
    if (b.id === preferredClientId) return 1;
    return 0;
  });

  let lastError: any = null;

  for (const client of sortedClients) {
    try {
      const tokenRes = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: client.id,
          client_secret: client.secret,
          code,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json();
      if (tokenRes.ok && tokenData.access_token) {
        return {
          tokenData,
          clientIdUsed: client.id,
        };
      }

      lastError = tokenData;
    } catch (e) {
      lastError = e;
    }
  }

  const errorMsg = lastError?.message || (typeof lastError === 'string' ? lastError : 'Không thể xác thực mã OAuth với các Cổng Strava');
  throw new Error(errorMsg);
}
