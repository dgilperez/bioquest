import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // BioQuest custom colors - inspired by logo palette
        nature: {
          50: '#f5ead8',   // Warm cream
          100: '#e8dcc4',  // Light beige
          200: '#c8d5a7',  // Pale sage
          300: '#a8c686',  // Light green
          400: '#6a8b4d',  // Medium forest green
          500: '#588157',  // Forest green
          600: '#3a5a40',  // Deep forest
          700: '#2d4a33',  // Dark forest
          800: '#1f3326',  // Very dark green
          900: '#14221a',  // Almost black green
        },
        // Earth tones from logo
        earth: {
          50: '#fef5e7',
          100: '#f5ead8',
          200: '#d9b89c',
          300: '#c17c4d',
          400: '#a0522d',
          500: '#8b4513',
          600: '#6d3610',
        },
        // Teal accents from logo
        teal: {
          50: '#e6f7f5',
          100: '#b3e5df',
          200: '#80d3c9',
          300: '#4d9b94',
          400: '#2a7c76',
          500: '#1f5d58',
          600: '#164440',
        },
        // Mushroom burgundy
        mushroom: {
          50: '#fce8ea',
          100: '#f5c5ca',
          200: '#d98f95',
          300: '#a24b4f',
          400: '#8b4049',
          500: '#6d3238',
          600: '#4f242a',
        },
        // Purple accent
        flora: {
          50: '#f3ecf5',
          100: '#ddc9e3',
          200: '#b99ac4',
          300: '#6b4e71',
          400: '#543d5a',
          500: '#3d2c42',
        },
        // Rarity colors updated to match theme
        legendary: {
          DEFAULT: '#c17c4d', // Warm orange-brown from logo
          light: '#f5ead8',
          dark: '#8b4513',
        },
        rare: {
          DEFAULT: '#6b4e71', // Purple from logo
          light: '#f3ecf5',
          dark: '#3d2c42',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'badge-unlock': {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'badge-unlock': 'badge-unlock 0.6s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
