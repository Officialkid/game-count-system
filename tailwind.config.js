/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        // Modern, readable sizes for 18-45 year olds
        'xs': ['13px', { lineHeight: '1.5' }],     // Slightly larger than default 12px
        'sm': ['15px', { lineHeight: '1.5' }],     // Better readability than 14px
        'base': ['17px', { lineHeight: '1.6' }],   // Main body text (comfortable reading)
        'lg': ['19px', { lineHeight: '1.6' }],     // Emphasized text
        'xl': ['22px', { lineHeight: '1.5' }],     // Subheadings
        '2xl': ['26px', { lineHeight: '1.4' }],    // Section headings
        '3xl': ['32px', { lineHeight: '1.3' }],    // Page titles
        '4xl': ['40px', { lineHeight: '1.2' }],    // Hero headlines
        '5xl': ['48px', { lineHeight: '1.1' }],    // Large displays
      },
      colors: {
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        purple: {
          400: '#a855f7',
          500: '#9333ea',
          600: '#7e22ce',
          700: '#6b21a8',
          800: '#581c87',
        },
        pink: {
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
        },
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#6b46c1', // jewel purple (main brand color)
          600: '#6b46c1', // FIXED: Match primary-500 for consistency
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3730a3',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // amber
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        success: {
          500: '#10b981', // green
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slideUp': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
