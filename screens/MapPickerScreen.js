import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, FlatList,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getLocation } from '../services/location';
import { colors } from '../styles/theme';

export default function MapPickerScreen({ navigation, route }) {
  const { onLocationPicked, title } = route.params;
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 20.2961, lng: 85.8245 });
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const webViewRef = useRef(null);

  useEffect(() => { getUserLocation(); }, []);

  const getUserLocation = async () => {
    try {
      const loc = await getLocation();
      if (loc) {
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    } catch (e) {}
    setLoading(false);
  };

  const searchLocation = async (text) => {
    setSearchText(text);
    if (text.length < 3) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5&countrycodes=in`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {}
    setSearching(false);
  };

  const selectSearchResult = (item) => {
    const loc = {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.display_name,
    };
    setSelectedLocation(loc);
    setSearchResults([]);
    setSearchText(item.display_name.substring(0, 60));
    webViewRef.current?.injectJavaScript(`
      map.setView([${loc.lat}, ${loc.lng}], 16);
      if (window.selectedMarker) { map.removeLayer(window.selectedMarker); }
      window.selectedMarker = L.marker([${loc.lat}, ${loc.lng}]).addTo(map);
      window.selectedMarker.bindPopup(${JSON.stringify(loc.address)}).openPopup();
      true;
    `);
  };

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        #hint {
          position: absolute; top: 12px; left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.75); color: white;
          padding: 8px 18px; border-radius: 20px;
          font-family: sans-serif; font-size: 13px;
          z-index: 1000; pointer-events: none;
          white-space: nowrap;
        }
      </style>
    </head>
    <body>
      <div id="hint">Tap map or search above</div>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: true })
          .setView([${userLocation.lat}, ${userLocation.lng}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors', maxZoom: 19
        }).addTo(map);

        L.circleMarker([${userLocation.lat}, ${userLocation.lng}], {
          radius: 8, fillColor: '#4285F4', color: '#fff',
          weight: 2, fillOpacity: 1
        }).addTo(map).bindPopup('You are here');

        window.selectedMarker = null;

        map.on('click', function(e) {
          var lat = e.latlng.lat;
          var lng = e.latlng.lng;
          if (window.selectedMarker) { map.removeLayer(window.selectedMarker); }
          window.selectedMarker = L.marker([lat, lng]).addTo(map);
          fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng)
            .then(r => r.json())
            .then(data => {
              var address = data.display_name || (lat.toFixed(5) + ', ' + lng.toFixed(5));
              window.selectedMarker.bindPopup(address).openPopup();
              window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng, address: address }));
            })
            .catch(() => {
              var address = lat.toFixed(5) + ', ' + lng.toFixed(5);
              window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng, address: address }));
            });
        });
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      setSelectedLocation(data);
      setSearchText(data.address.substring(0, 60));
      setSearchResults([]);
    } catch (e) {}
  };

  const handleConfirm = () => {
    if (!selectedLocation) return;
    onLocationPicked(selectedLocation);
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.black} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.purposeLabel}>
        <Text style={styles.purposeText}>{title || 'Select location'}</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a place..."
          value={searchText}
          onChangeText={searchLocation}
          autoCorrect={false}
        />
        {searching && (
          <ActivityIndicator size="small" color={colors.gray} style={{ marginLeft: 8 }} />
        )}
      </View>

      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={searchResults}
            keyExtractor={item => item.place_id?.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => selectSearchResult(item)}
              >
                <Text style={styles.resultText} numberOfLines={2}>
                  📍 {item.display_name}
                </Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        onMessage={handleMessage}
        style={{ flex: 1 }}
        javaScriptEnabled
        scrollEnabled={false}
      />

      <View style={styles.footer}>
        {selectedLocation ? (
          <Text style={styles.selectedText} numberOfLines={2}>
            📍 {selectedLocation.address}
          </Text>
        ) : (
          <Text style={styles.hintText}>Search or tap the map to select</Text>
        )}
        <TouchableOpacity
          style={[styles.confirmBtn, !selectedLocation && styles.confirmDisabled]}
          onPress={handleConfirm}
          disabled={!selectedLocation}
        >
          <Text style={styles.confirmText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.gray },
  purposeLabel: { backgroundColor: colors.yellow, paddingVertical: 10, paddingHorizontal: 16 },
  purposeText: { fontSize: 14, fontWeight: 'bold', color: colors.black },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    margin: 12, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.borderDark,
    borderRadius: 10, paddingHorizontal: 12, elevation: 3,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14 },
  resultsContainer: {
    position: 'absolute', top: 120, left: 12, right: 12,
    backgroundColor: colors.white, borderRadius: 10,
    zIndex: 999, borderWidth: 1, borderColor: colors.border,
    elevation: 5, maxHeight: 200,
  },
  resultItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  resultText: { fontSize: 13, color: colors.text, lineHeight: 18 },
  footer: {
    backgroundColor: colors.white, padding: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  selectedText: { fontSize: 13, color: '#444', marginBottom: 12, lineHeight: 18 },
  hintText: { fontSize: 13, color: colors.gray, marginBottom: 12, textAlign: 'center' },
  confirmBtn: { backgroundColor: colors.black, padding: 16, borderRadius: 10, alignItems: 'center' },
  confirmDisabled: { backgroundColor: '#bbbbbb' },
  confirmText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
});