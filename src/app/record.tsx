import React from 'react';
import { useRouter } from 'expo-router';
import { RecordPage, Hero, PicCard, VehicleCard, TipStrip } from '../components/RecordHubUi';

// My Record is the door. Each kind of record has its own screen.
export default function RecordHub() {
  const router = useRouter();
  return (
    <RecordPage title="My Record" sub="Everything you keep, in one place" art>
      <Hero e="🗃️" label="KEEP IT SAFE" title="Papers, vehicle and belongings" />
      <PicCard e="📄" title="Documents" sub="Passport, cards and warranty" colors={['rgba(142,168,255,.62)', 'rgba(90,100,220,.4)']} pat="dots" onPress={() => router.push('/documents' as any)} />
      <VehicleCard onPress={() => router.push('/vehicle' as any)} />
      <PicCard e="🗂️" title="Personal Collection" sub="Gadgets, lifestyle and lessons" colors={['rgba(183,148,255,.6)', 'rgba(94,231,223,.32)']} pat="grid" onPress={() => router.push('/collection' as any)} />
      <TipStrip text="Add a passport or card date once. The app reminds you before it ends." />
    </RecordPage>
  );
}
