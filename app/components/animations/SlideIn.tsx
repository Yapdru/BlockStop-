'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  slideInLeftVariants,
  slideInRightVariants,
  slideInTopVariants,
  slideInBottomVariants,
  duration,
} from '@/app/utils/motion';

type SlideDirection = 'left' | 'right' | 'top' | 'bottom';

interface SlideInProps {
  children: React.ReactNode;
  direction?: SlideDirection;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  distance?: number;
}

/**
 * SlideIn Component
 * Slide in animation from specified direction
 * Useful for modals, sidebars, and directional reveals
 *
 * @example
 * <SlideIn direction="left">
 *   <div>Sidebar Content</div>
 * </SlideIn>
 */
export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'left',
  className = '',
  delay: delayValue = 0,
  duration: durationValue = duration.normal,
  once = false,
  distance = 50,
}) => {
  const directionMap: Record<SlideDirection, any> = {
    left: slideInLeftVariants,
    right: slideInRightVariants,
    top: slideInTopVariants,
    bottom: slideInBottomVariants,
  };

  // Create custom variants with adjusted distance
  const customVariants = {
    ...directionMap[direction],
    hidden: {
      ...directionMap[direction].hidden,
      ...(direction === 'left' && { x: -distance }),
      ...(direction === 'right' && { x: distance }),
      ...(direction === 'top' && { y: -distance }),
      ...(direction === 'bottom' && { y: distance }),
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      exit="exit"
      viewport={{ once, amount: 0.3 }}
      variants={customVariants}
      transition={{
        ...customVariants.visible.transition,
        delay: delayValue,
        duration: durationValue,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * SlideInLeft Component
 * Slide in from the left side
 */
interface SlideInLeftProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  distance?: number;
}

export const SlideInLeft: React.FC<SlideInLeftProps> = ({
  children,
  className = '',
  delay: delayValue = 0,
  duration: durationValue = duration.normal,
  once = false,
  distance = 50,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -distance }}
      whileInView={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -distance }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration: durationValue,
        delay: delayValue,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * SlideInRight Component
 * Slide in from the right side
 */
interface SlideInRightProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  distance?: number;
}

export const SlideInRight: React.FC<SlideInRightProps> = ({
  children,
  className = '',
  delay: delayValue = 0,
  duration: durationValue = duration.normal,
  once = false,
  distance = 50,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: distance }}
      whileInView={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: distance }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration: durationValue,
        delay: delayValue,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * SlideInTop Component
 * Slide in from the top
 */
interface SlideInTopProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  distance?: number;
}

export const SlideInTop: React.FC<SlideInTopProps> = ({
  children,
  className = '',
  delay: delayValue = 0,
  duration: durationValue = duration.normal,
  once = false,
  distance = 50,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -distance }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -distance }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration: durationValue,
        delay: delayValue,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * SlideInBottom Component
 * Slide in from the bottom
 */
interface SlideInBottomProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  distance?: number;
}

export const SlideInBottom: React.FC<SlideInBottomProps> = ({
  children,
  className = '',
  delay: delayValue = 0,
  duration: durationValue = duration.normal,
  once = false,
  distance = 50,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: distance }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration: durationValue,
        delay: delayValue,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * SlideFade Component
 * Combined slide and fade effect from multiple directions
 */
interface SlideFadeProps {
  children: React.ReactNode;
  direction?: SlideDirection;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  distance?: number;
}

export const SlideFade: React.FC<SlideFadeProps> = ({
  children,
  direction = 'up',
  className = '',
  delay: delayValue = 0,
  duration: durationValue = duration.normal,
  once = false,
  distance = 40,
}) => {
  const positionMap: Record<string, any> = {
    left: { x: -distance, y: 0 },
    right: { x: distance, y: 0 },
    up: { x: 0, y: -distance },
    top: { x: 0, y: -distance },
    down: { x: 0, y: distance },
    bottom: { x: 0, y: distance },
  };

  const position = positionMap[direction] || positionMap.up;

  return (
    <motion.div
      initial={{ opacity: 0, ...position }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...position }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration: durationValue,
        delay: delayValue,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default SlideIn;
