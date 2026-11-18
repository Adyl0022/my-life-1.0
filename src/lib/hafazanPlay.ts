import { Platform } from 'react-native';
import { fallbackUrl } from './quranFallback';

// Plays one verse (Mishary Alafasy via EveryAyah) so the person can listen first, then repeat it.
let player: any = null;
let done: (() => void) | null = null;

export async function playVerse(surah: number, ayah: number): Promise<boolean> {
  stopVerse();
  if (Platform.OS === 'web') return false;
  try {
    const A: any = await import('expo-audio');
    try { await A.setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false, interruptionMode: 'doNotMix' }); } catch (e) { /* ignore */ }
    const p = A.createAudioPlayer({ uri: fallbackUrl('alafasy', surah, ayah) }, { updateInterval: 300 });
    player = p;
    return await new Promise<boolean>((res) => {
      let finished = false;
      const end = (ok: boolean) => { if (finished) return; finished = true; done = null; res(ok); };
      done = () => end(true);
      const t = setTimeout(() => end(false), 60000);
      p.addListener('playbackStatusUpdate', (s: any) => {
        if (s && s.didJustFinish) { clearTimeout(t); end(true); }
        else if (s && s.error) { clearTimeout(t); end(false); }
      });
      p.play();
    });
  } catch (e) { return false; }
}

export function stopVerse() {
  try { if (player) { player.pause(); player.remove(); } } catch (e) { /* ignore */ }
  player = null;
  if (done) { const d = done; done = null; d(); }
}
