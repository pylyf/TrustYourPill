import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ChevronLeft,
  MoreHorizontal,
  Leaf,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Droplets,
  Clock,
  Activity,
  ShieldCheck,
} from 'lucide-react-native';
import { colors, fonts, type GradientKey } from '../theme';
import type { UserMedication } from '../lib/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type SideEffectSignal = {
  domain: string;
  severity: 'low' | 'moderate' | 'high' | string;
  explanation: string;
};

type SupportiveCareIdea = {
  type:
    | 'food'
    | 'hydration'
    | 'timing_discussion'
    | 'monitoring'
    | 'supplement'
    | 'avoidance'
    | 'general_support'
    | string;
  label: string;
  rationale: string;
  candidateName: string | null;
  requiresReview?: boolean;
  shouldCheckInteractions?: boolean;
};

type MedDetails = {
  summary: {
    status: string;
    headline: string;
    explanation: string;
  };
  aiSummary: {
    headline: string;
    plainLanguageSummary: string;
    whatTriggeredThis: string;
    questionsForClinician: string[];
    confidenceNote?: string;
  };
  sideEffectSignals?: SideEffectSignal[];
  supportiveCareIdeas?: SupportiveCareIdea[];
};

type Props = {
  visible: boolean;
  medication: UserMedication | null;
  gradientKey: GradientKey;
  onClose: () => void;
};

// Contextual Unsplash imagery keyed by medication class / common ingredient.
// We match against the medication display name (lowercased) and fall back to a
// neutral "pharmacy / pills" shot so we never end up with raspberries on ibuprofen.
const MED_IMAGE_BY_KEYWORD: Array<{ match: RegExp; url: string }> = [
  // NSAIDs / pain
  {
    match: /ibuprofen|advil|motrin|naproxen|aleve|diclofenac|aspirin/,
    url: 'https://images.unsplash.com/photo-1550572017-edd951b55104?q=80&w=1200&auto=format&fit=crop',
  },
  // Acetaminophen / paracetamol
  {
    match: /acetaminophen|paracetamol|tylenol|panadol/,
    url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=1200&auto=format&fit=crop',
  },
  // Antibiotics
  {
    match: /amoxicillin|penicillin|azithromycin|zithromax|ciprofloxacin|cipro|doxycycline|clindamycin|cephalexin|metronidazole|flagyl|augmentin|antibiotic/,
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=1200&auto=format&fit=crop',
  },
  // Statins / cholesterol
  {
    match: /atorvastatin|lipitor|simvastatin|rosuvastatin|crestor|pravastatin|statin/,
    url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=1200&auto=format&fit=crop',
  },
  // Blood pressure / cardiac
  {
    match: /lisinopril|losartan|amlodipine|metoprolol|atenolol|valsartan|ramipril|hydrochlorothiazide|hctz|propranolol/,
    url: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?q=80&w=1200&auto=format&fit=crop',
  },
  // Diabetes
  {
    match: /metformin|glucophage|insulin|glipizide|glyburide|ozempic|semaglutide|jardiance|empagliflozin/,
    url: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?q=80&w=1200&auto=format&fit=crop',
  },
  // Antidepressants / mental health
  {
    match: /sertraline|zoloft|fluoxetine|prozac|escitalopram|lexapro|citalopram|celexa|paroxetine|paxil|venlafaxine|duloxetine|cymbalta|bupropion|wellbutrin|mirtazapine/,
    url: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?q=80&w=1200&auto=format&fit=crop',
  },
  // Benzodiazepines / sleep
  {
    match: /alprazolam|xanax|lorazepam|ativan|clonazepam|klonopin|diazepam|valium|zolpidem|ambien|melatonin/,
    url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=1200&auto=format&fit=crop',
  },
  // Stomach / GI
  {
    match: /omeprazole|prilosec|pantoprazole|protonix|esomeprazole|nexium|ranitidine|famotidine|pepcid|antacid/,
    url: 'https://images.unsplash.com/photo-1550572017-9b9f5a0c8cfe?q=80&w=1200&auto=format&fit=crop',
  },
  // Allergy / antihistamine
  {
    match: /loratadine|claritin|cetirizine|zyrtec|fexofenadine|allegra|diphenhydramine|benadryl|allergy/,
    url: 'https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=1200&auto=format&fit=crop',
  },
  // Birth control / hormones
  {
    match: /ethinyl|estradiol|levonorgestrel|norethindrone|contracept|birth control|hormone/,
    url: 'https://images.unsplash.com/photo-1584308074086-3baee3f83b1b?q=80&w=1200&auto=format&fit=crop',
  },
  // Thyroid
  {
    match: /levothyroxine|synthroid|liothyronine|thyroid/,
    url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=1200&auto=format&fit=crop',
  },
  // Asthma / inhaler
  {
    match: /albuterol|ventolin|salbutamol|fluticasone|flovent|symbicort|advair|budesonide|inhaler/,
    url: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=1200&auto=format&fit=crop',
  },
  // Vitamins / supplements
  {
    match: /vitamin|multivitamin|probiotic|magnesium|calcium|omega|fish oil|biotin|zinc|iron/,
    url: 'https://images.unsplash.com/photo-1584308074086-3baee3f83b1b?q=80&w=1200&auto=format&fit=crop',
  },
];

