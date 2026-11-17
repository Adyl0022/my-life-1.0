import { useEffect, useState } from 'react';
import { llmAvailable, llmRam, llmReadyNow, llmProgress, llmDownload, llmCancel, llmRemove, llmUnload, llmGenerate } from '../../modules/local-llm';

// "Smart chat": a small AI model that runs on the phone for questions the Assistant has no written answer for.
// Qwen2.5 0.5B Instruct (Apache 2.0), about 550 MB, downloaded once. Nothing that is asked leaves the phone.
export const SMART_URL = 'https://huggingface.co/litert-community/Qwen2.5-0.5B-Instruct/resolve/main/Qwen2.5-0.5B-Instruct_multi-prefill-seq_q8_ekv1280.task';
export const SMART_MB = 550;
const MIN_RAM = 3500; // phones with less memory cannot run it well, so the feature stays hidden there
export const smartOk = llmAvailable && llmRam() >= MIN_RAM;

let READY = llmReadyNow(); let BUSY = false; let PCT = 0;
const subs = new Set<() => void>();
const tell = () => subs.forEach((f) => { try { f(); } catch (e) { } });

export function smartReady(): boolean { return READY; }

export function useSmartChat() {
  const [, n] = useState(0);
  useEffect(() => { const f = () => n((x) => x + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  const get = async () => {
    if (BUSY) return false;
    BUSY = true; PCT = 0; tell();
    const t = setInterval(() => { const p = llmProgress(); PCT = p[1] > 0 ? Math.min(99, Math.round((p[0] / p[1]) * 100)) : 0; tell(); }, 700);
    const ok = await llmDownload(SMART_URL);
    clearInterval(t); BUSY = false; READY = ok ? llmReadyNow() : READY; PCT = 0; tell();
    return ok;
  };
  const cancel = () => { llmCancel(); };
  const del = async () => { await llmRemove(); READY = false; tell(); };
  return { ok: smartOk, ready: READY, busy: BUSY, pct: PCT, get, cancel, del };
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

function clean(t: string): string {
  let r = (t || '').replace(/<\|[^|]*\|>/g, '').replace(/^\s*(assistant|user)\s*:?\s*/i, '').trim();
  if (r.length > 700) { r = r.slice(0, 700); const i = Math.max(r.lastIndexOf('.'), r.lastIndexOf('!'), r.lastIndexOf('?')); if (i > 200) r = r.slice(0, i + 1); }
  return r;
}

// Asks the model on the phone. Returns '' when it cannot answer, so the caller can use its own fallback.
export async function smartAsk(q: string, lang: string): Promise<string> {
  if (!smartOk || !READY) return '';
  const ms = lang === 'ms';
  const sys = 'You are My Life Assistant, a friendly helper inside the My Life app, made by Adli Syahmi. '
    + 'Answer in ' + (ms ? 'Bahasa Malaysia' : 'the same language as the question') + ', in at most 4 short sentences. '
    + 'Be honest. If you are not sure, say you are not sure. Never invent facts, numbers, names or sources. '
    + 'Do not give religious rulings, medical, legal or investment advice.';
  const prompt = '<|im_start|>system\n' + sys + '<|im_end|>\n<|im_start|>user\n' + q + '<|im_end|>\n<|im_start|>assistant\n';
  const out = clean(await llmGenerate(prompt));
  if (!out) return '';
  return out + (ms ? '\n\n(Jawapan AI dalam telefon awak. Ia boleh tersilap.)' : '\n\n(An AI answer made on your phone. It can be wrong.)');
}
export { llmUnload };
