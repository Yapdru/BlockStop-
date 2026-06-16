export const themeConfig = {
  colors: {
    light: {
      bg: '#ffffff',
      bgSecondary: '#f3f4f6',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      surface: '#f9fafb',
    },
    dark: {
      bg: '#111827',
      bgSecondary: '#1f2937',
      text: '#f3f4f6',
      textSecondary: '#d1d5db',
      border: '#374151',
      surface: '#0f172a',
    },
  },
  transitions: {
    default: 'all 200ms ease-in-out',
    fast: 'all 100ms ease-in-out',
    slow: 'all 300ms ease-in-out',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
};

export const getThemeValue = (isDark: boolean, lightValue: string, darkValue: string): string => {
  return isDark ? darkValue : lightValue;
};
