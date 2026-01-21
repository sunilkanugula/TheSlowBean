module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
   extend: {
  keyframes: {
    zoom: {
      "0%": { transform: "scale(0.9)" },
      "100%": { transform: "scale(1)" },
    },
  },
  animation: {
    zoom: "zoom 20s linear infinite",
  },
}

  },
  plugins: [],
};
