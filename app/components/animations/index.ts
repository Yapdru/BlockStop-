/**
 * Animation Components Index
 * Central export point for all animation components
 */

// Page Transitions
export {
  PageTransition,
  PageTransitionWrapper,
  LayoutTransition,
} from './PageTransition';

// Fade Animations
export {
  FadeIn,
  FadeInUp,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  StaggerContainer,
  StaggerItem,
} from './FadeIn';

// Slide Animations
export {
  SlideIn,
  SlideInLeft,
  SlideInRight,
  SlideInTop,
  SlideInBottom,
  SlideFade,
} from './SlideIn';

// Bounce Animations
export {
  BounceIn,
  BounceInUp,
  BounceInDown,
  BounceInLeft,
  BounceInRight,
  JiggleAnimation,
  PulseScale,
} from './BounceIn';

// Loading Animations
export {
  SkeletonLoader,
  SkeletonBox,
  SkeletonAvatar,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
} from './SkeletonLoader';

export {
  LoadingSpinner,
  LoadingBar,
  LoadingOverlay,
  SkeletonSpinner,
  DotsLoader,
} from './LoadingSpinner';

// Success Animations
export {
  SuccessAnimation,
  SuccessCheckmark,
  SuccessBadge,
  SuccessTick,
  SuccessToast,
} from './SuccessAnimation';

// Error Animations
export {
  ErrorShake,
  ShakeInput,
  ErrorPulse,
  ValidationError,
  ErrorBoundary,
} from './ErrorShake';
