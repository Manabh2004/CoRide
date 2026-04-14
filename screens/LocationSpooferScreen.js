import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  PanResponder, Animated, Switch, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { colors, shared } from '../styles/theme';

const SPOOFER_KEY = 'location_spoofer';
const JOYSTICK_SIZE = 140;
const KNOB_SIZE = 50;
const MAX_OFFSET = (JOYSTICK_SIZE - KNOB_SIZE) / 2;
const MOVE_SPEED = 0.00005; // degrees per ms of movement

export default function LocationSpooferScreen() {
  const [enabled, setEnabled] = useState(false);
  const [spoofedLocation, setSpoofedLocation] = useState({ lat: 20.2961, lng: 85.8245 });
  const webViewRef = useRef(null);
  const knobPos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const currentOffset = useRef({ x: 0, y: 0 });
  const moveInterval = useRef(null);
  const locationRef = useRef({ lat: 20.2961, lng: 85.8245 });

  // Load saved spoofer state
  useEffect(() => {
    loadState();
    return () => {
      if (moveInterval.current) clearInterval(moveInterval.current);
    };
  }, []);

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(SPOOFER_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setEnabled(data.enabled || false);
        if (data.location) {
          setSpoofedLocation(data.location);
          locationRef.current = data.location;
        }
      }
    } catch (e) {}
  };

  const saveState = async (en, loc) => {
    try {
      await AsyncStorage.setItem(SPOOFER_KEY, JSON.stringify({ enabled: en, location: loc }));
    } catch (e) {}
  };

  const toggleEnabled = (val) => {
    setEnabled(val);
    saveState(val, locationRef.current);
    if (!val) {
      Alert.alert('Spoofer Off', 'App will now use your real GPS location.');
    } else {
      Alert.alert('Spoofer On ⚠️', 'App will use the fake location shown on this screen. Move it with the joystick.');
    }
  };

  // Start/stop movement based on joystick position
  const startMoving = () => {
    if (moveInterval.current) return;
    moveInterval.current = setInterval(() => {
      const { x, y } = currentOffset.current;
      if (Math.abs(x) < 5 && Math.abs(y) < 5) return;

      const normX = x / MAX_OFFSET;
      const normY = y / MAX_OFFSET;

      const newLat = locationRef.current.lat - normY * MOVE_SPEED * 10;
      const newLng = locationRef.current.lng + normX * MOVE_SPEED * 10;

      locationRef.current = { lat: newLat, lng: newLng };
      setSpoofedLocation({ lat: newLat, lng: newLng });

      // Update map
      webViewRef.current?.injectJavaScript(`
        if (window.spooferMarker) {
          window.spooferMarker.setLatLng([${newLat}, ${newLng}]);
          map.panTo([${newLat}, ${newLng}]);
        }
        true;
      `);

      if (enabled) {
        saveState(true, { lat: newLat, lng: newLng });
      }
    }, 50);
  };

  const stopMoving = () => {
    if (moveInterval.current) {
      clearInterval(moveInterval.current);
      moveInterval.current = null;
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { startMoving(); },
    onPanResponderMove: (_, gesture) => {
      const x = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, gesture.dx));
      const y = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, gesture.dy));
      currentOffset.current = { x, y };
      knobPos.setValue({ x, y });
    },
    onPanResponderRelease: () => {
      currentOffset.current = { x: 0, y: 0 };
      Animated.spring(knobPos, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }).start();
      stopMoving();
    },
  });

  const mapHTML = `
    <!DOCTYPE html><html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>body{margin:0}#map{height:100vh;width:100vw}</style>
    </head>
    <body><div id="map"></div>
    <script>
      var map = L.map('map',{zoomControl:true})
        .setView([${spoofedLocation.lat},${spoofedLocation.lng}],15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(map);

      var icon = L.divIcon({
        html:'<div style="width:20px;height:20px;background:#F5C842;border:3px solid #1a1a1a;border-radius:50%"></div>',
        iconSize:[20,20],iconAnchor:[10,10],className:''
      });

      window.spooferMarker = L.marker([${spoofedLocation.lat},${spoofedLocation.lng}],{icon:icon,draggable:true})
        .addTo(map).bindPopup('Drag me to set location').openPopup();

      window.spooferMarker.on('dragend', function(e) {
        var pos = e.target.getLatLng();
        window.ReactNativeWebView.postMessage(JSON.stringify({lat:pos.lat,lng:pos.lng}));
      });
    </script></body></html>
  `;

  const handleMapMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      locationRef.current = { lat: data.lat, lng: data.lng };
      setSpoofedLocation({ lat: data.lat, lng: data.lng });
      if (enabled) saveState(true, { lat: data.lat, lng: data.lng });
    } catch (e) {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📍 Location Spoofer</Text>
          <Text style={styles.headerSub}>For testing only — disable before demo</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={toggleEnabled}
          trackColor={{ false: colors.borderDark, true: colors.yellow }}
          thumbColor={enabled ? colors.black : '#f4f3f4'}
        />
      </View>

      {enabled && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ Spoofer is ON — app uses fake GPS: {spoofedLocation.lat.toFixed(5)}, {spoofedLocation.lng.toFixed(5)}
          </Text>
        </View>
      )}

      {/* Map */}
      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHTML }}
          onMessage={handleMapMessage}
          style={{ flex: 1 }}
          javaScriptEnabled
          scrollEnabled={false}
        />

        {/* Joystick overlay */}
        {enabled && (
          <View style={styles.joystickContainer}>
            <View style={styles.joystickBase} {...panResponder.panHandlers}>
              <Animated.View
                style={[
                  styles.joystickKnob,
                  { transform: [{ translateX: knobPos.x }, { translateY: knobPos.y }] },
                ]}
              />
            </View>
            <Text style={styles.joystickLabel}>Hold &amp; drag to move</Text>
            <Text style={styles.joystickLabel}>Or drag pin on map</Text>
          </View>
        )}
      </View>

      {!enabled && (
        <View style={styles.disabledOverlay}>
          <Text style={styles.disabledText}>
            Toggle the switch above to enable the location spoofer.{'\n'}
            When enabled, use the joystick to simulate movement.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: colors.black,
  },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: colors.yellow },
  headerSub: { fontSize: 11, color: colors.gray, marginTop: 2 },
  warningBanner: { backgroundColor: '#FFF3CD', padding: 10, paddingHorizontal: 16 },
  warningText: { fontSize: 11, color: '#856404' },
  joystickContainer: {
    position: 'absolute', bottom: 20, right: 20,
    alignItems: 'center',
  },
  joystickBase: {
    width: JOYSTICK_SIZE, height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.yellow,
  },
  joystickKnob: {
    width: KNOB_SIZE, height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: colors.yellow,
    borderWidth: 3, borderColor: colors.white,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  joystickLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 4, textAlign: 'center' },
  disabledOverlay: {
    padding: 20, backgroundColor: colors.offWhite,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  disabledText: { fontSize: 13, color: colors.gray, textAlign: 'center', lineHeight: 20 },
});