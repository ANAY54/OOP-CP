import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { badgeColor, cuisineStyle, formatCount, formatPrice, triggerHaptic } from '../utils/helpers';
import { useFavorites } from '../context/FavoritesContext';

export default function RestaurantCard({ restaurant, onPress }) {
  const theme = cuisineStyle(restaurant.cuisineKey);
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(restaurant.id);

  const handleToggle = () => {
    triggerHaptic('medium');
    toggle(restaurant.id);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => {
        triggerHaptic('selection');
        onPress();
      }}
    >
      <View style={styles.banner}>
        {restaurant.imageUrl ? (
          <Image
            source={{ uri: restaurant.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        ) : (
          <LinearGradient
            colors={theme.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.emojiFallback}>
              <Text style={styles.emoji}>{theme.emoji}</Text>
            </View>
          </LinearGradient>
        )}

        {/* Cinematic dark gradient overlay for text legibility */}
        <LinearGradient
          colors={['rgba(11, 13, 16, 0.2)', 'rgba(11, 13, 16, 0.85)']}
          style={StyleSheet.absoluteFill}
        />

        {!!restaurant.badge && (
          <View style={[styles.badge, { backgroundColor: badgeColor(restaurant.badge) }]}>
            <Text style={styles.badgeText}>{restaurant.badge}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.heart}
          activeOpacity={0.8}
          onPress={handleToggle}
          hitSlop={10}
        >
          <Ionicons
            name={fav ? 'heart' : 'heart-outline'}
            size={18}
            color={fav ? colors.coral : colors.text}
          />
        </TouchableOpacity>

        <View style={styles.timePill}>
          <Ionicons name="time-outline" size={12} color={colors.primary} />
          <Text style={styles.timeText}>{restaurant.deliveryTimeMin} min</Text>
        </View>

        {restaurant.pureVeg && (
          <View style={styles.vegPill}>
            <Text style={styles.vegText}>🌱 Pure Veg</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={11} color={colors.primaryText} />
            <Text style={styles.ratingText}>{Number(restaurant.rating).toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {restaurant.cuisine} • {formatPrice(restaurant.priceForTwo)} for two
        </Text>
        <View style={styles.bottomRow}>
          <Ionicons name="location-outline" size={13} color={colors.textMuted} />
          <Text style={styles.address} numberOfLines={1}>
            {restaurant.address}
          </Text>
          <Text style={styles.reviews}>{formatCount(restaurant.reviewCount)} reviews</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  banner: {
    height: 160,
    backgroundColor: colors.surface2,
    position: 'relative',
    overflow: 'hidden',
  },
  emojiFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 58,
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  badgeText: {
    color: '#0B0D10',
    fontSize: 11,
    fontFamily: 'Sora_700Bold',
    letterSpacing: 0.3,
  },
  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20, 24, 29, 0.75)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePill: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20, 24, 29, 0.85)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Sora_600SemiBold',
    color: colors.text,
  },
  vegPill: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20, 24, 29, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(61, 220, 151, 0.3)',
  },
  vegText: {
    fontSize: 10,
    fontFamily: 'Sora_700Bold',
    color: colors.success,
  },
  info: {
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    fontFamily: 'Sora_700Bold',
    fontSize: 17,
    color: colors.text,
    marginRight: 10,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.xs,
    backgroundColor: colors.amber,
  },
  ratingText: {
    color: '#0B0D10',
    fontFamily: 'Sora_700Bold',
    fontSize: 11,
  },
  meta: {
    marginTop: 4,
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  address: {
    flex: 1,
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  reviews: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
});
