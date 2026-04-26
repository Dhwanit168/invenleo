/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Sora", "sans-serif"],
      },
      colors: {
        brand: {
          orange:       "#C4600A",
          "orange-hover": "#A05010",
          "orange-light": "#FFF0E4",
          "orange-border": "#F5C89A",
          blue:         "#185FA5",
          "blue-light": "#E6F1FB",
        },
        surface: "#F7F8FA",
        card:    "#FFFFFF",
        border:  {
          DEFAULT: "#E2E5EC",
          hover:   "#C8CCD6",
        },
        text: {
          primary:   "#1A1C28",
          secondary: "#5A5D6E",
          muted:     "#9CA0AE",
        },
        success: {
          bg:     "#EAF3DE",
          text:   "#27500A",
          border: "#C0DD97",
          dot:    "#639922",
        },
        error: {
          bg:     "#FCEBEB",
          text:   "#A32D2D",
          border: "#F7C1C1",
        },
        amber: {
          dot: "#EF9F27",
        },
      },
      borderRadius: {
        xl:  "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card:  "0 1px 4px 0 rgba(0,0,0,0.06)",
        focus: "0 0 0 3px rgba(196,96,10,0.18)",
      },
    },
  },
  plugins: [],
}
