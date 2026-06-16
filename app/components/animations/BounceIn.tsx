'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { bounceInVariants, springConfig, duration } from '@/app/utils/motion';

interface BounceInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
}

/**
 * BounceIn Component
 * Bouncy scale animation with spring physics
 * Great for call-to-action buttons, badges, and attention-grabbing elements
 *
 * @example
 * <BounceIn delay={0.3}>
 *   <button>Click Me!</button>
 * </BounceIn>
 */
export const BounceIn: React.FC<BounceInProps> = ({
  children,
  className = '',
  delay: delayValue = 0,
  duration: durationValue = duration.slow,
  once = false,
  intensity = 'medium',
}) => {
  const springConfigs = {
    light: springConfig.gentle,
    medium: springConfig.default,
    heavy: springConfig.bouncy,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3, y: 50 }}
      whileInView={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration: durationValue,
        delay: delayValue,
        ...springConfigs[intensity],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * BounceInUp Component
 * Bounce in from bottom
 */
interface BounceInUpProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export const BounceInUp: React.FC<BounceInUpProps> = ({
  children,
  className = '',
  delay: delayValue = 0,
  duration: durationValue = duration.slow,
  once = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scaleY: 0.3 }}
      whileInView={{
        opacity: 1,
        y: 0,
        scaleY: 1,
      }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration: durationValue,
        delay: delayValue,
        ...springConfig.bouncy,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * BounceInDown Component
 * Bounce in from top
 */
interface BounceInDownProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export const BounceInDown: React.FC<BounceInDownProps> = ({
  children,
  className = '',
  delay: delayValue = 0,
  duration: durationValue = duration.slow,
  once = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -100, scaleY: 0.3 }}
      whileInView={{
        opacity: 1,
        y: 0,
        scaleY: 1,
      }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration: durationValue,
        delay: delayValue,
        ...springConfig.bouncy,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * BounceInLeft Component
 * Bounce in from left side
 */
interface BounceInLeftProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export const BounceInLeft: React.FC<BounceInLeftProps> = ({
  children,
  className = '',
  delay: delayValue = 0,
  duration: durationValue = duration.slow,
  once = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -100, scaleX: 0.3 }}
      whileInView={{
        opacity: 1,
        x: 0,
        scaleX: 1,
      }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration: durationValue,
        delay: delayValue,
        ...springConfig.bouncy,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * BounceInRight Component
 * Bounce in from right side
 */
interface BounceInRightProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export const BounceInRight: React.FC<BounceInRightProps> = ({
  children,
  className = '',
  delay: delayValue = 0,
  duration: durationValue = duration.slow,
  once = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scaleX: 0.3 }}
      whileInView={{
        opacity: 1,
        x: 0,
        scaleX: 1,
      }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration: durationValue,
        delay: delayValue,
        ...springConfig.bouncy,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * JiggleAnimation Component
 * Continuous jiggle/bounce effect for attention
 */
interface JiggleAnimationProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export const JiggleAnimation: React.FC<JiggleAnimationProps> = ({
  children,
  className = '',
  intensity = 1,
}) => {
  return (
    <motion.div
      animate={{
        y: [0, -5 * intensity, 0],
      }}
      transition={{
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * PulseScale Component
 * Continuous scale pulse for attention-grabbing
 */
interface PulseScaleProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export const PulseScale: React.FC<PulseScaleProps> = ({
  children,
  className = '',
  intensity = 0.05,
}) => {
  return (
    <motion.div
      animate={{
        scale: [1, 1 + intensity, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default BounceIn;
