/**
 * Motion Utilities and Animation Helpers
 * Centralized motion configurations and helpers for Framer Motion animations
 */

import { Variants, TargetAndTransition } from 'framer-motion';

/**
 * Spring animation configuration - smooth and responsive
 */
export const springConfig = {
  default: { type: 'spring' as const, stiffness: 300, damping: 30, mass: 1 },
  gentle: { type: 'spring' as const, stiffness: 100, damping: 15, mass: 1 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 10, mass: 1 },
  stiff: { type: 'spring' as const, stiffness: 500, damping: 50, mass: 1 },
};

/**
 * Easing functions for smooth, natural motion
 */
export const easing = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeInQuad: [0.55, 0.085, 0.68, 0.53],
  easeOutQuad: [0.25, 0.46, 0.45, 0.94],
  easeInOutQuad: [0.455, 0.03, 0.515, 0.955],
};

/**
 * Duration constants for consistent timing across animations
 */
export const duration = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.7,
  slowest: 1,
};

/**
 * Delay constants for staggered animations
 */
export const delay = {
  none: 0,
  xs: 0.05,
  sm: 0.1,
  md: 0.15,
  lg: 0.2,
  xl: 0.3,
};

/**
 * Fade animation variants
 */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: duration.normal,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: duration.normal,
    },
  },
};

/**
 * Slide in from left animation variants
 */
export const slideInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
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
    x: -50,
    transition: {
      duration: duration.normal,
    },
  },
};

/**
 * Slide in from right animation variants
 */
export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
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
    x: 50,
    transition: {
      duration: duration.normal,
    },
  },
};

/**
 * Slide in from top animation variants
 */
export const slideInTopVariants: Variants = {
  hidden: { opacity: 0, y: -50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -50,
    transition: {
      duration: duration.normal,
    },
  },
};

/**
 * Slide in from bottom animation variants
 */
export const slideInBottomVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: 50,
    transition: {
      duration: duration.normal,
    },
  },
};

/**
 * Scale in animation variants
 */
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
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
    scale: 0.8,
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * Rotate animation variants
 */
export const rotateVariants: Variants = {
  hidden: { opacity: 0, rotate: -10 },
  visible: {
    opacity: 1,
    rotate: 0,
    transition: {
      duration: duration.normal,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    rotate: -10,
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * Bounce in animation variants
 */
export const bounceInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.3, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: duration.slow,
      ...springConfig.bouncy,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.3,
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * Stagger container variants for animating child elements
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: delay.sm,
      delayChildren: delay.xs,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: delay.xs,
      staggerDirection: -1,
    },
  },
};

/**
 * Stagger item variants for child elements in a container
 */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * Pulse animation variants - for attention-grabbing effects
 */
export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Shake animation variants - for error states
 */
export const shakeVariants: Variants = {
  animate: {
    x: [-10, 10, -10, 10, 0],
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * Utility function to get staggered delay for list items
 */
export const getStaggerDelay = (index: number, baseDelay: number = delay.sm): number => {
  return index * baseDelay;
};

/**
 * Utility function to combine animation variants
 */
export const combineVariants = (
  ...variantObjects: Variants[]
): Variants => {
  return variantObjects.reduce((acc, variants) => {
    return {
      ...acc,
      ...variants,
    };
  }, {});
};

/**
 * Utility function for smooth page transitions
 */
export const pageTransitionVariants = (direction: 'in' | 'out' = 'in'): Variants => {
  if (direction === 'out') {
    return {
      exit: {
        opacity: 0,
        y: 10,
        transition: {
          duration: duration.normal,
        },
      },
    };
  }

  return {
    initial: {
      opacity: 0,
      y: 10,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: duration.normal,
      },
    },
  };
};

/**
 * Utility for creating custom hover animations
 */
export const hoverScale = (scale: number = 1.05): TargetAndTransition => ({
  scale,
  transition: {
    duration: duration.fast,
    ...springConfig.gentle,
  },
});

/**
 * Utility for creating custom tap animations
 */
export const tapScale = (scale: number = 0.95): TargetAndTransition => ({
  scale,
  transition: {
    duration: duration.instant,
  },
});
