import React, { useState } from 'react';
import { View, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '../components/Txt';
import { Glass } from '../components/Glass';
import { Header } from '../components/IslamicUi';
import { FamilyBg } from '../components/FamilyBg';
import { Rise } from '../components/Anim';
import { Btn, Field, Note, W, DIM } from '../components/FamilyUi';
import { famJoin, famError, pickColor } from '../lib/family';
import { useLicense } from '../lib/license';
import { useName } from '../lib/store';

export default function FamilyJoin() {
  const router = useRouter();
  const lic = useLicense();
  const myName = useName();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const shown = clean.length > 3 ? clean.slice(0, 3) + '-' + clean.slice(3, 6) : clean;
  const join = async () => {
    setBusy(true); setErr('');
    try { await famJoin(clean, name || myName, pickColor(Date.now() >> 3)); router.replace('/family' as any); }
    catch (e) { setErr(famError(e)); }
    setBusy(false);
  };
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <FamilyBg />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Join a family" sub="Enter the code you were given" />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 170 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Rise>
            <TextInput value={shown} onChangeText={(s) => setCode(s)} placeholder="ABC-123" placeholderTextColor="rgba(255,255,255,.3)" maxLength={7} autoCapitalize="characters" autoCorrect={false}
              style={{ color: W, fontSize: 26, fontWeight: '900', letterSpacing: 6, textAlign: 'center', paddingVertical: 16, borderRadius: 18, backgroundColor: 'rgba(0,0,0,.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)' }} />
          </Rise>
          <Rise i={1}>
            <Glass radius={22} style={{ padding: 16, marginTop: 14 }}>
              <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>Your name in the family</Text>
              <Text style={{ color: DIM, fontSize: 12, marginTop: 2 }}>Other members will see this name.</Text>
              <Field label="" value={name} onChange={setName} ph="Your name" />
            </Glass>
          </Rise>
          <Rise i={2}>
            <View style={{ marginTop: 14 }}>
              <Note warm t={lic.status === 'active' ? 'Joining needs an active My Life subscription, and you have one. Your own data stays separate from the family.' : 'You need an active My Life subscription to join a family.'} />
            </View>
          </Rise>
          {err ? <Text style={{ color: '#ffb3bf', fontSize: 12.5, marginTop: 12 }}>{err}</Text> : null}
          <Rise i={3}>
            <View style={{ marginTop: 16 }}><Btn t="Join family" kind="main" onPress={join} busy={busy} disabled={clean.length < 6 || lic.status !== 'active'} /></View>
            <Text style={{ color: DIM, fontSize: 12, textAlign: 'center', marginTop: 14, lineHeight: 17 }}>If your subscription ends, you keep your own data but lose access to the family until you renew.</Text>
          </Rise>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
