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

// ─── Static popular supplements (always shown immediately) ──────────────────

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

// Asset pool — cycle through by index
const IMAGES = [
  require('../assets/drops.png'),
  require('../assets/syrup.png'),
  require('../assets/cream.png'),
  require('../assets/syringe.png'),
  require('../assets/inhaler.png'),
];

// Skeleton shimmer

function SkeletonCard({ index }: { index: number }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  const widths = [160, 120, 140];
  const reasonWidths = ['90%', '75%', '85%'];

  return (
    <Animated.View style={[styles.supplementCard, { opacity }]}>
      <View style={styles.cardHeader}>
        <View style={styles.skeletonImage} />
        <View style={[styles.cardTitleWrap, { gap: 6 }]}>
          <View style={[styles.skeletonLine, { width: widths[index % 3] }]} />
          <View style={[styles.skeletonLine, { width: 80, height: 10 }]} />
        </View>
      </View>
      <View style={[styles.skeletonLine, { width: reasonWidths[index % 3] as any, height: 12 }]} />
      <View style={[styles.skeletonLine, { width: '60%', height: 12 }]} />
    </Animated.View>
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

function SupplementCard({ item, index, isStatic = false }: { item: SupplementRecommendation; index: number; isStatic?: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, bounciness: 6, useNativeDriver: true }),
      ]).start();
    }, index * 80);
  }, []);

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, bounciness: 8 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 8 }).start();

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.supplementCard, { opacity, transform: [{ scale }, { translateY }] }]}>
        <View style={styles.cardHeader}>
          <Image source={isStatic ? PILL_BOTTLE : IMAGES[index % IMAGES.length]} style={styles.cardImage} resizeMode="contain" />
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle}>{item.candidateName}</Text>
            <Text style={styles.cardLabel}>{item.label}</Text>
          </View>
        </View>
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
    </Pressable>
  );
}

// Main screen

type Props = {
  medications: UserMedication[];
};

export function AnalysisScreen({ medications: _medications }: Props) {
  const [dynamicSupplements, setDynamicSupplements] = useState<SupplementRecommendation[]>([]);
  const [dynamicLoading, setDynamicLoading] = useState(true);

  useEffect(() => {
    getUserSupplements()
      .then((results) => {
        // Exclude any that duplicate a popular supplement by name
        const popularNames = new Set(
          POPULAR_SUPPLEMENTS.map((s) => s.candidateName.toLowerCase().replace(/[^a-z0-9]/g, ''))
        );
        const unique = results.filter((r) => {
          const key = r.candidateName.toLowerCase().replace(/[^a-z0-9]/g, '');
          return !popularNames.has(key);
        });
        setDynamicSupplements(unique);
      })
      .catch(() => setDynamicSupplements([]))
      .finally(() => setDynamicLoading(false));
  }, []);

  // All cards: static first, dynamic below (offset index for animation)
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
            {/* Static popular supplements — shown immediately */}
            {POPULAR_SUPPLEMENTS.map((item, index) => (
              <SupplementCard key={item.candidateName} item={item} index={index} isStatic />
            ))}

            {/* Dynamic medication-specific supplements */}
            {dynamicLoading ? (
              [0, 1].map((i) => <SkeletonCard key={`sk-${i}`} index={i} />)
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
});
