import type { Config } from 'tailwindcss';
import colors from './tokens/colors.json';
import spacing from './tokens/spacing.json';
import shadows from './tokens/shadows.json';
import breakpoints from './tokens/breakpoints.json';
import borderRadius from './tokens/border-radius.json';
import zIndex from './tokens/z-index.json';
import opacity from './tokens/opacity.json';
import animations from './tokens/animations.json';

const config: Config = {
  content: [
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        neutral: colors.neutral,
      },
      spacing: spacing.spacing,
      gap: spacing.gap,
      padding: spacing.padding,
      margin: spacing.margin,
      boxShadow: {
        sm: shadows.shadow.sm.box,
        md: shadows.shadow.md.box,
        lg: shadows.shadow.lg.box,
        xl: shadows.shadow.xl.box,
        '2xl': shadows.shadow['2xl'].box,
        inner: shadows.shadow.inner.box,
        none: shadows.shadow.none.box,
      },
      screens: {
        xs: breakpoints.breakpoints.xs,
        sm: breakpoints.breakpoints.sm,
        md: breakpoints.breakpoints.md,
        lg: breakpoints.breakpoints.lg,
        xl: breakpoints.breakpoints.xl,
      },
      borderRadius: borderRadius.borderRadius,
      zIndex: zIndex.zIndex,
      opacity: opacity.opacity,
      transitionDuration: {
        fast: animations.duration.fast,
        base: animations.duration.base,
        slow: animations.duration.slow,
        slower: animations.duration.slower,
      },
      animation: {
        fadeIn: 'fadeIn 200ms ease-out',
        fadeOut: 'fadeOut 200ms ease-in',
        slideIn: 'slideIn 300ms ease-out',
        slideOut: 'slideOut 300ms ease-in',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        spin: 'spin 1s linear infinite',
        bounce: 'bounce 1s infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeOut: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        slideIn: {
          from: {
            transform: 'translateY(10px)',
            opacity: '0',
          },
          to: {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        slideOut: {
          from: {
            transform: 'translateY(0)',
            opacity: '1',
          },
          to: {
            transform: 'translateY(10px)',
            opacity: '0',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
