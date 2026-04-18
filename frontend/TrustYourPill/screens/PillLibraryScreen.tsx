import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BookOpen,
  Check,
  Coffee,
  Info,
  Moon,
  Plus,
  Sun,
  Sunset,
  Trash2,
} from 'lucide-react-native';
import { colors, fonts, gradients, type GradientKey } from '../theme';
import type { UserMedication } from '../lib/api';
import { getPillImage } from '../lib/pillImage';
import { MedicationDetailModal } from '../components/MedicationDetailModal';

// -- slot definitions ---------------------------------------------------------

const SLOTS = [
  { id: 'morning',   label: 'Morning',   time: '08:00', sub: 'With breakfast', Icon: Coffee },
  { id: 'midday',    label: 'Midday',    time: '12:30', sub: 'With lunch',     Icon: Sun },
  { id: 'afternoon', label: 'Afternoon', time: '14:30', sub: 'Afternoon dose', Icon: Sun },
  { id: 'evening',   label: 'Evening',   time: '18:30', sub: 'With dinner',    Icon: Sunset },
  { id: 'bedtime',   label: 'Bedtime',   time: '22:00', sub: 'Before sleep',   Icon: Moon },
] as const;

type SlotId = (typeof SLOTS)[number]['id'];

const CARD_GRADIENTS: GradientKey[] = [
  'lightBlue', 'warmPeach', 'pinkPurple', 'sage', 'softPurple',
];

function gradientForIndex(index: number): GradientKey {
  return CARD_GRADIENTS[index % CARD_GRADIENTS.length];
}

function computeNextSlot(medications: UserMedication[]): SlotId | null {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  let bestSlot: SlotId | null = null;
  let bestDiff = Infinity;
  for (const slot of SLOTS) {
    const hasMeds = medications.some((m) => m.scheduleTimes.includes(slot.id));
    if (!hasMeds) continue;
    const [h, min] = slot.time.split(':').map(Number);
    const slotMins = h * 60 + min;
    const diff = slotMins >= nowMins ? slotMins - nowMins : slotMins + 1440 - nowMins;
    if (diff < bestDiff) { bestDiff = diff; bestSlot = slot.id as SlotId; }
  }
  return bestSlot;
}

// -- screen -------------------------------------------------------------------

type Props = {
  medications: UserMedication[];
  onAdd: () => void;
  onDelete: (medId: string) => void;
  takenIds: Set<string>;
  onToggleTaken: (id: string) => void;
};

