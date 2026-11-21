import { useEffect, useState } from 'react';
import { getItem, setItem } from './store';
import { gemAvailable, gemReadyNow, gemPartial, gemProgress, gemDownload, gemCancel, gemRemove, gemUnload, gemGenerate, gemLive, gemWarm } from '../../modules/local-gemma';
import { llmAvailable, llmRam, llmReadyNow, llmProgress, llmDownload, llmCancel, llmRemove, llmUnload, llmGenerate, llmLive, llmWarm } from '../../modules/local-llm';

// "Smart chat": a small AI model that runs on the phone for questions the Assistant has no written answer for.
// Qwen2.5 0.5B Instruct (Apache 2.0), about 550 MB, downloaded once. Nothing that is asked leaves the phone.
export const SMART_URL = 'https://huggingface.co/litert-community/Qwen2.5-0.5B-Instruct/resolve/main/Qwen2.5-0.5B-Instruct_multi-prefill-seq_q8_ekv1280.task';
export const SMART_MB = 550;
// "Smart chat+": Qwen2.5 1.5B Instruct, about 1.6 GB. Better sentences and Malay, but only offered to phones with plenty of memory.
export const PLUS_URL = 'https://huggingface.co/litert-community/Qwen2.5-1.5B-Instruct/resolve/main/Qwen2.5-1.5B-Instruct_multi-prefill-seq_q8_ekv1280.task';
export const PLUS_MB = 1600;
// "Smart chat Max", for phones with about 12 GB of memory or more. Two models to compare (both Apache 2.0, both run with Google LiteRT-LM):
// Gemma 4 E4B (about 3.7 GB) and Qwen 3.5 4B int8 (about 4.4 GB).
export const GEMMA_URL = 'https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/main/gemma-4-E4B-it.litertlm';
export const GEMMA_MB = 3650;
export const QWEN_URL = 'https://huggingface.co/litert-community/Qwen3.5-4B/resolve/main/Qwen3.5-4B_int8.litertlm';
export const QWEN_MB = 4420;
const MIN_RAM = 3500; // phones with less memory cannot run it well, so the feature stays hidden there
const PLUS_RAM = 5500; // a 6 GB phone reports a little under 6000
const GEMMA_RAM = 10500; // a 12 GB phone reports a little under 12000
export const smartOk = llmAvailable && llmRam() >= MIN_RAM;
export const plusOk = llmAvailable && llmRam() >= PLUS_RAM;
export const gemmaOk = gemAvailable && llmRam() >= GEMMA_RAM;

// Which model is on the phone: 's' Qwen 0.5B, 'p' Qwen 1.5B, 'g' Gemma 4, 'q' Qwen 3.5 4B. Only one is kept, to save space.
let TIER: 's' | 'p' | 'g' | 'q' = gemReadyNow() ? 'g' : 's';
let READY = gemReadyNow() || llmReadyNow(); let BUSY = false; let PCT = 0;
getItem('ml_smtier', '').then((v: any) => { if ((v === 'g' || v === 'q') && gemReadyNow()) TIER = v; else if ((v === 'p' || v === 's') && llmReadyNow()) TIER = v; });
const subs = new Set<() => void>();
const tell = () => subs.forEach((f) => { try { f(); } catch (e) { } });

let SPEED = 0, ETA = 0, DONE_MB = 0, TOTAL_MB = 0;
export function smartReady(): boolean { return READY; }
export function smartModelName(): string { return ({ s: 'Qwen 2.5 0.5B', p: 'Qwen 2.5 1.5B', g: 'Gemma 4', q: 'Qwen 3.5' } as any)[TIER] || ''; }

