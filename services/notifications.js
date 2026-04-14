import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { auth } from './firebase';

const FCM_TOKEN_KEY = 'fcm_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async () => {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission denied');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F5C842',
    });
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Save token locally
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);

    // Register token with backend
    const user = auth.currentUser;
    if (user && token) {
      await api.post('/users/register-token', {
        firebase_uid: user.uid,
        push_token: token,
      }).catch(() => {}); // non-fatal
    }

    return token;
  } catch (e) {
    console.log('Error getting push token:', e);
    return null;
  }
};

export const setupNotificationListeners = (navigation) => {
  // Handle notification tap when app is background/closed
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;

    if (data?.screen) {
      try {
        navigation.navigate(data.screen, data.params || {});
      } catch (e) {}
    }
  });

  return () => subscription.remove();
};