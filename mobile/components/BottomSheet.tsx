/**
 * Bottom Sheet Component
 * Reusable bottom sheet for mobile interactions
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  GestureResponderEvent,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { mobileTheme } from '../utils/mobile-theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  height?: number;
  enableGestureClosing?: boolean;
}

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    backgroundColor: mobileTheme.colors.neutral[900],
    borderTopLeftRadius: mobileTheme.borderRadius.xl,
    borderTopRightRadius: mobileTheme.borderRadius.xl,
    ...mobileTheme.shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: mobileTheme.colors.neutral[700],
    alignSelf: 'center',
    marginVertical: mobileTheme.spacing[3],
  },
  handleContainer: {
    paddingTop: mobileTheme.spacing[2],
    paddingBottom: mobileTheme.spacing[2],
  },
});

export const BottomSheet = ({
  visible,
  onClose,
  children,
  snapPoints = [300, screenHeight * 0.7],
  height = snapPoints[snapPoints.length - 1],
  enableGestureClosing = true,
}: BottomSheetProps) => {
  const translateY = useRef(new Animated.Value(screenHeight)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enableGestureClosing,
      onMoveShouldSetPanResponder: () => enableGestureClosing,
      onPanResponderMove: Animated.event(
        [null, { dy: translateY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 50) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: screenHeight,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, translateY]);

  const handleClose = () => {
    Animated.spring(translateY, {
      toValue: screenHeight,
      useNativeDriver: false,
    }).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.overlay}
        onPress={handleClose}
        activeOpacity={1}
      />
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateY }],
            height,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>
        <SafeAreaView style={{ flex: 1, paddingHorizontal: mobileTheme.spacing[4] }}>
          {children}
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};
