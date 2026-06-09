import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Garamond', '"EB Garamond"', 'Georgia', 'serif'],
        sans: ['"Source Sans Pro"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        background: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'panel': 'var(--color-panel)',
        'accent': 'var(--color-accent)',
        'accent-muted': 'var(--color-text-tertiary)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'danger': 'var(--color-danger)',
        'success': 'var(--color-success)',
        'lunar': 'var(--color-text-primary)',
        'shadow': 'var(--color-bg)',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'inset-light': 'inset 0 1px 0 rgba(232, 220, 192, 0.05)',
        'none': 'none',
      },
      opacity: {
        '8': '0.08',
        '12': '0.12',
        '15': '0.15',
      },
      transitionTimingFunction: {
        'breath': 'cubic-bezier(0.4, 0.0, 0.6, 1)',
        'drift': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      transitionDuration: {
        '4000': '4000ms',
        '6000': '6000ms',
      },
    },
  },
  plugins: [],
};

export default config;
