/**
 * Login Screen
 * User authentication with email and password
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { mobileTheme } from '../utils/mobile-theme';
import { MobileInput } from '../components/MobileInput';
import { MobileButton } from '../components/MobileButton';
import { MobileCard } from '../components/MobileCard';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useBiometrics } from '../hooks/useBiometrics';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileTheme.colors.neutral[950],
  },
  content: {
    flex: 1,
    paddingHorizontal: mobileTheme.spacing[4],
    paddingVertical: mobileTheme.spacing[6],
    justifyContent: 'center',
  },
  logo: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: mobileTheme.spacing[4],
  },
  header: {
    gap: mobileTheme.spacing[2],
    marginBottom: mobileTheme.spacing[6],
    alignItems: 'center',
  },
  title: {
    fontSize: mobileTheme.typography.fontSize['2xl'],
    fontWeight: mobileTheme.typography.fontWeight.bold as any,
    color: mobileTheme.colors.neutral[50],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: mobileTheme.typography.fontSize.base,
    color: mobileTheme.colors.neutral[400],
    textAlign: 'center',
  },
  form: {
    gap: mobileTheme.spacing[4],
    marginBottom: mobileTheme.spacing[6],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileTheme.spacing[3],
    marginVertical: mobileTheme.spacing[3],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: mobileTheme.colors.neutral[700],
  },
  dividerText: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.neutral[500],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: mobileTheme.spacing[1],
    alignItems: 'center',
  },
  footerText: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.neutral[400],
  },
  footerLink: {
    fontSize: mobileTheme.typography.fontSize.sm,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.primary[600],
  },
});

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { trigger } = useHapticFeedback();
  const { isAvailable: biometricAvailable } = useBiometrics();

  const validateForm = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    trigger('medium');

    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      trigger('success');
      // Navigate to main app
      // navigation.replace('Main');
    }, 1500);
  };

  const handleBiometricLogin = () => {
    trigger('light');
    navigation.navigate('BiometricAuth');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logo}>🔒</View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to BlockStop</Text>
            <Text style={styles.subtitle}>
              Sign in to protect your files
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <MobileInput
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />

            <MobileInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              rightIcon={
                <Text style={{ fontSize: 20 }}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <MobileButton
              title="Sign In"
              variant="primary"
              size="lg"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>

          {/* Biometric Login */}
          {biometricAvailable && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <MobileButton
                title="Sign In with Biometric"
                variant="outline"
                size="lg"
                onPress={handleBiometricLogin}
                disabled={isLoading}
              />
            </>
          )}

          {/* Forgot Password */}
          <MobileButton
            title="Forgot Password?"
            variant="ghost"
            size="md"
            onPress={() => {
              trigger('light');
              Alert.alert('Password Reset', 'Check your email for reset link');
            }}
            disabled={isLoading}
          />

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <MobileButton
              title="Sign Up"
              variant="ghost"
              size="sm"
              onPress={() => {
                trigger('light');
                navigation.navigate('Register');
              }}
              disabled={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
