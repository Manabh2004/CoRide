import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity, Alert, RefreshControl
} from 'react-native';
import { auth } from '../services/firebase';
import api from '../services/api';
import { colors, shared } from '../styles/theme';

export default function MyBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const user = auth.currentUser;
      const res = await api.get(`/bookings/member/${user.uid}`);
      setBookings(res.data);
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStartRide = (booking) => {
    const ride = {
      id: booking.ride_id,
      host_uid: booking.host_uid,
      hostName: booking.host_name,
      origin: booking.origin_address,
      destination: booking.destination_address,
      origin_lat: booking.origin_lat,
      origin_lng: booking.origin_lng,
      rate: booking.rate_per_km,
    };
    navigation.navigate('RideTracker', { ride });
  };

  const statusColor = (s) =>
    s === 'accepted' ? '#2E7D32' : s === 'rejected' ? colors.red : '#856404';

  const statusLabel = (s) =>
    s === 'accepted' ? '✅ Confirmed' : s === 'rejected' ? '❌ Declined' : '⏳ Pending';

  if (loading) return (
    <View style={shared.center}><ActivityIndicator size="large" color={colors.black} /></View>
  );

  if (bookings.length === 0) return (
    <View style={shared.center}>
      <Text style={styles.emptyText}>No bookings yet</Text>
      <Text style={{ color: colors.gray, fontSize: 14 }}>Book a carpool to see it here</Text>
    </View>
  );

  return (
    <FlatList
      data={bookings}
      keyExtractor={item => item.id?.toString()}
      style={{ backgroundColor: colors.lightGray }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchBookings(true)} tintColor={colors.black} />
      }
      renderItem={({ item }) => (
        <View style={[shared.card, { margin: 8 }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.hostName}>🚗 {item.host_name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
                {statusLabel(item.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.route}>{item.origin_address} → {item.destination_address}</Text>
          <Text style={styles.meta}>🕐 {item.departure_time} · ₹{item.rate_per_km}/km</Text>
          <Text style={styles.pickup} numberOfLines={1}>📍 Pickup: {item.pickup_address}</Text>

          {item.status === 'accepted' && (
            <TouchableOpacity
              style={[shared.button, { backgroundColor: colors.yellow, marginBottom: 0, marginTop: 12 }]}
              onPress={() => handleStartRide(item)}
            >
              <Text style={[shared.buttonText, { color: colors.black }]}>🚗 Start Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      contentContainerStyle={{ padding: 8, paddingBottom: 40 }}
    />
  );
}

const styles = StyleSheet.create({
  emptyText: { fontSize: 18, fontWeight: 'bold', color: colors.black, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  hostName: { fontSize: 15, fontWeight: 'bold', color: colors.black },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  route: { fontSize: 13, color: colors.subtext, marginBottom: 4 },
  meta: { fontSize: 12, color: colors.gray, marginBottom: 4 },
  pickup: { fontSize: 12, color: colors.gray },
});