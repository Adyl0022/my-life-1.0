import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { getItem } from '../lib/store';
import { SLEEP_KEY, SleepNow, startSleep, endSleep } from '../lib/sleepNow';

// Opened by the Quick Settings tile (mylife://sleeptile): starts or ends the sleep timer, then shows the Dashboard, where the Quick log has the Going to sleep and I'm awake buttons.
export default function SleepTile() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const cur = await getItem<SleepNow>(SLEEP_KEY, null);
      if (cur && cur.start) await endSleep(); else await startSleep();
      router.replace('/');
    })();
  }, []);
  return <View style={{ flex: 1, backgroundColor: '#0a0f2c' }} />;
}
