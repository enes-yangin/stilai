import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Quiet Luxury — krem/fildişi açık palet
        // (ink ölçeği yüzey tonlarıdır: 900 = sayfa zemini, yükseldikçe koyulaşır)
        ink: {
          900: "#f5f5f1", // Primary — sayfa zemini (krem)
          850: "#ffffff", // en açık yüzey
          800: "#f9f9f7", // Secondary — kart
          700: "#eaeae3", // Tertiary — yüzey
          600: "#e0ded4", // kenarlık / hover
        },
        // Neutral charcoal — birincil eylem + vurgu
        accent: {
          DEFAULT: "#2c2c2b",
          soft: "#57534e",
          deep: "#1a1a18",
        },
        // Sıcak metin tonları
        paper: {
          ink: "#1c1b1b", // başlık
          body: "#3a3833", // gövde
          muted: "#7a766d", // ikincil
          faint: "#a8a49a", // ipucu
        },
      },
      fontFamily: {
        sans: ["var(--font-hanken)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-bodoni)", "ui-serif", "Georgia", "serif"],
      },
      // Editöryel keskin köşeler (full hariç)
      borderRadius: {
        none: "0",
        sm: "0",
        DEFAULT: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        "3xl": "0",
        full: "9999px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.3), 0 20px 50px -20px rgba(0,0,0,0.6)",
        glow: "0 8px 32px -10px rgba(225,193,159,0.30)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
