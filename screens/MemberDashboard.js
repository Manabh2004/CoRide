import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { auth } from '../services/firebase';

export default function MemberDashboard({ navigation }) {
  const user = auth.currentUser;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Hello, {user?.displayName?.split(' ')[0]} 👋</Text>
      <Text style={styles.sub}>What would you like to do?</Text>

      <TouchableOpacity
        style={styles.primaryCard}
        onPress={() => navigation.navigate('BookRide')}
      >
        <Text style={styles.cardEmoji}>🔍</Text>
        <Text style={styles.cardTitle}>Find a Carpool</Text>
        <Text style={styles.cardSub}>Search for hosts going your way</Text>
      </TouchableOpacity>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridCard}>
          <Text style={styles.gridEmoji}>📋</Text>
          <Text style={styles.gridLabel}>My Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridCard}>
          <Text style={styles.gridEmoji}>🌿</Text>
          <Text style={styles.gridLabel}>Eco Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridCard}>
          <Text style={styles.gridEmoji}>⭐</Text>
          <Text style={styles.gridLabel}>My Ratings</Text>
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
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginTop: 16 },
  sub: { fontSize: 14, color: '#888', marginBottom: 24, marginTop: 4 },
  primaryCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24, marginBottom: 20 },
  cardEmoji: { fontSize: 32, marginBottom: 10 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#aaa' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { width: '47%', backgroundColor: '#f9f9f9', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  gridEmoji: { fontSize: 28, marginBottom: 8 },
  gridLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
});