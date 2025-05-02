
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Minesweeper specific colors
				minesweeper: {
					'primary': '#9b87f5',
					'secondary': '#7E69AB',
					'tertiary': '#6E59A5',
					'dark': '#1A1F2C',
					'light': '#F6F6F7',
					'number-1': '#2196F3',  // Blue
					'number-2': '#4CAF50',  // Green
					'number-3': '#F44336',  // Red
					'number-4': '#673AB7',  // Dark Purple
					'number-5': '#795548',  // Brown
					'number-6': '#00BCD4',  // Teal
					'number-7': '#000000',  // Black
					'number-8': '#9E9E9E',  // Grey
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0'
					},
					'100%': {
						opacity: '1'
					}
				},
				'fade-out': {
					'0%': {
						opacity: '1'
					},
					'100%': {
						opacity: '0'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'scale-out': {
					from: { transform: 'scale(1)', opacity: '1' },
					to: { transform: 'scale(0.95)', opacity: '0' }
				},
				'bounce-small': {
					'0%, 100%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-10%)'
					}
				},
				'reveal-tile': {
					'0%': {
						transform: 'rotateY(0deg)',
						backgroundColor: 'var(--unrevealed-bg)'
					},
					'50%': {
						transform: 'rotateY(90deg)',
						backgroundColor: 'var(--unrevealed-bg)'
					},
					'51%': {
						backgroundColor: 'var(--revealed-bg)'
					},
					'100%': {
						transform: 'rotateY(0deg)',
						backgroundColor: 'var(--revealed-bg)'
					}
				},
				'explode': {
					'0%': {
						transform: 'scale(1)',
						opacity: '1'
					},
					'20%': {
						transform: 'scale(1.2)',
						opacity: '0.9'
					},
					'40%': {
						transform: 'scale(0.8)',
						opacity: '0.8'
					},
					'60%': {
						transform: 'scale(1.1)',
						opacity: '0.7'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-out': 'fade-out 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'scale-out': 'scale-out 0.2s ease-out',
				'bounce-small': 'bounce-small 0.5s ease infinite',
				'reveal-tile': 'reveal-tile 0.3s ease-out forwards',
				'explode': 'explode 0.5s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
