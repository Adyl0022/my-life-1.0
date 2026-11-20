import React from 'react';
import { SlidePills } from './TabSlide';

// The pill with the chosen tab in the app's pink-to-gold gradient (same look as Activities). The colour glides to the tab you press.
export function HouseTabs<K extends string>({ tabs, v, onChange }: { tabs: [K, string][]; v: K; onChange: (k: K) => void }) {
  return <SlidePills tabs={tabs.map((t) => t[1])} index={Math.max(0, tabs.findIndex((t) => t[0] === v))} onChange={(i) => onChange(tabs[i][0])} colors={['#ff8fab', '#ffc46b']} textOn="#2a1740" textOff="rgba(255,255,255,.7)" bar={{ marginBottom: 14 }} />;
}
