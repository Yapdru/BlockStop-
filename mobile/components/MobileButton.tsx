/**
 * Mobile Button Component
 * Touch-friendly button with haptic feedback
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
  ActivityIndicator,
  View,
} from 'react-native';
import { mobileTheme } from '../utils/mobile-theme';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface MobileButtonProps {
  onPress?: (event: GestureResponderEvent) => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  activeOpacity?: number;
}

const sizeMap = {
  sm: {
    paddingVertical: mobileTheme.spacing[2],
    paddingHorizontal: mobileTheme.spacing[3],
    fontSize: mobileTheme.typography.fontSize.sm,
  },
  md: {
    paddingVertical: mobileTheme.spacing[3],
    paddingHorizontal: mobileTheme.spacing[4],
    fontSize: mobileTheme.typography.fontSize.base,
  },
  lg: {
    paddingVertical: mobileTheme.spacing[4],
    paddingHorizontal: mobileTheme.spacing[6],
    fontSize: mobileTheme.typography.fontSize.lg,
  },
};

const variantStyles = {
  primary: {
    backgroundColor: mobileTheme.colors.primary[600],
    textColor: '#fff',
  },
  secondary: {
    backgroundColor: mobileTheme.colors.secondary[600],
    textColor: '#fff',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: mobileTheme.colors.primary[600],
    textColor: mobileTheme.colors.primary[600],
  },
  ghost: {
    backgroundColor: 'transparent',
    textColor: mobileTheme.colors.primary[600],
  },
  danger: {
    backgroundColor: mobileTheme.colors.error[600],
    textColor: '#fff',
  },
};

const styles = StyleSheet.create({
  button: {
    borderRadius: mobileTheme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileTheme.spacing[2],
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: mobileTheme.spacing[2],
  },
});

export const MobileButton = React.forwardRef<TouchableOpacity, MobileButtonProps>(
  (
    {
      onPress,
      title,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      disabled = false,
      loading = false,
      icon,
      style,
      textStyle,
      activeOpacity = 0.7,
    },
    ref,
  ) => {
    const { trigger } = useHapticFeedback();

    const sizeStyle = sizeMap[size];
    const variantStyle = variantStyles[variant];

    const handlePress = (event: GestureResponderEvent) => {
      if (!disabled && !loading) {
        trigger('light');
        onPress?.(event);
      }
    };

    return (
      <TouchableOpacity
        ref={ref}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={activeOpacity}
        style={[
          styles.button,
          sizeStyle,
          {
            backgroundColor: variantStyle.backgroundColor,
            borderColor: variantStyle.borderColor,
            borderWidth: variantStyle.borderWidth,
          },
          fullWidth && styles.fullWidth,
          (disabled || loading) && styles.disabled,
          style,
        ]}
      >
        <View style={styles.contentContainer}>
          {loading ? (
            <ActivityIndicator color={variantStyle.textColor} size="small" />
          ) : (
            icon && icon
          )}
          <Text
            style={[
              styles.text,
              sizeStyle,
              {
                color: variantStyle.textColor,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
);

MobileButton.displayName = 'MobileButton';
