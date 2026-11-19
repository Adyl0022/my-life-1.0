import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { getItem } from '../lib/store';
import { SLEEP_KEY, SleepNow, startSleep, endSleep } from '../lib/sleepNow';

// Opened by the Quick Settings tile (mylife://sleeptile): starts or ends the sleep timer, then shows the Sleep Tracker.
export default function SleepTile() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const cur = await getItem<SleepNow>(SLEEP_KEY, null);
      if (cur && cur.start) await endSleep(); else await startSleep();
      router.replace('/habit');
    })();
  }, []);
  return <View style={{ flex: 1, backgroundColor: '#0a0f2c' }} />;
}
