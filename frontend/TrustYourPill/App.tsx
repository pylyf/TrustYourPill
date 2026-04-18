import { useEffect, useRef } from 'react';
import React, { useState } from 'react';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  CalendarDays,
  Clock,
  Flame,
  HeartPulse,
  LucideIcon,
  Phone,
  Target,
} from 'lucide-react-native';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
} from '@expo-google-fonts/geist';
import { BottomNav } from './components/BottomNav';
import { ScanScreen } from './components/ScanScreen';

const avatarUri = 'https://www.figma.com/api/mcp/asset/31e6ebca-e0bc-4a62-af12-46698246312f';
const paracetamolUri = 'https://www.figma.com/api/mcp/asset/97efda10-cf4f-423e-85cd-3c2d2addf400';
const ibuprofenUri = 'https://www.figma.com/api/mcp/asset/888b5795-7ac3-4d88-bbb5-b9480d6cfcc0';
const geistRegular = 'Geist_400Regular';
const geistMedium = 'Geist_500Medium';
const geistSemiBold = 'Geist_600SemiBold';

function AdherenceHalfRing({ percent, size = 120, textColor = '#000' }: { percent: number; size?: number; textColor?: string }) {
  const stroke = 11;
  const r = (size - stroke * 2) / 2;
  const cx = size / 2;
  const startX = cx - r;
  const startY = cx;
  const endX   = cx + r;
  const endY   = cx;
  const viewH  = cx + stroke / 2 + 6;
  const halfCirc = Math.PI * r;

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percent / 100,
      duration: 1100,
      delay: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent]);

  const animatedDash = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [`0 ${halfCirc}`, `${halfCirc} ${halfCirc}`],
  });

  const AnimatedPath = Animated.createAnimatedComponent(Path);

  return (
    <View style={{ width: size, height: viewH }}>
      <Svg width={size} height={viewH} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Defs>
          <SvgLinearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#EF4444" stopOpacity="1" />
            <Stop offset="50%" stopColor="#F97316" stopOpacity="1" />
            <Stop offset="100%" stopColor="#22C55E" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        {/* Track background */}
        <Path
          d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
          stroke={textColor === '#000000' || textColor === '#000' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />
        {/* Animated vibrant gradient fill */}
        <AnimatedPath
          d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
          stroke="url(#arcGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={animatedDash}
        />
      </Svg>
      <View style={{ position: 'absolute', bottom: 4, left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ fontSize: 22, fontFamily: geistSemiBold, color: textColor, letterSpacing: -1, lineHeight: 24 }}>
          {percent}%
        </Text>
        <Text style={{ fontSize: 9, fontFamily: geistMedium, color: textColor === '#000000' || textColor === '#000' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)', letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 1 }}>
          done
        </Text>
      </View>
    </View>
  );
}

type ActionCardProps = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  compact?: boolean;
  solid?: boolean;
};

