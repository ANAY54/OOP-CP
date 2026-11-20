import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, limeGlow } from '../theme';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatPrice, triggerHaptic } from '../utils/helpers';

const STEPS = [
  { key: 'PLACED', label: 'Placed', icon: 'receipt-outline' },
  { key: 'PREPARING', label: 'Preparing', icon: 'restaurant-outline' },
  { key: 'OUT_FOR_DELIVERY', label: 'On Way', icon: 'bicycle' },
  { key: 'DELIVERED', label: 'Delivered', icon: 'checkmark' },
];

const PAYMENT_LABEL = { UPI: 'UPI', CARD: 'Card', CASH_ON_DELIVERY: 'Cash' };

function Tracker({ status }) {
  const index = STEPS.findIndex((s) => s.key === status);

  return (
    <View style={styles.tracker}>
      {STEPS.map((step, i) => {
        const done = i <= index;
        const current = i === index;
        return (
          <React.Fragment key={step.key}>
            <View style={styles.node}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  current && styles.dotCurrent,
                ]}
              >
                <Ionicons
                  name={step.icon}
                  size={14}
                  color={done ? colors.primaryText : colors.textMuted}
                />
              </View>
              <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>
                {step.label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.line, i < index && styles.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function OrderCard({ order, onCancel, cancelling, onTrackRider }) {
  const cancelled = order.status === 'CANCELLED';
  const delivered = order.status === 'DELIVERED';
  const summary = order.lines.map((l) => `${l.quantity}× ${l.name}`).join(', ');
  const stepIndex = STEPS.findIndex((s) => s.key === order.status);
  const chipLabel = cancelled ? 'Cancelled' : STEPS[stepIndex]?.label || order.status;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.restaurant} numberOfLines={1}>
            {order.restaurantName}
          </Text>
          <Text style={styles.orderId}>Order #{order.id}</Text>
        </View>
        <View
          style={[
            styles.chip,
            delivered && { backgroundColor: colors.successSoft, borderColor: 'rgba(61, 220, 151, 0.3)' },
            cancelled && { backgroundColor: colors.dangerSoft, borderColor: 'rgba(255, 92, 92, 0.3)' },
          ]}
        >
          <Text
            style={[
              styles.chipText,
              delivered && { color: colors.success },
              cancelled && { color: colors.danger },
            ]}
          >
            {chipLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.summary} numberOfLines={2}>
        {summary}
      </Text>

      {!cancelled && <Tracker status={order.status} />}

      {!cancelled && !delivered && (
        <View style={styles.liveRow}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={styles.liveText}>{order.statusLabel}</Text>
        </View>
      )}

      {/* Delivery Partner Attribution */}
      {order.deliveryPartner ? (
        <View style={styles.partnerRow}>
          <Ionicons name="bicycle" size={16} color={colors.primary} />
          <Text style={styles.partnerText}>
            Partner: {order.deliveryPartner.name} ({order.deliveryPartner.vehicle})
          </Text>
        </View>
      ) : null}

      {/* Cancel Order Action */}
      {order.status === 'PLACED' && (
        <View style={styles.cancelWrap}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => onCancel(order.id)}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Text style={styles.cancelText}>Cancel Order</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Phase 3 Feature F: Live Rider GPS Tracking Button */}
      {!cancelled && (
        <TouchableOpacity
          style={styles.trackRiderBtn}
          onPress={() => onTrackRider && onTrackRider(order)}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate-circle" size={16} color={colors.primary} />
          <Text style={styles.trackRiderText}>Live Rider GPS Tracking</Text>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <View style={styles.payWrap}>
          <Text style={styles.payText}>Payment: </Text>
          <Text style={styles.payMode}>
            {PAYMENT_LABEL[order.payment] || order.payment}
          </Text>
        </View>
        <Text style={styles.total}>{formatPrice(order.total)}</Text>
      </View>
    </View>
  );
}

export default function OrdersScreen({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  // Phase 3 Feature F: Live Rider GPS Tracking State
  const [activeTrackingOrder, setActiveTrackingOrder] = useState(null);
  const [riderData, setRiderData] = useState(null);
  const [riderModalVisible, setRiderModalVisible] = useState(false);

  useEffect(() => {
    if (!riderModalVisible || !activeTrackingOrder) return;
    let active = true;

    const fetchRider = async () => {
      try {
        const data = await api.riderLocation(activeTrackingOrder.id);
        if (active) setRiderData(data);
      } catch (ignored) {}
    };

    fetchRider();
    const interval = setInterval(fetchRider, 2500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [riderModalVisible, activeTrackingOrder]);

  const load = useCallback(
    async (silent = false) => {
      try {
        const data = await api.orders(user.email);
        setOrders(data);
        setError('');
      } catch (e) {
        if (!silent) setError(e.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user.email]
  );

  const handleCancel = (orderId) => {
    triggerHaptic('medium');
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(orderId);
            try {
              await api.cancelOrder(orderId, user.email);
              triggerHaptic('success');
              await load(true);
            } catch (e) {
              Alert.alert('Cannot Cancel', e.message);
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(() => load(true), 4000);
      return () => clearInterval(timer);
    }, [load])
  );

  const emptyView = loading ? (
    <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
  ) : error ? (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyEmoji}>📡</Text>
      <Text style={styles.emptyTitle}>Can't load orders</Text>
      <Text style={styles.emptyText}>{error}</Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => {
          triggerHaptic('medium');
          load();
        }}
      >
        <Text style={styles.emptyBtnText}>Try again</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyEmoji}>🧾</Text>
      <Text style={styles.emptyTitle}>No orders yet</Text>
      <Text style={styles.emptyText}>Orders you place will appear here with live tracking</Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => {
          triggerHaptic('selection');
          navigation.navigate('Home');
        }}
      >
        <Text style={styles.emptyBtnText}>Explore Kitchens</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Orders</Text>
        <Text style={styles.subtitle}>Real-time delivery updates • Auto-refreshes</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onCancel={handleCancel}
            cancelling={cancellingId === item.id}
            onTrackRider={(o) => {
              triggerHaptic('medium');
              setActiveTrackingOrder(o);
              setRiderModalVisible(true);
            }}
          />
        )}
        ListEmptyComponent={emptyView}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
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
      />

      {/* Phase 3 Feature F: Live Rider GPS Tracking Modal */}
      <Modal visible={riderModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🛵 Live Rider GPS Tracking</Text>
                <Text style={styles.modalSub}>Real-Time GPS Telemetry & ETA</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setRiderModalVisible(false);
                }}
              >
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {riderData ? (
              <View style={{ gap: 12 }}>
                {/* Rider & Partner Tile */}
                <View style={styles.riderTile}>
                  <View style={styles.riderAvatar}>
                    <Text style={{ fontSize: 24 }}>🛵</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.riderName}>{riderData.partnerName}</Text>
                    <Text style={styles.riderVehicle}>{riderData.vehicle} • Assigned Partner</Text>
                  </View>
                  <View style={styles.etaPill}>
                    <Text style={styles.etaText}>{riderData.etaMinutes} mins</Text>
                  </View>
                </View>

                {/* Progress Animation Simulation */}
                <View style={styles.mapSimContainer}>
                  <View style={styles.mapSimHeader}>
                    <Text style={styles.mapSimStatus}>{riderData.statusNote}</Text>
                    <Text style={styles.mapSimDist}>{riderData.distanceRemainingKm} km away</Text>
                  </View>
                  <View style={styles.trackBarBg}>
                    <View
                      style={[
                        styles.trackBarFill,
                        { width: `${Math.max(10, Math.min(100, Math.round(riderData.progressRatio * 100)))}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.trackEndpoints}>
                    <Text style={styles.endpointText}>🏪 {activeTrackingOrder?.restaurantName}</Text>
                    <Text style={styles.endpointText}>📍 You</Text>
                  </View>
                </View>

                {/* Live GPS Telemetry Box */}
                <View style={styles.gpsTelemetryBox}>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryLabel}>Interpolated Latitude:</Text>
                    <Text style={styles.telemetryValue}>{riderData.latitude}° N</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryLabel}>Interpolated Longitude:</Text>
                    <Text style={styles.telemetryValue}>{riderData.longitude}° E</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryLabel}>Telemetry Update:</Text>
                    <Text style={styles.telemetryValue}>Live telemetry stream active</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.textMuted, marginTop: 12, fontFamily: 'Sora_400Regular' }}>
                  Connecting to live rider telemetry...
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeRiderBtn}
              onPress={() => setRiderModalVisible(false)}
            >
              <Text style={styles.closeRiderBtnText}>Close Tracking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 28,
    color: colors.text,
  },
  subtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: colors.primary,
    marginTop: 2,
  },
  card: {
    padding: 18,
    marginBottom: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  restaurant: {
    fontFamily: 'Sora_700Bold',
    fontSize: 17,
    color: colors.text,
  },
  orderId: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 11,
    color: colors.primary,
  },
  summary: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 10,
    lineHeight: 18,
  },
  tracker: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 18,
  },
  node: {
    width: 64,
    alignItems: 'center',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotCurrent: {
    ...limeGlow,
  },
  stepLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
  },
  stepLabelDone: {
    color: colors.text,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginTop: 15,
  },
  lineDone: {
    backgroundColor: colors.primary,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 59, 0.2)',
  },
  liveText: {
    flex: 1,
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 8,
  },
  partnerText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  cancelWrap: {
    marginTop: 14,
    alignItems: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  cancelText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    color: colors.danger,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  payWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  payMode: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: colors.text,
  },
  total: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 17,
    color: colors.text,
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 50,
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
  emptyBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...limeGlow,
  },
  emptyBtnText: {
    fontFamily: 'Sora_700Bold',
    color: colors.primaryText,
    fontSize: 14,
  },
  trackRiderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(184, 242, 59, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 59, 0.3)',
  },
  trackRiderText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    color: colors.primary,
  },
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
  modalSub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },
  riderTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface2,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(184, 242, 59, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderName: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
    color: colors.text,
  },
  riderVehicle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  etaPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    ...limeGlow,
  },
  etaText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    color: colors.primaryText,
  },
  mapSimContainer: {
    backgroundColor: colors.surface2,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapSimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mapSimStatus: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  mapSimDist: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: colors.primary,
  },
  trackBarBg: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  trackEndpoints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  endpointText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  gpsTelemetryBox: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  telemetryLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  telemetryValue: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    color: colors.primary,
  },
  closeRiderBtn: {
    marginTop: 16,
    paddingVertical: 13,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  closeRiderBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: colors.text,
  },
});
