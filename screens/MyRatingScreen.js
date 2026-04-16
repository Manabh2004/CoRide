import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { auth } from '../services/firebase';
import api from '../services/api';
import { colors, shared } from '../styles/theme';

export default function MyRatingsScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRatings(); }, []);

  const fetchRatings = async () => {
    try {
      const user = auth.currentUser;
      const res = await api.get(`/ratings/${user.uid}`);
      setData(res.data);
    } catch (e) {
      setData({ avg_rating: 5.0, rating_count: 0, recent: [] });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={shared.center}><ActivityIndicator size="large" color={colors.black} /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.avgRating}>{data.avg_rating}</Text>
        <Text style={styles.stars}>{'★'.repeat(Math.round(data.avg_rating))}{'☆'.repeat(5 - Math.round(data.avg_rating))}</Text>
        <Text style={styles.ratingCount}>{data.rating_count} rating{data.rating_count !== 1 ? 's' : ''} received</Text>
      </View>

      {data.recent.length === 0 ? (
        <View style={[shared.center, { marginTop: 40 }]}>
          <Text style={{ color: colors.gray, fontSize: 14 }}>No ratings yet</Text>
          <Text style={{ color: colors.gray, fontSize: 12, marginTop: 8 }}>Complete rides to receive ratings</Text>
        </View>
      ) : (
        <>
          <Text style={[shared.sectionTitle, { marginBottom: 12 }]}>Recent ratings</Text>
          {data.recent.map((r, i) => (
            <View key={i} style={[shared.card, { marginBottom: 12 }]}>
              <View style={styles.ratingRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{r.from_name?.[0] || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fromName}>{r.from_name}</Text>
                  <Text style={styles.ratingDate}>{new Date(r.created_at).toLocaleDateString('en-IN')}</Text>
                </View>
                <Text style={styles.score}>{'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.white, flexGrow: 1 },
  summaryCard: { backgroundColor: colors.black, borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 32 },
  avgRating: { fontSize: 56, fontWeight: 'bold', color: colors.yellow },
  stars: { fontSize: 24, color: colors.yellow, marginVertical: 8 },
  ratingCount: { fontSize: 14, color: colors.gray },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.black, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.yellow, fontWeight: 'bold', fontSize: 16 },
  fromName: { fontSize: 14, fontWeight: '600', color: colors.black },
  ratingDate: { fontSize: 11, color: colors.gray, marginTop: 2 },
  score: { fontSize: 16, color: colors.yellow },
});