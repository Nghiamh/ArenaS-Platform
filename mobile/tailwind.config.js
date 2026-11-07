/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./global.css"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                appBg: "rgb(var(--app-bg) / <alpha-value>)",
                appSurface: "rgb(var(--app-surface) / <alpha-value>)",
                appText: "rgb(var(--app-text) / <alpha-value>)",
                appPrimary: "rgb(var(--app-primary) / <alpha-value>)",
                appAccent: "rgb(var(--app-accent) / <alpha-value>)",
            },
            borderRadius: {
                xl: "1rem",
                "2xl": "1.5rem",
            },
            spacing: {
                18: "4.5rem",
                22: "5.5rem",
            },
        },
    },
    plugins: [],
};
