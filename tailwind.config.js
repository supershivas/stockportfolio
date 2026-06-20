/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#C0392B',
          hover:   '#9B2D22',
          fg:      '#ffffff',
        },
        sidebar: {
          bg:            '#1C1C1E',
          border:        'rgba(196,201,209,0.18)',
          selected:      'rgba(192,57,43,0.22)',
          'selected-fg': '#E8887E',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'sans-serif'],
        title: ['Playfair Display', 'Georgia', 'serif'],
        mono:  ['DM Mono', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '12px',
      },
    },
  },
  plugins: [],
}
