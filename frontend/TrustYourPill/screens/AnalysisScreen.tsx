import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import {
  AlertCircle,
  ChevronRight,
  ExternalLink,
  FlaskConical,
  Pill,
  Shield,
  Sparkles,
  Upload,
} from 'lucide-react-native';
import { colors, fonts } from '../theme';
import type { UserMedication } from '../lib/api';

// ─── Static mock data ─────────────────────────────────────────────────────────

type SupplementSuggestion = {
  id: string;
  name: string;
  reason: string;
  urgency: 'high' | 'medium' | 'low';
  image: any;
};

type MedSideEffectTip = {
  id: string;
  medication: string;
  sideEffect: string;
  remedy: string;
  searchKey: string;
  image: any;
};

const BLOOD_TEST_SUPPLEMENTS: SupplementSuggestion[] = [
  {
    id: '1',
    name: 'Vitamin D3',
    reason: 'Your levels are at 18 ng/mL — below the optimal 30–50 ng/mL range.',
    urgency: 'high',
    image: require('../assets/drops.png'),
  },
  {
    id: '2',
    name: 'Magnesium Glycinate',
    reason: 'Low RBC magnesium detected. Helps with muscle recovery and sleep.',
    urgency: 'medium',
    image: require('../assets/syrup.png'),
  },
  {
    id: '3',
    name: 'Omega-3 (EPA/DHA)',
    reason: 'Elevated triglycerides at 210 mg/dL. Omega-3 can support reduction.',
    urgency: 'medium',
    image: require('../assets/cream.png'),
  },
  {
    id: '4',
    name: 'Iron Bisglycinate',
    reason: 'Ferritin at 11 ng/mL — borderline low. Gentle form for easy absorption.',
    urgency: 'low',
    image: require('../assets/syringe.png'),
  },
];

const MED_TIPS: MedSideEffectTip[] = [
  {
    id: 't1',
    medication: 'Ibuprofen',
    sideEffect: 'Stomach irritation',
    remedy: 'Take Omeprazole (20mg) 30 min before to protect stomach lining.',
    searchKey: 'Omeprazole',
    image: require('../assets/syrup.png'),
  },
  {
    id: 't2',
    medication: 'Aspirin',
    sideEffect: 'GI discomfort',
    remedy: 'Consider adding a probiotic like Lactobacillus to restore gut balance.',
    searchKey: 'Probiotic',
    image: require('../assets/drops.png'),
  },
  {
    id: 't3',
    medication: 'Metformin',
    sideEffect: 'B12 depletion',
    remedy: 'Supplement with Vitamin B12 (500–1000mcg/day) to prevent deficiency.',
    searchKey: 'Vitamin B12',
    image: require('../assets/inhaler.png'),
  },
];

const URGENCY_COLOR: Record<SupplementSuggestion['urgency'], string> = {
  high: '#EF4444',
  medium: '#F97316',
  low: '#22C55E',
};

type SupplementSource = {
  id: string;
  supplement: string;
  store: string;
  price: string;
  url: string;
};

const SUPPLEMENT_SOURCES: SupplementSource[] = [
  { id: 's1', supplement: 'Vitamin D3', store: 'iHerb', price: '$12.99', url: 'https://iherb.com' },
  { id: 's2', supplement: 'Vitamin D3', store: 'Amazon', price: '$9.49', url: 'https://amazon.com' },
  { id: 's3', supplement: 'Magnesium Glycinate', store: 'iHerb', price: '$18.50', url: 'https://iherb.com' },
  { id: 's4', supplement: 'Magnesium Glycinate', store: 'Vitacost', price: '$15.99', url: 'https://vitacost.com' },
  { id: 's5', supplement: 'Omega-3 (EPA/DHA)', store: 'Nordic Naturals', price: '$29.95', url: 'https://nordicnaturals.com' },
  { id: 's6', supplement: 'Omega-3 (EPA/DHA)', store: 'Amazon', price: '$22.00', url: 'https://amazon.com' },
  { id: 's7', supplement: 'Iron Bisglycinate', store: 'Thorne', price: '$24.00', url: 'https://thorne.com' },
  { id: 's8', supplement: 'Iron Bisglycinate', store: 'iHerb', price: '$16.75', url: 'https://iherb.com' },
  { id: 's9', supplement: 'Omeprazole', store: 'Walgreens', price: '$14.99', url: 'https://walgreens.com' },
  { id: 's10', supplement: 'Omeprazole', store: 'Amazon', price: '$11.50', url: 'https://amazon.com' },
  { id: 's11', supplement: 'Probiotic', store: 'iHerb', price: '$19.95', url: 'https://iherb.com' },
  { id: 's12', supplement: 'Probiotic', store: 'Thorne', price: '$32.00', url: 'https://thorne.com' },
  { id: 's13', supplement: 'Vitamin B12', store: 'iHerb', price: '$8.99', url: 'https://iherb.com' },
  { id: 's14', supplement: 'Vitamin B12', store: 'Amazon', price: '$7.49', url: 'https://amazon.com' },
];

