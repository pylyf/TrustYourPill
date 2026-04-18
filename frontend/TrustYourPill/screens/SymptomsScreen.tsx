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
import { Activity, AlertTriangle, Check, ChevronRight, Clock, Sparkles } from 'lucide-react-native';
import { colors, fonts, gradients } from '../theme';
import { createSymptomLog, getSymptomLogs, type SymptomLog, type UserMedication } from '../lib/api';

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

const SYMPTOMS: { key: SymptomKey; emoji: string; label: string; tint: string }[] = [
  { key: 'headache', emoji: '🤕', label: 'Headache', tint: '#FFF1ED' },
  { key: 'nausea', emoji: '🤢', label: 'Nausea', tint: '#FDF3E6' },
  { key: 'fatigue', emoji: '😴', label: 'Fatigue', tint: '#F4F0FF' },
  { key: 'dizzy', emoji: '😵', label: 'Dizzy', tint: '#EEF7FF' },
  { key: 'stomach', emoji: '🫃', label: 'Stomach', tint: '#FFF4E8' },
  { key: 'fever', emoji: '🤒', label: 'Fever', tint: '#FFF0F0' },
  { key: 'cough', emoji: '😷', label: 'Cough', tint: '#EEF8F0' },
  { key: 'soreThroat', emoji: '🗣️', label: 'Sore throat', tint: '#FFF4ED' },
  { key: 'other', emoji: '✍️', label: 'Other', tint: '#F3F4F6' },
];

