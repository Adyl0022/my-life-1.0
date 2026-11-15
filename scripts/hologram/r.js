const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const p = await b.newPage();
  p.on('pageerror', (e) => console.log('ERR', e.message)); await p.goto('http://localhost:8098/r.html'); await p.waitForFunction('window.ready === true');
  const N = +process.argv[2]; fs.mkdirSync('out', { recursive: true });
  for (let i = 0; i < N; i++) { const d = await p.evaluate((a) => window.shot(a), (360 / N) * i); fs.writeFileSync('out/f' + String(i).padStart(2, '0') + '.png', Buffer.from(d.split(',')[1], 'base64')); }
  await b.close(); })();
