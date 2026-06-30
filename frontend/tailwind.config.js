/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        retro: {
          black: "#0A0A0A",
          white: "#F5F5F0",
          green: "#B5D317",
          "green-dark": "#8FA810",
          "green-light": "#CCEE33",
          gray: "#1A1A1A",
          "gray-mid": "#2A2A2A",
          "gray-light": "#3A3A3A",
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
        pulseGreen: {
          "0%, 100%": { boxShadow: "0 0 5px #B5D317" },
          "50%": {
            boxShadow: "0 0 20px #B5D317, 0 0 40px rgba(181,211,23,0.4)",
          },
        },
      },
      boxShadow: {
        retro: "4px 4px 0px #B5D317",
        "retro-sm": "2px 2px 0px #B5D317",
        "retro-lg": "6px 6px 0px #B5D317",
        neon: "0 0 10px #B5D317, 0 0 30px rgba(181,211,23,0.3)",
        "neon-sm": "0 0 5px #B5D317",
      },
    },
  },
  plugins: [],
};
