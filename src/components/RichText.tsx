import React from 'react';
import { View } from 'react-native';
import { Text } from './Txt';

// Shows an AI answer with simple formatting: **bold**, `code`, code blocks, bullet points and numbered points.
// Text with none of these marks is shown exactly as plain text, so written answers look the same as before.
const MARKS = /```|\*\*|\*[^*\s][^*\n]*\*|`[^`\n]+`|^\s*([-*•]|\d+[.)])\s+|^#{1,4}\s/m;
const C = '#fff';

// Markers that make the last words of a still-growing answer appear softly (see LiveText): \uE001 = faintest, \uE002 = medium, \uE003 = almost full.
export const FADE = Array.from({ length: 16 }, (_, i) => String.fromCharCode(0xe001 + i));
const FADE_C: { [k: string]: string } = {};
FADE.forEach((c, i) => { FADE_C[c] = 'rgba(255,255,255,' + (0.25 + 0.75 * (i / 15)).toFixed(2) + ')'; });
function inline(s: string, key: string) {
  const parts: React.ReactNode[] = [];
  s = s.replace(/^\*\*(?![^*]*\*\*)/, '');
  const re = /(\*\*[^*]+\*\*|`[^`\n]+`|\*[^*\s][^*\n]*\*|[\uE001-\uE010])/g;
  let fade: string | undefined; let last = 0; let m: RegExpExecArray | null; let n = 0;
  const plain = (x: string) => { if (!x) return; parts.push(fade ? <Text key={key + n++} style={{ color: fade }}>{x}</Text> : x); };
  while ((m = re.exec(s))) {
    if (m.index > last) plain(s.slice(last, m.index));
    const t = m[0];
    if (FADE_C[t]) fade = FADE_C[t];
    else if (t.startsWith('**')) parts.push(<Text key={key + n++} style={{ fontWeight: '800', color: fade || C }}>{t.slice(2, -2).replace(/[\uE001-\uE010]/g, '')}</Text>);
    else if (t.startsWith('*')) parts.push(<Text key={key + n++} style={{ fontStyle: 'italic', color: fade || C }}>{t.slice(1, -1).replace(/[\uE001-\uE010]/g, '')}</Text>);
    else parts.push(<Text key={key + n++} style={{ fontFamily: 'monospace', color: '#8fe9e2', backgroundColor: 'rgba(0,0,0,.28)' }}>{t.slice(1, -1).replace(/[\uE001-\uE010]/g, '')}</Text>);
    last = m.index + t.length;
  }
  if (last < s.length) plain(s.slice(last));
  return parts;
}

export function RichText({ text }: { text: string }) {
  const base = { color: C, fontSize: 14.5, lineHeight: 22 } as const;
  if (!MARKS.test(text) && !/[\uE001-\uE010]/.test(text)) return <Text style={base}>{text}</Text>;
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  const st: { code: string[] | null } = { code: null };
  lines.forEach((ln, i) => {
    if (/^\s*```/.test(ln)) {
      if (st.code) { out.push(<View key={'c' + i} style={{ marginVertical: 6, padding: 10, borderRadius: 12, backgroundColor: 'rgba(0,0,0,.35)' }}><Text style={{ color: '#d7f7f1', fontFamily: 'monospace', fontSize: 12.5, lineHeight: 18 }}>{st.code.join('\n')}</Text></View>); st.code = null; }
      else st.code = [];
      return;
    }
    if (st.code) { st.code.push(ln); return; }
    if (!ln.trim()) { out.push(<View key={'s' + i} style={{ height: 6 }} />); return; }
    const b = ln.match(/^\s*([-*•])\s+(.*)$/); const nb = ln.match(/^\s*(\d+)[.)]\s+(.*)$/); const h = ln.match(/^#{1,4}\s+(.*)$/);
    if (b || nb) {
      out.push(
        <View key={'l' + i} style={{ flexDirection: 'row', marginTop: 2 }}>
          <Text style={{ ...base, width: 22 }}>{b ? '•' : nb![1] + '.'}</Text>
          <Text style={{ ...base, flexShrink: 1 }}>{inline((b ? b[2] : nb![2]), 'i' + i)}</Text>
        </View>,
      );
    } else if (h) out.push(<Text key={'h' + i} style={{ ...base, fontWeight: '800', marginTop: 4 }}>{inline(h[1], 'h' + i)}</Text>);
    else out.push(<Text key={'p' + i} style={base}>{inline(ln, 'p' + i)}</Text>);
  });
  // A code block that was never closed (the answer is still being written) is shown as it is.
  if (st.code) out.push(<View key="cx" style={{ marginVertical: 6, padding: 10, borderRadius: 12, backgroundColor: 'rgba(0,0,0,.35)' }}><Text style={{ color: '#d7f7f1', fontFamily: 'monospace', fontSize: 12.5, lineHeight: 18 }}>{st.code.join('\n')}</Text></View>);
  return <View>{out}</View>;
}
