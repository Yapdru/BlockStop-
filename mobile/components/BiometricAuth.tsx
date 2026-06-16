/**
 * Biometric Authentication Component
 * Biometric setup and authentication UI
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { mobileTheme } from '../utils/mobile-theme';
import { MobileCard } from './MobileCard';
import { MobileButton } from './MobileButton';
import { useBiometrics } from '../hooks/useBiometrics';

interface BiometricAuthProps {
  onAuthComplete?: (success: boolean) => void;
  onSetupComplete?: () => void;
  mode?: 'setup' | 'auth' | 'disable';
}

const styles = StyleSheet.create({
  container: {
    gap: mobileTheme.spacing[4],
    alignItems: 'center',
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: mobileTheme.borderRadius.full,
    backgroundColor: mobileTheme.colors.primary[600] + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: mobileTheme.spacing[4],
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: mobileTheme.typography.fontSize.xl,
    fontWeight: mobileTheme.typography.fontWeight.bold as any,
    color: mobileTheme.colors.neutral[50],
    textAlign: 'center',
    marginBottom: mobileTheme.spacing[2],
  },
  description: {
    fontSize: mobileTheme.typography.fontSize.base,
    color: mobileTheme.colors.neutral[300],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: mobileTheme.spacing[4],
  },
  benefitsList: {
    gap: mobileTheme.spacing[2],
    marginVertical: mobileTheme.spacing[4],
    width: '100%',
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileTheme.spacing[3],
    paddingVertical: mobileTheme.spacing[2],
  },
  benefitIcon: {
    fontSize: 20,
    color: mobileTheme.colors.success[600],
  },
  benefitText: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.neutral[300],
    flex: 1,
  },
  statusContainer: {
    width: '100%',
    paddingVertical: mobileTheme.spacing[3],
    paddingHorizontal: mobileTheme.spacing[3],
    borderRadius: mobileTheme.borderRadius.md,
    backgroundColor: mobileTheme.colors.neutral[800],
    marginVertical: mobileTheme.spacing[3],
  },
  statusText: {
    fontSize: mobileTheme.typography.fontSize.sm,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    textAlign: 'center',
  },
  enabledStatus: {
    color: mobileTheme.colors.success[600],
    backgroundColor: mobileTheme.colors.success[600] + '20',
  },
  disabledStatus: {
    color: mobileTheme.colors.warning[600],
    backgroundColor: mobileTheme.colors.warning[600] + '20',
  },
  unavailableStatus: {
    color: mobileTheme.colors.neutral[500],
    backgroundColor: mobileTheme.colors.neutral[700],
  },
  buttonContainer: {
    width: '100%',
    gap: mobileTheme.spacing[2],
    marginTop: mobileTheme.spacing[4],
  },
  button: {
    width: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: mobileTheme.spacing[6],
  },
});

export const BiometricAuth = ({
  onAuthComplete,
  onSetupComplete,
  mode = 'setup',
}: BiometricAuthProps) => {
  const {
    isAvailable,
    isBiometricEnabled,
    isAuthenticating,
    authenticate,
    enable,
    disable,
    getBiometricType,
  } = useBiometrics();

  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    initializeBiometric();
  }, []);

  const initializeBiometric = async () => {
    const type = await getBiometricType();
    setBiometricType(type);
  };

  const handleAuthenticate = async () => {
    setIsLoading(true);
    const result = await authenticate();
    setIsLoading(false);

    if (result.success) {
      onAuthComplete?.(true);
    } else {
      Alert.alert(
        'Authentication Failed',
        result.error || 'Unable to authenticate with biometrics'
      );
      onAuthComplete?.(false);
    }
  };

  const handleEnable = async () => {
    setIsLoading(true);
    const success = await enable();
    setIsLoading(false);

    if (success) {
      Alert.alert(
        'Success',
        `${biometricType} authentication has been enabled`
      );
      onSetupComplete?.();
    } else {
      Alert.alert('Error', 'Failed to enable biometric authentication');
    }
  };

  const handleDisable = async () => {
    Alert.alert(
      'Disable Biometric',
      `Are you sure you want to disable ${biometricType} authentication?`,
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Disable',
          onPress: async () => {
            setIsLoading(true);
            const success = await disable();
            setIsLoading(false);

            if (success) {
              Alert.alert('Success', 'Biometric authentication has been disabled');
              onSetupComplete?.();
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <MobileCard variant="elevated" padding="lg">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={mobileTheme.colors.primary[600]} />
        </View>
      </MobileCard>
    );
  }

  if (!isAvailable) {
    return (
      <MobileCard variant="elevated" padding="lg">
        <View style={styles.container}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>✕</Text>
          </View>
          <Text style={styles.title}>Not Available</Text>
          <Text style={styles.description}>
            Biometric authentication is not available on this device.
          </Text>
          <View
            style={[
              styles.statusContainer,
              { backgroundColor: mobileTheme.colors.neutral[800] },
            ]}
          >
            <Text style={styles.unavailableStatus}>
              Device does not support biometric authentication
            </Text>
          </View>
        </View>
      </MobileCard>
    );
  }

  return (
    <MobileCard variant="elevated" padding="lg">
      <View style={styles.container}>
        {mode === 'setup' ? (
          <>
            <View style={styles.icon}>
              <Text style={styles.iconText}>👆</Text>
            </View>
            <Text style={styles.title}>Enable {biometricType}</Text>
            <Text style={styles.description}>
              Secure your account with {biometricType} authentication. Quick,
              easy, and secure.
            </Text>

            <View style={styles.benefitsList}>
              <View style={styles.benefit}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>
                  Fast and secure authentication
                </Text>
              </View>
              <View style={styles.benefit}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>
                  No need to remember passwords
                </Text>
              </View>
              <View style={styles.benefit}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>
                  Enhanced account security
                </Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <MobileButton
                title={`Enable ${biometricType}`}
                variant="primary"
                size="lg"
                onPress={handleEnable}
                disabled={isLoading}
                loading={isLoading}
                style={styles.button}
              />
            </View>
          </>
        ) : mode === 'auth' ? (
          <>
            <View style={styles.icon}>
              <Text style={styles.iconText}>🔒</Text>
            </View>
            <Text style={styles.title}>Authenticate</Text>
            <Text style={styles.description}>
              Use your {biometricType} to verify your identity
            </Text>

            <View style={styles.buttonContainer}>
              <MobileButton
                title={`Authenticate with ${biometricType}`}
                variant="primary"
                size="lg"
                onPress={handleAuthenticate}
                disabled={isAuthenticating || isLoading}
                loading={isAuthenticating || isLoading}
                style={styles.button}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.icon}>
              <Text style={styles.iconText}>🔓</Text>
            </View>
            <Text style={styles.title}>{biometricType}</Text>
            <Text style={styles.description}>
              Currently enabled and protecting your account
            </Text>

            <View
              style={[
                styles.statusContainer,
                styles.enabledStatus,
              ]}
            >
              <Text style={styles.statusText}>
                ✓ {biometricType} is active
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <MobileButton
                title={`Disable ${biometricType}`}
                variant="danger"
                size="lg"
                onPress={handleDisable}
                disabled={isLoading}
                loading={isLoading}
                style={styles.button}
              />
            </View>
          </>
        )}
      </View>
    </MobileCard>
  );
};
