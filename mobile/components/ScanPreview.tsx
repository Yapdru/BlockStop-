/**
 * Scan Preview Component
 * Displays scan result preview with threat indicators
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  GestureResponderEvent,
} from 'react-native';
import { mobileTheme } from '../utils/mobile-theme';
import { MobileCard } from './MobileCard';
import { MobileButton } from './MobileButton';

export interface ScanPreviewProps {
  fileName: string;
  fileSize: number;
  scanStatus: 'pending' | 'scanning' | 'complete' | 'error';
  threatsDetected: number;
  threatLevel: 'safe' | 'warning' | 'danger' | 'critical';
  detailedResults?: Array<{
    id: string;
    threat: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  onViewDetails?: (event: GestureResponderEvent) => void;
  onDismiss?: (event: GestureResponderEvent) => void;
}

const threatColorMap = {
  safe: mobileTheme.colors.success[600],
  warning: mobileTheme.colors.warning[600],
  danger: mobileTheme.colors.error[600],
  critical: mobileTheme.colors.error[800],
};

const severityColorMap = {
  low: mobileTheme.colors.success[600],
  medium: mobileTheme.colors.warning[600],
  high: mobileTheme.colors.error[600],
  critical: mobileTheme.colors.error[800],
};

const styles = StyleSheet.create({
  container: {
    gap: mobileTheme.spacing[4],
  },
  header: {
    gap: mobileTheme.spacing[2],
  },
  fileName: {
    fontSize: mobileTheme.typography.fontSize.lg,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[50],
  },
  fileSize: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.neutral[400],
  },
  threatIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileTheme.spacing[3],
    paddingVertical: mobileTheme.spacing[4],
  },
  threatCount: {
    fontSize: mobileTheme.typography.fontSize['3xl'],
    fontWeight: mobileTheme.typography.fontWeight.bold as any,
  },
  threatLabel: {
    fontSize: mobileTheme.typography.fontSize.base,
    color: mobileTheme.colors.neutral[300],
  },
  detailsList: {
    gap: mobileTheme.spacing[2],
  },
  threatItem: {
    paddingVertical: mobileTheme.spacing[3],
    paddingHorizontal: mobileTheme.spacing[3],
    borderLeftWidth: 4,
  },
  threatItemTitle: {
    fontSize: mobileTheme.typography.fontSize.base,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[50],
    marginBottom: mobileTheme.spacing[1],
  },
  threatItemDescription: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.neutral[300],
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: mobileTheme.spacing[3],
    paddingTop: mobileTheme.spacing[4],
  },
  button: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: mobileTheme.spacing[3],
    paddingVertical: mobileTheme.spacing[1],
    borderRadius: mobileTheme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: mobileTheme.typography.fontSize.xs,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[50],
  },
});

export const ScanPreview = ({
  fileName,
  fileSize,
  scanStatus,
  threatsDetected,
  threatLevel,
  detailedResults,
  onViewDetails,
  onDismiss,
}: ScanPreviewProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const threatColor = threatColorMap[threatLevel];
  const statusColors = {
    pending: mobileTheme.colors.neutral[600],
    scanning: mobileTheme.colors.primary[600],
    complete: threatColor,
    error: mobileTheme.colors.error[600],
  };

  return (
    <MobileCard variant="elevated" padding="lg">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.fileName}>{fileName}</Text>
            <Text style={styles.fileSize}>{formatFileSize(fileSize)}</Text>
            {scanStatus !== 'pending' && (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColors[scanStatus] },
                ]}
              >
                <Text style={styles.statusText}>
                  {scanStatus.charAt(0).toUpperCase() + scanStatus.slice(1)}
                </Text>
              </View>
            )}
          </View>

          {/* Threat Indicator */}
          <View
            style={[
              styles.threatIndicator,
              {
                borderBottomWidth: 1,
                borderBottomColor: mobileTheme.colors.neutral[800],
              },
            ]}
          >
            <View>
              <Text style={[styles.threatCount, { color: threatColor }]}>
                {threatsDetected}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.threatLabel}>
                {threatsDetected === 0
                  ? 'No threats detected'
                  : `Threat${threatsDetected !== 1 ? 's' : ''} Detected`}
              </Text>
              <Text
                style={[
                  styles.threatLabel,
                  { color: threatColor, marginTop: mobileTheme.spacing[1] },
                ]}
              >
                {threatLevel.charAt(0).toUpperCase() + threatLevel.slice(1)}
              </Text>
            </View>
          </View>

          {/* Detailed Results */}
          {detailedResults && detailedResults.length > 0 && (
            <View style={styles.detailsList}>
              {detailedResults.map((result) => (
                <View
                  key={result.id}
                  style={[
                    styles.threatItem,
                    {
                      borderLeftColor: severityColorMap[result.severity],
                      backgroundColor: mobileTheme.colors.neutral[800],
                    },
                  ]}
                >
                  <Text style={styles.threatItemTitle}>{result.threat}</Text>
                  <Text style={styles.threatItemDescription}>
                    {result.description}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          {(onViewDetails || onDismiss) && (
            <View style={styles.buttonContainer}>
              {onDismiss && (
                <MobileButton
                  title="Dismiss"
                  variant="outline"
                  size="md"
                  onPress={onDismiss}
                  style={styles.button}
                />
              )}
              {onViewDetails && (
                <MobileButton
                  title="View Details"
                  variant="primary"
                  size="md"
                  onPress={onViewDetails}
                  style={styles.button}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </MobileCard>
  );
};
