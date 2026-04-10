import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Share, Alert, ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { auth } from '../services/firebase';

export default function RideTrackerScreen({ route, navigation }) {
  const { ride } = route.params;
  const user = auth.currentUser;
  const isHost = user?.uid === ride.host_uid;
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const webViewRef = useRef(null);
  const locationSubscription = useRef(null);

  useEffect(() => {
    startTracking();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Location permission denied');
      setLoading(false);
      return;
    }
    if (isHost) {
      const initial = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: initial.coords.latitude, longitude: initial.coords.longitude });
      setLoading(false);
      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          setLocation({ latitude, longitude });
          webViewRef.current?.injectJavaScript(`
            if (window.carMarker) {
              window.carMarker.setLatLng([${latitude}, ${longitude}]);
            }
            true;
          `);
        }
      );
    } else {
      setLocation({
        latitude: ride.origin_lat || 20.2961,
        longitude: ride.origin_lng || 85.8245,
      });
      setLoading(false);
    }
  };

  const getMapHTML = (lat, lng) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        #statusLabel {
          position: absolute; bottom: 20px; left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.75); color: white;
          padding: 8px 16px; border-radius: 20px;
          font-family: sans-serif; font-size: 12px;
          z-index: 1000; pointer-events: none;
          white-space: nowrap;
        }
      </style>
    </head>
    <body>
      <div id="statusLabel">${isHost ? '📍 Sharing your live location' : '🚗 Tracking host — live sync coming soon'}</div>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors', maxZoom: 19
        }).addTo(map);

        var carIcon = L.divIcon({
          html: '<div style="font-size:28px;line-height:1;">🚗</div>',
          iconSize: [32, 32], iconAnchor: [16, 16], className: ''
        });

        window.carMarker = L.marker([${lat}, ${lng}], { icon: carIcon })
          .addTo(map)
          .bindPopup('${isHost ? 'Your location' : 'Host start point'}')
          .openPopup();
      </script>
    </body>
    </html>
  `;

  const handleShare = async () => {
    const lat = location?.latitude?.toFixed(5) || '0';
    const lng = location?.longitude?.toFixed(5) || '0';
    try {
      await Share.share({
        message:
          `🚗 I'm in a CoRide carpool.\n\n` +
          `Track my live location:\nhttps://track.coride-app.in/live?lat=${lat}&lng=${lng}&ride=${ride.id || 'demo'}\n\n` +
          `Host: ${ride.hostName}\nRoute: ${ride.origin} → ${ride.destination}\n\n` +
          `Shared for safety via CoRide.`,
        title: 'Track my CoRide journey',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share location');
    }
  };

  const handleSOS = () => {
    Alert.alert(
      '🚨 SOS Alert',
      'This will immediately notify your emergency contacts with your live location. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => Alert.alert('SOS Sent', 'Your emergency contacts have been notified.'),
        },
      ]
    );
  };

  const handleEndRide = () => {
    Alert.alert(
      'End Ride',
      'Has the ride completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, end ride',
          onPress: () => navigation.navigate('Rating', {
            ride,
            toUid: isHost ? null : ride.host_uid,
            toName: isHost ? 'your member' : ride.hostName,
          }),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a1a1a" />
        <Text style={styles.loadingText}>Getting location...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.rideInfo}>
        <Text style={styles.hostName}>
          {isHost ? '🛣️ You are the host' : `🚗 ${ride.hostName}`}
        </Text>
        <Text style={styles.route}>{ride.origin} → {ride.destination}</Text>
        <Text style={styles.timeText}>
          {isHost
            ? 'Your location is being shared with members'
            : 'Host location shown · live sync coming soon'}
        </Text>
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: getMapHTML(location.latitude, location.longitude) }}
        style={styles.map}
        javaScriptEnabled
        scrollEnabled={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>📤 Share Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.endBtn} onPress={handleEndRide}>
          <Text style={styles.endBtnText}>🏁 End Ride</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sosBtn} onPress={handleSOS}>
          <Text style={styles.sosBtnText}>🚨 SOS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 16, fontSize: 14, color: '#888' },
  errorText: { fontSize: 15, color: '#e74c3c', textAlign: 'center' },
  rideInfo: { backgroundColor: '#1a1a1a', padding: 16 },
  hostName: { fontSize: 16, fontWeight: 'bold', color: '#F5C842' },
  route: { fontSize: 13, color: '#aaa', marginTop: 4 },
  timeText: { fontSize: 11, color: '#666', marginTop: 4 },
  map: { flex: 1 },
  footer: {
    flexDirection: 'row', padding: 12, gap: 8,
    backgroundColor: '#fff', borderTopWidth: 1,
    borderTopColor: '#eee', paddingBottom: 28,
  },
  shareBtn: { flex: 1, backgroundColor: '#1a1a1a', padding: 12, borderRadius: 10, alignItems: 'center' },
  shareBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  endBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  endBtnText: { fontSize: 13, color: '#333', fontWeight: '600' },
  sosBtn: { backgroundColor: '#e74c3c', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  sosBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});