// Generic pharmacy / pills fallback — neutral, not food.
const FALLBACK_MED_IMAGE =
  'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=1200&auto=format&fit=crop';

function resolveMedImage(name?: string | null): string {
  if (!name) return FALLBACK_MED_IMAGE;
  const n = name.toLowerCase();
  for (const entry of MED_IMAGE_BY_KEYWORD) {
    if (entry.match.test(n)) return entry.url;
  }
  return FALLBACK_MED_IMAGE;
}

export function MedicationDetailModal({ visible, medication, gradientKey, onClose }: Props) {
  const [details, setDetails] = useState<MedDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const sheetY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const close = () => {
    Animated.timing(sheetY, { toValue: SCREEN_HEIGHT, duration: 400, useNativeDriver: true }).start(
      () => onClose(),
    );
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dy }) => dy > 10,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) sheetY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 120 || vy > 0.8) {
          close();
        } else {
          Animated.spring(sheetY, {
            toValue: 0,
            damping: 22,
            stiffness: 180,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (visible && medication) {
      sheetY.setValue(SCREEN_HEIGHT);
      Animated.spring(sheetY, { toValue: 0, damping: 22, stiffness: 180, useNativeDriver: true }).start();
      fetchDetails(medication);
    } else {
      setDetails(null);
      setLoading(false);
    }
  }, [visible, medication]);

  const fetchDetails = async (med: UserMedication) => {
    // Prefer DB-saved analysis (populated during scan/upload)
    if (med.analysis) {
      setDetails(med.analysis as MedDetails);
      setLoading(false);
      return;
    }
    // Fallback: call AI API
    setLoading(true);
    setDetails(null);
    try {
      const res = await fetch('http://127.0.0.1:3001/api/medications/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateMedication: med.displayName, currentMedications: [] }),
      });
      if (res.ok) setDetails(await res.json());
    } catch {
      // silently fail — empty state shown
    } finally {
      setLoading(false);
    }
  };

  const { supplements, otherCare } = useMemo(() => {
    const ideas = details?.supportiveCareIdeas ?? [];
    return {
      supplements: ideas.filter((i) => i.type === 'supplement'),
      otherCare: ideas.filter((i) => i.type !== 'supplement'),
    };
  }, [details]);

  const description = useMemo(() => {
    if (!details) return '';
    return (details.aiSummary?.plainLanguageSummary || details.summary?.explanation || '').trim();
  }, [details]);

  const heroImage = useMemo(
    () => resolveMedImage(medication?.displayName || medication?.normalizedName),
    [medication?.displayName, medication?.normalizedName],
  );

  if (!visible || !medication) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={close}>
      <Animated.View
        style={[styles.container, { transform: [{ translateY: sheetY }] }]}
        {...panResponder.panHandlers}
      >
        <ImageBackground source={{ uri: heroImage }} style={styles.imageBackground} blurRadius={2}>
          <View style={styles.imageOverlay} />

          <View style={styles.safeArea}>
            <View style={styles.navBar}>
              <Pressable onPress={close} style={styles.navButton} hitSlop={15}>
                <ChevronLeft color="#fff" strokeWidth={2.5} size={22} />
              </Pressable>
              <Text style={styles.navTitle}>Medication</Text>
              <Pressable style={styles.navButton} hitSlop={15}>
                <MoreHorizontal color="#fff" strokeWidth={2.5} size={22} />
              </Pressable>
            </View>

            <View style={styles.headerContent}>
              {(medication.scheduleTimes?.length > 0 || medication.dosageText) && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {medication.scheduleTimes?.length > 0
                      ? `${medication.scheduleTimes.length} dose${medication.scheduleTimes.length > 1 ? 's' : ''} per day`
                      : medication.dosageText}
                  </Text>
                </View>
              )}

              <View style={styles.titleRow}>
                <Text style={styles.mainTitle} numberOfLines={2}>
                  {medication.displayName}
                </Text>
                {medication.dosageText ? (
                  <Text style={styles.mainValue} numberOfLines={1}>{medication.dosageText}</Text>
                ) : null}
              </View>

              <View style={styles.subtitleRow}>
                <Text style={styles.subtitleLeft}>Medication details</Text>
                <Text style={styles.subtitleRight}>
                  {medication.scheduleTimes?.length > 0
                    ? formatScheduleTimes(medication.scheduleTimes)
                    : 'Daily'}
                </Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.cardContainer}>
          <ScrollView
            contentContainerStyle={styles.whiteCardContent}
            showsVerticalScrollIndicator={false}
            bounces
          >
            <View style={styles.grabber} />

            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{medication.displayName}</Text>
              <Text style={styles.cardValue}>Added {formatDate(medication.createdAt)}</Text>
            </View>

            {/* Headline + description */}
            {!loading && details?.aiSummary?.headline ? (
              <Text style={styles.sectionHeadline}>{details.aiSummary.headline}</Text>
            ) : null}

            <Text style={styles.cardDesc}>
              {loading
                ? 'Loading medication details…'
                : description || 'No descriptive details available for this medication.'}
            </Text>

            {!loading && details?.aiSummary?.confidenceNote ? (
              <View style={styles.noteRow}>
                <ShieldCheck size={14} color={colors.metaStrong} strokeWidth={2} />
                <Text style={styles.noteText}>{details.aiSummary.confidenceNote}</Text>
              </View>
            ) : null}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={[styles.statFill, { height: '30%' }]} />
                <Text style={styles.statLabel}>Safety</Text>
                <Text style={styles.statNumber}>{formatStatus(details?.summary?.status)}</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statFill, { height: '65%', backgroundColor: '#FCDADA' }]} />
                <Text style={styles.statLabel}>Side FX</Text>
                <Text style={styles.statNumber}>{details?.sideEffectSignals?.length ?? 0} noted</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statFill, { height: '45%', backgroundColor: '#D9EFDC' }]} />
                <Text style={styles.statLabel}>Support</Text>
                <Text style={styles.statNumber}>
                  {details?.supportiveCareIdeas?.length ?? 0} ideas
                </Text>
              </View>
            </View>

            {/* Supplement suggestions — the star of the show */}
            {supplements.length > 0 && (
              <Section
                title="Suggested supplements"
                subtitle="Paired to counter potential side effects"
                icon={<Leaf size={16} color="#2E7D4F" strokeWidth={2.2} />}
                accent="#E8F5EC"
              >
                {supplements.map((s, i) => (
                  <SupplementCard key={`sup-${i}`} idea={s} />
                ))}
              </Section>
            )}

            {/* Side effects to watch */}
            {(details?.sideEffectSignals?.length ?? 0) > 0 && (
              <Section
                title="Side effects to watch"
                subtitle="Signals surfaced from the label"
                icon={<AlertTriangle size={16} color="#B8622C" strokeWidth={2.2} />}
                accent="#FDEFE0"
              >
                {details!.sideEffectSignals!.map((sig, i) => (
                  <SideEffectRow key={`se-${i}`} signal={sig} />
                ))}
              </Section>
            )}

            {/* Other supportive care */}
            {otherCare.length > 0 && (
              <Section
                title="Supportive care"
                subtitle="Small things that help you tolerate it"
                icon={<Sparkles size={16} color="#4A5BD4" strokeWidth={2.2} />}
                accent="#E6EAFB"
              >
                {otherCare.map((idea, i) => (
                  <CareRow key={`c-${i}`} idea={idea} />
                ))}
              </Section>
            )}

            {/* Questions for clinician */}
            {(details?.aiSummary?.questionsForClinician?.length ?? 0) > 0 && (
              <Section
                title="Ask your clinician"
                subtitle="Bring these to your next visit"
                icon={<HelpCircle size={16} color="#555" strokeWidth={2.2} />}
                accent="#F1F2F5"
              >
                {details!.aiSummary.questionsForClinician.map((q, i) => (
                  <View key={`q-${i}`} style={styles.questionRow}>
                    <Text style={styles.questionBullet}>{i + 1}</Text>
                    <Text style={styles.questionText}>{q}</Text>
                  </View>
                ))}
              </Section>
            )}

            <Text style={styles.disclaimer}>
              Informational only — not medical advice. Always confirm with a pharmacist or clinician
              before starting or stopping anything.
            </Text>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ---------- Subcomponents ----------

