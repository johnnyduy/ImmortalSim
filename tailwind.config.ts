import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        "abyssal-ink": "#0A0A0C",
        "void-surface": "#111111",
        "jade-bloom": "#10B981",
        "celestial-gold": "#F59E0B",
        "ethereal-silver": "#F8FAFC",
        "on-tertiary-container": "#94A3B8",
        "primary": "#ECFDF5", // Light text on emerald
        "on-secondary-fixed-variant": "#164E63",
        "on-primary-fixed": "#064E3B",
        "on-tertiary-fixed": "#0F172A",
        "on-surface-variant": "#94A3B8", // Slate 400
        "on-surface": "#F8FAFC", // Slate 50
        "inverse-primary": "#047857",
        "secondary-container": "#0891B2", // Cyan 600
        "on-primary": "#022C22",
        "inverse-on-surface": "#F1F5F9",
        "on-error-container": "#FEF2F2",
        "tertiary": "#F8FAFC",
        "outline": "#334155", // Slate 700
        "toxic-glow": "rgba(16, 185, 129, 0.2)",
        "tertiary-fixed": "#E2E8F0",
        "on-background": "#F8FAFC",
        "terminal-green-dim": "#064E3B",
        "primary-fixed": "#34D399", // Emerald 400
        "text-muted": "#64748B", // Slate 500
        "on-tertiary-fixed-variant": "#475569",
        "surface-container-high": "#1E293B", // Slate 800
        "surface-container-lowest": "#050914", // Deep Slate Obsidian
        "on-primary-container": "#ECFDF5", // Light emerald
        "surface-container-low": "#0F172A", // Slate 900
        "background": "#050914", // Deep Slate Obsidian
        "on-secondary-fixed": "#083344",
        "tertiary-container": "#334155",
        "on-primary-fixed-variant": "#065F46",
        "secondary-fixed": "#22D3EE", // Cyan 400
        "secondary-fixed-dim": "#06B6D4", // Cyan 500
        "amber-glow": "rgba(245, 158, 11, 0.2)",
        "surface-container": "#0F172A",
        "on-error": "#7F1D1D",
        "primary-fixed-dim": "#10B981", // Emerald 500
        "secondary": "#67E8F9", // Cyan 300
        "error": "#FCA5A5",
        "surface-dim": "#0B1120",
        "surface-variant": "#1E293B", // Slate 800
        "surface-container-highest": "#334155",
        "surface-bright": "#1E293B",
        "on-tertiary": "#0F172A",
        "tertiary-fixed-dim": "#CBD5E1",
        "primary-container": "#10B981", // Emerald 500 (was 39ff14)
        "border-subtle": "#1E293B",
        "on-secondary-container": "#CFFAFE",
        "on-secondary": "#164E63",
        "surface": "#0B1120", // Slate 950 base
        "outline-variant": "#1E293B",
        "inverse-surface": "#F8FAFC",
        "error-container": "#991B1B",
        "surface-tint": "#10B981"
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        full: "9999px"
      },
      spacing: {
        "stack-sm": "8px",
        "unit": "4px",
        "panel-padding": "16px",
        "stack-md": "16px",
        "stack-lg": "32px",
        "gutter": "16px",
        "margin-page": "24px"
      },
      fontFamily: {
        "headline-sm": ["Space Grotesk", "sans-serif"],
        "body-sm": ["Outfit", "sans-serif"],
        "label-caps": ["Space Grotesk", "sans-serif"],
        "body-lg": ["Outfit", "sans-serif"],
        "headline-lg": ["Space Grotesk", "sans-serif"],
        "mono-data": ["JetBrains Mono", "monospace"],
        "code-sm": ["JetBrains Mono", "monospace"],
        "headline-md": ["Space Grotesk", "sans-serif"],
        "body-md": ["Outfit", "sans-serif"]
      },
      fontSize: {
        "headline-sm": ["18px", {"lineHeight": "24px", "fontWeight": "600"}],
        "body-sm": ["13px", {"lineHeight": "20px", "fontWeight": "400"}],
        "label-caps": ["11px", {"lineHeight": "16px", "letterSpacing": "0.15em", "fontWeight": "700"}],
        "label-md": ["13px", {"lineHeight": "18px", "letterSpacing": "0.05em", "fontWeight": "700"}],
        "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
        "mono-data": ["14px", {"lineHeight": "20px", "fontWeight": "500"}],
        "code-sm": ["12px", {"lineHeight": "16px", "fontWeight": "500"}],
        "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
        "body-md": ["15px", {"lineHeight": "22px", "fontWeight": "400"}]
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(16, 185, 129, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
