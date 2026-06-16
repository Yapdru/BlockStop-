/**
 * Notification Badge Component
 * Notification indicator badge
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { mobileTheme } from '../utils/mobile-theme';

interface NotificationBadgeProps {
  count?: number;
  visible?: boolean;
  variant?: 'dot' | 'badge' | 'alert';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: mobileTheme.borderRadius.full,
    backgroundColor: mobileTheme.colors.error[600],
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: mobileTheme.borderRadius.full,
    backgroundColor: mobileTheme.colors.error[600],
    justifyContent: 'center',
    alignItems: 'center',
    ...mobileTheme.shadows.sm,
  },
  badgeText: {
    fontSize: mobileTheme.typography.fontSize.xs,
    fontWeight: mobileTheme.typography.fontWeight.bold as any,
    color: '#fff',
    textAlign: 'center',
  },
  alert: {
    paddingHorizontal: mobileTheme.spacing[2],
    paddingVertical: mobileTheme.spacing[1],
    borderRadius: mobileTheme.borderRadius.full,
    backgroundColor: mobileTheme.colors.error[600],
  },
  alertText: {
    fontSize: mobileTheme.typography.fontSize.xs,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: '#fff',
  },
});

export const NotificationBadge = ({
  count = 0,
  visible = true,
  variant = 'badge',
  position = 'top-right',
}: NotificationBadgeProps) => {
  if (!visible || (variant === 'badge' && count === 0)) {
    return null;
  }

  const renderContent = () => {
    switch (variant) {
      case 'dot':
        return <View style={styles.dot} />;
      case 'alert':
        return (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{count > 99 ? '99+' : count}</Text>
          </View>
        );
      case 'badge':
      default:
        return (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
          </View>
        );
    }
  };

  return renderContent();
};
