/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        foreground: '#333333',
        brand: {
          cream: '#FFFFFF',
          sand: '#F3F6FA',
          ink: '#003087',
          charcoal: '#333333',
          muted: '#666666',
          accent: '#0057B7',
          'accent-hover': '#003087',
          line: '#D9E1EC',
          sale: '#B42318',
          success: '#2E7D32',
        },
      },
      fontFamily: {
        display: ['var(--font-sans)', 'Arial', 'sans-serif'],
        sans: ['var(--font-sans)', 'Arial', 'sans-serif'],
      },
      keyframes: {
        'scale-in': {
          from: { transform: 'scale(0.8)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        progress: {
          from: { width: '0' },
          to: { width: '100%' },
        },
      },
      animation: {
        'scale-in': 'scale-in 500ms ease-out',
        progress: 'progress 6s linear',
      },
      gridTemplateColumns: {
        auto: 'repeat(auto-fit, minmax(200px, 1fr))',
      },
    },
  },
  plugins: [],
};