function Section({
  title,
  subtitle,
  icon,
  accent,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionIcon, { backgroundColor: accent }]}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

function SupplementCard({ idea }: { idea: SupportiveCareIdea }) {
  return (
    <View style={styles.supplementCard}>
      <View style={styles.supplementHead}>
        <View style={styles.supplementDot} />
        <Text style={styles.supplementName}>{idea.candidateName || idea.label}</Text>
        {idea.requiresReview ? (
          <View style={styles.reviewChip}>
            <Text style={styles.reviewChipText}>Check first</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.supplementRationale}>{idea.rationale}</Text>
      {idea.candidateName && idea.label && idea.candidateName !== idea.label ? (
        <Text style={styles.supplementSub}>{idea.label}</Text>
      ) : null}
    </View>
  );
}

function SideEffectRow({ signal }: { signal: SideEffectSignal }) {
  const sev = (signal.severity || '').toLowerCase();
  const color =
    sev === 'high' ? '#C0392B' : sev === 'moderate' ? '#B8622C' : '#6B7280';
  const bg = sev === 'high' ? '#FDE4E1' : sev === 'moderate' ? '#FDEFE0' : '#EEF0F3';
  return (
    <View style={styles.sideEffectRow}>
      <View style={styles.sideEffectHead}>
        <Text style={styles.sideEffectDomain}>{formatDomain(signal.domain)}</Text>
        <View style={[styles.sevChip, { backgroundColor: bg }]}>
          <Text style={[styles.sevChipText, { color }]}>{sev || 'note'}</Text>
        </View>
      </View>
      <Text style={styles.sideEffectText}>{signal.explanation}</Text>
    </View>
  );
}

function CareRow({ idea }: { idea: SupportiveCareIdea }) {
  const Icon = iconForCare(idea.type);
  return (
    <View style={styles.careRow}>
      <View style={styles.careIcon}>
        <Icon size={14} color={colors.metaStrong} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.careLabel}>{idea.label}</Text>
        <Text style={styles.careRationale}>{idea.rationale}</Text>
      </View>
    </View>
  );
}

