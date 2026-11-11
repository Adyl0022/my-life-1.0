import { useLicenseLite } from './license';
import { FREEMIUM, PLAY_TESTING } from './edition';

// True when the person has the full app: always in the GitHub edition, and in the Play edition once they have unlocked it
// (or are an early user whose account was already activated).
export function usePro(): boolean {
  const l = useLicenseLite();
  return !FREEMIUM || PLAY_TESTING || l.status === 'active';
}
