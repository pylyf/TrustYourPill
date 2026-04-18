import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  Check,
  Target,
} from 'lucide-react-native';
import { colors, fonts, gradients, type GradientKey } from '../theme';

// ─── images ───────────────────────────────────────────────────────────────────
const paracetamolUri = 'https://www.figma.com/api/mcp/asset/97efda10-cf4f-423e-85cd-3c2d2addf400';
const ibuprofenUri   = 'https://www.figma.com/api/mcp/asset/888b5795-7ac3-4d88-bbb5-b9480d6cfcc0';

/** Local assets per medication type */
const TYPE_IMAGE = {
  cream:     require('../assets/cream.png'),
  drops:     require('../assets/drops.png'),
  injection: require('../assets/syringe.png'),
  inhaler:   require('../assets/inhaler.png'),
} as const;

/** Remote URIs for named tablets */
const TABLET_IMAGE: Record<string, string> = {
  Paracetamol: paracetamolUri,
  Ibuprofen:   ibuprofenUri,
};

// ─── types ────────────────────────────────────────────────────────────────────
type MedType   = 'tablet' | 'drops' | 'injection' | 'inhaler' | 'syrup' | 'cream';
type DoseStatus = 'taken' | 'upcoming' | 'next';

type Dose = {
  id: string;
  name: string;
  dose: string;
  type: MedType;
  gradient: GradientKey;
  status: DoseStatus;
  conflictsWith?: string[];
};

type Slot = {
  id: string;
  label: string;
  time: string;
  sub: string;
  doses: Dose[];
};

// ─── schedule data ────────────────────────────────────────────────────────────
const SCHEDULE: Slot[] = [
  {
    id: 'morning',
    label: 'Morning',
    time: '08:00',
    sub: 'With breakfast',
    doses: [
      { id: 'm1', name: 'Paracetamol', dose: '500mg',   type: 'tablet',    gradient: 'lightBlue',  status: 'taken' },
      { id: 'm2', name: 'Vitamin D3',  dose: '1000 IU', type: 'drops',     gradient: 'warmPeach',  status: 'taken' },
      { id: 'm3', name: 'Insulin',     dose: '10 u',    type: 'injection', gradient: 'pinkPurple', status: 'taken' },
    ],
  },
  {
    id: 'midday',
    label: 'Midday',
    time: '12:30',
    sub: 'With lunch',
    doses: [
      { id: 'd1', name: 'Ventolin',  dose: '100mcg', type: 'inhaler', gradient: 'sage',       status: 'taken' },
      { id: 'd2', name: 'Ibuprofen', dose: '200mg',  type: 'tablet',  gradient: 'softPurple', status: 'taken', conflictsWith: ['Aspirin'] },
    ],
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    time: '14:30',
    sub: 'Next dose',
    doses: [
      { id: 'a1', name: 'Paracetamol', dose: '500mg', type: 'tablet', gradient: 'lightBlue', status: 'next' },
    ],
  },
  {
    id: 'evening',
    label: 'Evening',
    time: '18:30',
    sub: 'With dinner',
    doses: [
      { id: 'e1', name: 'Cough syrup', dose: '15ml', type: 'syrup', gradient: 'lightBlue', status: 'upcoming' },
      { id: 'e2', name: 'Hydrocort.',  dose: '1%',   type: 'cream', gradient: 'warmPeach', status: 'upcoming' },
    ],
  },
  {
    id: 'night',
    label: 'Bedtime',
    time: '22:00',
    sub: 'Before sleep',
    doses: [
      { id: 'n1', name: 'Aspirin', dose: '75mg', type: 'tablet', gradient: 'pinkPurple', status: 'upcoming', conflictsWith: ['Ibuprofen'] },
    ],
  },
];

