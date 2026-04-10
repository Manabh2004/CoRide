import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { auth } from '../services/firebase';
import api from '../services/api';

const FALLBACK_RIDES = [
  { id: 'dummy_1', hostName: 'Abhisek P. (demo)', origin: 'Saheed Nagar', destination: 'Infocity', time: '08:30 AM', seats: 2, rate: 4, rating: 4.8, overlap: 92 },
  { id: 'dummy_2', hostName: 'Debasish P. (demo)', origin: 'Patia', destination: 'Infocity', time: '08:45 AM', seats: 1, rate: 3, rating: 4.5, overlap: 78 },
  { id: 'dummy_3', hostName: 'Asish D. (demo)', origin: 'KIIT Square', destination: 'Infocity', time: '09:00 AM', seats: 3, rate: 5, rating: 4.2, overlap: 85 },
];

export default function RideResultsScreen({ route, navigation }) {
  const { pickup, drop, time, maxRate } = route.params;
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingDummy, setUsingDummy] = useState(false);

  useEffect(() => { fetchRides(); }, []);

  const fetchRides = async () => {
    try {
      const user = auth.currentUser;
      const response = await api.post('/rides/match', {
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        max_rate: maxRate,
        member_uid: user?.uid || '',
      });
      setRides(response.data);
      setUsingDummy(false);
    } catch (e) {
      setRides(FALLBACK_RIDES.filter(r => r.rate <= maxRate));
      setUsingDummy(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (ride) => {
    Alert.alert(
      'Confirm Booking',
      `Book with ${ride.hostName} at ${ride.time}?\n₹${ride.rate}/km`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            if (!usingDummy) {
              try {
                const user = auth.currentUser;
                await api.post('/bookings', {
                  ride_id: ride.id,
                  member_uid: user.uid,
                  member_name: user.displayName,
                  pickup_address: pickup.address,
                  pickup_lat: pickup.lat,
                  pickup_lng: pickup.lng,
                  drop_address: drop.address,
                  drop_lat: drop.lat,
                  drop_lng: drop.lng,
                });
              } catch (e) {
                Alert.alert('Error', 'Could not complete booking');
                return;
              }
            }
            navigation.navigate('RideTracker', { ride });
          },
        },
      ]
    );
  };

  const renderRide = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.hostName}>{item.hostName}</Text>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {item.rating}</Text>
        </View>
      </View>
      <Text style={styles.route}>{item.origin} → {item.destination}</Text>
      <View style={styles.overlapBar}>
        <View style={[styles.overlapFill, { width: `${item.overlap}%` }]} />
      </View>
      <Text style={styles.overlapText}>{item.overlap}% route overlap</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.detail}>🕐 {item.time}</Text>
        <Text style={styles.detail}>💺 {item.seats} seats</Text>
        <Text style={[styles.detail, styles.rate]}>₹{item.rate}/km</Text>
      </View>
      <TouchableOpacity style={styles.bookButton} onPress={() => handleBook(item)}>
        <Text style={styles.bookButtonText}>Book this ride</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchSummary}>
        <Text style={styles.summaryText} numberOfLines={1}>📍 {pickup.address?.substring(0, 40)}</Text>
        <Text style={styles.summaryArrow}>↓</Text>
        <Text style={styles.summaryText} numberOfLines={1}>📍 {drop.address?.substring(0, 40)}</Text>
        <Text style={styles.summaryMeta}>{time} · Max ₹{maxRate}/km</Text>
      </View>

      {usingDummy && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>⚡ Demo mode — start Flask server for real results</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a1a1a" />
          <Text style={styles.loadingText}>Finding carpools...</Text>
        </View>
      ) : rides.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No hosts match ₹{maxRate}/km</Text>
          <Text style={styles.emptyHint}>Try increasing your maximum rate</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.goBack}>← Adjust and search again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={item => item.id?.toString()}
          renderItem={renderRide}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchSummary: { backgroundColor: '#1a1a1a', padding: 16 },
  summaryText: { color: '#fff', fontSize: 13 },
  summaryArrow: { color: '#F5C842', fontSize: 16, marginVertical: 2 },
  summaryMeta: { color: '#aaa', fontSize: 12, marginTop: 6 },
  demoBanner: { backgroundColor: '#FFF3CD', padding: 10, paddingHorizontal: 16 },
  demoBannerText: { fontSize: 12, color: '#856404' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#888' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 18, marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  hostName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  ratingBadge: { backgroundColor: '#f9f9f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ratingText: { fontSize: 13, color: '#555' },
  route: { fontSize: 13, color: '#666', marginBottom: 10 },
  overlapBar: { height: 4, backgroundColor: '#eee', borderRadius: 2, marginBottom: 4 },
  overlapFill: { height: 4, backgroundColor: '#F5C842', borderRadius: 2 },
  overlapText: { fontSize: 11, color: '#aaa', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  detail: { fontSize: 13, color: '#666' },
  rate: { fontWeight: 'bold', color: '#1a1a1a' },
  bookButton: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, alignItems: 'center' },
  bookButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24 },
  goBack: { fontSize: 14, color: '#F5C842', fontWeight: 'bold' },
});