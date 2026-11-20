import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, limeGlow } from '../theme';

export default function SplashScreen({ onFinish }) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textShift = useRef(new Animated.Value(20)).current;

  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.25,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.85,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textShift, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const timer = setTimeout(() => {
      if (finishRef.current) finishRef.current();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.background} />

      {/* Ambient background lime aura */}
      <Animated.View
        style={[
          styles.glowAura,
          {
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Citrus Lime Logo Badge */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <View style={styles.logoBadge}>
          {/* Citrus / Spark / Leaf icon in lime on dark */}
          <Ionicons name="sparkles" size={48} color={colors.primary} />
        </View>
      </Animated.View>

      <Animated.View
        style={{
          opacity: textOpacity,
          transform: [{ translateY: textShift }],
          alignItems: 'center',
        }}
      >
        <View style={styles.titleRow}>
          <Text style={styles.brandName}>ZESTO</Text>
          <View style={styles.citrusDot} />
        </View>
        <Text style={styles.tagline}>CITRUS ZEST • HYPERFAST DELIVERY</Text>
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>Pune • Iconic Food Delivery</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glowAura: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(184, 242, 59, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 59, 0.15)',
  },
  logoContainer: {
    marginBottom: 28,
  },
  logoBadge: {
    width: 110,
    height: 110,
    borderRadius: 36,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...limeGlow,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  brandName: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 42,
    color: colors.text,
    letterSpacing: 3,
  },
  citrusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  tagline: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    color: colors.primary,
    marginTop: 8,
    letterSpacing: 2,
  },
  badgePill: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgePillText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
});
