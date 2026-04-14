import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { auth } from '../services/firebase';
import api from '../services/api';
import { colors, shared } from '../styles/theme';

export default function OfferRideScreen({ navigation }) {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [time, setTime] = useState('08:30 AM');
  const [seats, setSeats] = useState('2');
  const [rate, setRate] = useState('4');
  const [recurring, setRecurring] = useState(false);
  const [days, setDays] = useState([]);
  const [autoAccept, setAutoAccept] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [minVouches, setMinVouches] = useState(0);
  const [loading, setLoading] = useState(false);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const openMapPicker = (type) => {
    navigation.navigate('MapPicker', {
      title: type === 'origin' ? '🚗 Select Your Starting Point' : '🏁 Select Your Destination',
      onLocationPicked: (location) => {
        if (type === 'origin') setOrigin(location);
        else setDestination(location);
      },
    });
  };

  const toggleDay = (day) => {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleOffer = async () => {
    if (!origin || !destination || !seats || !rate) {
      Alert.alert('Error', 'Please fill in all fields and pick locations on the map');
      return;
    }
    if (recurring && days.length === 0) {
      Alert.alert('Error', 'Please select at least one recurring day');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      const res = await api.post('/rides', {
        host_uid: user.uid,
        host_name: user.displayName,
        origin_address: origin.address,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_address: destination.address,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        departure_time: time,
        seats: parseInt(seats),
        rate_per_km: parseFloat(rate),
        is_recurring: recurring,
        recurring_days: days,
        auto_accept: autoAccept,
        min_rating_required: minRating,
        min_vouches_required: minVouches,
      });

      Alert.alert(
        'Ride Posted! 🎉',
        'Members going your way will be matched with you.',
        [{
          text: 'Browse available members',
          onPress: () => navigation.navigate('BrowseMembers', { ride_id: res.data.ride_id }),
        },
        { text: 'Go to Dashboard', onPress: () => navigation.navigate('HostDashboard') }]
      );
    } catch (e) {
      Alert.alert('Error', 'Could not post ride. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Share your journey</Text>

      <Text style={shared.label}>Your starting point</Text>
      <TouchableOpacity style={shared.mapButton} onPress={() => openMapPicker('origin')}>
        <Text style={shared.mapButtonText}>
          {origin ? `📍 ${origin.address.substring(0, 50)}` : '🗺️ Search or tap on map'}
        </Text>
      </TouchableOpacity>

      <Text style={shared.label}>Your destination</Text>
      <TouchableOpacity style={shared.mapButton} onPress={() => openMapPicker('destination')}>
        <Text style={shared.mapButtonText}>
          {destination ? `📍 ${destination.address.substring(0, 50)}` : '🗺️ Search or tap on map'}
        </Text>
      </TouchableOpacity>

      <Text style={shared.label}>Departure time</Text>
      <View style={styles.chipRow}>
        {['07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM'].map(t => (
          <TouchableOpacity
            key={t}
            style={[shared.chip, time === t && shared.chipActive]}
            onPress={() => setTime(t)}
          >
            <Text style={[shared.chipText, time === t && shared.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={shared.label}>Available seats</Text>
          <TextInput style={shared.input} value={seats} onChangeText={setSeats}
            keyboardType="numeric" placeholder="e.g. 2" />
        </View>
        <View style={styles.halfField}>
          <Text style={shared.label}>Rate (₹/km)</Text>
          <TextInput style={shared.input} value={rate} onChangeText={setRate}
            keyboardType="numeric" placeholder="e.g. 4" />
        </View>
      </View>

      {/* Auto-accept toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggle, autoAccept && styles.toggleOn]}
          onPress={() => setAutoAccept(!autoAccept)}
        >
          <View style={[styles.toggleKnob, autoAccept && styles.toggleKnobOn]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>Auto-accept members</Text>
          <Text style={styles.toggleSub}>
            {autoAccept
              ? 'Members meeting your criteria are confirmed instantly'
              : 'You review and accept/reject each request manually'}
          </Text>
        </View>
      </View>

      {/* Auto-accept filters — only show when auto-accept is on */}
      {autoAccept && (
        <View style={styles.filterBox}>
          <Text style={styles.filterTitle}>Auto-accept criteria</Text>
          <Text style={shared.label}>Minimum star rating</Text>
          <View style={styles.chipRow}>
            {[0, 3, 3.5, 4, 4.5].map(r => (
              <TouchableOpacity
                key={r}
                style={[shared.chip, minRating === r && shared.chipActive]}
                onPress={() => setMinRating(r)}
              >
                <Text style={[shared.chipText, minRating === r && shared.chipTextActive]}>
                  {r === 0 ? 'Any' : `${r}★`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={shared.label}>Minimum community vouches</Text>
          <View style={styles.chipRow}>
            {[0, 1, 3, 5].map(v => (
              <TouchableOpacity
                key={v}
                style={[shared.chip, minVouches === v && shared.chipActive]}
                onPress={() => setMinVouches(v)}
              >
                <Text style={[shared.chipText, minVouches === v && shared.chipTextActive]}>
                  {v === 0 ? 'Any' : `${v}+ vouches`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Recurring toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggle, recurring && styles.toggleOn]}
          onPress={() => setRecurring(!recurring)}
        >
          <View style={[styles.toggleKnob, recurring && styles.toggleKnobOn]} />
        </TouchableOpacity>
        <Text style={styles.toggleLabel}>Recurring ride (repeat weekly)</Text>
      </View>

      {recurring && (
        <View style={styles.chipRow}>
          {DAYS.map(d => (
            <TouchableOpacity
              key={d}
              style={[shared.chip, days.includes(d) && shared.chipActive]}
              onPress={() => toggleDay(d)}
            >
              <Text style={[shared.chipText, days.includes(d) && shared.chipTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[shared.button, { backgroundColor: colors.yellow }]}
        onPress={handleOffer}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.black} />
          : <Text style={[shared.buttonText, { color: colors.black }]}>Post My Ride</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.white, flexGrow: 1 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: colors.black, marginBottom: 24, marginTop: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  row: { flexDirection: 'row', gap: 16 },
  halfField: { flex: 1 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.borderDark, justifyContent: 'center', padding: 2 },
  toggleOn: { backgroundColor: colors.yellow },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white },
  toggleKnobOn: { alignSelf: 'flex-end' },
  toggleLabel: { fontSize: 14, color: colors.black, fontWeight: '600' },
  toggleSub: { fontSize: 11, color: colors.gray, marginTop: 2 },
  filterBox: { backgroundColor: colors.offWhite, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  filterTitle: { fontSize: 14, fontWeight: 'bold', color: colors.black, marginBottom: 12 },
});