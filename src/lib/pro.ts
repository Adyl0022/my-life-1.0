import { useLicenseLite } from './license';
import { FREEMIUM, PLAY_TESTING } from './edition';
import { useSubscribed } from './purchase';

// True when the person has the full app: always in the GitHub edition. In the Play edition it is true for early users
// whose account was already activated, for testers while a test build unlocks everything, and for anyone with an active subscription.
export function usePro(): boolean {
  const l = useLicenseLite();
  const paid = useSubscribed();
  return !FREEMIUM || PLAY_TESTING || l.status === 'active' || paid;
}
