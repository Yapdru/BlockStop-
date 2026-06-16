/**
 * Settings Screen
 * Main settings and preferences
 */

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileTheme } from '../utils/mobile-theme';
import { MobileCard } from '../components/MobileCard';
import { MobileButton } from '../components/MobileButton';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileTheme.colors.neutral[950],
  },
  content: {
    paddingHorizontal: mobileTheme.spacing[4],
    paddingVertical: mobileTheme.spacing[4],
    gap: mobileTheme.spacing[4],
  },
  header: {
    gap: mobileTheme.spacing[1],
    marginBottom: mobileTheme.spacing[2],
  },
  title: {
    fontSize: mobileTheme.typography.fontSize['2xl'],
    fontWeight: mobileTheme.typography.fontWeight.bold as any,
    color: mobileTheme.colors.neutral[50],
  },
  subtitle: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.neutral[400],
  },
  section: {
    gap: mobileTheme.spacing[2],
  },
  sectionTitle: {
    fontSize: mobileTheme.typography.fontSize.base,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[100],
    marginBottom: mobileTheme.spacing[1],
    textTransform: 'uppercase',
    fontSize: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: mobileTheme.spacing[3],
    paddingHorizontal: mobileTheme.spacing[3],
    backgroundColor: mobileTheme.colors.neutral[800],
    borderRadius: mobileTheme.borderRadius.lg,
    marginBottom: mobileTheme.spacing[2],
  },
  settingLabel: {
    flex: 1,
    gap: mobileTheme.spacing[1],
  },
  settingTitle: {
    fontSize: mobileTheme.typography.fontSize.base,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[50],
  },
  settingDescription: {
    fontSize: mobileTheme.typography.fontSize.xs,
    color: mobileTheme.colors.neutral[400],
  },
  settingButton: {
    paddingVertical: mobileTheme.spacing[3],
    paddingHorizontal: mobileTheme.spacing[3],
    backgroundColor: mobileTheme.colors.neutral[800],
    borderRadius: mobileTheme.borderRadius.lg,
    marginBottom: mobileTheme.spacing[2],
  },
  settingButtonText: {
    fontSize: mobileTheme.typography.fontSize.base,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.primary[600],
  },
  dangerZone: {
    gap: mobileTheme.spacing[2],
    marginTop: mobileTheme.spacing[4],
    paddingTop: mobileTheme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.neutral[800],
  },
});

export const SettingsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const { trigger } = useHapticFeedback();

  const handleToggle = (setter: any) => {
    trigger('light');
    setter((prev: boolean) => !prev);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: () => {
          trigger('warning');
          // Handle logout
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { paddingTop: insets.top }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your preferences</Text>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <Pressable
            style={({ pressed }) => [
              styles.settingItem,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => {
              trigger('light');
              navigation.navigate('Security');
            }}
          >
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Security Settings</Text>
              <Text style={styles.settingDescription}>
                Password, 2FA, biometric
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: mobileTheme.colors.neutral[600] }}>
              →
            </Text>
          </Pressable>

          <View style={styles.settingItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Biometric Auth</Text>
              <Text style={styles.settingDescription}>
                Use fingerprint or face ID
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={() => handleToggle(setBiometricEnabled)}
              trackColor={{
                false: mobileTheme.colors.neutral[700],
                true: mobileTheme.colors.primary[600],
              }}
              thumbColor={mobileTheme.colors.neutral[100]}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Get alerts for threats and scans
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={() => handleToggle(setNotificationsEnabled)}
              trackColor={{
                false: mobileTheme.colors.neutral[700],
                true: mobileTheme.colors.primary[600],
              }}
              thumbColor={mobileTheme.colors.neutral[100]}
            />
          </View>

          {notificationsEnabled && (
            <Pressable
              style={({ pressed }) => [
                styles.settingItem,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => {
                trigger('light');
                navigation.navigate('Notifications');
              }}
            >
              <View style={styles.settingLabel}>
                <Text style={styles.settingTitle}>Notification Settings</Text>
                <Text style={styles.settingDescription}>
                  Customize notification types
                </Text>
              </View>
              <Text style={{ fontSize: 20, color: mobileTheme.colors.neutral[600] }}>
                →
              </Text>
            </Pressable>
          )}
        </View>

        {/* Scanning Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scanning</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Auto Scan</Text>
              <Text style={styles.settingDescription}>
                Scan files on download
              </Text>
            </View>
            <Switch
              value={autoScanEnabled}
              onValueChange={() => handleToggle(setAutoScanEnabled)}
              trackColor={{
                false: mobileTheme.colors.neutral[700],
                true: mobileTheme.colors.primary[600],
              }}
              thumbColor={mobileTheme.colors.neutral[100]}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <Pressable
            style={({ pressed }) => [
              styles.settingButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.settingButtonText}>Account Settings</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.settingButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.settingButtonText}>Privacy Policy</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.settingButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.settingButtonText}>Terms of Service</Text>
          </Pressable>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <MobileButton
            title="Logout"
            variant="danger"
            size="md"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
