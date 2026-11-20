/** @type {import('tailwindcss').Config} */
// Paleta de la página: blanco, azul y rojo (colores de la NFL), más unas animaciones suaves.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nfl: { azul: '#013369', rojo: '#d50a0a', fondo: '#2c5f9e' },
        // Escala azul marino usada por la barra lateral, el encabezado, el pie y las vistas de equipo.
        noche: {
          50: '#f4f7fb', 100: '#e8eef7', 200: '#d3dff0', 300: '#bccde6', 400: '#a3b8d6',
          500: '#8aa2c6', 600: '#4a6a99', 700: '#2f5185', 800: '#1d3c6e', 900: '#11284f', 950: '#0a1b38',
        },
      },
      keyframes: {
        'entrar-izq': { '0%': { opacity: '0', transform: 'translateX(-48px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        'entrar-der': { '0%': { opacity: '0', transform: 'translateX(48px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        subir: { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        flecha: { '0%, 100%': { transform: 'translateX(-6px)' }, '50%': { transform: 'translateX(10px)' } },
        brillo: { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
      },
      animation: {
        'entrar-izq': 'entrar-izq 0.7s ease-out both',
        'entrar-der': 'entrar-der 0.7s ease-out both',
        subir: 'subir 0.6s ease-out both',
        flecha: 'flecha 1.4s ease-in-out infinite',
        brillo: 'brillo 6s linear infinite',
      },
    },
  },
  plugins: [],
}
