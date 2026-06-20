// BlockStop Design System - Color Tokens
// Light blue (primary), yellow (accent), white/gray (neutral)

export const blockstopColors = {
  // Primary: Light Blue (professional, trustworthy)
  primary: {
    50: '#f0f7ff',
    100: '#e0efff',
    200: '#bae0ff',
    300: '#7ac5ff',
    400: '#3ba9ff',
    500: '#1e88ff', // Primary brand
    600: '#1565dc',
    700: '#0d47a1',
    800: '#0a2f7f',
    900: '#081c5c',
  },

  // Accent: Yellow (positive, action-oriented)
  accent: {
    50: '#fffef0',
    100: '#fffce0',
    200: '#fff8bb',
    300: '#fff48a',
    400: '#ffed4e',
    500: '#ffe500', // Accent brand
    600: '#f5d800',
    700: '#d4a000',
    800: '#b08000',
    900: '#7a5f00',
  },

  // Neutral: White & Grays (clean, spacious)
  neutral: {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Semantic colors
  success: '#4caf50',
  warning: '#ff9800',
  danger: '#f44336',
  info: '#2196f3',
} as const;

// Tier-specific color overrides
export const tierColors = {
  free: {
    primary: blockstopColors.neutral[400],
    accent: blockstopColors.neutral[300],
  },
  neo: {
    primary: blockstopColors.primary[600],
    accent: blockstopColors.neutral[400],
  },
  pro: {
    primary: blockstopColors.primary[500],
    accent: blockstopColors.accent[500],
  },
  office: {
    primary: blockstopColors.primary[600],
    accent: blockstopColors.accent[600],
  },
  health: {
    primary: blockstopColors.primary[500],
    accent: blockstopColors.success,
  },
  max: {
    primary: blockstopColors.primary[500],
    accent: blockstopColors.accent[500],
  },
} as const;
