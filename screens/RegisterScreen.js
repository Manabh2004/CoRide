import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../services/firebase';
import api from '../services/api';
import { colors, shared } from '../styles/theme';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10 digit phone number');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      try {
        await api.post('/users/register', {
          firebase_uid: userCredential.user.uid,
          name, email, phone,
        });
      } catch (e) {
        console.log('Backend save failed:', e.message);
      }
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Registration failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join the CoRide community</Text>

      <Text style={shared.label}>Full name</Text>
      <TextInput style={shared.input} placeholder="Your name" value={name} onChangeText={setName} />

      <Text style={shared.label}>Email</Text>
      <TextInput style={shared.input} placeholder="your@email.com" value={email}
        onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

      <Text style={shared.label}>Phone number</Text>
      <TextInput style={shared.input} placeholder="10 digit number" value={phone}
        onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} />

      <Text style={shared.label}>Password</Text>
      <TextInput style={shared.input} placeholder="Create a password" value={password}
        onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity
        style={[shared.button, { backgroundColor: colors.black }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.white} />
          : <Text style={[shared.buttonText, { color: colors.white }]}>Create Account</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: colors.white, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8, color: colors.black },
  subtitle: { fontSize: 14, color: colors.gray, marginBottom: 32 },
  link: { textAlign: 'center', color: colors.subtext, fontSize: 14, marginTop: 8 },
});