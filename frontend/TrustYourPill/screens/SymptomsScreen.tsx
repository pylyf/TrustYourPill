import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, AlertTriangle, Check, Clock } from 'lucide-react-native';
import { colors, fonts, gradients } from '../theme';
import { getSymptomLogs, createSymptomLog, type SymptomLog, type UserMedication } from '../lib/api';

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

// Maps symptom keys to domain keywords found in analysis.sideEffectSignals
const SYMPTOM_TO_DOMAINS: Record<SymptomKey, string[]> = {
  headache:   ['headache', 'bleeding_risk'],
  nausea:     ['nausea', 'stomach', 'gastrointestinal'],
  fatigue:    ['fatigue', 'sedation'],
  dizzy:      ['dizziness', 'sedation', 'bleeding_risk'],
  stomach:    ['stomach', 'stomach_irritation', 'gastrointestinal', 'liver_caution'],
  fever:      ['fever'],
  cough:      ['cough', 'respiratory'],
  soreThroat: ['throat', 'respiratory'],
  other:      [],
};

function formatLogDate(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  if (isToday) return `Today · ${time}`;
  if (isYesterday) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${time}`;
}

function SymptomChipButton({
  item,
  active,
  onPress,
  delay,
}: {
  item: { key: SymptomKey; emoji: string; label: string };
  active: boolean;
  onPress: () => void;
  delay: number;
}) {
  const mount = useRef(new Animated.Value(0)).current;
  const activeAnim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const pressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(mount, {
      toValue: 1,
      duration: 520,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, mount]);

  useEffect(() => {
    Animated.spring(activeAnim, {
      toValue: active ? 1 : 0,
      damping: 12,
      mass: 0.9,
      stiffness: 170,
      useNativeDriver: true,
    }).start();
  }, [active, activeAnim]);

  const scale = Animated.multiply(
    activeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.05],
    }),
    pressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.96],
    })
  );

  return (
    <Animated.View
      style={{
        opacity: mount,
        transform: [
          {
            translateY: mount.interpolate({
              inputRange: [0, 1],
              outputRange: [22, 0],
            }),
          },
          {
            scale,
          },
        ],
      }}
    >
      <Pressable
        key={item.key}
        onPress={onPress}
        onPressIn={() => {
          Animated.spring(pressAnim, {
            toValue: 1,
            damping: 14,
            stiffness: 220,
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(pressAnim, {
            toValue: 0,
            damping: 14,
            stiffness: 220,
            useNativeDriver: true,
          }).start();
        }}
        style={[styles.symptomChip, active && styles.symptomChipActive]}
      >
        <Text style={styles.symptomEmoji}>{item.emoji}</Text>
        <Text style={[styles.symptomLabel, active && styles.symptomLabelActive]}>
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function SymptomsScreen({ medications }: { medications: UserMedication[] }) {
  const [selected, setSelected] = useState<Set<SymptomKey>>(new Set());
  const [feelingGood, setFeelingGood] = useState(false);
  const [otherSymptom, setOtherSymptom] = useState('');
  const [history, setHistory] = useState<SymptomLog[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const pageAnim = useRef(new Animated.Value(0)).current;
  const goodAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;
  const otherReveal = useRef(new Animated.Value(0)).current;
  const insightReveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getSymptomLogs().then(setHistory).catch(() => {});
  }, []);

  const lastCheckIn = history[0] ? formatLogDate(history[0].loggedAt) : null;

  function toggle(key: SymptomKey) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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

  // Match selected symptoms against stored analysis side effect signals
  const possibleSideEffects = useMemo(() => {
    if (feelingGood || selected.size === 0) return [];
    const results: { pill: string; symptom: string }[] = [];
    for (const med of medications) {
      const signals = med.analysis?.sideEffectSignals ?? [];
      for (const symptomKey of Array.from(selected) as SymptomKey[]) {
        if (symptomKey === 'other') continue;
        const domains = SYMPTOM_TO_DOMAINS[symptomKey];
        const matchedSignal = signals.find((sig) =>
          domains.some((d) => sig.domain.toLowerCase().includes(d))
        );
        if (matchedSignal) {
          results.push({
            pill: med.displayName.split(' ')[0],
            symptom: SYMPTOMS.find((s) => s.key === symptomKey)?.label.toLowerCase() ?? symptomKey,
          });
        }
      }
    }
    return results;
  }, [feelingGood, selected, medications]);

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const log = await createSymptomLog({
        symptoms: Array.from(selected),
        otherText: otherSelected ? otherSymptom.trim() || null : null,
        feelingGood,
      });
      setHistory((prev) => [log, ...prev]);
      setSelected(new Set());
      setFeelingGood(false);
      setOtherSymptom('');
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    Animated.timing(pageAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [pageAnim]);

  useEffect(() => {
    Animated.spring(goodAnim, {
      toValue: feelingGood ? 1 : 0,
      damping: 14,
      mass: 0.9,
      stiffness: 160,
      useNativeDriver: true,
    }).start();
  }, [feelingGood, goodAnim]);

  useEffect(() => {
    Animated.spring(ctaAnim, {
      toValue: canSubmit ? 1 : 0,
      damping: 16,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
  }, [canSubmit, ctaAnim]);

  useEffect(() => {
    Animated.timing(otherReveal, {
      toValue: otherSelected ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [otherSelected, otherReveal]);

  useEffect(() => {
    Animated.timing(insightReveal, {
      toValue: !feelingGood && selected.size > 0 ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [feelingGood, selected.size, insightReveal]);

  function revealStyle(offset: number, delay = 0) {
    return {
      opacity: pageAnim.interpolate({
        inputRange: [0, 0.55, 1],
        outputRange: [0, 0.12, 1],
      }),
      transform: [
        {
          translateY: pageAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [offset + delay * 0.05, 0],
          }),
        },
      ],
    } as const;
  }

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.contentInner}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.header, revealStyle(30)]}>
        <Text style={styles.kicker}>Symptoms</Text>
        <Text style={styles.title}>How do you feel?</Text>
        <View style={styles.metaRow}>
          <Clock size={13} strokeWidth={2.2} color={colors.meta} />
          <Text style={styles.meta}>Last check-in · {lastCheckIn ?? '—'}</Text>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          revealStyle(42, 80),
          {
            transform: [
              {
                translateY: pageAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [42, 0],
                }),
              },
              {
                scale: goodAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.015],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={gradients.sage as unknown as readonly [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.feelingGoodCard}
        >
          <Pressable
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setFeelingGood((v) => !v);
              setSelected(new Set());
              setOtherSymptom('');
            }}
            style={styles.feelingGoodInner}
          >
            <Animated.View
              style={[
                styles.checkCircle,
                feelingGood && styles.checkCircleActive,
                {
                  transform: [
                    {
                      scale: goodAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.14],
                      }),
                    },
                  ],
                },
              ]}
            >
              {feelingGood ? <Check size={16} strokeWidth={2.6} color={colors.white} /> : null}
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Text style={styles.feelingGoodTitle}>Feeling good</Text>
              <Text style={styles.feelingGoodMeta}>Log a healthy day</Text>
            </View>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: goodAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '8deg'],
                    }),
                  },
                  {
                    scale: goodAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.08],
                    }),
                  },
                ],
              }}
            >
              <Activity size={20} strokeWidth={2.2} color="#1C6B3A" />
            </Animated.View>
          </Pressable>
        </LinearGradient>
      </Animated.View>

      <Animated.Text style={[styles.sectionTitle, revealStyle(30, 120)]}>Or pick what's off</Animated.Text>
      <View style={styles.chipGrid}>
        {SYMPTOMS.map((s) => {
          const active = selected.has(s.key);
          return (
            <SymptomChipButton
              key={s.key}
              item={s}
              active={active}
              onPress={() => toggle(s.key)}
              delay={160 + SYMPTOMS.findIndex((item) => item.key === s.key) * 45}
            />
          );
        })}
      </View>

      {otherSelected ? (
        <Animated.View
          style={[
            styles.otherInputWrap,
            {
              opacity: otherReveal,
              transform: [
                {
                  translateY: otherReveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.otherLabel}>What symptom are you feeling?</Text>
          <TextInput
            value={otherSymptom}
            onChangeText={setOtherSymptom}
            placeholder="Type your symptom"
            placeholderTextColor="rgba(0,0,0,0.35)"
            style={styles.otherInput}
          />
        </Animated.View>
      ) : null}

      {!feelingGood && selected.size > 0 ? (
        <Animated.View
          style={[
            styles.sideEffectsBlock,
            {
              opacity: insightReveal,
              transform: [
                {
                  translateY: insightReveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
                },
                {
                  scale: insightReveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.98, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Could this be related?</Text>
          {possibleSideEffects.length > 0 ? (
            possibleSideEffects.map((item, index) => (
              <Animated.View
                key={`${item.pill}-${item.symptom}-${index}`}
                style={{
                  opacity: insightReveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                  transform: [
                    {
                      translateY: insightReveal.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18 + index * 8, 0],
                      }),
                    },
                  ],
                }}
              >
                <LinearGradient
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
              </Animated.View>
            ))
          ) : (
            <Animated.View
              style={{
                opacity: insightReveal,
                transform: [
                  {
                    translateY: insightReveal.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              }}
            >
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
            </Animated.View>
          )}
        </Animated.View>
      ) : null}

      <Animated.View
        style={[
          revealStyle(28, 220),
          {
            opacity: Animated.add(
              pageAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.35],
              }),
              ctaAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 0.65],
              })
            ),
            transform: [
              {
                translateY: pageAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [28, 0],
                }),
              },
              {
                scale: ctaAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.985, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable style={[styles.cta, !canSubmit && styles.ctaDisabled]} disabled={!canSubmit || submitting} onPress={handleSubmit}>
          <Text style={styles.ctaText}>
            {submitting ? 'Saving…' : feelingGood ? 'Save check-in' : loggedCount > 0 ? `Log ${loggedCount} symptom${loggedCount === 1 ? '' : 's'}` : 'Select to log'}
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.Text style={[styles.sectionTitle, revealStyle(26, 260)]}>Recent</Animated.Text>
      <Animated.View style={[styles.historyList, revealStyle(34, 320)]}>
        {history.length === 0 ? (
          <View style={styles.historyItem}>
            <Text style={styles.historyWhen}>No check-ins yet</Text>
            <Text style={styles.historyItems}>Log your first symptom above</Text>
          </View>
        ) : (
          history.slice(0, 10).map((h) => (
            <Animated.View
              key={h.id}
              style={{
                opacity: pageAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                transform: [{ translateY: pageAnim.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }],
              }}
            >
              <View style={styles.historyItem}>
                <Text style={styles.historyWhen}>{formatLogDate(h.loggedAt)}</Text>
                <Text style={styles.historyItems}>
                  {h.feelingGood
                    ? 'Feeling good'
                    : h.symptoms.map((s) =>
                        SYMPTOMS.find((x) => x.key === s)?.label ?? s
                      ).join(' · ') || (h.otherText ?? 'Other')}
                </Text>
              </View>
            </Animated.View>
          ))
        )}
      </Animated.View>
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
