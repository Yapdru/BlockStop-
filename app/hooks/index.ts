/**
 * Hooks - Main Export
 */

export { useResponsive } from "./useResponsive";
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsTouchDevice,
  useIsPortrait,
  useIsLandscape,
  useIsDarkMode,
  useIsHighContrast,
  usePreferReducedMotion,
  useIsPrintMode,
  useMultipleMediaQueries,
} from "./useMediaQuery";

// Animation hooks
export {
  useAnimationState,
  useDelayedAnimation,
  useSequentialAnimation,
  useInViewAnimation,
  useScrollAnimation,
  useHoverAnimation,
  useTapAnimation,
  useLoadingAnimation,
  useSuccessAnimation,
  useErrorAnimation,
  useStaggerAnimation,
  usePageTransition,
  useAnimationTiming,
  useKeepAliveAnimation,
} from "./useAnimationState";
