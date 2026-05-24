import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Omnify Brand Palette
        brand: {
          slate: '#5d737e',
          teal: '#64b6ac',
          aqua: '#c0fdfb',
          frost: '#daffef',
          white: '#fcfffd',
        },
        primary: {
          DEFAULT: '#64b6ac',
          50: '#f0fafa',
          100: '#c0fdfb',
          200: '#9cf5f2',
          300: '#64b6ac',
          400: '#4da89d',
          500: '#3d9590',
          600: '#2d7a76',
          700: '#225f5c',
          800: '#1a4745',
          900: '#112e2d',
        },
        slate: {
          brand: '#5d737e',
          50: '#f5f7f8',
          100: '#e8ecef',
          200: '#d0d8dd',
          300: '#a8b8c0',
          400: '#7a96a2',
          500: '#5d737e',
          600: '#4a5e6a',
          700: '#3b4c56',
          800: '#2e3c44',
          900: '#1e2830',
        },
        frost: '#daffef',
        aqua: '#c0fdfb',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #5d737e 0%, #64b6ac 50%, #c0fdfb 100%)',
        'gradient-brand-dark': 'linear-gradient(135deg, #1e2830 0%, #2d7a76 100%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, #c0fdfb 0px, transparent 50%), radial-gradient(at 80% 0%, #daffef 0px, transparent 50%), radial-gradient(at 0% 50%, #64b6ac22 0px, transparent 50%)',
        'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(192,253,251,0.3) 100%)',
        'gradient-hero': 'linear-gradient(135deg, #fcfffd 0%, #daffef 40%, #c0fdfb 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #1e2830 0%, #2a3a44 100%)',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-md': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.15)',
        'brand': '0 4px 24px rgba(100, 182, 172, 0.3)',
        'brand-lg': '0 8px 40px rgba(100, 182, 172, 0.4)',
        'card': '0 2px 16px rgba(93, 115, 126, 0.1)',
        'card-hover': '0 8px 32px rgba(93, 115, 126, 0.18)',
        'inner-glass': 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '12px',
        'glass-md': '20px',
        'glass-lg': '32px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'fade-down': 'fadeDown 0.5s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(100, 182, 172, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(100, 182, 172, 0.6)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1440px',
        '3xl': '1920px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
}

export default config
