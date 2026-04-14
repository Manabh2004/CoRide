import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { auth } from '../services/firebase';
import api from '../services/api';
import { colors, shared } from '../styles/theme';

const DUMMY_STATS = { total_rides: 12, co2_saved_kg: 18.4, fuel_saved_litres: 8.2, trees_equivalent: 0.9 };

export default function EcoStatsScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const user = auth.currentUser;
      const res = await api.get(`/eco/${user.uid}`);
      setStats(res.data);
    } catch (e) {
      setStats(DUMMY_STATS);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={shared.center}><ActivityIndicator size="large" color={colors.black} /></View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEmoji}>🌍</Text>
        <Text style={styles.heroTitle}>Your Eco Impact</Text>
        <Text style={styles.heroSub}>Every carpool makes a difference</Text>
      </View>

      <View style={styles.statsGrid}>
        {[
          { value: stats.total_rides, label: 'Rides shared' },
          { value: `${stats.co2_saved_kg} kg`, label: 'CO₂ saved' },
          { value: `${stats.fuel_saved_litres} L`, label: 'Fuel saved' },
          { value: stats.trees_equivalent, label: 'Trees equivalent' },
        ].map(item => (
          <View key={item.label} style={styles.statCard}>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          By carpooling you've avoided {stats.co2_saved_kg} kg of CO₂ — equivalent to planting {stats.trees_equivalent} trees. Keep going! 🌱
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.white, flexGrow: 1 },
  heroCard: { backgroundColor: colors.black, borderRadius: 16, padding: 28, alignItems: 'center', marginBottom: 24 },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: colors.yellow },
  heroSub: { fontSize: 13, color: '#aaaaaa', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: '47%', backgroundColor: colors.offWhite, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 24, fontWeight: 'bold', color: colors.black, marginBottom: 4 },
  statLabel: { fontSize: 12, color: colors.gray, textAlign: 'center' },
  infoCard: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16 },
  infoText: { fontSize: 14, color: '#2E7D32', lineHeight: 20 },
});