function iconForCare(type: SupportiveCareIdea['type']) {
  switch (type) {
    case 'hydration':
      return Droplets;
    case 'timing_discussion':
      return Clock;
    case 'monitoring':
      return Activity;
    case 'avoidance':
      return AlertTriangle;
    case 'food':
      return Leaf;
    default:
      return Sparkles;
  }
}

function formatDomain(domain: string) {
  return domain
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatStatus(status?: string) {
  if (!status) return '—';
  switch (status) {
    case 'avoid_until_reviewed':
      return 'Review';
    case 'review_before_use':
      return 'Caution';
    case 'insufficient_evidence':
      return 'Likely OK';
    default:
      return 'High';
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatScheduleTimes(times: string[]): string {
  if (times.length === 0) return 'Daily';
  if (times.length === 1) return times[0];
  if (times.length === 2) return `${times[0]} & ${times[1]}`;
  return `${times[0]}, ${times[1]} +${times.length - 2}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageBackground: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.65,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  safeArea: {
    paddingHorizontal: 24,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 50,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: '#fff',
    letterSpacing: -0.3,
  },
  headerContent: {
    marginTop: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: '#de4e55',
    fontFamily: fonts.medium,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 34,
    fontFamily: fonts.semiBold,
    color: '#fff',
    flex: 1,
    marginRight: 16,
    letterSpacing: -0.8,
  },
  mainValue: {
    fontSize: 26,
    fontFamily: fonts.semiBold,
    color: '#fff',
    letterSpacing: -0.6,
  },
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subtitleLeft: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.medium,
    letterSpacing: -0.2,
  },
  subtitleRight: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.medium,
    letterSpacing: -0.2,
  },
  cardContainer: {
    flex: 1,
    marginTop: SCREEN_HEIGHT * 0.45,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
  },
  whiteCardContent: {
    padding: 24,
    paddingTop: 14,
  },
  grabber: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    marginBottom: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.dark,
    letterSpacing: -0.5,
    flex: 1,
    marginRight: 8,
  },
  cardValue: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.meta,
  },
  sectionHeadline: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.dark,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.metaStrong,
    lineHeight: 22,
    marginBottom: 14,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F6F8FB',
    borderRadius: 12,
    padding: 10,
    marginBottom: 22,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.metaStrong,
    fontFamily: fonts.regular,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    height: 125,
    backgroundColor: '#f6f8fb',
    borderRadius: 22,
    overflow: 'hidden',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#dbeafc',
  },
  statLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.metaStrong,
    zIndex: 1,
  },
  statNumber: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.dark,
    zIndex: 1,
  },

  section: {
    marginTop: 28,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.dark,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.meta,
    marginTop: 1,
  },

  supplementCard: {
    backgroundColor: '#F3FAF5',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCEFE2',
  },
  supplementHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  supplementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D4F',
  },
  supplementName: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: '#1F4F32',
    letterSpacing: -0.3,
  },
  supplementSub: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#4E6B57',
  },
  supplementRationale: {
    fontSize: 13,
    lineHeight: 19,
    color: '#2B4A37',
    fontFamily: fonts.regular,
  },
  reviewChip: {
    backgroundColor: '#FFF3DC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  reviewChipText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#8A5A10',
    letterSpacing: -0.1,
  },

  sideEffectRow: {
    backgroundColor: '#FAFAFB',
    borderRadius: 16,
    padding: 14,
  },
  sideEffectHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sideEffectDomain: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.dark,
    letterSpacing: -0.3,
  },
  sevChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sevChipText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    textTransform: 'capitalize',
    letterSpacing: 0.1,
  },
  sideEffectText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.metaStrong,
    fontFamily: fonts.regular,
  },

  careRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FAFAFB',
    borderRadius: 16,
    padding: 14,
  },
  careIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#EEF0F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  careLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.dark,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  careRationale: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.metaStrong,
    fontFamily: fonts.regular,
  },

  questionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: '#FAFAFB',
    borderRadius: 14,
    padding: 12,
  },
  questionBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EEF0F3',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.metaStrong,
    overflow: 'hidden',
  },
  questionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.metaStrong,
    fontFamily: fonts.regular,
  },

  disclaimer: {
    marginTop: 28,
    fontSize: 11,
    lineHeight: 16,
    color: colors.meta,
    fontFamily: fonts.regular,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
