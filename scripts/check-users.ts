import { Redis } from '@upstash/redis';

const url = "https://national-possum-213104.upstash.io";
const token = "gQAAAAAAA0BwAAIgcDExNGMxOGY5ZjZlY2Q0OGI5ODE0OTQwY2E1YTFlZTQ5Ng";

const redis = new Redis({ url, token });

async function check() {
  const data: any = await redis.get('cnhp_challenge_data_2026');
  if (!data) {
    console.log('No data found in Redis');
    return;
  }
  console.log(`Found ${data.users?.length} users:`);
  data.users.forEach((u: any) => {
    console.log(`- ${u.id}: ${u.name} (StravaId: ${u.stravaId || 'none'}, Token: ${u.stravaAccessToken ? 'YES' : 'NO'}, Captain: ${u.isCaptain})`);
  });
}

check().catch(console.error);
