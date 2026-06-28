import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform } from 'react-native';
import { Home, Search, Heart, Music2 } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, withSequence } from 'react-native-reanimated';
import { usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import NoiseOverlay from '../components/NoiseOverlay';

if (Platform.OS === 'web') {
  // @ts-ignore
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap');
      * {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
      }
    `;
    document.head.appendChild(style);
  }
}

function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setLoading(false);
    }, 800); // 800ms loading overlay on navigation
    return () => clearTimeout(t);
  }, [pathname]);

  if (!loading) return null;

  const Bar = ({ delay }: { delay: number }) => {
    const height = useSharedValue(32);
    const opacity = useSharedValue(0.75);
    useEffect(() => {
      height.value = withDelay(delay, withRepeat(
        withSequence(
          withTiming(40, { duration: 320 }),
          withTiming(32, { duration: 320 }),
          withTiming(32, { duration: 160 })
        ),
        -1, false
      ));
      opacity.value = withDelay(delay, withRepeat(
        withSequence(
          withTiming(1, { duration: 320 }),
          withTiming(0.75, { duration: 320 }),
          withTiming(0.75, { duration: 160 })
        ),
        -1, false
      ));
    }, []);
    const style = useAnimatedStyle(() => ({
      height: height.value,
      opacity: opacity.value,
      width: 14,
      backgroundColor: '#00F0FF',
      ...(Platform.OS === 'web' ? { boxShadow: `0 -4px 10px rgba(0,240,255,0.5)` } as any : {})
    }));
    return <Animated.View style={style} />;
  }

  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(5,3,10,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 50 }}>
        <Bar delay={0} />
        <Bar delay={160} />
        <Bar delay={320} />
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <PageLoader />
      <NoiseOverlay />
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 20,
            left: '10%',
            right: '10%',
            elevation: 0,
            backgroundColor: 'rgba(15, 10, 26, 0.85)',
            borderRadius: 30,
            height: 70,
            borderWidth: 1,
            borderColor: 'rgba(217, 70, 239, 0.2)',
            shadowColor: '#D946EF',
            shadowOffset: {
              width: 0,
              height: 10,
            },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {})
          },
          tabBarItemStyle: {
            paddingVertical: 10,
          },
          tabBarActiveTintColor: '#D946EF',
          tabBarInactiveTintColor: '#6B7280',
          tabBarShowLabel: false,
          sceneStyle: { backgroundColor: '#05030A' }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                <Home size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                <Search size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            title: 'Saved',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                <Heart size={24} color={color} />
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05030A',
  },
  iconContainer: {
    padding: 10,
    borderRadius: 20,
    transition: 'all 0.2s ease-in-out',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(217, 70, 239, 0.15)',
  }
});
