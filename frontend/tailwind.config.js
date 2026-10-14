/** @type {import('tailwindcss').Config} */
// Warna palette diambil dari CSS variables (--retro-*) supaya bisa diganti
// runtime lewat modal "Template Colors" (lihat src/utils/themeUtils.js).
const retroVar = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        retro: {
          black: retroVar("--retro-black"),
          white: retroVar("--retro-white"),
          green: retroVar("--retro-green"),
          "green-dark": retroVar("--retro-green-dark"),
          "green-light": retroVar("--retro-green-light"),
          gray: retroVar("--retro-gray"),
          "gray-mid": retroVar("--retro-gray-mid"),
          "gray-light": retroVar("--retro-gray-light"),
          warn: retroVar("--retro-warn"),
        },
      },
      fontFamily: {
        retro: ['"Bebas Neue"', "Impact", "sans-serif"],
        sport: ['"Barlow Condensed"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      animation: {
        marquee: "marquee 25s linear infinite",
        blink: "blink 1s step-end infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "pulse-green": "pulseGreen 2s ease-in-out infinite",
        "bounce-slow": "bounce 2s infinite",
        "gear-spin": "gearSpin 3.6s linear infinite",
        "gear-spin-fast": "gearSpin 1.1s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(30px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        gearSpin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        pulseGreen: {
          "0%, 100%": {
            boxShadow: `0 0 5px rgb(var(--retro-green))`,
          },
          "50%": {
            boxShadow: `0 0 20px rgb(var(--retro-green)), 0 0 40px rgb(var(--retro-green) / 0.4)`,
          },
        },
      },
      boxShadow: {
        retro: "4px 4px 0px rgb(var(--retro-green))",
        "retro-sm": "2px 2px 0px rgb(var(--retro-green))",
        "retro-lg": "6px 6px 0px rgb(var(--retro-green))",
        neon: "0 0 10px rgb(var(--retro-green)), 0 0 30px rgb(var(--retro-green) / 0.3)",
        "neon-sm": "0 0 5px rgb(var(--retro-green))",
      },
    },
  },
  plugins: [],
};
