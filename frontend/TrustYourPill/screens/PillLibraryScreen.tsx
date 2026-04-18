import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  Droplets,
  FlaskConical,
  Package,
  Pill as PillIcon,
  Plus,
  Search,
  Syringe,
  Wind,
  type LucideIcon,
} from 'lucide-react-native';
import { colors, fonts, gradients, type GradientKey } from '../theme';

type MedType = 'tablet' | 'drops' | 'injection' | 'inhaler' | 'syrup' | 'cream';

type Med = {
  id: string;
  name: string;
  dose: string;
  purpose: string;
  type: MedType;
  dateAdded: string;
  gradient: GradientKey;
  conflictsWith: string[];
};

const TYPE_META: Record<MedType, { icon: LucideIcon; label: string }> = {
  tablet:    { icon: PillIcon,     label: 'Tablet' },
  drops:     { icon: Droplets,     label: 'Drops' },
  injection: { icon: Syringe,      label: 'Injection' },
  inhaler:   { icon: Wind,         label: 'Inhaler' },
  syrup:     { icon: FlaskConical, label: 'Syrup' },
  cream:     { icon: Package,      label: 'Topical' },
};

const LIBRARY: Med[] = [
  { id: '1', name: 'Paracetamol', dose: '500mg',  purpose: 'Pain relief',       type: 'tablet',    dateAdded: 'Apr 12', gradient: 'lightBlue',  conflictsWith: [] },
  { id: '2', name: 'Vitamin D3',  dose: '1000 IU',purpose: 'Supplement',        type: 'drops',     dateAdded: 'Apr 12', gradient: 'warmPeach',  conflictsWith: [] },
  { id: '3', name: 'Insulin',     dose: '10 u',   purpose: 'Diabetes',          type: 'injection', dateAdded: 'Apr 10', gradient: 'pinkPurple', conflictsWith: [] },
  { id: '4', name: 'Ventolin',    dose: '100mcg', purpose: 'Asthma relief',     type: 'inhaler',   dateAdded: 'Apr 09', gradient: 'sage',       conflictsWith: [] },
  { id: '5', name: 'Ibuprofen',   dose: '200mg',  purpose: 'Anti-inflammatory', type: 'tablet',    dateAdded: 'Apr 08', gradient: 'softPurple', conflictsWith: ['Aspirin', 'Warfarin'] },
  { id: '6', name: 'Cough syrup', dose: '15ml',   purpose: 'Cough relief',      type: 'syrup',     dateAdded: 'Apr 06', gradient: 'lightBlue',  conflictsWith: [] },
  { id: '7', name: 'Hydrocort.',  dose: '1%',     purpose: 'Skin irritation',   type: 'cream',     dateAdded: 'Apr 02', gradient: 'warmPeach',  conflictsWith: [] },
  { id: '8', name: 'Aspirin',     dose: '75mg',   purpose: 'Blood thinner',     type: 'tablet',    dateAdded: 'Mar 28', gradient: 'pinkPurple', conflictsWith: ['Ibuprofen'] },
];

export function PillLibraryScreen({ onAdd }: { onAdd: () => void }) {
  const totalConflicts = LIBRARY.filter((m) => m.conflictsWith.length > 0).length;

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.contentInner}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Your Library</Text>
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
        <Text style={styles.cardLabel}>Library overview</Text>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryValue}>
              {LIBRARY.length}<Text style={styles.summaryUnit}> items</Text>
            </Text>
            <Text style={styles.cardMeta}>across 6 medicine types</Text>
          </View>
          <View style={styles.conflictPill}>
            <AlertTriangle size={13} strokeWidth={2.4} color="#8A3A14" />
            <Text style={styles.conflictPillText}>
              {totalConflicts} conflict{totalConflicts === 1 ? '' : 's'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.grid}>
        {LIBRARY.map((med) => (
          <View key={med.id} style={styles.gridItem}>
            <MedCard med={med} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function MedCard({ med }: { med: Med }) {
  const Icon = TYPE_META[med.type].icon;
  const typeLabel = TYPE_META[med.type].label;
  const hasConflicts = med.conflictsWith.length > 0;

  return (
    <LinearGradient
      colors={gradients[med.gradient] as unknown as readonly [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={styles.typeIcon}>
          <Icon size={16} strokeWidth={2.2} color={colors.dark} />
        </View>
        <Text style={styles.typeLabel}>{typeLabel}</Text>
        {hasConflicts ? (
          <View style={styles.warnDot}>
            <AlertTriangle size={11} strokeWidth={2.6} color="#8A3A14" />
          </View>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.medName} numberOfLines={1}>{med.name}</Text>
        <Text style={styles.medDose} numberOfLines={1}>
          {med.dose}
        </Text>
        <Text style={styles.medPurpose} numberOfLines={1}>{med.purpose}</Text>
      </View>

      <Text style={styles.dateAdded}>Added {med.dateAdded}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  contentInner: { paddingBottom: 130, paddingTop: 12, gap: 12 },
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

  summaryCard: {
    marginHorizontal: 28, borderRadius: 22, padding: 20,
  },
  summaryRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', marginTop: 14,
  },
  summaryValue: {
    fontSize: 40, lineHeight: 42, color: '#000',
    fontFamily: fonts.semiBold, letterSpacing: -1.3,
  },
  summaryUnit: {
    fontSize: 20, color: 'rgba(0,0,0,0.6)',
    fontFamily: fonts.medium, letterSpacing: -0.4,
  },
  conflictPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999,
  },
  conflictPillText: {
    fontSize: 12, color: '#8A3A14',
    fontFamily: fonts.semiBold, letterSpacing: -0.2,
  },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 28, gap: 12,
  },
  gridItem: { width: '48%' },

  card: { borderRadius: 22, padding: 16, height: 170, justifyContent: 'space-between' },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  typeLabel: {
    fontSize: 12, color: colors.metaStrong,
    fontFamily: fonts.medium, letterSpacing: -0.2, flex: 1,
  },
  warnDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },

  cardBody: { marginTop: 10 },

  medName: {
    fontSize: 18, lineHeight: 22, color: '#000',
    fontFamily: fonts.semiBold, letterSpacing: -0.45,
  },
  medDose: {
    fontSize: 13, color: '#000', fontFamily: fonts.semiBold,
    letterSpacing: -0.25, marginTop: 2,
  },
  medPurpose: {
    fontSize: 12, color: colors.meta,
    fontFamily: fonts.medium, letterSpacing: -0.2, marginTop: 2,
  },

  dateAdded: {
    fontSize: 11, color: colors.meta,
    fontFamily: fonts.medium, letterSpacing: -0.2, marginTop: 10,
  },

  cardLabel: {
    fontSize: 13, lineHeight: 16, color: colors.metaStrong,
    fontFamily: fonts.medium, letterSpacing: -0.2,
  },
  cardMeta: {
    fontSize: 12, color: colors.meta, fontFamily: fonts.medium,
    letterSpacing: -0.2, marginTop: 2,
  },
});