const SYMPTOM_TO_DOMAINS: Record<SymptomKey, string[]> = {
  headache: ['headache', 'bleeding_risk'],
  nausea: ['nausea', 'stomach', 'gastrointestinal'],
  fatigue: ['fatigue', 'sedation'],
  dizzy: ['dizziness', 'sedation', 'bleeding_risk'],
  stomach: ['stomach', 'stomach_irritation', 'gastrointestinal', 'liver_caution'],
  fever: ['fever'],
  cough: ['cough', 'respiratory'],
  soreThroat: ['throat', 'respiratory'],
  other: [],
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

function formatLogItems(log: SymptomLog): string {
  if (log.feelingGood) return 'Feeling good';
  const labels = log.symptoms
    .map((symptom) => SYMPTOMS.find((item) => item.key === symptom)?.label)
    .filter(Boolean) as string[];
  if (log.otherText?.trim()) labels.push(log.otherText.trim());
  return labels.join(' · ');
}

function SymptomCard({
  item,
  active,
  onPress,
  delay,
}: {
  item: { key: SymptomKey; emoji: string; label: string; tint: string };
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
      damping: 14,
      mass: 0.9,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
  }, [active, activeAnim]);

  return (
    <Animated.View
      style={[
        styles.symptomCardWrap,
        {
          opacity: mount,
          transform: [
            {
              translateY: mount.interpolate({
                inputRange: [0, 1],
                outputRange: [24, 0],
              }),
            },
            {
              scale: Animated.multiply(
                activeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.02],
                }),
                pressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.97],
                })
              ),
            },
          ],
        },
      ]}
    >
      <Pressable
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
        style={[
          styles.symptomCard,
          { backgroundColor: active ? colors.accent : item.tint },
          active && styles.symptomCardActive,
        ]}
      >
        <View style={[styles.symptomIcon, active && styles.symptomIconActive]}>
          <Text style={styles.symptomEmoji}>{item.emoji}</Text>
        </View>
        <View style={styles.symptomCopy}>
          <Text style={[styles.symptomLabel, active && styles.symptomLabelActive]}>{item.label}</Text>
          <Text style={[styles.symptomHint, active && styles.symptomHintActive]}>
            {active ? 'Selected' : 'Tap to log'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function SymptomsScreen({ medications }: { medications: UserMedication[] }) {
  const [selected, setSelected] = useState<Set<SymptomKey>>(new Set());
  const [checkInState, setCheckInState] = useState<'good' | 'notGood' | null>(null);
  const [otherSymptom, setOtherSymptom] = useState('');
  const [history, setHistory] = useState<SymptomLog[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [hasRequestedInsights, setHasRequestedInsights] = useState(false);
  const pageAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;
  const otherReveal = useRef(new Animated.Value(0)).current;
  const insightReveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getSymptomLogs().then(setHistory).catch(() => {});
  }, []);

  const lastCheckIn = history[0] ? formatLogDate(history[0].loggedAt) : null;
  const feelingGood = checkInState === 'good';
  const showingSymptoms = checkInState === 'notGood';

  function toggle(key: SymptomKey) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCheckInState('notGood');
    setHasRequestedInsights(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const otherSelected = selected.has('other');
  const otherFilled = otherSymptom.trim().length > 0;
  const canSubmit = feelingGood || (showingSymptoms && selected.size > 0 && (!otherSelected || otherFilled));
  const loggedCount = selected.size;
  const selectedEntries = SYMPTOMS.filter((item) => selected.has(item.key));
  const selectedLabels = selectedEntries.map((item) => item.label);
  const showInsights = hasRequestedInsights && !feelingGood && selected.size > 0;
  const primarySummary = feelingGood
    ? 'You are logging a steady day.'
    : showingSymptoms && selected.size > 0
      ? `${selected.size} symptom${selected.size === 1 ? '' : 's'} selected`
      : showingSymptoms
        ? 'Choose what feels different today'
        : 'Start with a quick check-in';

  const possibleSideEffects = useMemo(() => {
    if (feelingGood || selected.size === 0) return [];
    const results: { pill: string; symptom: string }[] = [];
    for (const med of medications) {
      const signals = med.analysis?.sideEffectSignals ?? [];
      for (const symptomKey of Array.from(selected) as SymptomKey[]) {
        if (symptomKey === 'other') continue;
        const domains = SYMPTOM_TO_DOMAINS[symptomKey];
        const matchedSignal = signals.find((sig) =>
          domains.some((domain) => sig.domain.toLowerCase().includes(domain))
        );
        if (matchedSignal) {
          results.push({
            pill: med.displayName.split(' ')[0],
            symptom: SYMPTOMS.find((item) => item.key === symptomKey)?.label.toLowerCase() ?? symptomKey,
          });
        }
      }
    }
    return results;
  }, [feelingGood, medications, selected]);

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    if (!feelingGood && !hasRequestedInsights) {
      setHasRequestedInsights(true);
      return;
    }
    setSubmitting(true);
    try {
      const log = await createSymptomLog({
        symptoms: Array.from(selected),
        otherText: otherSelected ? otherSymptom.trim() || null : null,
        feelingGood,
      });
      setHistory((prev) => [log, ...prev]);
      setSelected(new Set());
      setCheckInState(null);
      setOtherSymptom('');
      setHasRequestedInsights(false);
    } catch {
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
      toValue: showInsights ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [insightReveal, showInsights]);

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
      <View style={styles.ambientTop} />
      <View style={styles.ambientMid} />

      <Animated.View style={[styles.header, revealStyle(24)]}>
        <View style={styles.eyebrowRow}>
          <View style={styles.dayPill}>
            <Clock size={13} strokeWidth={2.2} color={colors.metaStrong} />
            <Text style={styles.dayPillText}>{lastCheckIn ? `Last check-in · ${lastCheckIn}` : 'No check-ins yet'}</Text>
          </View>
          <View style={styles.syncPill}>
            <Sparkles size={13} strokeWidth={2.2} color={colors.accent} />
            <Text style={styles.syncPillText}>Daily check-in</Text>
          </View>
        </View>
        <Text style={styles.title}>How are you feeling right now?</Text>
        <Text style={styles.subtitle}>
          Start with symptoms first. After your input is complete, review possible medication-related causes before saving the check-in.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.heroCard, revealStyle(30, 70)]}>
        <LinearGradient
          colors={['#FFFFFF', '#F6F9FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroLabel}>Quick summary</Text>
              <Text style={styles.heroTitle}>{primarySummary}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeValue}>{feelingGood ? 'Good' : showingSymptoms ? selected.size : '...'}</Text>
              <Text style={styles.heroBadgeLabel}>{feelingGood ? 'state' : showingSymptoms ? 'picked' : 'step'}</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{medications.length}</Text>
              <Text style={styles.heroStatLabel}>Active meds</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{history.length}</Text>
              <Text style={styles.heroStatLabel}>Recent logs</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{showInsights ? possibleSideEffects.length : '—'}</Text>
              <Text style={styles.heroStatLabel}>{showInsights ? 'Potential links' : 'Review after input'}</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View
        style={[
          styles.modeCard,
          revealStyle(38, 110),
        ]}
      >
        <View style={styles.modeSwitcher}>
          <Pressable
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setCheckInState('good');
              setHasRequestedInsights(false);
              setSelected(new Set());
              setOtherSymptom('');
            }}
            style={[styles.modeOption, styles.modeOptionGood, feelingGood && styles.modeOptionGoodActive]}
          >
            <View style={[styles.modeIcon, feelingGood && styles.modeIconActive]}>
              {feelingGood ? (
                <Check size={18} strokeWidth={2.7} color={colors.white} />
              ) : (
                <Check size={18} strokeWidth={2.4} color="#1C6B3A" />
              )}
            </View>
            <View style={styles.modeCopy}>
              <Text style={[styles.modeTitle, feelingGood && styles.modeTitleActive]}>I’m okay</Text>
              <Text style={[styles.modeMeta, feelingGood && styles.modeMetaActive]}>
                Log a healthy day right away.
              </Text>
            </View>
            <ChevronRight size={18} strokeWidth={2.3} color={feelingGood ? colors.white : colors.metaStrong} />
          </Pressable>

          <Pressable
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setCheckInState('notGood');
              setHasRequestedInsights(false);
            }}
            style={[styles.modeOption, styles.modeOptionAlert, showingSymptoms && styles.modeOptionAlertActive]}
          >
            <View style={[styles.modeIcon, showingSymptoms && styles.modeIconAlertActive]}>
              <Activity size={18} strokeWidth={2.4} color={showingSymptoms ? colors.white : '#8A3A14'} />
            </View>
            <View style={styles.modeCopy}>
              <Text style={[styles.modeTitle, showingSymptoms && styles.modeTitleActive]}>I’m not okay</Text>
              <Text style={[styles.modeMeta, showingSymptoms && styles.modeMetaActive]}>
                Show the symptom options.
              </Text>
            </View>
            <ChevronRight size={18} strokeWidth={2.3} color={showingSymptoms ? colors.white : colors.metaStrong} />
          </Pressable>
        </View>
      </Animated.View>

      {showingSymptoms ? (
        <>
          <Animated.View style={[styles.sectionBlock, revealStyle(24, 140)]}>
            <View style={styles.sectionHeadingRow}>
              <View>
                <Text style={styles.sectionEyebrow}>Symptoms</Text>
                <Text style={styles.sectionTitle}>What feels off?</Text>
              </View>
              <View style={styles.selectionBadge}>
                <Text style={styles.selectionBadgeText}>
                  {selected.size === 0 ? 'None selected' : `${selected.size} selected`}
                </Text>
              </View>
            </View>
            <Text style={styles.sectionBody}>
              Pick all that apply. The cleaner the input, the easier it is to review what may be causing the change.
            </Text>
          </Animated.View>

          <View style={styles.symptomGrid}>
            {SYMPTOMS.map((item, index) => (
              <SymptomCard
                key={item.key}
                item={item}
                active={selected.has(item.key)}
                onPress={() => toggle(item.key)}
                delay={170 + index * 40}
              />
            ))}
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
              <Text style={styles.otherLabel}>Describe the symptom</Text>
              <TextInput
                value={otherSymptom}
                onChangeText={(value) => {
                  setHasRequestedInsights(false);
                  setOtherSymptom(value);
                }}
                placeholder="Type your symptom"
                placeholderTextColor="rgba(0,0,0,0.35)"
                style={styles.otherInput}
              />
            </Animated.View>
          ) : null}
        </>
      ) : null}

      {!showInsights && showingSymptoms ? (
        <Animated.View
          style={[
            styles.intakeCard,
            revealStyle(18, 200),
          ]}
        >
          <Text style={styles.intakeLabel}>Step 1</Text>
          <Text style={styles.intakeTitle}>Tell us your symptoms first</Text>
          <Text style={styles.intakeBody}>
            Complete the input, then review possible medication-related causes before you save the log.
          </Text>
        </Animated.View>
      ) : null}

      {showInsights ? (
        <Animated.View
          style={[
            styles.insightsShell,
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
                    outputRange: [0.985, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sectionHeadingRow}>
            <View>
              <Text style={styles.sectionEyebrow}>Insights</Text>
              <Text style={styles.sectionTitle}>Possible medication links</Text>
            </View>
            <View style={styles.insightMetaPill}>
              <Text style={styles.insightMetaPillText}>
                {possibleSideEffects.length > 0 ? `${possibleSideEffects.length} found` : 'No direct match'}
              </Text>
            </View>
          </View>

          {possibleSideEffects.length > 0 ? (
            possibleSideEffects.map((item, index) => (
              <Animated.View
                key={`${item.pill}-${item.symptom}-${index}`}
                style={{
                  opacity: insightReveal,
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
                  <View style={styles.sideEffectIcon}>
                    <AlertTriangle size={18} strokeWidth={2.3} color="#8A3A14" />
                  </View>
                  <View style={styles.sideEffectCopy}>
                    <Text style={styles.sideEffectTitle}>{item.pill}</Text>
                    <Text style={styles.sideEffectBody}>
                      {`${item.symptom.charAt(0).toUpperCase()}${item.symptom.slice(1)} could be related to this medication.`}
                    </Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            ))
          ) : (
            <LinearGradient
              colors={['#FFFFFF', '#FFF7F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.noMatchCard}
            >
              <View style={styles.noMatchIcon}>
                <Check size={16} strokeWidth={2.6} color={colors.accent} />
              </View>
              <View style={styles.sideEffectCopy}>
                <Text style={styles.sideEffectTitle}>Nothing obvious yet</Text>
                <Text style={styles.noMatchBody}>
                  {`No direct medication match found for ${selectedLabels.join(', ').toLowerCase()}.`}
                </Text>
              </View>
            </LinearGradient>
          )}
        </Animated.View>
      ) : null}

      {selected.size > 0 && showingSymptoms ? (
        <Animated.View style={[styles.selectionPreview, revealStyle(18, 210)]}>
          <Text style={styles.selectionPreviewLabel}>Current selection</Text>
          <Text style={styles.selectionPreviewValue}>{selectedLabels.join(' · ')}</Text>
        </Animated.View>
      ) : null}

      <Animated.View
        style={[
          revealStyle(26, 240),
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
                  outputRange: [26, 0],
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
        <Pressable style={[styles.cta, (!canSubmit || submitting) && styles.ctaDisabled]} disabled={!canSubmit || submitting} onPress={handleSubmit}>
          <Text style={styles.ctaText}>
            {submitting
              ? 'Saving...'
              : feelingGood
                ? 'Save healthy check-in'
                : !hasRequestedInsights && loggedCount > 0
                  ? 'Review possible causes'
                  : loggedCount > 0
                    ? `Save ${loggedCount} symptom${loggedCount === 1 ? '' : 's'}`
                    : 'Choose how you feel to continue'}
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.View style={[styles.sectionBlock, revealStyle(22, 270)]}>
        <View style={styles.sectionHeadingRow}>
          <View>
            <Text style={styles.sectionEyebrow}>History</Text>
            <Text style={styles.sectionTitle}>Recent check-ins</Text>
          </View>
          <Text style={styles.historyCount}>{history.length} entries</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.historyList, revealStyle(30, 320)]}>
        {history.map((entry, index) => (
          <Animated.View
            key={entry.id}
            style={{
              opacity: pageAnim,
              transform: [
                {
                  translateY: pageAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20 + index * 8, 0],
                  }),
                },
              ],
            }}
          >
            <View style={styles.historyItem}>
              <View style={styles.historyTopRow}>
                <Text style={styles.historyWhen}>{formatLogDate(entry.loggedAt)}</Text>
                <View style={styles.historyDot} />
              </View>
              <Text style={styles.historyItems}>{formatLogItems(entry)}</Text>
            </View>
          </Animated.View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, backgroundColor: '#F8FAFD' },
  contentInner: { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 138, gap: 16 },
  ambientTop: {
    position: 'absolute',
    top: 38,
    right: -52,
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: 'rgba(0,107,255,0.08)',
  },
  ambientMid: {
    position: 'absolute',
    top: 248,
    left: -64,
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: 'rgba(38,184,30,0.06)',
  },
  header: { gap: 10 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
    flexShrink: 1,
  },
  dayPillText: {
    fontSize: 12,
    color: colors.metaStrong,
    fontFamily: fonts.medium,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,107,255,0.08)',
  },
  syncPillText: {
    fontSize: 12,
    color: colors.accent,
    fontFamily: fonts.semiBold,
    letterSpacing: -0.2,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1.15,
    color: '#0E1726',
    fontFamily: fonts.semiBold,
    maxWidth: '92%',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(14,23,38,0.66)',
    fontFamily: fonts.medium,
    letterSpacing: -0.25,
    maxWidth: '94%',
  },
  heroCard: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#95B7E7',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  heroGradient: {
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.88)',
    gap: 18,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  heroCopy: { flex: 1, gap: 5 },
  heroLabel: {
    fontSize: 12,
    color: colors.accent,
    fontFamily: fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 28,
    color: '#0E1726',
    fontFamily: fonts.semiBold,
    letterSpacing: -0.8,
  },
  heroBadge: {
    minWidth: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: '#0E1726',
    alignItems: 'center',
  },
  heroBadgeValue: {
    fontSize: 22,
    color: colors.white,
    fontFamily: fonts.semiBold,
    letterSpacing: -0.8,
  },
  heroBadgeLabel: {
    marginTop: 2,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.medium,
    letterSpacing: -0.15,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 3 },
  heroStatValue: {
    fontSize: 19,
    color: '#0E1726',
    fontFamily: fonts.semiBold,
    letterSpacing: -0.55,
  },
  heroStatLabel: {
    fontSize: 12,
    color: colors.meta,
    fontFamily: fonts.medium,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  heroDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(17,17,17,0.08)',
  },
  modeCard: {
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: 'rgba(28,107,58,0.2)',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  modeSwitcher: {
    gap: 12,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 26,
    borderWidth: 1,
  },
  modeOptionGood: {
    backgroundColor: '#E8F5EC',
    borderColor: 'rgba(28,107,58,0.08)',
  },
  modeOptionGoodActive: {
    backgroundColor: '#1C6B3A',
    borderColor: '#1C6B3A',
  },
  modeOptionAlert: {
    backgroundColor: '#FFF4ED',
    borderColor: 'rgba(138,58,20,0.08)',
  },
  modeOptionAlertActive: {
    backgroundColor: '#B65422',
    borderColor: '#B65422',
  },
  modeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  modeIconActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  modeIconAlertActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  modeCopy: { flex: 1, gap: 2 },
  modeTitle: {
    fontSize: 18,
    color: '#0E1726',
    fontFamily: fonts.semiBold,
    letterSpacing: -0.45,
  },
  modeTitleActive: {
    color: colors.white,
  },
  modeMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(14,23,38,0.68)',
    fontFamily: fonts.medium,
    letterSpacing: -0.2,
    maxWidth: '92%',
  },
  modeMetaActive: {
    color: 'rgba(255,255,255,0.76)',
  },
  sectionBlock: { gap: 8, marginTop: 4 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionEyebrow: {
    fontSize: 12,
    color: colors.accent,
    fontFamily: fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionTitle: {
    marginTop: 3,
    fontSize: 22,
    lineHeight: 26,
    color: '#0E1726',
    fontFamily: fonts.semiBold,
    letterSpacing: -0.7,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(14,23,38,0.66)',
    fontFamily: fonts.medium,
    letterSpacing: -0.2,
    maxWidth: '96%',
  },
  selectionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(14,23,38,0.06)',
  },
  selectionBadgeText: {
    fontSize: 12,
    color: colors.metaStrong,
    fontFamily: fonts.semiBold,
    letterSpacing: -0.2,
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  symptomCardWrap: {
    width: '48.5%',
  },
  symptomCard: {
    minHeight: 108,
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.04)',
  },
  symptomCardActive: {
    shadowColor: colors.accent,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  symptomIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  symptomIconActive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  symptomEmoji: { fontSize: 20 },
  symptomCopy: {
    marginTop: 14,
    gap: 4,
  },
  symptomLabel: {
    fontSize: 15,
    color: '#0E1726',
    fontFamily: fonts.semiBold,
    letterSpacing: -0.35,
  },
  symptomLabelActive: { color: colors.white },
  symptomHint: {
    fontSize: 12,
    color: 'rgba(14,23,38,0.58)',
    fontFamily: fonts.medium,
    letterSpacing: -0.2,
  },
  symptomHintActive: {
    color: 'rgba(255,255,255,0.76)',
  },
  otherInputWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.06)',
  },
  otherLabel: {
    fontSize: 14,
    color: colors.metaStrong,
    fontFamily: fonts.semiBold,
    letterSpacing: -0.2,
  },
  otherInput: {
    backgroundColor: '#F2F5F9',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.dark,
    fontFamily: fonts.medium,
    letterSpacing: -0.3,
  },
  intakeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.06)',
    gap: 6,
  },
  intakeLabel: {
    fontSize: 12,
    color: colors.accent,
    fontFamily: fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  intakeTitle: {
    fontSize: 18,
    lineHeight: 22,
    color: '#0E1726',
    fontFamily: fonts.semiBold,
    letterSpacing: -0.45,
  },
  intakeBody: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(14,23,38,0.66)',
    fontFamily: fonts.medium,
    letterSpacing: -0.2,
  },
  insightsShell: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.06)',
  },
  insightMetaPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(217,130,58,0.12)',
  },
  insightMetaPillText: {
    fontSize: 12,
    color: '#8A3A14',
    fontFamily: fonts.semiBold,
    letterSpacing: -0.2,
  },
  sideEffectCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 22,
  },
  sideEffectIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
  sideEffectCopy: { flex: 1 },
  sideEffectTitle: {
    fontSize: 15,
    color: '#271304',
    fontFamily: fonts.semiBold,
    letterSpacing: -0.35,
  },
  sideEffectBody: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#8A3A14',
    fontFamily: fonts.medium,
    letterSpacing: -0.2,
  },
  noMatchCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 22,
  },
  noMatchIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,107,255,0.1)',
  },
  noMatchBody: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: colors.metaStrong,
    fontFamily: fonts.medium,
    letterSpacing: -0.2,
  },
  selectionPreview: {
    backgroundColor: '#0E1726',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  selectionPreviewLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.62)',
    fontFamily: fonts.medium,
    letterSpacing: -0.15,
  },
  selectionPreviewValue: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 21,
    color: colors.white,
    fontFamily: fonts.semiBold,
    letterSpacing: -0.35,
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  ctaDisabled: {
    backgroundColor: '#B9C9DE',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    letterSpacing: -0.3,
  },
  historyCount: {
    fontSize: 12,
    color: colors.meta,
    fontFamily: fonts.semiBold,
    letterSpacing: -0.2,
  },
  historyList: { gap: 12 },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.06)',
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyWhen: {
    fontSize: 12,
    color: colors.meta,
    fontFamily: fonts.medium,
    letterSpacing: -0.2,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,107,255,0.2)',
  },
  historyItems: {
    marginTop: 8,
    fontSize: 16,
    color: '#0E1726',
    fontFamily: fonts.semiBold,
    letterSpacing: -0.35,
  },
});
