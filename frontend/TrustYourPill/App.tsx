import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Bell,
  CalendarDays,
  ClipboardList,
  Clock,
  Flame,
  HeartPulse,
  House,
  LucideIcon,
  Phone,
  Plus,
  ShieldAlert,
  Sparkles,
  FileText,
  User,
  LayoutGrid
} from 'lucide-react-native';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
} from '@expo-google-fonts/geist';

const avatarUri = 'https://www.figma.com/api/mcp/asset/31e6ebca-e0bc-4a62-af12-46698246312f';
const paracetamolUri = 'https://www.figma.com/api/mcp/asset/97efda10-cf4f-423e-85cd-3c2d2addf400';
const ibuprofenUri = 'https://www.figma.com/api/mcp/asset/888b5795-7ac3-4d88-bbb5-b9480d6cfcc0';
const geistRegular = 'Geist_400Regular';
const geistMedium = 'Geist_500Medium';
const geistSemiBold = 'Geist_600SemiBold';

function AdherenceRing({ percent, size = 72 }: { percent: number; size?: number }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = circumference * (percent / 100);
  const gap = circumference - filled;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <SvgLinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#B44FD6" stopOpacity="1" />
            <Stop offset="100%" stopColor="#5C45E2" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={cx} cy={cy} r={r}
          stroke="rgba(0,0,0,0.18)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={cx} cy={cy} r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${filled} ${gap}`}
          strokeLinecap="round"
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 15, fontFamily: geistSemiBold, color: '#003d28', letterSpacing: -0.4, lineHeight: 16 }}>
          {percent}%
        </Text>
        <Text style={{ fontSize: 8, fontFamily: geistMedium, color: 'rgba(0,0,0,0.6)', letterSpacing: 0.3, textTransform: 'uppercase', marginTop: 1 }}>
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
        <Icon size={16} strokeWidth={2} style={styles.actionIcon} color={active ? '#000000' : '#111111'} />
      </View>
      {!compact ? <Text style={styles.actionLabel}>{label}</Text> : null}
    </Pressable>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { Icon: LucideIcon; label: string; isCenter?: true }[] = [
  { Icon: House, label: 'Home' },
  { Icon: FileText, label: 'Notes' },
  { Icon: User, label: 'Profile' },
  { Icon: LayoutGrid, label: 'Menu' },
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_H_PAD = 24; // margin from screen edge
const INNER_PAD = 10; // padding inside the bar
const TAB_HEIGHT = 48; // taller to match the image
const INACTIVE_SIZE = 48; // perfectly round circles for inactive
const ACTIVE_WIDTH = 110;

function BottomNav() {
  const [activeTab, setActiveTab] = useState(0);
  const plusOpenRef = useRef(false);

  const widthAnims = useRef(
    NAV_ITEMS.map((_, i) => new Animated.Value(i === 0 ? ACTIVE_WIDTH : INACTIVE_SIZE))
  ).current;
  const labelOpacities = useRef(
    NAV_ITEMS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;
  const pressScales = useRef(NAV_ITEMS.map(() => new Animated.Value(1))).current;
  const plusRotate = useRef(new Animated.Value(0)).current;
  const barSlideIn = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.spring(barSlideIn, {
      toValue: 0,
      bounciness: 10,
      speed: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleTabPress = (index: number) => {
    Animated.sequence([
      Animated.timing(pressScales[index], { toValue: 0.8, duration: 65, useNativeDriver: true }),
      Animated.spring(pressScales[index], { toValue: 1, bounciness: 22, speed: 22, useNativeDriver: true }),
    ]).start();

    if (index === 2) {
      const toValue = plusOpenRef.current ? 0 : 1;
      plusOpenRef.current = !plusOpenRef.current;
      Animated.timing(plusRotate, { toValue, duration: 300, useNativeDriver: true }).start();
    }

    if (activeTab === index) return;

    Animated.spring(widthAnims[activeTab], {
      toValue: INACTIVE_SIZE,
      bounciness: 4,
      speed: 18,
      useNativeDriver: false,
    }).start();
    Animated.timing(labelOpacities[activeTab], { toValue: 0, duration: 85, useNativeDriver: true }).start();

    Animated.spring(widthAnims[index], {
      toValue: ACTIVE_WIDTH,
      bounciness: 9,
      speed: 15,
      useNativeDriver: false,
    }).start();
    Animated.timing(labelOpacities[index], { toValue: 1, duration: 200, delay: 115, useNativeDriver: true }).start();

    setActiveTab(index);
  };

  const plusRotation = plusRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '135deg'],
  });

  return (
    <Animated.View style={[navStyles.outerWrap, { transform: [{ translateY: barSlideIn }] }]}>
      {/* top separator line — glass edge effect */}
      <View style={navStyles.topBorder} />
      <BlurView intensity={90} tint="light" style={navStyles.blurBar}>
        <View style={navStyles.glassOverlay} />
        <View style={navStyles.tabsRow}>
          {NAV_ITEMS.map((item, index) => {
            const isActive = activeTab === index;
            const { Icon, label, isCenter } = item;

            return (
              <Pressable key={index} onPress={() => handleTabPress(index)} style={navStyles.tabFlex}>
                <Animated.View
                  style={[
                    navStyles.tab,
                    {
                      width: widthAnims[index],
                      backgroundColor: isActive ? '#2563EB' : 'rgba(0,0,0,0.04)',
                    },
                  ]}
                >
                  <Animated.View
                    style={{
                      transform: [
                        { scale: pressScales[index] },
                      ],
                    }}
                  >
                    <Icon
                      size={20}
                      color={isActive ? '#FFFFFF' : '#111111'}
                      strokeWidth={isActive ? 2.3 : 1.8}
                    />
                  </Animated.View>
                  <Animated.Text
                    numberOfLines={1}
                    style={[navStyles.tabLabel, { opacity: labelOpacities[index] }]}
                  >
                    {label}
                  </Animated.Text>
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </Animated.View>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
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

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Day in Pills</Text>
            <Text style={styles.sectionMeta}>
              Next appointment: <Text style={styles.sectionMetaStrong}>Monday</Text>
            </Text>
          </View>

          {/* Hero adherence card — light pastel gradient */}
          <LinearGradient
            colors={['#F4D6E4', '#D9C8EF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.adherenceCard}
          >
            <Text style={styles.cardLabel}>Today's adherence</Text>
            <View style={styles.adherenceRow}>
              <View>
                <Text style={styles.adherenceValue}>
                  2<Text style={styles.adherenceUnit}> of 4</Text>
                </Text>
                <Text style={styles.cardMeta}>pills taken</Text>
              </View>
              <AdherenceRing percent={50} size={72} />
            </View>
          </LinearGradient>

          {/* Pill row */}
          <View style={styles.row}>
            <LinearGradient
              colors={['#E8F4FA', '#CFE5F2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gridCard, styles.pillCard]}
            >
              <Text style={styles.cardLabel}>Paracetamol</Text>
              <Image source={{ uri: paracetamolUri }} style={styles.pillImage} resizeMode="contain" />
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
              <Text style={styles.cardLabel}>Ibuprofen</Text>
              <Image source={{ uri: ibuprofenUri }} style={styles.pillImage} resizeMode="contain" />
              <View>
                <Text style={styles.pillDose}>200mg</Text>
                <Text style={styles.cardMeta}>Anti-inflam.</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Stats row */}
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

        <BottomNav />
      </View>
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
    paddingBottom: 22,
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
    marginTop: 22,
  },
  actionCard: {
    flex: 1,
    height: 43,
    borderRadius: 20,
    backgroundColor: '#EFEFEF',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
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
    width: 43,
    justifyContent: 'center',
    paddingHorizontal: 0,
    backgroundColor: '#006BFF',
  },
  actionCardSolid: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    backgroundColor: '#006BFF',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#006BFF',
    shadowOpacity: 0.4,
    shadowRadius: 6.6,
    shadowOffset: { width: 0, height: 0 },
  },
  actionIconCircle: {
    width: 29,
    height: 29,
    borderRadius: 14.5,
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
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.36,
    color: '#000000',
    fontFamily: geistMedium,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 110,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
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
  },
  adherenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 18,
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
  },
  gridCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
  },
  pillCard: {
    height: 168,
    justifyContent: 'space-between',
  },
  pillImage: {
    width: '100%',
    height: 64,
    marginVertical: 2,
  },
  pillDose: {
    fontSize: 22,
    lineHeight: 24,
    color: '#000000',
    fontFamily: geistSemiBold,
    letterSpacing: -0.5,
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

const navStyles = StyleSheet.create({
  outerWrap: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  topBorder: {
    display: 'none',
  },
  blurBar: {
    overflow: 'hidden',
    borderRadius: 100,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: SCREEN_WIDTH - BAR_H_PAD * 2 - 24,
  },
  tabFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    height: TAB_HEIGHT,
    borderRadius: TAB_HEIGHT / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 14,
    gap: 8,
  },
  tabLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: -0.3,
    fontFamily: geistMedium,
  },
});
