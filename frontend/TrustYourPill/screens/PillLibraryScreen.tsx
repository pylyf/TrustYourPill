import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BookOpen,
  Pill as PillIcon,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { colors, fonts, gradients, type GradientKey } from '../theme';
import type { UserMedication } from '../lib/api';

// Cycle through card gradients for visual variety
const CARD_GRADIENTS: GradientKey[] = [
  'lightBlue',
  'warmPeach',
  'pinkPurple',
  'sage',
  'softPurple',
];

function gradientForIndex(index: number): GradientKey {
  return CARD_GRADIENTS[index % CARD_GRADIENTS.length];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type Props = {
  medications: UserMedication[];
  onAdd: () => void;
  onDelete: (medId: string) => void;
};

export function PillLibraryScreen({ medications, onAdd, onDelete }: Props) {
  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.contentInner}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Your medications</Text>
          <Text style={styles.title}>Library</Text>
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
        <Text style={styles.cardLabel}>Total medications</Text>
        <Text style={styles.summaryValue}>
          {medications.length}
          <Text style={styles.summaryUnit}>
            {medications.length === 1 ? ' medication saved' : ' medications saved'}
          </Text>
        </Text>
        <Text style={styles.summaryHint}>Scan a label to add more</Text>
      </LinearGradient>

      {medications.length === 0 ? (
        <EmptyState onAdd={onAdd} />
      ) : (
        <View style={styles.list}>
          {medications.map((med, index) => (
            <MedCard
              key={med.id}
              med={med}
              gradient={gradientForIndex(index)}
              onDelete={() => onDelete(med.id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function MedCard({
  med,
  gradient,
  onDelete,
}: {
  med: UserMedication;
  gradient: GradientKey;
  onDelete: () => void;
}) {
  return (
    <LinearGradient
      colors={gradients[gradient] as unknown as readonly [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.medCard}
    >
      <View style={styles.medIconWrap}>
        <PillIcon size={20} strokeWidth={2.2} color={colors.dark} />
      </View>

      <View style={styles.medInfo}>
        <Text style={styles.medName} numberOfLines={1}>
          {med.displayName}
        </Text>
        <Text style={styles.medMeta} numberOfLines={1}>
          Added {formatDate(med.createdAt)}
        </Text>
      </View>

      <Pressable onPress={onDelete} style={styles.deleteBtn} hitSlop={12}>
        <Trash2 size={16} strokeWidth={2} color="rgba(0,0,0,0.35)" />
      </Pressable>
    </LinearGradient>
  );
}

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
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonAccent: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 6.6,
    shadowOffset: { width: 0, height: 0 },
  },

  summaryCard: {
    marginHorizontal: 28,
    borderRadius: 22,
    padding: 20,
    gap: 6,
  },
  cardLabel: {
    fontSize: 13,
    lineHeight: 16,
    color: colors.metaStrong,
    fontFamily: fonts.medium,
    letterSpacing: -0.2,
  },
  summaryValue: {
    fontSize: 32,
    lineHeight: 36,
    color: '#000',
    fontFamily: fonts.semiBold,
    letterSpacing: -1,
  },
  summaryUnit: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.6)',
    fontFamily: fonts.medium,
    letterSpacing: -0.3,
  },
  summaryHint: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.45)',
    fontFamily: fonts.regular,
    letterSpacing: -0.2,
  },

  list: {
    paddingHorizontal: 28,
    gap: 12,
  },

  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 22,
  },
  medIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medInfo: { flex: 1 },
  medName: {
    fontSize: 16,
    color: '#000',
    fontFamily: fonts.semiBold,
    letterSpacing: -0.4,
  },
  medMeta: {
    fontSize: 12,
    color: colors.meta,
    fontFamily: fonts.medium,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyState: {
    marginHorizontal: 28,
    alignItems: 'center',
    paddingTop: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 107, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: '#000',
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  emptyBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 9999,
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  emptyBtnText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.white,
    letterSpacing: -0.3,
  },
});
