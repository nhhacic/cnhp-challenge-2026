import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';

const url = "https://national-possum-213104.upstash.io";
const token = "gQAAAAAAA0BwAAIgcDExNGMxOGY5ZjZlY2Q0OGI5ODE0OTQwY2E1YTFlZTQ5Ng";

const redis = new Redis({ url, token });

async function main() {
  console.log('Testing Upstash Redis connection...');
  const ping = await redis.ping();
  console.log('Redis PING response:', ping);

  const key = 'cnhp_challenge_data_2026';
  const existing = await redis.get(key);
  console.log('Existing data in Redis:', existing ? 'FOUND' : 'EMPTY');

  if (!existing) {
    const dataPath = path.join(process.cwd(), 'data', 'challenge_data.json');
    if (fs.existsSync(dataPath)) {
      const initial = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      await redis.set(key, initial);
      console.log(`Seeded initial data to Redis (${initial.teams.length} teams, ${initial.users.length} users, ${initial.activities.length} activities)!`);
    }
  } else {
    const data: any = existing;
    console.log(`Current Redis data has ${data.teams?.length} teams:`, data.teams?.map((t: any) => t.name));
  }
}

main().catch(console.error);
