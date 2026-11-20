import { Platform } from 'react-native';

export const colors = {
  // Deep ink black background
  background: '#0B0D10',
  // Surfaces & Cards
  surface: '#14181D',
  surface2: '#1B2027',
  card: '#14181D',
  border: '#262C35',
  borderLight: '#323A46',

  // Typography
  text: '#F4F6F8',
  textMuted: '#8B95A3',
  white: '#FFFFFF',

  // Signature Accent: Citrus Zest Lime
  primary: '#B8F23B',
  primaryDark: '#9BCB2C',
  primarySoft: 'rgba(184, 242, 59, 0.12)',
  primarySoftBorder: 'rgba(184, 242, 59, 0.25)',
  primaryText: '#0B0D10', // Deep ink text placed on zest lime buttons

  // Semantics & Badges
  coral: '#FF6B57', // Hearts, hot offers, alerts
  amber: '#FFC24B', // Ratings & stars
  star: '#FFC24B',
  success: '#3DDC97',
  successSoft: 'rgba(61, 220, 151, 0.12)',
  danger: '#FF5C5C',
  dangerSoft: 'rgba(255, 92, 92, 0.14)',
  veg: '#3DDC97',
  nonVeg: '#FF5C5C',
  // Local Small Business / Merchant Partner accent
  partner: '#38BDF8',
  partnerSoft: 'rgba(56, 189, 248, 0.14)',
  partnerBorder: 'rgba(56, 189, 248, 0.38)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  xs: 6,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 28,
  pill: 999,
};

export const shadow = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  default: {
    elevation: 4,
  },
});

export const limeGlow = Platform.select({
  ios: {
    shadowColor: '#B8F23B',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  default: {
    elevation: 8,
  },
});

// Custom dark map styling for MapScreen
export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#14181D' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#14181D' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8B95A3' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#F4F6F8' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8B95A3' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1B241C' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#688B6A' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#262C35' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1F242C' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9CA3AF' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3A4250' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#262C35' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#E5E7EB' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1F242D' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0B0D10' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4B5563' }],
  },
];
