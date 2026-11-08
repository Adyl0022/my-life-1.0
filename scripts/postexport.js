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
const head = `<meta name="theme-color" content="#0a0f2c"><meta name="robots" content="noindex, nofollow"><link rel="apple-touch-icon" href="${base}/ios/apple-touch-icon.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="My Life"><meta name="format-detection" content="telephone=no">${splash}<style>${css}</style><script>(function(){var n=0,t=0;function show(){var p=document.createElement("div");p.style.cssText="position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px) 0";document.body.appendChild(p);var cs=getComputedStyle(p);var st=cs.paddingTop,sb=cs.paddingBottom;document.body.removeChild(p);var r=document.getElementById("root"),rr=r?r.getBoundingClientRect():{},vv=window.visualViewport||{};var d=document.createElement("div");d.style.cssText="position:fixed;left:8px;right:8px;top:90px;z-index:2147483647;background:rgba(0,0,0,.88);color:#7CFC9A;font:12px/1.5 monospace;padding:10px;border-radius:10px;white-space:pre-wrap";d.textContent=["inner "+innerWidth+"x"+innerHeight,"screen "+screen.width+"x"+screen.height,"visualViewport "+Math.round(vv.width)+"x"+Math.round(vv.height)+" off "+Math.round(vv.offsetTop||0),"env top "+st+" bottom "+sb,"root top "+Math.round(rr.top)+" h "+Math.round(rr.height),"standalone "+navigator.standalone,"dpr "+devicePixelRatio,"scrollY "+scrollY].join("\\n");document.body.appendChild(d);setTimeout(function(){d.remove()},15000)}document.addEventListener("touchstart",function(e){var y=e.touches[0].clientY;if(y>70)return;var now=Date.now();n=now-t<1200?n+1:1;t=now;if(n>=5){n=0;show()}},{passive:true})})()</script><script>if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("${base}/sw.js")})}</script></head>`;
h = h.replace('</head>', head);
fs.writeFileSync(f, h);
const m = 'dist/manifest.webmanifest';
if (fs.existsSync(m)) {
  let t = fs.readFileSync(m, 'utf8');
  t = t.replace('"start_url": "./"', `"start_url": "${base}/"`).replace('"scope": "./"', `"scope": "${base}/"`);
  fs.writeFileSync(m, t);
}
