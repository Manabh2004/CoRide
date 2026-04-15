import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { auth } from '../services/firebase';
import api from '../services/api';
import { colors, shared } from '../styles/theme';

export default function RatingScreen({ route, navigation }) {
  const { ride, toUid, toName, isHost, rideStats } = route.params;
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [vouching, setVouching] = useState(false);
  const [vouched, setVouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleVouch = async () => {
    if (!toUid || toUid === 'demo') return;
    setVouching(true);
    try {
      const user = auth.currentUser;
      await api.post('/vouches', {
        from_uid: user.uid,
        to_uid: toUid,
      });
      setVouched(true);
      Alert.alert('Vouched! 🤝', `You have vouched for ${toName}. This helps build community trust.`);
    } catch (e) {
      Alert.alert('Error', 'Could not save vouch');
    } finally {
      setVouching(false);
    }
  };

  const handleSubmit = async () => {
    if (score === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (toUid && toUid !== 'demo') {
        await api.post('/ratings', {
          from_uid: user.uid,
          to_uid: toUid,
          ride_id: ride?.id || 'demo',
          score,
        });
      }
      setSubmitted(true);
    } catch (e) {
      // Non-fatal — go home anyway
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const labels = ['', 'Poor', 'Below average', 'Average', 'Good', 'Excellent!'];

  // Eco stats from ride
  const distKm = rideStats?.distKm || 0;
  const co2Saved = Math.round(distKm * 0.21 * 10) / 10;
  const fuelSaved = Math.round(co2Saved / 2.31 * 10) / 10;
  const farePaid = rideStats?.fare || 0;

  if (submitted) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.bigEmoji}>🎉</Text>
        <Text style={styles.title}>Ride Complete!</Text>

        {/* Eco stats */}
        <View style={styles.ecoCard}>
          <Text style={styles.ecoTitle}>🌿 Your eco impact this ride</Text>
          <View style={styles.ecoRow}>
            <View style={styles.ecoItem}>
              <Text style={styles.ecoValue}>{co2Saved} kg</Text>
              <Text style={styles.ecoLabel}>CO₂ saved</Text>
            </View>
            <View style={styles.ecoItem}>
              <Text style={styles.ecoValue}>{fuelSaved} L</Text>
              <Text style={styles.ecoLabel}>Fuel saved</Text>
            </View>
            <View style={styles.ecoItem}>
              <Text style={styles.ecoValue}>{distKm} km</Text>
              <Text style={styles.ecoLabel}>Distance</Text>
            </View>
          </View>
        </View>

        {/* Payment summary */}
        {farePaid > 0 && (
          <View style={styles.paymentCard}>
            <Text style={styles.paymentTitle}>💰 Payment summary</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Distance</Text>
              <Text style={styles.paymentValue}>{distKm} km</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Rate</Text>
              <Text style={styles.paymentValue}>₹{rideStats?.rate || 0}/km</Text>
            </View>
            <View style={[styles.paymentRow, styles.paymentTotal]}>
              <Text style={styles.paymentTotalLabel}>Total fare</Text>
              <Text style={styles.paymentTotalValue}>₹{farePaid}</Text>
            </View>
          </View>
        )}

        {/* Vouch option */}
        {toUid && toUid !== 'demo' && !vouched && (
          <View style={styles.vouchCard}>
            <Text style={styles.vouchTitle}>🤝 Vouch for {toName}?</Text>
            <Text style={styles.vouchSub}>
              If you had a great experience, vouching helps them get more rides from the community.
            </Text>
            <TouchableOpacity
              style={[shared.button, { backgroundColor: colors.black, marginBottom: 0 }]}
              onPress={handleVouch}
              disabled={vouching}
            >
              {vouching
                ? <ActivityIndicator color={colors.white} />
                : <Text style={[shared.buttonText, { color: colors.white }]}>
                    ✓ Vouch for {toName}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {vouched && (
          <View style={[styles.vouchCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={[styles.vouchTitle, { color: '#2E7D32' }]}>✅ Vouched!</Text>
            <Text style={styles.vouchSub}>Your vouch has been recorded.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[shared.button, { backgroundColor: colors.yellow }]}
          onPress={handleFinish}
        >
          <Text style={[shared.buttonText, { color: colors.black }]}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Rate your ride</Text>
      <Text style={styles.subtitle}>
        How was your experience with {toName}?
      </Text>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity key={star} onPress={() => setScore(star)}>
            <Text style={[styles.star, score >= star && styles.starActive]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.scoreLabel}>
        {score === 0 ? 'Tap to rate' : labels[score]}
      </Text>

      <TouchableOpacity
        style={[
          shared.button,
          { backgroundColor: score === 0 ? '#cccccc' : colors.black }
        ]}
        onPress={handleSubmit}
        disabled={loading || score === 0}
      >
        {loading
          ? <ActivityIndicator color={colors.white} />
          : <Text style={[shared.buttonText, { color: colors.white }]}>
              Submit Rating
            </Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setSubmitted(true)} style={{ marginTop: 8 }}>
        <Text style={styles.skip}>Skip rating</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.white, flexGrow: 1 },
  bigEmoji: { fontSize: 64, textAlign: 'center', marginBottom: 12, marginTop: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.black, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.gray, marginBottom: 32, textAlign: 'center' },
  starsRow: { flexDirection: 'row', gap: 12, marginBottom: 16, justifyContent: 'center' },
  star: { fontSize: 52, color: colors.borderDark },
  starActive: { color: colors.yellow },
  scoreLabel: { fontSize: 16, color: colors.gray, marginBottom: 32, fontStyle: 'italic', textAlign: 'center' },
  skip: { textAlign: 'center', color: colors.gray, fontSize: 14, marginTop: 4 },
  ecoCard: {
    backgroundColor: '#E8F5E9', borderRadius: 16,
    padding: 20, marginBottom: 16,
  },
  ecoTitle: { fontSize: 15, fontWeight: 'bold', color: '#2E7D32', marginBottom: 16 },
  ecoRow: { flexDirection: 'row', justifyContent: 'space-around' },
  ecoItem: { alignItems: 'center' },
  ecoValue: { fontSize: 22, fontWeight: 'bold', color: '#2E7D32' },
  ecoLabel: { fontSize: 11, color: '#4CAF50', marginTop: 4 },
  paymentCard: {
    backgroundColor: colors.offWhite, borderRadius: 16,
    padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  paymentTitle: { fontSize: 15, fontWeight: 'bold', color: colors.black, marginBottom: 16 },
  paymentRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  paymentTotal: { borderBottomWidth: 0, marginTop: 4 },
  paymentLabel: { fontSize: 14, color: colors.gray },
  paymentValue: { fontSize: 14, color: colors.black },
  paymentTotalLabel: { fontSize: 16, fontWeight: 'bold', color: colors.black },
  paymentTotalValue: { fontSize: 18, fontWeight: 'bold', color: colors.black },
  vouchCard: {
    backgroundColor: colors.offWhite, borderRadius: 16,
    padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  vouchTitle: { fontSize: 16, fontWeight: 'bold', color: colors.black, marginBottom: 8 },
  vouchSub: { fontSize: 13, color: colors.gray, marginBottom: 16, lineHeight: 18 },
});