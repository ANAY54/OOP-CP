import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { triggerHaptic } from '../utils/helpers';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import OffersScreen from '../screens/OffersScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Home: ['home', 'home-outline'],
  Map: ['map', 'map-outline'],
  Offers: ['pricetag', 'pricetag-outline'],
  Orders: ['receipt', 'receipt-outline'],
  Profile: ['person', 'person-outline'],
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: 'Sora_600SemiBold',
          fontSize: 10,
          marginTop: -2,
          marginBottom: 4,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 18,
          right: 18,
          height: 64,
          borderRadius: radius.pill,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.5,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          paddingTop: 6,
        },
        tabBarItemStyle: {
          height: 52,
        },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={ICONS[route.name][focused ? 0 : 1]}
            size={22}
            color={color}
          />
        ),
      })}
      screenListeners={{
        tabPress: () => {
          triggerHaptic('selection');
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Offers" component={OffersScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
