/**
 * Authentication Navigation Stack
 * Handles login, register, and password recovery flows
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { BiometricAuthScreen } from '../screens/BiometricAuthScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  BiometricAuth: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: '#0a0a0a' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen
        name="BiometricAuth"
        component={BiometricAuthScreen}
        options={{ animationEnabled: false }}
      />
    </Stack.Navigator>
  );
};
