/**
 * Responsive Design Breakpoints
 * Mobile-first approach with standardized breakpoints
 */

export const BREAKPOINTS = {
  // Mobile
  xs: 320,
  // Tablet
  sm: 640,
  // Desktop
  md: 1024,
  // Large Desktop
  lg: 1280,
  // Extra Large Desktop
  xl: 1536,
  // Ultra-wide
  xxl: 2560,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Media query strings for use in CSS
 */
export const MEDIA_QUERIES = {
  xs: `(min-width: ${BREAKPOINTS.xs}px)`,
  sm: `(min-width: ${BREAKPOINTS.sm}px)`,
  md: `(min-width: ${BREAKPOINTS.md}px)`,
  lg: `(min-width: ${BREAKPOINTS.lg}px)`,
  xl: `(min-width: ${BREAKPOINTS.xl}px)`,
  xxl: `(min-width: ${BREAKPOINTS.xxl}px)`,
  // Backwards compatibility
  mobile: `(max-width: ${BREAKPOINTS.sm - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.md - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.md}px)`,
  largeDesktop: `(min-width: ${BREAKPOINTS.lg}px)`,
  touch: `(hover: none) and (pointer: coarse)`,
  noTouch: `(hover: hover) and (pointer: fine)`,
  portrait: `(orientation: portrait)`,
  landscape: `(orientation: landscape)`,
  dark: `(prefers-color-scheme: dark)`,
  light: `(prefers-color-scheme: light)`,
  reduceMotion: `(prefers-reduced-motion: reduce)`,
  highContrast: `(prefers-contrast: more)`,
  print: `print`,
} as const;

/**
 * Breakpoint descriptions for developer reference
 */
export const BREAKPOINT_DESCRIPTIONS = {
  xs: "Extra small devices (320px) - Small phones",
  sm: "Small devices (640px) - Large phones & small tablets",
  md: "Medium devices (1024px) - Tablets & small desktops",
  lg: "Large devices (1280px) - Desktops",
  xl: "Extra large devices (1536px) - Large desktops",
  xxl: "Ultra-wide devices (2560px) - 4K displays",
} as const;

/**
 * Touch target size constants (accessibility)
 */
export const TOUCH_TARGETS = {
  minimum: 44, // Minimum touch target size in pixels
  recommended: 48, // Recommended touch target size
  large: 56, // Large touch target for important actions
} as const;

/**
 * Container size limits for responsive layouts
 */
export const CONTAINER_SIZES = {
  xs: "100%",
  sm: "640px",
  md: "1024px",
  lg: "1280px",
  xl: "1536px",
  xxl: "2560px",
} as const;

/**
 * Responsive typography scales
 */
export const TYPOGRAPHY_SCALES = {
  mobile: {
    h1: "28px",
    h2: "24px",
    h3: "20px",
    h4: "18px",
    body: "16px",
    small: "14px",
    tiny: "12px",
  },
  tablet: {
    h1: "32px",
    h2: "28px",
    h3: "24px",
    h4: "20px",
    body: "16px",
    small: "14px",
    tiny: "12px",
  },
  desktop: {
    h1: "36px",
    h2: "32px",
    h3: "28px",
    h4: "24px",
    body: "16px",
    small: "14px",
    tiny: "12px",
  },
} as const;

/**
 * Responsive spacing scale (for padding, margins, gaps)
 */
export const SPACING_SCALE = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  xxl: "32px",
  xxxl: "48px",
  huge: "64px",
} as const;

/**
 * Grid configuration for responsive grid system
 */
export const GRID_CONFIG = {
  columns: 12,
  gutter: {
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  margin: {
    xs: "16px",
    sm: "24px",
    md: "32px",
    lg: "48px",
    xl: "64px",
  },
} as const;

export default BREAKPOINTS;
