import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { auth } from '../services/firebase';
import { colors, shared } from '../styles/theme';

export default function MemberDashboard({ navigation }) {
  const user = auth.currentUser;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.white }}
      contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Hello, {user?.displayName?.split(' ')[0]} 👋</Text>
      <Text style={styles.sub}>Find a carpool going your way</Text>

      <TouchableOpacity
        style={styles.primaryCard}
        onPress={() => navigation.navigate('BookRide')}
      >
        <Text style={styles.cardEmoji}>🔍</Text>
        <Text style={styles.cardTitle}>Find a Carpool</Text>
        <Text style={styles.cardSub}>Search for hosts going your way</Text>
      </TouchableOpacity>

      <View style={styles.grid}>
        {[
          { emoji: '📋', label: 'My Bookings', screen: 'MyBookings' },
          { emoji: '🌿', label: 'Eco Stats', screen: 'EcoStats' },
          { emoji: '⭐', label: 'My Ratings', screen: null },
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
  sub: { fontSize: 14, color: colors.gray, marginBottom: 24, marginTop: 4 },
  primaryCard: { backgroundColor: colors.black, borderRadius: 16, padding: 24, marginBottom: 20 },
  cardEmoji: { fontSize: 32, marginBottom: 10 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white, marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#aaaaaa' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { width: '47%', backgroundColor: colors.offWhite, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  gridEmoji: { fontSize: 28, marginBottom: 8 },
  gridLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
});