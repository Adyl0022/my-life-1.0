# Builds public/privacy.html from src/lib/legal.ts so the web page and the in-app text never drift apart.
import re, html, datetime
s = open('src/lib/legal.ts').read()
def grab(name):
    b = s.split('export const ' + name)[1].split('];')[0]
    return [(h.replace("\\'", "'"), p.replace("\\'", "'")) for h, p in re.findall(r"\{ h: '((?:[^'\\]|\\.)*)', p: '((?:[^'\\]|\\.)*)' \}", b)]
email = re.search(r"SUPPORT_EMAIL = '([^']+)'", s).group(1)
e = html.escape
COL = {
 'What we store': ('#4f8cff', '#2f6bff'), 'Where it lives': ('#22b8d8', '#1a8fc0'), 'What we never do': ('#ff7a6b', '#e5484d'), 'Location': ('#34c8f0', '#1e9be0'),
 'App lock': ('#ffb454', '#f08a24'), 'Your control': ('#34d399', '#12a58a'), 'Contact': ('#8fa8c0', '#5f7a96'),
 'Using My Life': ('#4f8cff', '#2f6bff'), 'Your content': ('#34d399', '#12a58a'), 'Religious content': ('#2fcf9a', '#0f9e72'), 'Assistant': ('#34c8f0', '#1e9be0'),
 'No warranty': ('#ffb454', '#f08a24'), 'Changes': ('#8fa8c0', '#5f7a96'),
}
FALL = [('#4f8cff', '#2f6bff'), ('#34d399', '#12a58a'), ('#ffb454', '#f08a24'), ('#ff7a6b', '#e5484d'), ('#34c8f0', '#1e9be0')]
def col(h, i): return COL.get(h, FALL[(i - 1) % len(FALL)])
def sec(prefix, items):
    out = ''
    for i, (h, p) in enumerate(items, 1):
        c1, c2 = col(h, i)
        out += f'<article class="card" id="{prefix}-{i}"><span class="num" style="background:linear-gradient(135deg,{c1},{c2})">{i}</span><div><h3>{e(h)}</h3><p>{e(p)}</p></div></article>'
    return out
def toc(prefix, items):
    return ''.join(f'<a href="#{prefix}-{i}">{e(h)}</a>' for i, (h, _) in enumerate(items, 1))
