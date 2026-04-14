import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, ScrollView, Modal
} from 'react-native';
import { WebView } from 'react-native-webview';
import { auth } from '../services/firebase';
import api from '../services/api';
import { colors, shared } from '../styles/theme';

export default function BrowseMembersScreen({ route, navigation }) {
  const { ride_id } = route.params;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [view, setView] = useState('map'); // 'map' or 'list'
  const [inviting, setInviting] = useState(false);

  const DUMMY_MEMBERS = [
    { id: 1, member_uid: 'demo1', memberName: 'Priya S.', rating: 4.8, vouch_count: 3, pickup_address: 'Saheed Nagar, Bhubaneswar', pickup_lat: 20.3010, pickup_lng: 85.8200, drop_address: 'Infocity, Bhubaneswar', drop_lat: 20.3500, drop_lng: 85.8100, time: '08:30 AM', max_rate: 5, detour_km: 0.8 },
    { id: 2, member_uid: 'demo2', memberName: 'Rahul M.', rating: 4.2, vouch_count: 1, pickup_address: 'Patia, Bhubaneswar', pickup_lat: 20.2900, pickup_lng: 85.8300, drop_address: 'Infocity, Bhubaneswar', drop_lat: 20.3500, drop_lng: 85.8100, time: '08:45 AM', max_rate: 4, detour_km: 1.2 },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rideRes, membersRes] = await Promise.all([
        api.get(`/rides/host/${auth.currentUser.uid}`),
        api.get(`/searches/match/${ride_id}`),
      ]);
      const foundRide = rideRes.data.find(r => r.id === ride_id) || rideRes.data[0];
      setRide(foundRide);
      setMembers(membersRes.data.length > 0 ? membersRes.data : DUMMY_MEMBERS);
    } catch (e) {
      setMembers(DUMMY_MEMBERS);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (member) => {
    setInviting(true);
    try {
      await api.post('/bookings/host-invite', {
        ride_id: ride_id,
        member_uid: member.member_uid,
        member_name: member.memberName,
        pickup_address: member.pickup_address,
        pickup_lat: member.pickup_lat,
        pickup_lng: member.pickup_lng,
        drop_address: member.drop_address,
        drop_lat: member.drop_lat,
        drop_lng: member.drop_lng,
      });
      Alert.alert('✅ Invited!', `${member.memberName} has been added to your ride.`);
      setSelectedMember(null);
      setMembers(prev => prev.filter(m => m.member_uid !== member.member_uid));
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Could not invite member');
    } finally {
      setInviting(false);
    }
  };

  const buildMapHTML = () => {
    const centerLat = ride?.origin_lat || 20.2961;
    const centerLng = ride?.origin_lng || 85.8245;

    const memberMarkers = members.map(m => `
      L.marker([${m.pickup_lat}, ${m.pickup_lng}], {
        icon: L.divIcon({
          html: '<div style="background:#1a1a1a;color:#F5C842;padding:5px 10px;border-radius:14px;font-size:12px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${m.memberName} ⭐${m.rating}</div>',
          className: '', iconAnchor: [40, 10]
        })
      }).addTo(map)
        .bindPopup('<b>${m.memberName}</b><br>⭐ ${m.rating} · 🤝 ${m.vouch_count} vouches<br>📍 ${m.pickup_address}<br>🏁 ${m.drop_address}<br>+${m.detour_km}km detour')
        .on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({member_uid: '${m.member_uid}'}));
        });
    `).join('\n');

    return `<!DOCTYPE html><html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>body{margin:0}#map{height:100vh;width:100vw}</style>
    </head>
    <body><div id="map"></div>
    <script>
      var map = L.map('map').setView([${centerLat}, ${centerLng}], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {attribution:'© OpenStreetMap contributors'}).addTo(map);

      // Host start point
      L.marker([${centerLat}, ${centerLng}], {
        icon: L.divIcon({html:'<div style="font-size:28px">🚗</div>',
          iconSize:[32,32],iconAnchor:[16,16],className:''})
      }).addTo(map).bindPopup('Your start point').openPopup();

      ${ride ? `
      // Host destination
      L.marker([${ride.destination_lat}, ${ride.destination_lng}], {
        icon: L.divIcon({html:'<div style="font-size:24px">🏁</div>',
          iconSize:[32,32],iconAnchor:[16,16],className:''})
      }).addTo(map).bindPopup('Your destination');
      ` : ''}

      ${memberMarkers}
    </script></body></html>`;
  };

  const handleMapMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      const member = members.find(m => m.member_uid === data.member_uid);
      if (member) setSelectedMember(member);
    } catch (e) {}
  };

  if (loading) return (
    <View style={shared.center}><ActivityIndicator size="large" color={colors.black} /></View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* View toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'map' && styles.toggleBtnActive]}
          onPress={() => setView('map')}
        >
          <Text style={[styles.toggleBtnText, view === 'map' && styles.toggleBtnTextActive]}>
            🗺️ Map
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
          onPress={() => setView('list')}
        >
          <Text style={[styles.toggleBtnText, view === 'list' && styles.toggleBtnTextActive]}>
            📋 List ({members.length})
          </Text>
        </TouchableOpacity>
      </View>

      {view === 'map' ? (
        <>
          {members.length === 0 ? (
            <View style={shared.center}>
              <Text style={styles.emptyText}>No members searching this route yet</Text>
              <Text style={styles.emptyHint}>Check back later or wait for requests</Text>
            </View>
          ) : (
            <WebView
              source={{ html: buildMapHTML() }}
              onMessage={handleMapMessage}
              style={{ flex: 1 }}
              javaScriptEnabled
              scrollEnabled={false}
            />
          )}
          <View style={styles.mapHint}>
            <Text style={styles.mapHintText}>
              📍 Tap a member pin to see details and invite them
            </Text>
          </View>
        </>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {members.length === 0 ? (
            <View style={[shared.center, { marginTop: 60 }]}>
              <Text style={styles.emptyText}>No members searching this route yet</Text>
            </View>
          ) : (
            members.map(m => (
              <TouchableOpacity
                key={m.id}
                style={shared.card}
                onPress={() => setSelectedMember(m)}
              >
                <View style={styles.memberHeader}>
                  <Text style={styles.memberName}>{m.memberName}</Text>
                  <View style={styles.badgesRow}>
                    <Text style={styles.badge}>⭐ {m.rating}</Text>
                    <Text style={styles.badge}>🤝 {m.vouch_count}</Text>
                  </View>
                </View>
                <Text style={styles.memberRoute} numberOfLines={1}>
                  📍 {m.pickup_address}
                </Text>
                <Text style={styles.memberRoute} numberOfLines={1}>
                  🏁 {m.drop_address}
                </Text>
                <Text style={styles.memberMeta}>
                  🕐 {m.time} · Max ₹{m.max_rate}/km · +{m.detour_km}km detour for you
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Member detail modal */}
      <Modal
        visible={!!selectedMember}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMember(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedMember && (
              <>
                <View style={styles.memberHeader}>
                  <Text style={styles.memberName}>{selectedMember.memberName}</Text>
                  <TouchableOpacity onPress={() => setSelectedMember(null)}>
                    <Text style={{ color: colors.gray, fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.badgesRow}>
                  <View style={styles.infoBadge}>
                    <Text style={styles.infoBadgeText}>⭐ {selectedMember.rating} rating</Text>
                  </View>
                  <View style={styles.infoBadge}>
                    <Text style={styles.infoBadgeText}>🤝 {selectedMember.vouch_count} vouches</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Pickup</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>{selectedMember.pickup_address}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Drop</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>{selectedMember.drop_address}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Time</Text>
                  <Text style={styles.infoValue}>{selectedMember.time}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Max rate</Text>
                  <Text style={styles.infoValue}>₹{selectedMember.max_rate}/km</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Detour for you</Text>
                  <Text style={[styles.infoValue, { color: selectedMember.detour_km < 1 ? colors.green : colors.black }]}>
                    +{selectedMember.detour_km} km
                  </Text>
                </View>

                <TouchableOpacity
                  style={[shared.button, { backgroundColor: colors.black, marginTop: 16 }]}
                  onPress={() => handleInvite(selectedMember)}
                  disabled={inviting}
                >
                  {inviting
                    ? <ActivityIndicator color={colors.white} />
                    : <Text style={[shared.buttonText, { color: colors.white }]}>
                        ✓ Invite to my ride
                      </Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setSelectedMember(null)} style={{ marginTop: 12, alignItems: 'center' }}>
                  <Text style={{ color: colors.gray, fontSize: 14 }}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  viewToggle: {
    flexDirection: 'row', backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  toggleBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  toggleBtnActive: { borderBottomWidth: 2, borderBottomColor: colors.black },
  toggleBtnText: { fontSize: 14, color: colors.gray, fontWeight: '600' },
  toggleBtnTextActive: { color: colors.black },
  mapHint: {
    backgroundColor: 'rgba(0,0,0,0.7)', padding: 10,
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  mapHintText: { color: colors.white, fontSize: 12, textAlign: 'center' },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: colors.black, textAlign: 'center', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: colors.gray, textAlign: 'center' },
  memberHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  memberName: { fontSize: 16, fontWeight: 'bold', color: colors.black },
  badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge: { fontSize: 13, color: colors.subtext },
  infoBadge: { backgroundColor: colors.offWhite, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  infoBadgeText: { fontSize: 13, color: colors.black, fontWeight: '600' },
  memberRoute: { fontSize: 12, color: colors.gray, marginBottom: 2 },
  memberMeta: { fontSize: 12, color: colors.gray, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 13, color: colors.gray, width: 100 },
  infoValue: { fontSize: 13, color: colors.black, flex: 1, textAlign: 'right' },
});