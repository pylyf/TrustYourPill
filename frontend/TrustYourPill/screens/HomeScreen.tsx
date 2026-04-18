import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  CalendarDays,
  Check,
  Clock,
  Flame,
  HeartPulse,
  LucideIcon,
  Phone,
  Pill as PillIcon,
  Target,
} from 'lucide-react-native';
import { colors, fonts, gradients, pillGradientCycle, type GradientKey } from '../theme';
import type { UserMedication } from '../lib/api';
import { getPillImage } from '../lib/pillImage';

const avatarUri = 'https://www.figma.com/api/mcp/asset/31e6ebca-e0bc-4a62-af12-46698246312f';

type NextDoseInfo = { time: string; suffix: 'AM' | 'PM'; medName: string };

const SLOT_TIMES: Record<string, string> = {
  morning:   '08:00',
  midday:    '12:30',
  afternoon: '14:30',
  evening:   '18:30',
  bedtime:   '22:00',
};

function computeNextDose(medications: UserMedication[]): NextDoseInfo | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let earliest: { minutes: number; medName: string } | null = null;
  for (const med of medications) {
    for (const slotId of med.scheduleTimes) {
      const timeStr = SLOT_TIMES[slotId];
      if (!timeStr) continue;
      const [hStr, mStr] = timeStr.split(':');
      const mins = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
      if (mins > currentMinutes && (!earliest || mins < earliest.minutes)) {
        earliest = { minutes: mins, medName: med.displayName.split(' ')[0] };
      }
    }
  }
  if (!earliest) return null;
  const h = Math.floor(earliest.minutes / 60);
  const m = earliest.minutes % 60;
  const suffix: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return { time: `${h12}:${m.toString().padStart(2, '0')}`, suffix, medName: earliest.medName };
}

