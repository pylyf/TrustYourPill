import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import {
  ArrowRight,
  Bell,
  Camera,
  Check,
  HeartPulse,
  Pill as PillIcon,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  User,
  ClipboardList,
  Clock,
} from 'lucide-react-native';
import { colors, fonts, gradients } from '../theme';

type Props = { onComplete: (profile: OnboardingResult) => void };

export type OnboardingResult = {
  name: string;
  sex: 'female' | 'male' | 'other' | null;
  ageBracket: string | null;
  goals: string[];
  reminderSlots: string[];
  notificationsEnabled: boolean;
  cameraEnabled: boolean;
};

const TOTAL_STEPS = 7;

export function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [sex, setSex] = useState<OnboardingResult['sex']>(null);
  const [ageBracket, setAgeBracket] = useState<string | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [reminderSlots, setReminderSlots] = useState<string[]>(['morning', 'evening']);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slideAnim.setValue(24);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 20,
        stiffness: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  const canAdvance = useMemo(() => {
    switch (step) {
      case 0: return true;
      case 1: return name.trim().length > 0;
      case 2: return sex !== null && ageBracket !== null;
      case 3: return goals.length > 0;
      case 4: return reminderSlots.length > 0;
      case 5: return true;
      case 6: return true;
      default: return false;
    }
  }, [step, name, sex, ageBracket, goals, reminderSlots]);

  const next = () => {
    if (!canAdvance) return;
    if (step >= TOTAL_STEPS - 1) {
      onComplete({
        name: name.trim() || 'Friend',
        sex,
        ageBracket,
        goals,
        reminderSlots,
        notificationsEnabled,
        cameraEnabled,
      });
      return;
    }
    setStep((s) => s + 1);
  };

  const back = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
  };

  const toggleGoal = (g: string) =>
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const toggleSlot = (s: string) =>
    setReminderSlots((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  return (
    <View style={styles.root}>
      <BackgroundOrbs />

      <View style={styles.header}>
        <StepIndicator current={step} total={TOTAL_STEPS} />
        <Pressable onPress={next} hitSlop={10}>
          <Text style={styles.skip}>{step === TOTAL_STEPS - 1 ? '' : 'Skip'}</Text>
        </Pressable>
      </View>

      <Animated.View
        style={[
          styles.body,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {step === 0 && <WelcomeStep />}
        {step === 1 && <NameStep name={name} setName={setName} />}
        {step === 2 && (
          <ProfileStep
            sex={sex}
            setSex={setSex}
            ageBracket={ageBracket}
            setAgeBracket={setAgeBracket}
          />
        )}
        {step === 3 && <GoalsStep goals={goals} toggleGoal={toggleGoal} />}
        {step === 4 && <RemindersStep slots={reminderSlots} toggleSlot={toggleSlot} />}
        {step === 5 && (
          <PermissionsStep
            notificationsEnabled={notificationsEnabled}
            setNotificationsEnabled={setNotificationsEnabled}
            cameraEnabled={cameraEnabled}
            setCameraEnabled={setCameraEnabled}
          />
        )}
        {step === 6 && <FinishStep name={name.trim() || 'Friend'} />}
      </Animated.View>

      <View style={styles.footer}>
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <Pressable onPress={back} style={styles.backBtn} hitSlop={10}>
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        )}
        <Pressable
          onPress={next}
          disabled={!canAdvance}
          style={[styles.primaryBtn, !canAdvance && styles.primaryBtnDisabled]}
        >
          <Text style={styles.primaryBtnText}>
            {step === 0 ? 'Get started' : step === TOTAL_STEPS - 1 ? 'Enter TrustYourPill' : 'Continue'}
          </Text>
          <ArrowRight size={18} strokeWidth={2.2} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

/* ---------- Steps ---------- */

function WelcomeStep() {
  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <BrandHero />
      <Text style={styles.heroTitle}>
        Your pills,{'\n'}
        <Text style={{ color: colors.accent }}>made simple.</Text>
      </Text>
      <Text style={styles.heroSub}>
        Scan, schedule, and stay on top of every dose — with gentle reminders and side-effect insights you can actually trust.
      </Text>

      <View style={{ gap: 12, marginTop: 28 }}>
        <FeatureRow
          gradientKey="lightBlue"
          icon={Camera}
          title="Scan any pill in seconds"
          subtitle="Point your camera and we identify it for you."
        />
        <FeatureRow
          gradientKey="sage"
          icon={Bell}
          title="Never miss a dose"
          subtitle="Smart reminders that adapt to your day."
        />
        <FeatureRow
          gradientKey="softPurple"
          icon={ShieldCheck}
          title="Know what conflicts"
          subtitle="We check interactions across your library."
        />
      </View>
    </ScrollView>
  );
}

function NameStep({ name, setName }: { name: string; setName: (v: string) => void }) {
  return (
    <View style={styles.stepContent}>
      <StepBadge icon={User} label="About you" />
      <Text style={styles.stepTitle}>What should we call you?</Text>
      <Text style={styles.stepSub}>We'll use this on your home screen and check-ins.</Text>

      <View style={styles.inputCard}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your first name"
          placeholderTextColor="rgba(0,0,0,0.35)"
          style={styles.input}
          autoFocus
          returnKeyType="done"
          maxLength={24}
        />
      </View>

      <Text style={styles.fineprint}>You can change this anytime in settings.</Text>
    </View>
  );
}

function ProfileStep({
  sex,
  setSex,
  ageBracket,
  setAgeBracket,
}: {
  sex: OnboardingResult['sex'];
  setSex: (v: OnboardingResult['sex']) => void;
  ageBracket: string | null;
  setAgeBracket: (v: string) => void;
}) {
  const brackets = ['<18', '18–29', '30–44', '45–59', '60+'];
  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <StepBadge icon={HeartPulse} label="Health basics" />
      <Text style={styles.stepTitle}>A little about your body</Text>
      <Text style={styles.stepSub}>
        Helps us tailor dosing guidance and flag sensitive interactions.
      </Text>

      <Text style={styles.groupLabel}>Sex assigned at birth</Text>
      <View style={styles.chipRow}>
        {(['female', 'male', 'other'] as const).map((s) => (
          <Chip
            key={s}
            label={s[0].toUpperCase() + s.slice(1)}
            selected={sex === s}
            onPress={() => setSex(s)}
          />
        ))}
      </View>

      <Text style={[styles.groupLabel, { marginTop: 24 }]}>Age range</Text>
      <View style={styles.chipRow}>
        {brackets.map((b) => (
          <Chip key={b} label={b} selected={ageBracket === b} onPress={() => setAgeBracket(b)} />
        ))}
      </View>
    </ScrollView>
  );
}

function GoalsStep({ goals, toggleGoal }: { goals: string[]; toggleGoal: (g: string) => void }) {
  const OPTIONS: { id: string; label: string; icon: any; gradient: keyof typeof gradients }[] = [
    { id: 'adherence', label: 'Take pills on time', icon: Clock, gradient: 'lightBlue' },
    { id: 'track', label: 'Track my symptoms', icon: HeartPulse, gradient: 'pinkPurple' },
    { id: 'conflicts', label: 'Avoid interactions', icon: ShieldCheck, gradient: 'softPurple' },
    { id: 'streak', label: 'Build a streak', icon: Sparkles, gradient: 'sage' },
    { id: 'family', label: 'Manage for family', icon: ClipboardList, gradient: 'warmPeach' },
    { id: 'doctor', label: 'Prep for my doctor', icon: Stethoscope, gradient: 'adherence' },
  ];
  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <StepBadge icon={Sparkles} label="Your goals" />
      <Text style={styles.stepTitle}>What matters most to you?</Text>
      <Text style={styles.stepSub}>Pick any that apply — we'll shape your home screen around them.</Text>

      <View style={styles.goalGrid}>
        {OPTIONS.map((o) => (
          <GoalCard
            key={o.id}
            label={o.label}
            Icon={o.icon}
            gradient={gradients[o.gradient] as unknown as readonly [string, string]}
            selected={goals.includes(o.id)}
            onPress={() => toggleGoal(o.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function RemindersStep({
  slots,
  toggleSlot,
}: {
  slots: string[];
  toggleSlot: (s: string) => void;
}) {
  const OPTIONS = [
    { id: 'morning', label: 'Morning', time: '8:00 AM', icon: Sunrise },
    { id: 'midday', label: 'Midday', time: '12:30 PM', icon: Sun },
    { id: 'afternoon', label: 'Afternoon', time: '2:30 PM', icon: Sun },
    { id: 'evening', label: 'Evening', time: '6:30 PM', icon: Sunset },
    { id: 'bedtime', label: 'Bedtime', time: '10:00 PM', icon: Moon },
  ];
  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <StepBadge icon={Clock} label="Daily rhythm" />
      <Text style={styles.stepTitle}>When do you usually take your pills?</Text>
      <Text style={styles.stepSub}>We'll send gentle nudges only at these times.</Text>

      <View style={{ gap: 10, marginTop: 8 }}>
        {OPTIONS.map((o) => (
          <TimeRow
            key={o.id}
            label={o.label}
            time={o.time}
            Icon={o.icon}
            selected={slots.includes(o.id)}
            onPress={() => toggleSlot(o.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function PermissionsStep({
  notificationsEnabled,
  setNotificationsEnabled,
  cameraEnabled,
  setCameraEnabled,
}: {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  cameraEnabled: boolean;
  setCameraEnabled: (v: boolean) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <StepBadge icon={ShieldCheck} label="Permissions" />
      <Text style={styles.stepTitle}>Just two quick things</Text>
      <Text style={styles.stepSub}>You can change either of these later in settings.</Text>

      <PermissionCard
        icon={Bell}
        gradient={gradients.lightBlue as unknown as readonly [string, string]}
        title="Dose reminders"
        subtitle="Gentle notifications when it's pill o'clock."
        enabled={notificationsEnabled}
        onToggle={() => setNotificationsEnabled(!notificationsEnabled)}
      />
      <PermissionCard
        icon={Camera}
        gradient={gradients.softPurple as unknown as readonly [string, string]}
        title="Camera access"
        subtitle="Needed to scan and identify your pills."
        enabled={cameraEnabled}
        onToggle={() => setCameraEnabled(!cameraEnabled)}
      />

      <View style={styles.privacyCard}>
        <ShieldCheck size={18} strokeWidth={2} color={colors.accent} />
        <Text style={styles.privacyText}>
          Your health data stays on your device. We never sell or share it.
        </Text>
      </View>
    </ScrollView>
  );
}

function FinishStep({ name }: { name: string }) {
  return (
    <View style={[styles.stepContent, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
      <SuccessBadge />
      <Text style={[styles.stepTitle, { textAlign: 'center', marginTop: 28 }]}>
        You're all set, {name}.
      </Text>
      <Text style={[styles.stepSub, { textAlign: 'center' }]}>
        Let's add your first pill and turn consistency into a streak.
      </Text>

      <View style={styles.summaryCard}>
        <SummaryRow icon={Bell} label="Smart reminders" value="On" />
        <Divider />
        <SummaryRow icon={Camera} label="Pill scanner" value="Ready" />
        <Divider />
        <SummaryRow icon={ShieldCheck} label="Interaction checks" value="Active" />
      </View>
    </View>
  );
}

/* ---------- Reusable bits ---------- */

function BackgroundOrbs() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#F4D6E4', '#D9C8EF00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.orbTopRight}
      />
      <LinearGradient
        colors={['#CFE5F2', '#CFE5F200']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.orbBottomLeft}
      />
    </View>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.indicatorRow}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i <= current;
        return (
          <View
            key={i}
            style={[
              styles.indicatorDot,
              active && styles.indicatorDotActive,
              i === current && styles.indicatorDotCurrent,
            ]}
          />
        );
      })}
    </View>
  );
}

function StepBadge({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.stepBadge}>
      <Icon size={14} strokeWidth={2.2} color={colors.accent} />
      <Text style={styles.stepBadgeText}>{label}</Text>
    </View>
  );
}

function FeatureRow({
  gradientKey,
  icon: Icon,
  title,
  subtitle,
}: {
  gradientKey: keyof typeof gradients;
  icon: any;
  title: string;
  subtitle: string;
}) {
  return (
    <LinearGradient
      colors={gradients[gradientKey] as unknown as readonly [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.featureRow}
    >
      <View style={styles.featureIcon}>
        <Icon size={20} strokeWidth={2.2} color={colors.dark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSub}>{subtitle}</Text>
      </View>
    </LinearGradient>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function GoalCard({
  label,
  Icon,
  gradient,
  selected,
  onPress,
}: {
  label: string;
  Icon: any;
  gradient: readonly [string, string];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ width: '48%' }}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.goalCard, selected && styles.goalCardSelected]}
      >
        <View style={styles.goalIcon}>
          <Icon size={18} strokeWidth={2.2} color={colors.dark} />
        </View>
        <Text style={styles.goalLabel}>{label}</Text>
        {selected && (
          <View style={styles.goalCheck}>
            <Check size={12} strokeWidth={3} color="#FFFFFF" />
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

function TimeRow({
  label,
  time,
  Icon,
  selected,
  onPress,
}: {
  label: string;
  time: string;
  Icon: any;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.timeRow, selected && styles.timeRowSelected]}
    >
      <View style={[styles.timeIcon, selected && styles.timeIconSelected]}>
        <Icon size={18} strokeWidth={2.2} color={selected ? '#FFFFFF' : colors.dark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.timeLabel}>{label}</Text>
        <Text style={styles.timeSub}>{time}</Text>
      </View>
      <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
        {selected && <Check size={14} strokeWidth={3} color="#FFFFFF" />}
      </View>
    </Pressable>
  );
}

function PermissionCard({
  icon: Icon,
  gradient,
  title,
  subtitle,
  enabled,
  onToggle,
}: {
  icon: any;
  gradient: readonly [string, string];
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.permCard}
    >
      <View style={styles.permIcon}>
        <Icon size={22} strokeWidth={2.2} color={colors.dark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.permTitle}>{title}</Text>
        <Text style={styles.permSub}>{subtitle}</Text>
      </View>
      <Toggle enabled={enabled} onToggle={onToggle} />
    </LinearGradient>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const anim = useRef(new Animated.Value(enabled ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: enabled ? 1 : 0,
      damping: 16,
      stiffness: 220,
      useNativeDriver: false,
    }).start();
  }, [enabled]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0.15)', colors.accent],
  });
  return (
    <Pressable onPress={onToggle} hitSlop={8}>
      <Animated.View style={[styles.toggleTrack, { backgroundColor: bg }]}>
        <Animated.View style={[styles.toggleThumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

function BrandHero() {
  return (
    <View style={styles.brandHero}>
      <LinearGradient
        colors={['#E2DBF6', '#CFE5F2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.brandHeroBg}
      />
      <View style={styles.brandIconWrap}>
        <LinearGradient
          colors={['#006BFF', '#3B8BFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brandIconBg}
        >
          <PillIcon size={34} strokeWidth={2.2} color="#FFFFFF" />
        </LinearGradient>
      </View>
      <FloatingPill gradientKey="pinkPurple" style={{ top: 18, left: 24 }} delay={0} />
      <FloatingPill gradientKey="sage" style={{ top: 80, right: 28 }} delay={400} />
      <FloatingPill gradientKey="warmPeach" style={{ bottom: 24, left: 48 }} delay={200} />
    </View>
  );
}

function FloatingPill({
  gradientKey,
  style,
  delay,
}: {
  gradientKey: keyof typeof gradients;
  style: any;
  delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 2600,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  return (
    <Animated.View style={[styles.floatingPill, style, { transform: [{ translateY }] }]}>
      <LinearGradient
        colors={gradients[gradientKey] as unknown as readonly [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

function SuccessBadge() {
  const scale = useRef(new Animated.Value(0.6)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, damping: 10, stiffness: 160, useNativeDriver: true }).start();
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const size = 150;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', transform: [{ rotate: spin }] }}>
        <Svg width={size} height={size}>
          <Defs>
            <SvgLinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#006BFF" />
              <Stop offset="100%" stopColor="#B44FD6" />
            </SvgLinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 6}
            stroke="url(#ringGrad)"
            strokeWidth={4}
            strokeDasharray="8 10"
            fill="none"
          />
        </Svg>
      </Animated.View>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={['#26B81E', '#52FF4A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.successInner}
        >
          <Check size={42} strokeWidth={3} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryIcon}>
        <Icon size={16} strokeWidth={2.2} color={colors.dark} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  orbTopRight: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 9999,
    opacity: 0.7,
  },
  orbBottomLeft: {
    position: 'absolute',
    bottom: -140,
    left: -120,
    width: 340,
    height: 340,
    borderRadius: 9999,
    opacity: 0.6,
  },

  header: {
    paddingTop: 14,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  indicatorRow: { flexDirection: 'row', gap: 6 },
  indicatorDot: {
    width: 20,
    height: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  indicatorDotActive: { backgroundColor: colors.accent },
  indicatorDotCurrent: { width: 28 },
  skip: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: -0.25,
  },

  body: { flex: 1, paddingHorizontal: 28, paddingTop: 18 },
  stepContent: { paddingBottom: 28 },

  stepBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,107,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    marginBottom: 14,
  },
  stepBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.accent,
    letterSpacing: -0.2,
  },

  heroTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 41,
    color: colors.dark,
    letterSpacing: -1.8,
    lineHeight: 44,
    marginTop: 20,
  },
  heroSub: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.meta,
    letterSpacing: -0.25,
    marginTop: 12,
    lineHeight: 22,
  },

  stepTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 30,
    color: colors.dark,
    letterSpacing: -1.1,
    lineHeight: 34,
  },
  stepSub: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.meta,
    letterSpacing: -0.25,
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },

  brandHero: {
    height: 200,
    borderRadius: 38,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  brandHeroBg: { ...StyleSheet.absoluteFillObject },
  brandIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 9999,
    backgroundColor: '#006BFF',
    shadowColor: '#006BFF',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  brandIconBg: {
    width: 86,
    height: 86,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  floatingPill: {
    position: 'absolute',
    width: 34,
    height: 22,
    borderRadius: 9999,
    overflow: 'hidden',
  },

  featureRow: {
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.dark,
    letterSpacing: -0.4,
  },
  featureSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
    letterSpacing: -0.25,
    marginTop: 2,
  },

  inputCard: {
    backgroundColor: colors.cardGray,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginTop: 8,
  },
  input: {
    fontFamily: fonts.semiBold,
    fontSize: 22,
    color: colors.dark,
    letterSpacing: -0.6,
    padding: 0,
  },
  fineprint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: 'rgba(0,0,0,0.45)',
    letterSpacing: -0.2,
    marginTop: 14,
  },

  groupLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 9999,
    backgroundColor: colors.cardGray,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    shadowColor: '#006BFF',
    shadowOpacity: 0.35,
    shadowRadius: 6.6,
    shadowOffset: { width: 0, height: 4 },
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.dark,
    letterSpacing: -0.3,
  },
  chipTextSelected: { color: '#FFFFFF' },

  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  goalCard: {
    borderRadius: 22,
    padding: 16,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  goalCardSelected: {
    shadowColor: '#006BFF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  goalIcon: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.dark,
    letterSpacing: -0.4,
    marginTop: 14,
  },
  goalCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 9999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.cardGray,
  },
  timeRowSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#006BFF',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  timeIcon: {
    width: 42,
    height: 42,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeIconSelected: { backgroundColor: colors.accent },
  timeLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.dark,
    letterSpacing: -0.4,
  },
  timeSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },

  permCard: {
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  permIcon: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.dark,
    letterSpacing: -0.4,
  },
  permSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
    letterSpacing: -0.25,
    marginTop: 2,
  },
  toggleTrack: {
    width: 46,
    height: 26,
    borderRadius: 9999,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },

  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(0,107,255,0.06)',
    marginTop: 8,
  },
  privacyText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: 'rgba(0,0,0,0.7)',
    letterSpacing: -0.2,
    lineHeight: 18,
  },

  successInner: {
    width: 104,
    height: 104,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#52FF4A',
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },

  summaryCard: {
    marginTop: 28,
    width: '100%',
    backgroundColor: colors.cardGray,
    borderRadius: 22,
    paddingVertical: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.dark,
    letterSpacing: -0.3,
  },
  summaryValue: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.accent,
    letterSpacing: -0.2,
  },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: 16 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 28,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 9999,
    backgroundColor: colors.cardGray,
  },
  backBtnText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.dark,
    letterSpacing: -0.3,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 9999,
    backgroundColor: colors.accent,
    shadowColor: '#006BFF',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryBtnDisabled: {
    backgroundColor: 'rgba(0,107,255,0.35)',
    shadowOpacity: 0,
  },
  primaryBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});
