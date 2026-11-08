import React from 'react';
import { ZikirScreen } from '../components/ZikirScreen';
import { TAHLIL, dayKey } from '../lib/islamic';
export default function Tahlil() {
  return <ZikirScreen title="Tahlil Arwah" sub="Standard order · 25 parts · Malaysian sources" parts={TAHLIL} storeKey={'tahlil_' + dayKey()} bmKey="tahlil" start={0}
    footNote="Order follows common Malaysian tahlil guides. Quran parts come from the full Quran text. Dhikr, selawat and doa texts have been checked by an ustaz." />;
}
