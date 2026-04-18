import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  Check,
  Coffee,
  Droplets,
  FlaskConical,
  Moon,
  Package,
  Pill as PillIcon,
  Plus,
  Search,
  Sun,
  Sunset,
  Syringe,
  Wind,
  type LucideIcon,
} from 'lucide-react-native';
import { colors, fonts, gradients, type GradientKey } from '../theme';

type MedType = 'tablet' | 'drops' | 'injection' | 'inhaler' | 'syrup' | 'cream';
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
  icon: LucideIcon;
  doses: Dose[];
};

const TYPE_META: Record<MedType, { icon: LucideIcon; label: string }> = {
  tablet:    { icon: PillIcon,     label: 'Tablet' },
  drops:     { icon: Droplets,     label: 'Drops' },
  injection: { icon: Syringe,      label: 'Injection' },
  inhaler:   { icon: Wind,         label: 'Inhaler' },
  syrup:     { icon: FlaskConical, label: 'Syrup' },
  cream:     { icon: Package,      label: 'Topical' },
};

const SCHEDULE: Slot[] = [
  {
    id: 'morning',
    label: 'Morning',
    time: '08:00',
    sub: 'With breakfast',
    icon: Coffee,
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
    icon: Sun,
    doses: [
      { id: 'd1', name: 'Ventolin',   dose: '100mcg', type: 'inhaler', gradient: 'sage',       status: 'taken' },
      { id: 'd2', name: 'Ibuprofen',  dose: '200mg',  type: 'tablet',  gradient: 'softPurple', status: 'taken', conflictsWith: ['Aspirin'] },
    ],
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    time: '14:30',
    sub: 'Next dose',
    icon: Sun,
    doses: [
      { id: 'a1', name: 'Paracetamol', dose: '500mg', type: 'tablet', gradient: 'lightBlue', status: 'next' },
    ],
  },
  {
    id: 'evening',
    label: 'Evening',
    time: '18:30',
    sub: 'With dinner',
    icon: Sunset,
    doses: [
      { id: 'e1', name: 'Cough syrup',   dose: '15ml', type: 'syrup', gradient: 'lightBlue',  status: 'upcoming' },
      { id: 'e2', name: 'Hydrocort.',    dose: '1%',   type: 'cream', gradient: 'warmPeach',  status: 'upcoming' },
    ],
  },
  {
    id: 'night',
    label: 'Bedtime',
    time: '22:00',
    sub: 'Before sleep',
    icon: Moon,
    doses: [
      { id: 'n1', name: 'Aspirin', dose: '75mg', type: 'tablet', gradient: 'pinkPurple', status: 'upcoming', conflictsWith: ['Ibuprofen'] },
    ],
  },
];

