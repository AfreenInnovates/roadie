import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  useWindowDimensions,
  Platform,
  Pressable,
  Image,
  TouchableOpacity
} from 'react-native';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  useAnimatedProps
} from 'react-native-reanimated';
import Svg, { Path, Polygon, Circle, Defs, LinearGradient, Stop, Filter, FeDropShadow } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const generalMascot = require('../assets/images/general_mascot-removebg-preview.png');
const mascotConcert = require('../assets/images/mascot_concert.png');
const mascotHome = require('../assets/images/mascot_home.png');
const mascotLoading = require('../assets/images/mascot_loading.png');
function MagneticButton({ children, onPress }: { children: React.ReactNode, onPress: () => void }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.4);

  const handlePointerMove = (e: any) => {
    if (Platform.OS === 'web') {
      const rect = e.target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      x.value = withSpring((e.clientX - centerX) * 0.3, { damping: 10, stiffness: 150 });
      y.value = withSpring((e.clientY - centerY) * 0.3, { damping: 10, stiffness: 150 });
      scale.value = withSpring(1.05);
      glow.value = withTiming(0.8);
    }
  };

  const handlePointerLeave = () => {
    x.value = withSpring(0);
    y.value = withSpring(0);
    scale.value = withSpring(1);
    glow.value = withTiming(0.4);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
    ...(Platform.OS === 'web' ? {
      boxShadow: `0 15px 40px rgba(255,0,91,${glow.value})`
    } : {})
  }));

  return (
    <Animated.View 
      style={animatedStyle}
      // @ts-ignore
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Pressable onPress={onPress} style={styles.magneticBtn}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

function InteractiveStatCard({ children }: { children: React.ReactNode }) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const onEnter = () => {
    if (Platform.OS === 'web') {
      scale.value = withSpring(1.05);
      glow.value = withTiming(1, { duration: 300 });
    }
  };
  const onLeave = () => {
    if (Platform.OS === 'web') {
      scale.value = withSpring(1);
      glow.value = withTiming(0, { duration: 300 });
    }
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    ...(Platform.OS === 'web' ? {
      boxShadow: `0 0 ${glow.value * 30}px rgba(0,240,255,${glow.value * 0.2})`
    } : {})
  }));

  return (
    <Animated.View 
      style={[styles.statItem, animStyle, { padding: 20, borderRadius: 20 }]}
      // @ts-ignore
      onPointerEnter={onEnter} onPointerLeave={onLeave}
    >
      {children}
    </Animated.View>
  );
}

function LivePulse() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(withTiming(2.5, { duration: 1500 }), -1, false);
    opacity.value = withRepeat(withTiming(0, { duration: 1500 }), -1, false);
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }));
  return (
    <View style={{ width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={[styles.livePulse, animStyle, { position: 'absolute' }]} />
      <View style={[styles.livePulse, { position: 'absolute' }]} />
    </View>
  );
}

function WavyBackground() {
  const tx = useSharedValue(0);
  useEffect(() => {
    tx.value = withRepeat(withTiming(-1000, { duration: 15000, easing: Easing.linear }), -1, false);
  }, []);
  
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
    width: 2000,
    position: 'absolute',
    height: '100%'
  }));

  return (
    <Animated.View style={animStyle}>
      <Svg width="2000" height="400" preserveAspectRatio="none">
         <Path d="M 0,200 Q 250,50 500,200 T 1000,200 T 1500,200 T 2000,200" stroke="rgba(255,0,91,0.2)" strokeWidth="2" fill="none" />
         <Path d="M 0,250 Q 250,400 500,250 T 1000,250 T 1500,250 T 2000,250" stroke="rgba(0,240,255,0.2)" strokeWidth="2" fill="none" />
      </Svg>
    </Animated.View>
  );
}

function HeroGridBg() {
  return (
    <View style={styles.heroGridBg}>
      <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="gridGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="rgba(0, 240, 255, 0.15)" />
            <Stop offset="1" stopColor="rgba(255, 0, 91, 0.05)" />
          </LinearGradient>
        </Defs>
        <Path d="M 0 100 L 2000 100 M 0 250 L 2000 250 M 0 400 L 2000 400 M 0 550 L 2000 550 M 0 700 L 2000 700" stroke="url(#gridGlow)" strokeWidth="1" />
        <Path d="M 200 0 L 200 1000 M 500 0 L 500 1000 M 800 0 L 800 1000 M 1100 0 L 1100 1000 M 1400 0 L 1400 1000" stroke="url(#gridGlow)" strokeWidth="1" />
      </Svg>
    </View>
  );
}

