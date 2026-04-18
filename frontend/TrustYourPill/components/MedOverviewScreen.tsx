import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldAlert, ShieldCheck, Shield, ChevronDown, CheckCircle, Plus, Info, Activity, X } from 'lucide-react-native';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
} from '@expo-google-fonts/geist';

const geistRegular = 'Geist_400Regular';
const geistMedium = 'Geist_500Medium';
const geistSemiBold = 'Geist_600SemiBold';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = {
  visible: boolean;
  medicationName: string | null;
  currentMedications: string[];
  onClose: () => void;
  onAdd: () => void;
};

// Types from API spec
type CheckResponse = {
  summary: {
    status: 'avoid_until_reviewed' | 'review_before_use' | 'insufficient_evidence' | 'safe';
    headline: string;
    explanation: string;
  };
  aiSummary: {
    headline: string;
    plainLanguageSummary: string;
    whatTriggeredThis: string;
    questionsForClinician: string[];
  };
  sideEffectSignals?: Array<{
    domain: string;
    severity: string;
    explanation: string;
  }>;
  supportiveCareIdeas?: Array<{
    type: string;
    label: string;
    rationale: string;
    candidateName: string;
  }>;
};

export function MedOverviewScreen({ visible, medicationName, currentMedications, onClose, onAdd }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [data, setData] = useState<CheckResponse | null>(null);

  // Animations
  const contentOp = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(60)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const dotsLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (visible && medicationName) {
      setStatus('loading');
      setData(null);
      startProgress();
      startDots();
      performCheck(medicationName);
    } else {
      stopDots();
      contentOp.setValue(0);
      contentY.setValue(60);
      progressAnim.setValue(0);
    }
  }, [visible, medicationName]);

  const startProgress = () => {
    progressAnim.setValue(0);
    // Crawl to 85% over 12s — will snap to 100% when data arrives
    Animated.timing(progressAnim, {
      toValue: 0.85,
      duration: 12000,
      useNativeDriver: false,
    }).start();
  };

  const finishProgress = () => {
    progressAnim.stopAnimation(() => {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
    });
  };

  const startDots = () => {
    dot1.setValue(0);
    dot2.setValue(0);
    dot3.setValue(0);
    const makeBounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -8, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    dotsLoopRef.current = Animated.parallel([
      makeBounce(dot1, 0),
      makeBounce(dot2, 140),
      makeBounce(dot3, 280),
    ]);
    dotsLoopRef.current.start();
  };

  const stopDots = () => {
    dotsLoopRef.current?.stop();
  };

  const performCheck = async (name: string) => {
    try {
      // Use the user's real medication library as current medications
      const body = {
        candidateMedication: name,
        currentMedications,
      };

      const response = await fetch('http://127.0.0.1:3001/api/medications/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const responseData = await response.json();

      if (response.ok) {
        // Fallback default safe status if backend doesn't explicitly throw danger
        if (!responseData.summary?.status) {
           responseData.summary = { ...responseData.summary, status: 'safe' };
        }
        finishProgress();
        stopDots();
        await new Promise(resolve => setTimeout(resolve, 420));
        setData(responseData);
        setStatus('success');
        Animated.parallel([
          Animated.timing(contentOp, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(contentY, { toValue: 0, damping: 20, stiffness: 100, useNativeDriver: true })
        ]).start();
      } else {
        throw new Error('Failed to verify check.');
      }
    } catch (e) {
       console.log("Check API failed", e);
       stopDots();
       setStatus('error');
    }
  };

  const getStatusConfig = (apiStatus?: string) => {
    switch (apiStatus) {
      case 'avoid_until_reviewed':
        return { color: '#FF3A3A', grad: ['#FFEBEB', '#FFD1D1'], icon: ShieldAlert };
      case 'review_before_use':
      case 'insufficient_evidence':
        return { color: '#FFB800', grad: ['#FFF8E6', '#FFECC2'], icon: ShieldAlert };
      default:
        return { color: '#26B81E', grad: ['#E6F8E5', '#C2ECC0'], icon: ShieldCheck };
    }
  };

  if (!visible) return null;

  const conf = getStatusConfig(data?.summary?.status);
  const ShieldIcon = conf.icon;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={90} tint="light" style={styles.absoluteFill}>
        
        {/* Loading State */}
        {status === 'loading' && (
          <View style={styles.centerContainer}>
            <View style={styles.pulseInnerCircle}>
              <Activity size={32} color="#006BFF" />
            </View>
            <Text style={styles.loadingTitle}>Analyzing Routine...</Text>
            <Text style={styles.loadingSub}>Checking "{medicationName}" against your current medications.</Text>
            <View style={styles.dotsRow}>
              <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
              <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
              <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
            </View>
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBarFill, {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }]} />
              </View>
            </View>
          </View>
        )}

        {/* Success State */}
        {status === 'success' && data && (
          <Animated.View style={[styles.container, { opacity: contentOp, transform: [{ translateY: contentY }] }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
              
              <LinearGradient colors={conf.grad as [string, string]} style={styles.heroCard}>
                <View style={styles.shieldWrap}>
                  <ShieldIcon size={28} color={conf.color} strokeWidth={2.5} />
                </View>
                <Text style={styles.headline}>{data.aiSummary?.headline || data.summary?.headline || 'Safety Check Complete'}</Text>
                <Text style={styles.subhead}>{data.aiSummary?.plainLanguageSummary || data.summary?.explanation}</Text>
              </LinearGradient>

              {data.sideEffectSignals && data.sideEffectSignals.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Potential Side Effects</Text>
                  {data.sideEffectSignals.map((sig, idx) => (
                    <View key={idx} style={styles.infoCard}>
                      <View style={[styles.infoDot, { backgroundColor: sig.severity === 'high' ? '#FF3A3A' : '#FFB800' }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoCardTitle}>{sig.domain.replace('_', ' ').toUpperCase()}</Text>
                        <Text style={styles.infoCardText}>{sig.explanation}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {data.supportiveCareIdeas && data.supportiveCareIdeas.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Supportive Care Ideas</Text>
                  {data.supportiveCareIdeas.map((idea, idx) => (
                    <View key={idx} style={styles.infoCard}>
                       <View style={styles.iconBox}>
                         <Info size={18} color="#006BFF" />
                       </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoCardTitle}>{idea.label}</Text>
                        <Text style={styles.infoCardText}>{idea.rationale}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

            </ScrollView>

            <View style={styles.footer}>
              <Pressable style={styles.circularBtn} onPress={onClose}>
                <X size={28} color="#000" />
              </Pressable>
              
              <Pressable style={styles.primaryBtn} onPress={onAdd}>
                <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.primaryBtnText}>Add to Library</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  absoluteFill: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  progressBarWrapper: {
    width: '100%',
    marginTop: 32,
    paddingHorizontal: 20,
  },
  progressBarBg: {
    height: 8,
    width: '100%',
    backgroundColor: 'rgba(0, 107, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#006BFF',
    borderRadius: 4,
  },
  pulseInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 107, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(0, 107, 255, 0.3)',
  },
  loadingTitle: {
    fontSize: 22,
    fontFamily: geistSemiBold,
    color: '#000',
    marginBottom: 8,
    letterSpacing: -0.6,
  },
  loadingSub: {
    fontSize: 15,
    fontFamily: geistRegular,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  container: {
    flex: 1,
    paddingTop: 60,
  },
  scrollInner: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  shieldWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  headline: {
    fontSize: 22,
    fontFamily: geistSemiBold,
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.6,
    lineHeight: 26,
  },
  subhead: {
    fontSize: 15,
    fontFamily: geistMedium,
    color: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: geistSemiBold,
    color: '#000',
    marginBottom: 14,
    letterSpacing: -0.4,
    paddingHorizontal: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#006BFF',
  },
  infoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 107, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardTitle: {
    fontSize: 14,
    fontFamily: geistSemiBold,
    color: '#000',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  infoCardText: {
    fontSize: 14,
    fontFamily: geistRegular,
    color: 'rgba(0,0,0,0.6)',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 12,
  },
  circularBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    flex: 1.5,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#006BFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#006BFF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: geistSemiBold,
    color: '#FFF',
  },
});
