import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView
} from 'react-native';

export default function BookRideScreen({ navigation }) {
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [time, setTime] = useState('08:30 AM');
  const [maxRate, setMaxRate] = useState(4);

  const openMapPicker = (type) => {
    navigation.navigate('MapPicker', {
      title: type === 'pickup' ? 'Select Pickup' : 'Select Drop',
      onLocationPicked: (location) => {
        if (type === 'pickup') setPickup(location);
        else setDrop(location);
      },
    });
  };

  const handleSearch = () => {
    if (!pickup || !drop) {
      alert('Please select both pickup and drop locations');
      return;
    }
    navigation.navigate('RideResults', { pickup, drop, time, maxRate });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Your journey</Text>

      <Text style={styles.label}>Pickup location</Text>
      <TouchableOpacity style={styles.mapButton} onPress={() => openMapPicker('pickup')}>
        <Text style={styles.mapButtonText}>
          {pickup ? `📍 ${pickup.address.substring(0, 50)}` : '🗺️ Search or tap on map'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Drop location</Text>
      <TouchableOpacity style={styles.mapButton} onPress={() => openMapPicker('drop')}>
        <Text style={styles.mapButtonText}>
          {drop ? `📍 ${drop.address.substring(0, 50)}` : '🗺️ Search or tap on map'}
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

      <Text style={styles.label}>Maximum rate you'll pay: ₹{maxRate}/km</Text>
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

      <TouchableOpacity style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>Search Carpools</Text>
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
  rateHint: { fontSize: 12, color: '#888', marginBottom: 12, fontStyle: 'italic' },
  rateChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  rateChipActive: { backgroundColor: '#F5C842', borderColor: '#F5C842' },
  rateChipText: { fontSize: 14, color: '#555', fontWeight: '600' },
  rateChipTextActive: { color: '#1a1a1a' },
  button: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});