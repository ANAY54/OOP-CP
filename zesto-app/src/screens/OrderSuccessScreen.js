import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, limeGlow } from '../theme';
import { formatPrice, triggerHaptic } from '../utils/helpers';

const PAYMENT_LABEL = {
  UPI: 'UPI / GPay',
  CARD: 'Credit / Debit Card',
  CASH_ON_DELIVERY: 'Cash on Delivery',
};

export default function OrderSuccessScreen({ route, navigation }) {
  const { order } = route.params;
  const insets = useSafeAreaInsets();

  const scale = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    triggerHaptic('success');
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const goTo = (tab) => {
    triggerHaptic('medium');
    navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: tab } }] });
  };

  const points = Math.floor(order.total / 10);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.background} />

      {/* Hero Header */}
      <View style={[styles.hero, { paddingTop: insets.top + 30 }]}>
        <Animated.View style={[styles.checkCircle, { transform: [{ scale }] }]}>
          <Ionicons name="checkmark-sharp" size={50} color={colors.primaryText} />
        </Animated.View>
        <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
          <Text style={styles.heroTitle}>Order Confirmed!</Text>
          <Text style={styles.heroSub}>{order.statusLabel}</Text>
        </Animated.View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 160 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.card, { opacity: fade }]}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.label}>ORDER NUMBER</Text>
              <Text style={styles.orderId}>#{order.id}</Text>
            </View>
            <View style={styles.pointsPill}>
              <Ionicons name="sparkles" size={13} color={colors.amber} />
              <Text style={styles.pointsText}>+{points} pts</Text>
            </View>
          </View>

          <Text style={styles.restaurant}>{order.restaurantName}</Text>

          <View style={styles.divider} />

          {order.lines.map((line, i) => (
            <View key={i} style={styles.lineRow}>
              <Text style={styles.lineName}>
                {line.quantity} × {line.name}
              </Text>
              <Text style={styles.lineValue}>{formatPrice(line.lineTotal)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.lineRow}>
            <Text style={styles.muted}>Items Subtotal</Text>
            <Text style={styles.lineValue}>{formatPrice(order.subtotal)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.lineRow}>
              <Text style={styles.muted}>
                Discounts{order.coupon ? ` (${order.coupon})` : ''}
              </Text>
              <Text style={[styles.lineValue, { color: colors.primary }]}>
                -{formatPrice(order.discount)}
              </Text>
            </View>
          )}
          <View style={styles.lineRow}>
            <Text style={styles.muted}>GST & Taxes (5%)</Text>
            <Text style={styles.lineValue}>{formatPrice(order.tax)}</Text>
          </View>
          <View style={styles.lineRow}>
            <Text style={styles.muted}>Delivery Partner Fee</Text>
            <Text style={styles.lineValue}>{formatPrice(order.deliveryFee)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.lineRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
          </View>
          <Text style={styles.payNote}>
            Paid via {PAYMENT_LABEL[order.payment] || order.payment}
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.88}
          onPress={() => goTo('Orders')}
        >
          <Text style={styles.primaryText}>Track Order Progress</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.primaryText} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.88}
          onPress={() => goTo('Home')}
        >
          <Text style={styles.secondaryText}>Back to Kitchens</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    alignItems: 'center',
    paddingBottom: 40,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...limeGlow,
  },
  heroTitle: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 26,
    color: colors.text,
  },
  heroSub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
  card: {
    padding: 20,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  orderId: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 22,
    color: colors.text,
    marginTop: 2,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  pointsText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    color: colors.amber,
  },
  restaurant: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: colors.text,
    marginTop: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  lineName: {
    flex: 1,
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: colors.text,
    marginRight: 10,
  },
  lineValue: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
  muted: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  totalLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: colors.text,
  },
  totalValue: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 18,
    color: colors.primary,
  },
  payNote: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primaryBtn: {
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...limeGlow,
  },
  primaryText: {
    fontFamily: 'Sora_700Bold',
    color: colors.primaryText,
    fontSize: 15,
  },
  secondaryBtn: {
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: 'Sora_600SemiBold',
    color: colors.textMuted,
    fontSize: 14,
  },
});
