import * as Haptics from 'expo-haptics';
import { colors } from '../theme';

export const formatPrice = (value) => {
  const num = Number(value) || 0;
  return '₹' + (Number.isInteger(num) ? num : num.toFixed(2));
};

export const formatCount = (n) => {
  const num = Number(n) || 0;
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(num);
};

export const badgeColor = (badge) => {
  switch (badge) {
    case 'Bestseller':
      return colors.amber;
    case 'Trending':
      return colors.coral;
    case 'Top rated':
      return colors.primary;
    case 'New':
      return '#60A5FA';
    default:
      return colors.primary;
  }
};

export const triggerHaptic = (type = 'light') => {
  try {
    if (type === 'selection') {
      Haptics.selectionAsync();
    } else if (type === 'medium') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (type === 'heavy') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (e) {
    // Graceful fallback if haptics aren't supported on simulator
  }
};

const CUISINES = {
  NORTH_INDIAN: { emoji: '🍛', colors: ['#282015', '#17140F'] },
  SOUTH_INDIAN: { emoji: '🥘', colors: ['#17261C', '#0E1712'] },
  CHINESE: { emoji: '🥡', colors: ['#2D181A', '#1A1012'] },
  ITALIAN: { emoji: '🍕', colors: ['#2A2214', '#19150E'] },
  FAST_FOOD: { emoji: '🍔', colors: ['#2A1D15', '#1A130F'] },
  DESSERTS: { emoji: '🍰', colors: ['#2B1624', '#1A0E17'] },
  BEVERAGES: { emoji: '🥤', colors: ['#13242E', '#0C171E'] },
  MULTI_CUISINE: { emoji: '🍽️', colors: ['#1B2027', '#111419'] },
};

const FALLBACK = { emoji: '🍽️', colors: ['#1B2027', '#14181D'] };

// Accepts "NORTH_INDIAN" or "North Indian"
export const cuisineStyle = (key) =>
  CUISINES[String(key || '').toUpperCase().replace(/\s+/g, '_')] || FALLBACK;

// First match wins, so specific words come first
const DISH_EMOJI = [
  ['pizza', '🍕'], ['burger', '🍔'], ['biryani', '🍛'], ['pasta', '🍝'],
  ['naan', '🫓'], ['roti', '🫓'], ['noodles', '🍜'], ['dumpling', '🥟'],
  ['spring roll', '🌯'], ['wrap', '🌯'], ['sandwich', '🥪'], ['fries', '🍟'],
  ['nachos', '🌮'], ['nuggets', '🍗'], ['wings', '🍗'], ['kebab', '🍢'],
  ['tikka', '🍢'], ['tandoori', '🍗'], ['manchurian', '🥘'], ['chilli', '🌶️'],
  ['rice', '🍚'], ['soup', '🥣'], ['dosa', '🥞'], ['uttapam', '🥞'],
  ['idli', '🍚'], ['vada', '🍩'], ['upma', '🍚'], ['pongal', '🍚'], ['bath', '🍚'],
  ['coffee', '☕'], ['cappuccino', '☕'], ['chai', '☕'], ['tea', '🍵'],
  ['lassi', '🥛'], ['chaas', '🥛'], ['smoothie', '🥤'], ['shake', '🥤'],
  ['soda', '🥤'], ['cola', '🥤'], ['lime', '🍋'], ['bread', '🥖'],
  ['paneer', '🧀'], ['dal', '🍲'], ['salan', '🍲'], ['raita', '🥣'],
  ['brownie', '🍫'], ['jamun', '🍡'], ['cheesecake', '🍰'], ['pastry', '🍰'],
  ['tiramisu', '🍰'], ['rasmalai', '🍮'], ['kulfi', '🍨'], ['sundae', '🍨'],
  ['scoop', '🍨'], ['cone', '🍨'], ['waffle', '🧇'], ['muffin', '🧁'],
  ['potato', '🥔'], ['chicken', '🍗'],
];

export const dishEmoji = (item) => {
  const name = String(item?.name || '').toLowerCase();
  const hit = DISH_EMOJI.find(([word]) => name.includes(word));
  return hit ? hit[1] : cuisineStyle(item?.cuisine).emoji;
};
