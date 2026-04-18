import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, SafeAreaView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
} from '@expo-google-fonts/geist';
import { BottomNav, type NavAction, type TabId } from './components/BottomNav';
import { ScanScreen } from './components/ScanScreen';
import { MedOverviewScreen } from './components/MedOverviewScreen';
import { EmergencyDrawer } from './components/EmergencyDrawer';
import { AppointmentsDrawer } from './components/AppointmentsDrawer';
import { HomeScreen } from './screens/HomeScreen';
import { PillLibraryScreen } from './screens/PillLibraryScreen';
import { SymptomsScreen } from './screens/SymptomsScreen';
import { CheckupScreen } from './screens/CheckupScreen';
import { AnalysisScreen } from './screens/AnalysisScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import {
  getUserMedications,
  addUserMedication,
  deleteUserMedication,
  searchMedication,
  getTodayDoseLogs,
  toggleDoseLog,
  type UserMedication,
  type MedicationCandidate,
  type MedicationAnalysis,
} from './lib/api';

/** Wraps a screen so it fades + slides up each time it becomes visible */
function AnimatedScreen({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      opacity.setValue(0);
      translateY.setValue(18);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 22,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setMounted(false);
      });
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={[styles.animatedScreen, { opacity, transform: [{ translateY }] }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {children}
    </Animated.View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
  });

  const [showOnboarding, setShowOnboarding] = useState(true);
  const onboardingOpacity = useRef(new Animated.Value(1)).current;
  const [tab, setTab] = useState<TabId>('home');
  const [overlay, setOverlay] = useState<null | 'checkup' | 'scan' | 'medOverview'>(null);
  const [scannedName, setScannedName] = useState<string | null>(null);
  const [scannedCandidate, setScannedCandidate] = useState<MedicationCandidate | null>(null);
  const [scannedDosage, setScannedDosage] = useState<string | null>(null);
  const [userMedications, setUserMedications] = useState<UserMedication[]>([]);
  const [takenIds, setTakenIds] = useState<Set<string>>(new Set());
  const [isEmergencyDrawerVisible, setIsEmergencyDrawerVisible] = useState(false);
  const [isAppointmentsDrawerVisible, setIsAppointmentsDrawerVisible] = useState(false);

  // Animated values for the checkup overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayTranslateY = useRef(new Animated.Value(30)).current;
  const [overlayMounted, setOverlayMounted] = useState(false);

  useEffect(() => {
    if (overlay === 'checkup') {
      setOverlayMounted(true);
      overlayOpacity.setValue(0);
      overlayTranslateY.setValue(30);
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(overlayTranslateY, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setOverlayMounted(false);
      });
    }
  }, [overlay]);

  const loadMedications = useCallback(async () => {
    try {
      const meds = await getUserMedications();
      setUserMedications(meds);
    } catch {
      // silently ignore on load failure
    }
  }, []);

  const loadTakenIds = useCallback(async () => {
    try {
      const ids = await getTodayDoseLogs();
      setTakenIds(new Set(ids));
    } catch {
      // silently ignore
    }
  }, []);

  const handleToggleTaken = useCallback(async (id: string) => {
    // Optimistic update
    setTakenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      const ids = await toggleDoseLog(id);
      setTakenIds(new Set(ids));
    } catch {
      // revert optimistic update on failure
      setTakenIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    loadMedications();
    loadTakenIds();
  }, [loadMedications, loadTakenIds]);

  const onAction = useCallback((action: NavAction) => {
    if (action === 'scan') {
      setOverlay('scan');
      return;
    }
    setTab(action);
  }, []);

  const openCheckup = useCallback(() => setOverlay('checkup'), []);
  const closeOverlay = useCallback(() => setOverlay(null), []);
  const openScan = useCallback(() => setOverlay('scan'), []);

  const handleScanConfirm = useCallback(async (name: string, dosageText?: string | null) => {
    setScannedName(name);
    setScannedDosage(dosageText ?? null);
    setScannedCandidate(null);
    setOverlay('medOverview');
    try {
      const result = await searchMedication(name);
      if (result.candidates.length > 0) {
        setScannedCandidate(result.candidates[0]);
      }
    } catch {
      // candidate stays null — add will be skipped gracefully
    }
  }, []);

  const handleAddMedication = useCallback(async (scheduleTimes: string[], analysis: MedicationAnalysis | null) => {
    if (!scannedName) return;
    try {
      const candidate = scannedCandidate;
      if (candidate) {
        await addUserMedication({
          inputName: scannedName,
          displayName: candidate.displayName,
          normalizedName: candidate.normalizedName,
          rxcui: candidate.rxcui,
          rxaui: candidate.rxaui,
          source: candidate.source,
          searchScore: candidate.confidenceScore,
          dosageText: scannedDosage ?? undefined,
          scheduleTimes,
          analysis,
        });
      } else {
        await addUserMedication({
          inputName: scannedName,
          displayName: scannedName,
          normalizedName: scannedName.toLowerCase(),
          rxcui: scannedName.toLowerCase().replace(/\s+/g, '-'),
          source: 'scan',
          dosageText: scannedDosage ?? undefined,
          scheduleTimes,
          analysis,
        });
      }
      await loadMedications();
    } catch {
      // silently fail for hackathon
    }
    setOverlay(null);
  }, [scannedName, scannedCandidate, scannedDosage, loadMedications]);

  const handleDeleteMedication = useCallback(async (medId: string) => {
    try {
      await deleteUserMedication(medId);
      await loadMedications();
    } catch {
      // silently fail
    }
  }, [loadMedications]);

  if (!fontsLoaded) return null;

  const currentMedicationNames = userMedications.map((m) => m.normalizedName);

  const handleFinishOnboarding = () => {
    Animated.timing(onboardingOpacity, {
      toValue: 0,
      duration: 320,
      useNativeDriver: true,
    }).start(() => setShowOnboarding(false));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <AnimatedScreen visible={tab === 'home'}>
          <HomeScreen
            medications={userMedications}
            takenIds={takenIds}
            onToggleTaken={handleToggleTaken}
            onOpenCheckup={openCheckup}
            onOpenEmergency={() => setIsEmergencyDrawerVisible(true)}
            onOpenAppointments={() => setIsAppointmentsDrawerVisible(true)}
          />
        </AnimatedScreen>

        <AnimatedScreen visible={tab === 'symptoms'}>
          <SymptomsScreen medications={userMedications} />
        </AnimatedScreen>

        <AnimatedScreen visible={tab === 'library'}>
          <PillLibraryScreen
            medications={userMedications}
            takenIds={takenIds}
            onToggleTaken={handleToggleTaken}
            onAdd={openScan}
            onDelete={handleDeleteMedication}
          />
        </AnimatedScreen>

        <AnimatedScreen visible={tab === 'analysis'}>
          <AnalysisScreen medications={userMedications} />
        </AnimatedScreen>

        {overlayMounted && (
          <Animated.View
            style={[
              styles.overlay,
              { opacity: overlayOpacity, transform: [{ translateY: overlayTranslateY }] },
            ]}
          >
            <CheckupScreen onClose={closeOverlay} />
          </Animated.View>
        )}

        <BottomNav activeTab={tab} onAction={onAction} />
      </View>

      <ScanScreen
        visible={overlay === 'scan'}
        onClose={closeOverlay}
        onConfirm={handleScanConfirm}
      />
      <MedOverviewScreen
        visible={overlay === 'medOverview'}
        medicationName={scannedName}
        currentMedications={currentMedicationNames}
        onClose={closeOverlay}
        onAdd={handleAddMedication}
      />
      <EmergencyDrawer visible={isEmergencyDrawerVisible} onClose={() => setIsEmergencyDrawerVisible(false)} />
      <AppointmentsDrawer visible={isAppointmentsDrawerVisible} onClose={() => setIsAppointmentsDrawerVisible(false)} />

      {showOnboarding && (
        <Animated.View style={[styles.onboardingLayer, { opacity: onboardingOpacity }]}>
          <OnboardingScreen onComplete={handleFinishOnboarding} />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  animatedScreen: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  onboardingLayer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
  },
});
