/**
 * Haptic Feedback Hook
 * Provides haptic feedback for user interactions
 */

import { useCallback } from 'react';
import * as ExpoHaptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

interface UseHapticFeedbackReturn {
  trigger: (type: HapticType) => void;
  selectionTick: () => void;
  notificationTick: (type: 'Success' | 'Warning' | 'Error') => void;
  impactTick: (style: 'Light' | 'Medium' | 'Heavy') => void;
}

export const useHapticFeedback = (): UseHapticFeedbackReturn => {
  const isHapticSupported = Platform.OS !== 'web';

  const trigger = useCallback((type: HapticType) => {
    if (!isHapticSupported) return;

    try {
      switch (type) {
        case 'light':
          ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  }, [isHapticSupported]);

  const selectionTick = useCallback(() => {
    if (!isHapticSupported) return;

    try {
      ExpoHaptics.selectionAsync();
    } catch (error) {
      console.error('Selection tick error:', error);
    }
  }, [isHapticSupported]);

  const notificationTick = useCallback((type: 'Success' | 'Warning' | 'Error') => {
    if (!isHapticSupported) return;

    try {
      const feedbackType = ExpoHaptics.NotificationFeedbackType[type];
      ExpoHaptics.notificationAsync(feedbackType);
    } catch (error) {
      console.error('Notification tick error:', error);
    }
  }, [isHapticSupported]);

  const impactTick = useCallback((style: 'Light' | 'Medium' | 'Heavy') => {
    if (!isHapticSupported) return;

    try {
      const feedbackStyle = ExpoHaptics.ImpactFeedbackStyle[style];
      ExpoHaptics.impactAsync(feedbackStyle);
    } catch (error) {
      console.error('Impact tick error:', error);
    }
  }, [isHapticSupported]);

  return {
    trigger,
    selectionTick,
    notificationTick,
    impactTick,
  };
};