export function useSmartChat() {
  const [, n] = useState(0);
  useEffect(() => { const f = () => n((x) => x + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  const get = async (which?: 'p' | 'g' | 'q') => {
    if (BUSY) return false;
    if (which === 'p' && !plusOk) return false;
    if ((which === 'g' || which === 'q') && !gemmaOk) return false;
    BUSY = true; PCT = 0; tell();
    await llmUnload(); await gemUnload(); // free the memory of the old model before the new one arrives
    const big = which === 'g' || which === 'q';
    const prog = () => (big ? gemProgress() : llmProgress());
    let lastB = prog()[0], lastT = Date.now(), sp = 0;
    SPEED = 0; ETA = 0; DONE_MB = 0; TOTAL_MB = 0;
    const t = setInterval(() => {
      const p = prog(); PCT = p[1] > 0 ? Math.min(99, Math.round((p[0] / p[1]) * 100)) : 0;
      const now = Date.now(), dt = (now - lastT) / 1000;
      if (dt > 0) { const inst = Math.max(0, p[0] - lastB) / dt; sp = sp ? sp * 0.7 + inst * 0.3 : inst; }
      lastB = p[0]; lastT = now;
      SPEED = sp / 1048576; DONE_MB = Math.round(p[0] / 1048576); TOTAL_MB = Math.round(p[1] / 1048576);
      ETA = sp > 0 && p[1] > p[0] ? Math.round((p[1] - p[0]) / sp) : 0;
      tell();
    }, 700);
    const ok = big ? await gemDownload(which === 'q' ? QWEN_URL : GEMMA_URL) : await llmDownload(which === 'p' ? PLUS_URL : SMART_URL);
    clearInterval(t); BUSY = false; PCT = 0; SPEED = 0; ETA = 0;
    if (ok) {
      TIER = which === 'g' ? 'g' : which === 'q' ? 'q' : which === 'p' ? 'p' : 's';
      setItem('ml_smtier', TIER);
      // Only one model is kept, so the other kind is removed.
      if (big) await llmRemove(); else await gemRemove();
      READY = true;
    } else READY = gemReadyNow() || llmReadyNow();
    tell();
    return ok;
  };
  const cancel = () => { llmCancel(); gemCancel(); };
  const del = async () => { await llmRemove(); await gemRemove(); READY = false; setItem('ml_smtier', 's'); TIER = 's'; tell(); };
  return { ok: smartOk || gemmaOk, plusOk, gemmaOk, tier: TIER, ready: READY, busy: BUSY, pct: PCT, speed: SPEED, eta: ETA, doneMB: DONE_MB, totalMB: TOTAL_MB, resumeMB: Math.round(gemPartial() / 1048576), get, cancel, del };
}

// Topics where a small model must not guess: religious rulings, medicine, law and money advice. Answered with a fixed, careful reply.
export function sensitiveReply(q: string, lang: string): string {
  const ms = lang === 'ms';
  if (/\b(halal|haram|hukum|fatwa|dosa|pahala|hadis|hadith|sunat|makruh|syubhah|bid.?ah|ruling|permissible)\b/i.test(q))
    return ms ? 'Soalan hukum agama perlu dijawab oleh ustaz atau pihak berkuasa agama yang bertauliah. Saya tak mahu meneka dan tersilap. Awak boleh rujuk mufti negeri atau portal rasmi seperti e-Fatwa JAKIM.' : 'Questions about religious rulings should be answered by a qualified scholar or religious authority. I do not want to guess and get it wrong. You can ask your state mufti or an official source such as the JAKIM e-Fatwa portal.';
  if (/\b(diagnos|symptom|simptom|penyakit|disease|cancer|kanser|dos ubat|dosage|overdose|ubat apa|what medicine|which medicine|rawatan|treatment|pregnan|mengandung)\b/i.test(q))
    return ms ? 'Soalan kesihatan seperti ini perlu dijawab oleh doktor atau ahli farmasi. Saya tak boleh mendiagnos dan jawapan yang salah boleh membahayakan. Kalau teruk atau mendesak, terus ke klinik atau hospital.' : 'A health question like this should be answered by a doctor or pharmacist. I cannot diagnose, and a wrong answer could be harmful. If it is serious or urgent, go to a clinic or hospital.';
  if (/\b(saham|stock|invest|pelaburan|crypto|kripto|forex|undang.?undang|saman|mahkamah|court|lawsuit|sue|legal advice|tax advice|cukai)\b/i.test(q))
    return ms ? 'Nasihat pelaburan, cukai dan undang-undang perlu datang daripada pakar yang bertauliah. Saya boleh bantu lihat belanja dan baki awak sendiri, tetapi saya tak mahu beri nasihat yang boleh merugikan awak.' : 'Investment, tax and legal advice should come from a qualified professional. I can help you look at your own spending and balance, but I do not want to give advice that could cost you.';
  return '';
}

// Questions about "now": news, who holds a post today, prices, scores, weather. The phone has no internet and the small model's knowledge is old,
// so it is told plainly instead of being allowed to make something up.
export function currentReply(q: string, lang: string): string {
  const t = (q || '').toLowerCase();
  const yr = /\b20(2[5-9]|3\d)\b/.test(t);
  const now = /\b(sekarang|semasa|terkini|kini|baru-baru ini|minggu ini|bulan ini|tahun ini|berita|harga|skor|keputusan|cuaca|current|currently|latest|right now|this week|this year|news|price of|score|weather|who won)\b/.test(t);
  const post = /\b(perdana menteri|menteri|presiden|timbalan|ketua|ceo|prime minister|minister|president|governor|mp)\b/.test(t) && (/\b(sekarang|semasa|kini|current|now|who is|siapa)\b/.test(t) || yr);
  if (!(now || post || (yr && /\b(siapa|who|berapa|how much|apa|what)\b/.test(t)))) return '';
  return lang === 'ms'
    ? 'Saya tak ada internet, jadi saya tak tahu maklumat terkini seperti berita, jawatan semasa, harga, skor atau cuaca. Kalau saya cuba jawab, saya mungkin reka dan tersilap. Untuk perkara seperti ini, semak laman rasmi, aplikasi berita atau carian web.'
    : 'I have no internet, so I do not know current information such as news, who holds a post now, prices, scores or weather. If I tried to answer I might make something up. For this, check an official website, a news app or a web search.';
}

function clean(t: string, max = 900): string {
  let r = dedupe((t || '').replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').replace(/<\|[^|]*\|>/g, '').replace(/^\s*(assistant|user)\s*:?\s*/i, '')).trim();
  if (r.length > max) { r = r.slice(0, max); const i = Math.max(r.lastIndexOf('.'), r.lastIndexOf('!'), r.lastIndexOf('?')); if (i > 200) r = r.slice(0, i + 1); }
  return r;
}

// Asks the model on the phone. Returns '' when it cannot answer, so the caller can use its own fallback.
// What kind of request it is, so the AI gets the right instruction.
function kindOf(q: string): string {
  if (q.length > 160 || /\b(summari[sz]e|summary|rewrite|paraphrase|proofread|ringkaskan|ringkasan|rumuskan|tulis semula)\b/i.test(q)) return 'text';
  if (/```|\b(code|coding|function|script|bug|error|exception|python|javascript|typescript|java|kotlin|react|sql|html|css|regex|api|program|compile|kod|aturcara)\b/i.test(q)) return 'code';
  if (/\b(translate|terjemah|terjemahkan)\b/i.test(q)) return 'translate';
  if (/\b(what do you think|your opinion|do you think|should i|which is better|better than|pendapat|patut ke|patutkah|mana lebih baik|awak rasa|kau rasa)\b/i.test(q)) return 'opinion';
  if (/\b(explain|how does|how do|why|terangkan|kenapa|mengapa|macam mana|bagaimana)\b/i.test(q)) return 'explain';
  if (q.length < 28 && /\b(hi|hello|hey|hai|helo|assalamualaikum|apa khabar|how are you|thanks|terima kasih|bored|boring)\b/i.test(q)) return 'chat';
  return 'general';
}
const KIND_RULE: { [k: string]: string } = {
  text: 'The person pasted a text or asked for a summary: reply as short bullet points (at most 6), one idea each. ',
  code: 'For code: give correct, complete code in a code block first, then explain it briefly. If something essential is missing, ask one short question. ',
  translate: 'For a translation: give the translation first, then add a short note only if it helps. ',
  opinion: 'When asked for an opinion: give a clear recommendation first, then two or three short reasons, and mention one trade-off. ',
  explain: 'When explaining: use simple words, go step by step, and add one everyday example. ',
  chat: 'This is casual talk: reply briefly and warmly like a friend, and end with a short friendly question. ',
  general: '',
};

// A small model sometimes repeats the same sentence again and again. Keep the first time only.
function dedupe(t: string): string {
  const seen = new Set<string>();
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9\u00c0-\uffff]+/g, ' ').trim();
  const paras = t.split(/\n{2,}/).map((para) => {
    if (/```/.test(para)) return para;
    const sents = para.match(/[^.!?]+[.!?]*\s*/g) || [para];
    const keep = sents.filter((x) => {
      const k = norm(x); if (k.length < 12) return true;
      if (k.length >= 30) { for (const o of seen) { if (o.length >= 30 && (o.includes(k) || k.includes(o) || (k.length >= 50 && o.includes(k.slice(0, 50))))) return false; } }
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
    return keep.join('').trim();
  }).filter((x) => x.trim());
  return paras.join('\n\n');
}

// A small model sometimes just repeats the instructions it was given. That is never an answer.
function echoed(t: string): boolean { return /You are My Life Assistant|Talk like a thoughtful friend|Earlier in this chat|Now reply ONLY|^\s*User:/im.test((t || '').slice(0, 600)); }

// Text with the model's private "thinking" and special tokens removed, safe to show while it is still being written.
function livePart(t: string): string {
  if (echoed(t)) return '';
  return dedupe((t || '').replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').replace(/<\|[^|]*\|?>?/g, '').replace(/^\s*(assistant|user)\s*:?\s*/i, '').trimStart());
}

// Warms the model up in the background (call when the Assistant opens), so the first question is not slow.
let WARMED = '';
export function smartWarm() {
  if (!(smartOk || gemmaOk) || !READY || WARMED === TIER) return;
  WARMED = TIER;
  const big = TIER === 'g' || TIER === 'q';
  (big ? gemWarm() : llmWarm()).then((ok) => { if (!ok) WARMED = ''; }).catch(() => { WARMED = ''; });
}

// Runs the AI on the phone with its own instructions and gives back the raw text. Used to read a spending out of a free sentence.
export async function smartRaw(user: string, sys: string): Promise<string> {
  if (!(smartOk || gemmaOk) || !READY) return '';
  try {
    if (TIER === 'g' || TIER === 'q') return String(await gemGenerate(user, sys) || '');
    return String(await llmGenerate('<|im_start|>system\n' + sys + '<|im_end|>\n<|im_start|>user\n' + user + '<|im_end|>\n<|im_start|>assistant\n') || '');
  } catch (e) { return ''; }
}

export async function smartAsk(q: string, lang: string, hist: { me: boolean; text: string }[] = [], onPart?: (t: string) => void, voice = false, ctx = ''): Promise<string> {
  if (!(smartOk || gemmaOk) || !READY) return '';
  const ms = lang === 'ms';
  const big = TIER === 'g' || TIER === 'q';
  const kind = kindOf(q); const task = kind === 'text';
  const sys = 'You are My Life Assistant, a warm, clear and helpful AI inside the My Life app, made by Adli Syahmi. '
    + 'Talk like a thoughtful friend: answer questions, explain things step by step, write and fix code (put code in a code block), give your own opinion with short reasons when asked, brainstorm, and chat naturally. '
    + 'Answer in ' + (ms ? 'Bahasa Malaysia' : 'the same language as the question') + '. '
    + KIND_RULE[kind]
    + (ctx ? 'Below is the person\'s own saved data from the app. When the question is about them (money, spending, habits, tasks, plans, documents), answer ONLY from this data, quote the numbers exactly as written, do simple sums carefully, and if the answer is not in the data say you do not see it in their records. Never make up numbers. For any other question ignore it.\nDATA:\n' + ctx + '\nEND OF DATA.\n' : '')
    + (task || kind === 'code' || kind === 'chat' ? '' : (big ? 'Be thorough but not long-winded: a few short paragraphs or a short list is fine. ' : 'Keep it short and clear: up to 6 sentences. '))
    + (/\b(today|now|current|currently|latest|news|price|score|weather|president|prime minister|minister|sekarang|terkini|hari ini|harga|presiden|perdana menteri)\b/i.test(q) ? 'You have no internet and your facts may be out of date. Answer with what you know, and add one short note about that, only once. ' : '')
    + (voice ? 'This is a spoken conversation, so your words are read aloud: answer in one to three short, natural sentences, like a friend talking. No lists, no code, no headings and no marks such as asterisks. When asked for an opinion, give one with a short reason. ' : '')
    + 'Be honest. If you are not sure, say so once in a short sentence, then give what you do know. Never repeat yourself. Never invent facts, numbers, dates, names or sources. '
    + 'For religious rulings, medical, legal or investment decisions, give only general information and suggest asking a qualified person.';
  // Earlier messages are only given when this one looks like a follow-up. A new, self-contained question (or a pasted text) is answered on its own,
  // otherwise a small model mixes the old answer into the new one.
  const follow = q.length < 30 || /\b(it|that|this|those|them|again|more|else|also|itu|tu|ni|nie|tadi|lagi|dia|pasal|bukan|betul|salah|not what|i meant|maksud)\b/i.test(q);
  const h = voice ? (hist || []).slice(-6).map((x) => ({ me: x.me, text: x.text.slice(0, 260) })) : follow && !task ? (hist || []).slice(-2).map((x) => ({ me: x.me, text: x.text.slice(0, 220) })) : [];
  const wrong = /\b(bukan|salah|not what|wrong|i meant|maksud saya|bukan tu)\b/i.test(q);
  // While the model writes, the app reads what it has so far, so the words appear one by one.
  let timer: any = 0; let last = '';
  if (onPart) timer = setInterval(() => { try { const t = livePart(big ? gemLive() : llmLive()); if (t && t !== last) { last = t; onPart(t); } } catch (e) { /* ignore */ } }, 400);
  let raw = '';
  try {
    if (big) {
      const past = h.length ? 'Earlier in this chat (context only, never repeat it):\n' + h.map((x) => (x.me ? 'User: ' : 'Assistant: ') + x.text).join('\n') + '\n\nNow reply ONLY to the new message below.\n' + (wrong ? 'The person says your last answer was not what they wanted: say sorry in a few words and answer their new message, or ask what they meant. Do not repeat the earlier answer.\n' : '') + '\n' : '';
      // The instructions go in as the real system message, so the model does not mistake them for part of the question.
      raw = await gemGenerate(past ? past + 'New message: ' + q : q, sys);
    } else {
      const past = h.map((x) => '<|im_start|>' + (x.me ? 'user' : 'assistant') + '\n' + x.text + '<|im_end|>\n').join('');
      raw = await llmGenerate('<|im_start|>system\n' + sys + '<|im_end|>\n' + past + '<|im_start|>user\n' + q + '<|im_end|>\n<|im_start|>assistant\n');
    }
    // The model repeated its instructions instead of answering: ask again with only the question.
    if (echoed(raw)) {
      const plain = (ms ? 'Jawab dalam Bahasa Malaysia, ringkas dan jelas. Soalan: ' : 'Answer clearly and briefly. Question: ') + q;
      raw = big ? await gemGenerate(plain) : await llmGenerate('<|im_start|>user\n' + plain + '<|im_end|>\n<|im_start|>assistant\n');
    }
  } finally { if (timer) clearInterval(timer); }
  if (echoed(raw)) return '';
  const out = clean(raw, big ? 6000 : 1400);
  if (!out) return '';
  const fact = !task && /\b(siapa|who|bila|when|berapa|how many|how much|tahun|year|kali pertama|first)\b/i.test(q);
  if (voice) return out;
  return out + (ms
    ? '\n\n(Jawapan AI dalam telefon awak. Ia boleh tersilap' + (fact ? ', terutama tentang orang, tarikh dan angka' : '') + '. Semak fakta penting dengan sumber rasmi.)'
    : '\n\n(An AI answer made on your phone. It can be wrong' + (fact ? ', especially about people, dates and numbers' : '') + '. Check important facts with an official source.)');
}
export { llmUnload };