// ─── animated half-ring (same component as HomeScreen) ───────────────────────
function AdherenceHalfRing({
  percent,
  size = 120,
  gradientId = 'libAdherenceGrad',
}: {
  percent: number;
  size?: number;
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

  return (
    <View style={{ width: size, height: viewH }}>
      <Svg width={size} height={viewH} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%"   stopColor="#EF4444" stopOpacity="1" />
            <Stop offset="50%"  stopColor="#F97316" stopOpacity="1" />
            <Stop offset="100%" stopColor="#22C55E" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
          stroke="rgba(0,0,0,0.06)"
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
            color: '#000',
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
            color: 'rgba(0,0,0,0.5)',
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

// ─── main screen ─────────────────────────────────────────────────────────────
export function PillLibraryScreen({ onAdd }: { onAdd: () => void }) {
  const allDoses  = SCHEDULE.flatMap((s) => s.doses);
  const takenCount = allDoses.filter((d) => d.status === 'taken').length;
  const totalCount = allDoses.length;
  const pct = Math.round((takenCount / totalCount) * 100);

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.contentInner}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.kicker}>Today's Schedule</Text>
        <Text style={styles.title}>Medicine</Text>
      </View>

      {/* ── Today's Doses — same design as HomeScreen adherence card ── */}
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.adherenceCard}
      >
        <View style={styles.adherenceContent}>
          {/* left: label + big metric */}
          <View style={styles.adherenceTextCol}>
            <View style={styles.adherenceHeader}>
              <View style={styles.adherenceIconWrap}>
                <Target color="#111827" size={15} strokeWidth={2.8} />
              </View>
              <Text style={styles.adherenceLabel}>Today's Doses</Text>
            </View>

            <View style={styles.adherenceMetricBlock}>
              <Text style={styles.adherenceValue}>
                {takenCount}<Text style={styles.adherenceUnit}>/{totalCount}</Text>
              </Text>
              <Text style={styles.adherenceSub}>pills taken</Text>
            </View>
          </View>

          {/* right: animated half-ring */}
          <View style={styles.adherenceRingWrap}>
            <AdherenceHalfRing percent={pct} size={132} />
          </View>
        </View>
      </LinearGradient>

      {/* ── Timeline ── */}
      <View style={styles.timeline}>
        {SCHEDULE.map((slot, i) => (
          <TimelineSlot key={slot.id} slot={slot} isLast={i === SCHEDULE.length - 1} />
        ))}
      </View>
    </ScrollView>
  );
}

