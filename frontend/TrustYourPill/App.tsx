import { useCallback, useState } from 'react';
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
import { HomeScreen } from './screens/HomeScreen';
import { PillLibraryScreen } from './screens/PillLibraryScreen';
import { SymptomsScreen } from './screens/SymptomsScreen';
import { CheckupScreen } from './screens/CheckupScreen';

export default function App() {
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
  });

  const [tab, setTab] = useState<TabId>('home');
  const [overlay, setOverlay] = useState<null | 'checkup' | 'scan' | 'medOverview'>(null);
  const [scannedName, setScannedName] = useState<string | null>(null);

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
  
  const handleScanConfirm = useCallback((name: string) => {
    setScannedName(name);
    setOverlay('medOverview');
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        {tab === 'home'     && <HomeScreen onOpenCheckup={openCheckup} />}
        {tab === 'symptoms' && <SymptomsScreen />}
        {tab === 'library'  && <PillLibraryScreen onAdd={openScan} />}

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
        onClose={closeOverlay}
        onAdd={closeOverlay}
      />
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
