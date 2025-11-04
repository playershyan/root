/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      extend: {
        // Mobile-first breakpoints
        screens: {
          'xs': '375px',   // iPhone SE, small phones
          'sm': '640px',   // Tailwind default, keep for compatibility
          'md': '768px',   // Tablets
          'lg': '1024px',  // Desktop
          'xl': '1280px',  // Large desktop
          '2xl': '1536px', // Extra large
        },
        // Touch target spacing
        spacing: {
          'safe-top': 'env(safe-area-inset-top)',
          'safe-bottom': 'env(safe-area-inset-bottom)',
          'safe-left': 'env(safe-area-inset-left)',
          'safe-right': 'env(safe-area-inset-right)',
          'touch': '44px',          // iOS minimum
          'touch-android': '48px',  // Android minimum (recommended)
        },
        // Minimum touch target dimensions
        minHeight: {
          'touch': '44px',
          'touch-android': '48px',
          '12': '3rem',  // 48px for inputs
        },
        minWidth: {
          'touch': '44px',
          'touch-android': '48px',
        },
        // Mobile-optimized typography
        fontSize: {
          'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px - captions/badges only
          'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px - secondary text
          'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px - body (prevents zoom)
          'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
          'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
          '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
          '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        },
        // shadcn/ui color system
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
        keyframes: {
          "accordion-down": {
            from: { height: "0" },
            to: { height: "var(--radix-accordion-content-height)" },
          },
          "accordion-up": {
            from: { height: "var(--radix-accordion-content-height)" },
            to: { height: "0" },
          },
        },
        animation: {
          "accordion-down": "accordion-down 0.2s ease-out",
          "accordion-up": "accordion-up 0.2s ease-out",
        },
      },
    },
    plugins: [require("tailwindcss-animate")],
  }
