import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
        <Icon
          size={16}
          strokeWidth={2}
          style={styles.actionIcon}
          color={active ? '#000000' : '#111111'}
        />
      </View>
      {!compact ? <Text style={styles.actionLabel}>{label}</Text> : null}
    </Pressable>
  );
}

function NavIcon({ icon: Icon, active = false }: { icon: LucideIcon; active?: boolean }) {
  if (active) {
    return (
      <View style={styles.plusButton}>
        <Plus color="#FFFFFF" size={28} strokeWidth={2.2} />
      </View>
    );
  }

  return <Icon size={23} strokeWidth={2.1} color="#111111" style={styles.navIcon} />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

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
              <View style={styles.ring}>
                <Text style={styles.ringText}>50%</Text>
              </View>
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

        <View style={styles.bottomWrap}>
          <View style={styles.bottomBar}>
            <NavIcon icon={House} />
            <NavIcon icon={ClipboardList} />
            <NavIcon icon={Plus} active />
            <NavIcon icon={Sparkles} />
            <NavIcon icon={ShieldAlert} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

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
  ring: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: {
    color: '#000000',
    fontSize: 15,
    fontFamily: geistSemiBold,
    letterSpacing: -0.3,
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
  bottomWrap: {
    position: 'absolute',
    left: 35,
    right: 35,
    bottom: 14,
  },
  bottomBar: {
    height: 63,
    borderRadius: 14,
    backgroundColor: '#EAEAEA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 31,
  },
  navIcon: {
    width: 24,
  },
  plusButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#006BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
