import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, limeGlow } from '../theme';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../utils/helpers';

export default function PlaceholderScreen({ route }) {
  const { user, signOut } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Hi, {firstName} 👋</Text>
      <Text style={styles.subtitle}>{route.name} screen is coming up next</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => {
          triggerHaptic('medium');
          signOut();
        }}
      >
        <Text style={styles.btnText}>Log out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 26,
    color: colors.text,
  },
  subtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 24,
  },
  btn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...limeGlow,
  },
  btnText: {
    fontFamily: 'Sora_700Bold',
    color: colors.primaryText,
    fontSize: 14,
  },
});
