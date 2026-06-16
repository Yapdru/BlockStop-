/**
 * Transition Definitions and Factory Functions
 * Reusable transition factories for common UI patterns
 */

import { Variants, TargetAndTransition } from 'framer-motion';
import {
  duration,
  delay,
  easing,
  springConfig,
  fadeVariants,
  slideInLeftVariants,
  slideInRightVariants,
  slideInTopVariants,
  slideInBottomVariants,
  scaleVariants,
  bounceInVariants,
} from './motion';

/**
 * Modal transition - scale and fade
 */
export const modalTransition: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.75,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: duration.normal,
      ...springConfig.default,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.75,
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * Dialog backdrop transition - fade only
 */
export const backdropTransition: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: duration.normal,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * Dropdown menu transition - slide down and fade
 */
export const dropdownTransition: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    pointerEvents: 'none',
  },
  visible: {
    opacity: 1,
    y: 0,
    pointerEvents: 'auto',
    transition: {
      duration: duration.fast,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    pointerEvents: 'none',
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * Toast notification transition - slide in from bottom
 */
export const toastTransition: Variants = {
  hidden: {
    opacity: 0,
    y: 100,
    pointerEvents: 'none',
  },
  visible: {
    opacity: 1,
    y: 0,
    pointerEvents: 'auto',
    transition: {
      duration: duration.normal,
      ...springConfig.gentle,
    },
  },
  exit: {
    opacity: 0,
    y: 100,
    pointerEvents: 'none',
    transition: {
      duration: duration.normal,
    },
  },
};

/**
 * Sidebar transition - slide in from left
 */
export const sidebarTransition: Variants = {
  hidden: {
    opacity: 0,
    x: -300,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: duration.normal,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: -300,
    transition: {
      duration: duration.normal,
    },
  },
};

/**
 * Card hover effect - lift and shadow
 */
export const cardHoverVariants: Variants = {
  rest: {
    y: 0,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    y: -8,
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
    transition: {
      duration: duration.fast,
      ...springConfig.gentle,
    },
  },
};

/**
 * Button press effect - scale down
 */
export const buttonPressVariants: Variants = {
  rest: {
    scale: 1,
  },
  pressed: {
    scale: 0.95,
    transition: {
      duration: duration.instant,
    },
  },
};

/**
 * Tooltip transition - fade and scale
 */
export const tooltipTransition: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: duration.fast,
      ...springConfig.gentle,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * Popover transition - slide and fade
 */
export const popoverTransition: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ...springConfig.gentle,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * Alert/Banner transition - slide down
 */
export const alertTransition: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
    height: 0,
  },
  visible: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: {
      duration: duration.normal,
      ...springConfig.gentle,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    height: 0,
    transition: {
      duration: duration.normal,
    },
  },
};

/**
 * Progress bar animation - fill width
 */
export const progressBarVariants: Variants = {
  initial: {
    width: '0%',
  },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: duration.normal,
      ease: 'easeOut',
    },
  }),
};

/**
 * Accordion item transition
 */
export const accordionItemVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      duration: duration.normal,
      ease: 'easeInOut',
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      duration: duration.normal,
      ease: 'easeInOut',
    },
  },
};

/**
 * Tabs transition - slide and fade
 */
export const tabsTransition: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: duration.fast,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * Factory function to create slide transition with custom direction
 */
export const createSlideTransition = (
  direction: 'left' | 'right' | 'top' | 'bottom',
  distance: number = 50
): Variants => {
  const directionMap = {
    left: { x: -distance },
    right: { x: distance },
    top: { y: -distance },
    bottom: { y: distance },
  };

  const movement = directionMap[direction];

  return {
    hidden: {
      opacity: 0,
      ...movement,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: duration.normal,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      ...movement,
      transition: {
        duration: duration.normal,
      },
    },
  };
};

/**
 * Factory function to create stagger transition for lists
 */
export const createListTransition = (
  itemCount: number,
  baseDelay: number = delay.sm
): Variants => {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: baseDelay,
        delayChildren: delay.xs,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: baseDelay / 2,
        staggerDirection: -1,
      },
    },
  };
};

/**
 * Factory function to create bounce transition with custom intensity
 */
export const createBounceTransition = (intensity: 'light' | 'medium' | 'heavy' = 'medium'): Variants => {
  const springConfigs = {
    light: { ...springConfig.gentle },
    medium: { ...springConfig.default },
    heavy: { ...springConfig.bouncy },
  };

  return {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: duration.slow,
        ...springConfigs[intensity],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.5,
      transition: {
        duration: duration.fast,
      },
    },
  };
};

/**
 * Factory function to create custom transition with specific duration and easing
 */
export const createCustomTransition = (
  durationMs: number = duration.normal * 1000,
  easingFunction: string | number[] = 'easeOut',
  properties: {
    enterFrom?: Record<string, any>;
    exitTo?: Record<string, any>;
    enterDelay?: number;
    exitDelay?: number;
  } = {}
): Variants => {
  const {
    enterFrom = { opacity: 0 },
    exitTo = { opacity: 0 },
    enterDelay = 0,
    exitDelay = 0,
  } = properties;

  return {
    hidden: enterFrom,
    visible: {
      opacity: enterFrom.opacity === 0 ? 1 : enterFrom.opacity,
      ...Object.fromEntries(
        Object.entries(enterFrom)
          .filter(([key]) => key !== 'opacity')
          .map(([key]) => [key, 0])
      ),
      transition: {
        duration: durationMs / 1000,
        ease: easingFunction,
        delay: enterDelay,
      },
    },
    exit: {
      ...exitTo,
      transition: {
        duration: durationMs / 1000,
        ease: easingFunction,
        delay: exitDelay,
      },
    },
  };
};

/**
 * Loading skeleton transition - shimmer effect
 */
export const skeletonShimmerVariants: Variants = {
  animate: {
    backgroundPosition: ['200% 0%', '-200% 0%'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};
