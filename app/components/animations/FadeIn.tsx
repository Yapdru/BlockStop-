'use client';

import React from 'react';
import { motion, TargetAndTransition } from 'framer-motion';
import { fadeVariants, duration, delay } from '@/app/utils/motion';

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  whileInView?: TargetAndTransition;
  onAnimationComplete?: () => void;
}

/**
 * FadeIn Component
 * Simple fade-in animation wrapper for content
 * Great for hero sections, text, and general content
 *
 * @example
 * <FadeIn delay={0.2} duration={0.5}>
 *   <h1>Welcome</h1>
 * </FadeIn>
 */
export const FadeIn: React.FC<FadeInProps> = ({
  children,
  className = '',
  delay: delayValue = 0,
  duration: durationValue = duration.normal,
  once = false,
  whileInView,
  onAnimationComplete,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={whileInView || { opacity: 1 }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration: durationValue,
        delay: delayValue,
      }}
      onAnimationComplete={onAnimationComplete}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * FadeInUp Component
 * Fade in with slide up animation
 * Perfect for staggered list items and card animations
 */
interface FadeInUpProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  onAnimationComplete?: () => void;
}

export const FadeInUp: React.FC<FadeInUpProps> = ({
  children,
  className = '',
  delay: delayValue = 0,
  duration: durationValue = duration.normal,
  distance = 20,
  once = false,
  onAnimationComplete,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration: durationValue,
        delay: delayValue,
      }}
      onAnimationComplete={onAnimationComplete}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * FadeInDown Component
 * Fade in with slide down animation
 */
interface FadeInDownProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  onAnimationComplete?: () => void;
}

export const FadeInDown: React.FC<FadeInDownProps> = ({
  children,
  className = '',
  delay: delayValue = 0,
  duration: durationValue = duration.normal,
  distance = 20,
  once = false,
  onAnimationComplete,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration: durationValue,
        delay: delayValue,
      }}
      onAnimationComplete={onAnimationComplete}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * FadeInLeft Component
 * Fade in with slide from left
 */
interface FadeInLeftProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  onAnimationComplete?: () => void;
}

export const FadeInLeft: React.FC<FadeInLeftProps> = ({
  children,
  className = '',
  delay: delayValue = 0,
  duration: durationValue = duration.normal,
  distance = 30,
  once = false,
  onAnimationComplete,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -distance }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration: durationValue,
        delay: delayValue,
      }}
      onAnimationComplete={onAnimationComplete}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * FadeInRight Component
 * Fade in with slide from right
 */
interface FadeInRightProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  onAnimationComplete?: () => void;
}

export const FadeInRight: React.FC<FadeInRightProps> = ({
  children,
  className = '',
  delay: delayValue = 0,
  duration: durationValue = duration.normal,
  distance = 30,
  once = false,
  onAnimationComplete,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: distance }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration: durationValue,
        delay: delayValue,
      }}
      onAnimationComplete={onAnimationComplete}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerContainer Component
 * Container for staggered animations of child elements
 */
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = '',
  staggerDelay = delay.sm,
  delayChildren = delay.xs,
}) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delayChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerItem Component
 * Individual item in a stagger container
 */
interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className = '',
  as = 'div',
}) => {
  const Component = motion[as as keyof typeof motion];

  return (
    <Component
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: duration.normal,
          },
        },
      }}
      className={className}
    >
      {children}
    </Component>
  );
};

export default FadeIn;