const URGENCY_LABEL: Record<SupplementSuggestion['urgency'], string> = {
  high: 'High priority',
  medium: 'Recommended',
  low: 'Optional boost',
};

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.sectionLabel}>
      <Icon size={15} strokeWidth={2.4} color={colors.accent} />
      <Text style={styles.sectionLabelText}>{label}</Text>
    </View>
  );
}

function SupplementCard({ item, index }: { item: SupplementSuggestion; index: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, bounciness: 6, useNativeDriver: true })
    ]).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, bounciness: 8 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 8 }).start();

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.supplementCard, { opacity, transform: [{ scale }, { translateY }] }]}>
        <View style={styles.cardHeader}>
          <Image source={item.image} style={styles.cardImage} resizeMode="contain" />
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <View style={styles.urgencyBadge}>
              <View style={[styles.urgencyDot, { backgroundColor: URGENCY_COLOR[item.urgency] }]} />
              <Text style={[styles.urgencyText, { color: URGENCY_COLOR[item.urgency] }]}>
                {URGENCY_LABEL[item.urgency]}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.cardReason}>{item.reason}</Text>
        <PillSearchLoader supplementName={item.name} />
      </Animated.View>
    </Pressable>
  );
}

function MedTipCard({ item, index }: { item: MedSideEffectTip; index: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, bounciness: 6, useNativeDriver: true })
      ]).start();
    }, index * 100);
  }, []);

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, bounciness: 8 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 8 }).start();

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.tipCard, { opacity, transform: [{ scale }, { translateY }] }]}>
        <View style={styles.tipTopRow}>
          <Image source={item.image} style={styles.tipImage} resizeMode="contain" />
          <View style={styles.tipHeaderWrap}>
            <View style={styles.tipHeader}>
              <View style={styles.tipMedBadge}>
                <Pill size={12} strokeWidth={2.4} color={colors.accent} />
                <Text style={styles.tipMedName}>{item.medication}</Text>
              </View>
              <View style={styles.tipWarningBadge}>
                <AlertCircle size={12} strokeWidth={2.4} color="#F97316" />
                <Text style={styles.tipWarningText}>{item.sideEffect}</Text>
              </View>
            </View>
          </View>
        </View>
        <Text style={styles.tipRemedy}>{item.remedy}</Text>
        <PillSearchLoader supplementName={item.searchKey} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Per-pill web search loader ─────────────────────────────────────────────

const SEARCH_TEXTS = [
  'Searching supplement databases…',
  'Comparing prices across stores…',
  'Checking availability…',
  'Finding best-value options…',
];

function PillSearchLoader({ supplementName }: { supplementName: string }) {
  const [textIndex, setTextIndex] = useState(0);
  const [done, setDone] = useState(false);
  const textOpacity = useRef(new Animated.Value(1)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let idx = 0;
    const cycle = () => {
      Animated.timing(textOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        idx += 1;
        if (idx < SEARCH_TEXTS.length) {
          setTextIndex(idx);
          Animated.timing(textOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
          setTimeout(cycle, 1100);
        } else {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setDone(true);
          Animated.timing(resultOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
        }
      });
    };
    setTimeout(cycle, 1100);
  }, []);

  const sources = SUPPLEMENT_SOURCES.filter((s) => s.supplement === supplementName);

  if (done) {
    return (
      <Animated.View style={[styles.pillSearchDone, { opacity: resultOpacity }]}>
        {sources.map((src) => (
          <View key={src.id} style={styles.pillSourceRow}>
            <ExternalLink size={11} strokeWidth={2.4} color={colors.accent} />
            <Text style={styles.pillSourceTxt}>{src.store}</Text>
            <Text style={styles.pillSourcePrice}>{src.price}</Text>
          </View>
        ))}
      </Animated.View>
    );
  }

  return (
    <View style={styles.pillSearchLoading}>
      <ActivityIndicator size="small" color="rgba(0,0,0,0.3)" />
      <Animated.Text style={[styles.pillSearchTxt, { opacity: textOpacity }]}>
        {SEARCH_TEXTS[textIndex]}
      </Animated.Text>
    </View>
  );
}

// ─── Upload zone ──────────────────────────────────────────────────────────────

type UploadState = 'idle' | 'loading' | 'done';

