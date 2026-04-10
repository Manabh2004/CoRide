import React from 'react';
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

const Stack = createStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
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
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}