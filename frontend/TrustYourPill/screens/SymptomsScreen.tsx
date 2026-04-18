import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, AlertTriangle, Check, Clock } from 'lucide-react-native';
import { colors, fonts, gradients } from '../theme';

type SymptomKey =
  | 'headache'
  | 'nausea'
  | 'fatigue'
  | 'dizzy'
  | 'stomach'
  | 'fever'
  | 'cough'
  | 'soreThroat'
  | 'other';

const SYMPTOMS: { key: SymptomKey; emoji: string; label: string }[] = [
  { key: 'headache',   emoji: '🤕', label: 'Headache' },
  { key: 'nausea',     emoji: '🤢', label: 'Nausea' },
  { key: 'fatigue',    emoji: '😴', label: 'Fatigue' },
  { key: 'dizzy',      emoji: '😵', label: 'Dizzy' },
  { key: 'stomach',    emoji: '🫃', label: 'Stomach' },
  { key: 'fever',      emoji: '🤒', label: 'Fever' },
  { key: 'cough',      emoji: '😷', label: 'Cough' },
  { key: 'soreThroat', emoji: '🗣️', label: 'Sore throat' },
  { key: 'other',      emoji: '✍️', label: 'Other' },
];

const HISTORY = [
  { id: '1', when: 'Today · 09:12', items: ['Headache', 'Fatigue'] },
  { id: '2', when: 'Yesterday · 21:40', items: ['Feeling good'] },
  { id: '3', when: 'Apr 16 · 14:05', items: ['Stomach', 'Nausea'] },
];

const SIDE_EFFECTS: Record<string, SymptomKey[]> = {
  Paracetamol: ['nausea', 'soreThroat'],
  Ibuprofen: ['stomach', 'nausea', 'dizzy'],
};

const ACTIVE_PILLS = ['Paracetamol', 'Ibuprofen'];

