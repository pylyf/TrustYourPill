import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ExternalLink, Sparkles } from 'lucide-react-native';
import { colors, fonts } from '../theme';
import { getUserSupplements, type SupplementRecommendation, type UserMedication } from '../lib/api';

const PILL_BOTTLE = require('../assets/pill1.png');

// ─── Loading messages ────────────────────────────────────────────────────────

const LOADING_STEPS = [
  'Reviewing your medications…',
  'Finding supplements…',
  'Looking up stores…',
  'Almost there…',
];

const POPULAR_SUPPLEMENTS: SupplementRecommendation[] = [
  {
    candidateName: 'Probiotic (Lactobacillus acidophilus)',
    label: 'Gut health & immunity',
    rationale: 'Antibiotics and NSAIDs can disrupt gut flora. A daily probiotic helps restore balance, supports digestion, and strengthens the immune barrier.',
    sources: [
      { store: 'iHerb', price: '$14.99', url: 'https://iherb.com' },
      { store: 'Amazon', price: '$12.49', url: 'https://amazon.com' },
      { store: 'Vitacost', price: '$11.99', url: 'https://vitacost.com' },
    ],
  },
  {
    candidateName: 'Vitamin D3 (2000 IU)',
    label: 'Bone, mood & immune support',
    rationale: 'Most adults are deficient, especially indoors. Vitamin D3 supports immune function, mood regulation, and calcium absorption for bone health.',
    sources: [
      { store: 'iHerb', price: '$8.99', url: 'https://iherb.com' },
      { store: 'Thorne', price: '$16.00', url: 'https://thorne.com' },
      { store: 'Amazon', price: '$7.49', url: 'https://amazon.com' },
    ],
  },
  {
    candidateName: 'Magnesium Glycinate (400 mg)',
    label: 'Sleep, stress & muscle recovery',
    rationale: 'Magnesium is depleted by stress and medication use. Glycinate form is gentle on the stomach and improves sleep quality and muscle relaxation.',
    sources: [
      { store: 'iHerb', price: '$18.50', url: 'https://iherb.com' },
      { store: 'Vitacost', price: '$15.99', url: 'https://vitacost.com' },
      { store: 'Amazon', price: '$14.99', url: 'https://amazon.com' },
    ],
  },
  {
    candidateName: 'Omega-3 (EPA/DHA)',
    label: 'Heart, brain & inflammation',
    rationale: 'Omega-3 fatty acids reduce systemic inflammation, support cardiovascular health, and improve brain function. Particularly helpful alongside long-term medication use.',
    sources: [
      { store: 'Nordic Naturals', price: '$29.95', url: 'https://nordicnaturals.com' },
      { store: 'iHerb', price: '$22.00', url: 'https://iherb.com' },
      { store: 'Amazon', price: '$19.99', url: 'https://amazon.com' },
    ],
  },
];

// ─── Static popular supplements (always shown immediately) ──────────────────
let _supplementsCache: SupplementRecommendation[] | null = null;

// Asset pool — cycle through by index
const IMAGES = [
  require('../assets/drops.png'),
  require('../assets/syrup.png'),
  require('../assets/cream.png'),
  require('../assets/syringe.png'),
  require('../assets/inhaler.png'),
];

// ─── Loading overlay ─────────────────────────────────────────────────────────

function LoadingOverlay() {
  const [stepIndex, setStepIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setStepIndex((i) => Math.min(i + 1, LOADING_STEPS.length - 1));
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const dot1Op = dotAnim.interpolate({ inputRange: [0, 0.33, 1], outputRange: [0.3, 1, 0.3] });
  const dot2Op = dotAnim.interpolate({ inputRange: [0, 0.5,  1], outputRange: [0.3, 1, 0.3] });
  const dot3Op = dotAnim.interpolate({ inputRange: [0, 0.66, 1], outputRange: [0.3, 1, 0.3] });

  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingTextRow}>
        <Animated.Text style={[styles.loadingMessage, { opacity: fadeAnim }]}>
          {LOADING_STEPS[stepIndex]}
        </Animated.Text>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { opacity: dot1Op }]} />
          <Animated.View style={[styles.dot, { opacity: dot2Op }]} />
          <Animated.View style={[styles.dot, { opacity: dot3Op }]} />
        </View>
      </View>
    </View>
  );
}

