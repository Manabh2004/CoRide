import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator
} from 'react-native';
import { auth } from '../services/firebase';
import api from '../services/api';

export default function RatingScreen({ route, navigation }) {
  const { ride, toUid, toName } = route.params;
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      await api.post('/ratings', {
        from_uid: user.uid,
        to_uid: toUid,
        ride_id: ride.id,
        score: score,
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

      <Text style={styles.scoreLabel}>
        {score === 0 ? 'Tap to rate' :
         score === 1 ? 'Poor' :
         score === 2 ? 'Below average' :
         score === 3 ? 'Average' :
         score === 4 ? 'Good' : 'Excellent!'}
      </Text>

      <TouchableOpacity
        style={[styles.button, score === 0 && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading || score === 0}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Submit Rating</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Home')}>
        <Text style={styles.skip}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#888', marginBottom: 48 },
  starsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  star: { fontSize: 52, color: '#ddd' },
  starActive: { color: '#F5C842' },
  scoreLabel: { fontSize: 16, color: '#888', marginBottom: 48, fontStyle: 'italic' },
  button: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  skip: { textAlign: 'center', color: '#aaa', fontSize: 14 },
});