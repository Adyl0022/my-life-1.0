import { Platform } from 'react-native';
import { withNavBar } from './permNav';
import { keyOfDate } from './habit';

// Pulse from a smart watch or band. Every watch app that can share to Health Connect works the same way (Honor Health, Samsung Health, Mi Fitness, Zepp, Fitbit, Garmin Connect, Google Fit and others).
// The numbers are read on this phone only. My Life never talks to the watch itself.
export type WatchSample = { id: string; d: string; at: string; bpm: number };
export type WatchHeart = { ok: true; latest: WatchSample; avg: number; min: number; max: number; count: number; samples: WatchSample[] } | { ok: false; msg: string; needsAllow?: boolean };

const pad = (n: number) => String(n).padStart(2, '0');

/** Read the last 24 hours of pulse. With ask = true the phone's Health Connect permission pop-up is shown if needed. */
export async function readWatchHeart(ask: boolean): Promise<WatchHeart> {
  if (Platform.OS === 'web') return { ok: false, msg: 'Pulse from a watch works on the phone app only.' };
  try {
    const HC = require('react-native-health-connect');
    const st = await HC.getSdkStatus();
    if (st !== HC.SdkAvailabilityStatus.SDK_AVAILABLE) return { ok: false, msg: st === HC.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED ? 'Update Health Connect in the Play Store, then try again.' : 'Health Connect is not on this phone.' };
    await HC.initialize();
    let g = await HC.getGrantedPermissions();
    if (!g.some((x: any) => x.recordType === 'HeartRate')) {
      if (!ask) return { ok: false, msg: 'Allow My Life 1.0 to read your pulse from Health Connect.', needsAllow: true };
      g = await withNavBar(() => HC.requestPermission([{ accessType: 'read', recordType: 'HeartRate' }]));
      if (!g.some((x: any) => x.recordType === 'HeartRate')) return { ok: false, msg: 'Health Connect access for pulse was not allowed.', needsAllow: true };
    }
    const end = new Date(); const start = new Date(end.getTime() - 24 * 3600 * 1000);
    const r = await HC.readRecords('HeartRate', { timeRangeFilter: { operationType: 'between', startTime: start.toISOString(), endTime: end.toISOString() } });
    const all: { t: Date; bpm: number }[] = [];
    ((r && r.records) || []).forEach((rec: any) => (rec.samples && rec.samples.length ? rec.samples : (rec.beatsPerMinute != null ? [{ beatsPerMinute: rec.beatsPerMinute, time: rec.startTime }] : [])).forEach((s: any) => { const bpm = Math.round(Number(s.beatsPerMinute)); const t = new Date(s.time); if (bpm >= 30 && bpm <= 220 && !isNaN(t.getTime())) all.push({ t, bpm }); }));
    if (!all.length) {
      // Nothing in the last 24 hours. Look further back, so the message can say whether Health Connect has any pulse at all and from which app.
      let hint = '';
      try {
        const far = new Date(end.getTime() - 30 * 24 * 3600 * 1000);
        const r2 = await HC.readRecords('HeartRate', { timeRangeFilter: { operationType: 'between', startTime: far.toISOString(), endTime: end.toISOString() } });
        const recs: any[] = (r2 && r2.records) || [];
        const apps: string[] = []; let lastT = 0;
        recs.forEach((rec: any) => { const o = rec && rec.metadata && rec.metadata.dataOrigin; if (o && apps.indexOf(o) < 0) apps.push(o); const t = new Date(rec.endTime || rec.startTime || 0).getTime(); if (t > lastT) lastT = t; });
        if (recs.length) hint = ' Health Connect does have older pulse (last one ' + keyOfDate(new Date(lastT)) + ', from ' + (apps.map((a) => a.replace(/^com\./, '')).join(', ') || 'another app') + '), so the watch has not sent new readings. Open Samsung Health, pull down to sync, then tap Check again.';
        else hint = ' Health Connect has no pulse from any app. In Samsung Health, open Settings, Health Connect, and turn on Heart rate. Also open Health Connect, App permissions, Samsung Health, and allow it to write Heart rate.';
      } catch (e2) { /* keep the short message */ }
      return { ok: false, msg: 'No pulse in the last 24 hours.' + hint };
    }
    all.sort((a, b) => a.t.getTime() - b.t.getTime());
    const bpms = all.map((x) => x.bpm); const last = all[all.length - 1];
    // Keep one reading for every 6 hours, so the notebook does not fill up.
    const keep: Record<string, WatchSample> = {};
    // Keep the lowest reading in that stretch instead, because that is closest to your resting pulse (night or day sleep).
    all.forEach((x) => { const d = keyOfDate(x.t); const blk = Math.floor(x.t.getHours() / 6); const id = 'w6' + d + '-' + blk; const old = keep[id]; if (old && old.bpm <= x.bpm) return; keep[id] = { id, d, at: pad(x.t.getHours()) + ':' + pad(x.t.getMinutes()), bpm: x.bpm }; });
    const toS = (x: { t: Date; bpm: number }): WatchSample => ({ id: 'wl', d: keyOfDate(x.t), at: pad(x.t.getHours()) + ':' + pad(x.t.getMinutes()), bpm: x.bpm });
    return { ok: true, latest: toS(last), avg: Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length), min: Math.min(...bpms), max: Math.max(...bpms), count: all.length, samples: Object.keys(keep).map((k) => keep[k]) };
  } catch (e) { return { ok: false, msg: 'Pulse from Health Connect is not available on this phone.' }; }
}
