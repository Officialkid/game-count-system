// lib/theme.ts
export class ThemeManager {
  private static instance: ThemeManager;
  private isDark: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dark_mode');
      this.isDark = stored === 'true';
      this.applyTheme();
    }
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  private applyTheme() {
    if (typeof document !== 'undefined') {
      if (this.isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  toggle() {
    this.isDark = !this.isDark;
    if (typeof window !== 'undefined') {
      localStorage.setItem('dark_mode', this.isDark.toString());
    }
    this.applyTheme();
    return this.isDark;
  }

  isDarkMode(): boolean {
    return this.isDark;
  }

  setDarkMode(dark: boolean) {
    this.isDark = dark;
    if (typeof window !== 'undefined') {
      localStorage.setItem('dark_mode', dark.toString());
    }
    this.applyTheme();
  }
}

export const themeManager = typeof window !== 'undefined' ? ThemeManager.getInstance() : null;
