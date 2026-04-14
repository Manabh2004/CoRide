import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import MemberDashboard from './screens/MemberDashboard';
import HostDashboard from './screens/HostDashboard';
import BookRideScreen from './screens/BookRideScreen';
import OfferRideScreen from './screens/OfferRideScreen';
import RideResultsScreen from './screens/RideResultsScreen';
import MapPickerScreen from './screens/MapPickerScreen';
import RideTrackerScreen from './screens/RideTrackerScreen';
import ShareTrackerScreen from './screens/ShareTrackerScreen';
import RatingScreen from './screens/RatingScreen';
import RideMapScreen from './screens/RideMapScreen';
import ProfileScreen from './screens/ProfileScreen';
import EcoStatsScreen from './screens/EcoStatsScreen';
import MyBookingsScreen from './screens/MyBookingsScreen';
import CommunityScreen from './screens/CommunityScreen';
import BrowseMembersScreen from './screens/BrowseMembers';
import LocationSpooferScreen from './screens/LocationSpooferScreen';

import { registerForPushNotifications, setupNotificationListeners } from './services/notifications';

const Stack = createStackNavigator();

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    // Register for push notifications on app start
    registerForPushNotifications();
  }, []);

  useEffect(() => {
    if (!navigationRef.current) return;
    // Set up notification tap handler
    const cleanup = setupNotificationListeners(navigationRef.current);
    return cleanup;
  }, [navigationRef.current]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MemberDashboard" component={MemberDashboard} options={{ title: 'Member Dashboard' }} />
          <Stack.Screen name="HostDashboard" component={HostDashboard} options={{ title: 'Host Dashboard' }} />
          <Stack.Screen name="BookRide" component={BookRideScreen} options={{ title: 'Find a Carpool' }} />
          <Stack.Screen name="OfferRide" component={OfferRideScreen} options={{ title: 'Offer a Ride' }} />
          <Stack.Screen name="RideResults" component={RideResultsScreen} options={{ title: 'Available Carpools' }} />
          <Stack.Screen name="MapPicker" component={MapPickerScreen} options={{ title: 'Pick Location' }} />
          <Stack.Screen name="RideTracker" component={RideTrackerScreen} options={{ title: 'Live Tracker' }} />
          <Stack.Screen name="ShareTracker" component={ShareTrackerScreen} options={{ title: 'Share Location' }} />
          <Stack.Screen name="Rating" component={RatingScreen} options={{ title: 'Rate your ride' }} />
          <Stack.Screen name="RideMap" component={RideMapScreen} options={{ title: 'Member Locations' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
          <Stack.Screen name="EcoStats" component={EcoStatsScreen} options={{ title: 'Eco Stats' }} />
          <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'My Bookings' }} />
          <Stack.Screen name="Community" component={CommunityScreen} options={{ title: 'Community' }} />
          <Stack.Screen name="BrowseMembers" component={BrowseMembersScreen} options={{ title: 'Available Members' }} />
          <Stack.Screen name="LocationSpoofer" component={LocationSpooferScreen} options={{ title: 'Location Spoofer' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}