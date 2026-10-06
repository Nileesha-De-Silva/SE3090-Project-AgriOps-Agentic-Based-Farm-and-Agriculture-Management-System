// Brand shades derived from the supplied AgriOps palette.
const brand = {
  50: '#F2FAF6', 100: '#E0F3E9', 200: '#B0E4CC', 300: '#8FCEB5',
  400: '#65AB8F', 500: '#408A71', 600: '#34725B', 700: '#285A48',
  800: '#1D4235', 900: '#122A24', 950: '#091413',
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Existing pages use these names; all now resolve to one brand palette.
      colors: {
        agri: brand, forest: brand, sage: brand,
        emerald: brand, green: brand, teal: brand, lime: brand,
      },
      fontFamily: {
        sans: ['var(--font-family-base)'],
        heading: ['var(--font-family-heading)'],
      },
      boxShadow: {
        'glow-emerald': '0 0 20px -3px rgba(64,138,113,0.28)',
        'glow-green': '0 0 25px -4px rgba(64,138,113,0.22)',
        'glow-forest': '0 0 20px -3px rgba(9,20,19,0.35)',
        'card-green': '0 2px 10px -2px rgba(40,90,72,0.08), 0 1px 3px rgba(9,20,19,0.04)',
        'card-green-hover': '0 12px 28px -6px rgba(40,90,72,0.16), 0 4px 8px rgba(9,20,19,0.04)',
      },
      backgroundImage: {
        'agri-mesh': 'radial-gradient(at 0% 0%, rgba(176,228,204,0.3) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(176,228,204,0.2) 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
}
