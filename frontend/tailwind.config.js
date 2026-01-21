/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        '44': '11rem',
      },
      colors: {
        primary: '#3d3d5c',
        secondary: '#4a5a7a',
        accent: '#d4af37',
        background: '#2a2a45',
        mystic: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#5d4a8a',
          800: '#4a3a70',
          900: '#3d3d5c'
        }
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'sans-serif'],
      },
      animation: {
        'flip': 'flip 0.6s ease-in-out',
        'shuffle': 'shuffle 0.3s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        shuffle: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px #d4af37, 0 0 10px #d4af37' },
          '50%': { boxShadow: '0 0 20px #d4af37, 0 0 30px #d4af37' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      backgroundImage: {
        'gradient-mystic': 'linear-gradient(135deg, #3d3d5c 0%, #4a5a7a 50%, #2a2a45 100%)',
        'gradient-gold': 'linear-gradient(135deg, #d4af37 0%, #f5d061 50%, #d4af37 100%)',
      }
    },
  },
  plugins: [],
}
