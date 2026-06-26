/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  '#FDFAF6',
          100: '#F5EFE6',
          200: '#EDE0D4',
          300: '#E0CCBA',
        },
        brown: {
          100: '#C9A87C',
          200: '#B8895A',
          300: '#8B5E3C',
          400: '#6B3F2A',
          500: '#4A2C1A',
          600: '#3D2B1F',
          700: '#2A1C12',
        },
        status: {
          waiting:   '#C9A87C',
          pickup:    '#8B5E3C',
          transit:   '#4A6FA5',
          delivered: '#3A7D44',
          failed:    '#B03A2E',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body:    ['Montserrat', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'luxury': '0 4px 24px rgba(61, 43, 31, 0.08)',
        'luxury-hover': '0 8px 32px rgba(61, 43, 31, 0.14)',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}