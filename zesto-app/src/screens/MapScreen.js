import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, limeGlow } from '../theme';
import { api } from '../services/api';
import { cuisineStyle, formatPrice, triggerHaptic } from '../utils/helpers';

const PUNE_CENTER = {
  latitude: 18.5204,
  longitude: 73.8567,
};

function distanceKm(a, b) {
  if (!a || !b) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return (2 * R * Math.asin(Math.sqrt(x))).toFixed(1);
}

export default function MapScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const CARD_W = 325;
  const SNAP = CARD_W + 12;

  const webViewRef = useRef(null);
  const listRef = useRef(null);

  const [restaurants, setRestaurants] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [userPos, setUserPos] = useState(null);

  const loadRestaurants = useCallback(() => {
    api
      .restaurants()
      .then((list) => {
        setRestaurants(list);
        setFilteredList(list);
        setSelectedArea('ALL');
        if (list.length > 0) {
          setSelectedId((prev) => prev || list[0].id);
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Unable to load restaurants');
        setLoading(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRestaurants();
    }, [loadRestaurants])
  );

  // Request user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserPos({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        }
      } catch (e) {
        // location optional
      }
    })();
  }, []);

  // Filter by Pune neighbourhood or local small businesses
  const filterByArea = (areaKey) => {
    triggerHaptic('selection');
    setSelectedArea(areaKey);
    let result = restaurants;
    if (areaKey === 'LOCAL') {
      result = restaurants.filter((r) => r.localBusiness);
    } else if (areaKey === 'FC_ROAD') {
      result = restaurants.filter(
        (r) => r.address.toLowerCase().includes('fc road') || r.address.toLowerCase().includes('deccan')
      );
    } else if (areaKey === 'CAMP') {
      result = restaurants.filter((r) => r.address.toLowerCase().includes('camp'));
    } else if (areaKey === 'KP') {
      result = restaurants.filter((r) => r.address.toLowerCase().includes('koregaon park'));
    } else if (areaKey === 'PETH') {
      result = restaurants.filter((r) => r.address.toLowerCase().includes('peth'));
    }
    setFilteredList(result);
    if (result.length > 0) {
      focusRestaurant(result[0].id, false);
    }
  };

  const focusRestaurant = (id, scrollList = true) => {
    setSelectedId(id);
    const target = restaurants.find((r) => r.id === id);
    if (target && webViewRef.current) {
      const js = `window.focusRestaurant && window.focusRestaurant(${id}, ${target.latitude}, ${target.longitude}); true;`;
      webViewRef.current.injectJavaScript(js);
    }
    if (scrollList && listRef.current) {
      const idx = filteredList.findIndex((r) => r.id === id);
      if (idx >= 0) {
        listRef.current.scrollToIndex({ index: idx, animated: true });
      }
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_RESTAURANT') {
        triggerHaptic('selection');
        focusRestaurant(data.id, true);
      } else if (data.type === 'OPEN_RESTAURANT') {
        triggerHaptic('medium');
        navigation.navigate('RestaurantDetail', { restaurantId: data.id });
      }
    } catch (e) {
      // ignore non-json messages
    }
  };

  const centerPune = () => {
    triggerHaptic('selection');
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.centerPune && window.centerPune(); true;`);
    }
  };

  const centerUser = () => {
    triggerHaptic('medium');
    if (userPos && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `window.centerCoords && window.centerCoords(${userPos.latitude}, ${userPos.longitude}); true;`
      );
    } else {
      centerPune();
    }
  };

  // Generate Leaflet HTML for WebView (memoized so selecting markers never reloads the map)
  const webViewSource = useMemo(() => ({
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100%; background: #0B0D10; }
        .leaflet-tile {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
        .custom-pin {
          position: relative;
          cursor: pointer;
        }
        .pulse-ring {
          position: absolute;
          width: 38px;
          height: 38px;
          left: -19px;
          top: -19px;
          border-radius: 50%;
          background: rgba(184, 242, 59, 0.25);
          animation: pulse 2s infinite ease-out;
        }
        .pin-core {
          position: absolute;
          width: 28px;
          height: 28px;
          left: -14px;
          top: -14px;
          background: #14181D;
          border: 2px solid #B8F23B;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #B8F23B;
          font-weight: bold;
          font-size: 11px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
          transition: transform 0.2s, background 0.2s, border-color 0.2s;
        }
        .custom-pin.active .pin-core {
          background: #B8F23B;
          color: #0B0D10;
          transform: scale(1.3);
          border-color: #FFFFFF;
          box-shadow: 0 0 16px rgba(184, 242, 59, 0.8);
        }
        .custom-pin.local .pulse-ring {
          background: rgba(56, 189, 248, 0.32);
        }
        .custom-pin.local .pin-core {
          width: 34px;
          height: 34px;
          left: -17px;
          top: -17px;
          border-radius: 10px;
          border-color: #38BDF8;
          color: #38BDF8;
          background: #0F1A24;
          font-size: 15px;
          box-shadow: 0 0 14px rgba(56, 189, 248, 0.45);
        }
        .custom-pin.local.active .pin-core {
          background: #38BDF8;
          color: #0B0D10;
          border-color: #FFFFFF;
          box-shadow: 0 0 18px rgba(56, 189, 248, 0.9);
        }
        .popup-local-tag {
          display: inline-block;
          background: rgba(56, 189, 248, 0.18);
          color: #38BDF8;
          font-size: 9.5px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 6px;
          margin-bottom: 4px;
        }
        .leaflet-popup-content-wrapper {
          background: #14181D;
          color: #F4F6F8;
          border: 1px solid #262C35;
          border-radius: 14px;
          padding: 4px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.8);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .leaflet-popup-tip {
          background: #14181D;
        }
        .popup-title {
          font-size: 14px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 2px;
        }
        .popup-sub {
          font-size: 11px;
          color: #8B95A3;
          margin-bottom: 6px;
        }
        .popup-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          margin-bottom: 8px;
        }
        .popup-rating {
          background: #FFC24B;
          color: #0B0D10;
          padding: 1px 5px;
          border-radius: 6px;
          font-weight: 700;
        }
        .popup-btn {
          background: #B8F23B;
          color: #0B0D10;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12px;
          width: 100%;
          cursor: pointer;
        }
        @keyframes pulse {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([${PUNE_CENTER.latitude}, ${PUNE_CENTER.longitude}], 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        var markers = {};
        var restaurantData = ${JSON.stringify(restaurants)};

        restaurantData.forEach(function(r) {
          var isLocal = !!r.localBusiness;
          var iconHtml = '<div class="custom-pin ' + (isLocal ? 'local' : '') + '" id="pin-' + r.id + '">' +
            '<div class="pulse-ring"></div>' +
            '<div class="pin-core">' + (isLocal ? '🏪' : (r.rating ? r.rating.toFixed(1) : '★')) + '</div>' +
          '</div>';

          var customIcon = L.divIcon({
            html: iconHtml,
            className: '',
            iconSize: isLocal ? [34, 34] : [28, 28],
            iconAnchor: [0, 0]
          });

          var marker = L.marker([r.latitude, r.longitude], { icon: customIcon }).addTo(map);

          var localTag = isLocal ? '<div class="popup-local-tag">🏪 ' + (r.businessTypeLabel || 'Local Kitchen') + '</div>' : '';
          var popupContent = '<div style="min-width: 160px;">' +
            localTag +
            '<div class="popup-title">' + r.name + '</div>' +
            '<div class="popup-sub">' + r.cuisine + ' • ' + r.deliveryTimeMin + 'm</div>' +
            '<button class="popup-btn" style="' + (isLocal ? 'background:#38BDF8;' : '') + '" onclick="openRestaurant(' + r.id + ')">View Menu</button>' +
          '</div>';

          marker.bindPopup(popupContent);

          marker.on('click', function() {
            setActivePin(r.id);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_RESTAURANT', id: r.id }));
            }
          });

          markers[r.id] = marker;
        });

        function setActivePin(id) {
          document.querySelectorAll('.custom-pin').forEach(function(el) {
            el.classList.remove('active');
          });
          var pin = document.getElementById('pin-' + id);
          if (pin) pin.classList.add('active');
        }

        window.focusRestaurant = function(id, lat, lon) {
          setActivePin(id);
          map.flyTo([lat - 0.005, lon], 15, { duration: 0.8 });
          if (markers[id]) {
            markers[id].openPopup();
          }
        };

        window.openRestaurant = function(id) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_RESTAURANT', id: id }));
          }
        };

        window.centerPune = function() {
          map.flyTo([${PUNE_CENTER.latitude}, ${PUNE_CENTER.longitude}], 13, { duration: 0.8 });
        };

        window.centerCoords = function(lat, lon) {
          map.flyTo([lat, lon], 15, { duration: 0.8 });
        };
      </script>
    </body>
    </html>
  `,
  }), [restaurants]);

  const localCount = restaurants.filter((r) => r.localBusiness).length;

  const renderCard = ({ item }) => {
    const active = item.id === selectedId;
    const isLocal = !!item.localBusiness;
    const dist = userPos ? distanceKm(userPos, item) : null;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          active && (isLocal ? { borderColor: colors.partner, borderWidth: 2, backgroundColor: '#131E26' } : styles.cardActive),
        ]}
        activeOpacity={0.88}
        onPress={() => {
          focusRestaurant(item.id, false);
          navigation.navigate('RestaurantDetail', { restaurantId: item.id });
        }}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.cardThumb}
          contentFit="cover"
          transition={250}
        />
        <View style={styles.cardDetails}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, marginRight: 6 }}>
              {isLocal && <Ionicons name="storefront" size={14} color={colors.partner} />}
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color="#0B0D10" />
              <Text style={styles.ratingText}>{item.rating?.toFixed(1) || '4.8'}</Text>
            </View>
          </View>

          <Text style={styles.cardAddress} numberOfLines={1}>
            {item.address}
          </Text>

          <View style={styles.cardMetaRow}>
            <View
              style={[
                styles.cuisinePill,
                { backgroundColor: isLocal ? colors.partnerSoft : 'rgba(184, 242, 59, 0.14)' },
              ]}
            >
              <Text style={[styles.cuisineText, { color: isLocal ? colors.partner : colors.primary }]}>
                {isLocal ? (item.businessTypeLabel || 'Local Kitchen') : item.cuisine}
              </Text>
            </View>
            <Text style={styles.metaDot}>•</Text>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{item.deliveryTimeMin}m</Text>
            {dist && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={[styles.metaText, { color: colors.primary }]}>{dist}km</Text>
              </>
            )}
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.metaPrice}>{formatPrice(item.priceForTwo)} for two</Text>
            <TouchableOpacity
              style={[styles.menuBtn, isLocal && { backgroundColor: colors.partner }]}
              onPress={() => {
                triggerHaptic('medium');
                navigation.navigate('RestaurantDetail', { restaurantId: item.id });
              }}
            >
              <Text style={styles.menuBtnText}>Menu</Text>
              <Ionicons name="arrow-forward" size={12} color="#0B0D10" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Floating Header & Filter Bar */}
      <View style={[styles.headerContainer, { top: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Pune Food Map</Text>
            <Text style={styles.headerSubtitle}>
              {filteredList.length} Kitchens • {localCount} Local Partner{localCount === 1 ? '' : 's'}
            </Text>
          </View>
          <TouchableOpacity style={styles.recenterBtn} onPress={centerPune}>
            <Ionicons name="locate" size={18} color={colors.primary} />
            <Text style={styles.recenterText}>Pune Center</Text>
          </TouchableOpacity>
        </View>

        {/* Area Filter Chips */}
        <View style={styles.chipsRow}>
          {[
            { key: 'ALL', label: `All (${restaurants.length})` },
            { key: 'LOCAL', label: `🏪 Local (${localCount})` },
            { key: 'FC_ROAD', label: 'FC Rd / Deccan' },
            { key: 'CAMP', label: 'Camp' },
            { key: 'KP', label: 'Koregaon Park' },
            { key: 'PETH', label: 'Sadashiv Peth' },
          ].map((chip) => {
            const active = selectedArea === chip.key;
            const isLocalChip = chip.key === 'LOCAL';
            return (
              <TouchableOpacity
                key={chip.key}
                style={[
                  styles.chip,
                  active && (isLocalChip ? { backgroundColor: colors.partner, borderColor: colors.partner } : styles.chipActive),
                ]}
                onPress={() => filterByArea(chip.key)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Interactive Leaflet Dark Map */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Pune Map...</Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={webViewSource}
          style={styles.map}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        />
      )}

      {/* Floating GPS Button */}
      <TouchableOpacity
        style={[styles.gpsFab, { bottom: insets.bottom + 275 }]}
        onPress={centerUser}
      >
        <Ionicons name="navigate" size={20} color="#0B0D10" />
      </TouchableOpacity>

      {/* Bottom Horizontal Carousel */}
      <View style={[styles.bottomContainer, { bottom: insets.bottom + 80 }]}>
        <FlatList
          ref={listRef}
          data={filteredList}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({ length: SNAP, offset: SNAP * index, index })}
          onScrollToIndexFailed={() => {}}
          contentContainerStyle={styles.carouselContent}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP);
            if (filteredList[idx]) {
              focusRestaurant(filteredList[idx].id, false);
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
    backgroundColor: '#0B0D10',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  headerContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
    backgroundColor: 'rgba(20, 24, 29, 0.94)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  recenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recenterText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#0B0D10',
  },
  gpsFab: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    ...limeGlow,
  },
  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 15,
  },
  carouselContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 325,
    height: 125,
    backgroundColor: '#14181D',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  cardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#181E24',
  },
  cardThumb: {
    width: 100,
    height: 102,
    borderRadius: 14,
  },
  cardDetails: {
    flex: 1,
    justifyContent: 'space-between',
    height: 102,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    marginRight: 6,
  },
  cardAddress: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: -2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaPrice: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFC24B',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 7,
  },
  ratingText: {
    color: '#0B0D10',
    fontSize: 11,
    fontWeight: '800',
  },
  cuisinePill: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  cuisineText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaDot: {
    color: colors.textMuted,
    fontSize: 10,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 10,
    ...limeGlow,
  },
  menuBtnText: {
    color: '#0B0D10',
    fontSize: 11,
    fontWeight: '800',
  },
});
