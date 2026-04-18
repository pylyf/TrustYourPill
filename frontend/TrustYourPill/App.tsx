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

/** Wraps a screen so it fades + slides up each time it becomes visible */
function AnimatedScreen({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (visible) {
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
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.animatedScreen, { opacity, transform: [{ translateY }] }]}>
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

  const [tab, setTab] = useState<TabId>('home');
  const [overlay, setOverlay] = useState<null | 'checkup' | 'scan' | 'medOverview'>(null);
  const [scannedName, setScannedName] = useState<string | null>(null);
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
      // Fade out then unmount
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setOverlayMounted(false);
      });
    }
  }, [overlay]);

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
        <AnimatedScreen visible={tab === 'home'}>
          <HomeScreen
            onOpenCheckup={openCheckup}
            onOpenEmergency={() => setIsEmergencyDrawerVisible(true)}
            onOpenAppointments={() => setIsAppointmentsDrawerVisible(true)}
          />
        </AnimatedScreen>

        <AnimatedScreen visible={tab === 'symptoms'}>
          <SymptomsScreen />
        </AnimatedScreen>

        <AnimatedScreen visible={tab === 'library'}>
          <PillLibraryScreen onAdd={openScan} />
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
        onClose={closeOverlay}
        onAdd={closeOverlay}
      />
      <EmergencyDrawer visible={isEmergencyDrawerVisible} onClose={() => setIsEmergencyDrawerVisible(false)} />
      <AppointmentsDrawer visible={isAppointmentsDrawerVisible} onClose={() => setIsAppointmentsDrawerVisible(false)} />
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
});
