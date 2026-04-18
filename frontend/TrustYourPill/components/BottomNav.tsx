import { useEffect, useRef, useCallback, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  FileText,
  Home,
  LayoutGrid,
  Plus,
  UserCircle,
} from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const geistMedium = 'Geist_500Medium';

type TabItem = { id: string; label: string; icon: any };

const TABS: TabItem[] = [
  { id: 'home',    label: 'Home',     icon: Home },
  { id: 'records', label: 'Records',  icon: FileText },
  { id: 'add',     label: 'Add Pill', icon: Plus },
  { id: 'profile', label: 'Profile',  icon: UserCircle },
  { id: 'grid',    label: 'Menu',     icon: LayoutGrid },
];

const INACTIVE_SIZE = 48;
const ACTIVE_WIDTH  = 130;
const TEXT_MAX_W    = 82;
const SPRING        = { useNativeDriver: false, damping: 22, stiffness: 260 } as const;

export function BottomNav({ onAddPress }: { onAddPress?: () => void }) {
  const [activeId, setActiveId] = useState('home');

  const widths = useRef(
    TABS.map((t) => new Animated.Value(t.id === 'home' ? ACTIVE_WIDTH : INACTIVE_SIZE))
  ).current;

  const textWidths = useRef(
    TABS.map((t) => new Animated.Value(t.id === 'home' ? TEXT_MAX_W : 0))
  ).current;

  const textOpacities = useRef(
    TABS.map((t) => new Animated.Value(t.id === 'home' ? 1 : 0))
  ).current;

  const entranceY  = useRef(new Animated.Value(60)).current;
  const entranceOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(entranceY,  { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
      Animated.timing(entranceOp, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleTabPress = useCallback((id: string) => {
    if (id === 'add' && onAddPress) {
      onAddPress();
      return;
    }
    if (id === activeId) return;
    const prevIdx = TABS.findIndex((t) => t.id === activeId);
    const nextIdx = TABS.findIndex((t) => t.id === id);

    Animated.parallel([
      Animated.spring(widths[prevIdx],         { toValue: INACTIVE_SIZE, ...SPRING }),
      Animated.spring(textWidths[prevIdx],      { toValue: 0, ...SPRING }),
      Animated.timing(textOpacities[prevIdx],   { toValue: 0, duration: 80, useNativeDriver: false }),
    ]).start();

    Animated.parallel([
      Animated.spring(widths[nextIdx],          { toValue: ACTIVE_WIDTH, ...SPRING }),
      Animated.spring(textWidths[nextIdx],       { toValue: TEXT_MAX_W, ...SPRING }),
      Animated.timing(textOpacities[nextIdx],    { toValue: 1, duration: 200, delay: 100, useNativeDriver: false }),
    ]).start();

    setActiveId(id);
  }, [activeId, widths, textWidths, textOpacities]);

  return (
    <Animated.View
      style={[styles.wrapper, { opacity: entranceOp, transform: [{ translateY: entranceY }] }]}
    >
      <View style={styles.shadowContainer}>
        <BlurView intensity={45} tint="light" style={styles.container}>
          {TABS.map((tab, i) => {
            const Icon = tab.icon;

            const backgroundColor = widths[i].interpolate({
              inputRange:  [INACTIVE_SIZE, ACTIVE_WIDTH],
              outputRange: ['rgba(243,244,246,0.8)', '#006BFF'],
              extrapolate: 'clamp',
            });

            const darkIconOpacity = widths[i].interpolate({
              inputRange:  [INACTIVE_SIZE, ACTIVE_WIDTH],
              outputRange: [1, 0],
              extrapolate: 'clamp',
            });

            const whiteIconOpacity = widths[i].interpolate({
              inputRange:  [INACTIVE_SIZE, ACTIVE_WIDTH],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            });

            return (
              <Pressable key={tab.id} onPress={() => handleTabPress(tab.id)}>
                <Animated.View style={[styles.item, { width: widths[i], backgroundColor }]}>
                  <View style={styles.iconStack}>
                    <Animated.View style={[StyleSheet.absoluteFill, styles.iconCenter, { opacity: darkIconOpacity }]}>
                      <Icon size={20} color="#111111" strokeWidth={2} />
                    </Animated.View>
                    <Animated.View style={[StyleSheet.absoluteFill, styles.iconCenter, { opacity: whiteIconOpacity }]}>
                      <Icon size={20} color="#FFFFFF" strokeWidth={2} />
                    </Animated.View>
                  </View>
                  <Animated.View style={{ maxWidth: textWidths[i], overflow: 'hidden' }}>
                    <Animated.Text
                      numberOfLines={1}
                      style={[styles.activeText, { opacity: textOpacities[i], marginLeft: 8 }]}
                    >
                      {tab.label}
                    </Animated.Text>
                  </Animated.View>
                </Animated.View>
              </Pressable>
            );
          })}
        </BlurView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  shadowContainer: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 10,
    borderRadius: 40,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    padding: 6,
    borderRadius: 40,
    gap: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  item: {
    height: 48,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconStack: {
    width: 20,
    height: 20,
  },
  iconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: geistMedium,
    flexShrink: 0,
  },
});
