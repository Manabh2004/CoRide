import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { auth } from '../services/firebase';
import api from '../services/api';

const DUMMY_REQUESTS = [
  {
    id: 'req_1', member_name: 'Priya S.', status: 'pending',
    pickup_address: 'Saheed Nagar, Bhubaneswar, Odisha',
    drop_address: 'Infocity, Bhubaneswar, Odisha',
  },
  {
    id: 'req_2', member_name: 'Rahul M.', status: 'pending',
    pickup_address: 'Patia, Bhubaneswar, Odisha',
    drop_address: 'Infocity, Bhubaneswar, Odisha',
  },
];

export default function HostDashboard({ navigation }) {
  const user = auth.currentUser;
  const [rides, setRides] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingDummy, setUsingDummy] = useState(false);

  useEffect(() => {
    fetchHostData();
  }, []);

  const fetchHostData = async () => {
    try {
      const res = await api.get(`/rides/host/${user.uid}`);
      setRides(res.data);
      if (res.data.length > 0) {
        try {
          const bookRes = await api.get(`/bookings/ride/${res.data[0].id}`);
          setRequests(bookRes.data.filter(b => b.status === 'pending'));
        } catch (e) {
          setRequests(DUMMY_REQUESTS);
          setUsingDummy(true);
        }
      } else {
        setRequests(DUMMY_REQUESTS);
        setUsingDummy(true);
      }
    } catch (e) {
      setRequests(DUMMY_REQUESTS);
      setUsingDummy(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (request, action) => {
    if (usingDummy) {
      setRequests(prev => prev.filter(r => r.id !== request.id));
      Alert.alert(
        action === 'accepted' ? 'Accepted! ✅' : 'Rejected',
        action === 'accepted'
          ? `${request.member_name} has been confirmed for your ride.`
          : `${request.member_name}'s request has been declined.`
      );
      return;
    }
    try {
      await api.put(`/bookings/${request.id}/status`, { status: action });
      setRequests(prev => prev.filter(r => r.id !== request.id));
      Alert.alert(
        action === 'accepted' ? 'Accepted! ✅' : 'Rejected',
        action === 'accepted' ? `${request.member_name} confirmed.` : 'Request declined.'
      );
    } catch (e) {
      Alert.alert('Error', 'Could not update request');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Hello, {user?.displayName?.split(' ')[0]} 👋</Text>
      <Text style={styles.sub}>Manage your rides</Text>

      <TouchableOpacity
        style={styles.primaryCard}
        onPress={() => navigation.navigate('OfferRide')}
      >
        <Text style={styles.cardEmoji}>🛣️</Text>
        <Text style={styles.cardTitle}>Offer a Ride</Text>
        <Text style={styles.cardSub}>Post your route and let members join</Text>
      </TouchableOpacity>

      {requests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Pending Requests {usingDummy ? '(demo)' : ''}
          </Text>
          {requests.map(req => (
            <View key={req.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.memberName}>👤 {req.member_name}</Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              </View>
              <Text style={styles.requestRoute} numberOfLines={1}>
                📍 {req.pickup_address?.substring(0, 35)}
              </Text>
              <Text style={styles.requestRoute} numberOfLines={1}>
                🏁 {req.drop_address?.substring(0, 35)}
              </Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleRequestAction(req, 'rejected')}
                >
                  <Text style={styles.rejectText}>✗ Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleRequestAction(req, 'accepted')}
                >
                  <Text style={styles.acceptText}>✓ Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {rides.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Active Rides</Text>
          {rides.map(ride => (
            <View key={ride.id} style={styles.rideCard}>
              <Text style={styles.rideRoute} numberOfLines={1}>
                {ride.origin_address?.substring(0, 25)} → {ride.destination_address?.substring(0, 25)}
              </Text>
              <Text style={styles.rideMeta}>
                🕐 {ride.departure_time} · 💺 {ride.available_seats} seats · ₹{ride.rate_per_km}/km
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridCard}>
          <Text style={styles.gridEmoji}>💰</Text>
          <Text style={styles.gridLabel}>Earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridCard}>
          <Text style={styles.gridEmoji}>⭐</Text>
          <Text style={styles.gridLabel}>My Ratings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridCard}>
          <Text style={styles.gridEmoji}>🌿</Text>
          <Text style={styles.gridLabel}>Eco Impact</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridCard}>
          <Text style={styles.gridEmoji}>👥</Text>
          <Text style={styles.gridLabel}>Community</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginTop: 16 },
  sub: { fontSize: 14, color: '#888', marginBottom: 24, marginTop: 4 },
  primaryCard: { backgroundColor: '#F5C842', borderRadius: 16, padding: 24, marginBottom: 24 },
  cardEmoji: { fontSize: 32, marginBottom: 10 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#555' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
  requestCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#eee', elevation: 2 },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  memberName: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },
  pendingBadge: { backgroundColor: '#FFF3CD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pendingText: { fontSize: 11, color: '#856404', fontWeight: '600' },
  requestRoute: { fontSize: 12, color: '#666', marginBottom: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rejectBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  rejectText: { fontSize: 14, color: '#888', fontWeight: '600' },
  acceptBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#1a1a1a', alignItems: 'center' },
  acceptText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  rideCard: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 14, marginBottom: 10 },
  rideRoute: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  rideMeta: { fontSize: 12, color: '#888' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  gridCard: { width: '47%', backgroundColor: '#f9f9f9', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  gridEmoji: { fontSize: 28, marginBottom: 8 },
  gridLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
});