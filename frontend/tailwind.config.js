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
        // Vaporwave Color Palette
        primary: '#0C0E23',
        secondary: '#1a1a3a',
        accent: '#FF4FBE',
        background: '#0C0E23',
        // Neon accents
        neon: {
          pink: '#FF4FBE',
          cyan: '#00F0FF',
          purple: '#9B5BFF',
          magenta: '#FF7AD9',
          orange: '#FF6A3D',
        },
        // Vaporwave gradients
        vapor: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#00F0FF',
          600: '#9B5BFF',
          700: '#FF4FBE',
          800: '#1a1a3a',
          900: '#0C0E23'
        },
        mystic: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#FF4FBE',
          600: '#9B5BFF',
          700: '#7c3aed',
          800: '#1a1a3a',
          900: '#0C0E23'
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
        'neon-pulse': 'neonPulse 2s ease-in-out infinite',
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
          '0%, 100%': { boxShadow: '0 0 5px #FF4FBE, 0 0 10px #FF4FBE' },
          '50%': { boxShadow: '0 0 20px #00F0FF, 0 0 30px #00F0FF' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        neonPulse: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(255, 79, 190, 0.45)' },
          '50%': { boxShadow: '0 0 25px rgba(0, 240, 255, 0.6)' },
        }
      },
      backgroundImage: {
        'gradient-mystic': 'linear-gradient(135deg, #0C0E23 0%, #1a1a3a 50%, #2a1a4a 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FF4FBE 0%, #9B5BFF 50%, #00F0FF 100%)',
        'gradient-vaporwave': 'linear-gradient(135deg, #FF4FBE 0%, #9B5BFF 50%, #00F0FF 100%)',
        'gradient-sunset': 'linear-gradient(180deg, #FF6A3D 0%, #FF4FBE 50%, #9B5BFF 100%)',
      },
      boxShadow: {
        'neon-pink': '0 0 12px rgba(255, 79, 190, 0.45)',
        'neon-cyan': '0 0 12px rgba(0, 240, 255, 0.45)',
        'neon-purple': '0 0 12px rgba(155, 91, 255, 0.45)',
      }
    },
  },
  plugins: [],
}