export function SymptomsScreen() {
  const [selected, setSelected] = useState<Set<SymptomKey>>(new Set());
  const [feelingGood, setFeelingGood] = useState(false);
  const [otherSymptom, setOtherSymptom] = useState('');

  function toggle(key: SymptomKey) {
    setFeelingGood(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const otherSelected = selected.has('other');
  const otherFilled = otherSymptom.trim().length > 0;
  const canSubmit = feelingGood || (selected.size > 0 && (!otherSelected || otherFilled));
  const loggedCount = selected.size;
  const selectedLabels = SYMPTOMS.filter((item) => selected.has(item.key)).map((item) => item.label.toLowerCase());
  const possibleSideEffects = useMemo(() => {
    if (feelingGood || selected.size === 0) return [];
    return ACTIVE_PILLS.flatMap((pill) => {
      const matched = (SIDE_EFFECTS[pill] ?? []).filter((symptom) => selected.has(symptom));
      return matched.map((symptom) => ({
        pill,
        symptom: SYMPTOMS.find((item) => item.key === symptom)?.label.toLowerCase() ?? symptom,
      }));
    });
  }, [feelingGood, selected]);

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.contentInner}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>Symptoms</Text>
        <Text style={styles.title}>How do you feel?</Text>
        <View style={styles.metaRow}>
          <Clock size={13} strokeWidth={2.2} color={colors.meta} />
          <Text style={styles.meta}>Last check-in · Today 09:12</Text>
        </View>
      </View>

      <LinearGradient
        colors={gradients.sage as unknown as readonly [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.feelingGoodCard}
      >
        <Pressable
          onPress={() => {
            setFeelingGood((v) => !v);
            setSelected(new Set());
            setOtherSymptom('');
          }}
          style={styles.feelingGoodInner}
        >
          <View style={[styles.checkCircle, feelingGood && styles.checkCircleActive]}>
            {feelingGood ? <Check size={16} strokeWidth={2.6} color={colors.white} /> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.feelingGoodTitle}>Feeling good</Text>
            <Text style={styles.feelingGoodMeta}>Log a healthy day</Text>
          </View>
          <Activity size={20} strokeWidth={2.2} color="#1C6B3A" />
        </Pressable>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Or pick what's off</Text>
      <View style={styles.chipGrid}>
        {SYMPTOMS.map((s) => {
          const active = selected.has(s.key);
          return (
            <Pressable
              key={s.key}
              onPress={() => toggle(s.key)}
              style={[styles.symptomChip, active && styles.symptomChipActive]}
            >
              <Text style={styles.symptomEmoji}>{s.emoji}</Text>
              <Text style={[styles.symptomLabel, active && styles.symptomLabelActive]}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {otherSelected ? (
        <View style={styles.otherInputWrap}>
          <Text style={styles.otherLabel}>What symptom are you feeling?</Text>
          <TextInput
            value={otherSymptom}
            onChangeText={setOtherSymptom}
            placeholder="Type your symptom"
            placeholderTextColor="rgba(0,0,0,0.35)"
            style={styles.otherInput}
          />
        </View>
      ) : null}

      {!feelingGood && selected.size > 0 ? (
        <View style={styles.sideEffectsBlock}>
          <Text style={styles.sectionTitle}>Could this be related?</Text>
          {possibleSideEffects.length > 0 ? (
            possibleSideEffects.map((item, index) => (
              <LinearGradient
                key={`${item.pill}-${item.symptom}-${index}`}
                colors={gradients.warningChip as unknown as readonly [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sideEffectCard}
              >
                <AlertTriangle size={18} strokeWidth={2.3} color="#8A3A14" />
                <View style={styles.sideEffectCopy}>
                  <Text style={styles.sideEffectTitle}>{item.pill}</Text>
                  <Text style={styles.sideEffectBody}>
                    This medication may be causing {item.symptom}: {item.pill}
                  </Text>
                </View>
              </LinearGradient>
            ))
          ) : (
            <LinearGradient
              colors={gradients.warningChip as unknown as readonly [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sideEffectCard}
            >
              <AlertTriangle size={18} strokeWidth={2.3} color="#8A3A14" />
              <View style={styles.sideEffectCopy}>
                <Text style={styles.sideEffectTitle}>Medication check</Text>
                <Text style={styles.sideEffectBody}>
                  {`No direct medication match found for ${selectedLabels.join(', ')} yet.`}
                </Text>
              </View>
            </LinearGradient>
          )}
        </View>
      ) : null}

      <Pressable style={[styles.cta, !canSubmit && styles.ctaDisabled]} disabled={!canSubmit}>
        <Text style={styles.ctaText}>
          {feelingGood ? 'Save check-in' : loggedCount > 0 ? `Log ${loggedCount} symptom${loggedCount === 1 ? '' : 's'}` : 'Select to log'}
        </Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Recent</Text>
      <View style={styles.historyList}>
        {HISTORY.map((h) => (
          <View key={h.id} style={styles.historyItem}>
            <Text style={styles.historyWhen}>{h.when}</Text>
            <Text style={styles.historyItems}>{h.items.join(' · ')}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  contentInner: { paddingBottom: 130, paddingTop: 10, paddingHorizontal: 28, gap: 14 },
  header: { marginBottom: 4 },
  kicker: {
    fontSize: 13, color: 'rgba(0,0,0,0.5)',
    fontFamily: fonts.medium, letterSpacing: -0.25, marginBottom: 4,
  },
  title: {
    fontSize: 36, lineHeight: 38, letterSpacing: -1.1,
    color: '#000', fontFamily: fonts.semiBold,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  meta: {
    fontSize: 12, color: colors.meta,
    fontFamily: fonts.medium, letterSpacing: -0.2,
  },
  feelingGoodCard: { borderRadius: 22, overflow: 'hidden' },
  feelingGoodInner: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18,
  },
  checkCircle: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  checkCircleActive: {
    backgroundColor: '#1C6B3A', borderColor: '#1C6B3A',
  },
  feelingGoodTitle: {
    fontSize: 18, color: '#000',
    fontFamily: fonts.semiBold, letterSpacing: -0.45,
  },
  feelingGoodMeta: {
    fontSize: 12, color: colors.meta,
    fontFamily: fonts.medium, letterSpacing: -0.2, marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20, lineHeight: 24, letterSpacing: -0.55,
    color: '#000', fontFamily: fonts.semiBold, marginTop: 6,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symptomChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 9999,
    backgroundColor: colors.cardGray,
    borderWidth: 2, borderColor: 'transparent',
  },
  symptomChipActive: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent, shadowOpacity: 0.4,
    shadowRadius: 6.6, shadowOffset: { width: 0, height: 0 },
  },
  symptomEmoji: { fontSize: 16 },
  symptomLabel: {
    fontSize: 14, color: colors.dark,
    fontFamily: fonts.medium, letterSpacing: -0.3,
  },
  symptomLabelActive: { color: colors.white, fontFamily: fonts.semiBold },
  otherInputWrap: { gap: 8 },
  otherLabel: {
    fontSize: 14, color: colors.metaStrong,
    fontFamily: fonts.medium, letterSpacing: -0.25,
  },
  otherInput: {
    backgroundColor: colors.cardGray,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.dark,
    fontFamily: fonts.medium,
    letterSpacing: -0.3,
  },
  sideEffectsBlock: { gap: 10 },
  sideEffectCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 22,
  },
  sideEffectCopy: { flex: 1 },
  sideEffectTitle: {
    fontSize: 15,
    color: '#000',
    fontFamily: fonts.semiBold,
    letterSpacing: -0.35,
  },
  sideEffectBody: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: '#8A3A14',
    fontFamily: fonts.medium,
    letterSpacing: -0.2,
  },
  cta: {
    backgroundColor: colors.accent, borderRadius: 22,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
    shadowColor: colors.accent, shadowOpacity: 0.4,
    shadowRadius: 6.6, shadowOffset: { width: 0, height: 0 },
  },
  ctaDisabled: { backgroundColor: '#B8C9E0', shadowOpacity: 0 },
  ctaText: {
    color: colors.white, fontSize: 15,
    fontFamily: fonts.semiBold, letterSpacing: -0.3,
  },
  historyList: { gap: 10 },
  historyItem: {
    backgroundColor: colors.cardGray, borderRadius: 18, padding: 14,
  },
  historyWhen: {
    fontSize: 12, color: colors.meta,
    fontFamily: fonts.medium, letterSpacing: -0.2,
  },
  historyItems: {
    marginTop: 4, fontSize: 15, color: '#000',
    fontFamily: fonts.semiBold, letterSpacing: -0.3,
  },
});
