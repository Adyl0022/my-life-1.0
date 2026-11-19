import React from 'react';
import { View } from 'react-native';
import { Text } from '../components/Txt';
import { Glass } from '../components/Glass';
import { RecordPage } from '../components/RecordHubUi';

export default function Screen() {
  return (
    <RecordPage title="Documents" sub="Your papers and when they end">
      <Glass style={{ marginTop: 16, padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 40 }}>📄</Text>
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 10 }}>Coming soon</Text>
        <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 }}>This part of My Record is being built. It will arrive in a coming update.</Text>
      </Glass>
      <View style={{ height: 6 }} />
    </RecordPage>
  );
}
