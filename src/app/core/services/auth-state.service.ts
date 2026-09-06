import { Injectable, signal } from '@angular/core';
import { User } from '../models/user';
import { TokenService } from './token-service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
 private readonly storageKey = 'loggedInUser';

  currentUser = signal<User | null>(
    this.getStoredUser()
  );

  private sessionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private tokenService: TokenService,
    private router: Router
  ) {}


  // ==========================================================
  // GET USER FROM LOCAL STORAGE
  // ==========================================================

  private getStoredUser(): User | null {

    const storedUser =
      localStorage.getItem(this.storageKey);

    if (!storedUser) {

      return null;

    }

    try {

      return JSON.parse(storedUser);

    } catch {

      localStorage.removeItem(this.storageKey);

      return null;

    }

  }


  // ==========================================================
  // LOGIN USER
  // ==========================================================

  setUser(user: User): void {

    this.currentUser.set(user);

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(user)
    );

    this.initializeSessionTimer();
  }

  // ==========================================================
  // SESSION TIMER (Absolute 30 Min JWT)
  // ==========================================================

  initializeSessionTimer(): void {
    this.clearSessionTimer();

    const expirationDate = this.tokenService.getExpiration();
    if (!expirationDate) return;

    const delay = expirationDate.getTime() - new Date().getTime();

    if (delay <= 0) {
      // Already expired
      this.logoutAndRedirect();
    } else {
      // Schedule exact absolute expiration
      this.sessionTimer = setTimeout(() => {
        this.logoutAndRedirect();
      }, delay);
    }
  }

  private clearSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  private logoutAndRedirect(): void {
    this.logout();
    this.router.navigate(['/login']);
  }


  // ==========================================================
  // GET CURRENT USER
  // ==========================================================

  getUser(): User | null {

    return this.currentUser();

  }


  // ==========================================================
  // CHECK LOGIN
  // ==========================================================

  isLoggedIn(): boolean {

    return this.currentUser() !== null;

  }


  // ==========================================================
  // LOGOUT
  // ==========================================================

  logout(): void {

    this.currentUser.set(null);

    localStorage.removeItem(
      this.storageKey
    );

    this.tokenService.removeToken();
    this.clearSessionTimer();
  }

}
