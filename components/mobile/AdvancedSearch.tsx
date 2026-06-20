/**
 * Advanced Search & Filter Component (Mobile)
 * Provides threat filtering by type, date range, level, and full-text search
 * Supports saving and loading filter presets
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { mobileTheme } from '../../mobile/utils/mobile-theme';

export type ThreatType = 'phishing' | 'malware' | 'spam' | 'suspicious' | 'url' | 'file';
export type ThreatLevel = 'critical' | 'high' | 'medium' | 'low';
export type DateRange = 'today' | 'week' | 'month' | 'custom';

export interface FilterCriteria {
  search: string;
  threatTypes: ThreatType[];
  threatLevels: ThreatLevel[];
  dateRange: DateRange;
  startDate?: Date;
  endDate?: Date;
}

export interface SearchPreset {
  id: string;
  name: string;
  criteria: FilterCriteria;
  createdAt: number;
}

export interface AdvancedSearchProps {
  onSearch: (criteria: FilterCriteria) => void;
  onPresetsLoaded?: (presets: SearchPreset[]) => void;
  defaultCriteria?: Partial<FilterCriteria>;
}

const THREAT_TYPE_OPTIONS: { label: string; value: ThreatType }[] = [
  { label: 'Phishing', value: 'phishing' },
  { label: 'Malware', value: 'malware' },
  { label: 'Spam', value: 'spam' },
  { label: 'Suspicious', value: 'suspicious' },
  { label: 'URL', value: 'url' },
  { label: 'File', value: 'file' },
];

const THREAT_LEVEL_OPTIONS: { label: string; value: ThreatLevel }[] = [
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: 'week' },
  { label: 'Last 30 days', value: 'month' },
  { label: 'Custom', value: 'custom' },
];

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onPresetsLoaded,
  defaultCriteria,
}) => {
  const [criteria, setCriteria] = useState<FilterCriteria>({
    search: defaultCriteria?.search || '',
    threatTypes: defaultCriteria?.threatTypes || [],
    threatLevels: defaultCriteria?.threatLevels || [],
    dateRange: defaultCriteria?.dateRange || 'month',
  });

  const [presets, setPresets] = useState<SearchPreset[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');

  const styles = useMemo(() => createStyles(), []);

  // Handle search text change with debouncing
  const handleSearchChange = useCallback(
    (text: string) => {
      setCriteria((prev) => ({
        ...prev,
        search: text,
      }));
    },
    []
  );

  // Toggle threat type filter
  const toggleThreatType = useCallback((type: ThreatType) => {
    setCriteria((prev) => ({
      ...prev,
      threatTypes: prev.threatTypes.includes(type)
        ? prev.threatTypes.filter((t) => t !== type)
        : [...prev.threatTypes, type],
    }));
  }, []);

  // Toggle threat level filter
  const toggleThreatLevel = useCallback((level: ThreatLevel) => {
    setCriteria((prev) => ({
      ...prev,
      threatLevels: prev.threatLevels.includes(level)
        ? prev.threatLevels.filter((l) => l !== level)
        : [...prev.threatLevels, level],
    }));
  }, []);

  // Change date range
  const handleDateRangeChange = useCallback((range: DateRange) => {
    const now = new Date();
    let startDate: Date | undefined;

    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        // Handle custom date picker
        break;
    }

    setCriteria((prev) => ({
      ...prev,
      dateRange: range,
      startDate,
      endDate: range !== 'custom' ? now : prev.endDate,
    }));
  }, []);

  // Apply search
  const handleApplySearch = useCallback(() => {
    onSearch(criteria);
    setShowFilters(false);
  }, [criteria, onSearch]);

  // Save current search as preset
  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) return;

    const newPreset: SearchPreset = {
      id: `preset_${Date.now()}`,
      name: presetName,
      criteria,
      createdAt: Date.now(),
    };

    setPresets((prev) => [...prev, newPreset]);
    setPresetName('');
    onPresetsLoaded?.([...presets, newPreset]);
  }, [presetName, criteria, presets, onPresetsLoaded]);

  // Load preset
  const handleLoadPreset = useCallback((preset: SearchPreset) => {
    setCriteria(preset.criteria);
    onSearch(preset.criteria);
    setShowPresets(false);
  }, [onSearch]);

  // Delete preset
  const handleDeletePreset = useCallback((presetId: string) => {
    const updated = presets.filter((p) => p.id !== presetId);
    setPresets(updated);
    onPresetsLoaded?.(updated);
  }, [presets, onPresetsLoaded]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    const cleared: FilterCriteria = {
      search: '',
      threatTypes: [],
      threatLevels: [],
      dateRange: 'month',
    };
    setCriteria(cleared);
    onSearch(cleared);
  }, [onSearch]);

  const activeFilterCount = criteria.threatTypes.length + criteria.threatLevels.length;

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search threats..."
          placeholderTextColor={mobileTheme.colors.text.secondary}
          value={criteria.search}
          onChangeText={handleSearchChange}
          editable={true}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
          accessibilityLabel="Open filters"
        >
          <View style={[styles.filterIcon, activeFilterCount > 0 && styles.filterActive]}>
            {activeFilterCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Action Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickActions}
        contentContainerStyle={styles.quickActionsContent}
      >
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => setShowPresets(true)}
          accessibilityLabel="View saved presets"
        >
          <Text style={styles.quickButtonText}>Presets ({presets.length})</Text>
        </TouchableOpacity>
        {activeFilterCount > 0 && (
          <TouchableOpacity
            style={[styles.quickButton, styles.clearButton]}
            onPress={handleClearFilters}
            accessibilityLabel="Clear all filters"
          >
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent={false}>
        <View style={styles.filterModal}>
          <View style={styles.filterHeader}>
            <TouchableOpacity
              onPress={() => setShowFilters(false)}
              accessibilityLabel="Close filters"
            >
              <Text style={styles.closeButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.filterTitle}>Filters</Text>
            <TouchableOpacity onPress={handleApplySearch} accessibilityLabel="Apply filters">
              <Text style={styles.applyButton}>Apply</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            {/* Threat Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Threat Type</Text>
              <View style={styles.optionsGrid}>
                {THREAT_TYPE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.option,
                      criteria.threatTypes.includes(option.value) && styles.optionSelected,
                    ]}
                    onPress={() => toggleThreatType(option.value)}
                    accessibilityLabel={`${option.label} filter`}
                    accessibilityState={{
                      checked: criteria.threatTypes.includes(option.value),
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        criteria.threatTypes.includes(option.value) && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Threat Level Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Threat Level</Text>
              <View style={styles.optionsGrid}>
                {THREAT_LEVEL_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.option,
                      criteria.threatLevels.includes(option.value) && styles.optionSelected,
                    ]}
                    onPress={() => toggleThreatLevel(option.value)}
                    accessibilityLabel={`${option.label} level filter`}
                    accessibilityState={{
                      checked: criteria.threatLevels.includes(option.value),
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        criteria.threatLevels.includes(option.value) && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Date Range</Text>
              <View style={styles.optionsGrid}>
                {DATE_RANGE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.option,
                      criteria.dateRange === option.value && styles.optionSelected,
                    ]}
                    onPress={() => handleDateRangeChange(option.value)}
                    accessibilityLabel={`${option.label} date range`}
                    accessibilityState={{
                      checked: criteria.dateRange === option.value,
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        criteria.dateRange === option.value && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Save as Preset */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Save as Preset</Text>
              <View style={styles.presetInput}>
                <TextInput
                  style={styles.presetInputField}
                  placeholder="Preset name..."
                  placeholderTextColor={mobileTheme.colors.text.secondary}
                  value={presetName}
                  onChangeText={setPresetName}
                />
                <TouchableOpacity
                  style={[styles.button, !presetName.trim() && styles.buttonDisabled]}
                  onPress={handleSavePreset}
                  disabled={!presetName.trim()}
                  accessibilityLabel="Save as preset"
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Presets Modal */}
      <Modal visible={showPresets} animationType="slide" transparent={false}>
        <View style={styles.presetsModal}>
          <View style={styles.presetsHeader}>
            <TouchableOpacity
              onPress={() => setShowPresets(false)}
              accessibilityLabel="Close presets"
            >
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.presetsTitle}>Saved Presets</Text>
            <View style={{ width: 50 }} />
          </View>

          {presets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No saved presets</Text>
              <Text style={styles.emptyStateSubtext}>Create a preset to save your favorite searches</Text>
            </View>
          ) : (
            <FlatList
              data={presets}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.presetItem}
                  onPress={() => handleLoadPreset(item)}
                  accessibilityLabel={`Load preset: ${item.name}`}
                >
                  <View style={styles.presetItemContent}>
                    <Text style={styles.presetItemName}>{item.name}</Text>
                    <Text style={styles.presetItemDetails}>
                      {item.criteria.threatTypes.length} types, {item.criteria.threatLevels.length}{' '}
                      levels
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeletePreset(item.id)}
                    accessibilityLabel={`Delete preset: ${item.name}`}
                  >
                    <Text style={styles.deleteButton}>Delete</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: mobileTheme.spacing.md,
      paddingTop: mobileTheme.spacing.md,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: mobileTheme.spacing.sm,
      marginBottom: mobileTheme.spacing.md,
    },
    searchInput: {
      flex: 1,
      height: 44,
      paddingHorizontal: mobileTheme.spacing.md,
      borderRadius: mobileTheme.borderRadius.lg,
      backgroundColor: mobileTheme.colors.surface,
      color: mobileTheme.colors.text.primary,
      borderWidth: 1,
      borderColor: mobileTheme.colors.border,
      fontSize: 16,
    },
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: mobileTheme.borderRadius.lg,
      backgroundColor: mobileTheme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: mobileTheme.colors.border,
    },
    filterIcon: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterActive: {
      backgroundColor: mobileTheme.colors.primary.light,
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: mobileTheme.colors.semantic.error,
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    quickActions: {
      marginBottom: mobileTheme.spacing.md,
    },
    quickActionsContent: {
      gap: mobileTheme.spacing.sm,
    },
    quickButton: {
      paddingHorizontal: mobileTheme.spacing.md,
      paddingVertical: mobileTheme.spacing.sm,
      borderRadius: mobileTheme.borderRadius.lg,
      backgroundColor: mobileTheme.colors.surface,
      borderWidth: 1,
      borderColor: mobileTheme.colors.border,
    },
    quickButtonText: {
      color: mobileTheme.colors.text.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    clearButton: {
      backgroundColor: mobileTheme.colors.semantic.error + '20',
      borderColor: mobileTheme.colors.semantic.error,
    },
    clearButtonText: {
      color: mobileTheme.colors.semantic.error,
      fontSize: 14,
      fontWeight: '500',
    },
    filterModal: {
      flex: 1,
      backgroundColor: mobileTheme.colors.background,
      paddingTop: mobileTheme.spacing.xl,
    },
    filterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: mobileTheme.spacing.md,
      paddingBottom: mobileTheme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: mobileTheme.colors.border,
    },
    filterTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: mobileTheme.colors.text.primary,
    },
    closeButton: {
      fontSize: 16,
      color: mobileTheme.colors.semantic.error,
      fontWeight: '500',
    },
    applyButton: {
      fontSize: 16,
      color: mobileTheme.colors.primary.default,
      fontWeight: '600',
    },
    filterContent: {
      flex: 1,
      paddingHorizontal: mobileTheme.spacing.md,
      paddingTop: mobileTheme.spacing.md,
    },
    filterSection: {
      marginBottom: mobileTheme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: mobileTheme.colors.text.primary,
      marginBottom: mobileTheme.spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: mobileTheme.spacing.sm,
    },
    option: {
      paddingHorizontal: mobileTheme.spacing.md,
      paddingVertical: mobileTheme.spacing.sm,
      borderRadius: mobileTheme.borderRadius.md,
      backgroundColor: mobileTheme.colors.surface,
      borderWidth: 1,
      borderColor: mobileTheme.colors.border,
      minWidth: '48%',
    },
    optionSelected: {
      backgroundColor: mobileTheme.colors.primary.default,
      borderColor: mobileTheme.colors.primary.default,
    },
    optionText: {
      color: mobileTheme.colors.text.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    optionTextSelected: {
      color: 'white',
    },
    presetInput: {
      flexDirection: 'row',
      gap: mobileTheme.spacing.sm,
    },
    presetInputField: {
      flex: 1,
      height: 44,
      paddingHorizontal: mobileTheme.spacing.md,
      borderRadius: mobileTheme.borderRadius.lg,
      backgroundColor: mobileTheme.colors.surface,
      color: mobileTheme.colors.text.primary,
      borderWidth: 1,
      borderColor: mobileTheme.colors.border,
    },
    button: {
      paddingHorizontal: mobileTheme.spacing.md,
      paddingVertical: mobileTheme.spacing.sm,
      borderRadius: mobileTheme.borderRadius.lg,
      backgroundColor: mobileTheme.colors.primary.default,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 80,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 14,
    },
    presetsModal: {
      flex: 1,
      backgroundColor: mobileTheme.colors.background,
      paddingTop: mobileTheme.spacing.xl,
    },
    presetsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: mobileTheme.spacing.md,
      paddingBottom: mobileTheme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: mobileTheme.colors.border,
    },
    presetsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: mobileTheme.colors.text.primary,
    },
    presetItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: mobileTheme.spacing.md,
      paddingVertical: mobileTheme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: mobileTheme.colors.border,
    },
    presetItemContent: {
      flex: 1,
    },
    presetItemName: {
      fontSize: 16,
      fontWeight: '600',
      color: mobileTheme.colors.text.primary,
      marginBottom: mobileTheme.spacing.xs,
    },
    presetItemDetails: {
      fontSize: 12,
      color: mobileTheme.colors.text.secondary,
    },
    deleteButton: {
      color: mobileTheme.colors.semantic.error,
      fontSize: 14,
      fontWeight: '500',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: mobileTheme.spacing.lg,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '600',
      color: mobileTheme.colors.text.primary,
      marginBottom: mobileTheme.spacing.sm,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: mobileTheme.colors.text.secondary,
      textAlign: 'center',
    },
  });
}

// Export for use
export default AdvancedSearch;
