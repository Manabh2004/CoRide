import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

export default function ShareTrackerScreen() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { getLocation(); }, []);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setError('Location permission denied'); return; }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a1a1a" />
        <Text style={styles.loadingText}>Getting location...</Text>
      </View>
    );
  }

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; font-family: sans-serif; }
        #header { background: #1a1a1a; color: white; padding: 14px 16px; }
        #header h3 { margin: 0 0 4px; font-size: 15px; color: #F5C842; }
        #header p { margin: 0; font-size: 12px; color: #aaa; }
        #map { height: calc(100vh - 64px); }
      </style>
    </head>
    <body>
      <div id="header">
        <h3>🚗 CoRide Safety Tracker</h3>
        <p>Shared for safety. Location shown at time of sharing.</p>
      </div>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${location.latitude}, ${location.longitude}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        var icon = L.divIcon({
          html: '<div style="font-size:26px">🚗</div>',
          iconSize: [32, 32], iconAnchor: [16, 16], className: ''
        });
        L.marker([${location.latitude}, ${location.longitude}], { icon: icon })
          .addTo(map).bindPopup('Live location').openPopup();
      </script>
    </body>
    </html>
  `;

  return (
    <View style={{ flex: 1 }}>
      <WebView source={{ html: mapHTML }} javaScriptEnabled />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#888' },
  errorText: { fontSize: 15, color: '#e74c3c', textAlign: 'center' },
});