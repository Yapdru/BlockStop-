/**
 * Threat Card Component
 * Displays individual threat information
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import { mobileTheme } from '../utils/mobile-theme';
import { MobileCard } from './MobileCard';

export interface ThreatInfo {
  id: string;
  name: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedOn: Date;
  fileName?: string;
  actionRequired?: boolean;
}

interface ThreatCardProps {
  threat: ThreatInfo;
  onPress?: (event: GestureResponderEvent) => void;
  onAction?: (event: GestureResponderEvent) => void;
  variant?: 'compact' | 'detailed';
}

const severityColorMap = {
  low: mobileTheme.colors.success[600],
  medium: mobileTheme.colors.warning[600],
  high: mobileTheme.colors.error[600],
  critical: mobileTheme.colors.error[800],
};

const severityBgMap = {
  low: mobileTheme.colors.success[50],
  medium: mobileTheme.colors.warning[50],
  high: mobileTheme.colors.error[50],
  critical: mobileTheme.colors.error[100],
};

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 4,
    marginBottom: mobileTheme.spacing[2],
  },
  compactContent: {
    gap: mobileTheme.spacing[2],
  },
  detailedContent: {
    gap: mobileTheme.spacing[3],
  },
  header: {
    gap: mobileTheme.spacing[1],
  },
  threatName: {
    fontSize: mobileTheme.typography.fontSize.base,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[50],
  },
  category: {
    fontSize: mobileTheme.typography.fontSize.xs,
    color: mobileTheme.colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.neutral[300],
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: mobileTheme.spacing[2],
    paddingTop: mobileTheme.spacing[2],
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.neutral[800],
  },
  timestamp: {
    fontSize: mobileTheme.typography.fontSize.xs,
    color: mobileTheme.colors.neutral[500],
  },
  actionButton: {
    paddingHorizontal: mobileTheme.spacing[3],
    paddingVertical: mobileTheme.spacing[1],
    borderRadius: mobileTheme.borderRadius.sm,
    backgroundColor: mobileTheme.colors.primary[600],
  },
  actionButtonText: {
    fontSize: mobileTheme.typography.fontSize.xs,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: '#fff',
  },
  severityBadge: {
    paddingHorizontal: mobileTheme.spacing[2],
    paddingVertical: mobileTheme.spacing[1],
    borderRadius: mobileTheme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  severityText: {
    fontSize: mobileTheme.typography.fontSize.xs,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
  },
});

export const ThreatCard = ({
  threat,
  onPress,
  onAction,
  variant = 'compact',
}: ThreatCardProps) => {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const severityColor = severityColorMap[threat.severity];
  const severityBg = severityBgMap[threat.severity];

  return (
    <MobileCard
      onPress={onPress}
      variant="outlined"
      padding={variant === 'compact' ? 'sm' : 'md'}
      style={[styles.container, { borderLeftColor: severityColor }]}
    >
      <View style={variant === 'compact' ? styles.compactContent : styles.detailedContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.threatName}>{threat.name}</Text>
          <Text style={styles.category}>{threat.category}</Text>
        </View>

        {/* Severity Badge */}
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: severityColor + '20' },
          ]}
        >
          <Text
            style={[
              styles.severityText,
              { color: severityColor },
            ]}
          >
            {threat.severity.toUpperCase()}
          </Text>
        </View>

        {/* Description (detailed only) */}
        {variant === 'detailed' && threat.description && (
          <Text style={styles.description}>{threat.description}</Text>
        )}

        {/* File name (if available) */}
        {threat.fileName && (
          <Text
            style={[styles.description, { color: mobileTheme.colors.neutral[400] }]}
            numberOfLines={1}
          >
            File: {threat.fileName}
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.timestamp}>{formatDate(threat.detectedOn)}</Text>
          {threat.actionRequired && onAction && (
            <MobileCard
              onPress={onAction}
              style={styles.actionButton}
              padding="sm"
            >
              <Text style={styles.actionButtonText}>Quarantine</Text>
            </MobileCard>
          )}
        </View>
      </View>
    </MobileCard>
  );
};
