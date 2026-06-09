/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0a',
          900: '#111111',
          800: '#1a1a1a',
          700: '#2c2c2c',
        },
        rice: {
          100: '#f5f5f0',
          200: '#e8e8e3',
          300: '#d1d1c7',
          400: '#a3a398',
        }
      },
      fontFamily: {
        // Use a classic serif font to mimic ancient scrolls
        serif: ['"Noto Serif TC"', '"Cinzel"', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in-slow': 'fadeIn 2.5s ease-in-out forwards',
        'fog-drift': 'fogDrift 80s linear infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fogDrift: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        }
      }
    },
  },
  plugins: [],
}