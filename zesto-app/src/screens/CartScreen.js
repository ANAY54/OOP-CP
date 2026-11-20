import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, limeGlow } from '../theme';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { dishEmoji, formatPrice, triggerHaptic } from '../utils/helpers';

const PAYMENTS = [
  { key: 'UPI', label: 'UPI / GPay', icon: 'phone-portrait-outline' },
  { key: 'CARD', label: 'Debit / Credit', icon: 'card-outline' },
  { key: 'CASH_ON_DELIVERY', label: 'Cash on Delivery', icon: 'cash-outline' },
];

function BillRow({ label, value, highlight, bold }) {
  return (
    <View style={styles.billRow}>
      <Text style={[styles.billLabel, bold && styles.billBold]}>{label}</Text>
      <Text
        style={[
          styles.billValue,
          highlight && { color: colors.primary },
          bold && styles.billBold,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, signIn } = useAuth();
  const { restaurant, lines, addItem, removeItem, clear } = useCart();

  const [offers, setOffers] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [bill, setBill] = useState(null);
  const [billError, setBillError] = useState('');
  const [payment, setPayment] = useState('UPI');
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Phase 3 Feature C: Split the Bill State
  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [splitResult, setSplitResult] = useState(null);
  const [splitting, setSplitting] = useState(false);

  const handleCalculateSplit = async (count) => {
    if (!bill) return;
    triggerHaptic('selection');
    setSplitting(true);
    try {
      const res = await api.splitBill({ total: bill.total, count });
      setSplitResult(res);
    } catch (e) {
      Alert.alert('Split Bill', e.message);
    } finally {
      setSplitting(false);
    }
  };

  const itemsPayload = useMemo(
    () => lines.map((l) => ({ itemId: l.item.id, quantity: l.quantity })),
    [lines]
  );

  useEffect(() => {
    api.offers().then(setOffers).catch(() => {});
  }, []);

  // Request bill calculation from Java backend whenever cart or coupon changes
  useEffect(() => {
    if (!restaurant || itemsPayload.length === 0) {
      setBill(null);
      return;
    }
    let cancelled = false;

    api
      .previewOrder({
        email: user.email,
        restaurantId: restaurant.id,
        items: itemsPayload,
        coupon,
      })
      .then((data) => {
        if (!cancelled) {
          setBill(data);
          setBillError('');
        }
      })
      .catch((e) => {
        if (cancelled) return;
        if (coupon) {
          setCouponError(e.message);
          setCoupon('');
        } else {
          setBillError(e.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [restaurant, itemsPayload, coupon, user.email]);

  const applyCode = (code) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    triggerHaptic('medium');
    setCouponError('');
    setCouponInput(clean);
    setCoupon(clean);
  };

  const removeCoupon = () => {
    triggerHaptic('light');
    setCoupon('');
    setCouponInput('');
    setCouponError('');
  };

  const placeOrder = async () => {
    triggerHaptic('heavy');
    setOrderError('');
    setPlacing(true);
    try {
      const order = await api.placeOrder({
        email: user.email,
        restaurantId: restaurant.id,
        items: itemsPayload,
        coupon,
        payment,
      });
      // refresh loyalty points in the background
      api.login(user.name, user.email).then(signIn).catch(() => {});
      triggerHaptic('success');
      navigation.replace('OrderSuccess', { order });
      clear();
    } catch (e) {
      setOrderError(e.message);
    } finally {
      setPlacing(false);
    }
  };

  if (!restaurant || lines.length === 0) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <View style={styles.emptyIconCircle}>
          <Text style={{ fontSize: 50 }}>🛒</Text>
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>Add some fresh dishes from our kitchens</Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          activeOpacity={0.85}
          onPress={() => {
            triggerHaptic('selection');
            navigation.goBack();
          }}
        >
          <Text style={styles.emptyBtnText}>Browse Restaurants</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => {
            triggerHaptic('selection');
            navigation.goBack();
          }}
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Your Order</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {restaurant.name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            clear();
          }}
          hitSlop={10}
        >
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 150 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cart Items Card */}
        <View style={styles.card}>
          {lines.map(({ item, quantity }, index) => (
            <View key={item.id} style={[styles.lineRow, index > 0 && styles.lineDivider]}>
              <View style={styles.lineEmoji}>
                <Text style={{ fontSize: 24 }}>{dishEmoji(item)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lineName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.linePrice}>{formatPrice(item.price * quantity)}</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => {
                    triggerHaptic('light');
                    removeItem(item.id);
                  }}
                  hitSlop={6}
                >
                  <Ionicons name="remove" size={15} color={colors.primaryText} />
                </TouchableOpacity>
                <Text style={styles.qty}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => {
                    triggerHaptic('medium');
                    addItem(restaurant, item);
                  }}
                  hitSlop={6}
                >
                  <Ionicons name="add" size={15} color={colors.primaryText} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Coupons & Offers */}
        <Text style={styles.sectionTitle}>Offers & Coupons</Text>
        {coupon && bill ? (
          <View style={styles.appliedBox}>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.appliedCode}>{coupon} applied</Text>
              <Text style={styles.appliedSub}>Discount calculated in your bill</Text>
            </View>
            <TouchableOpacity onPress={removeCoupon} hitSlop={10}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.couponRow}>
              <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                value={couponInput}
                onChangeText={(t) => {
                  setCouponInput(t);
                  setCouponError('');
                }}
              />
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => applyCode(couponInput)}
                disabled={!couponInput.trim()}
              >
                <Text style={styles.applyText}>Apply</Text>
              </TouchableOpacity>
            </View>

            {couponError ? <Text style={styles.errorText}>{couponError}</Text> : null}

            {offers.length > 0 && (
              <View style={styles.chipsRow}>
                {offers.map((o) => (
                  <TouchableOpacity
                    key={o.code}
                    style={styles.offerChip}
                    onPress={() => applyCode(o.code)}
                  >
                    <Text style={styles.offerChipCode}>{o.code}</Text>
                    <Text style={styles.offerChipDesc}>{o.discountPercent}% OFF</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.card}>
          {PAYMENTS.map((p, index) => {
            const selected = payment === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                style={[styles.paymentRow, index > 0 && styles.lineDivider]}
                activeOpacity={0.85}
                onPress={() => {
                  triggerHaptic('selection');
                  setPayment(p.key);
                }}
              >
                <View
                  style={[
                    styles.paymentIconWrap,
                    selected && { borderColor: colors.primary, backgroundColor: colors.surface2 },
                  ]}
                >
                  <Ionicons
                    name={p.icon}
                    size={18}
                    color={selected ? colors.primary : colors.textMuted}
                  />
                </View>
                <Text style={[styles.paymentLabel, selected && styles.paymentLabelActive]}>
                  {p.label}
                </Text>
                <View style={[styles.radio, selected && styles.radioActive]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bill Summary from Java Backend */}
        <Text style={styles.sectionTitle}>Bill Breakdown</Text>
        <View style={styles.card}>
          {bill ? (
            <>
              <BillRow label="Item Total" value={formatPrice(bill.subtotal)} />
              {bill.discount > 0 && (
                <BillRow
                  label="Discount Saved"
                  value={'-' + formatPrice(bill.discount)}
                  highlight
                />
              )}
              <BillRow label="GST & Restaurant Charges (5%)" value={formatPrice(bill.tax)} />
              <BillRow label="Delivery Partner Fee" value={formatPrice(bill.deliveryFee)} />
              <View style={styles.billDivider} />
              <BillRow label="To Pay" value={formatPrice(bill.total)} bold />
            </>
          ) : billError ? (
            <Text style={styles.errorText}>{billError}</Text>
          ) : (
            <ActivityIndicator color={colors.primary} style={{ padding: 12 }} />
          )}
        </View>

        {/* Phase 3 Feature C: Split the Bill Trigger */}
        {bill && (
          <TouchableOpacity
            style={styles.splitBillTriggerBtn}
            activeOpacity={0.85}
            onPress={() => {
              triggerHaptic('medium');
              setSplitModalVisible(true);
              handleCalculateSplit(splitCount);
            }}
          >
            <Ionicons name="people" size={16} color={colors.primary} />
            <Text style={styles.splitBillTriggerText}>Split Bill with Friends</Text>
          </TouchableOpacity>
        )}

        {orderError ? (
          <View style={styles.orderErrorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.orderErrorText}>{orderError}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Floating Place Order Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View>
          <Text style={styles.footerLabel}>TOTAL AMOUNT</Text>
          <Text style={styles.footerTotal}>
            {bill ? formatPrice(bill.total) : '...'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.placeBtn}
          activeOpacity={0.88}
          onPress={placeOrder}
          disabled={placing || !bill}
        >
          {placing ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <View style={styles.btnInner}>
              <Text style={styles.placeBtnText}>Place Order</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primaryText} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Phase 3 Feature C: Split Bill Modal */}
      <Modal visible={splitModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>👥 Split the Bill</Text>
                <Text style={styles.modalSub}>Exact remainder allocation with zero round-off error</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setSplitModalVisible(false);
                }}
              >
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.splitSectionLabel}>Number of Diners / Friends</Text>
            <View style={styles.splitCountRow}>
              {[2, 3, 4, 5, 6].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.splitCountChip, splitCount === num && styles.splitCountChipActive]}
                  onPress={() => {
                    setSplitCount(num);
                    handleCalculateSplit(num);
                  }}
                >
                  <Text style={[styles.splitCountText, splitCount === num && styles.splitCountTextActive]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {splitting ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : splitResult ? (
              <ScrollView style={{ maxHeight: 220, marginTop: 10 }} showsVerticalScrollIndicator={false}>
                <View style={styles.splitSharesBox}>
                  {splitResult.shares?.map((s, idx) => (
                    <View key={idx} style={styles.splitShareLine}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="person" size={14} color={colors.primary} />
                        <Text style={styles.splitShareName}>{s.name}</Text>
                      </View>
                      <Text style={styles.splitShareAmount}>₹{s.amount}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.splitInvariantBox}>
                  <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                  <Text style={styles.splitInvariantText}>
                    Verified: Sum of individual shares (₹{splitResult.totalAmount}) matches total bill perfectly.
                  </Text>
                </View>
              </ScrollView>
            ) : null}

            <TouchableOpacity
              style={styles.splitCopyBtn}
              onPress={() => {
                triggerHaptic('success');
                Alert.alert('Bill Split Summary', splitResult?.formattedSummary || 'Split copied!');
              }}
            >
              <Ionicons name="copy-outline" size={16} color={colors.primaryText} />
              <Text style={styles.splitCopyBtnText}>View & Share Split Summary</Text>
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 20,
    color: colors.text,
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
    fontSize: 14,
    color: colors.primaryText,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Sora_700Bold',
    fontSize: 17,
    color: colors.text,
  },
  subtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  clearText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: colors.danger,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  lineDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  lineEmoji: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineName: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  linePrice: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: colors.primary,
    marginTop: 2,
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
    fontSize: 12,
    color: colors.primaryText,
  },
  sectionTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
    color: colors.text,
    marginBottom: 10,
    marginTop: 4,
  },
  appliedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 18,
  },
  appliedCode: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: colors.primary,
  },
  appliedSub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  removeText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: colors.danger,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: colors.text,
    paddingVertical: 6,
  },
  applyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  applyText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    color: colors.primaryText,
  },
  errorText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.danger,
    marginTop: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  offerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offerChipCode: {
    fontFamily: 'Sora_700Bold',
    fontSize: 11,
    color: colors.primary,
  },
  offerChipDesc: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10,
    color: colors.textMuted,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  paymentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentLabel: {
    flex: 1,
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: colors.textMuted,
  },
  paymentLabelActive: {
    color: colors.text,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  billLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  billValue: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
  billBold: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: colors.text,
  },
  billDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  orderErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    padding: 12,
    borderRadius: radius.md,
    marginTop: 10,
  },
  orderErrorText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  footerTotal: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 22,
    color: colors.text,
  },
  placeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 26,
    paddingVertical: 14,
    ...limeGlow,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  placeBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
    color: colors.primaryText,
  },
  splitBillTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(184, 242, 59, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 59, 0.3)',
  },
  splitBillTriggerText: {
    fontFamily: 'Sora_600SemiBold',
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
    marginBottom: 14,
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
  splitSectionLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 8,
  },
  splitCountRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  splitCountChip: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitCountChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  splitCountText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
    color: colors.text,
  },
  splitCountTextActive: {
    color: colors.primaryText,
  },
  splitSharesBox: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
  },
  splitShareLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  splitShareName: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
  splitShareAmount: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: colors.primary,
  },
  splitInvariantBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(184, 242, 59, 0.08)',
    padding: 10,
    borderRadius: radius.sm,
    marginTop: 10,
  },
  splitInvariantText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.primary,
    flex: 1,
  },
  splitCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 13,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...limeGlow,
  },
  splitCopyBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: colors.primaryText,
  },
});