function ActionCard({ label, icon: Icon, active = false, compact = false, solid = false }: ActionCardProps) {
  if (solid) {
    return (
      <Pressable style={styles.actionCardSolid}>
        <Icon size={20} strokeWidth={2.2} color="#FFFFFF" />
      </Pressable>
    );
  }
  return (
    <Pressable
      style={[
        styles.actionCard,
        active && styles.actionCardActive,
        compact && styles.actionCardCompact,
      ]}
    >
      <View style={[styles.actionIconCircle, active && styles.actionIconCircleActive]}>
        <Icon size={20} strokeWidth={2.1} style={styles.actionIcon} color={active ? '#000000' : '#111111'} />
      </View>
      {!compact ? <Text style={styles.actionLabel}>{label}</Text> : null}
    </Pressable>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [isScanVisible, setIsScanVisible] = useState(false);

  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.topBar}>
              <View style={styles.profileRow}>
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
                <View>
                  <Text style={styles.greeting}>Good morning,</Text>
                  <Text style={styles.name}>Hans</Text>
                </View>
              </View>
              <View style={styles.notificationButton}>
                <Bell color="#000000" size={22} strokeWidth={2.1} />
              </View>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusLine} />
              <Text style={styles.statusText}>All in clear</Text>
            </View>

            <Text style={styles.headline}>How Are You</Text>
            <Text style={styles.headline}>Feeling Today?</Text>

            <View style={styles.actionsRow}>
              <ActionCard label="Daily Checkup" icon={HeartPulse} active />
              <ActionCard label="Appointments" icon={CalendarDays} />
              <ActionCard label="" icon={Phone} active compact solid />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Day in Pills</Text>
            <Text style={styles.sectionMeta}>
              Next appointment: <Text style={styles.sectionMetaStrong}>Monday</Text>
            </Text>
          </View>

          <LinearGradient
            colors={['#FFFFFF', '#F9FAFB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.adherenceCard, styles.adherenceCardLight]}
          >
            <View style={styles.adherenceContentLight}>
              <View style={styles.adherenceTextCol}>
                <View style={styles.adherenceHeaderLight}>
                  <View style={styles.adherenceIconWrap}>
                    <Target color="#111827" size={14} strokeWidth={3} />
                  </View>
                  <Text style={styles.adherenceLabelLight}>Today's Progress</Text>
                </View>
                
                <Text style={styles.adherenceValueLight}>
                  2<Text style={styles.adherenceUnitLight}>/4</Text>
                </Text>
                <Text style={styles.adherenceSubLight}>pills taken</Text>
              </View>

              <View style={styles.adherenceRingWrap}>
                <AdherenceHalfRing percent={50} size={110} textColor="#000000" />
              </View>
            </View>
          </LinearGradient>

          <View style={styles.row}>
            <LinearGradient
              colors={['#E8F4FA', '#CFE5F2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gridCard, styles.pillCard]}
            >
              <Text style={styles.pillName}>Paracetamol</Text>
              <View style={styles.pillImageWrap}>
                <Image source={{ uri: paracetamolUri }} style={styles.pillImage} resizeMode="contain" />
              </View>
              <View>
                <Text style={styles.pillDose}>500mg</Text>
                <Text style={styles.cardMeta}>Pain relief</Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['#E2DBF6', '#C9BFEE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gridCard, styles.pillCard]}
            >
              <Text style={styles.pillName}>Ibuprofen</Text>
              <View style={styles.pillImageWrap}>
                <Image source={{ uri: ibuprofenUri }} style={styles.pillImage} resizeMode="contain" />
              </View>
              <View>
                <Text style={styles.pillDose}>200mg</Text>
                <Text style={styles.cardMeta}>Anti-inflam.</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.row}>
            <LinearGradient
              colors={['#D9EFDC', '#BFE3C8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gridCard, styles.statCard]}
            >
              <View style={styles.statHeader}>
                <Flame color="#1C6B3A" size={15} strokeWidth={2.4} />
                <Text style={styles.cardLabel}>Streak</Text>
              </View>
              <Text style={styles.statValue}>
                12<Text style={styles.statUnit}> days</Text>
              </Text>
              <Text style={styles.cardMeta}>Personal best</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#FCE2CF', '#F6C9A8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gridCard, styles.statCard]}
            >
              <View style={styles.statHeader}>
                <Clock color="#8A3A14" size={15} strokeWidth={2.4} />
                <Text style={styles.cardLabel}>Next dose</Text>
              </View>
              <Text style={styles.statValue}>
                2:30<Text style={styles.statUnit}> PM</Text>
              </Text>
              <Text style={styles.cardMeta}>Paracetamol</Text>
            </LinearGradient>
          </View>
        </ScrollView>

        <BottomNav onAddPress={() => setIsScanVisible(true)} />
      </View>
      <ScanScreen visible={isScanVisible} onClose={() => setIsScanVisible(false)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  hero: {
    backgroundColor: '#EAEAEA',
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    paddingTop: 18,
    paddingHorizontal: 35,
    paddingBottom: 28,
    marginBottom: 4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  greeting: {
    fontSize: 13,
    lineHeight: 15,
    letterSpacing: -0.3,
    color: '#000000',
    marginBottom: 4,
    fontFamily: geistRegular,
  },
  name: {
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: -0.5,
    color: '#000000',
    fontFamily: geistSemiBold,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 40,
  },
  statusLine: {
    width: 10,
    height: 1,
    borderRadius: 2,
    backgroundColor: '#26B81E',
    shadowColor: '#52FF4A',
    shadowOpacity: 1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  statusText: {
    color: '#26B81E',
    fontSize: 13,
    lineHeight: 24,
    letterSpacing: -0.39,
    fontFamily: geistMedium,
  },
  headline: {
    fontSize: 41,
    lineHeight: 42,
    letterSpacing: -1.23,
    color: '#000000',
    fontFamily: geistMedium,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 32,
  },
  actionCard: {
    flex: 1,
    height: 52,
    borderRadius: 22,
    backgroundColor: '#EFEFEF',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  actionCardActive: {
    shadowColor: '#006BFF',
    shadowOpacity: 0.4,
    shadowRadius: 6.6,
    shadowOffset: { width: 0, height: 0 },
  },
  actionCardCompact: {
    flex: 0,
    width: 52,
    justifyContent: 'center',
    paddingHorizontal: 0,
    backgroundColor: '#006BFF',
  },
  actionCardSolid: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#006BFF',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#006BFF',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconCircleActive: {
    backgroundColor: '#FFFFFF',
  },
  actionIcon: {
    opacity: 0.96,
  },
  actionLabel: {
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: -0.4,
    color: '#000000',
    fontFamily: geistMedium,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingBottom: 110,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 28,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.6,
    color: '#000000',
    fontFamily: geistSemiBold,
  },
  sectionMeta: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.25,
    color: 'rgba(0,0,0,0.5)',
    fontFamily: geistRegular,
  },
  sectionMetaStrong: {
    color: '#000000',
    fontFamily: geistSemiBold,
  },
  cardLabel: {
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(0,0,0,0.7)',
    fontFamily: geistMedium,
    letterSpacing: -0.2,
  },
  cardMeta: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.55)',
    fontFamily: geistMedium,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  adherenceCard: {
    borderRadius: 22,
    padding: 20,
    marginHorizontal: 28,
  },
  adherenceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 10,
  },
  adherenceCardLight: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    paddingHorizontal: 24,
    paddingVertical: 22,
  },
  adherenceContentLight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  adherenceTextCol: {
    flex: 1,
    paddingBottom: 4,
  },
  adherenceHeaderLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  adherenceIconWrap: {
    backgroundColor: '#F3F4F6',
    padding: 5,
    borderRadius: 8,
  },
  adherenceLabelLight: {
    fontSize: 14,
    lineHeight: 18,
    color: '#4B5563',
    fontFamily: geistSemiBold,
    letterSpacing: -0.2,
  },
  adherenceValueLight: {
    fontSize: 36,
    lineHeight: 38,
    color: '#111827',
    fontFamily: geistSemiBold,
    letterSpacing: -1.2,
  },
  adherenceUnitLight: {
    fontSize: 22,
    color: '#6B7280',
    fontFamily: geistMedium,
    letterSpacing: -0.4,
  },
  adherenceSubLight: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: geistMedium,
    letterSpacing: -0.2,
    marginTop: 4,
  },
  adherenceRingWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  adherenceValue: {
    fontSize: 40,
    lineHeight: 42,
    color: '#000000',
    fontFamily: geistSemiBold,
    letterSpacing: -1.3,
  },
  adherenceUnit: {
    fontSize: 20,
    color: 'rgba(0,0,0,0.6)',
    fontFamily: geistMedium,
    letterSpacing: -0.4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 28,
  },
  gridCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
  },
  pillCard: {
    aspectRatio: 1,
    justifyContent: 'space-between',
  },
  pillImageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  pillImage: {
    width: '100%',
    height: '100%',
  },
  pillDose: {
    fontSize: 24,
    lineHeight: 26,
    color: '#000000',
    fontFamily: geistSemiBold,
    letterSpacing: -0.6,
  },
  pillName: {
    fontSize: 17,
    lineHeight: 20,
    color: 'rgba(0,0,0,0.85)',
    fontFamily: geistSemiBold,
    letterSpacing: -0.4,
  },
  statCard: {
    height: 120,
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 30,
    lineHeight: 32,
    color: '#000000',
    fontFamily: geistSemiBold,
    letterSpacing: -0.9,
  },
  statUnit: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.6)',
    fontFamily: geistMedium,
    letterSpacing: -0.3,
  },
});