// Sub-components

function SectionLabel({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.sectionLabel}>
      <Icon size={15} strokeWidth={2.4} color={colors.accent} />
      <Text style={styles.sectionLabelText}>{label}</Text>
    </View>
  );
}

const CARD_STEPS = [
  'Finding supplement…',
  'Searching store prices…',
];

function formatBasedOnText(basedOn?: string[]) {
  if (!basedOn || basedOn.length === 0) {
    return null;
  }

  return `Recommended based on: ${basedOn.map((name) => `${name} usage`).join(', ')}`;
}

function SupplementCard({ item, index, isStatic = false }: { item: SupplementRecommendation; index: number; isStatic?: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  // Per-card loading state
  const [cardLoading, setCardLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Each card starts loading at a staggered time
  const LOAD_DURATION = 1600; // ms per card loading animation

  useEffect(() => {
    const startDelay = index * 350;

    // Slide card in
    const slideTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, bounciness: 6, useNativeDriver: true }),
      ]).start();
    }, startDelay);

    // Dot pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    // Cycle through card steps
    const stepTimer = setTimeout(() => {
      const stepInterval = setInterval(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
          setStepIndex((i) => Math.min(i + 1, CARD_STEPS.length - 1));
          Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
        });
      }, LOAD_DURATION / CARD_STEPS.length);

      // Reveal content after loading
      const revealTimer = setTimeout(() => {
        clearInterval(stepInterval);
        setCardLoading(false);
        Animated.timing(contentOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      }, LOAD_DURATION);

      return () => {
        clearInterval(stepInterval);
        clearTimeout(revealTimer);
      };
    }, startDelay);

    return () => {
      clearTimeout(slideTimer);
      clearTimeout(stepTimer);
    };
  }, []);

  const dot1Op = dotAnim.interpolate({ inputRange: [0, 0.33, 1], outputRange: [0.3, 1, 0.3] });
  const dot2Op = dotAnim.interpolate({ inputRange: [0, 0.5,  1], outputRange: [0.3, 1, 0.3] });
  const dot3Op = dotAnim.interpolate({ inputRange: [0, 0.66, 1], outputRange: [0.3, 1, 0.3] });

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, bounciness: 8 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 8 }).start();
  const basedOnText = formatBasedOnText(item.basedOn);

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.supplementCard, { opacity: cardOpacity, transform: [{ scale }, { translateY }] }]}>
        <View style={styles.cardHeader}>
          {!cardLoading && (
            <Image source={isStatic ? PILL_BOTTLE : IMAGES[index % IMAGES.length]} style={styles.cardImage} resizeMode="contain" />
          )}
          <View style={styles.cardTitleWrap}>
            {cardLoading ? (
              <View style={styles.cardLoadingRow}>
                <Animated.Text style={[styles.cardLoadingText, { opacity: fadeAnim }]}>
                  {CARD_STEPS[stepIndex]}
                </Animated.Text>
                <View style={styles.dotsRow}>
                  <Animated.View style={[styles.dot, { opacity: dot1Op }]} />
                  <Animated.View style={[styles.dot, { opacity: dot2Op }]} />
                  <Animated.View style={[styles.dot, { opacity: dot3Op }]} />
                </View>
              </View>
            ) : (
              <Animated.View style={{ opacity: contentOpacity }}>
                <Text style={styles.cardTitle}>{item.candidateName}</Text>
                <Text style={styles.cardLabel}>{item.label}</Text>
                {basedOnText ? <Text style={styles.cardBasedOn}>{basedOnText}</Text> : null}
              </Animated.View>
            )}
          </View>
        </View>
        {!cardLoading && (
          <Animated.View style={{ opacity: contentOpacity, gap: 12 }}>
            <Text style={styles.cardReason}>{item.rationale}</Text>
            {item.sources.length > 0 && (
              <View style={styles.pillSearchDone}>
                {item.sources.map((src, i) => (
                  <View key={i} style={styles.pillSourceRow}>
                    <ExternalLink size={11} strokeWidth={2.4} color={colors.accent} />
                    <Text style={styles.pillSourceTxt}>{src.store}</Text>
                    <Text style={styles.pillSourcePrice}>{src.price}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// Main screen

type Props = {
  medications: UserMedication[];
};

export function AnalysisScreen({ medications: _medications }: Props) {
  const [dynamicSupplements, setDynamicSupplements] = useState<SupplementRecommendation[]>(
    _supplementsCache ?? []
  );
  const [dynamicLoading, setDynamicLoading] = useState(_supplementsCache === null);
  const medicationBasedOn = _medications.map((medication) => medication.displayName);
  const staticSupplements = POPULAR_SUPPLEMENTS.map((item) => ({
    ...item,
    basedOn: medicationBasedOn
  }));

  useEffect(() => {
    if (_supplementsCache !== null) return;
    getUserSupplements()
      .then((results) => {
        const popularNames = new Set(
          POPULAR_SUPPLEMENTS.map((s) => s.candidateName.toLowerCase().replace(/[^a-z0-9]/g, ''))
        );
        const unique = results.filter((r) => {
          const key = r.candidateName.toLowerCase().replace(/[^a-z0-9]/g, '');
          return !popularNames.has(key);
        });
        _supplementsCache = unique;
        setDynamicSupplements(unique);
      })
      .catch(() => {})
      .finally(() => setDynamicLoading(false));
  }, []);

  const staticOffset = POPULAR_SUPPLEMENTS.length;

  return (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Analysis</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <SectionLabel icon={Sparkles} label="Recommended supplements" />
          <View style={styles.cardList}>
            {/* Static popular supplements */}
            {staticSupplements.map((item, index) => (
              <SupplementCard key={item.candidateName} item={item} index={index} isStatic />
            ))}
            {/* Dynamic: loading indicator or real cards */}
            {dynamicLoading ? (
              <LoadingOverlay />
            ) : (
              dynamicSupplements.map((item, index) => (
                <SupplementCard
                  key={item.candidateName}
                  item={item}
                  index={staticOffset + index}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Styles

const styles = StyleSheet.create({
  content: { flex: 1, backgroundColor: '#FAFAFA' },
  scroll: { flex: 1 },
  scrollInner: { paddingBottom: 130, gap: 28 },

  header: {
    paddingHorizontal: 28,
    paddingBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: -1.23,
    color: '#111',
    fontFamily: fonts.semiBold,
  },

  section: {
    paddingHorizontal: 28,
    gap: 12,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabelText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.accent,
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  cardList: { gap: 12 },

  supplementCard: {
    borderRadius: 22,
    padding: 20,
    gap: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardImage: {
    width: 48,
    height: 48,
  },
  cardTitleWrap: {
    flex: 1,
    gap: 2,
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: '#111',
    letterSpacing: -0.4,
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: 'rgba(0,0,0,0.45)',
    letterSpacing: -0.2,
  },
  cardBasedOn: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.accent,
    letterSpacing: -0.2,
  },
  cardReason: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: 'rgba(0,0,0,0.6)',
    letterSpacing: -0.2,
    lineHeight: 20,
  },

  pillSearchDone: {
    gap: 6,
    paddingTop: 4,
  },
  pillSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillSourceTxt: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#111',
    letterSpacing: -0.2,
  },
  pillSourcePrice: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: '#006BFF',
    letterSpacing: -0.2,
  },

  skeletonImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8E8E8',
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E8E8E8',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 28,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: '#111',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: 'rgba(0,0,0,0.45)',
    letterSpacing: -0.2,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },

  cardLoadingRow: {
    gap: 6,
  },
  cardLoadingText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: -0.2,
  },

  loadingOverlay: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
  },
  loadingImage: {
    width: 90,
    height: 90,
    opacity: 0.7,
  },
  loadingTextRow: {
    alignItems: 'center',
    gap: 12,
  },
  loadingMessage: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: '#111',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
});
