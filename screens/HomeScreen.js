import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

export default function HomeScreen({ navigation }) {
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
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
        style={[styles.card, { backgroundColor: '#1a1a1a' }]}
        onPress={() => navigation.navigate('MemberDashboard')}
      >
        <Text style={styles.cardEmoji}>🚗</Text>
        <Text style={styles.cardTitle}>I need a ride</Text>
        <Text style={styles.cardSub}>Find a host going your way</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, { backgroundColor: '#F5C842' }]}
        onPress={() => navigation.navigate('HostDashboard')}
      >
        <Text style={styles.cardEmoji}>🛣️</Text>
        <Text style={[styles.cardTitle, { color: '#1a1a1a' }]}>I'm sharing my ride</Text>
        <Text style={[styles.cardSub, { color: '#555' }]}>Let others join your journey</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 40 },
  greeting: { fontSize: 14, color: '#888' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  logout: { fontSize: 14, color: '#888' },
  question: { fontSize: 16, color: '#555', marginBottom: 24 },
  card: { padding: 28, borderRadius: 16, marginBottom: 20 },
  cardEmoji: { fontSize: 32, marginBottom: 12 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  cardSub: { fontSize: 14, color: '#aaa' },
});