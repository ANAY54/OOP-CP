import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, limeGlow } from '../theme';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { triggerHaptic } from '../utils/helpers';

function StatBox({ icon, value, label }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LinkRow({ icon, label, onPress, danger }) {
  return (
    <TouchableOpacity
      style={styles.linkRow}
      activeOpacity={0.8}
      onPress={() => {
        triggerHaptic('selection');
        onPress();
      }}
    >
      <View style={[styles.linkIcon, danger && { backgroundColor: colors.dangerSoft }]}>
        <Ionicons
          name={icon}
          size={18}
          color={danger ? colors.danger : colors.primary}
        />
      </View>
      <Text style={[styles.linkText, danger && { color: colors.danger }]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, signIn, signOut } = useAuth();
  const { ids } = useFavorites();

  const [orderCount, setOrderCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [achievements, setAchievements] = useState([]);

  const hasAddress = !!user?.address && user.address !== 'Not set';

  useFocusEffect(
    useCallback(() => {
      api
        .orders(user.email)
        .then((list) => setOrderCount(list.length))
        .catch(() => {});
      api
        .profile(user.email)
        .then(signIn)
        .catch(() => {});
      api
        .achievements(user.email)
        .then((data) => {
          if (Array.isArray(data)) setAchievements(data);
        })
        .catch(() => {});
    }, [user.email, signIn])
  );

  const startEditing = () => {
    triggerHaptic('selection');
    setDraft(hasAddress ? user.address : '');
    setError('');
    setEditing(true);
  };

  const saveAddress = async () => {
    const text = draft.trim();
    if (!text) {
      setError('Please enter an address');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await api.updateAddress(user.email, text);
      await signIn(updated);
      triggerHaptic('success');
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const useCurrentLocation = async () => {
    triggerHaptic('medium');
    setLocating(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Allow location access to detect your address in Pune.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const results = await Location.reverseGeocodeAsync(pos.coords);
      const p = results && results[0];
      if (!p) throw new Error('No address found');

      const parts = [p.name, p.street, p.district || p.subregion, p.city].filter(Boolean);
      const unique = parts.filter((part, i) => parts.indexOf(part) === i);
      if (unique.length === 0) throw new Error('No address found');
      setDraft(unique.join(', '));
      triggerHaptic('success');
    } catch (e) {
      Alert.alert('Could Not Detect Address', 'Please type it in manually.');
    } finally {
      setLocating(false);
    }
  };

  const confirmLogout = () => {
    triggerHaptic('medium');
    Alert.alert('Log out from Zesto?', 'You can sign back in anytime with your email.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          triggerHaptic('heavy');
          signOut();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.background} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Profile Hero */}
        <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'Z'}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Zesto User'}</Text>
          <Text style={styles.email}>{user?.email || 'user@zesto.in'}</Text>
          <View style={styles.goldPill}>
            <Text style={styles.goldPillText}>Zesto Gold Member • Pune</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatBox icon="sparkles" value={user?.loyaltyPoints ?? 0} label="Points" />
          <StatBox icon="receipt" value={orderCount} label="Orders" />
          <StatBox icon="heart" value={ids.length} label="Saved" />
        </View>

        {/* Delivery Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.card}>
            {!editing ? (
              <View style={styles.addressRow}>
                <View style={styles.pin}>
                  <Ionicons name="location" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressText}>
                    {hasAddress ? user.address : 'No address saved yet'}
                  </Text>
                  <Text style={styles.addressHint}>
                    Delivery distance and ETA are calculated from this location
                  </Text>
                </View>
                <TouchableOpacity onPress={startEditing} hitSlop={10}>
                  <Text style={styles.editText}>{hasAddress ? 'Edit' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ padding: 16 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Street, Landmark, Area in Pune (e.g. FC Road, Pune)"
                  placeholderTextColor={colors.textMuted}
                  value={draft}
                  onChangeText={(t) => {
                    setDraft(t);
                    setError('');
                  }}
                  multiline
                />

                <TouchableOpacity
                  style={styles.locateBtn}
                  activeOpacity={0.85}
                  onPress={useCurrentLocation}
                  disabled={locating}
                >
                  {locating ? (
                    <ActivityIndicator size="small" color={colors.primaryText} />
                  ) : (
                    <Ionicons name="locate" size={18} color={colors.primaryText} />
                  )}
                  <Text style={styles.locateText}>Detect GPS Location</Text>
                </TouchableOpacity>

                {!!error && <Text style={styles.error}>{error}</Text>}

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    activeOpacity={0.85}
                    onPress={() => setEditing(false)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                    activeOpacity={0.85}
                    onPress={saveAddress}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color={colors.primaryText} />
                    ) : (
                      <Text style={styles.saveText}>Save Address</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Phase 3 Feature E: Achievements & Streaks */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={styles.sectionTitle}>Achievements & Badges</Text>
            <View style={styles.achieveBadge}>
              <Text style={styles.achieveBadgeText}>Active Streaks & Trophies</Text>
            </View>
          </View>
          <View style={styles.card}>
            {achievements.length > 0 ? (
              achievements.map((ach, idx) => (
                <View
                  key={ach.id}
                  style={[
                    styles.achievementRow,
                    idx > 0 && styles.lineDivider,
                    ach.unlocked && styles.achievementRowUnlocked,
                  ]}
                >
                  <View style={styles.achieveIconCircle}>
                    <Text style={{ fontSize: 22 }}>{ach.icon}</Text>
                  </View>
                  <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.achieveTitle}>{ach.title}</Text>
                      {ach.unlocked && (
                        <View style={styles.unlockedPill}>
                          <Text style={styles.unlockedPillText}>UNLOCKED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.achieveDesc}>{ach.description}</Text>
                    {/* Progress Bar */}
                    <View style={styles.achieveProgressTrack}>
                      <View
                        style={[
                          styles.achieveProgressFill,
                          { width: `${Math.min(100, Math.round((ach.progress / ach.target) * 100))}%` },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.achieveRatioText}>
                    {ach.progress}/{ach.target}
                  </Text>
                </View>
              ))
            ) : (
              <ActivityIndicator color={colors.primary} style={{ padding: 14 }} />
            )}
          </View>
        </View>

        {/* Shortcuts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings & Account</Text>
          <View style={styles.card}>
            <LinkRow
              icon="receipt-outline"
              label="My Orders & Live Tracker"
              onPress={() => navigation.navigate('Orders')}
            />
            <View style={styles.divider} />
            <LinkRow
              icon="pricetag-outline"
              label="Discount Tiers & Coupons"
              onPress={() => navigation.navigate('Offers')}
            />
            <View style={styles.divider} />
            <LinkRow
              icon="map-outline"
              label="Explore Kitchens on Pune Map"
              onPress={() => navigation.navigate('Map')}
            />
            <View style={styles.divider} />
            <LinkRow
              icon="storefront-outline"
              label="Sell Food on Zesto (Partner Portal)"
              onPress={async () => {
                triggerHaptic('medium');
                try {
                  const res = await api.merchantLogin(user.name, user.email);
                  await signIn({ ...res.owner, role: 'BUSINESS_OWNER' });
                } catch (e) {
                  Alert.alert('Could Not Open Portal', e.message);
                }
              }}
            />
            <View style={styles.divider} />
            <LinkRow
              icon="information-circle-outline"
              label="About Zesto"
              onPress={() => setAboutModalVisible(true)}
            />
            <View style={styles.divider} />
            <LinkRow
              icon="log-out-outline"
              label="Sign Out / Switch Account"
              danger
              onPress={confirmLogout}
            />
          </View>
        </View>

        <Text style={styles.footer}>
          Zesto v2.0 • Pune's Premium Food Platform
        </Text>
      </ScrollView>

      {/* About & Data Sources Modal */}
      <Modal visible={aboutModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About Zesto</Text>
              <TouchableOpacity
                onPress={() => setAboutModalVisible(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380, marginTop: 12 }}>
              <Text style={styles.modalSectionTitle}>🏛️ Pune Restaurant Network</Text>
              <Text style={styles.modalText}>
                Pune restaurant names, geographic coordinates, and amenities are curated for
                the ultimate culinary tour of the city.
              </Text>

              <Text style={styles.modalSectionTitle}>🍲 Culinary Photography</Text>
              <Text style={styles.modalText}>
                Authentic dish photography, ingredients, and instructions are retrieved via
                TheMealDB free culinary database.
              </Text>

              <Text style={styles.modalSectionTitle}>⚙️ Smart Dynamic Ordering</Text>
              <Text style={styles.modalText}>
                Prices, customer star ratings, review counts, delivery partner dispatch, and rider
                tracking are calculated dynamically for a seamless offline-first experience.
              </Text>

              <Text style={styles.modalSectionTitle}>📐 Distance & Fees</Text>
              <Text style={styles.modalText}>
                Delivery fee and delivery times are computed using precise GPS routing
                from the customer's coordinates to the restaurant.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setAboutModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: colors.surface2,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...limeGlow,
  },
  avatarText: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 32,
    color: colors.primary,
  },
  name: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 22,
    color: colors.text,
  },
  email: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  goldPill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goldPillText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 20,
    color: colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 10,
  },
  card: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  pin: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: colors.text,
  },
  addressHint: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  editText: {
    fontFamily: 'Sora_700Bold',
    color: colors.primary,
    fontSize: 13,
  },
  input: {
    minHeight: 70,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    marginTop: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...limeGlow,
  },
  locateText: {
    fontFamily: 'Sora_700Bold',
    color: colors.primaryText,
    fontSize: 13,
  },
  error: {
    fontFamily: 'Sora_400Regular',
    color: colors.danger,
    fontSize: 12,
    marginTop: 8,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: 'Sora_600SemiBold',
    color: colors.textMuted,
    fontSize: 13,
  },
  saveBtn: {
    flex: 2,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontFamily: 'Sora_700Bold',
    color: colors.primaryText,
    fontSize: 13,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    flex: 1,
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 62,
  },
  footer: {
    textAlign: 'center',
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
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
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 18,
    color: colors.text,
  },
  modalSectionTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: colors.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  modalText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  modalCloseBtn: {
    marginTop: 18,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: colors.text,
  },
  achieveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(184, 242, 59, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 59, 0.3)',
  },
  achieveBadgeText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    color: colors.primary,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  achievementRowUnlocked: {
    backgroundColor: 'rgba(184, 242, 59, 0.04)',
  },
  lineDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  achieveIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achieveTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: colors.text,
  },
  unlockedPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  unlockedPillText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 9,
    color: colors.primaryText,
  },
  achieveDesc: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  achieveProgressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  achieveProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  achieveRatioText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    color: colors.primary,
    paddingLeft: 6,
  },
});