// ─── timeline slot ────────────────────────────────────────────────────────────
function TimelineSlot({ slot, isLast }: { slot: Slot; isLast: boolean }) {
  const isNext   = slot.doses.some((d) => d.status === 'next');
  const allTaken = slot.doses.every((d) => d.status === 'taken');

  return (
    <View style={styles.slot}>
      {/* rail */}
      <View style={styles.rail}>
        <View
          style={[
            styles.node,
            allTaken && styles.nodeTaken,
            isNext   && styles.nodeNext,
          ]}
        >
          {allTaken ? (
            <Check size={13} strokeWidth={3} color={colors.white} />
          ) : (
            <View
              style={[
                styles.nodeDot,
                isNext && styles.nodeDotNext,
              ]}
            />
          )}
        </View>
        {!isLast ? <View style={styles.line} /> : null}
      </View>

      {/* body */}
      <View style={styles.slotBody}>
        <View style={styles.slotHeader}>
          <View>
            <Text style={styles.slotLabel}>
              {slot.label}
              {isNext ? <Text style={styles.nextBadge}>  · Next up</Text> : null}
            </Text>
            <Text style={styles.slotMeta}>{slot.sub}</Text>
          </View>
          <Text style={styles.slotTime}>{slot.time}</Text>
        </View>

        <View style={styles.doseList}>
          {slot.doses.map((dose) => (
            <DoseCard key={dose.id} dose={dose} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── dose card ────────────────────────────────────────────────────────────────
function DoseCard({ dose }: { dose: Dose }) {
  const hasConflicts = !!dose.conflictsWith && dose.conflictsWith.length > 0;
  const isTaken      = dose.status === 'taken';
  const isNext       = dose.status === 'next';

  // Resolve image: local asset by type first, then remote URI for named tablets
  const localAsset = TYPE_IMAGE[dose.type as keyof typeof TYPE_IMAGE] ?? null;
  const remoteUri  = dose.type === 'tablet' ? TABLET_IMAGE[dose.name] ?? null : null;
  const hasImage   = localAsset !== null || remoteUri !== null;

  return (
    <LinearGradient
      colors={gradients[dose.gradient] as unknown as readonly [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.doseCard, isNext && styles.doseCardNext]}
    >
      {/* medication image */}
      <View style={styles.doseImageWrap}>
        {localAsset ? (
          <Image source={localAsset} style={styles.doseImage} resizeMode="contain" />
        ) : remoteUri ? (
          <Image source={{ uri: remoteUri }} style={styles.doseImage} resizeMode="contain" />
        ) : (
          <View style={styles.doseImagePlaceholder} />
        )}
      </View>

      <View style={styles.doseInfo}>
        <Text style={styles.doseName} numberOfLines={1}>{dose.name}</Text>
        <Text style={styles.doseMeta} numberOfLines={1}>{dose.dose}</Text>
      </View>

      {hasConflicts ? (
        <View style={styles.warnDot}>
          <AlertTriangle size={11} strokeWidth={2.6} color="#8A3A14" />
        </View>
      ) : null}

      {isTaken ? (
        <View style={styles.takenDot}>
          <Check size={12} strokeWidth={3} color={colors.white} />
        </View>
      ) : null}
    </LinearGradient>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const RAIL_W = 40;
const NODE   = 26;

const styles = StyleSheet.create({
  content:      { flex: 1 },
  contentInner: { paddingBottom: 130, paddingTop: 20, gap: 20 },

  // header — just text, no action buttons
  header: {
    paddingHorizontal: 28,
    paddingTop: 14,
  },
  kicker: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    fontFamily: fonts.medium,
    letterSpacing: -0.25,
    marginBottom: 4,
  },
  title: {
    fontSize: 41,
    lineHeight: 42,
    letterSpacing: -1.23,
    color: '#000',
    fontFamily: fonts.semiBold,
  },

  // adherence card — mirrors HomeScreen style exactly
  adherenceCard: {
    borderRadius: 22,
    marginHorizontal: 28,
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
  adherenceContent: {
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
  adherenceHeader: {
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
  adherenceLabel: {
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
  adherenceValue: {
    fontSize: 48,
    lineHeight: 50,
    color: '#111827',
    fontFamily: fonts.semiBold,
    letterSpacing: -1.8,
  },
  adherenceUnit: {
    fontSize: 28,
    lineHeight: 32,
    color: '#667085',
    fontFamily: fonts.medium,
    letterSpacing: -0.8,
  },
  adherenceSub: {
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

  // timeline
  timeline: { paddingHorizontal: 28 },
  slot:     { flexDirection: 'row', gap: 12 },

  rail: { width: RAIL_W, alignItems: 'center' },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    backgroundColor: colors.cardGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  nodeTaken: {
    backgroundColor: colors.success,
    shadowColor: colors.successGlow,
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  nodeNext: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  nodeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  nodeDotNext: { backgroundColor: colors.white },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(0,0,0,0.07)',
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 1,
  },

  slotBody: { flex: 1, paddingBottom: 22 },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  slotLabel: {
    fontSize: 16,
    color: '#000',
    fontFamily: fonts.semiBold,
    letterSpacing: -0.4,
  },
  nextBadge: {
    fontSize: 12,
    color: colors.accent,
    fontFamily: fonts.semiBold,
    letterSpacing: -0.2,
  },
  slotMeta: {
    fontSize: 12,
    color: colors.meta,
    fontFamily: fonts.medium,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  slotTime: {
    fontSize: 14,
    color: colors.metaStrong,
    fontFamily: fonts.semiBold,
    letterSpacing: -0.3,
  },

  // dose cards
  doseList: { gap: 8 },
  doseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  doseCardNext: {
    shadowColor: colors.accent,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  doseImageWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  doseImage: { width: 36, height: 36 },
  doseImagePlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  doseInfo:  { flex: 1 },
  doseName: {
    fontSize: 15,
    color: '#000',
    fontFamily: fonts.semiBold,
    letterSpacing: -0.3,
  },
  doseMeta: {
    fontSize: 12,
    color: colors.meta,
    fontFamily: fonts.medium,
    letterSpacing: -0.2,
    marginTop: 1,
  },
  warnDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  takenDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
