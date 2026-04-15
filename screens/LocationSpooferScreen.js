import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  PanResponder, Animated, Switch, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { colors } from '../styles/theme';

export const SPOOFER_KEY = 'location_spoofer';
const JOYSTICK_SIZE = 140;
const KNOB_SIZE = 50;
const MAX_OFFSET = (JOYSTICK_SIZE - KNOB_SIZE) / 2;

export default function LocationSpooferScreen() {
  const [enabled, setEnabled] = useState(false);
  const [spoofedLocation, setSpoofedLocation] = useState({ lat: 20.2961, lng: 85.8245 });
  const webViewRef = useRef(null);
  const knobPos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const currentOffset = useRef({ x: 0, y: 0 });
  const locationRef = useRef({ lat: 20.2961, lng: 85.8245 });
  const moveInterval = useRef(null);

  useEffect(() => {
    loadState();
    return () => { if (moveInterval.current) clearInterval(moveInterval.current); };
  }, []);

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(SPOOFER_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setEnabled(!!data.enabled);
        if (data.location) {
          setSpoofedLocation(data.location);
          locationRef.current = data.location;
        }
      }
    } catch (e) {}
  };

  const saveState = async (en, loc) => {
    try {
      await AsyncStorage.setItem(SPOOFER_KEY, JSON.stringify({
        enabled: en,
        location: loc,
      }));
    } catch (e) {}
  };

  const toggleEnabled = async (val) => {
    setEnabled(val);
    await saveState(val, locationRef.current);
    if (val) {
      Alert.alert(
        '⚠️ Spoofer On',
        'App will now use fake GPS. Use joystick or drag pin to move location.',
        [{ text: 'Got it' }]
      );
    } else {
      Alert.alert('Spoofer Off', 'App will now use your real GPS location.');
    }
  };

  const startMoving = () => {
    if (moveInterval.current) return;
    moveInterval.current = setInterval(async () => {
      const { x, y } = currentOffset.current;
      if (Math.abs(x) < 3 && Math.abs(y) < 3) return;

      const normX = x / MAX_OFFSET;
      const normY = y / MAX_OFFSET;
      const newLat = locationRef.current.lat - normY * 0.0003;
      const newLng = locationRef.current.lng + normX * 0.0003;
      const newLoc = { lat: newLat, lng: newLng };

      locationRef.current = newLoc;
      setSpoofedLocation(newLoc);

      webViewRef.current?.injectJavaScript(`
        if (window.spooferMarker) {
          window.spooferMarker.setLatLng([${newLat}, ${newLng}]);
          map.panTo([${newLat}, ${newLng}]);
        }
        true;
      `);

      if (enabled) await saveState(true, newLoc);
    }, 100);
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
        html:'<div style="width:20px;height:20px;background:#F5C842;border:3px solid #1a1a1a;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
        iconSize:[20,20],iconAnchor:[10,10],className:''
      });

      window.spooferMarker = L.marker(
        [${spoofedLocation.lat},${spoofedLocation.lng}],
        {icon:icon, draggable:true}
      ).addTo(map).bindPopup('Drag to set fake location').openPopup();

      window.spooferMarker.on('dragend', function(e) {
        var pos = e.target.getLatLng();
        window.ReactNativeWebView.postMessage(
          JSON.stringify({lat:pos.lat, lng:pos.lng})
        );
      });
    </script></body></html>
  `;

  const handleMapMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      locationRef.current = { lat: data.lat, lng: data.lng };
      setSpoofedLocation({ lat: data.lat, lng: data.lng });
      if (enabled) await saveState(true, { lat: data.lat, lng: data.lng });
    } catch (e) {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>📍 Location Spoofer</Text>
          <Text style={styles.headerSub}>For testing only — disable before real demo</Text>
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
            ⚠️ ACTIVE: {spoofedLocation.lat.toFixed(5)}, {spoofedLocation.lng.toFixed(5)}
          </Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHTML }}
          onMessage={handleMapMessage}
          style={{ flex: 1 }}
          javaScriptEnabled
          scrollEnabled={false}
        />

        {enabled && (
          <View style={styles.joystickContainer} {...panResponder.panHandlers}>
            <View style={styles.joystickBase}>
              <Animated.View
                style={[
                  styles.joystickKnob,
                  { transform: knobPos.getTranslateTransform() }
                ]}
              />
              <Text style={styles.joystickLabel}>Hold to move</Text>
            </View>
          </View>
        )}
      </View>

      {!enabled && (
        <View style={styles.disabledMsg}>
          <Text style={styles.disabledText}>
            Toggle ON to activate fake GPS.{'\n'}
            Drag the yellow pin or use joystick to set location.
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
  warningBanner: { backgroundColor: '#FFF3CD', padding: 8, paddingHorizontal: 16 },
  warningText: { fontSize: 11, color: '#856404', fontWeight: '600' },
  joystickContainer: {
    position: 'absolute', bottom: 24, right: 16,
    alignItems: 'center',
  },
  joystickBase: {
    width: JOYSTICK_SIZE, height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.yellow,
  },
  joystickKnob: {
    position: 'absolute',
    width: KNOB_SIZE, height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: colors.yellow,
    borderWidth: 3, borderColor: colors.white,
    elevation: 4,
  },
  joystickLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, marginTop: KNOB_SIZE },
  disabledMsg: {
    padding: 20, backgroundColor: colors.offWhite,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  disabledText: { fontSize: 13, color: colors.gray, textAlign: 'center', lineHeight: 20 },
});