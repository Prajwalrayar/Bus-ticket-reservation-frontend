import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';

  // Reactive signal for components to bind to
  readonly currentTheme = signal<'light' | 'dark'>(this.getStoredTheme());

  private getStoredTheme(): 'light' | 'dark' {
    const stored = localStorage.getItem(this.THEME_KEY) as 'light' | 'dark' | null;
    return stored === 'dark' ? 'dark' : 'light'; // default to 'light'
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme();
  }

  setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(this.THEME_KEY, theme);
    this.currentTheme.set(theme);
    this.applyTheme(theme);
  }

  toggleTheme(): void {
    const next = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  restoreTheme(): void {
    this.applyTheme(this.getStoredTheme());
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }
}
