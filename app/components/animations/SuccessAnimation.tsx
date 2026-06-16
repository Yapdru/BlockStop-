'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { duration, springConfig } from '@/app/utils/motion';
import { CheckCircle2 } from 'lucide-react';

interface SuccessAnimationProps {
  isVisible: boolean;
  title?: string;
  message?: string;
  onComplete?: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
  className?: string;
}

/**
 * SuccessAnimation Component
 * Animated success state with checkmark and confetti-like effects
 * Perfect for form submissions, successful operations, and confirmations
 *
 * @example
 * <SuccessAnimation
 *   isVisible={success}
 *   title="Success!"
 *   message="Your changes have been saved."
 * />
 */
export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  isVisible,
  title = 'Success!',
  message = 'Operation completed successfully.',
  onComplete,
  autoClose = true,
  autoCloseDuration = 3000,
  className = '',
}) => {
  const [shouldShow, setShouldShow] = useState(isVisible);

  useEffect(() => {
    setShouldShow(isVisible);

    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        setShouldShow(false);
        onComplete?.();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, autoCloseDuration, onComplete]);

  if (!shouldShow) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: duration.normal, ...springConfig.default }}
      className={`flex flex-col items-center justify-center gap-4 p-8 rounded-lg bg-green-50 border border-green-200 ${className}`}
    >
      {/* Animated Checkmark Circle */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          duration: duration.slow,
          ...springConfig.bouncy,
        }}
      >
        <CheckCircle2 className="w-16 h-16 text-green-500" strokeWidth={1.5} />
      </motion.div>

      {/* Success Particles */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
          }}
          animate={{
            opacity: 0,
            x: (Math.random() - 0.5) * 100,
            y: Math.random() * 100 + 50,
            scale: 0,
          }}
          transition={{
            duration: 1,
            delay: 0.3 + i * 0.1,
            ease: 'easeOut',
          }}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            marginLeft: '-4px',
            marginTop: '-4px',
          }}
        />
      ))}

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, delay: 0.2 }}
        className="text-xl font-semibold text-green-700"
      >
        {title}
      </motion.h3>

      {/* Message */}
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.normal, delay: 0.3 }}
          className="text-sm text-green-600 text-center"
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );
};

/**
 * SuccessCheckmark Component
 * Standalone animated checkmark
 */
interface SuccessCheckmarkProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const SuccessCheckmark: React.FC<SuccessCheckmarkProps> = ({
  size = 80,
  strokeWidth = 3,
  className = '',
}) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: duration.slow, ...springConfig.bouncy }}
      className={className}
    >
      {/* Circle background */}
      <motion.circle
        cx="40"
        cy="40"
        r="38"
        fill="none"
        stroke="#22c55e"
        strokeWidth={strokeWidth}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      {/* Checkmark */}
      <motion.path
        d="M 20 40 L 35 55 L 60 25"
        fill="none"
        stroke="#22c55e"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
      />
    </motion.svg>
  );
};

/**
 * SuccessBadge Component
 * Small badge with success indicator
 */
interface SuccessBadgeProps {
  text?: string;
  className?: string;
  showIcon?: boolean;
}

export const SuccessBadge: React.FC<SuccessBadgeProps> = ({
  text = 'Success',
  className = '',
  showIcon = true,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: duration.normal, ...springConfig.gentle }}
      className={`inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium ${className}`}
    >
      {showIcon && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: duration.slow, ...springConfig.bouncy }}
        >
          <CheckCircle2 className="w-4 h-4" />
        </motion.div>
      )}
      {text}
    </motion.div>
  );
};

/**
 * SuccessTick Component
 * Animated checkmark tick
 */
interface SuccessTickProps {
  className?: string;
  animated?: boolean;
}

export const SuccessTick: React.FC<SuccessTickProps> = ({
  className = '',
  animated = true,
}) => {
  return (
    <motion.svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`text-green-500 ${className}`}
      initial={animated ? { scale: 0, rotate: -90 } : {}}
      animate={animated ? { scale: 1, rotate: 0 } : {}}
      transition={animated ? { duration: 0.5, ...springConfig.bouncy } : {}}
    >
      <motion.polyline
        points="20 6 9 17 4 12"
        initial={animated ? { pathLength: 0 } : {}}
        animate={animated ? { pathLength: 1 } : {}}
        transition={animated ? { duration: 0.5, ease: 'easeOut' } : {}}
      />
    </motion.svg>
  );
};

/**
 * SuccessToast Component
 * Toast notification with success animation
 */
interface SuccessToastProps {
  message: string;
  isVisible: boolean;
  onDismiss?: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
  className?: string;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  message,
  isVisible,
  onDismiss,
  autoClose = true,
  autoCloseDuration = 3000,
  className = '',
}) => {
  const [shouldShow, setShouldShow] = useState(isVisible);

  useEffect(() => {
    setShouldShow(isVisible);

    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        setShouldShow(false);
        onDismiss?.();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, autoCloseDuration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={shouldShow ? { opacity: 1, y: 0 } : { opacity: 0, y: 100 }}
      exit={{ opacity: 0, y: 100 }}
      transition={{ duration: duration.normal, ...springConfig.gentle }}
      className={`flex items-center gap-3 px-4 py-3 bg-green-500 text-white rounded-lg shadow-lg ${className}`}
    >
      <SuccessTick />
      <p className="text-sm font-medium">{message}</p>
    </motion.div>
  );
};

export default SuccessAnimation;
