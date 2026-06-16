/**
 * Home Screen
 * Main dashboard with quick actions and status overview
 */

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileTheme } from '../utils/mobile-theme';
import { MobileCard } from '../components/MobileCard';
import { QuickScan } from '../components/QuickScan';
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
  greeting: {
    fontSize: mobileTheme.typography.fontSize['2xl'],
    fontWeight: mobileTheme.typography.fontWeight.bold as any,
    color: mobileTheme.colors.neutral[50],
  },
  subtitle: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.neutral[400],
  },
  statusGrid: {
    flexDirection: 'row',
    gap: mobileTheme.spacing[3],
    marginVertical: mobileTheme.spacing[2],
  },
  statusItem: {
    flex: 1,
    paddingVertical: mobileTheme.spacing[3],
    paddingHorizontal: mobileTheme.spacing[3],
    backgroundColor: mobileTheme.colors.neutral[800],
    borderRadius: mobileTheme.borderRadius.lg,
    alignItems: 'center',
    gap: mobileTheme.spacing[1],
  },
  statusIcon: {
    fontSize: 24,
  },
  statusValue: {
    fontSize: mobileTheme.typography.fontSize.lg,
    fontWeight: mobileTheme.typography.fontWeight.bold as any,
    color: mobileTheme.colors.primary[500],
  },
  statusLabel: {
    fontSize: mobileTheme.typography.fontSize.xs,
    color: mobileTheme.colors.neutral[400],
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: mobileTheme.typography.fontSize.lg,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[50],
    marginTop: mobileTheme.spacing[2],
    marginBottom: mobileTheme.spacing[2],
  },
  actionGrid: {
    gap: mobileTheme.spacing[2],
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: mobileTheme.spacing[3],
    paddingHorizontal: mobileTheme.spacing[3],
    backgroundColor: mobileTheme.colors.neutral[800],
    borderRadius: mobileTheme.borderRadius.lg,
    gap: mobileTheme.spacing[3],
  },
  actionIcon: {
    fontSize: 28,
  },
  actionContent: {
    flex: 1,
    gap: mobileTheme.spacing[1],
  },
  actionTitle: {
    fontSize: mobileTheme.typography.fontSize.base,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[50],
  },
  actionSubtitle: {
    fontSize: mobileTheme.typography.fontSize.xs,
    color: mobileTheme.colors.neutral[400],
  },
});

export const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const { trigger } = useHapticFeedback();

  const onRefresh = () => {
    setRefreshing(true);
    trigger('light');
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleQuickScan = () => {
    trigger('medium');
    setIsScanning(true);
    // Simulate scan completion
    setTimeout(() => {
      setIsScanning(false);
      trigger('success');
    }, 3000);
  };

  return (
    <SafeAreaView
      style={[styles.container, { paddingTop: insets.top }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={mobileTheme.colors.primary[600]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.subtitle}>Your security status is good</Text>
        </View>

        {/* Status Overview */}
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>✓</Text>
            <Text style={styles.statusValue}>0</Text>
            <Text style={styles.statusLabel}>Threats</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>📁</Text>
            <Text style={styles.statusValue}>24</Text>
            <Text style={styles.statusLabel}>Scanned</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>🛡️</Text>
            <Text style={styles.statusValue}>99%</Text>
            <Text style={styles.statusLabel}>Protected</Text>
          </View>
        </View>

        {/* Quick Scan Widget */}
        <QuickScan
          onScanPress={handleQuickScan}
          isScanning={isScanning}
          lastScanTime={new Date(Date.now() - 2 * 60 * 60 * 1000)}
          scanCount={24}
          successRate={100}
        />

        {/* Recent Activity Section */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <Pressable
            style={({ pressed }) => [
              styles.actionItem,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => {
              trigger('light');
              navigation.navigate('ScannerTab');
            }}
          >
            <Text style={styles.actionIcon}>📷</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Scan File</Text>
              <Text style={styles.actionSubtitle}>Upload and scan</Text>
            </View>
            <Text style={{ fontSize: 20, color: mobileTheme.colors.neutral[600] }}>
              →
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionItem,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => {
              trigger('light');
              navigation.navigate('ResultsTab');
            }}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Results</Text>
              <Text style={styles.actionSubtitle}>Recent scans</Text>
            </View>
            <Text style={{ fontSize: 20, color: mobileTheme.colors.neutral[600] }}>
              →
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionItem,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => {
              trigger('light');
              navigation.navigate('SettingsTab');
            }}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Settings</Text>
              <Text style={styles.actionSubtitle}>Configure app</Text>
            </View>
            <Text style={{ fontSize: 20, color: mobileTheme.colors.neutral[600] }}>
              →
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
