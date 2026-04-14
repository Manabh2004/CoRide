import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { colors, shared } from '../styles/theme';

export default function HomeScreen({ navigation }) {
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace('Login');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.white }}
      contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.displayName || 'Traveller'} 👋</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.question}>How do you want to travel today?</Text>

      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.black }]}
        onPress={() => navigation.navigate('MemberDashboard')}
      >
        <Text style={styles.cardEmoji}>🚗</Text>
        <Text style={[styles.cardTitle, { color: colors.white }]}>I need a ride</Text>
        <Text style={[styles.cardSub, { color: '#aaaaaa' }]}>Find a host going your way</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.yellow }]}
        onPress={() => navigation.navigate('HostDashboard')}
      >
        <Text style={styles.cardEmoji}>🛣️</Text>
        <Text style={[styles.cardTitle, { color: colors.black }]}>I'm sharing my ride</Text>
        <Text style={[styles.cardSub, { color: colors.subtext }]}>Let others join your journey</Text>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>Quick access</Text>
      <View style={styles.grid}>
        {[
          { emoji: '👥', label: 'Community', screen: 'Community' },
          { emoji: '🌿', label: 'Eco Stats', screen: 'EcoStats' },
          { emoji: '📋', label: 'My Bookings', screen: 'MyBookings' },
          { emoji: '👤', label: 'My Profile', screen: 'Profile' },
        ].map(item => (
          <TouchableOpacity
            key={item.label}
            style={styles.gridCard}
            onPress={() => navigation.navigate(item.screen)}
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
  container: { padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 32 },
  greeting: { fontSize: 14, color: colors.gray },
  name: { fontSize: 22, fontWeight: 'bold', color: colors.black },
  logout: { fontSize: 14, color: colors.gray },
  question: { fontSize: 16, color: colors.subtext, marginBottom: 20 },
  card: { padding: 28, borderRadius: 16, marginBottom: 16 },
  cardEmoji: { fontSize: 32, marginBottom: 12 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  cardSub: { fontSize: 14 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.gray, marginTop: 8, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { width: '47%', backgroundColor: colors.offWhite, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  gridEmoji: { fontSize: 28, marginBottom: 8 },
  gridLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
});