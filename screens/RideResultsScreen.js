import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { auth } from '../services/firebase';
import api from '../services/api';
import VouchBadge from '../components/VouchBadge';
import { colors, shared } from '../styles/theme';

const FALLBACK_RIDES = [
  { id: 'dummy_1', hostName: 'Abhisek P. (demo)', host_uid: 'demo1', origin: 'Saheed Nagar', destination: 'Infocity', time: '08:30 AM', seats: 2, rate: 4, rating: 4.8, overlap: 92, detour_km: 0.3 },
  { id: 'dummy_2', hostName: 'Debasish P. (demo)', host_uid: 'demo2', origin: 'Patia', destination: 'Infocity', time: '08:45 AM', seats: 1, rate: 3, rating: 4.5, overlap: 78, detour_km: 0.8 },
  { id: 'dummy_3', hostName: 'Asish D. (demo)', host_uid: 'demo3', origin: 'KIIT Square', destination: 'Infocity', time: '09:00 AM', seats: 3, rate: 5, rating: 4.2, overlap: 85, detour_km: 1.2 },
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
      `Book with ${ride.hostName} at ${ride.time}?\n₹${ride.rate}/km · +${ride.detour_km || 0}km detour for host`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            if (!usingDummy) {
              try {
                const user = auth.currentUser;
                const res = await api.post('/bookings', {
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
                const status = res.data.status;
                if (status === 'accepted') {
                  Alert.alert('Auto-accepted! ✅', 'The host auto-accepted your booking. Your ride is confirmed!');
                } else {
                  Alert.alert('Request Sent! 📨', 'Your booking request has been sent to the host. You\'ll be notified when they respond.');
                }
              } catch (e) {
                Alert.alert('Error', e.response?.data?.error || 'Could not complete booking');
                return;
              }
            }
            navigation.navigate('RideTracker', { ride });
          },
        },
      ]
    );
  };

  const renderRide = ({ item }) => {
    return (
      <View style={shared.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.hostName}>{item.hostName}</Text>
          <Text style={styles.ratingText}>⭐ {item.rating}</Text>
        </View>

        <View style={styles.vouchRow}>
          {item.host_uid && !item.host_uid.startsWith('demo') && (
            <VouchBadge
              targetUid={item.host_uid}
              targetName={item.hostName}
              showVouchButton={true}
            />
          )}
          {item.auto_accept && (
            <View style={styles.autoAcceptBadge}>
              <Text style={styles.autoAcceptText}>⚡ Auto-accept</Text>
            </View>
          )}
        </View>

        <Text style={styles.route}>{item.origin} → {item.destination}</Text>

        <View style={styles.overlapBar}>
          <View style={[styles.overlapFill, { width: `${Math.min(item.overlap, 100)}%` }]} />
        </View>
        <Text style={styles.overlapText}>
          {item.overlap}% route overlap · +{item.detour_km || 0}km detour for host
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.detail}>🕐 {item.time}</Text>
          <Text style={styles.detail}>💺 {item.seats} seats</Text>
          <Text style={[styles.detail, { fontWeight: 'bold', color: colors.black }]}>
            ₹{item.rate}/km
          </Text>
        </View>

        <TouchableOpacity
          style={[shared.button, { backgroundColor: colors.black, marginBottom: 0 }]}
          onPress={() => handleBook(item)}
        >
          <Text style={[shared.buttonText, { color: colors.white }]}>
            {item.auto_accept ? '⚡ Book instantly' : '📨 Request this ride'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.lightGray }}>
      <View style={styles.searchSummary}>
        <Text style={styles.summaryText} numberOfLines={1}>📍 {pickup.address?.substring(0, 40)}</Text>
        <Text style={styles.summaryArrow}>↓</Text>
        <Text style={styles.summaryText} numberOfLines={1}>📍 {drop.address?.substring(0, 40)}</Text>
        <Text style={styles.summaryMeta}>{time} · Max ₹{maxRate}/km</Text>
      </View>

      {usingDummy && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>⚡ Demo mode — backend unreachable</Text>
        </View>
      )}

      {loading ? (
        <View style={shared.center}>
          <ActivityIndicator size="large" color={colors.black} />
          <Text style={{ marginTop: 12, color: colors.gray }}>Finding carpools...</Text>
        </View>
      ) : rides.length === 0 ? (
        <View style={shared.center}>
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
  searchSummary: { backgroundColor: colors.black, padding: 16 },
  summaryText: { color: colors.white, fontSize: 13 },
  summaryArrow: { color: colors.yellow, fontSize: 16, marginVertical: 2 },
  summaryMeta: { color: colors.gray, fontSize: 12, marginTop: 6 },
  demoBanner: { backgroundColor: '#FFF3CD', padding: 10, paddingHorizontal: 16 },
  demoBannerText: { fontSize: 12, color: '#856404' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  hostName: { fontSize: 16, fontWeight: 'bold', color: colors.black },
  ratingText: { fontSize: 13, color: colors.subtext },
  vouchRow: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  autoAcceptBadge: { backgroundColor: '#FFF9C4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  autoAcceptText: { fontSize: 11, color: '#856404', fontWeight: '600' },
  route: { fontSize: 13, color: colors.gray, marginBottom: 10 },
  overlapBar: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginBottom: 4 },
  overlapFill: { height: 4, backgroundColor: colors.yellow, borderRadius: 2 },
  overlapText: { fontSize: 11, color: colors.gray, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  detail: { fontSize: 13, color: colors.gray },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: colors.black, textAlign: 'center', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: colors.gray, textAlign: 'center', marginBottom: 24 },
  goBack: { fontSize: 14, color: colors.yellow, fontWeight: 'bold' },
});