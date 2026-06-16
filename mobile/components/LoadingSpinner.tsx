/**
 * Loading Spinner Component
 * Customizable loading indicator
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  Animated,
  Easing,
} from 'react-native';
import { mobileTheme } from '../utils/mobile-theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  label?: string;
  variant?: 'spinner' | 'dots' | 'bar';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: mobileTheme.spacing[3],
  },
  label: {
    fontSize: mobileTheme.typography.fontSize.base,
    color: mobileTheme.colors.neutral[300],
    marginTop: mobileTheme.spacing[2],
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: mobileTheme.spacing[2],
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: mobileTheme.borderRadius.full,
  },
  bar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
});

const sizeMap = {
  small: 'small' as const,
  medium: 'large' as const,
  large: 'large' as const,
};

export const LoadingSpinner = ({
  size = 'medium',
  color = mobileTheme.colors.primary[600],
  label,
  variant = 'spinner',
}: LoadingSpinnerProps) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (variant === 'bar') {
      Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: false,
        })
      ).start();
    }
  }, [animatedValue, variant]);

  const widthInterpolate = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0%', '100%', '0%'],
  });

  if (variant === 'spinner') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size={sizeMap[size]} color={color} />
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
    );
  }

  if (variant === 'dots') {
    const dotSize = size === 'small' ? 6 : size === 'medium' ? 8 : 10;
    return (
      <View style={styles.container}>
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotSize,
                  height: dotSize,
                  backgroundColor: color,
                  opacity: animatedValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3],
                  }),
                },
              ]}
            />
          ))}
        </View>
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bar,
          {
            width: 200,
            backgroundColor: mobileTheme.colors.neutral[800],
          },
        ]}
      >
        <Animated.View
          style={[
            {
              width: widthInterpolate,
              height: '100%',
              backgroundColor: color,
            },
          ]}
        />
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
};
