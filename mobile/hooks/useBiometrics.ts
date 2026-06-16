/**
 * Biometric Authentication Hook
 * Manages biometric authentication operations and state
 */

import { useState, useCallback, useEffect } from 'react';
import * as ExpoLocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

interface UseBiometricsReturn {
  isAvailable: boolean;
  isBiometricEnabled: boolean;
  isAuthenticating: boolean;
  authenticate: () => Promise<BiometricAuthResult>;
  enable: () => Promise<boolean>;
  disable: () => Promise<boolean>;
  checkCompatibility: () => Promise<boolean>;
  getBiometricType: () => Promise<string>;
}

export const useBiometrics = (): UseBiometricsReturn => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Check biometric availability on mount
  useEffect(() => {
    checkCompatibility();
  }, []);

  const checkCompatibility = useCallback(async (): Promise<boolean> => {
    try {
      const compatible = await ExpoLocalAuthentication.hasHardwareAsync();
      const enrolled = await ExpoLocalAuthentication.isEnrolledAsync();
      const available = compatible && enrolled;

      setIsAvailable(available);
      return available;
    } catch (error) {
      console.error('Biometric compatibility check failed:', error);
      setIsAvailable(false);
      return false;
    }
  }, []);

  const authenticate = useCallback(async (): Promise<BiometricAuthResult> => {
    if (!isAvailable) {
      return {
        success: false,
        error: 'Biometric authentication not available',
      };
    }

    try {
      setIsAuthenticating(true);

      const result = await ExpoLocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        reason: 'Authenticate to access BlockStop',
      });

      setIsAuthenticating(false);

      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Authentication cancelled',
        };
      }
    } catch (error) {
      setIsAuthenticating(false);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [isAvailable]);

  const enable = useCallback(async (): Promise<boolean> => {
    try {
      const compatible = await checkCompatibility();
      if (!compatible) {
        Alert.alert('Error', 'Biometric authentication is not available on this device.');
        return false;
      }

      setIsBiometricEnabled(true);
      return true;
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      return false;
    }
  }, [checkCompatibility]);

  const disable = useCallback(async (): Promise<boolean> => {
    try {
      setIsBiometricEnabled(false);
      return true;
    } catch (error) {
      console.error('Failed to disable biometric:', error);
      return false;
    }
  }, []);

  const getBiometricType = useCallback(async (): Promise<string> => {
    try {
      const types = await ExpoLocalAuthentication.supportedAuthenticationTypesAsync();

      if (types.includes(ExpoLocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      } else if (types.includes(ExpoLocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Fingerprint';
      } else if (types.includes(ExpoLocalAuthentication.AuthenticationType.IRIS)) {
        return 'Iris';
      }

      return 'Biometric';
    } catch (error) {
      console.error('Failed to get biometric type:', error);
      return 'Biometric';
    }
  }, []);

  return {
    isAvailable,
    isBiometricEnabled,
    isAuthenticating,
    authenticate,
    enable,
    disable,
    checkCompatibility,
    getBiometricType,
  };
};
