export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'tasker_theme_mode';

export class ThemeService {
  private static listeners: Array<(theme: ThemeMode) => void> = [];

  /**
   * Retrieves the current active theme, defaulting to 'dark'.
   */
  static getTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'dark';
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // localStorage may fail in restricted iframes
    }
    return 'dark';
  }

  /**
   * Applies the theme to the root HTML document element.
   */
  static applyTheme(theme: ThemeMode): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }

  /**
   * Sets and persists the theme mode.
   */
  static setTheme(theme: ThemeMode): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
    this.applyTheme(theme);
    this.notify(theme);
  }

  /**
   * Toggles between dark and light modes.
   */
  static toggleTheme(): ThemeMode {
    const current = this.getTheme();
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  /**
   * Initializes the theme on application load.
   */
  static initTheme(): ThemeMode {
    const theme = this.getTheme();
    this.applyTheme(theme);
    return theme;
  }

  /**
   * Subscribes a listener to theme changes.
   */
  static subscribe(listener: (theme: ThemeMode) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notify(theme: ThemeMode): void {
    this.listeners.forEach(l => {
      try {
        l(theme);
      } catch (err) {
        console.error('Theme listener error:', err);
      }
    });
  }
}
