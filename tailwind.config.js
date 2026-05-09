/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Gradient custom colors for tech glassmorphism design
        gradient: {
          // Golden emerald gradient (yellow-400 to emerald-400)
          'gold-emerald': 'linear-gradient(135deg, #facc15 0%, #10b981 50%, #3b82f6 100%)',
          // Blue tech gradient (emerald-400 to blue-500)
          'emerald-blue': 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)',
          // Sunset gold gradient (yellow-400 to amber to orange)
          'sunset-gold': 'linear-gradient(135deg, #facc15 0%, #fb923c 50%, #f97316 100%)',
          // Ocean blue gradient (blue-500 to cyan)
          'ocean-blue': 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #0ea5e9 100%)',
          // Neon glow gradient
          'neon-tech': 'linear-gradient(135deg, #facc15 0%, #10b981 33%, #3b82f6 66%, #8b5cf6 100%)',
        }
      },
      backgroundImage: {
        'gradient-tech': 'linear-gradient(135deg, rgba(250, 204, 21, 0.1) 0%, rgba(16, 185, 129, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
      },
      borderRadius: {
        '2xl': 'var(--radius)',
        '3xl': 'calc(var(--radius) * 2)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)',
        'glass-lg': '0 12px 48px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(250, 204, 21, 0.3), 0 0 40px rgba(16, 185, 129, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
