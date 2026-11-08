// Run after `expo export --platform web`: makes the web build an installable, full-screen app (made for iPhone "Add to Home Screen").
// Usage: node scripts/postexport.js /base/path
const fs = require('fs');
const base = process.argv[2] || '';
const f = 'dist/index.html';
let h = fs.readFileSync(f, 'utf8');
h = h.replace(/<meta name="viewport"[^>]*>/, '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />');
const css = 'html,body{height:100%;width:100%;margin:0;padding:0;overflow:hidden;overscroll-behavior:none;background:#0a0f2c;touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-text-size-adjust:100%}' +
  'body{position:fixed;left:0;top:0;right:0;bottom:0}#root{position:fixed;left:0;top:0;right:0;bottom:0;overflow:hidden;overscroll-behavior:none}' +
  '*::-webkit-scrollbar{display:none;width:0;height:0}*{scrollbar-width:none}' +
  'input,textarea{-webkit-user-select:text;user-select:text;font-size:16px}';
const splash = `<link rel="apple-touch-startup-image" media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)" href="${base}/ios/splash-1320x2868.png">`;
const head = `<link rel="manifest" href="${base}/manifest.webmanifest"><meta name="theme-color" content="#0a0f2c"><meta name="robots" content="noindex, nofollow"><link rel="apple-touch-icon" href="${base}/ios/apple-touch-icon.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="My Life"><meta name="format-detection" content="telephone=no">${splash}<style>${css}</style><script>if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("${base}/sw.js")})}</script></head>`;
h = h.replace('</head>', head);
fs.writeFileSync(f, h);
const m = 'dist/manifest.webmanifest';
if (fs.existsSync(m)) {
  let t = fs.readFileSync(m, 'utf8');
  t = t.replace('"start_url": "./"', `"start_url": "${base}/"`).replace('"scope": "./"', `"scope": "${base}/"`);
  fs.writeFileSync(m, t);
}
