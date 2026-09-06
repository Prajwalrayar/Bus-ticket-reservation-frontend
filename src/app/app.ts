import { Component, signal, OnInit } from '@angular/core';
import { ThemeService } from './core/services/theme.service';
import { AuthStateService } from './core/services/auth-state.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');

  constructor(
    private themeService: ThemeService,
    private authStateService: AuthStateService
  ) {}

  ngOnInit(): void {
    this.themeService.restoreTheme();
    
    // REQUIREMENT 1: Angular Application Restart must logout previous session
    if (!sessionStorage.getItem('appInitialized')) {
      // This is a fresh app load (new tab or explicit reload after closing).
      // Destroy any lingering local storage auth state to force re-login.
      this.authStateService.logout();
      sessionStorage.setItem('appInitialized', 'true');
    } else {
      // Valid continuation of existing session; restart the absolute 30-min timer
      if (this.authStateService.isLoggedIn()) {
        this.authStateService.initializeSessionTimer();
      }
    }
  }
}
