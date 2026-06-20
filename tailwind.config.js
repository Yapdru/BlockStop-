/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Light Blue (professional, trustworthy)
        primary: {
          50: "#f0f7ff",
          100: "#e0efff",
          200: "#bae0ff",
          300: "#7ac5ff",
          400: "#3ba9ff",
          500: "#1e88ff",
          600: "#1565dc",
          700: "#0d47a1",
          800: "#0a2f7f",
          900: "#081c5c",
        },
        // Accent: Yellow (positive, action-oriented)
        accent: {
          50: "#fffef0",
          100: "#fffce0",
          200: "#fff8bb",
          300: "#fff48a",
          400: "#ffed4e",
          500: "#ffe500",
          600: "#f5d800",
          700: "#d4a000",
          800: "#b08000",
          900: "#7a5f00",
        },
        // Neutral: Grays & White
        neutral: {
          0: "#ffffff",
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#eeeeee",
          300: "#e0e0e0",
          400: "#bdbdbd",
          500: "#9e9e9e",
          600: "#757575",
          700: "#616161",
          800: "#424242",
          900: "#212121",
        },
        // Semantic
        success: "#4caf50",
        warning: "#ff9800",
        danger: "#f44336",
        info: "#2196f3",
        light: {
          bg: "#f8fbff",
          surface: "#f0f7ff",
          border: "#e0eeff",
        },
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        xxl: "3rem",
      },
      fontSize: {
        h1: "2.5rem",
        h2: "2rem",
        h3: "1.5rem",
        h4: "1.25rem",
        h5: "1rem",
        h6: "0.875rem",
        body: "1rem",
        small: "0.875rem",
        xs: "0.75rem",
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      animation: {
        fadeIn: "fadeIn 300ms ease-out forwards",
        slideUp: "slideUp 300ms ease-out forwards",
        slideDown: "slideDown 300ms ease-out forwards",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        bounce: "bounce 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        bounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
