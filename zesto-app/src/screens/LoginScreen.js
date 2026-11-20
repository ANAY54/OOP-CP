import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, limeGlow } from '../theme';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../utils/helpers';

function Field({ icon, focused, accentColor, onFocus, onBlur, ...props }) {
  return (
    <View
      style={[
        styles.field,
        focused && { borderColor: accentColor, backgroundColor: '#192228' },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={focused ? accentColor : colors.textMuted}
      />
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        onFocus={onFocus}
        onBlur={onBlur}
        {...props}
      />
    </View>
  );
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [role, setRole] = useState('CUSTOMER'); // 'CUSTOMER' | 'BUSINESS_OWNER'
  const [name, setName] = useState('Anay Palimkar');
  const [email, setEmail] = useState('anaypalimkar@gmail.com');
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google Account Chooser Modal state
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [customGoogleMode, setCustomGoogleMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  const isBusiness = role === 'BUSINESS_OWNER';
  const accent = isBusiness ? colors.partner : colors.primary;

  const openGoogleSignIn = () => {
    triggerHaptic('medium');
    setCustomGoogleMode(false);
    setGoogleModalVisible(true);
  };

  const loginWithUser = async (userName, userEmail) => {
    const cleanName = userName.trim();
    const cleanEmail = userEmail.trim().toLowerCase();

    if (!cleanName) {
      setError('Please enter your name');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);
    setGoogleModalVisible(false);
    try {
      if (isBusiness) {
        const res = await api.merchantLogin(cleanName, cleanEmail);
        triggerHaptic('success');
        await signIn({ ...res.owner, role: 'BUSINESS_OWNER' });
      } else {
        const customer = await api.login(cleanName, cleanEmail);
        triggerHaptic('success');
        await signIn({ ...customer, role: 'CUSTOMER' });
      }
    } catch (e) {
      setError(e.message || 'Login failed. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero */}
        <View style={styles.header}>
          <View style={styles.badgeWrap}>
            <View
              style={[
                styles.logoBadge,
                { borderColor: accent },
                isBusiness && { shadowColor: colors.partner },
              ]}
            >
              <Ionicons
                name={isBusiness ? 'storefront' : 'sparkles'}
                size={32}
                color={accent}
              />
            </View>
          </View>
          <Text style={styles.brand}>ZESTO</Text>
          <Text style={[styles.tagline, { color: accent }]}>
            {isBusiness
              ? 'ZESTO PARTNER • LOCAL FOOD BUSINESSES'
              : 'CITRUS ZEST • PUNE FOOD DELIVERY'}
          </Text>
          <Text style={styles.subtext}>
            {isBusiness
              ? 'Register & verify your kitchen, manage menu prices, and reach hungry Pune diners'
              : "Order from Pune's iconic restaurants & verified local home kitchens"}
          </Text>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          {/* Role Switcher */}
          <View style={styles.roleSwitch}>
            <TouchableOpacity
              style={[
                styles.roleTab,
                !isBusiness && styles.roleTabCustomerActive,
              ]}
              activeOpacity={0.85}
              onPress={() => {
                triggerHaptic('selection');
                setRole('CUSTOMER');
                setError('');
              }}
            >
              <Ionicons
                name="fast-food-outline"
                size={16}
                color={!isBusiness ? colors.primaryText : colors.textMuted}
              />
              <Text
                style={[
                  styles.roleTabText,
                  !isBusiness && { color: colors.primaryText },
                ]}
              >
                Customer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleTab,
                isBusiness && styles.roleTabBusinessActive,
              ]}
              activeOpacity={0.85}
              onPress={() => {
                triggerHaptic('selection');
                setRole('BUSINESS_OWNER');
                setError('');
              }}
            >
              <Ionicons
                name="storefront-outline"
                size={16}
                color={isBusiness ? colors.primaryText : colors.textMuted}
              />
              <Text
                style={[
                  styles.roleTabText,
                  isBusiness && { color: colors.primaryText },
                ]}
              >
                Food Business
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.cardTitle}>
            {isBusiness ? 'Partner Portal Sign In' : 'Sign in to your account'}
          </Text>
          <Text style={styles.cardSub}>
            {isBusiness
              ? 'Verify your restaurant or home kitchen & publish dishes live'
              : 'Enjoy personalized orders, instant tracking, and reward points'}
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Quick Google Sign-In Button */}
          <TouchableOpacity
            style={styles.googleBtn}
            activeOpacity={0.88}
            onPress={openGoogleSignIn}
          >
            <Ionicons name="logo-google" size={19} color="#FFFFFF" />
            <Text style={styles.googleBtnText}>
              {isBusiness ? 'Continue with Google as Partner' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR SIGN IN WITH EMAIL</Text>
            <View style={styles.divider} />
          </View>

          <Field
            icon="person-outline"
            placeholder={isBusiness ? 'Owner Full Name' : 'Full Name'}
            value={name}
            accentColor={accent}
            onChangeText={(t) => {
              setName(t);
              setError('');
            }}
            focused={nameFocused}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
          />

          <Field
            icon="mail-outline"
            placeholder={isBusiness ? 'Business / Owner Email' : 'Email Address'}
            value={email}
            accentColor={accent}
            onChangeText={(t) => {
              setEmail(t);
              setError('');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            focused={emailFocused}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
          />

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: accent },
              isBusiness && { shadowColor: colors.partner },
            ]}
            activeOpacity={0.88}
            onPress={() => loginWithUser(name, email)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <View style={styles.btnInner}>
                <Text style={styles.primaryBtnText}>
                  {isBusiness ? 'Open Partner Portal' : 'Continue to Zesto'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={colors.primaryText} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Note */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Zesto • Pune's Premium Food & Local Kitchen Platform</Text>
        </View>
      </ScrollView>

      {/* Google Account Chooser Modal */}
      <Modal
        visible={googleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGoogleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.googleIconCircle}>
                <Ionicons name="logo-google" size={24} color="#EA4335" />
              </View>
              <Text style={styles.modalTitle}>Choose an account</Text>
              <Text style={styles.modalSub}>
                to continue to {isBusiness ? 'Zesto Partner Portal' : 'Zesto'}
              </Text>
            </View>

            {!customGoogleMode ? (
              <View style={styles.accountsList}>
                {/* Account 1: Anay Palimkar (Default Verified Account) */}
                <TouchableOpacity
                  style={styles.accountRow}
                  activeOpacity={0.8}
                  onPress={() => loginWithUser('Anay Palimkar', 'anaypalimkar@gmail.com')}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarLetter}>A</Text>
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>Anay Palimkar</Text>
                    <Text style={styles.accountEmail}>anaypalimkar@gmail.com</Text>
                    <View style={styles.defaultPill}>
                      <Ionicons name="checkmark-circle" size={12} color={accent} />
                      <Text style={[styles.defaultPillText, { color: accent }]}>
                        {isBusiness ? 'Sign in as Business Owner' : 'Verified Google Account'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Pre-verified local partner option when in Business mode */}
                {isBusiness && (
                  <TouchableOpacity
                    style={styles.accountRow}
                    activeOpacity={0.8}
                    onPress={() => loginWithUser('Sunita Kulkarni', 'aai.kitchen@zesto.in')}
                  >
                    <View style={[styles.avatarCircle, { backgroundColor: '#0EA5E9' }]}>
                      <Ionicons name="storefront" size={18} color="#FFFFFF" />
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>Sunita Kulkarni (Aai's Tiffin)</Text>
                      <Text style={styles.accountEmail}>aai.kitchen@zesto.in</Text>
                      <View style={styles.defaultPill}>
                        <Ionicons name="shield-checkmark" size={12} color={colors.partner} />
                        <Text style={[styles.defaultPillText, { color: colors.partner }]}>
                          Verified Local Home Chef
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}

                {/* Add another account */}
                <TouchableOpacity
                  style={[styles.accountRow, { borderBottomWidth: 0 }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    triggerHaptic('selection');
                    setCustomGoogleMode(true);
                  }}
                >
                  <View style={[styles.avatarCircle, { backgroundColor: colors.surface2 }]}>
                    <Ionicons name="person-add" size={18} color={accent} />
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>Use another Google account</Text>
                    <Text style={styles.accountEmail}>Sign in with a different @gmail.com</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.customForm}>
                <Text style={styles.formHint}>Enter your Google profile details:</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Your Name (e.g. Rohan Joshi)"
                  placeholderTextColor={colors.textMuted}
                  value={customName}
                  onChangeText={setCustomName}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Google Email (e.g. rohan@gmail.com)"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={customEmail}
                  onChangeText={setCustomEmail}
                />
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { backgroundColor: accent }]}
                  onPress={() => loginWithUser(customName, customEmail)}
                >
                  <Text style={styles.modalConfirmBtnText}>
                    {isBusiness ? 'Sign In as Partner' : 'Sign In with Google'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setCustomGoogleMode(false)}
                >
                  <Text style={styles.backBtnText}>Back to account list</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setGoogleModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 22,
  },
  badgeWrap: {
    marginBottom: 14,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...limeGlow,
  },
  brand: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 34,
    color: colors.text,
    letterSpacing: 3,
  },
  tagline: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    color: colors.primary,
    marginTop: 6,
    letterSpacing: 1.8,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  roleTabCustomerActive: {
    backgroundColor: colors.primary,
  },
  roleTabBusinessActive: {
    backgroundColor: colors.partner,
  },
  roleTabText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: colors.textMuted,
  },
  cardTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 19,
    color: colors.text,
  },
  cardSub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    padding: 12,
    borderRadius: radius.sm,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.3)',
  },
  errorText: {
    fontFamily: 'Sora_400Regular',
    color: colors.danger,
    fontSize: 13,
    flex: 1,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1E232A',
    borderRadius: radius.pill,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  googleBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    marginBottom: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Sora_400Regular',
    fontSize: 15,
    color: colors.text,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...limeGlow,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
    color: colors.primaryText,
    letterSpacing: 0.4,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#14181D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  googleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: colors.text,
  },
  modalSub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  accountsList: {
    backgroundColor: colors.surface2,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 14,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  accountEmail: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  defaultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  defaultPillText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  customForm: {
    marginBottom: 16,
  },
  formHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    marginBottom: 12,
  },
  modalConfirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  modalConfirmBtnText: {
    color: '#0B0D10',
    fontSize: 14,
    fontWeight: '700',
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backBtnText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
  },
  cancelBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
