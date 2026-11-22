import React from 'react';
import { View, Image, ImageProps } from 'react-native';
import { Text } from './Txt';

/** A picture that shows a clear "Picture missing" box instead of an empty one when the file cannot be opened. */
export function SafeImage(props: ImageProps) {
  const [bad, setBad] = React.useState(false);
  const u = (props.source as any)?.uri;
  React.useEffect(() => { setBad(false); }, [u]);
  if (bad) return (
    <View style={[props.style as any, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.28)', overflow: 'hidden' }]}>
      <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 10.5, fontWeight: '700', textAlign: 'center' }} numberOfLines={2}>Picture missing</Text>
    </View>
  );
  return <Image {...props} onError={() => setBad(true)} />;
}
