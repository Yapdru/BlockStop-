/**
 * Main Navigation Stack
 * Bottom tab navigation with nested stacks
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { TeamScreen } from '../screens/TeamScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// Detail Screens
import { ScanResultScreen } from '../screens/ScanResultScreen';
import { SecurityScreen } from '../screens/SecurityScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { TeamMembersScreen } from '../screens/TeamMembersScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { DashboardScreen } from '../screens/DashboardScreen';

import { mobileTheme } from '../utils/mobile-theme';

export type RootStackParamList = {
  HomeTabs: undefined;
  ScanResult: { scanId: string };
  Security: undefined;
  Notifications: undefined;
  TeamMembers: undefined;
  History: undefined;
  Dashboard: undefined;
};

export type HomeTabsParamList = {
  HomeTab: undefined;
  ScannerTab: undefined;
  ResultsTab: undefined;
  TeamTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<HomeTabsParamList>();
const HomeStack = createNativeStackNavigator();
const ScannerStack = createNativeStackNavigator();
const ResultsStack = createNativeStackNavigator();
const TeamStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: mobileTheme.colors.neutral[900],
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.neutral[800],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: mobileTheme.typography.fontWeight.medium as any,
    marginBottom: 2,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
});

const TabIcon = ({
  name,
  color,
  size = 24,
}: {
  name: string;
  color: string;
  size?: number;
}) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <Text style={{ fontSize: size, color }}>
      {iconMap[name as keyof typeof iconMap] || '●'}
    </Text>
  </View>
);

const iconMap = {
  home: '🏠',
  scanner: '📷',
  results: '📊',
  team: '👥',
  settings: '⚙️',
};

// Stack Navigators
const HomeStackNavigator = () => (
  <HomeStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#0a0a0a' },
    }}
  >
    <HomeStack.Screen name="Home" component={HomeScreen} />
  </HomeStack.Navigator>
);

const ScannerStackNavigator = () => (
  <ScannerStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#0a0a0a' },
    }}
  >
    <ScannerStack.Screen name="Scanner" component={ScannerScreen} />
  </ScannerStack.Navigator>
);

const ResultsStackNavigator = () => (
  <ResultsStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#0a0a0a' },
    }}
  >
    <ResultsStack.Screen name="Results" component={ResultsScreen} />
    <ResultsStack.Screen
      name="ScanResult"
      component={ScanResultScreen}
      options={{ animationEnabled: true }}
    />
  </ResultsStack.Navigator>
);

const TeamStackNavigator = () => (
  <TeamStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#0a0a0a' },
    }}
  >
    <TeamStack.Screen name="Team" component={TeamScreen} />
    <TeamStack.Screen name="TeamMembers" component={TeamMembersScreen} />
  </TeamStack.Navigator>
);

const SettingsStackNavigator = () => (
  <SettingsStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#0a0a0a' },
    }}
  >
    <SettingsStack.Screen name="Settings" component={SettingsScreen} />
    <SettingsStack.Screen name="Security" component={SecurityScreen} />
    <SettingsStack.Screen name="Notifications" component={NotificationsScreen} />
  </SettingsStack.Navigator>
);

export const MainNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon
            name={route.name.toLowerCase().replace('tab', '')}
            color={color}
          />
        ),
        tabBarLabel: ({ color }) => (
          <Text
            style={[
              styles.tabLabel,
              { color },
            ]}
          >
            {route.name === 'HomeTab'
              ? 'Home'
              : route.name === 'ScannerTab'
                ? 'Scan'
                : route.name === 'ResultsTab'
                  ? 'Results'
                  : route.name === 'TeamTab'
                    ? 'Team'
                    : 'Settings'}
          </Text>
        ),
        tabBarActiveTintColor: mobileTheme.colors.primary[600],
        tabBarInactiveTintColor: mobileTheme.colors.neutral[600],
        tabBarStyle: [
          styles.tabBar,
          {
            paddingBottom: Math.max(insets.bottom - 8, 0),
            height: 60 + Math.max(insets.bottom - 8, 0),
          },
        ],
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="ScannerTab"
        component={ScannerStackNavigator}
        options={{ tabBarLabel: 'Scan' }}
      />
      <Tab.Screen
        name="ResultsTab"
        component={ResultsStackNavigator}
        options={{ tabBarLabel: 'Results' }}
      />
      <Tab.Screen
        name="TeamTab"
        component={TeamStackNavigator}
        options={{ tabBarLabel: 'Team' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
};
