import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../components/Txt';
import { RecordPage, ModCard } from '../components/RecordHubUi';

// My Record is the door. Each kind of record has its own screen.
export default function RecordHub() {
  const router = useRouter();
  return (
    <RecordPage title="My Record" sub="Everything you keep, in one place">
      <ModCard e="📄" title="Documents" sub="Passport, bank cards, warranty and other papers, with the date they end" colors={['rgba(142,168,255,.62)', 'rgba(90,100,220,.4)']} pat="dots" onPress={() => router.push('/documents' as any)} />
      <ModCard e="🏍️" title="My Vehicle" sub="Mileage, fuel, servicing, licence, road tax and insurance" colors={['rgba(255,150,190,.58)', 'rgba(170,90,200,.4)']} pat="rings" onPress={() => router.push('/vehicle' as any)} />
      <ModCard e="🗂️" title="Personal Collection" sub="Gadgets, lifestyle, property, lent items and life lessons" colors={['rgba(183,148,255,.6)', 'rgba(94,231,223,.32)']} pat="grid" onPress={() => router.push('/collection' as any)} />
      <View style={{ height: 6 }} />
    </RecordPage>
  );
}
