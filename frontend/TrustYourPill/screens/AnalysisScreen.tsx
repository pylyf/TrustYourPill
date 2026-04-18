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

function SupplementCard({ item, index }: { item: SupplementRecommendation; index: number }) {
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
          <Image source={IMAGES[index % IMAGES.length]} style={styles.cardImage} resizeMode="contain" />
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
  const [supplements, setSupplements] = useState<SupplementRecommendation[]>([]);
  const [supplementsLoading, setSupplementsLoading] = useState(true);

  useEffect(() => {
    getUserSupplements()
      .then(setSupplements)
      .catch(() => setSupplements([]))
      .finally(() => setSupplementsLoading(false));
  }, []);

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
          {supplementsLoading ? (
            <View style={styles.cardList}>
              {[0, 1, 2].map((i) => <SkeletonCard key={i} index={i} />)}
            </View>
          ) : supplements.length === 0 ? (
            <View style={styles.emptyState}>
              <Sparkles size={32} strokeWidth={1.5} color="rgba(0,0,0,0.2)" />
              <Text style={styles.emptyTitle}>No supplements suggested yet</Text>
              <Text style={styles.emptySubtitle}>
                Add medications to your library to get personalised supplement recommendations.
              </Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {supplements.map((item, index) => (
                <SupplementCard key={item.candidateName} item={item} index={index} />
              ))}
            </View>
          )}
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
    paddingTop: 64,
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
