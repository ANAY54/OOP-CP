import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, limeGlow } from '../theme';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import {
  badgeColor,
  cuisineStyle,
  dishEmoji,
  formatCount,
  formatPrice,
  triggerHaptic,
} from '../utils/helpers';
import CartBar from '../components/CartBar';

const FILTERS = [
  { key: 'ALL', label: 'All Dishes', test: () => true },
  { key: 'VEG', label: 'Veg', test: (i) => i.category.startsWith('VEG') },
  { key: 'NONVEG', label: 'Non-veg', test: (i) => i.category === 'NON-VEG' },
  { key: 'DRINK', label: 'Drinks', test: (i) => i.category === 'BEVERAGE' },
];

function VegMark({ veg }) {
  const c = veg ? colors.veg : colors.nonVeg;
  return (
    <View style={[styles.vegBox, { borderColor: c }]}>
      <View style={[styles.vegDot, { backgroundColor: c }]} />
    </View>
  );
}

function MenuRow({ item, quantity, onAdd, onRemove, onViewRecipe }) {
  const theme = cuisineStyle(item.cuisine);

  return (
    <View style={styles.menuRow}>
      <View style={{ flex: 1, paddingRight: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <VegMark veg={item.veg} />
          <Text style={styles.itemCategory}>{item.category}</Text>
          <TouchableOpacity
            style={styles.recipePill}
            onPress={() => onViewRecipe && onViewRecipe(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.recipePillText}>👨‍🍳 Recipe</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
        {item.description ? (
          <Text style={styles.itemDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>

      <View style={{ alignItems: 'center' }}>
        <View style={styles.itemImageWrap}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <LinearGradient
              colors={theme.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            >
              <View style={styles.itemEmojiWrap}>
                <Text style={{ fontSize: 36 }}>{dishEmoji(item)}</Text>
              </View>
            </LinearGradient>
          )}
        </View>

        {/* Stepper or ADD button */}
        <View style={styles.actionWrap}>
          {quantity === 0 ? (
            <TouchableOpacity
              style={styles.addBtn}
              activeOpacity={0.85}
              onPress={() => {
                triggerHaptic('medium');
                onAdd();
              }}
            >
              <Text style={styles.addText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => {
                  triggerHaptic('light');
                  onRemove();
                }}
                hitSlop={8}
              >
                <Ionicons name="remove" size={16} color={colors.primaryText} />
              </TouchableOpacity>
              <Text style={styles.qty}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => {
                  triggerHaptic('medium');
                  onAdd();
                }}
                hitSlop={8}
              >
                <Ionicons name="add" size={16} color={colors.primaryText} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function RestaurantDetailScreen({ route, navigation }) {
  const { restaurantId } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addItem, removeItem, quantityOf } = useCart();
  const { isFavorite, toggle } = useFavorites();

  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [reloadKey, setReloadKey] = useState(0);
  const [offer, setOffer] = useState(null);

  // Reviews state
  const [reviewsData, setReviewsData] = useState({ count: 0, averageRating: 0, reviews: [] });
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Phase 3 Feature B: Cook It or Order It Recipe State
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  const handleOpenRecipe = async (dish) => {
    triggerHaptic('medium');
    setLoadingRecipe(true);
    setRecipeModalVisible(true);
    setActiveRecipe(null);
    try {
      const rec = await api.recipe(dish.id);
      setActiveRecipe(rec);
    } catch (e) {
      Alert.alert('Recipe', 'Could not fetch recipe details: ' + e.message);
      setRecipeModalVisible(false);
    } finally {
      setLoadingRecipe(false);
    }
  };

  useEffect(() => {
    api
      .offers()
      .then((list) => setOffer(list[0] || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError('');
    api
      .restaurant(restaurantId)
      .then((data) => {
        if (!cancelled) setRestaurant(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });

    api
      .reviews(restaurantId)
      .then((data) => {
        if (!cancelled && data) setReviewsData(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [restaurantId, reloadKey]);

  const handleReviewSubmit = async () => {
    if (!user) return;
    setSubmittingReview(true);
    try {
      await api.submitReview({
        restaurantId,
        restaurantName: restaurant?.name || '',
        email: user.email,
        rating: userRating,
        comment: userComment.trim(),
      });
      triggerHaptic('success');
      Alert.alert('Review Submitted', 'Thank you for your feedback!');
      setReviewModalVisible(false);
      setUserComment('');
      // Refresh reviews
      const updated = await api.reviews(restaurantId);
      setReviewsData(updated);
    } catch (e) {
      Alert.alert('Could Not Submit', e.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const backButton = (
    <TouchableOpacity
      style={[styles.floatingBackBtn, { top: insets.top + 10, left: 16 }]}
      activeOpacity={0.85}
      onPress={() => {
        triggerHaptic('selection');
        navigation.goBack();
      }}
    >
      <Ionicons name="arrow-back" size={20} color={colors.text} />
    </TouchableOpacity>
  );

  if (!restaurant) {
    return (
      <View style={styles.center}>
        {error ? (
          <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 48 }}>📡</Text>
            <Text style={styles.errTitle}>Couldn't load this restaurant</Text>
            <Text style={styles.errText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                triggerHaptic('medium');
                setReloadKey((k) => k + 1);
              }}
            >
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
        {backButton}
      </View>
    );
  }

  const theme = cuisineStyle(restaurant.cuisineKey);
  const fav = isFavorite(restaurant.id);
  const availableFilters = FILTERS.filter((f) => restaurant.menu.some(f.test));
  const activeFilter = FILTERS.find((f) => f.key === filter) || FILTERS[0];
  const items = restaurant.menu.filter(activeFilter.test);

  const header = (
    <View>
      {/* Hero Banner */}
      <View style={[styles.hero, { height: 240 + insets.top }]}>
        {restaurant.imageUrl ? (
          <Image
            source={{ uri: restaurant.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <LinearGradient
            colors={theme.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          >
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 72 }}>{theme.emoji}</Text>
            </View>
          </LinearGradient>
        )}
        <LinearGradient
          colors={['rgba(11, 13, 16, 0.3)', 'rgba(11, 13, 16, 0.95)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Restaurant Overview Card */}
      <View style={styles.infoCard}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{restaurant.name}</Text>
          {!!restaurant.badge && (
            <View style={[styles.badge, { backgroundColor: badgeColor(restaurant.badge) }]}>
              <Text style={styles.badgeText}>{restaurant.badge}</Text>
            </View>
          )}
        </View>

        <Text style={styles.sub}>
          {restaurant.cuisine} • {restaurant.address}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={12} color={colors.primaryText} />
            <Text style={styles.ratingText}>{Number(restaurant.rating).toFixed(1)}</Text>
          </View>
          <Text style={styles.statMuted}>({formatCount(restaurant.reviewCount)} reviews)</Text>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={15} color={colors.primary} />
            <Text style={styles.statText}>{restaurant.deliveryTimeMin} min</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="wallet-outline" size={15} color={colors.primary} />
            <Text style={styles.statText}>{formatPrice(restaurant.priceForTwo)} for two</Text>
          </View>
        </View>

        {restaurant.localBusiness && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: colors.partnerSoft,
              borderColor: colors.partnerBorder,
              borderWidth: 1,
              borderRadius: radius.md,
              paddingHorizontal: 12,
              paddingVertical: 9,
              marginTop: 12,
            }}
          >
            <Ionicons name="storefront" size={16} color={colors.partner} />
            <Text style={{ fontFamily: 'Sora_700Bold', fontSize: 12, color: colors.partner, flex: 1 }}>
              Verified {restaurant.businessTypeLabel || 'Local Business'}
              {restaurant.fssaiLicense ? ` • ${restaurant.fssaiLicense}` : ''}
            </Text>
          </View>
        )}

        {restaurant.pureVeg && (
          <View style={styles.pureVeg}>
            <Ionicons name="leaf" size={14} color={colors.veg} />
            <Text style={styles.pureVegText}>Pure vegetarian kitchen</Text>
          </View>
        )}

        {offer && (
          <View style={styles.offerStrip}>
            <Ionicons name="pricetag" size={15} color={colors.primary} />
            <Text style={styles.offerStripText} numberOfLines={1}>
              <Text style={{ fontFamily: 'Sora_700Bold', color: colors.primary }}>
                {offer.code}:
              </Text>{' '}
              {offer.discountPercent}% off up to {formatPrice(offer.maxDiscount)}
            </Text>
          </View>
        )}
      </View>

      {/* Menu Filters */}
      <Text style={styles.menuTitle}>Menu ({items.length})</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 14 }}
      >
        {availableFilters.map((f) => {
          const active = f.key === activeFilter.key;
          return (
            <TouchableOpacity
              key={f.key}
              activeOpacity={0.85}
              onPress={() => {
                triggerHaptic('selection');
                setFilter(f.key);
              }}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const reviewsSection = (
    <View style={styles.reviewsCard}>
      <View style={styles.reviewsHeader}>
        <View>
          <Text style={styles.reviewsTitle}>Customer Reviews</Text>
          <Text style={styles.reviewsSub}>
            ⭐ {Number(reviewsData.averageRating || restaurant.rating).toFixed(1)} / 5.0 (
            {reviewsData.count || restaurant.reviewCount} total)
          </Text>
        </View>
        <TouchableOpacity
          style={styles.writeReviewBtn}
          onPress={() => {
            triggerHaptic('medium');
            setReviewModalVisible(true);
          }}
        >
          <Ionicons name="create-outline" size={14} color={colors.primaryText} />
          <Text style={styles.writeReviewText}>Write Review</Text>
        </TouchableOpacity>
      </View>

      {reviewsData.reviews && reviewsData.reviews.length > 0 ? (
        reviewsData.reviews.map((r, i) => (
          <View key={r.id || i} style={styles.reviewItem}>
            <View style={styles.reviewTop}>
              <Text style={styles.reviewerName}>{r.customerName || 'Anonymous'}</Text>
              <View style={styles.reviewRatingPill}>
                <Ionicons name="star" size={10} color={colors.primaryText} />
                <Text style={styles.reviewRatingText}>{r.rating}</Text>
              </View>
            </View>
            <Text style={styles.reviewComment}>{r.comment || 'Great food!'}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.noReviewsText}>
          No reviews yet for this restaurant. Be the first to share your experience!
        </Text>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        ListFooterComponent={reviewsSection}
        renderItem={({ item }) => (
          <MenuRow
            item={item}
            quantity={quantityOf(item.id)}
            onAdd={() => addItem(restaurant, item)}
            onRemove={() => removeItem(item.id)}
            onViewRecipe={() => handleOpenRecipe(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No dishes match the selected filter</Text>
        }
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      />

      {backButton}

      {/* Floating Favorite Button */}
      <TouchableOpacity
        style={[styles.floatingFavBtn, { top: insets.top + 10, right: 16 }]}
        activeOpacity={0.85}
        onPress={() => {
          triggerHaptic('medium');
          toggle(restaurant.id);
        }}
      >
        <Ionicons
          name={fav ? 'heart' : 'heart-outline'}
          size={20}
          color={fav ? colors.coral : colors.text}
        />
      </TouchableOpacity>

      <CartBar bottom={insets.bottom + 12} />

      {/* Review Submission Modal */}
      <Modal visible={reviewModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate & Review</Text>
              <TouchableOpacity
                onPress={() => setReviewModalVisible(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalRestName}>{restaurant.name}</Text>
            <Text style={styles.modalSub}>How was your overall experience?</Text>

            {/* Star Selector */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    triggerHaptic('selection');
                    setUserRating(star);
                  }}
                  style={{ padding: 6 }}
                >
                  <Ionicons
                    name={star <= userRating ? 'star' : 'star-outline'}
                    size={32}
                    color={colors.amber}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Tell others what you loved about this food..."
              placeholderTextColor={colors.textMuted}
              value={userComment}
              onChangeText={setUserComment}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={styles.submitReviewBtn}
              onPress={handleReviewSubmit}
              disabled={submittingReview}
            >
              {submittingReview ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={styles.submitReviewBtnText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Phase 3 Feature B: "Order it or Cook it" Recipe Modal */}
      <Modal visible={recipeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  👨‍🍳 {activeRecipe?.name || 'Chef Recipe'}
                </Text>
                <Text style={styles.recipeAttributionText}>
                  {activeRecipe?.attribution || 'Verified recipe via TheMealDB API'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setRecipeModalVisible(false);
                }}
              >
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {loadingRecipe ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.textMuted, marginTop: 12, fontFamily: 'Sora_400Regular' }}>
                  Retrieving ingredients & chef instructions...
                </Text>
              </View>
            ) : activeRecipe ? (
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
                {activeRecipe.imageUrl ? (
                  <Image
                    source={{ uri: activeRecipe.imageUrl }}
                    style={styles.recipeHeroImg}
                    contentFit="cover"
                    transition={200}
                  />
                ) : null}

                <View style={styles.recipeDietRow}>
                  <View style={styles.recipeDietPill}>
                    <Text style={styles.recipeDietText}>{activeRecipe.dietary}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.recipeYoutubeBtn}
                    onPress={() => {
                      triggerHaptic('medium');
                      if (activeRecipe.youtubeUrl) {
                        Linking.openURL(activeRecipe.youtubeUrl);
                      }
                    }}
                  >
                    <Ionicons name="logo-youtube" size={16} color="#FF0000" />
                    <Text style={styles.recipeYoutubeText}>Watch on YouTube</Text>
                  </TouchableOpacity>
                </View>

                {/* Ingredients */}
                <Text style={styles.recipeSectionHeading}>Key Ingredients & Measures</Text>
                <View style={styles.recipeListWrap}>
                  {activeRecipe.ingredients?.map((ing, i) => (
                    <Text key={i} style={styles.recipeListItem}>
                      • {ing}
                    </Text>
                  ))}
                </View>

                {/* Instructions */}
                <Text style={styles.recipeSectionHeading}>Step-by-Step Cooking Method</Text>
                <View style={styles.recipeListWrap}>
                  {activeRecipe.instructions?.map((step, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <Text style={styles.recipeStepNum}>{i + 1}.</Text>
                      <Text style={[styles.recipeListItem, { flex: 1 }]}>{step}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : null}

            <TouchableOpacity
              style={styles.closeRecipeBtn}
              onPress={() => setRecipeModalVisible(false)}
            >
              <Text style={styles.closeRecipeBtnText}>Close Recipe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: colors.text,
    marginTop: 12,
  },
  errText: {
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
    color: colors.primaryText,
  },
  floatingBackBtn: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20, 24, 29, 0.85)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  floatingFavBtn: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20, 24, 29, 0.85)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  hero: {
    width: '100%',
    backgroundColor: colors.surface,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: -30,
    padding: 18,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 22,
    color: colors.text,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: {
    color: '#0B0D10',
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  sub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    backgroundColor: colors.amber,
  },
  ratingText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    color: colors.primaryText,
  },
  statMuted: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: colors.text,
  },
  pureVeg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.successSoft,
  },
  pureVegText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: colors.veg,
  },
  offerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 59, 0.25)',
  },
  offerStripText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.text,
  },
  menuTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: colors.text,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.primaryText,
  },
  menuRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vegBox: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemCategory: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    color: colors.textMuted,
  },
  itemName: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
    color: colors.text,
    marginTop: 4,
  },
  itemPrice: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  itemDesc: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  itemImageWrap: {
    width: 90,
    height: 70,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  itemEmojiWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionWrap: {
    marginTop: -14,
    zIndex: 2,
  },
  addBtn: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    ...limeGlow,
  },
  addText: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 12,
    color: colors.primaryText,
    letterSpacing: 0.5,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 8,
    ...limeGlow,
  },
  stepBtn: {
    padding: 3,
  },
  qty: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 13,
    color: colors.primaryText,
  },
  emptyText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
  reviewsCard: {
    marginHorizontal: 16,
    marginTop: 18,
    padding: 18,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  reviewsTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 17,
    color: colors.text,
  },
  reviewsSub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...limeGlow,
  },
  writeReviewText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 11,
    color: colors.primaryText,
  },
  reviewItem: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewerName: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
  reviewRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    backgroundColor: colors.amber,
  },
  reviewRatingText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    color: colors.primaryText,
  },
  reviewComment: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  noReviewsText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 20,
    color: colors.text,
  },
  modalRestName: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: colors.primary,
    marginTop: 10,
  },
  modalSub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 8,
  },
  commentInput: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 14,
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  submitReviewBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    ...limeGlow,
  },
  submitReviewBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
    color: colors.primaryText,
  },
  recipePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(184, 242, 59, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 59, 0.3)',
  },
  recipePillText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    color: colors.primary,
  },
  recipeAttributionText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  recipeHeroImg: {
    width: '100%',
    height: 160,
    borderRadius: radius.md,
    marginBottom: 12,
  },
  recipeDietRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  recipeDietPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
  },
  recipeDietText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    color: colors.text,
  },
  recipeYoutubeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recipeYoutubeText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: colors.text,
  },
  recipeSectionHeading: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: colors.text,
    marginTop: 10,
    marginBottom: 8,
  },
  recipeListWrap: {
    backgroundColor: colors.surface2,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  recipeListItem: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
    marginBottom: 4,
  },
  recipeStepNum: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: colors.primary,
  },
  closeRecipeBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  closeRecipeBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: colors.text,
  },
});