P, T = grab('PRIVACY'), grab('TERMS')
today = datetime.date.today().strftime('%B %Y')
ICON = {
 'phone': '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
 'shield': '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
 'hand': '<path d="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"/><path d="M8.5 12.5l2.4 2.4 4.6-5"/>',
}
def ic(k): return f'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{ICON[k]}</svg>'
MOTION_CSS = r'''
.rv{opacity:0;transform:translateY(26px)}
.rv.in{opacity:1;transform:none;transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1);transition-delay:var(--d,0s)}
@media(prefers-reduced-motion:no-preference){
.b1{animation:dr1 16s ease-in-out infinite alternate}.b2{animation:dr2 19s ease-in-out infinite alternate}
@keyframes dr1{to{transform:translate(-60px,70px) scale(1.15)}}@keyframes dr2{to{transform:translate(70px,-60px) scale(1.12)}}
nav{animation:nv .7s cubic-bezier(.2,.7,.2,1) both}@keyframes nv{from{transform:translateY(-100%)}}
.logo{animation:lg .9s cubic-bezier(.2,.8,.2,1) both,fl 6s ease-in-out .9s infinite}
@keyframes lg{from{opacity:0;transform:scale(.6) translateY(14px)}}@keyframes fl{50%{transform:translateY(-7px)}}
.hero h1{animation:up .8s .15s cubic-bezier(.2,.7,.2,1) both;background:linear-gradient(90deg,#fff,#b8f5e6);-webkit-background-clip:text;background-clip:text;color:transparent}
.hero .sub{animation:up .8s .3s cubic-bezier(.2,.7,.2,1) both}.hero .meta{animation:up .8s .45s cubic-bezier(.2,.7,.2,1) both}
@keyframes up{from{opacity:0;transform:translateY(22px)}}
.hl div{transition:transform .35s,border-color .35s}.hl div:hover{transform:translateY(-4px);border-color:rgba(45,212,167,.5)}
.hl i{animation:bp 3.6s ease-in-out infinite}.hl .c2 i{animation-delay:.5s}.hl .c3 i{animation-delay:1s}
@keyframes bp{50%{transform:scale(1.1) rotate(-4deg)}}
.card{transition:transform .35s,border-color .35s,background .35s}.card:hover{transform:translateY(-3px);border-color:rgba(45,212,167,.4);background:rgba(255,255,255,.1)}
.card.in .num{animation:pop .6s .15s cubic-bezier(.3,1.6,.5,1) both}@keyframes pop{from{transform:scale(0) rotate(-40deg)}}
.toc a{transition:transform .25s,background .25s}.toc a:active{transform:scale(.94)}
.btn{position:relative;overflow:hidden;transition:transform .25s}.btn:active{transform:scale(.95)}
.btn:after{content:"";position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:sh 3.8s ease-in-out infinite}
@keyframes sh{0%,55%{left:-60%}100%{left:130%}}
.contact{animation:cg 5s ease-in-out infinite alternate}@keyframes cg{to{box-shadow:0 0 50px rgba(45,212,167,.25)}}
}
@media(prefers-reduced-motion:reduce){.rv{opacity:1;transform:none}}
@media(max-width:860px),(pointer:coarse){.card,.hl div{backdrop-filter:none;-webkit-backdrop-filter:none}nav{backdrop-filter:none;-webkit-backdrop-filter:none;background:rgba(6,18,28,.94)}.blob{filter:none;opacity:.35}.b1,.b2{animation:none}}
'''
MOTION_JS = r'''
(function(){
var els=document.querySelectorAll('.hl div,.card,.contact,h2,.toc');
els.forEach(function(e,i){e.classList.add('rv');e.style.setProperty('--d',(i%3)*.07+'s')});
if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
var io=new IntersectionObserver(function(a){a.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
els.forEach(function(e){io.observe(e)});
})();
'''
page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>My Life 1.0 · Privacy Policy and Terms</title><link rel="icon" href="icon.png"><meta name="description" content="How My Life 1.0 handles your data. Everything stays on your phone.">
<style>
:root{{--bg:#06121c;--tx:#eef8fb;--dim:#9db6c2;--line:rgba(255,255,255,.11);--g1:#2dd4a7;--g2:#22b8d8;--g3:#3b82f6}}
*{{box-sizing:border-box}}html{{scroll-behavior:smooth}}
body{{margin:0;font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--tx);background:var(--bg);min-height:100vh;position:relative;overflow-x:hidden}}
body:before{{content:"";position:fixed;inset:0;z-index:-2;background:linear-gradient(165deg,#06121c,#0a2230 55%,#0b3140)}}
.blob{{position:fixed;z-index:-1;border-radius:50%;filter:blur(70px);opacity:.5}}.b1{{width:380px;height:380px;right:-120px;top:-80px;background:#0e9f8e}}.b2{{width:340px;height:340px;left:-130px;bottom:-60px;background:#1d6fd8;opacity:.3}}
nav{{position:sticky;top:0;z-index:5;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);background:rgba(6,18,28,.72);border-bottom:1px solid var(--line)}}
nav div{{max-width:780px;margin:0 auto;padding:12px 20px;display:flex;align-items:center;gap:6px}}
nav b{{margin-right:auto;font-size:15px;letter-spacing:-.2px}}nav a{{color:var(--dim);text-decoration:none;font-size:13.5px;padding:6px 12px;border-radius:999px}}nav a:hover{{color:#fff;background:rgba(255,255,255,.1)}}
main{{max-width:780px;margin:0 auto;padding:0 20px 60px}}
.hero{{text-align:center;padding:54px 0 30px}}
.logo{{display:block;width:84px;height:84px;margin:0 auto 18px;border-radius:22%;box-shadow:0 14px 40px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.14)}}
h1{{margin:0;font-size:clamp(30px,6vw,44px);letter-spacing:-1px;line-height:1.15}}
.sub{{margin:12px auto 0;max-width:520px;color:var(--dim)}}.meta{{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:18px}}.chip{{display:inline-block;text-align:center;padding:6px 14px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid var(--line);font-size:12.5px;color:#d9f3ee}}
.hl{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:26px 0 8px}}
.hl div{{background:rgba(255,255,255,.07);border:1px solid var(--line);border-radius:20px;padding:18px 16px;backdrop-filter:blur(10px)}}
.hl i{{display:grid;place-items:center;width:40px;height:40px;border-radius:13px;margin-bottom:10px}}.hl .c1 i{{background:linear-gradient(135deg,#4f8cff,#2f6bff)}}.hl .c2 i{{background:linear-gradient(135deg,#ff9a5c,#ef5b5b)}}.hl .c3 i{{background:linear-gradient(135deg,#34d399,#12a58a)}}.hl svg{{width:22px;height:22px}}
.hl b{{display:block;font-size:15px}}.hl span{{font-size:13px;color:var(--dim)}}
h2{{margin:46px 0 6px;font-size:26px;letter-spacing:-.5px}}h2+p{{margin:0 0 16px;color:var(--dim);font-size:14px}}
.toc{{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px}}.toc a{{font-size:12.5px;color:#d9f3ee;text-decoration:none;padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.06)}}.toc a:hover{{background:rgba(255,255,255,.14)}}
.card{{display:flex;gap:16px;background:rgba(255,255,255,.07);border:1px solid var(--line);border-radius:22px;padding:20px 22px;margin:0 0 12px;backdrop-filter:blur(10px);scroll-margin-top:76px}}
.num{{flex:0 0 34px;height:34px;border-radius:12px;display:grid;place-items:center;font-weight:800;font-size:15px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.25)}}
.card h3{{margin:2px 0 4px;font-size:17px}}.card p{{margin:0;color:#cfe2e8;font-size:15px}}
.contact{{margin-top:46px;text-align:center;padding:30px 22px;border-radius:26px;background:linear-gradient(135deg,rgba(45,212,167,.22),rgba(34,184,216,.18));border:1px solid var(--line)}}
.contact h2{{margin:0 0 6px}}.contact p{{margin:0 0 16px;color:#d9f3ee}}.btn{{display:inline-block;padding:12px 24px;border-radius:999px;background:linear-gradient(135deg,var(--g1),var(--g2));color:#04201c;font-weight:800;text-decoration:none;box-shadow:0 8px 24px rgba(45,212,167,.3)}}
footer{{text-align:center;color:#7f9aa6;font-size:12.5px;margin-top:34px}}
@media(max-width:620px){{.hl{{grid-template-columns:1fr}}.card{{padding:16px}}nav a.h{{display:none}}}}
</style><style>{MOTION_CSS}</style></head><body><div class="blob b1"></div><div class="blob b2"></div>
<nav><div><b>My Life 1.0</b><a href="#privacy">Privacy</a><a href="#terms">Terms</a><a href="#contact" class="h">Contact</a></div></nav>
<main>
<header class="hero"><img class="logo" src="icon.png" alt="My Life 1.0 app icon" width="84" height="84"><h1>Your data stays yours</h1><p class="sub">What My Life 1.0 stores, where it lives, and how you control it.</p><div class="meta"><span class="chip">Developer: Adli Syahmi</span><span class="chip">Last updated {today}</span></div></header>
<section class="hl"><div class="c1"><i>{ic('phone')}</i><b>Phone first</b><span>Saved and encrypted on your phone.</span></div><div class="c2"><i>{ic('shield')}</i><b>No ads, no tracking</b><span>Your data is never sold.</span></div><div class="c3"><i>{ic('hand')}</i><b>You are in control</b><span>Export or erase everything at any time.</span></div></section>
<section id="privacy"><h2>Privacy Policy</h2><p>What we store and why.</p><div class="toc">{toc('p', P)}</div>{sec('p', P)}</section>
<section id="terms"><h2>Terms of Use</h2><p>The simple rules for using the app.</p><div class="toc">{toc('t', T)}</div>{sec('t', T)}</section>
<section class="contact" id="contact"><h2>Questions?</h2><p>Write to the developer about privacy, a problem or an idea.</p><a class="btn" href="mailto:{email}">{email}</a></section>
<footer>© 2026 Adli Syahmi. All rights reserved.</footer>
</main><script>{MOTION_JS}</script></body></html>'''
open('public/privacy.html', 'w').write(page)
print(len(page))
