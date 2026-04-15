import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { auth } from '../services/firebase';
import api from '../services/api';
import { colors, shared } from '../styles/theme';

export default function BookRideScreen({ navigation }) {
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [time, setTime] = useState('08:30 AM');
  const [maxRate, setMaxRate] = useState(4);
  const [loading, setLoading] = useState(false);

  const openMapPicker = (type) => {
    navigation.navigate('MapPicker', {
      title: type === 'pickup' ? '📍 Select Pickup Location' : '🏁 Select Drop Location',
      onLocationPicked: (location) => {
        if (type === 'pickup') setPickup(location);
        else setDrop(location);
      },
    });
  };

  const handleSearch = async () => {
    if (!pickup || !drop) {
      alert('Please select both pickup and drop locations');
      return;
    }
    setLoading(true);

    // Post search in background — never block navigation on this
    try {
      const user = auth.currentUser;
      if (user) {
        api.post('/searches', {
          member_uid: user.uid,
          member_name: user.displayName || 'Member',
          pickup_address: pickup.address,
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          drop_address: drop.address,
          drop_lat: drop.lat,
          drop_lng: drop.lng,
          departure_time: time,
          max_rate: maxRate,
        }).catch(() => {}); // fire and forget
      }
    } catch (e) {}

    setLoading(false);
    navigation.navigate('RideResults', { pickup, drop, time, maxRate });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Your journey</Text>

      <Text style={shared.label}>Pickup location</Text>
      <TouchableOpacity style={shared.mapButton} onPress={() => openMapPicker('pickup')}>
        <Text style={shared.mapButtonText}>
          {pickup ? `📍 ${pickup.address.substring(0, 50)}` : '🗺️ Search or tap on map'}
        </Text>
      </TouchableOpacity>

      <Text style={shared.label}>Drop location</Text>
      <TouchableOpacity style={shared.mapButton} onPress={() => openMapPicker('drop')}>
        <Text style={shared.mapButtonText}>
          {drop ? `📍 ${drop.address.substring(0, 50)}` : '🗺️ Search or tap on map'}
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

      <Text style={shared.label}>Maximum rate you'll pay: ₹{maxRate}/km</Text>
      <Text style={styles.rateHint}>
        {maxRate <= 3 ? '⚡ Lower rate — fewer hosts may match' :
         maxRate <= 5 ? '✅ Balanced rate — good number of hosts' :
         '🔥 Higher rate — more hosts will match'}
      </Text>
      <View style={styles.chipRow}>
        {[2, 3, 4, 5, 6, 7].map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.rateChip, maxRate === r && styles.rateChipActive]}
            onPress={() => setMaxRate(r)}
          >
            <Text style={[styles.rateChipText, maxRate === r && styles.rateChipTextActive]}>₹{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[shared.button, { backgroundColor: colors.black }]}
        onPress={handleSearch}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.white} />
          : <Text style={[shared.buttonText, { color: colors.white }]}>Search Carpools</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.white, flexGrow: 1 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: colors.black, marginBottom: 24, marginTop: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  rateHint: { fontSize: 12, color: colors.gray, marginBottom: 12, fontStyle: 'italic' },
  rateChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.borderDark },
  rateChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  rateChipText: { fontSize: 14, color: colors.subtext, fontWeight: '600' },
  rateChipTextActive: { color: colors.black },
});