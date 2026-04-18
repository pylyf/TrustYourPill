import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronLeft,
  Clock,
  HeartPulse,
  X,
} from 'lucide-react-native';
import { colors, fonts, gradients } from '../theme';

type AdherenceAnswer = 'all' | 'partial' | 'none' | null;
type Step = 'symptoms' | 'adherence' | 'recommendation';

const SYMPTOMS = [
  { key: 'headache', emoji: '🤕', label: 'Headache' },
  { key: 'nausea',   emoji: '🤢', label: 'Nausea' },
  { key: 'fatigue',  emoji: '😴', label: 'Fatigue' },
  { key: 'dizzy',    emoji: '😵', label: 'Dizzy' },
  { key: 'stomach',  emoji: '🫃', label: 'Stomach' },
  { key: 'fever',    emoji: '🤒', label: 'Fever' },
  { key: 'other',    emoji: '✍️', label: 'Other' },
] as const;

type SymptomKey = typeof SYMPTOMS[number]['key'];

const SIDE_EFFECTS: Record<string, SymptomKey[]> = {
  Paracetamol: ['nausea'],
  Ibuprofen: ['stomach', 'nausea', 'dizzy'],
};

const ACTIVE_PILLS = ['Paracetamol', 'Ibuprofen'];

export function CheckupScreen({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('symptoms');
  const [feelingGood, setFeelingGood] = useState(false);
  const [symptoms, setSymptoms] = useState<Set<SymptomKey>>(new Set());
  const [otherSymptom, setOtherSymptom] = useState('');
  const [adherence, setAdherence] = useState<AdherenceAnswer>(null);

  const stepIndex = step === 'symptoms' ? 0 : step === 'adherence' ? 1 : 2;

  const possibleSideEffects = useMemo(() => {
    if (feelingGood || symptoms.size === 0) return [];
    return ACTIVE_PILLS.flatMap((pill) => {
      const matched = (SIDE_EFFECTS[pill] ?? []).filter((s) => symptoms.has(s));
      return matched.map((sym) => ({ pill, symptom: sym }));
    });
  }, [feelingGood, symptoms]);

  function toggleSymptom(key: SymptomKey) {
    setFeelingGood(false);
    setSymptoms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const otherSelected = symptoms.has('other');
  const otherFilled = otherSymptom.trim().length > 0;

  function next() {
    if (step === 'symptoms') setStep('adherence');
    else if (step === 'adherence') setStep('recommendation');
    else onClose();
  }

  function back() {
    if (step === 'symptoms') onClose();
    else if (step === 'adherence') setStep('symptoms');
    else setStep('adherence');
  }

  const canContinue =
    (step === 'symptoms' && (feelingGood || (symptoms.size > 0 && (!otherSelected || otherFilled)))) ||
    (step === 'adherence' && adherence !== null) ||
    step === 'recommendation';

  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={back}>
          <ChevronLeft size={22} strokeWidth={2.2} color={colors.dark} />
        </Pressable>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i <= stepIndex && styles.dotActive]} />
          ))}
        </View>
        <Pressable style={styles.iconButton} onPress={onClose}>
          <X size={20} strokeWidth={2.2} color={colors.dark} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.kicker}>Daily check-up</Text>
        <Text style={styles.title}>
          {step === 'symptoms' && 'How are you feeling?'}
          {step === 'adherence' && 'Did you take your pills?'}
          {step === 'recommendation' && "Here's your plan"}
        </Text>

        {step === 'symptoms' && (
          <View style={styles.stepBody}>
            <LinearGradient
              colors={gradients.sage as unknown as readonly [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.feelingCard}
            >
              <Pressable
                style={styles.feelingInner}
                onPress={() => {
                  setFeelingGood((v) => !v);
                  setSymptoms(new Set());
                  setOtherSymptom('');
                }}
              >
                <View style={[styles.checkCircle, feelingGood && styles.checkCircleActive]}>
                  {feelingGood ? <Check size={16} strokeWidth={2.6} color={colors.white} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.feelingTitle}>Feeling good</Text>
                  <Text style={styles.feelingMeta}>No symptoms today</Text>
                </View>
                <HeartPulse size={20} strokeWidth={2.2} color="#1C6B3A" />
              </Pressable>
            </LinearGradient>

            <Text style={styles.sectionTitle}>Or pick what's off</Text>
            <View style={styles.chipGrid}>
              {SYMPTOMS.map((s) => {
                const active = symptoms.has(s.key);
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => toggleSymptom(s.key)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={styles.chipEmoji}>{s.emoji}</Text>
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {otherSelected ? (
              <View style={styles.otherInputWrap}>
                <Text style={styles.otherLabel}>What other symptom/s are you feeling?</Text>
                <TextInput
                  value={otherSymptom}
                  onChangeText={setOtherSymptom}
                  placeholder="Type your symptom"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  style={styles.otherInput}
                />
              </View>
            ) : null}
          </View>
        )}

        {step === 'adherence' && (
          <View style={styles.stepBody}>
            <Text style={styles.subheadline}>You have 4 pills scheduled today.</Text>
            <View style={styles.optionList}>
              {(
                [
                  { key: 'all',     label: 'Yes, took all',   gradient: gradients.sage       },
                  { key: 'partial', label: 'Only some',       gradient: gradients.nextDose   },
                  { key: 'none',    label: "Didn't take any", gradient: gradients.dangerChip },
                ] as const
              ).map((opt) => {
                const active = adherence === opt.key;
                return (
                  <Pressable key={opt.key} onPress={() => setAdherence(opt.key)}>
                    <LinearGradient
                      colors={opt.gradient as unknown as readonly [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.optionCard, active && styles.optionCardActive]}
                    >
                      <View style={[styles.radio, active && styles.radioActive]}>
                        {active ? <Check size={14} strokeWidth={2.8} color={colors.white} /> : null}
                      </View>
                      <Text style={styles.optionLabel}>{opt.label}</Text>
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 'recommendation' && (
          <View style={styles.stepBody}>
            {adherence === 'none' || adherence === 'partial' ? (
              <LinearGradient
                colors={gradients.lightBlue as unknown as readonly [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.recCard}
              >
                <View style={styles.recHeader}>
                  <Clock size={18} strokeWidth={2.3} color={colors.accent} />
                  <Text style={styles.recKicker}>Missed dose</Text>
                </View>
                <Text style={styles.recTitle}>Take it now</Text>
                <Text style={styles.recBody}>
                  Your next scheduled dose is at 2:30 PM. You still have time to catch up safely.
                </Text>
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={gradients.sage as unknown as readonly [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.recCard}
              >
                <View style={styles.recHeader}>
                  <Check size={18} strokeWidth={2.3} color="#1C6B3A" />
                  <Text style={[styles.recKicker, { color: '#1C6B3A' }]}>On track</Text>
                </View>
                <Text style={styles.recTitle}>Great job staying consistent</Text>
                <Text style={styles.recBody}>
                  You're hitting your schedule. Keep going — next dose at 2:30 PM.
                </Text>
              </LinearGradient>
            )}

            {possibleSideEffects.length > 0 ? (
              <View style={styles.sideEffectsBlock}>
                <Text style={styles.sectionTitle}>Could this be a side effect?</Text>
                {possibleSideEffects.map((se, i) => (
                  <LinearGradient
                    key={`${se.pill}-${se.symptom}-${i}`}
                    colors={gradients.warningChip as unknown as readonly [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sideEffectCard}
                  >
                    <AlertTriangle size={18} strokeWidth={2.3} color="#8A3A14" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sideEffectTitle}>{se.pill}</Text>
                      <Text style={styles.sideEffectBody}>
                        Can sometimes cause {se.symptom}. This may be related.
                      </Text>
                    </View>
                  </LinearGradient>
                ))}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <Pressable
        style={[styles.cta, !canContinue && styles.ctaDisabled]}
        onPress={next}
        disabled={!canContinue}
      >
        <Text style={styles.ctaText}>
          {step === 'recommendation' ? 'Done' : 'Continue'}
        </Text>
        <ArrowRight size={18} strokeWidth={2.4} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.white },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 28,
    paddingTop: 10, paddingBottom: 14,
  },
  iconButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.cardGray,
    alignItems: 'center', justifyContent: 'center',
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  dotActive: { backgroundColor: colors.accent, width: 22 },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 28, paddingBottom: 28, gap: 12 },
  kicker: {
    fontSize: 13, color: 'rgba(0,0,0,0.5)',
    fontFamily: fonts.medium, letterSpacing: -0.25,
  },
  title: {
    fontSize: 32, lineHeight: 36, letterSpacing: -1,
    color: '#000', fontFamily: fonts.semiBold,
  },
  stepBody: { marginTop: 10, gap: 14 },
  subheadline: {
    fontSize: 15, color: colors.meta,
    fontFamily: fonts.medium, letterSpacing: -0.3,
  },
  feelingCard: { borderRadius: 22, overflow: 'hidden' },
  feelingInner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  checkCircle: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.25)',
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircleActive: { backgroundColor: '#1C6B3A', borderColor: '#1C6B3A' },
  feelingTitle: {
    fontSize: 18, color: '#000',
    fontFamily: fonts.semiBold, letterSpacing: -0.45,
  },
  feelingMeta: {
    fontSize: 12, color: colors.meta,
    fontFamily: fonts.medium, letterSpacing: -0.2, marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20, lineHeight: 24, letterSpacing: -0.55,
    color: '#000', fontFamily: fonts.semiBold, marginTop: 6,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 9999,
    backgroundColor: colors.cardGray,
  },
  chipActive: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent, shadowOpacity: 0.4,
    shadowRadius: 6.6, shadowOffset: { width: 0, height: 0 },
  },
  chipEmoji: { fontSize: 16 },
  chipLabel: {
    fontSize: 14, color: colors.dark,
    fontFamily: fonts.medium, letterSpacing: -0.3,
  },
  chipLabelActive: { color: colors.white, fontFamily: fonts.semiBold },
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
  optionList: { gap: 10 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 18, borderRadius: 22,
  },
  optionCardActive: {
    shadowColor: colors.accent, shadowOpacity: 0.35,
    shadowRadius: 6.6, shadowOffset: { width: 0, height: 0 },
  },
  radio: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.25)',
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  optionLabel: {
    fontSize: 16, color: '#000',
    fontFamily: fonts.semiBold, letterSpacing: -0.4, flex: 1,
  },
  recCard: { borderRadius: 22, padding: 20, gap: 8 },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recKicker: {
    fontSize: 12, color: colors.accent,
    fontFamily: fonts.semiBold, letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  recTitle: {
    fontSize: 24, lineHeight: 28, color: '#000',
    fontFamily: fonts.semiBold, letterSpacing: -0.6,
  },
  recBody: {
    fontSize: 14, lineHeight: 20, color: colors.metaStrong,
    fontFamily: fonts.medium, letterSpacing: -0.25,
  },
  sideEffectsBlock: { gap: 10, marginTop: 10 },
  sideEffectCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 16, borderRadius: 22,
  },
  sideEffectTitle: {
    fontSize: 15, color: '#000',
    fontFamily: fonts.semiBold, letterSpacing: -0.35,
  },
  sideEffectBody: {
    marginTop: 2, fontSize: 13, color: '#8A3A14',
    fontFamily: fonts.medium, letterSpacing: -0.2,
  },
  cta: {
    margin: 28, marginTop: 10, backgroundColor: colors.accent,
    borderRadius: 22, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.accent, shadowOpacity: 0.4,
    shadowRadius: 6.6, shadowOffset: { width: 0, height: 0 },
  },
  ctaDisabled: { backgroundColor: '#B8C9E0', shadowOpacity: 0 },
  ctaText: {
    color: colors.white, fontSize: 15,
    fontFamily: fonts.semiBold, letterSpacing: -0.3,
  },
});
