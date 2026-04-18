import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  CalendarDays,
  Clock,
  Flame,
  HeartPulse,
  LucideIcon,
  Phone,
} from 'lucide-react-native';
import { colors, fonts, gradients } from '../theme';

const avatarUri = 'https://www.figma.com/api/mcp/asset/31e6ebca-e0bc-4a62-af12-46698246312f';
const paracetamolUri = 'https://www.figma.com/api/mcp/asset/97efda10-cf4f-423e-85cd-3c2d2addf400';
const ibuprofenUri = 'https://www.figma.com/api/mcp/asset/888b5795-7ac3-4d88-bbb5-b9480d6cfcc0';

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
        <Circle cx={cx} cy={cy} r={r} stroke="rgba(0,0,0,0.18)" strokeWidth={stroke} fill="none" />
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
        <Text style={{ fontSize: 15, fontFamily: fonts.semiBold, color: '#003d28', letterSpacing: -0.4, lineHeight: 16 }}>
          {percent}%
        </Text>
        <Text style={{ fontSize: 8, fontFamily: fonts.medium, color: 'rgba(0,0,0,0.6)', letterSpacing: 0.3, textTransform: 'uppercase', marginTop: 1 }}>
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
  onPress?: () => void;
};

function ActionCard({ label, icon: Icon, active = false, compact = false, solid = false, onPress }: ActionCardProps) {
  if (solid) {
    return (
      <Pressable style={styles.actionCardSolid} onPress={onPress}>
        <Icon size={20} strokeWidth={2.2} color={colors.white} />
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionCard,
        active && styles.actionCardActive,
        compact && styles.actionCardCompact,
      ]}
    >
      <View style={[styles.actionIconCircle, active && styles.actionIconCircleActive]}>
        <Icon size={16} strokeWidth={2} color={colors.dark} />
      </View>
      {!compact ? <Text style={styles.actionLabel}>{label}</Text> : null}
    </Pressable>
  );
}

export function HomeScreen({ onOpenCheckup }: { onOpenCheckup: () => void }) {
  return (
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
            <Bell color={colors.dark} size={22} strokeWidth={2.1} />
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusLine} />
          <Text style={styles.statusText}>All in clear</Text>
        </View>

        <Text style={styles.headline}>How Are You</Text>
        <Text style={styles.headline}>Feeling Today?</Text>

        <View style={styles.actionsRow}>
          <ActionCard label="Daily Checkup" icon={HeartPulse} active onPress={onOpenCheckup} />
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
        colors={gradients.adherence as unknown as readonly [string, string]}
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

      <View style={styles.row}>
        <LinearGradient
          colors={gradients.paracetamol as unknown as readonly [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gridCard, styles.pillCard]}
        >
          <Text style={styles.cardLabel}>Paracetamol</Text>
          <View style={styles.pillImageWrap}>
            <Image source={{ uri: paracetamolUri }} style={styles.pillImage} resizeMode="contain" />
          </View>
          <View>
            <Text style={styles.pillDose}>500mg</Text>
            <Text style={styles.cardMeta}>Pain relief</Text>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={gradients.ibuprofen as unknown as readonly [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gridCard, styles.pillCard]}
        >
          <Text style={styles.cardLabel}>Ibuprofen</Text>
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
          colors={gradients.streak as unknown as readonly [string, string]}
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
          colors={gradients.nextDose as unknown as readonly [string, string]}
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
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.heroGray,
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
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  greeting: {
    fontSize: 13, lineHeight: 15, letterSpacing: -0.3, color: '#000',
    marginBottom: 4, fontFamily: fonts.regular,
  },
  name: {
    fontSize: 20, lineHeight: 22, letterSpacing: -0.5, color: '#000',
    fontFamily: fonts.semiBold,
  },
  notificationButton: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 40 },
  statusLine: {
    width: 10, height: 1, borderRadius: 2, backgroundColor: colors.success,
    shadowColor: colors.successGlow, shadowOpacity: 1, shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  statusText: {
    color: colors.success, fontSize: 13, lineHeight: 24,
    letterSpacing: -0.39, fontFamily: fonts.medium,
  },
  headline: {
    fontSize: 41, lineHeight: 42, letterSpacing: -1.23,
    color: '#000', fontFamily: fonts.medium,
  },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 22 },
  actionCard: {
    flex: 1, height: 43, borderRadius: 20, backgroundColor: colors.cardGray,
    borderWidth: 4, borderColor: colors.white, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 9, gap: 10,
  },
  actionCardActive: {
    shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 6.6,
    shadowOffset: { width: 0, height: 0 },
  },
  actionCardCompact: {
    flex: 0, width: 43, justifyContent: 'center', paddingHorizontal: 0,
    backgroundColor: colors.accent,
  },
  actionCardSolid: {
    width: 43, height: 43, borderRadius: 21.5, backgroundColor: colors.accent,
    borderWidth: 4, borderColor: colors.white, alignItems: 'center',
    justifyContent: 'center', shadowColor: colors.accent, shadowOpacity: 0.4,
    shadowRadius: 6.6, shadowOffset: { width: 0, height: 0 },
  },
  actionIconCircle: {
    width: 29, height: 29, borderRadius: 14.5, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  actionIconCircleActive: { backgroundColor: colors.white },
  actionLabel: {
    fontSize: 12, lineHeight: 16, letterSpacing: -0.36,
    color: '#000', fontFamily: fonts.medium,
  },
  content: { flex: 1 },
  contentInner: { paddingBottom: 110, gap: 12 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6, paddingHorizontal: 28, marginTop: 16,
  },
  sectionTitle: {
    fontSize: 24, lineHeight: 28, letterSpacing: -0.6,
    color: '#000', fontFamily: fonts.semiBold,
  },
  sectionMeta: {
    fontSize: 13, lineHeight: 18, letterSpacing: -0.25,
    color: 'rgba(0,0,0,0.5)', fontFamily: fonts.regular,
  },
  sectionMetaStrong: { color: '#000', fontFamily: fonts.semiBold },
  cardLabel: {
    fontSize: 13, lineHeight: 16, color: colors.metaStrong,
    fontFamily: fonts.medium, letterSpacing: -0.2,
  },
  cardMeta: {
    fontSize: 12, color: colors.meta, fontFamily: fonts.medium,
    letterSpacing: -0.2, marginTop: 2,
  },
  adherenceCard: { borderRadius: 22, padding: 20, marginHorizontal: 28 },
  adherenceRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', marginTop: 18,
  },
  adherenceValue: {
    fontSize: 40, lineHeight: 42, color: '#000',
    fontFamily: fonts.semiBold, letterSpacing: -1.3,
  },
  adherenceUnit: {
    fontSize: 20, color: 'rgba(0,0,0,0.6)',
    fontFamily: fonts.medium, letterSpacing: -0.4,
  },
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 28 },
  gridCard: { flex: 1, borderRadius: 22, padding: 16 },
  pillCard: { height: 210, justifyContent: 'space-between' },
  pillImageWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  pillImage: { width: '90%', height: 90 },
  pillDose: {
    fontSize: 22, lineHeight: 24, color: '#000',
    fontFamily: fonts.semiBold, letterSpacing: -0.5,
  },
  statCard: { height: 120, justifyContent: 'space-between' },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: {
    fontSize: 30, lineHeight: 32, color: '#000',
    fontFamily: fonts.semiBold, letterSpacing: -0.9,
  },
  statUnit: {
    fontSize: 15, color: 'rgba(0,0,0,0.6)',
    fontFamily: fonts.medium, letterSpacing: -0.3,
  },
});
