// BlockStop Design System - Typography Tokens

export const typography = {
  fontSize: {
    h1: '2.5rem', // 40px
    h2: '2rem', // 32px
    h3: '1.5rem', // 24px
    h4: '1.25rem', // 20px
    h5: '1rem', // 16px
    h6: '0.875rem', // 14px
    body: '1rem', // 16px
    small: '0.875rem', // 14px
    xs: '0.75rem', // 12px
  },
  fontFamily: {
    sans: 'system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, monospace',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Tier-specific typography
export const tierTypography = {
  free: {
    // Smaller fonts for free tier
    fontSize: {
      h1: '2rem',
      h2: '1.5rem',
      h3: '1.25rem',
      h4: '1rem',
      body: '0.875rem',
    },
    fontWeight: {
      heading: 600,
      body: 400,
    },
  },
  neo: {
    // Standard typography
    fontSize: typography.fontSize,
    fontWeight: {
      heading: 600,
      body: 400,
    },
  },
  pro: {
    // Clean, professional
    fontSize: typography.fontSize,
    fontWeight: {
      heading: 600,
      body: 400,
    },
  },
  office: {
    // Professional, readable
    fontSize: typography.fontSize,
    fontWeight: {
      heading: 700,
      body: 500,
    },
  },
  health: {
    // Extra readable for healthcare
    fontSize: {
      h1: '2.5rem',
      h2: '2rem',
      h3: '1.5rem',
      body: '1.125rem', // Slightly larger for readability
    },
    fontWeight: {
      heading: 700,
      body: 500,
    },
    lineHeight: {
      body: 1.75, // Increased line height for readability
    },
  },
  max: {
    // Premium typography
    fontSize: typography.fontSize,
    fontWeight: {
      heading: 700,
      body: 400,
    },
  },
} as const;
