import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, ScrollView, ActivityIndicator
} from 'react-native';
import api from '../services/api';
import { auth } from '../services/firebase';
import { colors } from '../styles/theme';

export default function VouchBadge({ targetUid, targetName, showVouchButton = false }) {
  const [details, setDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [vouching, setVouching] = useState(false);

  useEffect(() => {
    if (targetUid && !targetUid.startsWith('demo')) {
      fetchDetails();
    }
  }, [targetUid]);

  const fetchDetails = async () => {
    try {
      const viewer = auth.currentUser?.uid || '';
      const res = await api.get(
        `/vouches/details/${targetUid}?viewer_uid=${viewer}`,
        { timeout: 5000 }
      );
      if (res.data) setDetails(res.data);
    } catch (e) {
      // Silently fail — badge just won't show
    }
  };

  const handleVouch = async () => {
    setVouching(true);
    try {
      const viewer = auth.currentUser?.uid;
      if (!viewer) return;
      await api.post('/vouches', { from_uid: viewer, to_uid: targetUid });
      await fetchDetails();
    } catch (e) {
    } finally {
      setVouching(false);
    }
  };

  // Don't render anything if no data or demo user
  if (!details) return null;

  const { total_vouches, viewer_vouched, network_vouchers, network_count } = details;

  const getBadge = () => {
    if (viewer_vouched) {
      return { text: '✓ You vouched', color: '#2E7D32', bg: '#E8F5E9' };
    }
    if (network_count > 0 && network_vouchers?.[0]?.name) {
      return { text: `🤝 ${network_vouchers[0].name} vouched`, color: '#1565C0', bg: '#E3F2FD' };
    }
    if (total_vouches > 0) {
      return { text: `🤝 ${total_vouches} vouches`, color: colors.gray, bg: colors.offWhite };
    }
    return { text: '🤝 0 vouches', color: colors.gray, bg: colors.offWhite };
  };

  const badge = getBadge();

  return (
    <>
      <TouchableOpacity
        style={[styles.badge, { backgroundColor: badge.bg }]}
        onPress={() => setShowModal(true)}
      >
        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Vouches for {targetName}</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{total_vouches}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{network_count}</Text>
                <Text style={styles.summaryLabel}>Your network</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: viewer_vouched ? '#2E7D32' : colors.gray }]}>
                  {viewer_vouched ? '✓' : '–'}
                </Text>
                <Text style={styles.summaryLabel}>You vouched</Text>
              </View>
            </View>

            {network_count > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>People you trust who vouched:</Text>
                {(network_vouchers || []).map(v => (
                  <View key={v.firebase_uid} style={styles.networkItem}>
                    <View style={styles.networkAvatar}>
                      <Text style={styles.networkAvatarText}>{v.name?.[0] || '?'}</Text>
                    </View>
                    <Text style={styles.networkName}>{v.name}</Text>
                    <Text style={styles.networkVouched}>vouched ✓</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.disclaimer}>
              Personal and network vouches are more trustworthy than community vouches. Each person can only vouch once.
            </Text>

            {showVouchButton && auth.currentUser?.uid !== targetUid && (
              <TouchableOpacity
                style={[styles.vouchBtn, { backgroundColor: viewer_vouched ? '#f5f5f5' : colors.black }]}
                onPress={handleVouch}
                disabled={vouching}
              >
                {vouching
                  ? <ActivityIndicator color={viewer_vouched ? colors.gray : colors.white} />
                  : <Text style={[styles.vouchBtnText, { color: viewer_vouched ? colors.gray : colors.white }]}>
                      {viewer_vouched ? '✗ Remove my vouch' : '✓ Vouch for this person'}
                    </Text>
                }
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.black, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 28, fontWeight: 'bold', color: colors.black },
  summaryLabel: { fontSize: 11, color: colors.gray, marginTop: 4, textAlign: 'center' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.gray, marginBottom: 12 },
  networkItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  networkAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.black, justifyContent: 'center', alignItems: 'center' },
  networkAvatarText: { color: colors.yellow, fontWeight: 'bold', fontSize: 13 },
  networkName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.black },
  networkVouched: { fontSize: 12, color: '#2E7D32' },
  disclaimer: { fontSize: 11, color: colors.gray, textAlign: 'center', lineHeight: 16, marginBottom: 16 },
  vouchBtn: { padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  vouchBtnText: { fontWeight: 'bold', fontSize: 15 },
  closeBtn: { alignItems: 'center', paddingVertical: 10 },
  closeBtnText: { color: colors.gray, fontSize: 14 },
});