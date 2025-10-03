/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
    theme: {
    extend: {
      colors: {
        'dark-blue-bg': '#02050E',
        'dark-blue-card': '#0A1222',
        'dark-blue-border': '#3A4A60',
        'primary-text': '#F1F5F9',
        'secondary-text': '#C8D0DA', // Lighter gray-blue for better contrast
        'accent-gold': '#FBBF24',
        'bitcoin-orange': '#F59E0B',
        'cmd-primary-hud': '#10B981',
        'cmd-bitcoin-hub': '#F59E0B',
        'cmd-screens': '#1F2937',
        'cmd-hud-lines': '#34D399',
        'cmd-alerts': '#F59E0B',
        'hologram-cyan': '#0EA5E9',
        'glow-cyan': '#06B6D4',
        'space-black': '#020617',
        'scan-lines-blue': '#1E40AF',
      },
      fontFamily: {
        'title': ['Rajdhani', 'sans-serif'],
        'body': ['"Roboto Mono"', 'monospace'],
        'display': ['"Space Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;',
        'fade-in-out-subtle': 'fade-in-out-subtle 4s ease-in-out infinite;',
        'spin-slow': 'spin 6s linear infinite',
        'spin-reverse-slow': 'spin-reverse 8s linear infinite',
        'rotate-3d': 'rotate-3d 12s linear infinite',
        'pulse-core': 'pulse-core 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'node-pulse': 'node-pulse 2s ease-in-out infinite',
        'float-panel': 'float-panel 4s ease-in-out infinite',
        'slide-in-bottom': 'slide-in-bottom 0.5s ease-out forwards',
        'heat-pulse': 'heat-pulse 2s ease-in-out infinite',
        'sparks': 'sparks 0.5s linear infinite',
        'conveyor-belt': 'conveyor-belt 10s linear infinite',
        'conveyor-blocks': 'conveyor-blocks 10s linear infinite',
        'metal-cooling': 'metal-cooling 3s ease-out forwards',
        'gradient-pulse': 'gradient-pulse 10s ease-in-out infinite',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'fade-in-out-subtle': {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        'rotate-3d': {
          '0%': { transform: 'rotateY(0deg) rotateX(0deg)' },
          '25%': { transform: 'rotateY(90deg) rotateX(10deg)' },
          '50%': { transform: 'rotateY(180deg) rotateX(0deg)' },
          '75%': { transform: 'rotateY(270deg) rotateX(-10deg)' },
          '100%': { transform: 'rotateY(360deg) rotateX(0deg)' },
        },
        'pulse-core': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        'node-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.7' },
        },
        'float-panel': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-in-bottom': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'heat-pulse': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        'sparks': {
          '0%': { transform: 'translateY(0) scale(0)', opacity: '1' },
          '100%': { transform: 'translateY(-50px) scale(1)', opacity: '0' },
        },
        'conveyor-belt': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 0' },
        },
        'conveyor-blocks': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'metal-cooling': {
          '0%': { background: 'rgba(255, 255, 255, 0.5)' },
          '100%': { background: 'transparent' },
        },
        'gradient-pulse': {
          '0%, 100%': { backgroundSize: '100% 100%', backgroundPosition: '0% 0%' },
          '50%': { backgroundSize: '120% 120%', backgroundPosition: '50% 50%' },
        },
      },
      backdropFilter: {
        none: 'none',
        blur: 'blur(20px)',
      },
    },
  },
  plugins: [
    function ({ addUtilities, theme }) {
      const newUtilities = {
        '.text-glow-green': {
          'text-shadow': '0 0 8px rgba(52, 211, 153, 0.4), 0 0 20px rgba(52, 211, 153, 0.2)',
        },
        '.text-glow-cyan': {
          'text-shadow': '0 0 8px rgba(34, 211, 238, 0.4), 0 0 20px rgba(34, 211, 238, 0.2)',
        },
        '.text-glow-white': {
          'text-shadow': '0 0 8px rgba(241, 245, 249, 0.3), 0 0 20px rgba(241, 245, 249, 0.1)',
        },
        '.text-glow-accent-gold': {
          'text-shadow': '0 0 8px rgba(251, 191, 36, 0.5), 0 0 20px rgba(251, 191, 36, 0.2)',
        },
        '.text-glow-accent-gold-sm': {
          'text-shadow': '0 0 5px rgba(251, 191, 36, 0.6), 0 0 10px rgba(251, 191, 36, 0.3)',
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    }
  ],
}