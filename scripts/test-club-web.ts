async function testClubLeaderboard() {
  const url = 'https://www.strava.com/clubs/1371876/leaderboard';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
      }
    });
    console.log('Status:', res.status, 'Content-Type:', res.headers.get('content-type'));
    const text = await res.text();
    console.log('Response length:', text.length);
    console.log('Preview:', text.slice(0, 500));
  } catch (err) {
    console.error(err);
  }
}

testClubLeaderboard();
