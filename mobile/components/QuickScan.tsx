/**
 * Quick Scan Widget Component
 * Quick scan action widget for home screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  GestureResponderEvent,
  ActivityIndicator,
} from 'react-native';
import { mobileTheme } from '../utils/mobile-theme';
import { MobileCard } from './MobileCard';
import { MobileButton } from './MobileButton';

interface QuickScanProps {
  onScanPress?: (event: GestureResponderEvent) => void;
  isScanning?: boolean;
  lastScanTime?: Date;
  scanCount?: number;
  successRate?: number;
}

const styles = StyleSheet.create({
  container: {
    gap: mobileTheme.spacing[4],
    paddingVertical: mobileTheme.spacing[4],
  },
  header: {
    gap: mobileTheme.spacing[1],
  },
  title: {
    fontSize: mobileTheme.typography.fontSize.xl,
    fontWeight: mobileTheme.typography.fontWeight.bold as any,
    color: mobileTheme.colors.neutral[50],
  },
  subtitle: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.neutral[400],
  },
  statsContainer: {
    flexDirection: 'row',
    gap: mobileTheme.spacing[3],
    marginVertical: mobileTheme.spacing[3],
  },
  statItem: {
    flex: 1,
    gap: mobileTheme.spacing[1],
    paddingVertical: mobileTheme.spacing[3],
    paddingHorizontal: mobileTheme.spacing[2],
    backgroundColor: mobileTheme.colors.neutral[800],
    borderRadius: mobileTheme.borderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: mobileTheme.typography.fontSize['2xl'],
    fontWeight: mobileTheme.typography.fontWeight.bold as any,
    color: mobileTheme.colors.primary[500],
  },
  statLabel: {
    fontSize: mobileTheme.typography.fontSize.xs,
    color: mobileTheme.colors.neutral[400],
    textAlign: 'center',
  },
  scanButton: {
    marginTop: mobileTheme.spacing[2],
  },
  scanCenter: {
    width: 80,
    height: 80,
    borderRadius: mobileTheme.borderRadius.full,
    backgroundColor: mobileTheme.colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    ...mobileTheme.shadows.lg,
    alignSelf: 'center',
  },
  scanIcon: {
    fontSize: 32,
    color: '#fff',
  },
  lastScan: {
    marginTop: mobileTheme.spacing[3],
    paddingVertical: mobileTheme.spacing[2],
    paddingHorizontal: mobileTheme.spacing[3],
    backgroundColor: mobileTheme.colors.success[600] + '20',
    borderRadius: mobileTheme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: mobileTheme.colors.success[600],
  },
  lastScanText: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.success[600],
    fontWeight: mobileTheme.typography.fontWeight.medium as any,
  },
});

export const QuickScan = ({
  onScanPress,
  isScanning = false,
  lastScanTime,
  scanCount = 0,
  successRate = 100,
}: QuickScanProps) => {
  const [spinAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [isScanning, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <MobileCard variant="elevated" padding="lg">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Quick Scan</Text>
          <Text style={styles.subtitle}>
            Scan for threats in seconds
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{scanCount}</Text>
            <Text style={styles.statLabel}>Scans</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{successRate}%</Text>
            <Text style={styles.statLabel}>Safe</Text>
          </View>
        </View>

        {/* Scan Button */}
        {isScanning ? (
          <View style={styles.scanCenter}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : (
          <MobileButton
            title={isScanning ? 'Scanning...' : 'Start Scan'}
            variant="primary"
            size="lg"
            onPress={onScanPress}
            disabled={isScanning}
            loading={isScanning}
            style={styles.scanButton}
          />
        )}

        {/* Last Scan Info */}
        {lastScanTime && (
          <View style={styles.lastScan}>
            <Text style={styles.lastScanText}>
              Last scan: {formatDate(lastScanTime)}
            </Text>
          </View>
        )}
      </View>
    </MobileCard>
  );
};
