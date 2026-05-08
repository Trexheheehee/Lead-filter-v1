/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        void: '#080b12',
        surface: '#0e1420',
        card: '#131929',
        border: '#1e2d42',
        muted: '#2a3a52',
        text: {
          primary: '#e8edf5',
          secondary: '#7a8fa8',
          dim: '#3d5068',
        },
        hot: { DEFAULT: '#ff4d6d', bg: '#2d0a14', border: '#7a1428' },
        warm: { DEFAULT: '#ffb830', bg: '#2d1a00', border: '#7a4500' },
        cold: { DEFAULT: '#4d9eff', bg: '#001a3d', border: '#0a3d7a' },
        ghost: { DEFAULT: '#5a6a7e', bg: '#141e2b', border: '#2a3a52' },
        accent: '#8b5cf6',
      },
      boxShadow: {
        glow: '0 0 30px rgba(0,229,255,0.08)',
        'glow-hot': '0 0 20px rgba(255,77,109,0.15)',
        'glow-warm': '0 0 20px rgba(255,184,48,0.15)',
        'glow-cold': '0 0 20px rgba(77,158,255,0.15)',
      },
    },
  },
  plugins: [],
}
