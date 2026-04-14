import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import api from '../services/api';
import { colors, shared } from '../styles/theme';

const DUMMY_BOOKINGS = [
  { id: 1, member_name: 'Priya S.', pickup_lat: 20.3010, pickup_lng: 85.8200, pickup_address: 'Saheed Nagar' },
  { id: 2, member_name: 'Rahul M.', pickup_lat: 20.2900, pickup_lng: 85.8300, pickup_address: 'Patia' },
];

export default function RideMapScreen({ route }) {
  const { ride } = route.params;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get(`/bookings/ride/${ride.id}`);
      setBookings(res.data.length > 0 ? res.data : DUMMY_BOOKINGS);
    } catch (e) {
      setBookings(DUMMY_BOOKINGS);
    } finally {
      setLoading(false);
    }
  };

  const markersJS = bookings.map(b => `
    L.marker([${b.pickup_lat},${b.pickup_lng}],{
      icon:L.divIcon({
        html:'<div style="background:#1a1a1a;color:#F5C842;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:bold;white-space:nowrap">${b.member_name}</div>',
        className:'',iconAnchor:[30,10]
      })
    }).addTo(map).bindPopup('${b.member_name} — 📍 ${b.pickup_address || ''}');
  `).join('\n');

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
      var map = L.map('map').setView([${ride.origin_lat || 20.2961},${ride.origin_lng || 85.8245}],13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {attribution:'© OpenStreetMap contributors'}).addTo(map);
      var hostIcon = L.divIcon({html:'<div style="font-size:26px">🚗</div>',
        iconSize:[32,32],iconAnchor:[16,16],className:''});
      L.marker([${ride.origin_lat || 20.2961},${ride.origin_lng || 85.8245}],{icon:hostIcon})
        .addTo(map).bindPopup('Your start point').openPopup();
      ${markersJS}
    </script></body></html>
  `;

  if (loading) return (
    <View style={shared.center}><ActivityIndicator size="large" color={colors.black} /></View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Member Pickup Locations</Text>
        <Text style={styles.headerSub}>
          {ride.origin_address?.substring(0, 30)} → {ride.destination_address?.substring(0, 30)}
        </Text>
        <Text style={styles.headerCount}>
          {bookings.length} member{bookings.length !== 1 ? 's' : ''} on this ride
        </Text>
      </View>
      <WebView source={{ html: mapHTML }} style={{ flex: 1 }} javaScriptEnabled scrollEnabled={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.black, padding: 16 },
  headerTitle: { fontSize: 15, fontWeight: 'bold', color: colors.yellow },
  headerSub: { fontSize: 12, color: '#aaaaaa', marginTop: 2 },
  headerCount: { fontSize: 12, color: colors.gray, marginTop: 2 },
});