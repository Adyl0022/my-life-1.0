import { Platform } from 'react-native';
import { PDF_CSS, pdfFooter, escHtml as esc, deliverPdf, fileStamp } from './exporter';
import { CATS, photosOf, worthNow, worthMine, rm, num, dmy, today, type Item, type ItemCat } from './collection';

// A list of everything you own, with price, date and a photo, as one PDF. Useful for an insurance claim or after a flood.
async function photoSrc(u: string): Promise<string> {
  if (!u) return '';
  if (u.indexOf('data:') === 0 || Platform.OS === 'web') return u;
  try { const FS: any = await import('expo-file-system/legacy'); const b = await FS.readAsStringAsync(u, { encoding: FS.EncodingType.Base64 }); return 'data:image/jpeg;base64,' + b; } catch (e) { return ''; }
}

export async function itemsPdf(items: Item[], name?: string): Promise<boolean> {
  const order: ItemCat[] = ['gadget', 'lifestyle', 'property'];
  let paid = 0, worth = 0, guessed = false; let withPhoto = 0;
  let body = '';
  for (const cat of order) {
    const list = items.filter((x) => x.cat === cat); if (!list.length) continue;
    body += '<div class="sec">' + esc(CATS[cat].title) + ' (' + list.length + ')</div><div class="cs">';
    for (const x of list) {
      const p = num(x.price); paid += p;
      const w = worthNow(x); worth += w != null ? w : p; if (w != null && !(worthMine(x) > 0)) guessed = true;
      let img = ''; if (withPhoto < 40) { const s = await photoSrc(photosOf(x)[0] || ''); if (s) { withPhoto++; img = '<img src="' + s + '" style="float:right;width:84px;height:84px;object-fit:cover;border-radius:10px;margin:0 0 6px 10px"/>'; } }
      const lines = [x.kind, x.price ? 'Paid ' + rm(p) : '', x.bought ? 'Bought ' + dmy(x.bought) : '', x.warranty ? 'Warranty ends ' + dmy(x.warranty) : '', w != null ? (worthMine(x) > 0 ? 'Worth now ' : 'Worth now (guess) ') + rm(w) : ''].filter(Boolean);
      body += '<div class="c">' + img + '<h3>' + esc(x.name) + '</h3>' + lines.map((l) => '<div class="m">' + esc(l) + '</div>').join('') + (x.note ? '<div class="m" style="margin-top:4px">' + esc(x.note) + '</div>' : '') + '</div>';
    }
    body += '</div>';
  }
  const html = '<html><head><meta charset="utf-8"><style>' + PDF_CSS + '</style></head><body><div class="ban"><h1>My things</h1><div class="s">List of what I own, ' + esc(dmy(today())) + '</div><span class="pill">' + items.length + ' items</span><span class="pill">Paid ' + esc(rm(paid)) + '</span><span class="pill">Worth now ' + (guessed ? 'about ' : '') + esc(rm(worth)) + '</span></div>'
    + body + (guessed ? '<div class="m" style="margin-top:14px">Worth now is a guess for items where no value was typed. It is not a market price.</div>' : '') + pdfFooter(name) + '</body></html>';
  return deliverPdf(html, 'Collection-my-life-export-' + fileStamp() + '.pdf');
}
