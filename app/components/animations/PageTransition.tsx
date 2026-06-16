'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransitionVariants, duration } from '@/app/utils/motion';

interface PageTransitionProps {
  children: React.ReactNode;
  direction?: 'in' | 'out';
  className?: string;
}

/**
 * PageTransition Component
 * Wraps page content to provide smooth enter/exit animations
 * Typically used at the page level to animate route changes
 *
 * @example
 * export default function Page() {
 *   return (
 *     <PageTransition>
 *       <div>Page Content</div>
 *     </PageTransition>
 *   );
 * }
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  direction = 'in',
  className = '',
}) => {
  const variants = pageTransitionVariants(direction);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
};

/**
 * PageTransitionWrapper Component
 * Advanced wrapper that manages AnimatePresence and handles multiple pages
 * Use this when you need to control transitions between multiple pages
 */
interface PageTransitionWrapperProps {
  children: React.ReactNode;
  isVisible?: boolean;
  mode?: 'wait' | 'sync' | 'popLayout';
  className?: string;
}

export const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({
  children,
  isVisible = true,
  mode = 'wait',
  className = '',
}) => {
  return (
    <AnimatePresence mode={mode}>
      {isVisible && (
        <motion.div
          key="page-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: duration.normal }}
          className={`w-full ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * LayoutTransition Component
 * Provides smooth layout shifts with shared layout animations
 */
interface LayoutTransitionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export const LayoutTransition: React.FC<LayoutTransitionProps> = ({
  children,
  id = 'layout-transition',
  className = '',
}) => {
  return (
    <motion.div
      layoutId={id}
      layout
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
