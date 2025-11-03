/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Pastel palette: blue, yellow, pink, purple
        'kd-blue':  '#A7C7E7',
        'kd-yellow':'#FFF2A6',
        'kd-pink':  '#F7C6D9',
        'kd-purple':'#CDB4DB',
        'kd-ink':   '#2D2A32',
        'kd-50':    '#FAFAFF',
        'kd-100':   '#F5F7FF',
      },
      borderRadius: {
        'xl2': '1.25rem',
      },
      boxShadow: {
        'kd': '0 10px 25px rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
}
