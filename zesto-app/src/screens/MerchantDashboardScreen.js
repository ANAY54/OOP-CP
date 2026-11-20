import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatPrice, triggerHaptic } from '../utils/helpers';

const KITCHEN_PHOTOS = [
  {
    label: 'Home Kitchen',
    url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Cafe & Bakery',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Street Food',
    url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Cloud Kitchen',
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
  },
];

const DISH_PHOTOS = [
  {
    label: 'Thali / Indian',
    url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Snacks / Chaat',
    url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Biryani / Curry',
    url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Bakery / Sweet',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Drink / Cooler',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Burger / Fast Food',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
  },
];

export default function MerchantDashboardScreen() {
  const { user, signIn, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meta, setMeta] = useState({ areas: [], businessTypes: [], cuisines: [] });
  const [owner, setOwner] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Dashboard sub-tab: 'MENU' | 'ORDERS' | 'ANALYTICS'
  const [activeTab, setActiveTab] = useState('MENU');

  // Onboarding / Verification state
  const [bizName, setBizName] = useState('');
  const [bizType, setBizType] = useState('HOME_CHEF');
  const [bizCuisine, setBizCuisine] = useState('NORTH_INDIAN');
  const [bizArea, setBizArea] = useState('FC_ROAD');
  const [bizStreet, setBizStreet] = useState('');
  const [bizPriceForTwo, setBizPriceForTwo] = useState('300');
  const [bizEta, setBizEta] = useState('25');
  const [bizPhone, setBizPhone] = useState('9876543210');
  const [bizFssai, setBizFssai] = useState('');
  const [bizImage, setBizImage] = useState(KITCHEN_PHOTOS[0].url);
  const [bizPureVeg, setBizPureVeg] = useState(true);

  const [otpRequested, setOtpRequested] = useState(false);
  const [serverOtpHint, setServerOtpHint] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Add Item Modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishCategory, setDishCategory] = useState('VEG'); // VEG | JAIN | NON_VEG | BEVERAGE
  const [dishDesc, setDishDesc] = useState('');
  const [dishSpice, setDishSpice] = useState(2);
  const [dishSizeMl, setDishSizeMl] = useState('300');
  const [dishCold, setDishCold] = useState(true);
  const [dishImage, setDishImage] = useState(DISH_PHOTOS[0].url);
  const [addingDish, setAddingDish] = useState(false);

  // Storefront edit state
  const [savingStore, setSavingStore] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPriceForTwo, setEditPriceForTwo] = useState('300');
  const [editBadge, setEditBadge] = useState('');
  const [editArea, setEditArea] = useState('FC_ROAD');
  const [editOpen, setEditOpen] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user?.email) return;
    try {
      const [metaRes, dashRes] = await Promise.all([
        api.merchantMeta(),
        api.merchantDashboard(user.email),
      ]);
      setMeta(metaRes);
      setOwner(dashRes.owner);
      setRestaurant(dashRes.restaurant);
      setOrders(dashRes.orders || []);
      setAnalytics(dashRes.analytics || null);

      if (dashRes.restaurant) {
        setEditName(dashRes.restaurant.name || '');
        setEditAddress(dashRes.restaurant.address || '');
        setEditPriceForTwo(String(dashRes.restaurant.priceForTwo || 300));
        setEditBadge(dashRes.restaurant.badge || '');
        setEditArea(dashRes.restaurant.areaKey || 'FC_ROAD');
        setEditOpen(dashRes.restaurant.openForOrders !== false);
      }
    } catch (e) {
      // If server restarted, re-register merchant session quietly
      try {
        await api.merchantLogin(user.name, user.email);
        const [metaRes, dashRes] = await Promise.all([
          api.merchantMeta(),
          api.merchantDashboard(user.email),
        ]);
        setMeta(metaRes);
        setOwner(dashRes.owner);
        setRestaurant(dashRes.restaurant);
        setOrders(dashRes.orders || []);
        setAnalytics(dashRes.analytics || null);
      } catch (err) {
        setFormError(err.message || 'Unable to connect to Zesto server');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.email, user?.name]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Auto-refresh incoming orders every 5s when verified and on Orders tab
  useEffect(() => {
    if (!restaurant || activeTab !== 'ORDERS') return;
    const t = setInterval(() => {
      loadAll();
    }, 5000);
    return () => clearInterval(t);
  }, [restaurant, activeTab, loadAll]);

  // Step 1: Request 6-digit OTP from Java backend
  const handleRequestOtp = async () => {
    triggerHaptic('medium');
    setFormError('');
    if (!bizName.trim()) {
      setFormError('Please enter your restaurant or food business name');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.merchantVerifyRequest({
        email: user.email,
        phone: bizPhone,
        businessName: bizName.trim(),
        fssaiLicense: bizFssai.trim(),
      });
      setOtpRequested(true);
      setServerOtpHint(res.verificationCode);
      setOtpInput(res.verificationCode);
      if (res.fssaiLicense && !bizFssai.trim()) {
        setBizFssai(res.fssaiLicense);
      }
      triggerHaptic('success');
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Confirm OTP & Launch verified business live in Java DataCatalogService
  const handleConfirmVerify = async () => {
    triggerHaptic('medium');
    setFormError('');
    if (!otpInput.trim()) {
      setFormError('Enter the 6-digit verification code');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.merchantVerifyConfirm({
        email: user.email,
        otp: otpInput.trim(),
        businessName: bizName.trim(),
        businessType: bizType,
        cuisine: bizCuisine,
        areaKey: bizArea,
        address: bizStreet.trim(),
        priceForTwo: parseInt(bizPriceForTwo, 10) || 300,
        deliveryTimeMin: parseInt(bizEta, 10) || 25,
        fssaiLicense: bizFssai.trim(),
        phone: bizPhone.trim(),
        imageUrl: bizImage,
        pureVeg: bizPureVeg,
      });
      triggerHaptic('success');
      setOwner(res.owner);
      setRestaurant(res.restaurant);
      await signIn({ ...res.owner, role: 'BUSINESS_OWNER' });
      Alert.alert(
        'Kitchen Verified & Live!',
        `${res.restaurant.name} is now live on Zesto! Customers in Pune can find you on Home and on the Pune Food Map. Add your first dish now!`
      );
      loadAll();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDish = async () => {
    triggerHaptic('medium');
    if (!dishName.trim()) {
      Alert.alert('Missing Name', 'Please enter a dish name');
      return;
    }
    const priceNum = parseFloat(dishPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price in ₹');
      return;
    }
    setAddingDish(true);
    try {
      const res = await api.merchantAddItem({
        email: user.email,
        name: dishName.trim(),
        price: priceNum,
        category: dishCategory,
        description: dishDesc.trim(),
        jain: dishCategory === 'JAIN',
        spiceLevel: dishSpice,
        sizeMl: parseInt(dishSizeMl, 10) || 300,
        cold: dishCold,
        imageUrl: dishImage,
      });
      triggerHaptic('success');
      setRestaurant(res.restaurant);
      setDishName('');
      setDishPrice('');
      setDishDesc('');
      setAddModalVisible(false);
    } catch (e) {
      Alert.alert('Could Not Add Item', e.message);
    } finally {
      setAddingDish(false);
    }
  };

  const handleDeleteDish = (item) => {
    triggerHaptic('medium');
    Alert.alert(
      'Delete Menu Item?',
      `Remove "${item.name}" from your live menu?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.merchantDeleteItem(user.email, item.id);
              triggerHaptic('success');
              setRestaurant(res.restaurant);
            } catch (e) {
              Alert.alert('Delete Failed', e.message);
            }
          },
        },
      ]
    );
  };

  const handleAdvanceOrder = async (orderId) => {
    triggerHaptic('medium');
    try {
      await api.merchantAdvanceOrder(user.email, orderId);
      triggerHaptic('success');
      loadAll();
    } catch (e) {
      Alert.alert('Update Failed', e.message);
    }
  };

  const handleSaveStorefront = async (overrideOpen) => {
    triggerHaptic('medium');
    setSavingStore(true);
    try {
      const nextOpen = typeof overrideOpen === 'boolean' ? overrideOpen : editOpen;
      const res = await api.merchantUpdateBusiness({
        email: user.email,
        businessName: editName.trim() || restaurant.name,
        businessType: restaurant.businessType,
        cuisine: restaurant.cuisineKey,
        areaKey: editArea,
        address: editAddress.trim() || restaurant.address,
        priceForTwo: parseInt(editPriceForTwo, 10) || restaurant.priceForTwo,
        deliveryTimeMin: restaurant.deliveryTimeMin,
        badge: editBadge.trim() || restaurant.badge,
        imageUrl: restaurant.imageUrl,
        openForOrders: nextOpen,
      });
      setRestaurant(res.restaurant);
      setEditOpen(res.restaurant.openForOrders);
      triggerHaptic('success');
      if (typeof overrideOpen !== 'boolean') {
        Alert.alert('Storefront Updated', 'Your live kitchen details have been updated for Pune diners.');
      }
    } catch (e) {
      Alert.alert('Update Failed', e.message);
    } finally {
      setSavingStore(false);
    }
  };

  const handleSwitchToCustomer = async () => {
    triggerHaptic('medium');
    try {
      const cust = await api.login(user.name, user.email);
      await signIn({ ...cust, role: 'CUSTOMER' });
    } catch (e) {
      signOut();
    }
  };

  const handleSignOut = () => {
    triggerHaptic('medium');
    Alert.alert('Sign Out?', 'Switch accounts or log in as a Customer?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Browse as Customer', onPress: handleSwitchToCustomer },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <StatusBar style="light" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.partner} />
        <Text style={styles.loadingText}>Loading Zesto Partner Portal...</Text>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // VIEW A: BUSINESS VERIFICATION & KITCHEN ONBOARDING FLOW
  // =========================================================================
  if (!owner?.verified || !restaurant) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="light" backgroundColor={colors.background} />
        <ScrollView
          contentContainerStyle={styles.onboardScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar */}
          <View style={styles.topRow}>
            <View style={styles.partnerPill}>
              <Ionicons name="storefront" size={14} color={colors.partner} />
              <Text style={styles.partnerPillText}>ZESTO PARTNER ONBOARDING</Text>
            </View>
            <TouchableOpacity style={styles.logoutChip} onPress={handleSignOut}>
              <Ionicons name="swap-horizontal" size={15} color={colors.text} />
              <Text style={styles.logoutChipText}>Switch</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.onboardTitle}>Verify & Launch Your Food Business</Text>
          <Text style={styles.onboardSub}>
            Signed in as {user?.name} ({user?.email}). Complete verification to get your Verified Local Partner badge on Zesto.
          </Text>

          {formError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          ) : null}

          {/* Business Details Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Restaurant / Business Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Anay's Cloud Kitchen, Pune Spice Box"
              placeholderTextColor={colors.textMuted}
              value={bizName}
              onChangeText={setBizName}
            />

            <Text style={styles.label}>Business Category</Text>
            <View style={styles.chipsWrap}>
              {(meta.businessTypes || []).map((bt) => {
                const active = bizType === bt.key;
                return (
                  <TouchableOpacity
                    key={bt.key}
                    style={[styles.chip, active && styles.chipActiveCyan]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setBizType(bt.key);
                    }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextDark]}>{bt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Primary Cuisine</Text>
            <View style={styles.chipsWrap}>
              {(meta.cuisines || []).map((c) => {
                const active = bizCuisine === c.key;
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.chip, active && styles.chipActiveLime]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setBizCuisine(c.key);
                    }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextDark]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Pune Neighborhood (Auto GPS Map Pin)</Text>
            <View style={styles.chipsWrap}>
              {(meta.areas || []).map((a) => {
                const active = bizArea === a.key;
                return (
                  <TouchableOpacity
                    key={a.key}
                    style={[styles.chip, active && styles.chipActiveCyan]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setBizArea(a.key);
                    }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextDark]}>
                      {a.label.split(',')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Shop / Landmark Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Shop 4, Lane 2, Near Symbiosis"
              placeholderTextColor={colors.textMuted}
              value={bizStreet}
              onChangeText={setBizStreet}
            />

            <View style={styles.rowTwo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Price for Two (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={bizPriceForTwo}
                  onChangeText={setBizPriceForTwo}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Prep Time (min)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={bizEta}
                  onChangeText={setBizEta}
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchTitle}>Pure Vegetarian Kitchen</Text>
                <Text style={styles.switchSub}>Displays green leaf badge to diners</Text>
              </View>
              <Switch
                value={bizPureVeg}
                onValueChange={setBizPureVeg}
                trackColor={{ false: colors.border, true: colors.veg }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Text style={styles.label}>Cover Photo Style</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {KITCHEN_PHOTOS.map((p) => {
                const selected = bizImage === p.url;
                return (
                  <TouchableOpacity
                    key={p.label}
                    style={[styles.photoPick, selected && styles.photoPickActive]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setBizImage(p.url);
                    }}
                  >
                    <Image source={{ uri: p.url }} style={styles.photoThumb} contentFit="cover" />
                    <Text style={styles.photoLabel}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Identity & Phone OTP Verification Card */}
          <View style={styles.card}>
            <View style={styles.verifyHeader}>
              <Ionicons name="shield-checkmark" size={20} color={colors.partner} />
              <Text style={styles.verifyTitle}>Partner Identity Verification</Text>
            </View>

            <Text style={styles.label}>Owner Mobile Number (10 digits) *</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              placeholder="9876543210"
              placeholderTextColor={colors.textMuted}
              value={bizPhone}
              onChangeText={setBizPhone}
            />

            <Text style={styles.label}>FSSAI License / Home Chef Permit (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Auto-issued if left blank"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              value={bizFssai}
              onChangeText={setBizFssai}
            />

            {!otpRequested ? (
              <TouchableOpacity
                style={styles.cyanBtn}
                activeOpacity={0.88}
                onPress={handleRequestOtp}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#0B0D10" />
                ) : (
                  <>
                    <Ionicons name="key-outline" size={18} color="#0B0D10" />
                    <Text style={styles.cyanBtnText}>Generate Verification Code</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.otpBox}>
                <View style={styles.otpBanner}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  <Text style={styles.otpBannerText}>
                    Verification Code Issued: <Text style={{ fontWeight: '800', color: colors.primary }}>{serverOtpHint}</Text>
                  </Text>
                </View>

                <Text style={styles.label}>Enter 6-Digit Verification Code</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  keyboardType="numeric"
                  maxLength={6}
                  value={otpInput}
                  onChangeText={setOtpInput}
                  placeholder="6-digit OTP"
                  placeholderTextColor={colors.textMuted}
                />

                <TouchableOpacity
                  style={styles.limeBtn}
                  activeOpacity={0.88}
                  onPress={handleConfirmVerify}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#0B0D10" />
                  ) : (
                    <>
                      <Ionicons name="rocket-outline" size={18} color="#0B0D10" />
                      <Text style={styles.limeBtnText}>Verify & Launch My Kitchen</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // VIEW B: VERIFIED BUSINESS OWNER PARTNER DASHBOARD
  // =========================================================================
  const menuItems = restaurant.menu || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" backgroundColor={colors.background} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAll();
            }}
            tintColor={colors.partner}
            colors={[colors.partner]}
          />
        }
      >
        {/* Storefront Hero Banner */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: restaurant.imageUrl }} style={styles.heroImg} contentFit="cover" />
          <LinearGradient
            colors={['rgba(11,13,16,0.35)', 'rgba(11,13,16,0.96)']}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.heroTopActions}>
            <View style={styles.verifiedBadge}>
              <Ionicons name="storefront" size={13} color="#0B0D10" />
              <Text style={styles.verifiedBadgeText}>VERIFIED LOCAL PARTNER</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={styles.topActionBtn} onPress={handleSwitchToCustomer}>
                <Ionicons name="eye-outline" size={15} color={colors.primary} />
                <Text style={styles.topActionText}>Customer View</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.topIconBtn} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroBottom}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{restaurant.name}</Text>
              <Text style={styles.heroSub}>
                {restaurant.businessTypeLabel || 'Local Kitchen'} • {restaurant.cuisine} • {restaurant.address}
              </Text>
              {owner.fssaiLicense ? (
                <Text style={styles.fssaiText}>License: {owner.fssaiLicense}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[
                styles.openTogglePill,
                restaurant.openForOrders ? styles.openPillOn : styles.openPillOff,
              ]}
              onPress={() => handleSaveStorefront(!restaurant.openForOrders)}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: restaurant.openForOrders ? colors.success : colors.danger },
                ]}
              />
              <Text style={styles.openPillText}>
                {restaurant.openForOrders ? 'LIVE' : 'PAUSED'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats Strip */}
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatVal}>{menuItems.length}</Text>
            <Text style={styles.quickStatLabel}>Live Dishes</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={[styles.quickStatVal, { color: colors.partner }]}>
              {analytics?.totalOrders ?? 0}
            </Text>
            <Text style={styles.quickStatLabel}>Orders</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={[styles.quickStatVal, { color: colors.primary }]}>
              {formatPrice(analytics?.netPayout ?? 0)}
            </Text>
            <Text style={styles.quickStatLabel}>Net Payout</Text>
          </View>
        </View>

        {/* Internal Partner Navigation Tabs */}
        <View style={styles.tabsRow}>
          {[
            { key: 'MENU', label: `Menu (${menuItems.length})`, icon: 'restaurant-outline' },
            { key: 'ORDERS', label: `Orders (${orders.length})`, icon: 'receipt-outline' },
            { key: 'ANALYTICS', label: 'Analytics & Shop', icon: 'stats-chart-outline' },
          ].map((t) => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabPill, active && styles.tabPillActive]}
                onPress={() => {
                  triggerHaptic('selection');
                  setActiveTab(t.key);
                }}
              >
                <Ionicons
                  name={t.icon}
                  size={15}
                  color={active ? '#0B0D10' : colors.textMuted}
                />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TAB 1: MENU MANAGEMENT */}
        {activeTab === 'MENU' && (
          <View style={styles.sectionPad}>
            <TouchableOpacity
              style={styles.addDishBtn}
              activeOpacity={0.88}
              onPress={() => {
                triggerHaptic('medium');
                setAddModalVisible(true);
              }}
            >
              <Ionicons name="add-circle" size={20} color="#0B0D10" />
              <Text style={styles.addDishBtnText}>Add New Dish to Live Menu</Text>
            </TouchableOpacity>

            {menuItems.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="fast-food-outline" size={38} color={colors.partner} />
                <Text style={styles.emptyTitle}>Your menu is empty</Text>
                <Text style={styles.emptySub}>
                  Tap "Add New Dish" above to add your homemade specialties with custom prices. They go live to customers immediately!
                </Text>
              </View>
            ) : (
              menuItems.map((item) => (
                <View key={item.id} style={styles.dishCard}>
                  <Image source={{ uri: item.imageUrl }} style={styles.dishThumb} contentFit="cover" />
                  <View style={{ flex: 1, paddingHorizontal: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View
                        style={[
                          styles.vegDotBox,
                          { borderColor: item.veg ? colors.veg : colors.nonVeg },
                        ]}
                      >
                        <View
                          style={[
                            styles.vegDot,
                            { backgroundColor: item.veg ? colors.veg : colors.nonVeg },
                          ]}
                        />
                      </View>
                      <Text style={styles.dishCat}>{item.category}</Text>
                    </View>
                    <Text style={styles.dishTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.dishPrice}>{formatPrice(item.price)}</Text>
                    {item.description ? (
                      <Text style={styles.dishDesc} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteDish(item)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 2: LIVE INCOMING CUSTOMER ORDERS */}
        {activeTab === 'ORDERS' && (
          <View style={styles.sectionPad}>
            {orders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={38} color={colors.partner} />
                <Text style={styles.emptyTitle}>No customer orders yet</Text>
                <Text style={styles.emptySub}>
                  Tap "Customer View" at the top right, find {restaurant.name}, and place a test order — it will appear here in real time!
                </Text>
              </View>
            ) : (
              orders.map((ord) => {
                const canAdvance = ord.status !== 'DELIVERED' && ord.status !== 'CANCELLED';
                return (
                  <View key={ord.id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View>
                        <Text style={styles.orderId}>Order #{ord.id}</Text>
                        <Text style={styles.orderCustomer}>
                          {ord.customerName || 'Customer'} • {ord.payment}
                        </Text>
                      </View>
                      <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>{ord.statusLabel}</Text>
                      </View>
                    </View>

                    <View style={styles.orderLines}>
                      {(ord.lines || []).map((l, idx) => (
                        <Text key={idx} style={styles.orderLineText}>
                          {l.quantity} × {l.name} — {formatPrice(l.lineTotal)}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.orderFooter}>
                      <Text style={styles.orderTotal}>Kitchen Earnings: {formatPrice(ord.subtotal)}</Text>
                      {canAdvance && (
                        <TouchableOpacity
                          style={styles.advanceBtn}
                          onPress={() => handleAdvanceOrder(ord.id)}
                        >
                          <Text style={styles.advanceBtnText}>Next Stage →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB 3: ANALYTICS & EDIT STOREFRONT */}
        {activeTab === 'ANALYTICS' && (
          <View style={styles.sectionPad}>
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Kitchen Revenue & Insights</Text>
              <View style={styles.analyticsGrid}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Gross Sales</Text>
                  <Text style={styles.metricVal}>{formatPrice(analytics?.grossRevenue ?? 0)}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Platform Fee (8%)</Text>
                  <Text style={[styles.metricVal, { color: colors.amber }]}>
                    -{formatPrice(analytics?.platformFee ?? 0)}
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Your Net Payout</Text>
                  <Text style={[styles.metricVal, { color: colors.primary }]}>
                    {formatPrice(analytics?.netPayout ?? 0)}
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Items Sold</Text>
                  <Text style={[styles.metricVal, { color: colors.partner }]}>
                    {analytics?.totalItemsSold ?? 0}
                  </Text>
                </View>
              </View>
              <View style={styles.topDishStrip}>
                <Ionicons name="trophy" size={16} color={colors.amber} />
                <Text style={styles.topDishText}>
                  Top Seller: <Text style={{ color: colors.text, fontWeight: '700' }}>{analytics?.topSellingDish || 'No orders yet'}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Edit Business Storefront</Text>
              <Text style={styles.label}>Business Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
              />
              <Text style={styles.label}>Address / Landmark</Text>
              <TextInput
                style={styles.input}
                value={editAddress}
                onChangeText={setEditAddress}
              />
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Price for Two (₹)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={editPriceForTwo}
                    onChangeText={setEditPriceForTwo}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Highlight Badge</Text>
                  <TextInput
                    style={styles.input}
                    value={editBadge}
                    onChangeText={setEditBadge}
                    placeholder="e.g. Fresh Today"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.cyanBtn}
                onPress={() => handleSaveStorefront()}
                disabled={savingStore}
              >
                {savingStore ? (
                  <ActivityIndicator color="#0B0D10" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#0B0D10" />
                    <Text style={styles.cyanBtnText}>Save Storefront Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ADD NEW DISH MODAL */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Menu Item</Text>
                <Text style={styles.modalSub}>Published instantly to Zesto diners</Text>
              </View>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              <Text style={styles.label}>Dish Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Homemade Paneer Paratha"
                placeholderTextColor={colors.textMuted}
                value={dishName}
                onChangeText={setDishName}
              />

              <Text style={styles.label}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. 140"
                placeholderTextColor={colors.textMuted}
                value={dishPrice}
                onChangeText={setDishPrice}
              />

              <Text style={styles.label}>Dietary / Item Type</Text>
              <View style={styles.chipsWrap}>
                {[
                  { key: 'VEG', label: '🥗 Veg' },
                  { key: 'JAIN', label: '🌱 Jain' },
                  { key: 'NON_VEG', label: '🍗 Non-Veg' },
                  { key: 'BEVERAGE', label: '🥤 Drink' },
                ].map((cat) => {
                  const active = dishCategory === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.chip, active && styles.chipActiveLime]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setDishCategory(cat.key);
                      }}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextDark]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {dishCategory === 'NON_VEG' && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.label}>Spice Level</Text>
                  <View style={styles.chipsWrap}>
                    {[1, 2, 3].map((lvl) => (
                      <TouchableOpacity
                        key={lvl}
                        style={[styles.chip, dishSpice === lvl && styles.chipActiveCyan]}
                        onPress={() => setDishSpice(lvl)}
                      >
                        <Text style={[styles.chipText, dishSpice === lvl && styles.chipTextDark]}>
                          {'🌶️'.repeat(lvl)} {lvl === 1 ? 'Mild' : lvl === 2 ? 'Medium' : 'Fiery'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {dishCategory === 'BEVERAGE' && (
                <View style={styles.rowTwo}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Size (ml)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={dishSizeMl}
                      onChangeText={setDishSizeMl}
                    />
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.label}>Served Chilled?</Text>
                    <Switch
                      value={dishCold}
                      onValueChange={setDishCold}
                      trackColor={{ false: colors.border, true: colors.partner }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              )}

              <Text style={styles.label}>Short Description</Text>
              <TextInput
                style={[styles.input, { minHeight: 68, textAlignVertical: 'top' }]}
                multiline
                placeholder="Describe ingredients, portion size, or homemade secret..."
                placeholderTextColor={colors.textMuted}
                value={dishDesc}
                onChangeText={setDishDesc}
              />

              <Text style={styles.label}>Dish Photo</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {DISH_PHOTOS.map((p) => {
                  const selected = dishImage === p.url;
                  return (
                    <TouchableOpacity
                      key={p.label}
                      style={[styles.photoPick, selected && styles.photoPickActive]}
                      onPress={() => setDishImage(p.url)}
                    >
                      <Image source={{ uri: p.url }} style={styles.photoThumb} contentFit="cover" />
                      <Text style={styles.photoLabel}>{p.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </ScrollView>

            <TouchableOpacity
              style={styles.limeBtn}
              onPress={handleAddDish}
              disabled={addingDish}
            >
              {addingDish ? (
                <ActivityIndicator color="#0B0D10" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#0B0D10" />
                  <Text style={styles.limeBtnText}>Publish Dish to Menu</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textMuted,
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
  },
  onboardScroll: { padding: 18, paddingBottom: 48 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  partnerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.partnerSoft,
    borderColor: colors.partnerBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  partnerPillText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    color: colors.partner,
    letterSpacing: 1,
  },
  logoutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutChipText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: colors.text,
  },
  onboardTitle: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 24,
    color: colors.text,
  },
  onboardSub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,92,92,0.3)',
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 14,
  },
  errorText: {
    fontFamily: 'Sora_400Regular',
    color: colors.danger,
    fontSize: 12.5,
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.text,
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    marginBottom: 10,
  },
  rowTwo: { flexDirection: 'row', gap: 12 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActiveCyan: {
    backgroundColor: colors.partner,
    borderColor: colors.partner,
  },
  chipActiveLime: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11.5,
    color: colors.textMuted,
  },
  chipTextDark: { color: '#0B0D10' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 6,
  },
  switchTitle: { fontFamily: 'Sora_600SemiBold', fontSize: 13.5, color: colors.text },
  switchSub: { fontFamily: 'Sora_400Regular', fontSize: 11, color: colors.textMuted },
  photoPick: {
    width: 96,
    marginRight: 10,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  photoPickActive: { borderColor: colors.partner },
  photoThumb: { width: '100%', height: 64 },
  photoLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    color: colors.text,
    textAlign: 'center',
    paddingVertical: 4,
  },
  verifyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  verifyTitle: { fontFamily: 'Sora_700Bold', fontSize: 16, color: colors.text },
  cyanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.partner,
    borderRadius: radius.pill,
    paddingVertical: 14,
    marginTop: 6,
  },
  cyanBtnText: { fontFamily: 'Sora_700Bold', fontSize: 14, color: '#0B0D10' },
  limeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 14,
    marginTop: 6,
  },
  limeBtnText: { fontFamily: 'Sora_700Bold', fontSize: 14, color: '#0B0D10' },
  otpBox: { marginTop: 8 },
  otpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoftBorder,
    borderWidth: 1,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 10,
  },
  otpBannerText: { fontFamily: 'Sora_600SemiBold', fontSize: 12.5, color: colors.text, flex: 1 },
  otpInput: {
    fontSize: 20,
    letterSpacing: 6,
    textAlign: 'center',
    fontFamily: 'Sora_800ExtraBold',
  },
  // Dashboard Hero
  heroWrap: {
    height: 220,
    position: 'relative',
    justifyContent: 'space-between',
    padding: 16,
  },
  heroImg: { ...StyleSheet.absoluteFillObject },
  heroTopActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.partner,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  verifiedBadgeText: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 9.5,
    color: '#0B0D10',
    letterSpacing: 0.7,
  },
  topActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(20,24,29,0.88)',
    borderWidth: 1,
    borderColor: colors.primarySoftBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  topActionText: { fontFamily: 'Sora_700Bold', fontSize: 11, color: colors.primary },
  topIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(20,24,29,0.88)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  heroTitle: { fontFamily: 'Sora_800ExtraBold', fontSize: 24, color: '#FFFFFF' },
  heroSub: { fontFamily: 'Sora_400Regular', fontSize: 12, color: '#CBD5E1', marginTop: 2 },
  fssaiText: { fontFamily: 'Sora_600SemiBold', fontSize: 10.5, color: colors.partner, marginTop: 4 },
  openTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  openPillOn: { backgroundColor: 'rgba(61,220,151,0.16)', borderColor: colors.success },
  openPillOff: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  openPillText: { fontFamily: 'Sora_800ExtraBold', fontSize: 11, color: '#FFFFFF' },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickStatVal: { fontFamily: 'Sora_800ExtraBold', fontSize: 18, color: colors.text },
  quickStatLabel: { fontFamily: 'Sora_400Regular', fontSize: 11, color: colors.textMuted, marginTop: 2 },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 14,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabPillActive: {
    backgroundColor: colors.partner,
    borderColor: colors.partner,
  },
  tabText: { fontFamily: 'Sora_700Bold', fontSize: 11.5, color: colors.textMuted },
  tabTextActive: { color: '#0B0D10' },
  sectionPad: { paddingHorizontal: 16 },
  addDishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 14,
    marginBottom: 14,
  },
  addDishBtnText: { fontFamily: 'Sora_800ExtraBold', fontSize: 14, color: '#0B0D10' },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontFamily: 'Sora_700Bold', fontSize: 16, color: colors.text, marginTop: 10 },
  emptySub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dishThumb: { width: 72, height: 72, borderRadius: 14 },
  vegDotBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  dishCat: { fontFamily: 'Sora_700Bold', fontSize: 10, color: colors.textMuted },
  dishTitle: { fontFamily: 'Sora_700Bold', fontSize: 15, color: colors.text, marginTop: 3 },
  dishPrice: { fontFamily: 'Sora_800ExtraBold', fontSize: 14, color: colors.primary, marginTop: 2 },
  dishDesc: { fontFamily: 'Sora_400Regular', fontSize: 11.5, color: colors.textMuted, marginTop: 3 },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontFamily: 'Sora_800ExtraBold', fontSize: 15, color: colors.text },
  orderCustomer: { fontFamily: 'Sora_400Regular', fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusPill: {
    backgroundColor: colors.partnerSoft,
    borderColor: colors.partnerBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusPillText: { fontFamily: 'Sora_700Bold', fontSize: 11, color: colors.partner },
  orderLines: {
    marginVertical: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  orderLineText: { fontFamily: 'Sora_400Regular', fontSize: 13, color: colors.text },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTotal: { fontFamily: 'Sora_700Bold', fontSize: 13.5, color: colors.primary },
  advanceBtn: {
    backgroundColor: colors.partner,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  advanceBtnText: { fontFamily: 'Sora_800ExtraBold', fontSize: 12, color: '#0B0D10' },
  sectionHeading: { fontFamily: 'Sora_700Bold', fontSize: 16, color: colors.text, marginBottom: 12 },
  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricBox: {
    width: '48%',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: { fontFamily: 'Sora_400Regular', fontSize: 11, color: colors.textMuted },
  metricVal: { fontFamily: 'Sora_800ExtraBold', fontSize: 17, color: colors.text, marginTop: 4 },
  topDishStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topDishText: { fontFamily: 'Sora_400Regular', fontSize: 12.5, color: colors.textMuted, flex: 1 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
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
    marginBottom: 12,
  },
  modalTitle: { fontFamily: 'Sora_800ExtraBold', fontSize: 19, color: colors.text },
  modalSub: { fontFamily: 'Sora_400Regular', fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
