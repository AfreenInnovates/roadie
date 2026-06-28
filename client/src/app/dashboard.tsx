import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput,
  TouchableOpacity, 
  ScrollView, 
  useWindowDimensions,
  Platform,
  Pressable,
  Image,
  Linking
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  FadeInUp,
  FadeIn,
  useAnimatedProps
} from 'react-native-reanimated';
import { Search, MapPin, Zap, AlertCircle, Calendar, ExternalLink, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import Svg, { Path, Circle, Defs, Filter, FeDropShadow } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const API_BASE_URL = 'https://roadie.onrender.com/api';
const mascotLoading = require('../assets/images/mascot_loading.png');
const mascotHome = require('../assets/images/mascot_home.png');

function ParallaxCard({ children, style }: { children: React.ReactNode, style?: any }) {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const handleMove = (e: any) => {
    if (Platform.OS === 'web') {
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      rotateX.value = withSpring((centerY - y) / 20, { damping: 20 });
      rotateY.value = withSpring((x - centerX) / 20, { damping: 20 });
    }
  };

  const handleLeave = () => {
    rotateX.value = withSpring(0);
    rotateY.value = withSpring(0);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` }
    ]
  }));

  return (
    <Animated.View 
      style={[style, animatedStyle]}
      // @ts-ignore
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {children}
    </Animated.View>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [text]);

  return <Text style={styles.typewriterText}>{displayed}</Text>;
}

function RouteMapDrawing() {
  const progress = useSharedValue(1000);
  
  useEffect(() => {
    progress.value = withTiming(0, { duration: 2000, easing: Easing.out(Easing.cubic) });
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: progress.value
  }));

  return (
    <View style={styles.mapBox}>
      <Svg width="100%" height="100%" viewBox="0 0 300 200">
        <Defs>
           <Filter id="glow">
             <FeDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00F0FF" />
           </Filter>
        </Defs>
        <Circle cx="40" cy="160" r="6" fill="#FF005B" />
        <AnimatedPath 
          d="M 40,160 Q 150,50 260,100" 
          stroke="#00F0FF" 
          strokeWidth="3" 
          fill="none" 
          strokeDasharray="1000"
          animatedProps={animatedProps}
          filter="url(#glow)"
        />
        <Circle cx="260" cy="100" r="6" fill="#00F0FF" />
      </Svg>
    </View>
  );
}

function StagedLoader({ stage, artistName }: { stage: 'tour' | 'airbnb' | 'groq' | null, artistName?: string }) {
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    if (stage === 'tour') setLoadingText(artistName ? `Scanning ${artistName} tours...` : 'Scanning artist tour data...');
    else if (stage === 'airbnb') setLoadingText('Scanning Airbnb listings nearby...');
    else if (stage === 'groq') setLoadingText('Asking Groq to compare stays...');
  }, [stage, artistName]);

  const css = `
    .loader {
      --color-one: #ffbf48;
      --color-two: #be4a1d;
      --color-three: #ffbf4780;
      --color-four: #bf4a1d80;
      --color-five: #ffbf4740;
      --time-animation: 2s;
      --size: 0.8;
      position: relative;
      border-radius: 50%;
      transform: scale(var(--size));
      box-shadow: 0 0 25px 0 var(--color-three), 0 20px 50px 0 var(--color-four);
      animation: colorize calc(var(--time-animation) * 3) ease-in-out infinite;
    }
    .loader::before {
      content: "";
      position: absolute;
      top: 0; left: 0; width: 100px; height: 100px; border-radius: 50%;
      border-top: solid 1px var(--color-one); border-bottom: solid 1px var(--color-two);
      background: linear-gradient(180deg, var(--color-five), var(--color-four));
      box-shadow: inset 0 10px 10px 0 var(--color-three), inset 0 -10px 10px 0 var(--color-four);
    }
    .loader .box {
      width: 100px; height: 100px;
      background: linear-gradient(180deg, var(--color-one) 30%, var(--color-two) 70%);
      mask: url(#clipping); -webkit-mask: url(#clipping);
    }
    .loader svg { position: absolute; }
    .loader svg #clipping { filter: contrast(15); animation: roundness calc(var(--time-animation) / 2) linear infinite; }
    .loader svg #clipping polygon { filter: blur(7px); }
    .loader svg #clipping polygon:nth-child(1) { transform-origin: 75% 25%; transform: rotate(90deg); }
    .loader svg #clipping polygon:nth-child(2) { transform-origin: 50% 50%; animation: rotation var(--time-animation) linear infinite reverse; }
    .loader svg #clipping polygon:nth-child(3) { transform-origin: 50% 60%; animation: rotation var(--time-animation) linear infinite; animation-delay: calc(var(--time-animation) / -3); }
    .loader svg #clipping polygon:nth-child(4) { transform-origin: 40% 40%; animation: rotation var(--time-animation) linear infinite reverse; }
    .loader svg #clipping polygon:nth-child(5) { transform-origin: 40% 40%; animation: rotation var(--time-animation) linear infinite reverse; animation-delay: calc(var(--time-animation) / -2); }
    .loader svg #clipping polygon:nth-child(6) { transform-origin: 60% 40%; animation: rotation var(--time-animation) linear infinite; }
    .loader svg #clipping polygon:nth-child(7) { transform-origin: 60% 40%; animation: rotation var(--time-animation) linear infinite; animation-delay: calc(var(--time-animation) / -1.5); }
    @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes roundness { 0%, 60%, 100% { filter: contrast(15); } 20%, 40% { filter: contrast(3); } }
    @keyframes colorize { 0%, 100% { filter: hue-rotate(0deg); } 20% { filter: hue-rotate(-30deg); } 40% { filter: hue-rotate(-60deg); } 60% { filter: hue-rotate(-90deg); } 80% { filter: hue-rotate(-45deg); } }
  `;

  const htmlContent = `
    <style>${css}</style>
    <div class="loader">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <defs>
          <mask id="clipping">
            <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
            <polygon points="25,25 75,25 50,75" fill="white"></polygon>
            <polygon points="50,25 75,75 25,75" fill="white"></polygon>
            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
          </mask>
        </defs>
      </svg>
      <div class="box"></div>
    </div>
  `;

  return (
    <View style={styles.loadingContainer}>
      {Platform.OS === 'web' ? (
        React.createElement('div', { dangerouslySetInnerHTML: { __html: htmlContent } })
      ) : (
        <Image source={mascotLoading} style={{ width: 100, height: 100, resizeMode: 'contain' }} />
      )}
      <Text style={[styles.loadingLabel, { marginTop: 32 }]}>{loadingText}</Text>
    </View>
  );
}

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [artist, setArtist] = useState('');
  const [loadingTours, setLoadingTours] = useState(false);
  const [toursData, setToursData] = useState<any>(null);
  const [loadingAirbnb, setLoadingAirbnb] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchedArtist, setSearchedArtist] = useState<string>('');
  const [airbnbData, setAirbnbData] = useState<any>(null);
  const [selectedVenue, setSelectedVenue] = useState<string>('');

  const fetchTours = async () => {
    if (!artist.trim()) return;
    setLoadingTours(true);
    setError(null);
    setToursData(null);
    setAirbnbData(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/tours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist: artist })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.detail || 'Failed to fetch tours');
      setToursData(json);
      setSearchedArtist(artist.trim());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingTours(false);
    }
  };

  const fetchAirbnb = async (city: string, date: string, venue: string) => {
    setLoadingAirbnb(city);
    setSelectedVenue(venue);
    setError(null);
    setAirbnbData(null);
    try {
      const response = await fetch(`${API_BASE_URL}/airbnb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, date })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.detail || 'Failed to fetch Airbnb listings');
      
      setAirbnbData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAirbnb(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.contentContainer, isMobile && { paddingHorizontal: 16 }]} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInUp.duration(600)} style={styles.commandBarSection}>
          <Text style={styles.title}>{searchedArtist ? `${searchedArtist}'s Tour Dates` : 'Track Your Artist.'}</Text>
          <View style={[styles.searchBar, isMobile && styles.searchBarMobile]}>
            <Search size={24} color="#FF005B" style={{ marginLeft: 20 }} />
            <TextInput 
              style={styles.searchInput}
              placeholder="e.g. Coldplay, Taylor Swift, Fred Again"
              placeholderTextColor="#444"
              value={artist}
              onChangeText={setArtist}
              onSubmitEditing={fetchTours}
            />
            <TouchableOpacity 
              style={[styles.analyzeButton, loadingTours && styles.analyzeButtonDisabled, isMobile && { width: '100%', marginRight: 0, marginTop: 8 }]}
              onPress={fetchTours}
              disabled={loadingTours}
            >
              <Text style={styles.analyzeButtonText}>TRACK</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={20} color="#FF005B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {loadingAirbnb && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,5,5,0.85)', zIndex: 999, justifyContent: 'center', alignItems: 'center', height: '100vh' }]}>
             <StagedLoader stage="airbnb" />
          </View>
        )}

        {loadingTours && <StagedLoader stage="tour" artistName={searchedArtist || artist} />}

        {!loadingTours && toursData && !airbnbData && (
          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.toursContainer}>
            <Text style={styles.sectionHeading}>Upcoming Dates</Text>
            <View style={styles.toursGrid}>
              {toursData.tour_dates.map((tour: any, idx: number) => (
                <ParallaxCard key={idx} style={styles.tourCardMin}>
                  <Image source={mascotHome} style={styles.hoveringMascot} />
                  <View style={styles.tourCardAccent} />
                  <Text style={styles.tourCityMin}>{tour.city}</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                    <Calendar size={14} color="#00F0FF" style={{marginRight: 6}} />
                    <Text style={styles.tourDateMin}>{tour.date}</Text>
                  </View>
                  <Text style={styles.tourVenueMin}>{tour.venue}</Text>
                  <TouchableOpacity 
                    style={styles.selectBtnSolid}
                    onPress={() => fetchAirbnb(tour.city, tour.date, tour.venue)}
                    disabled={loadingAirbnb !== null || loadingTours}
                  >
                    <Text style={styles.selectBtnTextSolid}>{loadingAirbnb === tour.city ? 'SCRAPING...' : 'SCRAPE LODGING'}</Text>
                  </TouchableOpacity>
                </ParallaxCard>
              ))}
            </View>
          </Animated.View>
        )}

        {/* LODGING RESULTS VIEW */}
        {airbnbData && (
          <Animated.View entering={FadeInUp.duration(600)} style={{width: '100%', alignItems: 'center'}}>
            
            <View style={{width: '100%'}}>
              <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', marginBottom: 32}} onPress={() => setAirbnbData(null)}>
                <ArrowLeft color="#00F0FF" size={20} style={{marginRight: 8}} />
                <Text style={{color: '#00F0FF', fontFamily: 'Inter', fontSize: 16, fontWeight: 'bold'}}>Back to Tours</Text>
              </TouchableOpacity>
              <Text style={[styles.sectionHeading, {textAlign: 'left', fontSize: 48, marginBottom: 40}]}>LODGING RECOMMENDATIONS</Text>
            </View>

            <View style={[styles.bentoGrid, isMobile && { flexDirection: 'column' }]}>
              
              <View style={[styles.roadiePickCard, isMobile && { minWidth: '100%', flex: 'none' }]}>
                 <View style={styles.glowBorder} />
                 <View style={styles.roadiePickContent}>
                   <View style={styles.badgeRow}>
                     <View style={styles.aiBadge}>
                       <Zap size={14} color="#00F0FF" />
                       <Text style={styles.aiBadgeText}>AI ROADIE PICK</Text>
                     </View>
                     <Text style={styles.bentoCity}>{airbnbData.airbnb_data.city}</Text>
                   </View>
                   
                   <View style={styles.reasoningBox}>
                      <Markdown style={markdownStyles}>{airbnbData.groq_recommendation}</Markdown>
                      <TouchableOpacity style={styles.viewAirbnbBtnMain} onPress={() => Linking.openURL(`https://airbnb.com/s/${encodeURIComponent(airbnbData.airbnb_data.city)}`)}>
                        <Text style={styles.viewAirbnbText}>View on Airbnb ↗</Text>
                      </TouchableOpacity>
                   </View>
                 </View>
              </View>

              <View style={[styles.bentoRightColumn, isMobile && { minWidth: '100%', flex: 'none' }]}>
                 <View style={styles.bentoMapCard}>
                    <Text style={styles.bentoMapTitle}>Distance to Venue</Text>
                    <RouteMapDrawing />
                    
                    <View style={{flexDirection: 'row', gap: 12}}>
                      <TouchableOpacity style={[styles.googleMapsBtn, {flex: 1}]} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedVenue + ', ' + airbnbData.airbnb_data.city)}`)}>
                         <Text style={styles.googleMapsText}>Venue Map</Text>
                         <ExternalLink size={14} color="#00F0FF" style={{marginLeft: 4}} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={[styles.googleMapsBtn, {flex: 1}]} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(airbnbData.airbnb_data.city + ' Airbnb')}`)}>
                         <Text style={styles.googleMapsText}>Airbnb Map</Text>
                         <ExternalLink size={14} color="#00F0FF" style={{marginLeft: 4}} />
                      </TouchableOpacity>
                    </View>

                 </View>

                 <View style={styles.bentoListingsCard}>
                   <Text style={styles.bentoListingsTitle}>Alternate Options</Text>
                   <ScrollView nestedScrollEnabled style={{maxHeight: 300}}>
                     {airbnbData.airbnb_data.listings.map((listing: any, i: number) => (
                       <TouchableOpacity key={i} onPress={() => Linking.openURL(listing.link || `https://airbnb.com/s/${airbnbData.airbnb_data.city}`)}>
                         <ParallaxCard style={styles.altListingCard}>
                           <View style={{flex: 1}}>
                             <Text style={styles.altListingName}>{listing.title}</Text>
                             <Text style={styles.altListingDist}>{listing.distance_to_venue_miles} mi away • ★ {listing.rating}</Text>
                           </View>
                           <View style={styles.priceTag}>
                             <Text style={styles.priceTagText}>${listing.price_per_night_usd}</Text>
                           </View>
                         </ParallaxCard>
                       </TouchableOpacity>
                     ))}
                   </ScrollView>
                 </View>
              </View>
            </View>
          </Animated.View>
        )}

        <View style={{height: 120}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  contentContainer: { paddingTop: 60, paddingHorizontal: 32, maxWidth: 1200, marginHorizontal: 'auto', width: '100%' },
  commandBarSection: { alignItems: 'center', marginBottom: 40 },
  title: { fontFamily: 'Bebas Neue', fontSize: 64, color: '#FFF', marginBottom: 24, letterSpacing: 2 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A',
    borderRadius: 100, borderWidth: 1, borderColor: '#222', width: '100%', maxWidth: 700,
  },
  searchBarMobile: { flexDirection: 'column', borderRadius: 24, padding: 8 },
  searchInput: { flex: 1, height: 70, color: '#FFF', fontFamily: 'Inter', fontSize: 18, paddingHorizontal: 20, outlineStyle: 'none' },
  analyzeButton: {
    backgroundColor: '#FF005B', height: 56, borderRadius: 100, paddingHorizontal: 32,
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  analyzeButtonDisabled: { backgroundColor: '#333' },
  analyzeButtonText: { fontFamily: 'Inter', color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  loadingContainer: { alignItems: 'center', padding: 60 },
  loadingLabel: { fontFamily: 'Bebas Neue', color: '#00F0FF', fontSize: 24, letterSpacing: 2 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 0, 91, 0.1)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FF005B', marginBottom: 24 },
  errorText: { color: '#FF005B', marginLeft: 12, fontFamily: 'Inter' },
  toursContainer: { marginBottom: 60, alignItems: 'center' },
  sectionHeading: { fontFamily: 'Bebas Neue', fontSize: 32, color: '#FFF', marginBottom: 20, letterSpacing: 1, textAlign: 'center' },
  toursGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  tourCardMin: {
    backgroundColor: '#0A0A0A', borderRadius: 16, padding: 24, width: '100%', maxWidth: 280, flexGrow: 1,
    borderWidth: 1, borderColor: '#222'
  },
  tourCityMin: { fontFamily: 'Bebas Neue', fontSize: 28, color: '#FFF', lineHeight: 32 },
  tourDateMin: { fontFamily: 'Inter', fontSize: 13, color: '#00F0FF', marginBottom: 8, fontWeight: 'bold' },
  tourVenueMin: { fontFamily: 'Inter', fontSize: 13, color: '#888', marginBottom: 20 },
  tourCardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#00F0FF',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  hoveringMascot: {
    position: 'absolute',
    right: -25,
    top: -45,
    width: 90,
    height: 90,
    resizeMode: 'contain',
    zIndex: 20,
  },
  selectBtnSolid: {
    backgroundColor: '#FF005B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectBtnTextSolid: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  typewriterText: { fontFamily: 'Inter', fontSize: 20, color: '#FFF', lineHeight: 32, fontWeight: '500' },
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, width: '100%', maxWidth: 1200 },
  roadiePickCard: { flex: 2, minWidth: 350, backgroundColor: '#0A0A0A', borderRadius: 24, position: 'relative', overflow: 'hidden' },
  glowBorder: { ...StyleSheet.absoluteFillObject, borderWidth: 2, borderColor: '#FF005B', borderRadius: 24, opacity: 0.5 },
  roadiePickContent: { padding: 40 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 240, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(0,240,255,0.3)' },
  aiBadgeText: { color: '#00F0FF', fontFamily: 'Inter', fontSize: 12, fontWeight: 'bold', marginLeft: 6, letterSpacing: 1 },
  bentoCity: { fontFamily: 'Bebas Neue', fontSize: 24, color: '#555', letterSpacing: 1 },
  reasoningBox: { flex: 1 },
  bentoRightColumn: { flex: 1, minWidth: 300, gap: 24 },
  bentoMapCard: { backgroundColor: '#0A0A0A', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#222', height: 200 },
  bentoMapTitle: { fontFamily: 'Inter', fontSize: 14, color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  mapBox: { flex: 1, overflow: 'hidden' },
  bentoListingsCard: { backgroundColor: '#0A0A0A', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#222', flex: 1 },
  bentoListingsTitle: { fontFamily: 'Inter', fontSize: 14, color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 },
  altListingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 16, marginBottom: 12 },
  altListingName: { fontFamily: 'Inter', fontSize: 15, color: '#FFF', fontWeight: '600', marginBottom: 4 },
  altListingDist: { fontFamily: 'Inter', fontSize: 12, color: '#888' },
  priceTag: { backgroundColor: 'rgba(255, 0, 91, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  priceTagText: { fontFamily: 'Bebas Neue', fontSize: 20, color: '#FF005B' },
  viewAirbnbBtnMain: { backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#333', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 100, alignSelf: 'flex-start', marginTop: 24 },
  viewAirbnbText: { fontFamily: 'Inter', color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  googleMapsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 8, backgroundColor: 'rgba(0, 240, 255, 0.1)', borderRadius: 8 },
  googleMapsText: { fontFamily: 'Inter', color: '#00F0FF', fontSize: 12, fontWeight: 'bold' }
});

const markdownStyles = StyleSheet.create({
  body: {
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#FFF',
    lineHeight: 28,
  },
  strong: {
    fontWeight: 'bold',
    color: '#FF005B',
  },
});
