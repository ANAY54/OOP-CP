import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, limeGlow } from '../theme';
import { useCart } from '../context/CartContext';
import { formatPrice, triggerHaptic } from '../utils/helpers';

export default function CartBar({ bottom = 85 }) {
  const { count, subtotal, restaurant } = useCart();
  const navigation = useNavigation();

  if (count === 0) return null;

  return (
    <TouchableOpacity
      style={[styles.bar, { bottom }]}
      activeOpacity={0.92}
      onPress={() => {
        triggerHaptic('medium');
        navigation.navigate('Cart');
      }}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>View Cart</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {restaurant?.name}
        </Text>
      </View>
      <Text style={styles.total}>{formatPrice(subtotal)}</Text>
      <Ionicons name="arrow-forward" size={18} color={colors.primaryText} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    ...limeGlow,
    zIndex: 99,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(11, 13, 16, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.primaryText,
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 14,
  },
  title: {
    color: colors.primaryText,
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
  },
  sub: {
    color: 'rgba(11, 13, 16, 0.75)',
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
  total: {
    color: colors.primaryText,
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 16,
  },
});
