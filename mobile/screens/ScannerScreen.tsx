/**
 * Scanner Screen
 * File upload and scanning interface
 */

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileTheme } from '../utils/mobile-theme';
import { MobileCard } from '../components/MobileCard';
import { FilePickerButton } from '../components/FilePickerButton';
import { ScanPreview } from '../components/ScanPreview';
import { MobileButton } from '../components/MobileButton';
import { useFilePickerAsync, PickedFile } from '../hooks/useFilePickerAsync';
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
  uploadSection: {
    gap: mobileTheme.spacing[3],
  },
  uploadCard: {
    paddingVertical: mobileTheme.spacing[6],
    paddingHorizontal: mobileTheme.spacing[4],
    alignItems: 'center',
    gap: mobileTheme.spacing[3],
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: mobileTheme.colors.primary[600] + '40',
  },
  uploadIcon: {
    fontSize: 48,
  },
  uploadText: {
    fontSize: mobileTheme.typography.fontSize.base,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[100],
    textAlign: 'center',
  },
  uploadHint: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.neutral[400],
    textAlign: 'center',
  },
  supportedFormats: {
    marginTop: mobileTheme.spacing[4],
    paddingHorizontal: mobileTheme.spacing[3],
    paddingVertical: mobileTheme.spacing[3],
    backgroundColor: mobileTheme.colors.neutral[800],
    borderRadius: mobileTheme.borderRadius.lg,
  },
  supportedTitle: {
    fontSize: mobileTheme.typography.fontSize.sm,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[100],
    marginBottom: mobileTheme.spacing[2],
  },
  supportedList: {
    fontSize: mobileTheme.typography.fontSize.xs,
    color: mobileTheme.colors.neutral[400],
    lineHeight: 18,
  },
  recentScans: {
    gap: mobileTheme.spacing[2],
  },
  scanItemButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: mobileTheme.spacing[3],
    paddingHorizontal: mobileTheme.spacing[3],
    backgroundColor: mobileTheme.colors.neutral[800],
    borderRadius: mobileTheme.borderRadius.lg,
  },
  scanItemInfo: {
    flex: 1,
    gap: mobileTheme.spacing[1],
  },
  scanItemName: {
    fontSize: mobileTheme.typography.fontSize.base,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[50],
  },
  scanItemTime: {
    fontSize: mobileTheme.typography.fontSize.xs,
    color: mobileTheme.colors.neutral[400],
  },
  scanItemStatus: {
    fontSize: 12,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.success[600],
  },
});

export const ScannerScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [selectedFile, setSelectedFile] = useState<PickedFile | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { trigger } = useHapticFeedback();

  const handleFilePicked = (file: PickedFile) => {
    trigger('success');
    setSelectedFile(file);
    // Auto-start scan
    setTimeout(() => {
      startScan();
    }, 500);
  };

  const startScan = () => {
    trigger('medium');
    setIsScanning(true);
    // Simulate scan
    setTimeout(() => {
      setIsScanning(false);
      trigger('success');
    }, 2500);
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
          <Text style={styles.title}>File Scanner</Text>
          <Text style={styles.subtitle}>Upload and scan files for threats</Text>
        </View>

        {/* Upload Section */}
        {!selectedFile ? (
          <View style={styles.uploadSection}>
            <MobileCard variant="outlined" padding="lg">
              <View style={styles.uploadCard}>
                <Text style={styles.uploadIcon}>📁</Text>
                <View style={{ alignItems: 'center', gap: mobileTheme.spacing[1] }}>
                  <Text style={styles.uploadText}>Tap to upload a file</Text>
                  <Text style={styles.uploadHint}>
                    Select from your device
                  </Text>
                </View>
              </View>

              <View style={styles.supportedFormats}>
                <Text style={styles.supportedTitle}>Supported Formats</Text>
                <Text style={styles.supportedList}>
                  Documents: PDF, DOC, DOCX, XLS, XLSX{'\n'}
                  Archives: ZIP, RAR, 7Z{'\n'}
                  Media: JPG, PNG, MP4, MP3{'\n'}
                  Code: EXE, DLL, APK
                </Text>
              </View>
            </MobileCard>

            <FilePickerButton
              mode="file"
              title="Choose File"
              onFilePicked={handleFilePicked}
            />
          </View>
        ) : (
          <>
            {/* File Preview and Scan Results */}
            <ScanPreview
              fileName={selectedFile.name}
              fileSize={selectedFile.size}
              scanStatus={isScanning ? 'scanning' : 'complete'}
              threatsDetected={0}
              threatLevel="safe"
              onViewDetails={() => {
                trigger('light');
                navigation.navigate('ScanResult', { scanId: '1' });
              }}
              onDismiss={() => {
                trigger('light');
                setSelectedFile(null);
              }}
            />

            {/* Scan Another File */}
            <MobileButton
              title="Scan Another File"
              variant="outline"
              size="md"
              onPress={() => {
                trigger('light');
                setSelectedFile(null);
              }}
            />
          </>
        )}

        {/* Recent Scans */}
        {!selectedFile && (
          <>
            <Text style={{ fontSize: mobileTheme.typography.fontSize.lg, fontWeight: mobileTheme.typography.fontWeight.semibold as any, color: mobileTheme.colors.neutral[50], marginTop: mobileTheme.spacing[4] }}>
              Recent Scans
            </Text>
            <View style={styles.recentScans}>
              {['document.pdf', 'image.zip', 'setup.exe'].map((name, idx) => (
                <Pressable
                  key={idx}
                  style={({ pressed }) => [
                    styles.scanItemButton,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    trigger('light');
                    navigation.navigate('ScanResult', { scanId: idx.toString() });
                  }}
                >
                  <View style={styles.scanItemInfo}>
                    <Text style={styles.scanItemName}>{name}</Text>
                    <Text style={styles.scanItemTime}>
                      {Math.floor(Math.random() * 24)} hours ago
                    </Text>
                  </View>
                  <Text style={styles.scanItemStatus}>Safe</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
