async function inspectClub() {
  const url = 'https://www.strava.com/clubs/1371876/leaderboard';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  });
  const html = await res.text();
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
  if (!nextDataMatch) return;
  const nextData = JSON.parse(nextDataMatch[1]);
  const club = nextData.props.pageProps.club;
  console.log('Club keys:', Object.keys(club));
  console.log('Total members:', club.memberCount);
  console.log('Members list:', club.members.nodes.map((n: any) => ({
    id: n.athlete.id,
    name: `${n.athlete.firstName} ${n.athlete.lastName}`,
    username: n.athlete.username,
  })));
  if (club.leaderboard) {
    console.log('Leaderboard:', JSON.stringify(club.leaderboard, null, 2));
  }
}

inspectClub();
