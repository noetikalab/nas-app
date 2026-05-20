import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {DiscoveryScreen} from '../screens/DiscoveryScreen';
import {LoginScreen} from '../screens/LoginScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {DevSettingsScreen} from '../screens/DevSettingsScreen';

export type RootStackParamList = {
  Discovery: undefined;
  Login: undefined;
  Home: undefined;
  DevSettings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{headerShown: false}}>
        <Stack.Screen name="Discovery" component={DiscoveryScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="DevSettings" component={DevSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
