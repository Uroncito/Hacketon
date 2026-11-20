/** @type {import('tailwindcss').Config} */
// Paleta del logo de la NFL: azul marino (#013369), rojo (#D50A0A) y blanco.
// Se reemplaza la escala "slate" por una escala azulada para que todos los componentes combinen.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nfl: { azul: '#013369', rojo: '#D50A0A', cielo: '#2f66a8', fondo: '#2c5f9e' },
        slate: {
          50: '#f4f7fb', 100: '#e8eef7', 200: '#d3dff0', 300: '#bccde6', 400: '#a3b8d6',
          500: '#8aa2c6', 600: '#4a6a99', 700: '#2f5185', 800: '#1d3c6e', 900: '#11284f', 950: '#0a1b38',
        },
      },
    },
  },
  plugins: [],
}
