async function check() {
  const html = await fetch('https://cnhp-challenge-2026.vercel.app').then(r => r.text());
  const matches = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g)];
  console.log(`Kiểm tra ${matches.length} scripts:`);
  
  for (const m of matches) {
    const js = await fetch('https://cnhp-challenge-2026.vercel.app' + m[1]).then(r => r.text());
    console.log(`- File: ${m[1]} (Size: ${js.length} bytes)`);
    if (js.includes('286693')) {
      console.log('   ⭐ Có Client ID 2 (286693)');
    }
    if (js.includes('Cổng 2') || js.includes('Phi Long')) {
      console.log('   ⭐ Có text Cổng 2 / Phi Long');
    }
    if (js.includes('200.000') || js.includes('toggle_paid_fee')) {
      console.log('   ⭐ Có Phí 200k / toggle_paid_fee');
    }
    if (js.includes('thu_quy_qr')) {
      console.log('   ⭐ Có QR thủ quỹ');
    }
  }
}

check().catch(console.error);
