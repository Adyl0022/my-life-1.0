import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { RecordPage, Intro, HalfCard, VehicleCard } from '../components/RecordHubUi';
import { RecordCarousel } from '../components/RecordCarousel';

// My Record is the door. Each kind of record has its own screen.
export default function RecordHub() {
  const router = useRouter();
  return (
    <RecordPage title="My Record" sub="Everything you keep, in one place" art>
      <Intro title="Keep what matters" text="Papers, vehicle and belongings, all saved" />
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
        <HalfCard e="📄" title="Documents" sub="Passport and cards" colors={['rgba(142,168,255,.62)', 'rgba(90,100,220,.4)']} pat="dots" sheen={0} onPress={() => router.push('/documents' as any)} />
        <HalfCard e="🗂️" title="Personal Collection" sub="Gadgets and lifestyle" colors={['rgba(183,148,255,.6)', 'rgba(94,231,223,.32)']} pat="grid" sheen={2400} onPress={() => router.push('/collection' as any)} />
      </View>
      <VehicleCard sheen={1200} onPress={() => router.push('/vehicle' as any)} />
      <View style={{ marginTop: 14 }}><RecordCarousel /></View>
    </RecordPage>
  );
}
