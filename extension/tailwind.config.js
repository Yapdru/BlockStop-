/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        threat: {
          critical: '#dc2626',
          high: '#ea580c',
          medium: '#eab308',
          low: '#2563eb',
          safe: '#16a34a',
        },
      },
      spacing: {
        '4.5': '1.125rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          from: {
            transform: 'translateX(400px)',
            opacity: '0',
          },
          to: {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        slideOut: {
          from: {
            transform: 'translateX(0)',
            opacity: '1',
          },
          to: {
            transform: 'translateX(400px)',
            opacity: '0',
          },
        },
      },
      boxShadow: {
        'threat-sm': '0 1px 2px 0 rgba(220, 38, 38, 0.05)',
        'threat-md': '0 4px 6px -1px rgba(220, 38, 38, 0.1)',
        'threat-lg': '0 10px 15px -3px rgba(220, 38, 38, 0.1)',
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['18px', '28px'],
        xl: ['20px', '28px'],
      },
    },
  },
  plugins: [],
  important: true,
};
