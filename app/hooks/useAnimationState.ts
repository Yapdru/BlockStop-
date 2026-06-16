/**
 * Animation State Management Hook
 * Custom hook for managing animation states and transitions
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface AnimationState {
  isAnimating: boolean;
  isPending: boolean;
  isComplete: boolean;
  error: string | null;
}

/**
 * useAnimationState Hook
 * Manages animation lifecycle and states
 *
 * @example
 * const { isAnimating, startAnimation, completeAnimation } = useAnimationState();
 */
export const useAnimationState = (initialState: Partial<AnimationState> = {}) => {
  const [state, setState] = useState<AnimationState>({
    isAnimating: false,
    isPending: false,
    isComplete: false,
    error: null,
    ...initialState,
  });

  const startAnimation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAnimating: true,
      isPending: true,
      isComplete: false,
      error: null,
    }));
  }, []);

  const completeAnimation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAnimating: false,
      isPending: false,
      isComplete: true,
    }));
  }, []);

  const resetAnimation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAnimating: false,
      isPending: false,
      isComplete: false,
      error: null,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
      isAnimating: false,
      isPending: false,
    }));
  }, []);

  return {
    ...state,
    startAnimation,
    completeAnimation,
    resetAnimation,
    setError,
  };
};

/**
 * useDelayedAnimation Hook
 * Delays animation start by a specified duration
 *
 * @example
 * const { shouldAnimate } = useDelayedAnimation(300);
 */
export const useDelayedAnimation = (delayMs: number = 300) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);

  return { shouldAnimate };
};

/**
 * useSequentialAnimation Hook
 * Manages sequential animations with staggered delays
 *
 * @example
 * const getDelay = useSequentialAnimation(5, 100);
 */
export const useSequentialAnimation = (itemCount: number, delayMs: number = 100) => {
  const getDelay = useCallback(
    (index: number) => index * (delayMs / 1000),
    [delayMs]
  );

  const getTotalDuration = useCallback(() => {
    return (itemCount - 1) * delayMs + 300; // 300ms for animation duration
  }, [itemCount, delayMs]);

  return { getDelay, getTotalDuration };
};

/**
 * useInViewAnimation Hook
 * Triggers animation when element comes into view
 *
 * @example
 * const { ref, isInView } = useInViewAnimation();
 */
export const useInViewAnimation = (options = { threshold: 0.1 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(entry.target);
      }
    }, options);

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [options]);

  return { ref, isInView };
};

/**
 * useScrollAnimation Hook
 * Triggers animation based on scroll position
 *
 * @example
 * const { progress } = useScrollAnimation();
 */
export const useScrollAnimation = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const progress = scrollHeight > 0 ? scrolled / scrollHeight : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { scrollProgress };
};

/**
 * useHoverAnimation Hook
 * Manages hover state for animations
 *
 * @example
 * const { isHovered, ...hoverProps } = useHoverAnimation();
 */
export const useHoverAnimation = () => {
  const [isHovered, setIsHovered] = useState(false);

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return { isHovered, hoverProps };
};

/**
 * useTapAnimation Hook
 * Manages tap/click state for animations
 *
 * @example
 * const { isTapped, ...tapProps } = useTapAnimation();
 */
export const useTapAnimation = () => {
  const [isTapped, setIsTapped] = useState(false);

  const tapProps = {
    onMouseDown: () => setIsTapped(true),
    onMouseUp: () => setIsTapped(false),
    onMouseLeave: () => setIsTapped(false),
  };

  return { isTapped, tapProps };
};

/**
 * useLoadingAnimation Hook
 * Manages loading state with automatic reset
 *
 * @example
 * const { isLoading, setLoading } = useLoadingAnimation();
 */
export const useLoadingAnimation = (autoResetMs?: number) => {
  const [isLoading, setLoading] = useState(false);

  const stopLoading = useCallback(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading || !autoResetMs) return;

    const timer = setTimeout(stopLoading, autoResetMs);
    return () => clearTimeout(timer);
  }, [isLoading, autoResetMs, stopLoading]);

  return { isLoading, setLoading, stopLoading };
};

