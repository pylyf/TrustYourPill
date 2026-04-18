import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
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
import {
  getUserMedications,
  addUserMedication,
  deleteUserMedication,
  searchMedication,
  type UserMedication,
  type MedicationCandidate,
} from './lib/api';

export default function App() {
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
  });

  const [tab, setTab] = useState<TabId>('home');
  const [overlay, setOverlay] = useState<null | 'checkup' | 'scan' | 'medOverview'>(null);
  const [scannedName, setScannedName] = useState<string | null>(null);
  const [scannedCandidate, setScannedCandidate] = useState<MedicationCandidate | null>(null);
  const [userMedications, setUserMedications] = useState<UserMedication[]>([]);
  const [isEmergencyDrawerVisible, setIsEmergencyDrawerVisible] = useState(false);
  const [isAppointmentsDrawerVisible, setIsAppointmentsDrawerVisible] = useState(false);

  const loadMedications = useCallback(async () => {
    try {
      const meds = await getUserMedications();
      setUserMedications(meds);
    } catch {
      // silently ignore on load failure
    }
  }, []);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

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

  const handleScanConfirm = useCallback(async (name: string) => {
    setScannedName(name);
    setScannedCandidate(null);
    setOverlay('medOverview');
    // Search in background to resolve rxcui for saving
    try {
      const result = await searchMedication(name);
      if (result.candidates.length > 0) {
        setScannedCandidate(result.candidates[0]);
      }
    } catch {
      // candidate stays null — add will be skipped gracefully
    }
  }, []);

  const handleAddMedication = useCallback(async () => {
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
        });
      } else {
        // Fallback: save with name only (rxcui = name slug, unique enough for demo)
        await addUserMedication({
          inputName: scannedName,
          displayName: scannedName,
          normalizedName: scannedName.toLowerCase(),
          rxcui: scannedName.toLowerCase().replace(/\s+/g, '-'),
          source: 'scan',
        });
      }
      await loadMedications();
    } catch {
      // silently fail for hackathon
    }
    setOverlay(null);
  }, [scannedName, scannedCandidate, loadMedications]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        {tab === 'home'     && <HomeScreen onOpenCheckup={openCheckup} onOpenEmergency={() => setIsEmergencyDrawerVisible(true)} onOpenAppointments={() => setIsAppointmentsDrawerVisible(true)} />}
        {tab === 'symptoms' && <SymptomsScreen />}
        {tab === 'library'  && (
          <PillLibraryScreen
            medications={userMedications}
            onAdd={openScan}
            onDelete={handleDeleteMedication}
          />
        )}

        {overlay === 'checkup' ? (
          <View style={styles.overlay}>
            <CheckupScreen onClose={closeOverlay} />
          </View>
        ) : null}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
});
