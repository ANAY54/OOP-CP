import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, limeGlow } from '../theme';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { cuisineStyle, dishEmoji, formatPrice, triggerHaptic } from '../utils/helpers';
import RestaurantCard from '../components/RestaurantCard';
import CartBar from '../components/CartBar';

const CATEGORIES = [
  { key: '', label: 'All', emoji: '⚡' },
  { key: 'LOCAL', label: 'Local Kitchens', emoji: '🏪' },
  { key: 'FAV', label: 'Saved', emoji: '❤️' },
  { key: 'NORTH_INDIAN', label: 'North Indian', emoji: '🍛' },
  { key: 'SOUTH_INDIAN', label: 'South Indian', emoji: '🥘' },
  { key: 'CHINESE', label: 'Chinese', emoji: '🥡' },
  { key: 'ITALIAN', label: 'Italian', emoji: '🍕' },
  { key: 'FAST_FOOD', label: 'Fast Food', emoji: '🍔' },
  { key: 'DESSERTS', label: 'Desserts', emoji: '🍰' },
  { key: 'BEVERAGES', label: 'Drinks', emoji: '🥤' },
];

const SORTS = [
  { key: 'rating', label: 'Top Rated', icon: 'star' },
  { key: 'time', label: 'Fastest', icon: 'flash' },
  { key: 'cost', label: 'Budget', icon: 'cash' },
];

