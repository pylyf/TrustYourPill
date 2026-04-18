import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Easing
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, ScanLine, X, CheckCircle, RefreshCcw } from 'lucide-react-native';
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
  onClose: () => void;
};

type ScanResult = {
  name?: string;
  dosage?: string;
  type?: string;
  confidence?: number;
  message?: string;
};

export function ScanScreen({ visible, onClose }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);

  // Animations
  const contentOp = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(40)).current;
  const laserY = useRef(new Animated.Value(0)).current;
  const cardOp = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(100)).current;

  // Cleanup on open/close
  useEffect(() => {
    if (visible) {
      setImageUri(null);
      setStatus('idle');
      setResult(null);
      Animated.parallel([
        Animated.timing(contentOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(contentY, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true })
      ]).start();
    } else {
      contentOp.setValue(0);
      contentY.setValue(40);
      cardOp.setValue(0);
      cardY.setValue(100);
      laserY.setValue(0);
    }
  }, [visible]);

  // Laser Animation when Scanning
  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    if (status === 'scanning') {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(laserY, {
            toValue: SCREEN_HEIGHT * 0.7,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(laserY, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      );
      animation.start();
    } else {
      laserY.setValue(0);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [status, laserY]);

  // Card Appearance Animation
  useEffect(() => {
    if (status === 'success' || status === 'error') {
      Animated.parallel([
        Animated.timing(cardOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(cardY, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true })
      ]).start();
    } else {
      cardOp.setValue(0);
      cardY.setValue(100);
    }
  }, [status, cardOp, cardY]);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return cameraStatus === 'granted' && libraryStatus === 'granted';
  };

  const handleProcessImage = async (uri: string) => {
    setImageUri(uri);
    setStatus('scanning');

    try {
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      const formData = new FormData();
      // Adjust according to fetch requirements for react-native
      formData.append('image', {
        uri: uri,
        name: filename,
        type,
      } as any);

      // Timeout for visual effect and backend wait
      const scanStart = Date.now();
      const delay = 3000; 

      const response = await fetch('http://127.0.0.1:3001/api/medications/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();

      // Enforce at least 3 seconds of scanning animation
      const elapsed = Date.now() - scanStart;
      if (elapsed < delay) {
        await new Promise(res => setTimeout(res, delay - elapsed));
      }

      if (response.ok) {
        setResult(data);
        setStatus('success');
      } else {
        throw new Error(data.error || 'Failed to scan medication.');
      }
    } catch (e: any) {
      console.warn("Scan failed:", e);
      // Fallback for visual demonstration or real error handling
      setResult({ message: e.message || "Could not identify medication. Please try again." });
      setStatus('error');
    }
  };

  const openCamera = async () => {
    if (!(await requestPermissions())) return;
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      handleProcessImage(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    if (!(await requestPermissions())) return;
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Corrected access here
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      handleProcessImage(result.assets[0].uri);
    }
  };

  const handleRetake = () => {
    setImageUri(null);
    setStatus('idle');
  };

  const handleConfirm = () => {
    // Add to your logic here...
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={80} tint="dark" style={styles.absoluteFill}>
        
        {/* Navigation & Close */}
        <View style={styles.header}>
          <Text style={styles.title}>Scan Pill</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* --- Image Display / Scanning Layout --- */}
        {(status === 'scanning' || status === 'success' || status === 'error') && imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.capturedImage} />
            
            {status === 'scanning' && (
              <View style={styles.scanningOverlay}>
                <Animated.View style={[styles.laser, { transform: [{ translateY: laserY }] }]}>
                  <LinearGradient
                    colors={['transparent', 'rgba(92, 69, 226, 0.8)', 'transparent']}
                    style={styles.laserGlow}
                  />
                  <View style={styles.laserLine} />
                </Animated.View>
                <View style={styles.scanTextContainer}>
                  <ActivityIndicator color="#5C45E2" style={{ marginRight: 8 }} />
                  <Text style={styles.scanningText}>Identifying Medication...</Text>
                </View>
              </View>
            )}

            {/* Success Layout */}
            {(status === 'success' || status === 'error') && (
              <Animated.View style={[
                styles.resultCard, 
                { opacity: cardOp, transform: [{ translateY: cardY }] }
              ]}>
                <BlurView intensity={70} tint="light" style={styles.resultInner}>
                  {status === 'success' ? (
                    <>
                      <View style={styles.resultHeader}>
                        <CheckCircle size={24} color="#26B81E" />
                        <Text style={styles.resultTitle}>Medication Found</Text>
                      </View>
                      <View style={styles.pillDetails}>
                        <Text style={styles.pillName}>{result?.name || 'Unknown Pill'}</Text>
                        <Text style={styles.pillDosage}>{result?.dosage ? `${result.dosage} - ${result.type}` : 'Dosage Unspecified'}</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.resultHeader}>
                        <X size={24} color="#FF3A3A" />
                        <Text style={styles.resultTitle}>Scan Failed</Text>
                      </View>
                      <View style={styles.pillDetails}>
                        <Text style={styles.pillDosage}>{result?.message}</Text>
                      </View>
                    </>
                  )}

                  <View style={styles.buttonRow}>
                    <Pressable style={[styles.actionBtn, styles.retakeBtn]} onPress={handleRetake}>
                      <RefreshCcw size={18} color="#111111" />
                      <Text style={styles.retakeLabel}>Retake</Text>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, styles.confirmBtn]} onPress={status === 'success' ? handleConfirm : onClose}>
                      <Text style={styles.confirmLabel}>{status === 'success' ? 'Confirm' : 'Close'}</Text>
                    </Pressable>
                  </View>
                </BlurView>
              </Animated.View>
            )}
          </View>
        ) : (
          /* --- Initial Options Layout --- */
          <Animated.View style={[
            styles.optionsContainer,
            { opacity: contentOp, transform: [{ translateY: contentY }] }
          ]}>
            <View style={styles.infoWrapper}>
              <View style={styles.iconCircle}>
                <ScanLine size={40} color="#006BFF" strokeWidth={1.5} />
              </View>
              <Text style={styles.subheadline}>Snap a photo to instantly identify pills and add them to your daily schedule.</Text>
            </View>

            <View style={styles.cardsRow}>
               <Pressable style={styles.choiceCard} onPress={openCamera}>
                 <LinearGradient colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']} style={styles.choiceCardGradients}>
                   <Camera size={32} color="#FFFFFF" strokeWidth={1.5} style={{ marginBottom: 16 }} />
                   <Text style={styles.choiceTitle}>Take a Picture</Text>
                   <Text style={styles.choiceSub}>Use your camera</Text>
                 </LinearGradient>
               </Pressable>

               <Pressable style={styles.choiceCard} onPress={openGallery}>
                 <LinearGradient colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']} style={styles.choiceCardGradients}>
                   <ImageIcon size={32} color="#FFFFFF" strokeWidth={1.5} style={{ marginBottom: 16 }} />
                   <Text style={styles.choiceTitle}>Upload File</Text>
                   <Text style={styles.choiceSub}>Choose from gallery</Text>
                 </LinearGradient>
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
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginBottom: 40,
    zIndex: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontFamily: geistSemiBold,
    letterSpacing: -0.8,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 28,
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 100,
  },
  infoWrapper: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 107, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 107, 255, 0.3)',
  },
  subheadline: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontFamily: geistRegular,
    paddingHorizontal: 20,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  choiceCard: {
    flex: 1,
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
  },
  choiceCardGradients: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
  },
  choiceTitle: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: geistSemiBold,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  choiceSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: geistMedium,
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 40,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  laser: {
    height: 60,
    width: '100%',
    position: 'absolute',
    left: 0,
    top: 40,
    justifyContent: 'center',
  },
  laserGlow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  laserLine: {
    height: 3,
    backgroundColor: '#5C45E2',
    shadowColor: '#B44FD6',
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  scanTextContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scanningText: {
    color: '#FFF',
    fontFamily: geistMedium,
    fontSize: 14,
  },
  resultCard: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    borderRadius: 28,
    overflow: 'hidden',
  },
  resultInner: {
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontFamily: geistSemiBold,
    color: '#000',
    letterSpacing: -0.4,
  },
  pillDetails: {
    marginBottom: 24,
  },
  pillName: {
    fontSize: 32,
    fontFamily: geistSemiBold,
    color: '#000',
    letterSpacing: -1.2,
    marginBottom: 4,
  },
  pillDosage: {
    fontSize: 15,
    fontFamily: geistMedium,
    color: 'rgba(0,0,0,0.6)',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retakeBtn: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  confirmBtn: {
    backgroundColor: '#006BFF',
    shadowColor: '#006BFF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retakeLabel: {
    color: '#111',
    fontFamily: geistSemiBold,
    fontSize: 15,
  },
  confirmLabel: {
    color: '#FFF',
    fontFamily: geistSemiBold,
    fontSize: 15,
  },
});
