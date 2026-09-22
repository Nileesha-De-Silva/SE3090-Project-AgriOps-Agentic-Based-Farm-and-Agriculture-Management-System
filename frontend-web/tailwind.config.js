/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        forest: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        sage: {
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
          600: '#65a30d',
          700: '#4d7c0f',
          800: '#3f6212',
          900: '#365314',
          950: '#1a2e05',
        },
      },
      boxShadow: {
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.28)',
        'glow-green': '0 0 25px -4px rgba(34, 197, 94, 0.22)',
        'glow-forest': '0 0 20px -3px rgba(5, 46, 22, 0.35)',
        'card-green': '0 2px 10px -2px rgba(16, 185, 129, 0.08), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'card-green-hover': '0 12px 28px -6px rgba(16, 185, 129, 0.16), 0 4px 8px -2px rgba(0, 0, 0, 0.04)',
      },
      backgroundImage: {
        'agri-mesh': 'radial-gradient(at 0% 0%, rgba(220, 252, 231, 0.4) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(204, 251, 241, 0.35) 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
};
