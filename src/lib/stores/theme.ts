import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

// Initialize theme from localStorage or default to dark
const getInitialTheme = (): Theme => {
    if (!browser) return 'dark';

    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
        return stored;
    }

    // Optional: Check system preference
    // if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    // 	return 'light';
    // }

    return 'dark';
};

function createThemeStore() {
    const { subscribe, set, update } = writable<Theme>(getInitialTheme());

    return {
        subscribe,
        toggle: () => {
            update(current => {
                const newTheme = current === 'dark' ? 'light' : 'dark';

                // Persist to localStorage
                if (browser) {
                    localStorage.setItem('theme', newTheme);
                    // Apply to document
                    document.documentElement.setAttribute('data-theme', newTheme);
                }

                return newTheme;
            });
        },
        set: (theme: Theme) => {
            if (browser) {
                localStorage.setItem('theme', theme);
                document.documentElement.setAttribute('data-theme', theme);
            }
            set(theme);
        },
        // Initialize theme on app load
        init: () => {
            const theme = getInitialTheme();
            if (browser) {
                document.documentElement.setAttribute('data-theme', theme);
            }
            set(theme);
        }
    };
}

export const theme = createThemeStore();
