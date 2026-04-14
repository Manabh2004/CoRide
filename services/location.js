import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SPOOFER_KEY = 'location_spoofer';

export const getLocation = async () => {
  try {
    const stored = await AsyncStorage.getItem(SPOOFER_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.enabled && data.location) {
        return {
          coords: {
            latitude: data.location.lat,
            longitude: data.location.lng,
          },
          spoofed: true,
        };
      }
    }
  } catch (e) {}

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  return await Location.getCurrentPositionAsync({});
};

export const watchLocation = async (callback) => {
  try {
    const stored = await AsyncStorage.getItem(SPOOFER_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.enabled) {
        const interval = setInterval(async () => {
          try {
            const current = await AsyncStorage.getItem(SPOOFER_KEY);
            if (current) {
              const d = JSON.parse(current);
              if (d.enabled && d.location) {
                callback({
                  coords: {
                    latitude: d.location.lat,
                    longitude: d.location.lng,
                  },
                });
              }
            }
          } catch (e) {}
        }, 1000);
        return { remove: () => clearInterval(interval) };
      }
    }
  } catch (e) {}

  return await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, distanceInterval: 10 },
    callback
  );
};