/**
 * useSuccessAnimation Hook
 * Manages success state with optional auto-dismiss
 *
 * @example
 * const { isSuccess, showSuccess } = useSuccessAnimation(3000);
 */
export const useSuccessAnimation = (autoDismissMs: number = 3000) => {
  const [isSuccess, setSuccess] = useState(false);

  const showSuccess = useCallback(
    (duration: number = autoDismissMs) => {
      setSuccess(true);
      const timer = setTimeout(() => setSuccess(false), duration);
      return () => clearTimeout(timer);
    },
    [autoDismissMs]
  );

  const hideSuccess = useCallback(() => {
    setSuccess(false);
  }, []);

  return { isSuccess, showSuccess, hideSuccess };
};

/**
 * useErrorAnimation Hook
 * Manages error state with optional auto-dismiss
 *
 * @example
 * const { hasError, showError } = useErrorAnimation(4000);
 */
export const useErrorAnimation = (autoDismissMs: number = 4000) => {
  const [hasError, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const showError = useCallback(
    (message: string, duration: number = autoDismissMs) => {
      setErrorMessage(message);
      setError(true);
      const timer = setTimeout(() => setError(false), duration);
      return () => clearTimeout(timer);
    },
    [autoDismissMs]
  );

  const hideError = useCallback(() => {
    setError(false);
    setErrorMessage('');
  }, []);

  return { hasError, errorMessage, showError, hideError };
};

/**
 * useStaggerAnimation Hook
 * Manages staggered animation for list items
 *
 * @example
 * const { isVisible, getItemDelay } = useStaggerAnimation(items.length);
 */
export const useStaggerAnimation = (itemCount: number, delayMs: number = 100) => {
  const [isVisible, setIsVisible] = useState(false);

  const getItemDelay = useCallback(
    (index: number) => {
      return isVisible ? index * (delayMs / 1000) : 0;
    },
    [isVisible, delayMs]
  );

  const triggerAnimation = useCallback(() => {
    setIsVisible(true);
  }, []);

  const resetAnimation = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    isVisible,
    getItemDelay,
    triggerAnimation,
    resetAnimation,
  };
};

/**
 * usePageTransition Hook
 * Manages page transition animations
 *
 * @example
 * const { isTransitioning, triggerTransition } = usePageTransition();
 */
export const usePageTransition = () => {
  const [isTransitioning, setTransitioning] = useState(false);

  const triggerTransition = useCallback(() => {
    setTransitioning(true);
    const timer = setTimeout(() => setTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return { isTransitioning, triggerTransition };
};

/**
 * useAnimationTiming Hook
 * Provides consistent timing values for animations
 *
 * @example
 * const { duration, delay, easing } = useAnimationTiming();
 */
export const useAnimationTiming = () => {
  return {
    duration: {
      instant: 0.1,
      fast: 0.2,
      normal: 0.3,
      slow: 0.5,
      slower: 0.7,
      slowest: 1,
    },
    delay: {
      none: 0,
      xs: 0.05,
      sm: 0.1,
      md: 0.15,
      lg: 0.2,
      xl: 0.3,
    },
    easing: {
      easeInOut: [0.4, 0, 0.2, 1],
      easeOut: [0, 0, 0.2, 1],
      easeIn: [0.4, 0, 1, 1],
    },
  };
};

/**
 * useKeepAliveAnimation Hook
 * Keeps animation alive while component is mounted
 *
 * @example
 * const { isAlive } = useKeepAliveAnimation(dependency);
 */
export const useKeepAliveAnimation = (dependency?: any) => {
  const [isAlive, setAlive] = useState(true);

  useEffect(() => {
    return () => {
      setAlive(false);
    };
  }, [dependency]);

  return { isAlive };
};
