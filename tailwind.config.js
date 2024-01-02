/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/*.{html,js,css}",
    "./views/*.ejs",
  ],
  theme: {
    extend: {
      animation:{
        'like':'likeFrames 0.1s forwards'
      },
      keyframes: {
        likeFrames: {
          "0%": { transform: 'scale(1)' },
          "50%": { transform: 'scale(1.1)' },
          "100%": { transform: 'scale(1.2)' },
        }
      }
    },
  },
  plugins: [],
}

