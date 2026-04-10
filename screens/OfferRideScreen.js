import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { auth } from '../services/firebase';
import api from '../services/api';

export default function OfferRideScreen({ navigation }) {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [time, setTime] = useState('08:30 AM');
  const [seats, setSeats] = useState('2');
  const [rate, setRate] = useState('4');
  const [recurring, setRecurring] = useState(false);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(false);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const openMapPicker = (type) => {
    navigation.navigate('MapPicker', {
      title: type === 'origin' ? 'Select Origin' : 'Select Destination',
      onLocationPicked: (location) => {
        if (type === 'origin') setOrigin(location);
        else setDestination(location);
      },
    });
  };

  const toggleDay = (day) => {
    setDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
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
      await api.post('/rides', {
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
      });
      Alert.alert(
        'Ride Posted! 🎉',
        'Members going your way will be matched with you.',
        [{ text: 'OK', onPress: () => navigation.navigate('HostDashboard') }]
      );
    } catch (e) {
      Alert.alert('Error', 'Could not post ride. Is the Flask server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Share your journey</Text>

      <Text style={styles.label}>Your starting point</Text>
      <TouchableOpacity style={styles.mapButton} onPress={() => openMapPicker('origin')}>
        <Text style={styles.mapButtonText}>
          {origin ? `📍 ${origin.address.substring(0, 50)}` : '🗺️ Search or tap on map'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Your destination</Text>
      <TouchableOpacity style={styles.mapButton} onPress={() => openMapPicker('destination')}>
        <Text style={styles.mapButtonText}>
          {destination ? `📍 ${destination.address.substring(0, 50)}` : '🗺️ Search or tap on map'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Departure time</Text>
      <View style={styles.chipRow}>
        {['07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, time === t && styles.chipActive]}
            onPress={() => setTime(t)}
          >
            <Text style={[styles.chipText, time === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>Available seats</Text>
          <TextInput
            style={styles.input}
            value={seats}
            onChangeText={setSeats}
            keyboardType="numeric"
            placeholder="e.g. 2"
          />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>Rate (₹/km)</Text>
          <TextInput
            style={styles.input}
            value={rate}
            onChangeText={setRate}
            keyboardType="numeric"
            placeholder="e.g. 4"
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.recurringToggle}
        onPress={() => setRecurring(!recurring)}
      >
        <View style={[styles.toggle, recurring && styles.toggleActive]}>
          <View style={[styles.toggleKnob, recurring && styles.toggleKnobActive]} />
        </View>
        <Text style={styles.recurringLabel}>Recurring ride (repeat weekly)</Text>
      </TouchableOpacity>

      {recurring && (
        <View style={styles.daysRow}>
          {DAYS.map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.dayChip, days.includes(d) && styles.dayChipActive]}
              onPress={() => toggleDay(d)}
            >
              <Text style={[styles.dayChipText, days.includes(d) && styles.dayChipTextActive]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleOffer} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#1a1a1a" />
          : <Text style={styles.buttonText}>Post My Ride</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 24, marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  mapButton: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 16, marginBottom: 20, backgroundColor: '#f9f9f9' },
  mapButtonText: { fontSize: 14, color: '#444' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  chipActive: { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: 16 },
  halfField: { flex: 1 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 15, marginBottom: 20 },
  recurringToggle: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#ddd', justifyContent: 'center', padding: 2 },
  toggleActive: { backgroundColor: '#F5C842' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleKnobActive: { alignSelf: 'flex-end' },
  recurringLabel: { fontSize: 14, color: '#555', fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  dayChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  dayChipActive: { backgroundColor: '#F5C842', borderColor: '#F5C842' },
  dayChipText: { fontSize: 13, color: '#555' },
  dayChipTextActive: { color: '#1a1a1a', fontWeight: 'bold' },
  button: { backgroundColor: '#F5C842', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#1a1a1a', fontSize: 16, fontWeight: 'bold' },
});