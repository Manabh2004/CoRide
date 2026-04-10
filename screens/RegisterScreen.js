import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../services/firebase';
import api from '../services/api';

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
          name,
          email,
          phone,
        });
      } catch (e) {
        console.log('MySQL save failed:', e.message);
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

      <Text style={styles.label}>Full name</Text>
      <TextInput style={styles.input} placeholder="Your name"
        value={name} onChangeText={setName} />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} placeholder="your@email.com"
        value={email} onChangeText={setEmail}
        keyboardType="email-address" autoCapitalize="none" />

      <Text style={styles.label}>Phone number</Text>
      <TextInput style={styles.input} placeholder="10 digit number"
        value={phone} onChangeText={setPhone}
        keyboardType="phone-pad" maxLength={10} />

      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} placeholder="Create a password"
        value={password} onChangeText={setPassword}
        secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Create Account</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8, color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, marginBottom: 18, fontSize: 15 },
  button: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 16, marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { textAlign: 'center', color: '#555', fontSize: 14 },
});