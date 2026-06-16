/**
 * Permission Management Utilities
 * Handles camera, biometric, file system, and notification permissions
 */

import * as ExpoCamera from 'expo-camera';
import * as ExpoLocalAuthentication from 'expo-local-authentication';
import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';

export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const { status } = await ExpoCamera.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Camera permission error:', error);
    return false;
  }
};

export const checkCameraPermission = async (): Promise<boolean> => {
  try {
    const { status } = await ExpoCamera.getCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Camera permission check error:', error);
    return false;
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      return false;
    }

    const { status } = await ExpoNotifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return status === 'granted';
  } catch (error) {
    console.error('Notification permission error:', error);
    return false;
  }
};

export const checkNotificationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      return false;
    }

    const settings = await ExpoNotifications.getPermissionsAsync();
    return settings.granted || settings.ios?.status === ExpoNotifications.IosAuthorizationStatus.PROVISIONAL;
  } catch (error) {
    console.error('Notification permission check error:', error);
    return false;
  }
};

export const checkBiometricAvailability = async (): Promise<boolean> => {
  try {
    const compatible = await ExpoLocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await ExpoLocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error('Biometric availability error:', error);
    return false;
  }
};

export const getBiometricTypes = async (): Promise<ExpoLocalAuthentication.AuthenticationType[]> => {
  try {
    const types = await ExpoLocalAuthentication.supportedAuthenticationTypesAsync();
    return types;
  } catch (error) {
    console.error('Biometric types error:', error);
    return [];
  }
};

export interface PermissionStatus {
  camera: boolean;
  biometric: boolean;
  notifications: boolean;
}

export const checkAllPermissions = async (): Promise<PermissionStatus> => {
  const [camera, biometric, notifications] = await Promise.all([
    checkCameraPermission(),
    checkBiometricAvailability(),
    checkNotificationPermission(),
  ]);

  return {
    camera,
    biometric,
    notifications,
  };
};

export const requestAllPermissions = async (): Promise<PermissionStatus> => {
  const [camera, notifications] = await Promise.all([
    requestCameraPermission(),
    requestNotificationPermission(),
  ]);

  const biometric = await checkBiometricAvailability();

  return {
    camera,
    biometric,
    notifications,
  };
};
