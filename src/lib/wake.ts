import { useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { listen, voiceOk, vlang } from './voice';

// "Hey My Life": while Home is open and the person has switched it on, the phone's speech service listens for these words.
// It stops by itself after 5 minutes without a touch, when you leave Home, and when the screen goes off. Nothing is saved.
export const WAKE_KEY = 'ml_wake';
const RE = /\b(hai|hi|hey|hello|helo|hae|hay|ai)\s+(my|mai|mei|mi|me)\s*(life|laif|lif|laiv|live|lives)\b/;
export const isWake = (t: string) => RE.test((t || '').toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' '));
const IDLE_MS = 5 * 60000;

export function useWake(on: boolean, onWake: () => void) {
  const cb = useRef(onWake); cb.current = onWake;
  const touched = useRef(Date.now());
  useFocusEffect(useCallback(() => {
    if (!on || !voiceOk) return undefined;
    let alive = true; let stop: () => void = () => {}; let timer: any = 0;
    touched.current = Date.now();
    const check = (t: string) => { if (alive && isWake(t)) { alive = false; try { stop(); } catch (e) { /* not running */ } cb.current(); } };
    const round = () => {
      if (!alive) return;
      if (Date.now() - touched.current > IDLE_MS) { alive = false; return; }
      if (AppState.currentState !== 'active') { timer = setTimeout(round, 1500); return; }
      let fatal = false;
      stop = listen(vlang('en').tag, {
        onPartial: check, onFinal: check, onLevel: undefined,
        onError: (c) => { if (/not-allowed|service-not-allowed|permission/i.test(c)) fatal = true; },
        onEnd: () => { if (!alive) return; if (fatal) { alive = false; return; } timer = setTimeout(round, 350); },
      });
    };
    const sub = AppState.addEventListener('change', (s) => { if (s !== 'active') { try { stop(); } catch (e) { /* not running */ } } });
    round();
    return () => { alive = false; clearTimeout(timer); try { stop(); } catch (e) { /* not running */ } sub.remove(); };
  }, [on]));
  return { touch: () => { touched.current = Date.now(); } };
}
