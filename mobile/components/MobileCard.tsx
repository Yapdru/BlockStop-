/**
 * Mobile Card Component
 * Reusable card for displaying content sections
 */

import React from 'react';
import {
  View,
  ViewStyle,
  StyleSheet,
  GestureResponderEvent,
  TouchableOpacity,
  Pressable,
  PressableProps,
} from 'react-native';
import { mobileTheme } from '../utils/mobile-theme';

interface MobileCardProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'sm' | 'md' | 'lg';
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  activeOpacity?: number;
}

const paddingMap = {
  sm: mobileTheme.spacing[3],
  md: mobileTheme.spacing[4],
  lg: mobileTheme.spacing[6],
};

const styles = StyleSheet.create({
  card: {
    borderRadius: mobileTheme.borderRadius.lg,
    backgroundColor: mobileTheme.colors.neutral[900],
    overflow: 'hidden',
  },
  elevated: {
    ...mobileTheme.shadows.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.neutral[800],
  },
  filled: {
    backgroundColor: mobileTheme.colors.neutral[800],
  },
});

export const MobileCard = React.forwardRef<View, MobileCardProps>(
  (
    {
      children,
      style,
      variant = 'default',
      padding = 'md',
      onPress,
      disabled = false,
      activeOpacity = 0.7,
      ...props
    },
    ref,
  ) => {
    const paddingValue = paddingMap[padding];
    const variantStyle = variant === 'default' ? {} : styles[variant];

    const cardStyle = [
      styles.card,
      variantStyle,
      {
        padding: paddingValue,
      },
      style,
    ];

    if (onPress) {
      return (
        <Pressable
          ref={ref}
          onPress={onPress}
          disabled={disabled}
          style={({ pressed }) => [
            cardStyle,
            pressed && { opacity: activeOpacity },
          ]}
          {...props}
        >
          {children}
        </Pressable>
      );
    }

    return (
      <View ref={ref} style={cardStyle} {...props}>
        {children}
      </View>
    );
  },
);

MobileCard.displayName = 'MobileCard';
