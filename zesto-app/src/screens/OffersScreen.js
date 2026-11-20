import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, limeGlow } from '../theme';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatPrice, triggerHaptic } from '../utils/helpers';

const HOW_IT_WORKS = [
  { icon: 'cart-outline', text: 'Select curated dishes from top Pune kitchens' },
  { icon: 'pricetag-outline', text: 'Apply code at checkout for up to 50% discount' },
  { icon: 'sparkles-outline', text: 'Earn 1 Zesto Loyalty Point for every ₹10 spent' },
];

export default function OffersScreen() {
  const { user, signIn } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setOffers(await api.offers());
      setError('');
      api.login(user.name, user.email).then(signIn).catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.name, user.email, signIn]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const points = user?.loyaltyPoints ?? 0;
  const nextTier = points < 200 ? 200 : points < 500 ? 500 : null;
  const progress = nextTier ? Math.min(points / nextTier, 1) : 1;
  const loyaltyNote = nextTier
    ? `${nextTier - points} more points to unlock ${nextTier === 200 ? 5 : 10}% off every order`
    : 'You hold the top 10% VIP loyalty discount tier 🎉';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.title}>Offers & Rewards</Text>
        <Text style={styles.subtitle}>Exclusive member discounts & promotional codes</Text>

        {/* Loyalty Points Card */}
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyTop}>
            <View>
              <Text style={styles.loyaltyLabel}>ZESTO LOYALTY CLUB</Text>
              <Text style={styles.loyaltyTier}>
                {points >= 500 ? 'Gold VIP Member' : points >= 200 ? 'Silver Member' : 'Standard Member'}
              </Text>
            </View>
            <View style={styles.pointsPill}>
              <Ionicons name="sparkles" size={14} color={colors.primary} />
              <Text style={styles.pointsText}>{points} pts</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>

          <Text style={styles.loyaltyNote}>{loyaltyNote}</Text>
        </View>

        {/* Coupons List */}
        <Text style={styles.sectionTitle}>Exclusive Coupons</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} size="large" color={colors.primary} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                triggerHaptic('medium');
                load();
              }}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          offers.map((o) => (
            <View key={o.code} style={styles.couponCard}>
              <View style={styles.stub}>
                <Text style={styles.stubNumber}>{o.discountPercent}%</Text>
                <Text style={styles.stubOff}>OFF</Text>
              </View>

              <View style={styles.couponBody}>
                <View style={styles.codePill}>
                  <Text style={styles.codeText}>{o.code}</Text>
                </View>
                <Text style={styles.couponTitle}>{o.title}</Text>
                <Text style={styles.couponMeta}>
                  Min order {formatPrice(o.minOrder)} • Max saving {formatPrice(o.maxDiscount)}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* How it works */}
        <Text style={styles.sectionTitle}>How Discounts Work</Text>
        <View style={styles.howCard}>
          {HOW_IT_WORKS.map((step, i) => (
            <View key={i} style={[styles.howRow, i > 0 && styles.howDivider]}>
              <View style={styles.howIconWrap}>
                <Ionicons name={step.icon} size={18} color={colors.primary} />
              </View>
              <Text style={styles.howText}>{step.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 28,
    color: colors.text,
    marginTop: 10,
  },
  subtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: colors.primary,
    marginTop: 2,
    marginBottom: 18,
  },
  loyaltyCard: {
    padding: 20,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loyaltyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loyaltyLabel: {
    fontFamily: 'Sora_700Bold',
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  loyaltyTier: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 18,
    color: colors.text,
    marginTop: 2,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.primary,
    ...limeGlow,
  },
  pointsText: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 14,
    color: colors.primary,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface2,
    marginTop: 16,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  loyaltyNote: {
    fontFamily: 'Sora_400Regular',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  couponCard: {
    flexDirection: 'row',
    marginBottom: 14,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  stub: {
    width: 90,
    backgroundColor: colors.surface2,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  stubNumber: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 24,
    color: colors.primary,
  },
  stubOff: {
    fontFamily: 'Sora_700Bold',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  couponBody: {
    flex: 1,
    padding: 14,
  },
  codePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  codeText: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 13,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  couponTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: colors.text,
    marginTop: 8,
  },
  couponMeta: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  howCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  howRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  howDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  howIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howText: {
    flex: 1,
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: colors.text,
  },
  errorBox: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Sora_400Regular',
    color: colors.danger,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 14,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  retryText: {
    fontFamily: 'Sora_700Bold',
    color: colors.primaryText,
  },
});
