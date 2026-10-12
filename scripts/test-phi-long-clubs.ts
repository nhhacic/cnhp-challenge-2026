import { Redis } from '@upstash/redis';

const url = "https://national-possum-213104.upstash.io";
const token = "gQAAAAAAA0BwAAIgcDExNGMxOGY5ZjZlY2Q0OGI5ODE0OTQwY2E1YTFlZTQ5Ng";

const redis = new Redis({ url, token });

async function run() {
  const data: any = await redis.get('cnhp_challenge_data_2026');
  if (!data) return;

  const phiLong = data.users.find((u: any) => u.id === 'user-40233240' || u.name.includes('Phi Long'));
  if (!phiLong) {
    console.log('Phi Long not found');
    return;
  }

  console.log('Found user:', phiLong.name, 'Token expires at:', phiLong.stravaTokenExpiresAt);
  let accessToken = phiLong.stravaAccessToken;

  // Check if token expired
  const now = Math.floor(Date.now() / 1000);
  if (phiLong.stravaTokenExpiresAt && phiLong.stravaTokenExpiresAt < now) {
    console.log('Token expired, refreshing...');
    const refreshRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID || '285643',
        client_secret: process.env.STRAVA_CLIENT_SECRET || '2fa36ff5d8c39df5cde54c20576550f50f387ae5',
        refresh_token: phiLong.stravaRefreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const refreshData = await refreshRes.json();
    if (refreshRes.ok) {
      accessToken = refreshData.access_token;
      phiLong.stravaAccessToken = refreshData.access_token;
      phiLong.stravaRefreshToken = refreshData.refresh_token;
      phiLong.stravaTokenExpiresAt = refreshData.expires_at;
      await redis.set('cnhp_challenge_data_2026', data);
      console.log('Token refreshed successfully!');
    } else {
      console.error('Failed to refresh token:', refreshData);
      return;
    }
  }

  // Get athlete clubs
  const clubsRes = await fetch('https://www.strava.com/api/v3/athlete/clubs', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const clubs = await clubsRes.json();
  console.log('Clubs of Phi Long:', JSON.stringify(clubs.map((c: any) => ({
    id: c.id,
    name: c.name,
    member_count: c.member_count,
    admin: c.admin,
    owner: c.owner,
  })), null, 2));

  if (clubs.length > 0) {
    const cnhpClub = clubs.find((c: any) => c.name.toLowerCase().includes('cnhp') || c.admin);
    const targetClub = cnhpClub || clubs[0];
    console.log('Testing activities for club:', targetClub.name, `(ID: ${targetClub.id})`);

    const clubActRes = await fetch(`https://www.strava.com/api/v3/clubs/${targetClub.id}/activities?per_page=10`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('Club activities status:', clubActRes.status);
    const clubActs = await clubActRes.json();
    console.log('Club activities response preview:', JSON.stringify(Array.isArray(clubActs) ? clubActs.slice(0, 3) : clubActs, null, 2));
  }
}

run().catch(console.error);
