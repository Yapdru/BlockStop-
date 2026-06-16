/**
 * Root Navigation Navigator
 * Handles authentication and main app navigation
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { mobileTheme } from '../utils/mobile-theme';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  isAuthenticated?: boolean;
  isLoading?: boolean;
}

export const RootNavigator = ({
  isAuthenticated = false,
  isLoading = false,
}: RootNavigatorProps) => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: mobileTheme.colors.neutral[950] },
          animationEnabled: true,
        }}
      >
        {isLoading ? (
          <Stack.Screen
            name="Loading"
            component={() => (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: mobileTheme.colors.neutral[950],
                }}
              >
                <ActivityIndicator
                  size="large"
                  color={mobileTheme.colors.primary[600]}
                />
              </View>
            )}
          />
        ) : isAuthenticated ? (
          <Stack.Screen
            name="Main"
            component={MainNavigator}
            options={{ animationEnabled: false }}
          />
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ animationEnabled: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