function UploadZone({ onDone }: { onDone: () => void }) {
  const [state, setState] = useState<UploadState>('idle');
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (state !== 'idle') return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setState('loading');
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, bounciness: 4 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, bounciness: 4 }),
    ]).start();
    // Simulate AI analysis delay
    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setState('done');
      onDone();
    }, 2200);
  };

  return (
    <Pressable onPress={handlePress} disabled={state !== 'idle'}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={styles.uploadZone}>
          {state === 'idle' && (
            <>
              <View style={styles.uploadIconCircle}>
                <Upload size={26} strokeWidth={2} color={colors.dark} />
              </View>
              <Text style={styles.uploadTitle}>Upload Blood Test Results</Text>
              <Text style={styles.uploadSub}>
                PDF or photo — AI will analyze your values
              </Text>
              <View style={styles.uploadBtn}>
                <Text style={styles.uploadBtnText}>Choose file</Text>
                <ChevronRight size={15} strokeWidth={2.4} color={colors.dark} />
              </View>
            </>
          )}
          {state === 'loading' && (
            <>
              <ActivityIndicator size="large" color={colors.dark} style={{ marginBottom: 12 }} />
              <Text style={styles.uploadTitle}>Analysing your results…</Text>
              <Text style={styles.uploadSub}>Our AI is reading your blood panel</Text>
            </>
          )}
          {state === 'done' && (
            <>
              <View style={[styles.uploadIconCircle, { backgroundColor: '#F0FDF4' }]}>
                <Sparkles size={26} strokeWidth={2} color={colors.success} />
              </View>
              <Text style={[styles.uploadTitle, { color: colors.success }]}>Analysis complete!</Text>
              <Text style={styles.uploadSub}>Check the Suggestions tab</Text>
            </>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────

type Props = {
  medications: UserMedication[];
};

type TabType = 'suggestions' | 'blood_analysis';

export function AnalysisScreen({ medications }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('suggestions');
  const [analysed, setAnalysed] = useState(false);

  // Filter med tips to only show for meds the user actually has
  const userMedNames = medications.map((m) => m.displayName.toLowerCase());
  const relevantTips = MED_TIPS.filter((t) =>
    userMedNames.some((n) => n.includes(t.medication.toLowerCase()))
  );
  // If no real meds match, show all tips as examples
  const shownTips = relevantTips.length > 0 ? relevantTips : MED_TIPS;

  return (
    <View style={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analysis</Text>
        
        {/* Switcher */}
        <View style={styles.switcher}>
          <Pressable
            style={[styles.switchBtn, activeTab === 'suggestions' && styles.switchBtnActive]}
            onPress={() => setActiveTab('suggestions')}
          >
            <Text style={[styles.switchTxt, activeTab === 'suggestions' && styles.switchTxtActive]}>
              Suggestions
            </Text>
          </Pressable>
          <Pressable
            style={[styles.switchBtn, activeTab === 'blood_analysis' && styles.switchBtnActive]}
            onPress={() => setActiveTab('blood_analysis')}
          >
            <Text style={[styles.switchTxt, activeTab === 'blood_analysis' && styles.switchTxtActive]}>
              Blood Analysis
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'blood_analysis' ? (
          <View style={styles.section}>
            <UploadZone onDone={() => setAnalysed(true)} />
          </View>
        ) : (
          <View style={styles.section}>
            <SectionLabel icon={Shield} label="Based on your medications" />
            <Text style={styles.previewHint}>
              {relevantTips.length > 0
                ? 'Known side effects from your current medications:'
                : 'Common side effects from typical medications — add pills via Library to personalise:'}
            </Text>
            <View style={styles.cardList}>
              {shownTips.map((item, index) => (
                <MedTipCard key={item.id} item={item} index={index} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: { flex: 1, backgroundColor: '#FAFAFA' },
  scroll: { flex: 1 },
  scrollInner: { paddingBottom: 130, gap: 28 },

  header: {
    paddingHorizontal: 28,
    paddingTop: 64, // push down for notch
    paddingBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: -1.23,
    color: '#111',
    fontFamily: fonts.semiBold,
    marginBottom: 20,
  },
  
  switcher: {
    flexDirection: 'row',
    backgroundColor: '#EFEFEF',
    borderRadius: 9999,
    padding: 4,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9999,
  },
  switchBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  switchTxt: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#666',
    letterSpacing: -0.3,
  },
  switchTxtActive: {
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
  previewHint: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: -0.2,
    lineHeight: 18,
    marginTop: -4,
  },
  cardList: { gap: 12 },

  // Upload zone (White, minimalistic)
  uploadZone: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: '#111',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  uploadSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: -0.2,
    textAlign: 'center',
    lineHeight: 18,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  uploadBtnText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: '#111',
    letterSpacing: -0.3,
  },

  // Supplement card (White minimalist)
  supplementCard: {
    borderRadius: 24,
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
    gap: 4,
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: '#111',
    letterSpacing: -0.4,
  },
  cardReason: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#555',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  urgencyText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    letterSpacing: -0.2,
  },

  // Med tip card (White minimalist)
  tipCard: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  tipTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tipImage: {
    width: 48,
    height: 48,
  },
  tipHeaderWrap: {
    flex: 1,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  tipMedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  tipMedName: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: '#111',
    letterSpacing: -0.2,
  },
  tipWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED', // Orange 50
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  tipWarningText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: '#D97706',
    letterSpacing: -0.2,
  },
  tipRemedy: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: '#555',
    letterSpacing: -0.2,
    lineHeight: 22,
  },

  // Per-pill search loader
  pillSearchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  pillSearchTxt: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: 'rgba(0,0,0,0.4)',
    letterSpacing: -0.2,
  },
  pillSearchDone: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  pillSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F8FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  pillSourceTxt: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.accent,
    letterSpacing: -0.2,
  },
  pillSourcePrice: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: '#111',
    letterSpacing: -0.2,
  },
});
