/**
 * Mobile Modal Component
 * Full-screen modal with slide-up animation
 */

import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  useWindowDimensions,
  GestureResponderEvent,
} from 'react-native';
import { mobileTheme } from '../utils/mobile-theme';

interface MobileModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
  animationType?: 'slide' | 'fade' | 'none';
  backgroundColor?: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    flex: 1,
    backgroundColor: mobileTheme.colors.neutral[900],
    marginTop: 50,
    borderTopLeftRadius: mobileTheme.borderRadius.xl,
    borderTopRightRadius: mobileTheme.borderRadius.xl,
    paddingHorizontal: mobileTheme.spacing[4],
    paddingVertical: mobileTheme.spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: mobileTheme.spacing[4],
    paddingBottom: mobileTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: mobileTheme.colors.neutral[800],
  },
  title: {
    fontSize: mobileTheme.typography.fontSize['2xl'],
    fontWeight: mobileTheme.typography.fontWeight.bold as any,
    color: mobileTheme.colors.neutral[50],
  },
  closeButton: {
    padding: mobileTheme.spacing[2],
    borderRadius: mobileTheme.borderRadius.full,
    backgroundColor: mobileTheme.colors.neutral[800],
  },
  closeText: {
    fontSize: 24,
    color: mobileTheme.colors.neutral[100],
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: mobileTheme.colors.neutral[700],
    alignSelf: 'center',
    marginBottom: mobileTheme.spacing[4],
  },
});

export const MobileModal = ({
  visible,
  onClose,
  children,
  title,
  showCloseButton = true,
  animationType = 'slide',
  backgroundColor = mobileTheme.colors.neutral[900],
}: MobileModalProps) => {
  const { height } = useWindowDimensions();

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType={animationType}
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <SafeAreaView style={[styles.content, { backgroundColor }]}>
          <View style={styles.handleBar} />
          {(title || showCloseButton) && (
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                {title && <Text style={styles.title}>{title}</Text>}
              </View>
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Text style={styles.closeText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {children}
        </SafeAreaView>
      </View>
    </Modal>
  );
};