/** Animated half-ring from Simon (2eff546469d75fa9f552769b9459728cc16d6486). */
function AdherenceHalfRing({
  percent,
  size = 120,
  textColor = '#000',
  gradientId = 'homeAdherenceArcGrad',
}: {
  percent: number;
  size?: number;
  textColor?: string;
  gradientId?: string;
}) {
  const stroke = 11;
  const r = (size - stroke * 2) / 2;
  const cx = size / 2;
  const startX = cx - r;
  const startY = cx;
  const endX = cx + r;
  const endY = cx;
  const viewH = cx + stroke / 2 + 6;
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

  const trackStroke =
    textColor === '#000000' || textColor === '#000'
      ? 'rgba(0,0,0,0.06)'
      : 'rgba(255,255,255,0.1)';
  const subColor =
    textColor === '#000000' || textColor === '#000'
      ? 'rgba(0,0,0,0.5)'
      : 'rgba(255,255,255,0.6)';

  return (
    <View style={{ width: size, height: viewH }}>
      <Svg width={size} height={viewH} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#EF4444" stopOpacity="1" />
            <Stop offset="50%" stopColor="#F97316" stopOpacity="1" />
            <Stop offset="100%" stopColor="#22C55E" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
          stroke={trackStroke}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />
        <AnimatedPath
          d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={animatedDash}
        />
      </Svg>
      <View style={{ position: 'absolute', bottom: 2, left: 0, right: 0, alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 24,
            fontFamily: fonts.semiBold,
            color: textColor,
            letterSpacing: -1.1,
            lineHeight: 26,
          }}
        >
          {percent}%
        </Text>
        <Text
          style={{
            fontSize: 10,
            fontFamily: fonts.medium,
            color: subColor,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            marginTop: 2,
          }}
        >
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

type PillCardProps = { med: UserMedication | null; gradientKey: GradientKey; taken?: boolean; onToggle?: () => void };
function PillCard({ med, gradientKey, taken = false, onToggle }: PillCardProps) {
  const gradColors = gradients[gradientKey] as unknown as readonly [string, string];
  if (!med) {
    return (
      <LinearGradient
        colors={['#F5F5F5', '#EEEEEE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gridCard, styles.pillCard]}
      >
        <View style={styles.emptyPillCard}>
          <PillIcon size={36} strokeWidth={1.4} color="rgba(0,0,0,0.15)" />
          <Text style={styles.emptyPillText}>Scan a pill{`\n`}to add it</Text>
        </View>
      </LinearGradient>
    );
  }
  const nameParts = med.displayName.split(' ');
  const pillName = nameParts[0];
  const dose = med.dosageText || (med.scheduleTimes.length > 0 ? `${med.scheduleTimes.length}×/day` : '—');
  const meta = `${med.scheduleTimes.length} dose${med.scheduleTimes.length !== 1 ? 's' : ''}/day`;
  return (
    <Pressable style={{ flex: 1 }} onPress={onToggle}>
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gridCard, styles.pillCard, taken && styles.pillCardTaken]}
      >
        {taken && (
          <View style={styles.pillTakenBadge}>
            <Check size={12} strokeWidth={2.8} color="#26B81E" />
          </View>
        )}
        <Text style={[styles.cardLabel, taken && styles.cardLabelTaken]}>{pillName}</Text>
        <View style={styles.pillIconWrap}>
          {taken
            ? <Check size={52} strokeWidth={1.2} color="rgba(38,184,30,0.35)" />
            : <Image source={getPillImage(med)} style={styles.pillImage} resizeMode="contain" />}
        </View>
        <View>
          <Text style={styles.pillDose}>{taken ? 'Taken ✓' : dose}</Text>
          <Text style={styles.cardMeta}>{meta}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export function HomeScreen({
  medications,
  onOpenCheckup,
  onOpenEmergency,
  onOpenAppointments,
}: {
  medications: UserMedication[];
  onOpenCheckup: () => void;
  onOpenEmergency: () => void;
  onOpenAppointments: () => void;
}) {
  const [takenIds, setTakenIds] = useState<Set<string>>(new Set());

  const toggleTaken = (id: string) =>
    setTakenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const totalDailyDoses = medications.reduce((s, m) => s + m.scheduleTimes.length, 0);
  const pillsTaken = medications.filter((m) => takenIds.has(m.id)).length;
  const adherencePercent = medications.length > 0 ? Math.round((pillsTaken / medications.length) * 100) : 0;
  const nextDose = computeNextDose(medications);
  const firstPill = medications[0] ?? null;
  const secondPill = medications[1] ?? null;

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
          <ActionCard label="Appointments" icon={CalendarDays} onPress={onOpenAppointments} />
          <ActionCard label="" icon={Phone} active compact solid onPress={onOpenEmergency} />
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
                <Target color="#111827" size={15} strokeWidth={2.8} />
              </View>
              <Text style={styles.adherenceLabelLight}>Today's Progress</Text>
            </View>

            <View style={styles.adherenceMetricBlock}>
              <Text style={styles.adherenceValueLight}>
                {pillsTaken}<Text style={styles.adherenceUnitLight}>/{totalDailyDoses}</Text>
              </Text>
              <Text style={styles.adherenceSubLight}>pills taken</Text>
            </View>
          </View>

          <View style={styles.adherenceRingWrap}>
            <AdherenceHalfRing percent={adherencePercent} size={132} textColor="#000000" />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.row}>
        <PillCard
          med={firstPill}
          gradientKey={pillGradientCycle[0]}
          taken={firstPill !== null && takenIds.has(firstPill.id)}
          onToggle={firstPill ? () => toggleTaken(firstPill.id) : undefined}
        />
        <PillCard
          med={secondPill}
          gradientKey={pillGradientCycle[1]}
          taken={secondPill !== null && takenIds.has(secondPill.id)}
          onToggle={secondPill ? () => toggleTaken(secondPill.id) : undefined}
        />
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
            {nextDose ? nextDose.time : '—'}
            {nextDose ? <Text style={styles.statUnit}> {nextDose.suffix}</Text> : null}
          </Text>
          <Text style={styles.cardMeta}>{nextDose ? nextDose.medName : 'None scheduled'}</Text>
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
  adherenceCard: { borderRadius: 22, marginHorizontal: 28 },
  adherenceCardLight: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,
  },
  adherenceContentLight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 18,
  },
  adherenceTextCol: {
    flex: 1,
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingVertical: 2,
  },
  adherenceHeaderLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adherenceIconWrap: {
    backgroundColor: '#F3F4F6',
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adherenceLabelLight: {
    fontSize: 15,
    lineHeight: 20,
    color: '#475467',
    fontFamily: fonts.semiBold,
    letterSpacing: -0.3,
  },
  adherenceMetricBlock: {
    marginTop: 18,
    gap: 6,
  },
  adherenceValueLight: {
    fontSize: 48,
    lineHeight: 50,
    color: '#111827',
    fontFamily: fonts.semiBold,
    letterSpacing: -1.8,
  },
  adherenceUnitLight: {
    fontSize: 28,
    lineHeight: 32,
    color: '#667085',
    fontFamily: fonts.medium,
    letterSpacing: -0.8,
  },
  adherenceSubLight: {
    fontSize: 15,
    lineHeight: 20,
    color: '#667085',
    fontFamily: fonts.medium,
    letterSpacing: -0.3,
  },
  adherenceRingWrap: {
    width: 146,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 28 },
  gridCard: { flex: 1, borderRadius: 22, padding: 16 },
  pillCard: { height: 210, justifyContent: 'space-between' },
  pillCardTaken: { opacity: 0.75 },
  pillTakenBadge: {
    position: 'absolute', top: 12, right: 12,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(38,184,30,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardLabelTaken: { color: 'rgba(0,0,0,0.4)' },
  pillIconWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  pillImage: { width: 90, height: 90 },
  emptyPillCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyPillText: {
    fontSize: 12, color: 'rgba(0,0,0,0.3)', fontFamily: fonts.medium,
    letterSpacing: -0.2, textAlign: 'center', lineHeight: 17,
  },
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
