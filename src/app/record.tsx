import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { RecordPage, Intro, PicCard, VehicleCard } from '../components/RecordHubUi';
import { RecordCarousel } from '../components/RecordCarousel';

// My Record is the door. Each kind of record has its own screen.
export default function RecordHub() {
  const router = useRouter();
  return (
    <RecordPage title="My Record" sub="Everything you keep, in one place" art>
      <Intro title="Keep what matters" text="Papers, vehicle and belongings, all saved" />
      <PicCard e="📄" title="Documents" sub="Passport, cards and warranty" colors={['rgba(142,168,255,.62)', 'rgba(90,100,220,.4)']} pat="dots" sheen={0} onPress={() => router.push('/documents' as any)} />
      <VehicleCard sheen={1800} onPress={() => router.push('/vehicle' as any)} />
      <PicCard e="🗂️" title="Personal Collection" sub="Gadgets, lifestyle and lessons" colors={['rgba(183,148,255,.6)', 'rgba(94,231,223,.32)']} pat="grid" sheen={3600} onPress={() => router.push('/collection' as any)} />
      <View style={{ marginTop: 14 }}><RecordCarousel /></View>
    </RecordPage>
  );
}
