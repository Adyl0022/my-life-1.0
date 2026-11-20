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
    ((r && r.records) || []).forEach((rec: any) => (rec.samples || []).forEach((s: any) => { const bpm = Math.round(Number(s.beatsPerMinute)); const t = new Date(s.time); if (bpm >= 30 && bpm <= 220 && !isNaN(t.getTime())) all.push({ t, bpm }); }));
    if (!all.length) return { ok: false, msg: 'No pulse in Health Connect yet. In your watch app, turn on sharing to Health Connect for Heart rate, let the watch sync, then tap Check again.' };
    all.sort((a, b) => a.t.getTime() - b.t.getTime());
    const bpms = all.map((x) => x.bpm); const last = all[all.length - 1];
    // Keep one reading for every 3 hours (the newest in that stretch), so the notebook does not fill up.
    const keep: Record<string, WatchSample> = {};
    // For the night (midnight to 6 am) keep the lowest reading instead, because that is closest to your resting pulse.
    all.forEach((x) => { const d = keyOfDate(x.t); const blk = Math.floor(x.t.getHours() / 3); const id = 'w' + d + '-' + blk; const old = keep[id]; if (blk < 2 && old && old.bpm <= x.bpm) return; keep[id] = { id, d, at: pad(x.t.getHours()) + ':' + pad(x.t.getMinutes()), bpm: x.bpm }; });
    const toS = (x: { t: Date; bpm: number }): WatchSample => ({ id: 'wl', d: keyOfDate(x.t), at: pad(x.t.getHours()) + ':' + pad(x.t.getMinutes()), bpm: x.bpm });
    return { ok: true, latest: toS(last), avg: Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length), min: Math.min(...bpms), max: Math.max(...bpms), count: all.length, samples: Object.keys(keep).map((k) => keep[k]) };
  } catch (e) { return { ok: false, msg: 'Pulse from Health Connect is not available on this phone.' }; }
}