export function PillLibraryScreen({ onAdd }: { onAdd: () => void }) {
  const allDoses = SCHEDULE.flatMap((s) => s.doses);
  const takenCount = allDoses.filter((d) => d.status === 'taken').length;
  const totalCount = allDoses.length;

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.contentInner}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Today's Schedule</Text>
          <Text style={styles.title}>Medicine</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.iconButton}>
            <Search size={20} strokeWidth={2.1} color={colors.dark} />
          </View>
          <Pressable onPress={onAdd} style={[styles.iconButton, styles.iconButtonAccent]}>
            <Plus size={20} strokeWidth={2.4} color={colors.white} />
          </Pressable>
        </View>
      </View>

      <LinearGradient
        colors={gradients.adherence as unknown as readonly [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summaryCard}
      >
        <Text style={styles.cardLabel}>Today's doses</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryValue}>
            {takenCount}<Text style={styles.summaryUnit}> of {totalCount} taken</Text>
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(takenCount / totalCount) * 100}%` }]} />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.timeline}>
        {SCHEDULE.map((slot, i) => (
          <TimelineSlot key={slot.id} slot={slot} isLast={i === SCHEDULE.length - 1} />
        ))}
      </View>
    </ScrollView>
  );
}

function TimelineSlot({ slot, isLast }: { slot: Slot; isLast: boolean }) {
  const SlotIcon = slot.icon;
  const isNext = slot.doses.some((d) => d.status === 'next');
  const allTaken = slot.doses.every((d) => d.status === 'taken');

  return (
    <View style={styles.slot}>
      <View style={styles.rail}>
        <View
          style={[
            styles.node,
            allTaken && styles.nodeTaken,
            isNext && styles.nodeNext,
          ]}
        >
          {allTaken ? (
            <Check size={14} strokeWidth={3} color={colors.white} />
          ) : (
            <SlotIcon
              size={14}
              strokeWidth={2.3}
              color={isNext ? colors.white : colors.dark}
            />
          )}
        </View>
        {!isLast ? <View style={styles.line} /> : null}
      </View>

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

function DoseCard({ dose }: { dose: Dose }) {
  const Icon = TYPE_META[dose.type].icon;
  const typeLabel = TYPE_META[dose.type].label;
  const hasConflicts = !!dose.conflictsWith && dose.conflictsWith.length > 0;
  const isTaken = dose.status === 'taken';
  const isNext = dose.status === 'next';

  return (
    <LinearGradient
      colors={gradients[dose.gradient] as unknown as readonly [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.doseCard, isNext && styles.doseCardNext]}
    >
      <View style={styles.doseIconWrap}>
        <Icon size={18} strokeWidth={2.2} color={colors.dark} />
      </View>
      <View style={styles.doseInfo}>
        <Text style={styles.doseName} numberOfLines={1}>{dose.name}</Text>
        <Text style={styles.doseMeta} numberOfLines={1}>
          {dose.dose} · {typeLabel}
        </Text>
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

const RAIL_W = 40;
const NODE = 28;

const styles = StyleSheet.create({
  content: { flex: 1 },
  contentInner: { paddingBottom: 130, paddingTop: 12, gap: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 10,
    marginBottom: 4,
  },
  kicker: {
    fontSize: 13, color: 'rgba(0,0,0,0.5)',
    fontFamily: fonts.medium, letterSpacing: -0.25, marginBottom: 4,
  },
  title: {
    fontSize: 41, lineHeight: 42, letterSpacing: -1.23,
    color: '#000', fontFamily: fonts.semiBold,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.cardGray,
    alignItems: 'center', justifyContent: 'center',
  },
  iconButtonAccent: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent, shadowOpacity: 0.4,
    shadowRadius: 6.6, shadowOffset: { width: 0, height: 0 },
  },

  summaryCard: { marginHorizontal: 28, borderRadius: 22, padding: 20 },
  summaryRow: { marginTop: 12, gap: 12 },
  summaryValue: {
    fontSize: 32, lineHeight: 36, color: '#000',
    fontFamily: fonts.semiBold, letterSpacing: -1,
  },
  summaryUnit: {
    fontSize: 16, color: 'rgba(0,0,0,0.6)',
    fontFamily: fonts.medium, letterSpacing: -0.3,
  },
  progressTrack: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 9999, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: colors.accent, borderRadius: 9999,
  },

  timeline: { paddingHorizontal: 28 },
  slot: { flexDirection: 'row', gap: 12 },

  rail: { width: RAIL_W, alignItems: 'center' },
  node: {
    width: NODE, height: NODE, borderRadius: NODE / 2,
    backgroundColor: colors.cardGray,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  nodeTaken: {
    backgroundColor: colors.success,
    shadowColor: colors.successGlow, shadowOpacity: 1,
    shadowRadius: 4, shadowOffset: { width: 0, height: 0 },
  },
  nodeNext: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent, shadowOpacity: 0.5,
    shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
  },
  line: {
    flex: 1, width: 2, backgroundColor: 'rgba(0,0,0,0.08)',
    marginTop: 4, marginBottom: 4, borderRadius: 1,
  },

  slotBody: { flex: 1, paddingBottom: 20 },
  slotHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 10,
  },
  slotLabel: {
    fontSize: 17, color: '#000',
    fontFamily: fonts.semiBold, letterSpacing: -0.45,
  },
  nextBadge: {
    fontSize: 12, color: colors.accent,
    fontFamily: fonts.semiBold, letterSpacing: -0.2,
  },
  slotMeta: {
    fontSize: 12, color: colors.meta,
    fontFamily: fonts.medium, letterSpacing: -0.2, marginTop: 2,
  },
  slotTime: {
    fontSize: 15, color: colors.metaStrong,
    fontFamily: fonts.semiBold, letterSpacing: -0.3,
  },

  doseList: { gap: 8 },
  doseCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 18,
  },
  doseCardNext: {
    shadowColor: colors.accent, shadowOpacity: 0.25,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  doseIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  doseInfo: { flex: 1 },
  doseName: {
    fontSize: 15, color: '#000',
    fontFamily: fonts.semiBold, letterSpacing: -0.3,
  },
  doseMeta: {
    fontSize: 12, color: colors.meta,
    fontFamily: fonts.medium, letterSpacing: -0.2, marginTop: 1,
  },
  warnDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  takenDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center',
  },

  cardLabel: {
    fontSize: 13, lineHeight: 16, color: colors.metaStrong,
    fontFamily: fonts.medium, letterSpacing: -0.2,
  },
});
