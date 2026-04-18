import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Bell,
  CalendarDays,
  ClipboardList,
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
};

type MedicationCardProps = {
  title: string;
  subtitle: string;
  imageUri: string;
  tint: string;
};

function ActionCard({ label, icon: Icon, active = false, compact = false }: ActionCardProps) {
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

function MedicationCard({ title, subtitle, imageUri, tint }: MedicationCardProps) {
  return (
    <View style={[styles.medicationCard, { backgroundColor: tint }]}>
      <View style={styles.medicationCopy}>
        <Text style={styles.medicationTitle}>{title}</Text>
        <Text style={styles.medicationSubtitle}>{subtitle}</Text>
      </View>
      <Image source={{ uri: imageUri }} style={styles.medicationImage} resizeMode="contain" />
    </View>
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
            <ActionCard label="" icon={Phone} active compact />
          </View>
        </View>

        <View style={styles.content}>
          <MedicationCard
            title="Paracetamol"
            subtitle="Pain Relief · 1 pill (500mg)"
            imageUri={paracetamolUri}
            tint="#E8F4FA"
          />
          <MedicationCard
            title="Ibuprofen"
            subtitle="Liver · 1 pill (200mg)"
            imageUri={ibuprofenUri}
            tint="#D1CBEF"
          />
        </View>

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
    width: 43,
    justifyContent: 'center',
    paddingHorizontal: 0,
    backgroundColor: '#006BFF',
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
    paddingHorizontal: 35,
    paddingTop: 74,
    gap: 15,
  },
  medicationCard: {
    height: 80,
    borderRadius: 14,
    paddingLeft: 25,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medicationCopy: {
    flexShrink: 1,
    paddingRight: 14,
  },
  medicationTitle: {
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.48,
    color: '#000000',
    fontFamily: geistMedium,
    marginBottom: 2,
  },
  medicationSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(0,0,0,0.75)',
    fontFamily: geistMedium,
  },
  medicationImage: {
    width: 96,
    height: 88,
  },
  bottomWrap: {
    paddingHorizontal: 35,
    paddingBottom: 14,
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
