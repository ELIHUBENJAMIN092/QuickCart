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
        foreground: '#3A3A3A',
        brand: {
          cream: '#FFFFFF',
          sand: '#EEF1F7',
          ink: '#0B0D12',
          charcoal: '#3A3A3A',
          muted: '#6F7480',
          accent: '#0069FF',
          'accent-hover': '#3BA6EF',
          line: '#E0E3EA',
          'accent-soft': '#EAF3FF',
          sale: '#B42318',
          success: '#2E7D32',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'var(--font-sans)', 'Arial', 'sans-serif'],
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
        'menu-in': {
          from: { opacity: '0', transform: 'translateY(-6px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'sheet-in': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'scale-in': 'scale-in 500ms ease-out',
        progress: 'progress 6s linear',
        'menu-in': 'menu-in 160ms ease-out',
        'sheet-in': 'sheet-in 240ms cubic-bezier(0.32, 0.72, 0, 1)',
      },
      gridTemplateColumns: {
        auto: 'repeat(auto-fit, minmax(200px, 1fr))',
      },
    },
  },
  plugins: [],
};
