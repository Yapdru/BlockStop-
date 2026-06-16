/**
 * Results Screen
 * Scan history and results overview
 */

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
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
  statsContainer: {
    flexDirection: 'row',
    gap: mobileTheme.spacing[3],
  },
  statCard: {
    flex: 1,
    paddingVertical: mobileTheme.spacing[3],
    paddingHorizontal: mobileTheme.spacing[2],
    backgroundColor: mobileTheme.colors.neutral[800],
    borderRadius: mobileTheme.borderRadius.lg,
    alignItems: 'center',
    gap: mobileTheme.spacing[1],
  },
  statValue: {
    fontSize: mobileTheme.typography.fontSize.xl,
    fontWeight: mobileTheme.typography.fontWeight.bold as any,
    color: mobileTheme.colors.primary[500],
  },
  statLabel: {
    fontSize: mobileTheme.typography.fontSize.xs,
    color: mobileTheme.colors.neutral[400],
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: mobileTheme.spacing[2],
  },
  filterButton: {
    paddingVertical: mobileTheme.spacing[2],
    paddingHorizontal: mobileTheme.spacing[3],
    borderRadius: mobileTheme.borderRadius.full,
    backgroundColor: mobileTheme.colors.neutral[800],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    borderColor: mobileTheme.colors.primary[600],
  },
  filterButtonText: {
    fontSize: mobileTheme.typography.fontSize.sm,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[300],
  },
  filterButtonTextActive: {
    color: mobileTheme.colors.primary[600],
  },
  resultItem: {
    paddingVertical: mobileTheme.spacing[3],
    paddingHorizontal: mobileTheme.spacing[3],
    backgroundColor: mobileTheme.colors.neutral[800],
    borderRadius: mobileTheme.borderRadius.lg,
    marginBottom: mobileTheme.spacing[2],
    gap: mobileTheme.spacing[2],
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultName: {
    fontSize: mobileTheme.typography.fontSize.base,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[50],
  },
  resultStatus: {
    paddingHorizontal: mobileTheme.spacing[2],
    paddingVertical: mobileTheme.spacing[1],
    borderRadius: mobileTheme.borderRadius.sm,
    backgroundColor: mobileTheme.colors.success[600] + '20',
  },
  resultStatusText: {
    fontSize: mobileTheme.typography.fontSize.xs,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.success[600],
  },
  resultDetails: {
    gap: mobileTheme.spacing[1],
  },
  resultDetail: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.neutral[400],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: mobileTheme.spacing[8],
    gap: mobileTheme.spacing[3],
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: mobileTheme.typography.fontSize.base,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[300],
  },
  emptySubtext: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.neutral[500],
  },
});

const MOCK_RESULTS = [
  {
    id: '1',
    name: 'document.pdf',
    status: 'safe',
    size: '2.5 MB',
    date: 'Today at 2:30 PM',
    threats: 0,
  },
  {
    id: '2',
    name: 'backup.zip',
    status: 'safe',
    size: '145 MB',
    date: 'Yesterday at 10:15 AM',
    threats: 0,
  },
  {
    id: '3',
    name: 'photo_album.zip',
    status: 'safe',
    size: '89 MB',
    date: '2 days ago',
    threats: 0,
  },
];

export const ResultsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('all');
  const { trigger } = useHapticFeedback();

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
          <Text style={styles.title}>Results</Text>
          <Text style={styles.subtitle}>View all your scan results</Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{MOCK_RESULTS.length}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Threats</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>100%</Text>
            <Text style={styles.statLabel}>Safe</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterContainer}>
          {['all', 'safe', 'warning', 'danger'].map((filter) => (
            <Pressable
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.filterButtonActive,
              ]}
              onPress={() => {
                trigger('light');
                setActiveFilter(filter);
              }}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === filter &&
                    styles.filterButtonTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Results List */}
        {MOCK_RESULTS.length > 0 ? (
          <View>
            {MOCK_RESULTS.map((result) => (
              <Pressable
                key={result.id}
                style={({ pressed }) => [
                  styles.resultItem,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  trigger('light');
                  navigation.navigate('ScanResult', { scanId: result.id });
                }}
              >
                <View style={styles.resultHeader}>
                  <Text style={styles.resultName}>{result.name}</Text>
                  <View style={styles.resultStatus}>
                    <Text style={styles.resultStatusText}>
                      {result.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.resultDetails}>
                  <Text style={styles.resultDetail}>{result.size}</Text>
                  <Text style={styles.resultDetail}>{result.date}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No scans yet</Text>
            <Text style={styles.emptySubtext}>
              Start by uploading a file to scan
            </Text>
            <MobileButton
              title="Go to Scanner"
              variant="primary"
              size="md"
              onPress={() => {
                trigger('light');
                navigation.navigate('ScannerTab');
              }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
