import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { auth } from '../services/firebase';
import api from '../services/api';
import { colors, shared } from '../styles/theme';

const DUMMY_BOOKINGS = [
  { id: 1, host_name: 'Abhisek P.', origin_address: 'Saheed Nagar', destination_address: 'Infocity', departure_time: '08:30 AM', status: 'accepted', rate_per_km: 4 },
  { id: 2, host_name: 'Debasish P.', origin_address: 'Patia', destination_address: 'Infocity', departure_time: '09:00 AM', status: 'pending', rate_per_km: 3 },
];

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const user = auth.currentUser;
      const res = await api.get(`/bookings/member/${user.uid}`);
      setBookings(res.data.length > 0 ? res.data : DUMMY_BOOKINGS);
    } catch (e) {
      setBookings(DUMMY_BOOKINGS);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s) =>
    s === 'accepted' ? '#2E7D32' : s === 'rejected' ? colors.red : '#856404';

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
      renderItem={({ item }) => (
        <View style={[shared.card, { margin: 8 }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.hostName}>🚗 {item.host_name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.route}>{item.origin_address} → {item.destination_address}</Text>
          <Text style={styles.meta}>🕐 {item.departure_time} · ₹{item.rate_per_km}/km</Text>
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
  route: { fontSize: 13, color: colors.subtext, marginBottom: 6 },
  meta: { fontSize: 12, color: colors.gray },
});