import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';
import { colors, shared } from '../styles/theme';

export default function ProfileScreen({ navigation }) {
  const user = auth.currentUser;
  const [contacts, setContacts] = useState([
    { name: '', phone: '' },
    { name: '', phone: '' },
    { name: '', phone: '' },
  ]);

  useEffect(() => { loadContacts(); }, []);

  const loadContacts = async () => {
    try {
      const stored = await AsyncStorage.getItem('emergency_contacts');
      if (stored) setContacts(JSON.parse(stored));
    } catch (e) {}
  };

  const saveContacts = async () => {
    const valid = contacts.filter(c => c.name && c.phone);
    if (valid.length === 0) {
      Alert.alert('Error', 'Please add at least one emergency contact');
      return;
    }
    try {
      await AsyncStorage.setItem('emergency_contacts', JSON.stringify(contacts));
      Alert.alert('Saved ✅', 'Emergency contacts updated');
    } catch (e) {
      Alert.alert('Error', 'Could not save contacts');
    }
  };

  const updateContact = (index, field, value) => {
    const updated = [...contacts];
    updated[index][field] = value;
    setContacts(updated);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.userCard}>
        <Text style={styles.userName}>{user?.displayName}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <Text style={shared.sectionTitle}>Emergency Contacts</Text>
      <Text style={styles.sectionSub}>
        These contacts receive an SMS with your live location when you triple-tap SOS during a ride.
      </Text>

      {contacts.map((contact, i) => (
        <View key={i} style={[shared.card, { marginBottom: 16 }]}>
          <Text style={[shared.label, { marginBottom: 10 }]}>Contact {i + 1}</Text>
          <TextInput
            style={shared.input}
            placeholder="Name"
            value={contact.name}
            onChangeText={v => updateContact(i, 'name', v)}
          />
          <TextInput
            style={[shared.input, { marginBottom: 0 }]}
            placeholder="Phone (10 digits)"
            value={contact.phone}
            onChangeText={v => updateContact(i, 'phone', v)}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
      ))}

      <TouchableOpacity
        style={[shared.button, { backgroundColor: colors.black }]}
        onPress={saveContacts}
      >
        <Text style={[shared.buttonText, { color: colors.white }]}>
          Save Emergency Contacts
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[shared.button, { backgroundColor: '#333', marginTop: 4 }]}
        onPress={() => navigation.navigate('LocationSpoofer')}
      >
        <Text style={[shared.buttonText, { color: colors.yellow }]}>
          🧪 Location Spoofer (Testing only)
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.white, flexGrow: 1 },
  userCard: {
    backgroundColor: colors.black, borderRadius: 16,
    padding: 24, marginBottom: 32,
  },
  userName: { fontSize: 22, fontWeight: 'bold', color: colors.yellow },
  userEmail: { fontSize: 14, color: '#aaaaaa', marginTop: 4 },
  sectionSub: { fontSize: 13, color: colors.gray, marginBottom: 20, lineHeight: 18 },
});