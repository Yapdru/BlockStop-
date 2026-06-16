/**
 * Mobile Input Component
 * Text input field optimized for mobile
 */

import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Platform,
  ViewStyle,
} from 'react-native';
import { mobileTheme } from '../utils/mobile-theme';

interface MobileInputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'filled' | 'outline';
}

const styles = StyleSheet.create({
  container: {
    gap: mobileTheme.spacing[2],
  },
  label: {
    fontSize: mobileTheme.typography.fontSize.sm,
    fontWeight: mobileTheme.typography.fontWeight.medium as any,
    color: mobileTheme.colors.neutral[100],
    marginBottom: mobileTheme.spacing[1],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: mobileTheme.borderRadius.md,
    paddingHorizontal: mobileTheme.spacing[3],
    gap: mobileTheme.spacing[2],
  },
  defaultInput: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.neutral[700],
    backgroundColor: mobileTheme.colors.neutral[900],
  },
  filledInput: {
    backgroundColor: mobileTheme.colors.neutral[800],
  },
  outlineInput: {
    borderWidth: 2,
    borderColor: mobileTheme.colors.primary[600],
    backgroundColor: mobileTheme.colors.neutral[900],
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: mobileTheme.typography.fontSize.base,
    color: mobileTheme.colors.neutral[50],
    paddingVertical: mobileTheme.spacing[3],
  },
  errorText: {
    fontSize: mobileTheme.typography.fontSize.xs,
    color: mobileTheme.colors.error[500],
    marginTop: mobileTheme.spacing[1],
  },
  icon: {
    padding: mobileTheme.spacing[2],
  },
  placeholderTextColor: mobileTheme.colors.neutral[500],
});

export const MobileInput = React.forwardRef<TextInput, MobileInputProps>(
  (
    {
      label,
      error,
      rightIcon,
      leftIcon,
      onRightIconPress,
      containerStyle,
      variant = 'default',
      style,
      editable = true,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const variantStyle =
      variant === 'filled'
        ? styles.filledInput
        : variant === 'outline'
          ? styles.outlineInput
          : styles.defaultInput;

    const inputContainerStyle = [
      styles.inputContainer,
      variantStyle,
      isFocused && {
        borderColor: mobileTheme.colors.primary[500],
        borderWidth: 2,
      },
      error && {
        borderColor: mobileTheme.colors.error[500],
      },
      !editable && {
        opacity: 0.6,
      },
    ];

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={inputContainerStyle}>
          {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={styles.placeholderTextColor.color}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            editable={editable}
            {...props}
          />
          {rightIcon && (
            <TouchableOpacity
              style={styles.icon}
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
            >
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  },
);

MobileInput.displayName = 'MobileInput';
