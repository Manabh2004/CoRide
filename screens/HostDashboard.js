import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { auth } from '../services/firebase';
import api from '../services/api';
import { colors, shared } from '../styles/theme';

const DUMMY_REQUESTS = [
  { id: 'req_1', member_name: 'Priya S.', status: 'pending', pickup_address: 'Saheed Nagar, Bhubaneswar', drop_address: 'Infocity, Bhubaneswar' },
  { id: 'req_2', member_name: 'Rahul M.', status: 'pending', pickup_address: 'Patia, Bhubaneswar', drop_address: 'Infocity, Bhubaneswar' },
];

const DUMMY_RIDES = [
  { id: 'dr_1', origin_address: 'Saheed Nagar', destination_address: 'Infocity', departure_time: '08:30 AM', available_seats: 2, rate_per_km: 4, origin_lat: 20.2961, origin_lng: 85.8245 },
];

export default function HostDashboard({ navigation }) {
  const user = auth.currentUser;
  const [rides, setRides] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usingDummy, setUsingDummy] = useState(false);

  const fetchHostData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get(`/rides/host/${user.uid}`);
      setRides(res.data);
      setUsingDummy(false);

      // Fetch bookings for ALL rides, not just the first one
      if (res.data.length > 0) {
        try {
          const allRequests = [];
          for (const ride of res.data) {
            const bookRes = await api.get(`/bookings/ride/${ride.id}`);
            const pending = bookRes.data.filter(b => b.status === 'pending');
            allRequests.push(...pending);
          }
          setRequests(allRequests);
        } catch (e) {
          setRequests(DUMMY_REQUESTS);
          setUsingDummy(true);
        }
      } else {
        setRequests(DUMMY_REQUESTS);
        setUsingDummy(true);
      }
    } catch (e) {
      setRides(DUMMY_RIDES);
      setRequests(DUMMY_REQUESTS);
      setUsingDummy(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.uid]);

  useEffect(() => {
    fetchHostData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchHostData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchHostData]);

  const handleRequestAction = async (request, action) => {
    if (usingDummy) {
      setRequests(prev => prev.filter(r => r.id !== request.id));
      Alert.alert(
        action === 'accepted' ? 'Accepted! ✅' : 'Rejected',
        action === 'accepted'
          ? `${request.member_name} confirmed for your ride.`
          : `${request.member_name}'s request declined.`
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
    return <View style={shared.center}><ActivityIndicator size="large" color={colors.black} /></View>;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.white }}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchHostData(true)}
          tintColor={colors.black}
        />
      }
    >
      <Text style={styles.greeting}>Hello, {user?.displayName?.split(' ')[0]} 👋</Text>
      <Text style={styles.sub}>Pull down to refresh · auto-refreshes every 30s</Text>

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
          <Text style={shared.sectionTitle}>
            Pending Requests {usingDummy ? '(demo)' : `(${requests.length})`}
          </Text>
          {requests.map(req => (
            <View key={req.id} style={shared.card}>
              <View style={styles.requestHeader}>
                <Text style={styles.memberName}>👤 {req.member_name}</Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              </View>
              <Text style={styles.requestRoute} numberOfLines={1}>
                📍 {req.pickup_address?.substring(0, 40)}
              </Text>
              <Text style={styles.requestRoute} numberOfLines={1}>
                🏁 {req.drop_address?.substring(0, 40)}
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
          <Text style={shared.sectionTitle}>My Active Rides</Text>
          <Text style={styles.sectionHint}>Tap a ride to see member locations</Text>
          {rides.map(ride => (
            <View key={ride.id} style={shared.card}>
              <View style={styles.rideCardHeader}>
                <Text style={styles.rideRoute} numberOfLines={1}>
                  {ride.origin_address?.substring(0, 22)} → {ride.destination_address?.substring(0, 22)}
                </Text>
              </View>
              <Text style={styles.rideMeta}>
                🕐 {ride.departure_time} · 💺 {ride.available_seats} seats · ₹{ride.rate_per_km}/km
              </Text>

              <View style={styles.rideActions}>
                <TouchableOpacity
                  style={styles.rideActionBtn}
                  onPress={() => navigation.navigate('RideMap', { ride })}
                >
                  <Text style={styles.rideActionText}>📍 Member map</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rideActionBtn, { backgroundColor: colors.yellow }]}
                  onPress={() => navigation.navigate('BrowseMembers', { ride_id: ride.id })}
                >
                  <Text style={[styles.rideActionText, { color: colors.black }]}>🔍 Browse members</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.grid}>
        {[
          { emoji: '💰', label: 'Earnings' },
          { emoji: '⭐', label: 'My Ratings' },
          { emoji: '🌿', label: 'Eco Impact', screen: 'EcoStats' },
          { emoji: '👤', label: 'Profile', screen: 'Profile' },
        ].map(item => (
          <TouchableOpacity
            key={item.label}
            style={styles.gridCard}
            onPress={() => item.screen && navigation.navigate(item.screen)}
          >
            <Text style={styles.gridEmoji}>{item.emoji}</Text>
            <Text style={styles.gridLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: colors.black, marginTop: 16 },
  sub: { fontSize: 12, color: colors.gray, marginBottom: 24, marginTop: 4 },
  primaryCard: { backgroundColor: colors.yellow, borderRadius: 16, padding: 24, marginBottom: 24 },
  cardEmoji: { fontSize: 32, marginBottom: 10 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: colors.black, marginBottom: 4 },
  cardSub: { fontSize: 13, color: colors.subtext },
  section: { marginBottom: 24 },
  sectionHint: { fontSize: 12, color: colors.gray, marginBottom: 12 },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  memberName: { fontSize: 15, fontWeight: 'bold', color: colors.black },
  pendingBadge: { backgroundColor: '#FFF3CD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pendingText: { fontSize: 11, color: '#856404', fontWeight: '600' },
  requestRoute: { fontSize: 12, color: colors.gray, marginBottom: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rejectBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.borderDark, alignItems: 'center' },
  rejectText: { fontSize: 14, color: colors.gray, fontWeight: '600' },
  acceptBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: colors.black, alignItems: 'center' },
  acceptText: { fontSize: 14, color: colors.white, fontWeight: '600' },
  rideCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rideRoute: { fontSize: 14, fontWeight: '600', color: colors.black, flex: 1 },
  rideArrow: { fontSize: 20, color: colors.gray, marginLeft: 8 },
  rideMeta: { fontSize: 12, color: colors.gray, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  gridCard: { width: '47%', backgroundColor: colors.offWhite, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  gridEmoji: { fontSize: 28, marginBottom: 8 },
  gridLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  rideActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  rideActionBtn: {
    flex: 1, padding: 10, borderRadius: 8,
    backgroundColor: colors.offWhite,
    alignItems: 'center', borderWidth: 1,
    borderColor: colors.border,
  },
  rideActionText: { fontSize: 12, fontWeight: '600', color: colors.black },
});