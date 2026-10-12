import { getStravaClients, getStravaClientById } from '../src/lib/strava';

console.log('--- TEST MULTI-CLIENT STRAVA OAUTH CONFIG ---');
const clients = getStravaClients();
console.log(`Số cổng Strava API đã cấu hình: ${clients.length}`);

clients.forEach((c, idx) => {
  console.log(`[Cổng ${idx + 1}] ID: ${c.id} | Tên: ${c.name} | Chủ sở hữu: ${c.owner} | Secret length: ${c.secret.length}`);
});

const client1 = getStravaClientById('285643');
const client2 = getStravaClientById('286693');

if (client1?.id === '285643' && client2?.id === '286693') {
  console.log('✅ [PASS] Cả Cổng 1 và Cổng 2 đều được nhận diện chính xác 100%!');
} else {
  console.error('❌ [FAIL] Không nhận diện đúng các cổng Strava');
  process.exit(1);
}
