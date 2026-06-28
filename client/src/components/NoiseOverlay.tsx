import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

export default function NoiseOverlay() {
  if (Platform.OS !== 'web') return null;

  return (
    <View 
      pointerEvents="none" 
      style={styles.noise} 
    />
  );
}

const styles = StyleSheet.create({
  noise: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    opacity: 0.04, // Very subtle gig poster grain
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
  } as any
});