export function PillLibraryScreen({ medications, onAdd, onDelete, takenIds, onToggleTaken }: Props) {
  const [detailMed, setDetailMed] = useState<UserMedication | null>(null);
  const [detailGradient, setDetailGradient] = useState<GradientKey>('lightBlue');
  const openDetail = (med: UserMedication, gradient: GradientKey) => {
    setDetailGradient(gradient);
    setDetailMed(med);
  };

  const totalDoses = medications.reduce((s, m) => s + m.scheduleTimes.length, 0);
  const nextSlot = computeNextSlot(medications);

  const activeSlots = SLOTS.map((slot) => ({
    slot,
    meds: medications.filter((m) => m.scheduleTimes.includes(slot.id)),
  })).filter((s) => s.meds.length > 0);

  const unscheduled = medications.filter((m) => m.scheduleTimes.length === 0);

  return (
    <>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Today''s Schedule</Text>
            <Text style={styles.title}>Medicine</Text>
          </View>
          <Pressable onPress={onAdd} style={[styles.iconButton, styles.iconButtonAccent]}>
            <Plus size={20} strokeWidth={2.4} color={colors.white} />
          </Pressable>
        </View>

        <LinearGradient
          colors={gradients.adherence as unknown as readonly [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <Text style={styles.cardLabel}>Medications saved</Text>
          <Text style={styles.summaryValue}>
            {medications.length}
            <Text style={styles.summaryUnit}>
              {medications.length === 1 ? ' medication' : ' medications'}
            </Text>
          </Text>
          <Text style={styles.summaryHint}>
            {totalDoses > 0
              ? `${totalDoses} dose${totalDoses === 1 ? '' : 's'} scheduled today`
              : 'Scan a label to set up your schedule'}
          </Text>
        </LinearGradient>

        {medications.length === 0 ? (
          <EmptyState onAdd={onAdd} />
        ) : (
          <>
            {activeSlots.length > 0 && (
              <View style={styles.timeline}>
                {activeSlots.map(({ slot, meds }, i) => (
                  <TimelineSlot
                    key={slot.id}
                    slot={slot}
                    meds={meds}
                    isNext={slot.id === nextSlot}
                    isLast={i === activeSlots.length - 1 && unscheduled.length === 0}
                    onDelete={onDelete}
                    onInfo={openDetail}
                    takenIds={takenIds}
                    onToggleTaken={onToggleTaken}
                  />
                ))}
              </View>
            )}
            {unscheduled.length > 0 && (
              <View style={styles.unscheduledSection}>
                <Text style={styles.unscheduledTitle}>No schedule set</Text>
                <View style={styles.doseList}>
                  {unscheduled.map((med, i) => {
                    const gradient = gradientForIndex(i);
                    return (
                      <DoseCard
                        key={med.id}
                        med={med}
                        gradient={gradient}
                        isNext={false}
                        taken={takenIds.has(med.id)}
                        onDelete={() => onDelete(med.id)}
                        onInfo={() => openDetail(med, gradient)}
                        onToggleTaken={() => onToggleTaken(med.id)}
                      />
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <MedicationDetailModal
        visible={detailMed !== null}
        medication={detailMed}
        gradientKey={detailGradient}
        onClose={() => setDetailMed(null)}
      />
    </>
  );
}

// -- timeline slot -------------------------------------------------------------

function TimelineSlot({
  slot, meds, isNext, isLast, onDelete, onInfo, takenIds, onToggleTaken,
}: {
  slot: (typeof SLOTS)[number];
  meds: UserMedication[];
  isNext: boolean;
  isLast: boolean;
  onDelete: (id: string) => void;
  onInfo: (med: UserMedication, gradient: GradientKey) => void;
  takenIds: Set<string>;
  onToggleTaken: (id: string) => void;
}) {
  const { Icon } = slot;
  return (
    <View style={styles.slot}>
      <View style={styles.rail}>
        <View style={[styles.node, isNext && styles.nodeNext]}>
          <Icon size={14} strokeWidth={2.3} color={isNext ? colors.white : colors.dark} />
        </View>
        {!isLast && <View style={styles.line} />}
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
          {meds.map((med, i) => {
            const gradient = gradientForIndex(i);
            return (
              <DoseCard
                key={med.id}
                med={med}
                gradient={gradient}
                isNext={isNext}
                taken={takenIds.has(med.id)}
                onDelete={() => onDelete(med.id)}
                onInfo={() => onInfo(med, gradient)}
                onToggleTaken={() => onToggleTaken(med.id)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

// -- dose card ----------------------------------------------------------------

function DoseCard({
  med, gradient, isNext, taken, onDelete, onInfo, onToggleTaken,
}: {
  med: UserMedication;
  gradient: GradientKey;
  isNext: boolean;
  taken: boolean;
  onDelete: () => void;
  onInfo: () => void;
  onToggleTaken: () => void;
}) {
  return (
    <Pressable onLongPress={onInfo} delayLongPress={400}>
      <LinearGradient
        colors={gradients[gradient] as unknown as readonly [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.doseCard, isNext && styles.doseCardNext, taken && styles.doseCardTaken]}
      >
        <View style={[styles.doseIconWrap, taken && styles.doseIconWrapTaken]}>
          {taken
            ? <Check size={18} strokeWidth={2.4} color={colors.success} />
            : <Image source={getPillImage(med)} style={styles.doseImage} resizeMode="contain" />}
        </View>
        <View style={styles.doseInfo}>
          <Text style={[styles.doseName, taken && styles.doseNameTaken]} numberOfLines={1}>{med.displayName}</Text>
          <Text style={styles.doseMeta} numberOfLines={1}>
            {taken ? 'Taken ✓' : (med.dosageText ?? 'No dosage info')}
          </Text>
        </View>
        <View style={styles.actionCluster}>
          <Pressable onPress={onToggleTaken} style={[styles.actionBtn, taken && styles.actionBtnTaken]} hitSlop={10}>
            <Check size={14} strokeWidth={2.4} color={taken ? colors.success : 'rgba(0,0,0,0.35)'} />
          </Pressable>
          <Pressable onPress={onInfo} style={styles.actionBtn} hitSlop={10}>
            <Info size={14} strokeWidth={2.2} color="rgba(0,0,0,0.4)" />
          </Pressable>
          <Pressable onPress={onDelete} style={styles.actionBtn} hitSlop={12}>
            <Trash2 size={14} strokeWidth={2} color="rgba(0,0,0,0.35)" />
          </Pressable>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// -- empty state --------------------------------------------------------------

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <BookOpen size={32} strokeWidth={1.8} color={colors.accent} />
      </View>
      <Text style={styles.emptyTitle}>No medications yet</Text>
      <Text style={styles.emptyText}>
        Scan a pill bottle label to add your first medication to the library.
      </Text>
      <Pressable onPress={onAdd} style={styles.emptyBtn}>
        <Plus size={18} strokeWidth={2.4} color={colors.white} />
        <Text style={styles.emptyBtnText}>Scan First Pill</Text>
      </Pressable>
    </View>
  );
}

// -- styles -------------------------------------------------------------------

const RAIL_W = 40;
const NODE = 28;

const styles = StyleSheet.create({
  content: { flex: 1 },
  contentInner: { paddingBottom: 130, paddingTop: 12, gap: 16 },

  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 28, paddingTop: 10, marginBottom: 4,
  },
  kicker: { fontSize: 13, color: 'rgba(0,0,0,0.5)', fontFamily: fonts.medium, letterSpacing: -0.25, marginBottom: 4 },
  title: { fontSize: 41, lineHeight: 42, letterSpacing: -1.23, color: '#000', fontFamily: fonts.semiBold },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardGray, alignItems: 'center', justifyContent: 'center' },
  iconButtonAccent: { backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 6.6, shadowOffset: { width: 0, height: 0 } },

  summaryCard: { marginHorizontal: 28, borderRadius: 22, padding: 20, gap: 4 },
  cardLabel: { fontSize: 13, lineHeight: 16, color: colors.metaStrong, fontFamily: fonts.medium, letterSpacing: -0.2 },
  summaryValue: { fontSize: 32, lineHeight: 36, color: '#000', fontFamily: fonts.semiBold, letterSpacing: -1 },
  summaryUnit: { fontSize: 16, color: 'rgba(0,0,0,0.6)', fontFamily: fonts.medium, letterSpacing: -0.3 },
  summaryHint: { fontSize: 13, color: colors.metaStrong, fontFamily: fonts.regular, letterSpacing: -0.2 },

  timeline: { paddingHorizontal: 28 },
  slot: { flexDirection: 'row', gap: 12 },
  rail: { width: RAIL_W, alignItems: 'center' },
  node: { width: NODE, height: NODE, borderRadius: NODE / 2, backgroundColor: colors.cardGray, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  nodeNext: { backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  line: { flex: 1, width: 2, backgroundColor: 'rgba(0,0,0,0.08)', marginTop: 4, marginBottom: 4, borderRadius: 1 },

  slotBody: { flex: 1, paddingBottom: 20 },
  slotHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  slotLabel: { fontSize: 17, color: '#000', fontFamily: fonts.semiBold, letterSpacing: -0.45 },
  nextBadge: { fontSize: 12, color: colors.accent, fontFamily: fonts.semiBold, letterSpacing: -0.2 },
  slotMeta: { fontSize: 12, color: colors.meta, fontFamily: fonts.medium, letterSpacing: -0.2, marginTop: 2 },
  slotTime: { fontSize: 15, color: colors.metaStrong, fontFamily: fonts.semiBold, letterSpacing: -0.3 },

  doseList: { gap: 8 },
  doseCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18 },
  doseCardNext: { shadowColor: colors.accent, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  doseCardTaken: { opacity: 0.72 },
  doseIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  doseIconWrapTaken: { backgroundColor: 'rgba(38,184,30,0.12)' },
  doseImage: { width: 26, height: 26 },
  doseInfo: { flex: 1 },
  doseName: { fontSize: 15, color: '#000', fontFamily: fonts.semiBold, letterSpacing: -0.3 },
  doseNameTaken: { textDecorationLine: 'line-through', color: 'rgba(0,0,0,0.4)' },
  doseMeta: { fontSize: 12, color: colors.meta, fontFamily: fonts.medium, letterSpacing: -0.2, marginTop: 1 },
  actionCluster: { flexDirection: 'row', gap: 4 },
  actionBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  actionBtnTaken: { backgroundColor: 'rgba(38,184,30,0.15)' },

  unscheduledSection: { paddingHorizontal: 28, gap: 10 },
  unscheduledTitle: { fontSize: 13, color: colors.meta, fontFamily: fonts.medium, letterSpacing: -0.2 },

  emptyState: { marginHorizontal: 28, alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 107, 255, 0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontFamily: fonts.semiBold, color: '#000', letterSpacing: -0.5 },
  emptyText: { fontSize: 14, fontFamily: fonts.regular, color: 'rgba(0,0,0,0.5)', textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
  emptyBtn: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 9999, shadowColor: colors.accent, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  emptyBtnText: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.white, letterSpacing: -0.3 },
});
