import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator
} from 'react-native';
import { auth } from '../services/firebase';
import api from '../services/api';
import { colors, shared } from '../styles/theme';

export default function RatingScreen({ route, navigation }) {
  const { ride, toUid, toName } = route.params;
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) { Alert.alert('Error', 'Please select a rating'); return; }
    setLoading(true);
    try {
      const user = auth.currentUser;
      await api.post('/ratings', {
        from_uid: user.uid, to_uid: toUid, ride_id: ride.id, score,
      });
      Alert.alert('Thanks! ⭐', 'Your rating has been submitted.', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (e) {
      navigation.navigate('Home');
    } finally {
      setLoading(false);
    }
  };

  const labels = ['', 'Poor', 'Below average', 'Average', 'Good', 'Excellent!'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rate your ride</Text>
      <Text style={styles.subtitle}>How was your experience with {toName}?</Text>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity key={star} onPress={() => setScore(star)}>
            <Text style={[styles.star, score >= star && styles.starActive]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.scoreLabel}>{score === 0 ? 'Tap to rate' : labels[score]}</Text>

      <TouchableOpacity
        style={[shared.button, { backgroundColor: score === 0 ? '#cccccc' : colors.black }]}
        onPress={handleSubmit}
        disabled={loading || score === 0}
      >
        {loading
          ? <ActivityIndicator color={colors.white} />
          : <Text style={[shared.buttonText, { color: colors.white }]}>Submit Rating</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Home')}>
        <Text style={styles.skip}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32, backgroundColor: colors.white },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.black, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.gray, marginBottom: 48 },
  starsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  star: { fontSize: 52, color: colors.borderDark },
  starActive: { color: colors.yellow },
  scoreLabel: { fontSize: 16, color: colors.gray, marginBottom: 48, fontStyle: 'italic' },
  skip: { textAlign: 'center', color: colors.gray, fontSize: 14, marginTop: 12 },
});