const MOODS = [
  { key: 'COMFORT', label: 'Comfort Food', emoji: '🍲', tag: 'Rich & warm' },
  { key: 'SPICY', label: 'Spicy Fiery', emoji: '🌶️', tag: 'Bold spice' },
  { key: 'LIGHT', label: 'Light & Clean', emoji: '🥗', tag: 'Steamed & fresh' },
  { key: 'SWEET', label: 'Sweet Tooth', emoji: '🍨', tag: 'Desserts & lassi' },
  { key: 'QUICK', label: 'Quick Bites', emoji: '⚡', tag: 'Fast finger bites' },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { clear, addItem } = useCart();
  const { ids: favIds, isFavorite } = useFavorites();
  const firstName = user?.name?.split(' ')[0] || 'there';
  const hasAddress = !!user?.address && user.address !== 'Not set';

  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [sort, setSort] = useState('rating');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [offers, setOffers] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);

  // Phase 3 Feature A: Feed Me Budget Planner State
  const [feedMeVisible, setFeedMeVisible] = useState(false);
  const [budgetInput, setBudgetInput] = useState('500');
  const [peopleCount, setPeopleCount] = useState(2);
  const [dietChoice, setDietChoice] = useState('veg');
  const [strategyChoice, setStrategyChoice] = useState('knapsack');
  const [planning, setPlanning] = useState(false);
  const [planResult, setPlanResult] = useState(null);

  // Phase 3 Feature D: Mood Matcher State
  const [activeMood, setActiveMood] = useState('COMFORT');
  const [moodDishes, setMoodDishes] = useState([]);
  const [moodLoading, setMoodLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setReloadKey((k) => k + 1);
    }, [])
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(
      async () => {
        try {
          const apiCuisine = cuisine === 'FAV' || cuisine === 'LOCAL' ? '' : cuisine;
          const data = await api.restaurants(query.trim(), apiCuisine);
          if (!cancelled) {
            setRestaurants(data);
            setError('');
          }
        } catch (e) {
          if (!cancelled) {
            setRestaurants([]);
            setError(e.message);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      },
      query ? 300 : 0
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, cuisine, reloadKey]);

  useEffect(() => {
    api.offers().then(setOffers).catch(() => {});
    api
      .items('')
      .then((all) => {
        const seen = {};
        const picked = [];
        all.forEach((d) => {
          seen[d.restaurantId] = (seen[d.restaurantId] || 0) + 1;
          if (seen[d.restaurantId] <= 2) picked.push(d);
        });
        setDishes(picked.slice(0, 10));
      })
      .catch(() => {});

    // Initial Mood Dishes Fetch
    loadMoodDishes('COMFORT');
  }, []);

  const loadMoodDishes = async (moodKey) => {
    setMoodLoading(true);
    try {
      const results = await api.moodDishes(moodKey);
      setMoodDishes(results);
    } catch (e) {
      // Fallback
    } finally {
      setMoodLoading(false);
    }
  };

  const handleMoodSelect = (moodKey) => {
    triggerHaptic('selection');
    setActiveMood(moodKey);
    loadMoodDishes(moodKey);
  };

  const handleRunMealPlan = async () => {
    triggerHaptic('medium');
    setPlanning(true);
    setPlanResult(null);
    try {
      const budgetNum = parseFloat(budgetInput) || 500;
      const res = await api.mealPlan({
        budget: budgetNum,
        people: peopleCount,
        diet: dietChoice,
        maxSpice: 2,
        strategy: strategyChoice,
      });
      setPlanResult(res);
      triggerHaptic('success');
    } catch (e) {
      Alert.alert('Meal Planner', e.message);
    } finally {
      setPlanning(false);
    }
  };

  const handleAddPlanToCart = async () => {
    if (!planResult || !planResult.items || planResult.items.length === 0) return;
    triggerHaptic('success');
    try {
      const rest = await api.restaurant(planResult.restaurantId);
      clear();
      planResult.items.forEach((pi) => {
        const fullItem = rest.menu.find((m) => m.id === pi.id) || {
          id: pi.id,
          name: pi.name,
          price: pi.price,
          category: pi.type || 'VEG',
          cuisine: rest.cuisine,
          imageUrl: pi.imageUrl,
          veg: pi.type !== 'NON-VEG',
        };
        addItem(rest, fullItem);
      });
      setFeedMeVisible(false);
      navigation.navigate('Cart');
    } catch (e) {
      Alert.alert('Error', 'Could not add to cart: ' + e.message);
    }
  };

  const localKitchens = useMemo(
    () => restaurants.filter((r) => r.localBusiness),
    [restaurants]
  );

  const visible = useMemo(() => {
    let list = restaurants;
    if (cuisine === 'FAV') {
      list = list.filter((r) => isFavorite(r.id));
    } else if (cuisine === 'LOCAL') {
      list = list.filter((r) => r.localBusiness);
    }
    const sorted = [...list];
    if (sort === 'time') sorted.sort((a, b) => a.deliveryTimeMin - b.deliveryTimeMin);
    else if (sort === 'cost') sorted.sort((a, b) => a.priceForTwo - b.priceForTwo);
    else sorted.sort((a, b) => (b.localBusiness ? 1 : 0) - (a.localBusiness ? 1 : 0) || b.rating - a.rating);
    return sorted;
  }, [restaurants, cuisine, sort, favIds]);

  const hasFilters = query.trim() !== '' || cuisine !== '';
  const topOffer = offers[0];

  const handleCategoryPress = (key) => {
    triggerHaptic('selection');
    setCuisine(key);
  };

  const handleSortPress = (key) => {
    triggerHaptic('selection');
    setSort(key);
  };

  const listHeader = (
    <View>
      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {CATEGORIES.map((c) => {
          const active = cuisine === c.key;
          return (
            <TouchableOpacity
              key={c.key || 'all'}
              activeOpacity={0.85}
              onPress={() => handleCategoryPress(c.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={styles.chipEmoji}>{c.emoji}</Text>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Verified Local & Small Food Businesses Spotlight */}
      {!hasFilters && localKitchens.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              marginBottom: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 9,
                  backgroundColor: colors.partnerSoft,
                  borderWidth: 1,
                  borderColor: colors.partnerBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="storefront" size={14} color={colors.partner} />
              </View>
              <View>
                <Text style={{ fontFamily: 'Sora_800ExtraBold', fontSize: 16, color: colors.text }}>
                  Local & Home Kitchens
                </Text>
                <Text style={{ fontFamily: 'Sora_400Regular', fontSize: 11, color: colors.textMuted }}>
                  Verified Pune small food businesses near you
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleCategoryPress('LOCAL')}>
              <Text style={{ fontFamily: 'Sora_700Bold', fontSize: 12, color: colors.partner }}>
                See All ({localKitchens.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {localKitchens.map((shop) => (
              <TouchableOpacity
                key={shop.id}
                activeOpacity={0.9}
                onPress={() => {
                  triggerHaptic('selection');
                  navigation.navigate('RestaurantDetail', { restaurantId: shop.id });
                }}
                style={{
                  width: 230,
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: colors.partnerBorder,
                  overflow: 'hidden',
                }}
              >
                <View style={{ height: 106, position: 'relative' }}>
                  <Image source={{ uri: shop.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <LinearGradient
                    colors={['rgba(11,13,16,0.15)', 'rgba(11,13,16,0.88)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: colors.partner,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 99,
                    }}
                  >
                    <Ionicons name="storefront" size={10} color="#0B0D10" />
                    <Text style={{ fontFamily: 'Sora_800ExtraBold', fontSize: 9.5, color: '#0B0D10' }}>
                      {shop.businessTypeLabel || 'Local Kitchen'}
                    </Text>
                  </View>
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      backgroundColor: colors.amber,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 7,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Ionicons name="star" size={10} color="#0B0D10" />
                    <Text style={{ fontFamily: 'Sora_800ExtraBold', fontSize: 10.5, color: '#0B0D10' }}>
                      {Number(shop.rating).toFixed(1)}
                    </Text>
                  </View>
                </View>
                <View style={{ padding: 11 }}>
                  <Text style={{ fontFamily: 'Sora_700Bold', fontSize: 14, color: colors.text }} numberOfLines={1}>
                    {shop.name}
                  </Text>
                  <Text style={{ fontFamily: 'Sora_400Regular', fontSize: 11, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
                    {shop.cuisine} • {shop.deliveryTimeMin} min • {formatPrice(shop.priceForTwo)} for 2
                  </Text>
                  <Text style={{ fontFamily: 'Sora_600SemiBold', fontSize: 10.5, color: colors.partner, marginTop: 4 }} numberOfLines={1}>
                    📍 {shop.address}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Signature Feature A: "Feed Me" Smart Meal Planner Card */}
      {!hasFilters && (
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => {
            triggerHaptic('medium');
            setFeedMeVisible(true);
          }}
          style={styles.feedMeCard}
        >
          <LinearGradient
            colors={['#1B2416', '#141A1E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.feedMeGradient}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={styles.feedMeBadge}>
                <Ionicons name="sparkles" size={13} color={colors.primary} />
                <Text style={styles.feedMeBadgeText}>SMART FEAST CURATOR</Text>
              </View>
              <Text style={styles.feedMeTitle}>Feed Me — Smart Planner</Text>
              <Text style={styles.feedMeSub}>
                Enter your budget & party size. Our smart optimizer curates an optimal single-kitchen feast.
              </Text>
              <View style={styles.feedMeActionRow}>
                <View style={styles.feedMePill}>
                  <Text style={styles.feedMePillText}>Plan My Feast ⚡</Text>
                </View>
              </View>
            </View>
            <View style={styles.feedMeIconCircle}>
              <Text style={{ fontSize: 32 }}>🍱</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Hero Offer Banner */}
      {!hasFilters && topOffer && (
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => {
            triggerHaptic('medium');
            navigation.navigate('Offers');
          }}
        >
          <View style={styles.offer}>
            <View style={{ flex: 1 }}>
              <View style={styles.offerTag}>
                <Ionicons name="sparkles" size={12} color={colors.primary} />
                <Text style={styles.offerLabel}>EXCLUSIVE OFFER</Text>
              </View>
              <Text style={styles.offerTitle}>{topOffer.discountPercent}% OFF</Text>
              <Text style={styles.offerSub}>
                Up to {formatPrice(topOffer.maxDiscount)} on orders above {formatPrice(topOffer.minOrder)}
              </Text>
              <View style={styles.codePill}>
                <Text style={styles.codeText}>USE CODE: {topOffer.code}</Text>
              </View>
            </View>
            <View style={styles.offerGlowCircle}>
              <Text style={styles.offerEmoji}>🍋</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Signature Feature D: Mood Matcher */}
      {!hasFilters && (
        <View style={styles.moodSection}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.sectionTitle}>What's Your Vibe Today?</Text>
            </View>
            <Text style={styles.sectionSub}>Curated recommendations matched to your mood & cravings</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 10 }}
          >
            {MOODS.map((m) => {
              const active = activeMood === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  activeOpacity={0.85}
                  onPress={() => handleMoodSelect(m.key)}
                  style={[styles.moodChip, active && styles.moodChipActive]}
                >
                  <Text style={{ fontSize: 16 }}>{m.emoji}</Text>
                  <Text style={[styles.moodChipText, active && styles.moodChipTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Mood Dishes Carousel */}
          {moodLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 6 }}
            >
              {moodDishes.map((d) => (
                <TouchableOpacity
                  key={d.dishId}
                  activeOpacity={0.9}
                  style={styles.moodCard}
                  onPress={() => {
                    triggerHaptic('selection');
                    navigation.navigate('RestaurantDetail', { restaurantId: d.restaurantId });
                  }}
                >
                  <View style={styles.moodCardImgWrap}>
                    {d.dishImage ? (
                      <Image
                        source={{ uri: d.dishImage }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ fontSize: 32 }}>🍲</Text>
                      </View>
                    )}
                    <LinearGradient
                      colors={['transparent', 'rgba(11, 13, 16, 0.75)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.matchScoreBadge}>
                      <Text style={styles.matchScoreText}>{d.score}% Match</Text>
                    </View>
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text style={styles.dishName} numberOfLines={1}>
                      {d.dishName}
                    </Text>
                    <Text style={styles.moodReasonText} numberOfLines={1}>
                      {d.matchReason}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <Text style={styles.dishPrice}>{formatPrice(d.dishPrice)}</Text>
                      <Text style={styles.dishRest} numberOfLines={1}>
                        {d.restaurantName}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Featured / Popular Dishes */}
      {!hasFilters && dishes.length > 0 && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Gourmet Dishes</Text>
            <Text style={styles.sectionSub}>Curated across Pune's top kitchens</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 6 }}
          >
            {dishes.map((d) => (
              <TouchableOpacity
                key={d.id}
                activeOpacity={0.9}
                style={styles.dish}
                onPress={() => {
                  triggerHaptic('selection');
                  navigation.navigate('RestaurantDetail', { restaurantId: d.restaurantId });
                }}
              >
                <View style={styles.dishImageWrap}>
                  {d.imageUrl ? (
                    <Image
                      source={{ uri: d.imageUrl }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={250}
                    />
                  ) : (
                    <LinearGradient
                      colors={cuisineStyle(d.cuisine).colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    >
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 36 }}>{dishEmoji(d)}</Text>
                      </View>
                    </LinearGradient>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(11, 13, 16, 0.7)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View
                    style={[
                      styles.dishVegDot,
                      { backgroundColor: d.veg ? colors.veg : colors.nonVeg },
                    ]}
                  />
                </View>

                <View style={{ padding: 10 }}>
                  <Text style={styles.dishName} numberOfLines={1}>
                    {d.name}
                  </Text>
                  <Text style={styles.dishRest} numberOfLines={1}>
                    {d.restaurantName}
                  </Text>
                  <Text style={styles.dishPrice}>{formatPrice(d.price)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Restaurants Section Header */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.sectionTitleInline}>
            {hasFilters ? 'Filtered Restaurants' : 'Restaurants in Pune'}
          </Text>
          <Text style={styles.sectionSubtitleInline}>
            {hasFilters ? `${visible.length} matches found` : 'Verified OpenStreetMap locations'}
          </Text>
        </View>
        {!loading && !error && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{visible.length}</Text>
          </View>
        )}
      </View>

      {/* Sort Buttons */}
      <View style={styles.sortRow}>
        {SORTS.map((s) => {
          const active = sort === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              activeOpacity={0.85}
              onPress={() => handleSortPress(s.key)}
              style={[styles.sortPill, active && styles.sortPillActive]}
            >
              <Ionicons
                name={s.icon}
                size={12}
                color={active ? colors.primaryText : colors.textMuted}
              />
              <Text style={[styles.sortText, active && styles.sortTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const emptyView = loading ? (
    <View style={styles.skeletonContainer}>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
      <Text style={styles.loadingText}>Fetching Pune's top kitchens...</Text>
    </View>
  ) : error ? (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyEmoji}>📡</Text>
      <Text style={styles.emptyTitle}>Couldn't reach Zesto servers</Text>
      <Text style={styles.emptyText}>{error}</Text>
      <TouchableOpacity
        style={styles.retryBtn}
        onPress={() => {
          triggerHaptic('medium');
          setReloadKey((k) => k + 1);
        }}
      >
        <Text style={styles.retryText}>Retry Connection</Text>
      </TouchableOpacity>
    </View>
  ) : cuisine === 'FAV' ? (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyEmoji}>❤️</Text>
      <Text style={styles.emptyTitle}>No saved restaurants yet</Text>
      <Text style={styles.emptyText}>Tap the heart on any kitchen card to save it here</Text>
    </View>
  ) : (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={styles.emptyTitle}>No kitchens found</Text>
      <Text style={styles.emptyText}>Try searching for another dish, cuisine, or area</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerGreetingRow}>
            <Text style={styles.greeting}>Hey {firstName}</Text>
            <Text style={{ fontSize: 16 }}>🍋</Text>
          </View>
          <TouchableOpacity
            style={styles.addressRow}
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic('selection');
              navigation.navigate('Profile');
            }}
          >
            <Ionicons name="location-sharp" size={14} color={colors.primary} />
            <Text style={styles.addressText} numberOfLines={1}>
              {hasAddress ? user.address : 'Pune, Maharashtra (Set address)'}
            </Text>
            <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.avatarBtn}
          activeOpacity={0.85}
          onPress={() => {
            triggerHaptic('selection');
            navigation.navigate('Profile');
          }}
        >
          <Text style={styles.avatarText}>{firstName[0]?.toUpperCase() || 'U'}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarWrap}>
        <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
          <Ionicons
            name="search-outline"
            size={18}
            color={searchFocused ? colors.primary : colors.textMuted}
          />
          <TextInput
            placeholder="Search kitchens, dishes, cuisines..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                setQuery('');
              }}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Restaurant List */}
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={() => {
              triggerHaptic('selection');
              navigation.navigate('RestaurantDetail', { restaurantId: item.id });
            }}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyView}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              triggerHaptic('light');
              setRefreshing(true);
              setReloadKey((k) => k + 1);
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      {/* Phase 3 Feature A: Feed Me Smart Meal Planner Modal */}
      <Modal visible={feedMeVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>⚡ Feed Me — Smart Planner</Text>
                <Text style={styles.modalSubtitle}>Smart Multi-Dish Optimization</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setFeedMeVisible(false);
                }}
              >
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Budget Input */}
              <Text style={styles.fieldLabel}>Total Budget (₹)</Text>
              <View style={styles.quickBudgetRow}>
                {['300', '500', '800', '1200'].map((b) => (
                  <TouchableOpacity
                    key={b}
                    onPress={() => {
                      triggerHaptic('selection');
                      setBudgetInput(b);
                    }}
                    style={[styles.quickBudgetChip, budgetInput === b && styles.quickBudgetChipActive]}
                  >
                    <Text style={[styles.quickBudgetText, budgetInput === b && styles.quickBudgetTextActive]}>
                      ₹{b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={budgetInput}
                onChangeText={setBudgetInput}
                placeholder="Custom Budget in ₹"
                placeholderTextColor={colors.textMuted}
              />

              {/* Diners Count */}
              <Text style={styles.fieldLabel}>Number of Diners</Text>
              <View style={styles.quickBudgetRow}>
                {[1, 2, 4, 6].map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => {
                      triggerHaptic('selection');
                      setPeopleCount(p);
                    }}
                    style={[styles.quickBudgetChip, peopleCount === p && styles.quickBudgetChipActive]}
                  >
                    <Text style={[styles.quickBudgetText, peopleCount === p && styles.quickBudgetTextActive]}>
                      {p} {p === 1 ? 'Person' : 'People'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Diet Choice */}
              <Text style={styles.fieldLabel}>Dietary Preference</Text>
              <View style={styles.quickBudgetRow}>
                {[
                  { key: 'veg', label: '🥗 Pure Veg' },
                  { key: 'jain', label: '🌱 Jain' },
                  { key: 'any', label: '🍗 Non-Veg / Any' },
                ].map((d) => (
                  <TouchableOpacity
                    key={d.key}
                    onPress={() => {
                      triggerHaptic('selection');
                      setDietChoice(d.key);
                    }}
                    style={[styles.quickBudgetChip, dietChoice === d.key && styles.quickBudgetChipActive]}
                  >
                    <Text style={[styles.quickBudgetText, dietChoice === d.key && styles.quickBudgetTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Algorithm Strategy Choice */}
              <Text style={styles.fieldLabel}>Optimization Mode</Text>
              <View style={styles.quickBudgetRow}>
                {[
                  { key: 'knapsack', label: '🎯 Maximum Value & Portions' },
                  { key: 'greedy', label: '⚡ Maximum Variety' },
                ].map((st) => (
                  <TouchableOpacity
                    key={st.key}
                    onPress={() => {
                      triggerHaptic('selection');
                      setStrategyChoice(st.key);
                    }}
                    style={[styles.quickBudgetChip, strategyChoice === st.key && styles.quickBudgetChipActive]}
                  >
                    <Text style={[styles.quickBudgetText, strategyChoice === st.key && styles.quickBudgetTextActive]}>
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Results Preview */}
              {planResult && (
                <View style={styles.planCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.planRestName}>{planResult.restaurantName}</Text>
                    <Text style={styles.planTotalText}>₹{planResult.totalSpend}</Text>
                  </View>
                  <Text style={styles.planStrategyNote}>Algorithm: {planResult.strategyUsed}</Text>
                  <Text style={styles.planSavingsNote}>Savings: ₹{planResult.savings} remaining in budget</Text>

                  <View style={{ marginTop: 8, gap: 4 }}>
                    {planResult.items?.map((it, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Sora_400Regular' }}>
                          • {it.name}
                        </Text>
                        <Text style={{ color: colors.primary, fontSize: 13, fontFamily: 'Sora_600SemiBold' }}>
                          ₹{it.price}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.addPlanBtn}
                    onPress={handleAddPlanToCart}
                  >
                    <Text style={styles.addPlanBtnText}>Add All To Cart & Checkout 🛒</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.runPlanBtn}
                onPress={handleRunMealPlan}
                disabled={planning}
              >
                {planning ? (
                  <ActivityIndicator size="small" color={colors.primaryText} />
                ) : (
                  <Text style={styles.runPlanBtnText}>Generate Optimal Feast ⚡</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CartBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greeting: {
    fontFamily: 'Sora_700Bold',
    fontSize: 22,
    color: colors.text,
    letterSpacing: -0.5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  addressText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: colors.textMuted,
    maxWidth: 240,
  },
  avatarBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...limeGlow,
  },
  avatarText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 17,
    color: colors.primaryText,
  },
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  searchBoxFocused: {
    borderColor: colors.primary,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  chips: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...limeGlow,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.primaryText,
  },

  // Feed Me Smart Planner Styles
  feedMeCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 59, 0.3)',
  },
  feedMeGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  feedMeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  feedMeBadgeText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  feedMeTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 17,
    color: colors.text,
    marginBottom: 4,
  },
  feedMeSub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 10,
  },
  feedMeActionRow: {
    flexDirection: 'row',
  },
  feedMePill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    ...limeGlow,
  },
  feedMePillText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    color: colors.primaryText,
  },
  feedMeIconCircle: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(184, 242, 59, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Mood Matcher Styles
  moodSection: {
    marginBottom: 14,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moodChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  moodChipText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: colors.textMuted,
  },
  moodChipTextActive: {
    color: colors.primaryText,
  },
  moodCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  moodCardImgWrap: {
    height: 110,
    position: 'relative',
  },
  matchScoreBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  matchScoreText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    color: colors.primaryText,
  },
  moodReasonText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },

  // Hero Offer Banner
  offer: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 59, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  offerLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  offerTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 20,
    color: colors.text,
    letterSpacing: -0.5,
  },
  offerSub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  codePill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(184, 242, 59, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 59, 0.3)',
  },
  codeText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  offerGlowCircle: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(184, 242, 59, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerEmoji: {
    fontSize: 32,
  },

  // Trending Section
  sectionWrap: {
    marginBottom: 14,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 17,
    color: colors.text,
  },
  sectionSub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  dish: {
    width: 150,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dishImageWrap: {
    height: 100,
    position: 'relative',
  },
  dishVegDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  dishName: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
  dishRest: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  dishPrice: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: colors.primary,
    marginTop: 4,
  },

  // Titles & Sorts
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitleInline: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: colors.text,
  },
  sectionSubtitleInline: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    color: colors.primary,
  },
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    color: colors.textMuted,
  },
  sortTextActive: {
    color: colors.primaryText,
  },
  listContent: {
    paddingBottom: 100,
  },
  skeletonContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 14,
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: colors.text,
    marginTop: 12,
  },
  emptyText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...limeGlow,
  },
  retryText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: colors.primaryText,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: colors.text,
  },
  modalSubtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },
  fieldLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 12,
    marginBottom: 8,
  },
  quickBudgetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  quickBudgetChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickBudgetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickBudgetText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: colors.text,
  },
  quickBudgetTextActive: {
    color: colors.primaryText,
  },
  modalInput: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  planCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  planRestName: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
    color: colors.text,
  },
  planTotalText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: colors.primary,
  },
  planStrategyNote: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },
  planSavingsNote: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  addPlanBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: 'center',
    ...limeGlow,
  },
  addPlanBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: colors.primaryText,
  },
  modalActions: {
    marginTop: 16,
  },
  runPlanBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: radius.pill,
    alignItems: 'center',
    ...limeGlow,
  },
  runPlanBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: colors.primaryText,
  },
});
