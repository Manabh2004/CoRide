import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Share, Alert, ActivityIndicator, Linking
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';
import { getLocation, watchLocation } from '../services/location';
import api from '../services/api';
import { colors, shared } from '../styles/theme';

const TRACK_BASE = 'https://coride-backend-hqwr.onrender.com/track/live';

export default function RideTrackerScreen({ route, navigation }) {
  const { ride } = route.params;
  const user = auth.currentUser;
  const isHost = user?.uid === ride.host_uid;

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const webViewRef = useRef(null);
  const locationRef = useRef(null);
  const locationSubscription = useRef(null);
  const pushIntervalRef = useRef(null);
  const sosTapCount = useRef(0);
  const sosTapTimer = useRef(null);

  useEffect(() => {
    startTracking();
    return () => {
      if (locationSubscription.current) locationSubscription.current.remove();
      if (pushIntervalRef.current) clearInterval(pushIntervalRef.current);
      if (sosTapTimer.current) clearTimeout(sosTapTimer.current);
    };
  }, []);

  const startTracking = async () => {
    const initial = await getLocation();
    if (!initial) {
      setErrorMsg('Location permission denied');
      setLoading(false);
      return;
    }

    const coords = {
      latitude: initial.coords.latitude,
      longitude: initial.coords.longitude,
    };
    locationRef.current = coords;
    setLocation(coords);
    setLoading(false);

    if (isHost) {
      // Watch position continuously
      locationSubscription.current = await watchLocation((loc) => {
        const { latitude, longitude } = loc.coords;
        const newCoords = { latitude, longitude };
        locationRef.current = newCoords;
        setLocation(newCoords);
        webViewRef.current?.injectJavaScript(`
          if (window.carMarker) {
            window.carMarker.setLatLng([${latitude}, ${longitude}]);
          }
          true;
        `);
      });

      // Push location to backend every 30 seconds
      pushIntervalRef.current = setInterval(async () => {
        if (locationRef.current) {
          try {
            await api.post('/location/update', {
              ride_id: ride.id || 'demo',
              lat: locationRef.current.latitude,
              lng: locationRef.current.longitude,
            });
          } catch (e) {}
        }
      }, 30000);

      // Push immediately on start
      try {
        await api.post('/location/update', {
          ride_id: ride.id || 'demo',
          lat: coords.latitude,
          lng: coords.longitude,
        });
      } catch (e) {}
    }
  };

  const getTrackURL = () => {
    const lat = locationRef.current?.latitude?.toFixed(5) || location?.latitude?.toFixed(5) || '0';
    const lng = locationRef.current?.longitude?.toFixed(5) || location?.longitude?.toFixed(5) || '0';
    return `${TRACK_BASE}?lat=${lat}&lng=${lng}&ride=${ride.id || 'demo'}`;
  };

  const getMapHTML = (lat, lng) => `
    <!DOCTYPE html><html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; }
        #map { height: 100vh; width: 100vw; }
        #info {
          position: absolute; top: 10px; left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.7); color: white;
          padding: 6px 14px; border-radius: 16px;
          font-family: sans-serif; font-size: 12px;
          z-index: 1000; pointer-events: none; white-space: nowrap;
        }
      </style>
    </head>
    <body>
      <div id="info">${isHost ? '📍 Sharing your live location' : '🚗 Host start point'}</div>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors', maxZoom: 19
        }).addTo(map);
        var icon = L.divIcon({
          html: '<div style="font-size:28px;line-height:1">🚗</div>',
          iconSize: [32, 32], iconAnchor: [16, 16], className: ''
        });
        window.carMarker = L.marker([${lat}, ${lng}], { icon: icon })
          .addTo(map)
          .bindPopup('${isHost ? 'Your location' : 'Host start point'}')
          .openPopup();
      </script>
    </body>
    </html>
  `;

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `🚗 I'm in a CoRide carpool.\n\n` +
          `Track my live location:\n${getTrackURL()}\n\n` +
          `Host: ${ride.hostName || ride.host_name}\n` +
          `Route: ${ride.origin || ride.origin_address} → ${ride.destination || ride.destination_address}\n\n` +
          `Shared for safety via CoRide.`,
      });
    } catch (e) {
      Alert.alert('Error', 'Could not share location');
    }
  };

  const sendSOS = async () => {
    const message =
      `🚨 SOS — I am in a CoRide carpool and may need help.\n\n` +
      `Track my live location: ${getTrackURL()}\n\n` +
      `Host: ${ride.hostName || ride.host_name}\n` +
      `Route: ${ride.origin || ride.origin_address} → ${ride.destination || ride.destination_address}\n\n` +
      `Please check on me immediately.`;

    try {
      const stored = await AsyncStorage.getItem('emergency_contacts');
      const contacts = stored ? JSON.parse(stored) : [];
      const valid = contacts.filter(c => c.name && c.phone);

      if (valid.length === 0) {
        Alert.alert(
          'No Emergency Contacts',
          'Add emergency contacts in your Profile first.',
          [
            { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') },
            { text: 'Share Location Instead', onPress: handleShare },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      // Send SMS to all contacts simultaneously
      valid.forEach((contact) => {
        const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
        Linking.openURL(smsUrl).catch(() => {
          const waUrl = `https://wa.me/91${contact.phone}?text=${encodeURIComponent(message)}`;
          Linking.openURL(waUrl).catch(() => {});
        });
      });

      Alert.alert(
        '🚨 SOS Sent',
        `Emergency SMS opened for ${valid.length} contact${valid.length > 1 ? 's' : ''}. Hit send on each message.`,
        [{ text: 'OK' }]
      );
    } catch (e) {
      Alert.alert('Error', 'Could not send SOS');
    }
  };

  const handleSOSTap = () => {
    sosTapCount.current += 1;
    if (sosTapTimer.current) clearTimeout(sosTapTimer.current);

    if (sosTapCount.current >= 3) {
      sosTapCount.current = 0;
      sendSOS();
      return;
    }

    sosTapTimer.current = setTimeout(() => {
      if (sosTapCount.current > 0 && sosTapCount.current < 3) {
        Alert.alert('SOS', 'Triple-tap rapidly to send emergency alert.');
      }
      sosTapCount.current = 0;
    }, 1500);
  };

  const handleEndRide = () => {
    Alert.alert('End Ride', 'Has the ride completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, end ride',
        onPress: () => navigation.navigate('Rating', {
          ride,
          toUid: isHost ? null : ride.host_uid,
          toName: isHost ? 'your member' : (ride.hostName || ride.host_name),
        }),
      },
    ]);
  };

  if (loading) return (
    <View style={shared.center}>
      <ActivityIndicator size="large" color={colors.black} />
      <Text style={{ marginTop: 16, color: colors.gray }}>Getting location...</Text>
    </View>
  );

  if (errorMsg) return (
    <View style={shared.center}>
      <Text style={{ color: colors.red, fontSize: 15 }}>⚠️ {errorMsg}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.rideInfo}>
        <Text style={styles.hostName}>
          {isHost ? '🛣️ You are the host' : `🚗 ${ride.hostName || ride.host_name}`}
        </Text>
        <Text style={styles.route}>
          {ride.origin || ride.origin_address} → {ride.destination || ride.destination_address}
        </Text>
        <Text style={styles.timeText}>
          {isHost
            ? 'Pushing live location every 30s — share the link for tracking'
            : 'Showing host start point · tap Share to get live tracker link'}
        </Text>
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: getMapHTML(location.latitude, location.longitude) }}
        style={{ flex: 1 }}
        javaScriptEnabled
        scrollEnabled={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>📤 Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.endBtn} onPress={handleEndRide}>
          <Text style={styles.endBtnText}>🏁 End</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sosBtn} onPress={handleSOSTap}>
          <Text style={styles.sosBtnText}>🚨 SOS</Text>
          <Text style={styles.sosHint}>triple-tap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rideInfo: { backgroundColor: colors.black, padding: 16 },
  hostName: { fontSize: 16, fontWeight: 'bold', color: colors.yellow },
  route: { fontSize: 13, color: '#aaaaaa', marginTop: 4 },
  timeText: { fontSize: 11, color: colors.gray, marginTop: 4 },
  footer: {
    flexDirection: 'row', padding: 12, gap: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingBottom: 28,
  },
  shareBtn: { flex: 1, backgroundColor: colors.black, padding: 14, borderRadius: 10, alignItems: 'center' },
  shareBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 13 },
  endBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.borderDark },
  endBtnText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  sosBtn: { flex: 1, backgroundColor: colors.red, padding: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sosBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
  sosHint: { color: 'rgba(255,255,255,0.6)', fontSize: 9, marginTop: 2 },
});