function FloatingBadge({ delay, tx, ty, rot, glowColor, isMobile, children }: { delay: number, tx: number, ty: number, rot: string, glowColor: string, isMobile: boolean, children: React.ReactNode }) {
  const y = useSharedValue(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      y.value = withRepeat(withTiming(15, { duration: 2500, easing: Easing.inOut(Easing.sin) }), -1, true);
    }, delay);
    return () => clearTimeout(timeout);
  }, []);
  
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx }, { translateY: ty + y.value }, { rotateZ: rot }, { scale: isMobile ? 0.6 : 1 }]
  }));
  
  return (
    <Animated.View style={[styles.floatingBadge, animStyle, Platform.OS === 'web' && { boxShadow: `0 20px 40px ${glowColor}` } as any]}>
       {children}
    </Animated.View>
  );
}

function MascotHero({ isMobile }: { isMobile: boolean }) {
  const { width } = useWindowDimensions();
  const floatY = useSharedValue(0);
  
  useEffect(() => {
    floatY.value = withRepeat(withTiming(-20, { duration: 3000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  
  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value + 20 }],
    zIndex: 10
  }));

  const dynamicFontSize = isMobile ? Math.min(width * 0.15, 64) : Math.min(width * 0.075, 140);
  const dynamicLineHeight = dynamicFontSize * 0.95;

  const leftTx = -(width * 0.28);
  const rightTx = width * 0.28;

  return (
    <View style={styles.mascotHeroContainer}>
      <HeroGridBg />
      
      <Text 
        style={[
          styles.bgHugeText, 
          { 
            fontSize: dynamicFontSize, 
            lineHeight: dynamicLineHeight, 
            top: isMobile ? '10%' : '5%',
            paddingHorizontal: 20
          }
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        YOUR NEXT SHOW.{'\n'}YOUR PERFECT STAY.
      </Text>
      
      <>
        <FloatingBadge delay={0} tx={isMobile ? -100 : leftTx - 20} ty={isMobile ? -80 : -200} rot="-3deg" glowColor="rgba(255, 0, 91, 0.25)" isMobile={isMobile}>
           <View style={{flexDirection: 'row', alignItems: 'center'}}>
             <View style={{marginRight: 16}}>
               <Text style={styles.badgeTitleLarge}>Live{'\n'}Airbnb{'\n'}Scrape</Text>
             </View>
             <View style={styles.iconCol}>
               <View style={styles.redIconBg}><Text style={{fontSize: 20}}>🏠</Text></View>
               <View style={styles.cyanIconBg}><Text style={{fontSize: 20}}>📊</Text></View>
             </View>
           </View>
        </FloatingBadge>
        
        <FloatingBadge delay={500} tx={isMobile ? 120 : rightTx + 20} ty={isMobile ? -100 : -160} rot="2deg" glowColor="rgba(0, 240, 255, 0.25)" isMobile={isMobile}>
           <View style={{alignItems: 'center'}}>
             <View style={styles.cyanIconBg}><Text style={{fontSize: 30}}>🧠</Text></View>
             <Text style={[styles.badgeTitleLarge, {marginTop: 12}]}>AI{'\n'}Curation</Text>
           </View>
        </FloatingBadge>
        
        <FloatingBadge delay={1000} tx={isMobile ? -120 : leftTx} ty={isMobile ? 120 : 220} rot="3deg" glowColor="rgba(255, 0, 91, 0.25)" isMobile={isMobile}>
           <Text style={styles.badgeTitleSmall}>Real-time Alerts</Text>
           <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
             <Text style={styles.badgeSubText}>3 Active Alerts</Text>
             <View style={styles.bellIcon}><Text style={{fontSize: 12}}>🔔</Text></View>
             <View style={styles.bellIcon}><Text style={{fontSize: 12}}>🔔</Text></View>
           </View>
        </FloatingBadge>
        
        <FloatingBadge delay={1500} tx={isMobile ? 100 : rightTx - 20} ty={isMobile ? 140 : 240} rot="-2deg" glowColor="rgba(0, 240, 255, 0.25)" isMobile={isMobile}>
           <Text style={styles.badgeTitleSmall}>Venue Proximity</Text>
           <View style={styles.progressBarBg}>
             <View style={styles.progressBarFill} />
           </View>
           <Text style={styles.badgeSubText}>0.2 Miles Away</Text>
        </FloatingBadge>
      </>

      <View style={styles.mascotGlow} />

      <Animated.View style={mascotStyle}>
        <Image 
          source={generalMascot} 
          style={{ width: isMobile ? 300 : 500, height: isMobile ? 300 : 500, resizeMode: 'contain' }} 
        />
      </Animated.View>

      <View style={styles.heroFooterCTAs}>
         <TouchableOpacity style={styles.discoverMoreBtn}>
           <Text style={styles.discoverMoreText}>Discover More</Text>
         </TouchableOpacity>
         <TouchableOpacity>
           <Text style={styles.viewDemoText}>View Demo</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
}

function NumberCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.ceil(target / 20);
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(current);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [target]);

  return <Text style={styles.statValue}>{count}</Text>;
}


function CircularWorkflowGallery({ scrollY }: { scrollY: Animated.SharedValue<number> }) {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const sectionTop = useSharedValue(0);
  const scrollDistance = 2000;
  
  const steps = [
    { title: 'Track Tours', desc: 'We instantly scrape Bandsintown to find where your favorite artist is playing next.', img: mascotConcert },
    { title: 'Scan Lodging', desc: 'We scan Airbnb to find available stays near the venue on the exact night of the concert.', img: mascotHome },
    { title: 'AI Curation', desc: 'Our Groq-powered AI Roadie analyzes price and distance to pick the ultimate booking.', img: mascotLoading },
  ];

  const handleLayout = (e: any) => { sectionTop.value = e.nativeEvent.layout.y; };
  
  const RADIUS = isMobile ? width * 1.2 : 800;
  const CARD_WIDTH = isMobile ? width * 0.75 : 400;
  const CARD_HEIGHT = CARD_WIDTH * 1.4;

  return (
    <View style={{ height: scrollDistance + height }} onLayout={handleLayout}>
      <View style={{ position: Platform.OS === 'web' ? 'sticky' : 'relative', top: 0, height: height, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' } as any}>
         <Text style={[styles.title, { position: 'absolute', top: isMobile ? 60 : 100, fontSize: isMobile ? 48 : 80, zIndex: 100 }]}>How it Works</Text>
         
         {steps.map((step, i) => {
            const cardStyle = useAnimatedStyle(() => {
               const localScroll = scrollY.value - sectionTop.value;
               const progress = interpolate(localScroll, [0, scrollDistance], [0, 1], 'clamp');
               const targetProgress = i / (steps.length - 1);
               const dist = progress - targetProgress; 
               
               const angleDeg = dist * 60; 
               const angleRad = (angleDeg * Math.PI) / 180;
               
               const tx = Math.sin(angleRad) * RADIUS;
               const ty = (-Math.cos(angleRad) * RADIUS) + RADIUS;
               
               const active = interpolate(Math.abs(dist), [0, 0.4, 1], [1, 0.3, 0], 'clamp');
               const scale = interpolate(Math.abs(dist), [0, 1], [1, 0.8], 'clamp');
               
               return {
                 position: 'absolute',
                 width: CARD_WIDTH,
                 height: CARD_HEIGHT,
                 opacity: active,
                 transform: [
                   { translateY: isMobile ? 40 : 100 },
                   { translateX: tx },
                   { translateY: ty },
                   { rotateZ: `${angleDeg}deg` },
                   { scale }
                 ],
                 zIndex: Math.round(active * 100)
               };
            });
            
            return (
              <Animated.View key={i} style={[cardStyle, styles.galleryCard]}>
                 <Image source={step.img} style={{ width: '100%', height: '100%', borderRadius: 24, position: 'absolute' } as any} />
                 <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 24 }} />
                 <View style={styles.galleryCardOverlay}>
                   <Text style={styles.galleryCardNum}>0{i+1}</Text>
                   <Text style={styles.galleryCardTitle}>{step.title}</Text>
                   <Text style={styles.galleryCardDesc}>{step.desc}</Text>
                 </View>
              </Animated.View>
            );
         })}
      </View>
    </View>
  );
}

export default function LandingPage() {

  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const scrollY = useSharedValue(0);

  return (
    <View style={styles.container}>
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => { scrollY.value = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        
        {/* HERO SECTION */}
        <View style={[styles.heroSection, isMobile && { minHeight: '80vh', marginTop: 40 }]}>
          <MascotHero isMobile={isMobile} />
        </View>

        {/* WORKFLOW SECTION */}
        <CircularWorkflowGallery scrollY={scrollY} />

        {/* BOTTOM COMBINED SECTION */}
        <View style={styles.bottomSectionWrapper}>
           <WavyBackground />
           
           {/* STATS STRIP */}
           <View style={[styles.statsStrip, (isMobile || isTablet) && { flexDirection: 'column', gap: 40 }]}>
              <InteractiveStatCard>
                 <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
                   <Text style={styles.statTilde}>~</Text>
                   <NumberCounter target={300} />
                   <Text style={styles.statUnit}>ms</Text>
                 </View>
                 <Text style={styles.statLabel}>AI Generation</Text>
              </InteractiveStatCard>
              {!(isMobile || isTablet) && <View style={styles.statDivider} />}
              <InteractiveStatCard>
                 <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
                   <NumberCounter target={100} />
                   <Text style={styles.statUnit}>%</Text>
                 </View>
                 <Text style={styles.statLabel}>Automated</Text>
              </InteractiveStatCard>
              {!(isMobile || isTablet) && <View style={styles.statDivider} />}
              <InteractiveStatCard>
                 <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                   <LivePulse />
                   <Text style={[styles.statValue, {marginBottom: 0, marginLeft: 12}]}>Live</Text>
                 </View>
                 <Text style={styles.statLabel}>Anakin Data</Text>
              </InteractiveStatCard>
           </View>

           {/* CTA FOOTER */}
           <View style={styles.ctaFooter}>
              <Text style={[styles.ctaTitle, isMobile && { fontSize: 48 }]}>Ready to hit the road?</Text>
              <Text style={[styles.ctaSubhead, isMobile && { fontSize: 16, paddingHorizontal: 20, textAlign: 'center' }]}>Join touring fans already optimizing their travel.</Text>
              <View style={{ marginTop: 20 }}>
                <MagneticButton onPress={() => router.push('/dashboard')}>
                  <Text style={styles.ctaBtnText}>Launch Dashboard</Text>
                </MagneticButton>
              </View>
           </View>
        </View>

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroSection: {
    minHeight: '90vh',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    padding: 24,
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 10,
    marginTop: 20,
  },
  mascotHeroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    height: 800,
    marginBottom: 20
  },
  topNavContainer: {
    position: 'absolute',
    top: -20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 50,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } as any : {})
  },
  topNavLink: {
    fontFamily: 'Inter',
    color: '#CCC',
    marginHorizontal: 20,
    fontSize: 16,
  },
  getStartedBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#00F0FF',
    borderRadius: 100,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginLeft: 16,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)' } as any : {})
  },
  getStartedText: {
    fontFamily: 'Inter',
    color: '#00F0FF',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  heroGridBg: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    opacity: 0.6,
  },
  bgHugeText: {
    fontFamily: 'Bebas Neue',
    fontSize: 140,
    position: 'absolute',
    textAlign: 'center',
    lineHeight: 130,
    top: '15%',
    width: '100%',
    zIndex: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 10 },
    textShadowRadius: 20,
    ...(Platform.OS === 'web' ? { 
        backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,0.85))', 
        WebkitBackgroundClip: 'text', 
        WebkitTextFillColor: 'transparent' 
    } as any : { color: 'rgba(255,255,255,0.9)' })
  },
  mascotGlow: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(0, 240, 255, 0.25)',
    top: '25%',
    zIndex: 5,
    ...(Platform.OS === 'web' ? { filter: 'blur(80px)' } as any : {})
  },
  mascotBackdrop: {
    position: 'absolute',
    width: 450,
    height: 350,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 40,
    top: '25%',
    zIndex: 5,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 40px rgba(255,255,255,0.2)' } as any : {})
  },
  floatingBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 20,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' } as any : {})
  },
  badgeTitleLarge: {
    fontFamily: 'Inter',
    fontSize: 20,
    color: '#FFF',
    fontWeight: '500',
    lineHeight: 28,
  },
  badgeTitleSmall: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
  },
  badgeSubText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#AAA',
    marginRight: 8,
  },
  iconCol: {
    gap: 8,
  },
  redIconBg: {
    backgroundColor: 'rgba(255, 0, 91, 0.2)',
    padding: 12,
    borderRadius: 12,
  },
  cyanIconBg: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
  },
  bellIcon: {
    backgroundColor: 'rgba(255, 0, 91, 0.2)',
    padding: 6,
    borderRadius: 100,
    marginLeft: -4,
    borderWidth: 1,
    borderColor: 'rgba(255,0,91,0.5)',
  },
  progressBarBg: {
    width: 150,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 100,
    marginTop: 12,
    marginBottom: 8,
  },
  progressBarFill: {
    width: '98%',
    height: '100%',
    backgroundColor: '#00F0FF',
    borderRadius: 100,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 10px #00F0FF' } as any : {})
  },
  heroFooterCTAs: {
    position: 'absolute',
    bottom: -60,
    alignItems: 'center',
    zIndex: 20,
  },
  discoverMoreBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } as any : {})
  },
  discoverMoreText: {
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#FFF',
    fontWeight: '500',
  },
  viewDemoText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#888',
    textDecorationLine: 'underline',
  },
  title: {
    fontFamily: 'Bebas Neue',
    fontSize: 90,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 85,
    letterSpacing: 2,
    marginBottom: 24,
    textTransform: 'uppercase',
  },
  titleMobile: {
    fontSize: 64,
    lineHeight: 64,
  },
  highlight: {
    color: '#FF005B',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 20,
    color: '#888',
    textAlign: 'center',
    lineHeight: 32,
    maxWidth: 600,
    fontWeight: '500',
  },
  workflowSection: {
    flexDirection: 'row',
    maxWidth: 1200,
    marginHorizontal: 'auto',
    paddingHorizontal: 24,
    marginTop: 100,
  },
  stickyNav: {
    width: 60,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { position: 'sticky', top: 150, height: 400 } : {}),
  },
  navItem: {
    fontFamily: 'Bebas Neue',
    fontSize: 24,
    color: '#333',
  },
  navItemActive: {
    fontFamily: 'Bebas Neue',
    fontSize: 24,
    color: '#00F0FF',
  },
  navLine: {
    width: 2,
    height: 100,
    backgroundColor: '#111',
    marginVertical: 16,
  },
  stepsContainer: {
    flex: 1,
    paddingLeft: 40,
  },
  stepBlock: {
    position: 'relative',
    marginBottom: 150,
    justifyContent: 'center',
  },
  bgNumeral: {
    fontFamily: 'Bebas Neue',
    fontSize: 300,
    color: '#0A0A0A',
    position: 'absolute',
    left: -20,
    top: -100,
    zIndex: 0,
    lineHeight: 300,
  },
  stepContent: {
    zIndex: 1,
    paddingTop: 40,
  },
  stepTitle: {
    fontFamily: 'Bebas Neue',
    fontSize: 64,
    color: '#FFF',
    marginBottom: 16,
    letterSpacing: 1,
  },
  stepDesc: {
    fontFamily: 'Inter',
    fontSize: 20,
    color: '#999',
    lineHeight: 32,
    maxWidth: 500,
  },
  bottomSectionWrapper: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
    marginTop: 40,
    borderTopWidth: 1,
    borderColor: '#111',
  },
  statsStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    zIndex: 10,
  },
  statItem: {
    alignItems: 'center',
    width: 250,
  },
  statValue: {
    fontFamily: 'Bebas Neue',
    fontSize: 80,
    color: '#FFF',
    lineHeight: 80,
    marginBottom: 8,
  },
  statTilde: {
    fontFamily: 'Bebas Neue',
    fontSize: 60,
    color: '#FF005B',
    marginBottom: 12,
    marginRight: 4,
  },
  statUnit: {
    fontFamily: 'Bebas Neue',
    fontSize: 40,
    color: '#00F0FF',
    marginBottom: 12,
    marginLeft: 4,
  },
  statLabel: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  statDivider: {
    width: 1,
    height: 80,
    backgroundColor: '#222',
  },
  livePulse: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF005B',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 20px #FF005B' } : {})
  },
  ctaFooter: {
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
    paddingBottom: 100,
  },
  ctaTitle: {
    fontFamily: 'Bebas Neue',
    fontSize: 80,
    color: '#FFF',
    marginBottom: 8,
    letterSpacing: 2,
    zIndex: 10,
    textShadowColor: 'rgba(255,0,91,0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 40,
  },
  ctaSubhead: {
    fontFamily: 'Inter',
    fontSize: 20,
    color: '#AAA',
    marginBottom: 24,
    zIndex: 10,
  },
  magneticBtn: {
    backgroundColor: '#FF005B',
    paddingHorizontal: 48,
    paddingVertical: 24,
    borderRadius: 100,
    zIndex: 10,
  },

  galleryCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { boxShadow: '0 20px 40px rgba(0,0,0,0.5)' } : {})
  },
  galleryCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 32,
    justifyContent: 'flex-end'
  },
  galleryCardNum: {
    fontFamily: 'Bebas Neue',
    fontSize: 80,
    color: '#00F0FF',
    lineHeight: 80,
    marginBottom: 8,
    opacity: 0.8
  },
  galleryCardTitle: {
    fontFamily: 'Bebas Neue',
    fontSize: 48,
    color: '#FFF',
    marginBottom: 12,
    letterSpacing: 1
  },
  galleryCardDesc: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#DDD',
    lineHeight: 24,
  },
  ctaBtnText: {
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 18,
    color: '#FFF',
    textTransform: 'uppercase',
    letterSpacing: 2,
  }
});
