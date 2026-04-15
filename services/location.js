import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SPOOFER_KEY = 'location_spoofer';

const isSpooferEnabled = async () => {
  try {
    const stored = await AsyncStorage.getItem(SPOOFER_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    if (data.enabled && data.location) return data.location;
  } catch (e) {}
  return null;
};

export const getLocation = async () => {
  const spoofed = await isSpooferEnabled();
  if (spoofed) {
    return {
      coords: { latitude: spoofed.lat, longitude: spoofed.lng },
      spoofed: true,
    };
  }
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
  } catch (e) {
    return null;
  }
};

export const watchLocation = async (callback) => {
  const spoofed = await isSpooferEnabled();
  if (spoofed) {
    // Poll AsyncStorage every second for joystick updates
    const interval = setInterval(async () => {
      try {
        const stored = await AsyncStorage.getItem(SPOOFER_KEY);
        if (!stored) return;
        const data = JSON.parse(stored);
        if (data.enabled && data.location) {
          callback({
            coords: {
              latitude: data.location.lat,
              longitude: data.location.lng,
            },
          });
        }
      } catch (e) {}
    }, 1000);
    return { remove: () => clearInterval(interval) };
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { remove: () => {} };
    return await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      callback
    );
  } catch (e) {
    return { remove: () => {} };
  }
};